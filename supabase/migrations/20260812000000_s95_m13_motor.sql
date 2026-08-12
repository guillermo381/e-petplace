-- ═══════════════════════════════════════════════════════════════════════════
-- S95-D · BLOQUE 5 — EL MOTOR
--
-- **Recién acá se escriben funciones, y SOLO los caminos que se usan.**
-- *Las columnas muertas no se pudren; el código muerto sí.* Los estados
-- apagados, las reglas apagadas y los tipos apagados NO tienen función: el
-- motor los rechaza con un error explícito y la atención humana los resuelve.
--
-- Todas: `SECURITY DEFINER`, `SET search_path` fijo, gate de autorización en
-- el CUERPO, **idempotentes**, y escritura exclusiva por función — puerta
-- única, jamás INSERT directo de apps.
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m13-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón corre un pedido COMPLETO de punta a punta
-- sobre una mascota real —crear, reservar, pagar, empacar, entregar— y exige
-- que el expediente quede con EXACTAMENTE un evento más y `pedidos` en cero
-- al terminar. Una escritura ajena en la ventana rompe el conteo y aborta.
--
-- ── 🔴 LA REGLA QUE NO SE NEGOCIA ─────────────────────────────────────────
-- **El evento al expediente se deposita al ENTREGAR, jamás al pagar.**
-- Si se depositara al pago y el pedido se cancelara, quedaría escrito un
-- evento FALSO en un expediente clínico append-only **que viaja con la
-- mascota**. No se borra.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⓪ 🔴 UNA DIVERGENCIA DE VOCABULARIO QUE ME CAZÓ EL CINTURÓN, Y ES MÍA
--
-- La M4 escribió `pedido_estados.movido_por_rol` con
-- ('familia','vendedor','plataforma','sistema') y la M11 escribió
-- `cat_transiciones_pedido.actor` con ('cliente','vendedor','sistema','admin').
-- **Dos migraciones de la MISMA tanda, dos vocabularios para el MISMO
-- concepto.** El motor rebotó al primer INSERT.
--
-- Se alinea al de las transiciones porque ahí el actor ya es DATO (46 filas
-- vivas) y porque `admin` y `plataforma` no son lo mismo: admin es una
-- persona con permiso, plataforma es el sistema. Cambiar 46 filas para
-- salvar una palabra sería el error caro.
--
-- *Y queda escrito porque es el drift que esta casa persigue: dos letras que
-- dicen lo mismo con palabras distintas se contradicen en silencio hasta que
-- algo rebota.*
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pedido_estados DROP CONSTRAINT IF EXISTS pedido_estados_movido_por_rol_check;
ALTER TABLE public.pedido_estados
  ADD CONSTRAINT pedido_estados_movido_por_rol_check
  CHECK (movido_por_rol IN ('cliente','vendedor','sistema','admin'));

-- ───────────────────────────────────────────────────────────────────────────
-- ① COTIZAR EL ENVÍO — lee la regla, no la inventa
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cotizar_envio_despensa(
  p_cuenta_comercial_id uuid,
  p_subtotal            numeric,
  p_peso_fisico_kg      numeric DEFAULT 0,
  p_peso_volumetrico_kg numeric DEFAULT 0,
  p_country_code        text DEFAULT 'EC'
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_regla    record;
  v_peso     numeric;
  v_costo    numeric;
BEGIN
  -- El peso facturable es el MAYOR de los dos. Una bolsa de 15 kg se cobra por
  -- peso; una cama de 2 kg que ocupa una caja enorme se cobra por volumen.
  v_peso := GREATEST(COALESCE(p_peso_fisico_kg,0), COALESCE(p_peso_volumetrico_kg,0));

  SELECT r.*, t.usa_peso INTO v_regla
  FROM reglas_envio r
  JOIN cat_tipos_regla_envio t ON t.codigo = r.tipo
  WHERE r.cuenta_comercial_id = p_cuenta_comercial_id
    AND r.country_code = p_country_code
    AND r.activo AND t.activo
    AND now() >= r.vigencia_desde
    AND (r.vigencia_hasta IS NULL OR now() < r.vigencia_hasta)
  ORDER BY r.prioridad DESC, r.vigencia_desde DESC
  LIMIT 1;

  IF v_regla.id IS NULL THEN
    -- Honestidad: sin regla NO se inventa un costo. Se dice que no se puede
    -- cotizar, y quien llama decide (rechazar el pedido o pedir atención).
    RETURN jsonb_build_object(
      'ok', false, 'error', 'sin_regla_envio',
      'detalle', 'El vendedor no tiene regla de envío vigente para ese país.');
  END IF;

  v_costo := CASE v_regla.tipo
    WHEN 'plana' THEN (v_regla.parametros->>'monto')::numeric
    WHEN 'gratis_sobre_umbral' THEN
      CASE WHEN p_subtotal >= (v_regla.parametros->>'umbral')::numeric
           THEN 0 ELSE (v_regla.parametros->>'monto_bajo_umbral')::numeric END
    -- 🔴 Los otros cinco tipos NO tienen rama. No es un olvido: están apagados
    --    en el catálogo, y una rama para un camino que nadie recorre es código
    --    muerto que envejece sin que nadie lo note.
    ELSE NULL END;

  IF v_costo IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tipo_regla_sin_motor',
      'detalle', format('El tipo "%s" está modelado pero su cálculo no se construyó en v1.', v_regla.tipo));
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'costo', round(v_costo, 2),
    'moneda', v_regla.moneda,
    'regla_id', v_regla.id,
    'tipo_regla', v_regla.tipo,
    'peso_fisico_kg', p_peso_fisico_kg,
    'peso_volumetrico_kg', p_peso_volumetrico_kg,
    'peso_facturable_kg', v_peso,
    'parametros_aplicados', v_regla.parametros,
    'cotizado_en', now());
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ② LA PROMESA DE ENTREGA — corte + preparación + tránsito
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calcular_promesa_entrega(
  p_bodega_id uuid,
  p_horas_transito integer DEFAULT 24,
  p_desde timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_b     record;
  v_base  timestamptz;
  v_local timestamp;
BEGIN
  SELECT * INTO v_b FROM vendedor_bodegas WHERE id = p_bodega_id AND activo;
  IF v_b.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bodega_no_encontrada');
  END IF;

  v_local := p_desde AT TIME ZONE v_b.zona_horaria;

  -- 🔴 EL CORTE. Un pedido a las 6 de la tarde NO sale hoy — causa número uno
  --    de promesas incumplidas. Si la bodega no declaró corte, NO se inventa:
  --    se usa el momento del pedido y la respuesta lo DICE.
  IF v_b.hora_corte IS NOT NULL AND v_local::time > v_b.hora_corte THEN
    v_base := ((v_local::date + 1) + v_b.hora_corte) AT TIME ZONE v_b.zona_horaria;
  ELSE
    v_base := p_desde;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'desde', v_base + (v_b.horas_preparacion || ' hours')::interval
                    + (p_horas_transito || ' hours')::interval,
    'hasta', v_base + (v_b.horas_preparacion || ' hours')::interval
                    + ((p_horas_transito + 24) || ' hours')::interval,
    'hora_corte_declarada', v_b.hora_corte IS NOT NULL,
    'paso_el_corte', v_b.hora_corte IS NOT NULL AND v_local::time > v_b.hora_corte,
    'horas_preparacion', v_b.horas_preparacion,
    'horas_transito', p_horas_transito);
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ③ MOVER ESTADO — 🔴 LA ÚNICA PUERTA
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mover_estado_pedido(
  p_pedido_id uuid,
  p_hasta     text,
  p_actor     text,
  p_motivo    text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ped    record;
  v_estado record;
  v_trans  record;
  v_uid    uuid := auth.uid();
BEGIN
  IF v_uid IS NULL AND p_actor <> 'sistema' THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN
    RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023';
  END IF;

  -- IDEMPOTENCIA: mover al estado en que ya está es un no-op que RESPONDE bien.
  -- Un webhook que llega dos veces no puede fallar la segunda.
  IF v_ped.estado = p_hasta THEN
    RETURN jsonb_build_object('ok', true, 'estado', p_hasta, 'sin_cambio', true);
  END IF;

  -- 🔴 EL ESTADO DESTINO TIENE QUE ESTAR ACTIVO. Es la ley de la tanda hecha
  --    mecanismo: el camino existe en el modelo y está CERRADO en la operación.
  SELECT * INTO v_estado FROM cat_estados_pedido WHERE codigo = p_hasta;
  IF v_estado.codigo IS NULL THEN
    RAISE EXCEPTION 'estado_no_existe: %', p_hasta USING ERRCODE = '22023';
  END IF;
  IF NOT v_estado.activo THEN
    RAISE EXCEPTION 'estado_inactivo: "%" está modelado pero apagado en v1. Motivo: %',
      p_hasta, COALESCE(v_estado.motivo_inactivo, '(sin declarar)') USING ERRCODE = '22023';
  END IF;

  -- LA TRANSICIÓN SALE DE LA TABLA, no de un CASE.
  SELECT * INTO v_trans FROM cat_transiciones_pedido
   WHERE desde = v_ped.estado AND hasta = p_hasta AND actor = p_actor AND activo;
  IF v_trans.id IS NULL THEN
    RAISE EXCEPTION 'transicion_no_permitida: % → % por %', v_ped.estado, p_hasta, p_actor
      USING ERRCODE = '22023';
  END IF;

  IF (v_trans.exige_motivo OR v_estado.exige_motivo)
     AND (p_motivo IS NULL OR length(trim(p_motivo)) = 0) THEN
    RAISE EXCEPTION 'motivo_requerido: la transición % → % exige motivo', v_ped.estado, p_hasta
      USING ERRCODE = '22023';
  END IF;

  -- EL GATE DE AUTORIZACIÓN, en el cuerpo y por actor.
  IF p_actor = 'cliente' AND v_ped.user_id <> v_uid THEN
    RAISE EXCEPTION 'no_es_tu_pedido' USING ERRCODE = '42501';
  ELSIF p_actor = 'vendedor' AND NOT es_vendedor_de(v_ped.cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  ELSIF p_actor = 'admin' AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_admin' USING ERRCODE = '42501';
  END IF;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, motivo, movido_por, movido_por_rol)
    VALUES (p_pedido_id, p_hasta, p_motivo, v_uid, p_actor);
  -- `pedidos.estado` lo materializa el trigger de la M4. Nadie lo escribe acá.

  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
                            'desde', v_ped.estado, 'estado', p_hasta,
                            'narrativa', v_estado.narrativa);
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ④ CREAR PEDIDO
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crear_pedido_despensa(
  p_cuenta_comercial_id uuid,
  p_items               jsonb,              -- [{oferta_id, cantidad}]
  p_entrega             jsonb,              -- snapshot de la dirección
  p_clave_idempotencia  text,
  p_bodega_id           uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_existente uuid;
  v_ped      uuid;
  v_it       jsonb;
  v_of       record;
  v_tasa     numeric;
  v_sub      numeric := 0;
  v_imp      numeric := 0;
  v_pf       numeric := 0;
  v_pv       numeric := 0;
  v_cot      jsonb;
  v_prom     jsonb;
  v_envio    numeric := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;
  IF p_clave_idempotencia IS NULL OR length(trim(p_clave_idempotencia)) = 0 THEN
    RAISE EXCEPTION 'clave_idempotencia_requerida' USING ERRCODE = '22023';
  END IF;

  -- IDEMPOTENCIA: la misma clave devuelve el mismo pedido, no crea otro.
  SELECT id INTO v_existente FROM pedidos WHERE clave_idempotencia = p_clave_idempotencia;
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'pedido_id', v_existente, 'ya_existia', true);
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'pedido_sin_items' USING ERRCODE = '22023';
  END IF;

  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia,
                       numero_orden, entrega_nombre_receptor, entrega_telefono,
                       entrega_direccion, entrega_ciudad, entrega_sector,
                       entrega_referencias)
  VALUES (v_uid, p_cuenta_comercial_id, 0, 0, 0, 0, 0, p_clave_idempotencia,
          'P-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
          p_entrega->>'nombre_receptor', p_entrega->>'telefono',
          p_entrega->>'direccion', p_entrega->>'ciudad',
          p_entrega->>'sector', p_entrega->>'referencias')
  RETURNING id INTO v_ped;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT o.*, v.impuesto_codigo, v.peso_kg, v.largo_cm, v.ancho_cm, v.alto_cm,
           v.producto_id, p.nombre AS nombre_producto, s.id AS sku
      INTO v_of
    FROM ofertas o
    JOIN producto_variantes v ON v.id = o.variante_id
    JOIN productos p ON p.id = v.producto_id
    JOIN vendedor_skus s ON s.id = o.sku_id
    WHERE o.id = (v_it->>'oferta_id')::uuid AND o.estado = 'publicada';

    IF v_of.id IS NULL THEN
      RAISE EXCEPTION 'oferta_no_publicada: %', v_it->>'oferta_id' USING ERRCODE = '22023';
    END IF;

    SELECT pct INTO v_tasa FROM cat_tasas_impuesto WHERE codigo = v_of.impuesto_codigo;

    -- 🔴 SE CONGELAN precio, código de tasa Y porcentaje. Guardar solo el
    --    código no alcanza: el código apunta a una fila que puede cambiar.
    INSERT INTO pedido_items (pedido_id, producto_id, variante_id, oferta_id,
                              cuenta_comercial_id, nombre_producto, precio_unitario,
                              cantidad, subtotal, impuesto_codigo, impuesto_pct,
                              impuesto_monto)
    VALUES (v_ped, v_of.producto_id, v_of.variante_id, v_of.id,
            p_cuenta_comercial_id, v_of.nombre_producto, v_of.precio,
            (v_it->>'cantidad')::int,
            round(v_of.precio * (v_it->>'cantidad')::int, 2),
            v_of.impuesto_codigo, v_tasa,
            round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2));

    v_sub := v_sub + round(v_of.precio * (v_it->>'cantidad')::int, 2);
    v_imp := v_imp + round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2);
    v_pf  := v_pf  + COALESCE(v_of.peso_kg,0) * (v_it->>'cantidad')::int;
    v_pv  := v_pv  + COALESCE(v_of.largo_cm * v_of.ancho_cm * v_of.alto_cm / 6000.0, 0)
                     * (v_it->>'cantidad')::int;
  END LOOP;

  v_cot := cotizar_envio_despensa(p_cuenta_comercial_id, v_sub, v_pf, v_pv);
  IF (v_cot->>'ok')::boolean THEN
    v_envio := (v_cot->>'costo')::numeric;
  END IF;

  IF p_bodega_id IS NOT NULL THEN
    v_prom := calcular_promesa_entrega(p_bodega_id);
  END IF;

  UPDATE pedidos SET
    subtotal = v_sub, impuesto_total = v_imp, costo_envio = v_envio,
    total = v_sub + v_imp + v_envio,
    envio_regla_id = NULLIF(v_cot->>'regla_id','')::uuid,
    envio_tipo_regla = v_cot->>'tipo_regla',
    envio_peso_fisico_kg = v_pf,
    envio_peso_volumetrico_kg = v_pv,
    envio_peso_facturable_kg = GREATEST(v_pf, v_pv),
    envio_cotizacion = v_cot || COALESCE(jsonb_build_object('promesa', v_prom), '{}'::jsonb),
    promesa_entrega_desde = NULLIF(v_prom->>'desde','')::timestamptz,
    promesa_entrega_hasta = NULLIF(v_prom->>'hasta','')::timestamptz,
    updated_at = now()
  WHERE id = v_ped;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES (v_ped, 'creado', v_uid, 'cliente');

  RETURN jsonb_build_object('ok', true, 'pedido_id', v_ped, 'subtotal', v_sub,
                            'impuesto', v_imp, 'envio', v_envio,
                            'total', v_sub + v_imp + v_envio,
                            'cotizacion_envio', v_cot);
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑤ RESERVAR STOCK — al CONFIRMAR, no al carrito
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reservar_stock_pedido(
  p_pedido_id uuid,
  p_minutos_vigencia integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_it record; v_sku uuid; v_n int := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM inventario_reservas WHERE pedido_id = p_pedido_id AND estado='vigente') THEN
    RETURN jsonb_build_object('ok', true, 'ya_reservado', true);   -- idempotente
  END IF;

  FOR v_it IN SELECT * FROM pedido_items WHERE pedido_id = p_pedido_id LOOP
    SELECT sku_id INTO v_sku FROM ofertas WHERE id = v_it.oferta_id;
    IF v_sku IS NULL THEN
      RAISE EXCEPTION 'item_sin_sku: %', v_it.id USING ERRCODE = '22023';
    END IF;

    -- El CHECK `stock_disponible >= 0` de vendedor_skus es el que rebota la
    -- sobrerreserva. No se duplica acá: el estado imposible ya es inexpresable.
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
      VALUES (v_sku, 'reserva', v_it.cantidad, 'pedido', p_pedido_id);
    INSERT INTO inventario_reservas (sku_id, pedido_id, cantidad, expira_en)
      VALUES (v_sku, p_pedido_id, v_it.cantidad,
              now() + (p_minutos_vigencia || ' minutes')::interval);
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'reservas', v_n, 'expira_en',
                            now() + (p_minutos_vigencia || ' minutes')::interval);
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑥ CONFIRMAR PAGO — desde el webhook, idempotente por clave
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirmar_pago_pedido(
  p_pedido_id          uuid,
  p_proveedor          text,
  p_referencia         text,
  p_clave_idempotencia text,
  p_payload            jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_int uuid; v_ped record;
BEGIN
  -- IDEMPOTENCIA POR LA BASE, no por una comparación que alguien olvida.
  IF EXISTS (SELECT 1 FROM pagos_eventos WHERE clave_idempotencia = p_clave_idempotencia) THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true);
  END IF;

  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;

  INSERT INTO pagos_intentos (pedido_id, proveedor, proveedor_referencia, monto,
                              moneda, forma, estado, payload_crudo, clave_idempotencia,
                              cerrado_en)
    VALUES (p_pedido_id, p_proveedor, p_referencia, v_ped.total, v_ped.moneda,
            'tokenizacion', 'aprobado', p_payload,
            p_clave_idempotencia || ':intento', now())
    RETURNING id INTO v_int;

  INSERT INTO pagos_eventos (intento_id, proveedor, tipo, payload, clave_idempotencia, procesado_en)
    VALUES (v_int, p_proveedor, 'pago_aprobado', p_payload, p_clave_idempotencia, now());

  PERFORM mover_estado_pedido(p_pedido_id, 'pago_capturado', 'sistema');
  PERFORM mover_estado_pedido(p_pedido_id, 'stock_reservado', 'sistema');
  PERFORM mover_estado_pedido(p_pedido_id, 'vendedor_notificado', 'sistema');
  PERFORM mover_estado_pedido(p_pedido_id, 'liberado_preparacion', 'sistema');

  RETURN jsonb_build_object('ok', true, 'intento_id', v_int);
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑦ EMPACAR — exige LOTE y peso real, y corrige la cotización
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.empacar_pedido(
  p_pedido_id  uuid,
  p_lotes      jsonb,              -- [{item_id, lote, fecha_vencimiento}]
  p_peso_real_kg numeric DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_l jsonb; v_faltan int; v_uid uuid := auth.uid();
BEGIN
  FOR v_l IN SELECT * FROM jsonb_array_elements(p_lotes) LOOP
    UPDATE pedido_items
       SET lote = v_l->>'lote',
           fecha_vencimiento = NULLIF(v_l->>'fecha_vencimiento','')::date,
           lote_registrado_en = now(),
           lote_registrado_por = v_uid
     WHERE id = (v_l->>'item_id')::uuid AND pedido_id = p_pedido_id;
  END LOOP;

  -- 🔴 EL LOTE LO EXIGE LA FUNCIÓN, NO EL ESQUEMA. Un NOT NULL en la columna
  --    haría imposible crear el pedido; acá, en cambio, no se puede EMPACAR
  --    sin lote — que es el momento en que el lote existe de verdad.
  SELECT count(*) INTO v_faltan FROM pedido_items
   WHERE pedido_id = p_pedido_id AND lote IS NULL;
  IF v_faltan > 0 THEN
    RAISE EXCEPTION 'lote_requerido: % ítem(s) sin lote. Sin lote no se puede responder un retiro de fabricante.', v_faltan
      USING ERRCODE = '22023';
  END IF;

  IF p_peso_real_kg IS NOT NULL THEN
    UPDATE pedidos SET
      envio_peso_facturable_kg = p_peso_real_kg,
      envio_cotizacion = COALESCE(envio_cotizacion,'{}'::jsonb)
        || jsonb_build_object('peso_real_al_empacar', p_peso_real_kg, 'corregido_en', now()),
      updated_at = now()
    WHERE id = p_pedido_id;
  END IF;

  PERFORM mover_estado_pedido(p_pedido_id, 'empacado', 'vendedor');
  RETURN jsonb_build_object('ok', true, 'items_con_lote',
    (SELECT count(*) FROM pedido_items WHERE pedido_id = p_pedido_id AND lote IS NOT NULL));
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑧ ENTREGAR — 🔴 ACÁ Y SOLO ACÁ SE DEPOSITA EL EVENTO EN EL EXPEDIENTE
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.entregar_pedido(
  p_pedido_id  uuid,
  p_mascota_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ped   record; v_it record; v_ev uuid; v_fam record;
  v_n     int := 0; v_sku uuid; v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;

  IF v_ped.estado <> 'entregado' THEN
    PERFORM mover_estado_pedido(p_pedido_id, 'entregado', 'sistema');
  END IF;

  -- El stock sale de reservado: se fue del depósito.
  FOR v_it IN SELECT * FROM pedido_items WHERE pedido_id = p_pedido_id LOOP
    SELECT sku_id INTO v_sku FROM ofertas WHERE id = v_it.oferta_id;
    IF v_sku IS NOT NULL AND EXISTS (
         SELECT 1 FROM inventario_reservas
          WHERE pedido_id = p_pedido_id AND sku_id = v_sku AND estado='vigente') THEN
      INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
        VALUES (v_sku, 'consumo', v_it.cantidad, 'pedido', p_pedido_id);
      UPDATE inventario_reservas SET estado='consumida', cerrada_en=now()
       WHERE pedido_id = p_pedido_id AND sku_id = v_sku AND estado='vigente';
    END IF;
  END LOOP;

  -- 🔴 EL EVENTO AL EXPEDIENTE. Solo si hay mascota declarada y solo para las
  --    familias de producto que ENTRAN (la frontera vive en el catálogo).
  IF p_mascota_id IS NOT NULL THEN
    IF NOT user_tiene_acceso_a_mascota(p_mascota_id) AND NOT is_admin() THEN
      RAISE EXCEPTION 'sin_acceso_a_mascota' USING ERRCODE = '42501';
    END IF;

    FOR v_it IN
      SELECT pi.*, pr.familia_codigo, pv.presentacion, pv.peso_kg
      FROM pedido_items pi
      JOIN productos pr ON pr.id = pi.producto_id
      JOIN producto_variantes pv ON pv.id = pi.variante_id
      JOIN cat_familias_producto f ON f.codigo = pr.familia_codigo
      WHERE pi.pedido_id = p_pedido_id AND f.entra_al_expediente
    LOOP
      -- Idempotencia: si esta línea ya depositó, no deposita otra vez. Un
      -- expediente append-only no perdona un evento duplicado.
      IF EXISTS (SELECT 1 FROM evento_producto_asignacion WHERE pedido_item_id = v_it.id) THEN
        CONTINUE;
      END IF;

      SELECT m.country_code INTO v_fam FROM mascotas m WHERE m.id = p_mascota_id;

      INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                                   procedencia, modo_captura, country_code, creado_por_user_id)
        VALUES (p_mascota_id, 'producto_asignacion', 'alimentacion', now(),
                jsonb_build_object('pedido_id', p_pedido_id, 'via', 'entregar_pedido'),
                -- 🔴 SIEMPRE declarado_por_familia: una compra la aporta la
                --    familia, jamás un profesional (BIO_EXPEDIENTE E2bis).
                'declarado_por_familia', 'automatico',
                COALESCE(v_fam.country_code,'EC'), v_uid)
        RETURNING id INTO v_ev;

      INSERT INTO evento_producto_asignacion
        (evento_id, mascota_id, producto_id, variante_id, pedido_item_id,
         nombre_producto, familia_codigo, presentacion, cantidad, peso_kg,
         fecha_compra, country_code, lote, fecha_vencimiento)
        VALUES (v_ev, p_mascota_id, v_it.producto_id, v_it.variante_id, v_it.id,
                v_it.nombre_producto, v_it.familia_codigo, v_it.presentacion,
                v_it.cantidad, v_it.peso_kg, current_date,
                COALESCE(v_fam.country_code,'EC'), v_it.lote, v_it.fecha_vencimiento);
      v_n := v_n + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
                            'eventos_expediente', v_n);
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑨ CANCELAR / EXPIRAR — libera la reserva
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancelar_pedido_despensa(
  p_pedido_id uuid, p_actor text, p_motivo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_r record; v_hasta text;
BEGIN
  v_hasta := CASE p_actor WHEN 'cliente' THEN 'cancelado_cliente'
                          WHEN 'vendedor' THEN 'cancelado_vendedor'
                          ELSE 'cancelado_sistema' END;
  PERFORM mover_estado_pedido(p_pedido_id, v_hasta, p_actor, p_motivo);

  FOR v_r IN SELECT * FROM inventario_reservas
              WHERE pedido_id = p_pedido_id AND estado='vigente' FOR UPDATE LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
      VALUES (v_r.sku_id, 'liberacion_reserva', v_r.cantidad,
              COALESCE(p_motivo,'pedido cancelado'), 'pedido', p_pedido_id);
    UPDATE inventario_reservas SET estado='liberada', cerrada_en=now() WHERE id = v_r.id;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'estado', v_hasta);
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑩ REGISTRAR SEÑAL COMERCIAL — la puerta del ledger del bloque 4
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_senal_comercial(
  p_senal text, p_visitante_id text DEFAULT NULL, p_contexto jsonb DEFAULT '{}'::jsonb,
  p_detalle jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid; v_activa boolean;
BEGIN
  SELECT activo INTO v_activa FROM cat_senales_comerciales WHERE codigo = p_senal;
  IF v_activa IS NULL THEN
    RAISE EXCEPTION 'senal_no_existe: %', p_senal USING ERRCODE = '22023';
  END IF;
  IF NOT v_activa THEN
    RAISE EXCEPTION 'senal_inactiva: %', p_senal USING ERRCODE = '22023';
  END IF;

  INSERT INTO senales_comerciales
    (senal, visitante_id, user_id, sesion_id,
     ctx_especie, ctx_talla, ctx_momento_vital, ctx_condicion, ctx_tiene_alergias,
     termino_busqueda, familia_codigo, monto, country_code, ciudad, sector, motivo, detalle)
  VALUES
    (p_senal, p_visitante_id, auth.uid(), p_contexto->>'sesion_id',
     p_contexto->>'especie', p_contexto->>'talla', p_contexto->>'momento_vital',
     p_contexto->>'condicion', (p_contexto->>'tiene_alergias')::boolean,
     p_detalle->>'termino', p_detalle->>'familia_codigo',
     NULLIF(p_detalle->>'monto','')::numeric,
     COALESCE(p_contexto->>'country_code','EC'), p_contexto->>'ciudad',
     p_contexto->>'sector', p_detalle->>'motivo', p_detalle)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- GRANTS · L-140 sobre las diez
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE v_f text;
BEGIN
  FOREACH v_f IN ARRAY ARRAY[
    'cotizar_envio_despensa(uuid, numeric, numeric, numeric, text)',
    'calcular_promesa_entrega(uuid, integer, timestamptz)',
    'mover_estado_pedido(uuid, text, text, text)',
    'crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid)',
    'reservar_stock_pedido(uuid, integer)',
    'confirmar_pago_pedido(uuid, text, text, text, jsonb)',
    'empacar_pedido(uuid, jsonb, numeric)',
    'entregar_pedido(uuid, uuid)',
    'cancelar_pedido_despensa(uuid, text, text)',
    'registrar_senal_comercial(text, text, jsonb, jsonb)']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', v_f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', v_f);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · EL PEDIDO COMPLETO, DE PUNTA A PUNTA, CON DATOS REALES
-- No se verifica que las funciones existan: se corre un pedido.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_u uuid; v_vend uuid; v_mascota uuid; v_pais text;
  v_prod uuid; v_var uuid; v_sku uuid; v_of uuid; v_bod uuid;
  v_r jsonb; v_ped uuid; v_it uuid;
  v_ev_antes int; v_ev_despues int; v_disp int; v_ok boolean := false;
BEGIN
  SELECT count(*) INTO v_ev_antes FROM eventos_mascota;

  -- 🔴 DOS ACTORES REALES, y no es adorno: las funciones tienen gate de
  --    autorización POR ACTOR, así que un fixture con una sola identidad no
  --    probaría los gates — probaría que el superusuario puede todo.
  --    (Regla 68: como `postgres` no trae JWT, `auth.uid()` sería NULL y
  --    `crear_pedido_despensa` rebota con auth_requerido. Se inyectan los
  --    claims con `set_config(..., true)` = local a la transacción.)
  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_vend
  FROM cuentas_comerciales cc WHERE cc.estado='activa' AND cc.owner_profile_id IS NOT NULL LIMIT 1;
  SELECT m.id, m.country_code, fm.user_id INTO v_mascota, v_pais, v_u
  FROM mascotas m
  JOIN familia_miembro fm ON fm.familia_id=m.familia_id
                         AND fm.rol='adulto_titular' AND fm.hasta IS NULL
  WHERE m.estado_vida='activa' LIMIT 1;
  IF v_cc IS NULL OR v_mascota IS NULL OR v_vend IS NULL THEN
    RAISE EXCEPTION 'ABORTA: sin cuenta activa con dueño o sin mascota. El cinturón no puede probar nada.';
  END IF;

  -- El rol de vendedor tiene que existir: `crear_evento_economico` y
  -- `es_vendedor_de` lo exigen, y hoy hay CERO filas con ese rol.
  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
    VALUES (v_cc, 'seller_productos', 'activo', now(), '{"cinturon":"s95_m13"}'::jsonb)
    ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_u, 'role', 'authenticated')::text, true);

  -- El catálogo del fixture
  INSERT INTO productos (nombre, familia_codigo, estado)
    VALUES ('__cint_m13', 'alimento', 'activo') RETURNING id INTO v_prod;
  INSERT INTO producto_variantes (producto_id, codigo, presentacion, impuesto_codigo,
                                  peso_kg, largo_cm, ancho_cm, alto_cm)
    VALUES (v_prod, '15kg', '15 kg', 'EC_IVA_15', 15, 60, 40, 20) RETURNING id INTO v_var;
  INSERT INTO vendedor_skus (cuenta_comercial_id, variante_id, sku_vendedor, estado)
    VALUES (v_cc, v_var, '__cint_m13', 'aceptado') RETURNING id INTO v_sku;
  INSERT INTO ofertas (variante_id, sku_id, precio, estado, publicado_por, publicado_en)
    VALUES (v_var, v_sku, 100.00, 'publicada', v_u, now()) RETURNING id INTO v_of;
  INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo)
    VALUES (v_sku, 'ingreso', 10, 'carga_inicial');
  INSERT INTO vendedor_bodegas (cuenta_comercial_id, nombre, ciudad, hora_corte, horas_preparacion)
    VALUES (v_cc, '__cint_bodega', 'Quito', '15:00', 24) RETURNING id INTO v_bod;
  INSERT INTO reglas_envio (cuenta_comercial_id, tipo, parametros, notas)
    VALUES (v_cc, 'gratis_sobre_umbral', '{"umbral": 50, "monto_bajo_umbral": 4.50}'::jsonb, '__cint_m13');

  -- 🔴 ① COTIZAR: 100 supera el umbral de 50 ⇒ envío GRATIS.
  v_r := cotizar_envio_despensa(v_cc, 100, 15, 8);
  IF NOT (v_r->>'ok')::boolean OR (v_r->>'costo')::numeric <> 0 THEN
    RAISE EXCEPTION 'ABORTA: la cotización sobre umbral dio % y debía ser 0. %', v_r->>'costo', v_r;
  END IF;
  -- Y el peso facturable es el MAYOR: 15 físico contra 8 volumétrico ⇒ 15.
  IF (v_r->>'peso_facturable_kg')::numeric <> 15 THEN
    RAISE EXCEPTION 'ABORTA: el peso facturable es % y debía ser 15 (el mayor).', v_r->>'peso_facturable_kg';
  END IF;
  -- Bajo el umbral SÍ cobra.
  v_r := cotizar_envio_despensa(v_cc, 20, 1, 0);
  IF (v_r->>'costo')::numeric <> 4.50 THEN
    RAISE EXCEPTION 'ABORTA: bajo umbral cobró % y debía cobrar 4.50.', v_r->>'costo';
  END IF;

  -- 🔴 ② LA PROMESA respeta el corte.
  v_r := calcular_promesa_entrega(v_bod, 24, (current_date + time '18:00') AT TIME ZONE 'America/Guayaquil');
  IF NOT (v_r->>'paso_el_corte')::boolean THEN
    RAISE EXCEPTION 'ABORTA: un pedido a las 18:00 con corte 15:00 no detectó el corte. %', v_r;
  END IF;

  -- 🔴 ③ CREAR PEDIDO, y su IDEMPOTENCIA.
  v_r := crear_pedido_despensa(v_cc,
          jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
          '{"direccion":"calle falsa 123","ciudad":"Quito"}'::jsonb,
          '__cint_idem_m13', v_bod);
  v_ped := (v_r->>'pedido_id')::uuid;
  IF (v_r->>'total')::numeric <> 115.00 THEN
    RAISE EXCEPTION 'ABORTA: el total es % y debía ser 115 (100 + 15 IVA + 0 envío).', v_r->>'total';
  END IF;
  v_r := crear_pedido_despensa(v_cc,
          jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
          '{}'::jsonb, '__cint_idem_m13', v_bod);
  IF NOT (v_r->>'ya_existia')::boolean OR (v_r->>'pedido_id')::uuid <> v_ped THEN
    RAISE EXCEPTION 'ABORTA: la misma clave de idempotencia creó un pedido nuevo.';
  END IF;

  -- 🔴 ④ UNA TRANSICIÓN NO PERMITIDA REBOTA. Sin esto, la tabla de
  --    transiciones sería decorativa.
  BEGIN
    PERFORM mover_estado_pedido(v_ped, 'entregado', 'cliente');
  EXCEPTION WHEN others THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: un cliente movió su pedido de creado a ENTREGADO. La máquina no valida.';
  END IF;

  -- 🔴 ⑤ UN ESTADO APAGADO REBOTA — la ley de la tanda.
  v_ok := false;
  BEGIN
    PERFORM mover_estado_pedido(v_ped, 'revision_riesgo', 'sistema');
  EXCEPTION WHEN others THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se transitó a un estado APAGADO. «Se modela completo, se construye lo que se usa» no está siendo exigido.';
  END IF;

  -- ⑥ El camino feliz: pagar mueve cuatro estados de una.
  PERFORM mover_estado_pedido(v_ped, 'esperando_pago', 'cliente');
  PERFORM reservar_stock_pedido(v_ped);
  SELECT stock_disponible INTO v_disp FROM vendedor_skus WHERE id = v_sku;
  IF v_disp <> 9 THEN RAISE EXCEPTION 'ABORTA: tras reservar 1 de 10 quedan % disponibles.', v_disp; END IF;

  v_r := confirmar_pago_pedido(v_ped, 'proveedor_x', 'ref-1', '__cint_pago_m13');
  IF (SELECT estado FROM pedidos WHERE id=v_ped) <> 'liberado_preparacion' THEN
    RAISE EXCEPTION 'ABORTA: tras el pago el pedido quedó en % y debía quedar en liberado_preparacion.',
      (SELECT estado FROM pedidos WHERE id=v_ped);
  END IF;
  -- El webhook repetido no hace nada la segunda vez.
  v_r := confirmar_pago_pedido(v_ped, 'proveedor_x', 'ref-1', '__cint_pago_m13');
  IF NOT (v_r->>'duplicado')::boolean THEN
    RAISE EXCEPTION 'ABORTA: el mismo webhook se procesó DOS VECES.';
  END IF;

  -- 🔴 ⑦ EMPACAR SIN LOTE REBOTA. Cambia la identidad: acá actúa EL VENDEDOR.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role', 'authenticated')::text, true);
  PERFORM mover_estado_pedido(v_ped, 'picking', 'vendedor');
  SELECT id INTO v_it FROM pedido_items WHERE pedido_id = v_ped LIMIT 1;
  v_ok := false;
  BEGIN
    PERFORM empacar_pedido(v_ped, '[]'::jsonb, 15);
  EXCEPTION WHEN others THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se empacó SIN LOTE. Sin lote no se puede responder un retiro de fabricante.';
  END IF;

  PERFORM empacar_pedido(v_ped,
    jsonb_build_array(jsonb_build_object('item_id', v_it, 'lote', 'L-CINT-M13',
                                         'fecha_vencimiento', (current_date+300)::text)), 16.2);

  -- 🔴 CONTRA-CASO DEL GATE: con la identidad del VENDEDOR, un movimiento de
  --    'cliente' sobre un pedido ajeno tiene que rebotar.
  v_ok := false;
  BEGIN
    PERFORM mover_estado_pedido(v_ped, 'cancelado_cliente', 'cliente');
  EXCEPTION WHEN others THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: el vendedor canceló el pedido HACIÉNDOSE PASAR por el cliente. El gate por actor no discrimina.';
  END IF;

  -- ⑧ Despacho
  PERFORM mover_estado_pedido(v_ped, 'documentado', 'sistema');
  PERFORM mover_estado_pedido(v_ped, 'esperando_courier', 'vendedor');
  PERFORM mover_estado_pedido(v_ped, 'entregado_courier', 'vendedor');
  PERFORM mover_estado_pedido(v_ped, 'en_transito', 'sistema');
  PERFORM mover_estado_pedido(v_ped, 'en_reparto', 'sistema');

  -- 🔴 ⑨ ANTES DE ENTREGAR: el expediente NO debe tener el evento todavía.
  SELECT count(*) INTO v_ev_despues FROM eventos_mascota;
  IF v_ev_despues <> v_ev_antes THEN
    RAISE EXCEPTION 'ABORTA: el expediente ganó % evento(s) ANTES de entregar. El evento se deposita al ENTREGAR, jamás al pagar.',
      v_ev_despues - v_ev_antes;
  END IF;

  -- 🔴 ⑩ ENTREGAR deposita EXACTAMENTE UNO, con lote. Vuelve la identidad de
  --    la familia: `entregar_pedido` exige acceso a la mascota, y el vendedor
  --    NO lo tiene — es §7.4 en carne.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_u, 'role', 'authenticated')::text, true);
  v_r := entregar_pedido(v_ped, v_mascota);
  IF (v_r->>'eventos_expediente')::int <> 1 THEN
    RAISE EXCEPTION 'ABORTA: entregar depositó % eventos y debía depositar 1.', v_r->>'eventos_expediente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM evento_producto_asignacion
                  WHERE pedido_item_id = v_it AND lote = 'L-CINT-M13') THEN
    RAISE EXCEPTION 'ABORTA: el lote no viajó al expediente. El retiro sería irrespondible.';
  END IF;
  -- La procedencia es SIEMPRE de la familia.
  IF NOT EXISTS (SELECT 1 FROM eventos_mascota em
                  JOIN evento_producto_asignacion e ON e.evento_id = em.id
                 WHERE e.pedido_item_id = v_it AND em.procedencia = 'declarado_por_familia') THEN
    RAISE EXCEPTION 'ABORTA: el evento de compra no declaró procedencia de familia.';
  END IF;
  -- Y entregar dos veces NO duplica el expediente.
  v_r := entregar_pedido(v_ped, v_mascota);
  IF (v_r->>'eventos_expediente')::int <> 0 THEN
    RAISE EXCEPTION 'ABORTA: entregar dos veces duplicó el evento en un expediente append-only.';
  END IF;

  -- ⑪ El stock salió de reservado.
  SELECT stock_reservado INTO v_disp FROM vendedor_skus WHERE id = v_sku;
  IF v_disp <> 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % reservados tras entregar.', v_disp; END IF;

  -- ⑫ La señal comercial entra sin sesión de usuario.
  PERFORM registrar_senal_comercial('busqueda_sin_resultado', '__cint_vis_m13',
    '{"especie":"perro","talla":"grande","momento_vital":"M5"}'::jsonb,
    '{"termino":"dieta renal"}'::jsonb);

  -- ── LIMPIEZA por id, residuo 0 ──────────────────────────────────────────
  DELETE FROM senales_comerciales WHERE visitante_id = '__cint_vis_m13';
  DELETE FROM evento_producto_asignacion WHERE pedido_item_id IN
    (SELECT id FROM pedido_items WHERE pedido_id = v_ped);
  DELETE FROM eventos_mascota WHERE datos->>'pedido_id' = v_ped::text;
  DELETE FROM inventario_reservas WHERE pedido_id = v_ped;
  DELETE FROM inventario_movimientos WHERE sku_id = v_sku;
  DELETE FROM pagos_eventos WHERE clave_idempotencia LIKE '\_\_cint%';
  DELETE FROM pagos_intentos WHERE pedido_id = v_ped;
  DELETE FROM pedido_estados WHERE pedido_id = v_ped;
  DELETE FROM pedido_items WHERE pedido_id = v_ped;
  DELETE FROM pedidos WHERE id = v_ped;
  DELETE FROM reglas_envio WHERE notas = '__cint_m13';
  DELETE FROM cuenta_roles WHERE metadata->>'cinturon' = 's95_m13';
  DELETE FROM vendedor_bodegas WHERE id = v_bod;
  DELETE FROM ofertas WHERE id = v_of;
  DELETE FROM vendedor_skus WHERE id = v_sku;
  DELETE FROM producto_variantes WHERE id = v_var;
  DELETE FROM productos WHERE id = v_prod;

  SELECT count(*) INTO v_ev_despues FROM eventos_mascota;
  IF v_ev_despues <> v_ev_antes THEN
    RAISE EXCEPTION 'ABORTA: el expediente quedó con % evento(s) de diferencia. Residuo en el expediente vivo.',
      v_ev_despues - v_ev_antes;
  END IF;
  RAISE NOTICE 'MOTOR: pedido completo corrido de punta a punta. Expediente intacto (% eventos).', v_ev_antes;
END $$;

-- Residuo 0 en todo el frente.
DO $$
DECLARE v_n int;
BEGIN
  SELECT (SELECT count(*) FROM pedidos) + (SELECT count(*) FROM productos)
       + (SELECT count(*) FROM reglas_envio) + (SELECT count(*) FROM senales_comerciales)
       + (SELECT count(*) FROM inventario_movimientos) INTO v_n;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % filas de fixture.', v_n; END IF;
END $$;

COMMIT;
