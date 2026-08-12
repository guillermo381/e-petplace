-- ═══════════════════════════════════════════════════════════════════════════
-- S95-G · EL MOTOR SE CIERRA
--
-- 🔴 EL HALLAZGO, MEDIDO POR EL CAMINO REAL Y NO DEDUCIDO LEYENDO. Las sondas
-- `scripts/s95/sonda-actor-sistema-s95g.mjs` y
-- `scripts/s95/sonda-superficie-motor-s95g.mjs` atacaron el pedido de OTRA
-- persona desde una sesión común, con la anon key que viaja en el bundle.
-- **CINCO puertas pasaron:**
--
--   · `confirmar_pago_pedido`      esperando_pago → liberado_preparacion
--   · `reservar_stock_pedido`      reservó stock ajeno
--   · `entregar_pedido`            en_reparto → entregado
--   · `cancelar_pedido_despensa`   con actor `sistema` → cancelado_sistema
--   · `mover_estado_pedido`        con actor `sistema` → pago_capturado
--
-- El brief señalaba una (el actor `sistema`). **Eran cinco**, y la peor no era
-- ésa: `confirmar_pago_pedido` marca un pedido como PAGADO sin que exista
-- ningún pago. Eso no es un permiso de más — es la puerta por la que se llevan
-- la mercadería.
--
-- ── EL DIAGNÓSTICO, EN UNA LÍNEA ──────────────────────────────────────────
-- Las diez funciones nacieron `SECURITY DEFINER` y concedidas a
-- `authenticated`, y **la autorización se puso solo donde el actor viajaba
-- como parámetro**. Donde el actor estaba implícito —el webhook, la reserva,
-- la entrega— no se puso nada. *La regla que faltaba no es «gatear el actor
-- sistema»: es que toda función alcanzable desde una sesión verifique quién
-- llama, sin excepción.*
--
-- ── EL DISEÑO: DOS ANILLOS ────────────────────────────────────────────────
-- ① **Anillo interno** — `_mover_estado_pedido()`: el cuerpo de siempre, con
--    los gates de cliente/vendedor/admin intactos, y **sin un solo GRANT a
--    `anon` ni a `authenticated`**. PostgREST no puede nombrarlo. Solo lo
--    alcanzan las funciones DEFINER del motor, que corren como su dueño.
-- ② **Anillo externo** — las funciones públicas, cada una con su gate en el
--    CUERPO. `mover_estado_pedido` rechaza el actor `sistema` con todas las
--    letras: *`sistema` no es un actor que alguien pueda invocar; es el motor
--    hablando consigo mismo.*
--
-- POR QUÉ DOS ANILLOS Y NO UNA BANDERA DE SESIÓN (la alternativa que se
-- descartó): un `set_config('epetplace.motor','on')` habría funcionado, pero
-- apoya la seguridad en que **ninguna función futura de `public` deje pasar un
-- `set_config` con argumento del llamador**. Es una condición sobre código que
-- todavía no existe. Un GRANT ausente, en cambio, no depende de la disciplina
-- de nadie: **la función no se puede nombrar.**
--
-- Reversa (escrita ANTES): scripts/s95/2026-08-12-s95g-REVERSA.sql
-- 🔴 Su advertencia: revertir REABRE los cinco agujeros. Con la despensa viva,
--    revertir es regalar productos.
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón crea pedidos de prueba, los ataca y los
-- borra por id, exigiendo residuo CERO y que `pedidos` vuelva a su conteo
-- inicial. Una escritura ajena en la ventana rompe el conteo y aborta.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① EL ANILLO INTERNO — el cuerpo de siempre, sin puerta al exterior
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._mover_estado_pedido(
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
  IF v_ped.estado = p_hasta THEN
    RETURN jsonb_build_object('ok', true, 'estado', p_hasta, 'sin_cambio', true);
  END IF;

  SELECT * INTO v_estado FROM cat_estados_pedido WHERE codigo = p_hasta;
  IF v_estado.codigo IS NULL THEN
    RAISE EXCEPTION 'estado_no_existe: %', p_hasta USING ERRCODE = '22023';
  END IF;
  IF NOT v_estado.activo THEN
    RAISE EXCEPTION 'estado_inactivo: "%" está modelado pero apagado en v1. Motivo: %',
      p_hasta, COALESCE(v_estado.motivo_inactivo, '(sin declarar)') USING ERRCODE = '22023';
  END IF;

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

  -- Los gates por actor SIGUEN ACÁ ADENTRO, y no es redundancia: los
  -- orquestadores le pasan `cliente` y `vendedor`, y esas ramas tienen que
  -- seguir verificando aunque la llamada venga de adentro del motor.
  IF p_actor = 'cliente' AND v_ped.user_id <> v_uid THEN
    RAISE EXCEPTION 'no_es_tu_pedido' USING ERRCODE = '42501';
  ELSIF p_actor = 'vendedor' AND NOT es_vendedor_de(v_ped.cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  ELSIF p_actor = 'admin' AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_admin' USING ERRCODE = '42501';
  END IF;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, motivo, movido_por, movido_por_rol)
    VALUES (p_pedido_id, p_hasta, p_motivo, v_uid, p_actor);

  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
                            'desde', v_ped.estado, 'estado', p_hasta,
                            'narrativa', v_estado.narrativa);
END $$;

COMMENT ON FUNCTION public._mover_estado_pedido(uuid, text, text, text) IS
  'ANILLO INTERNO del motor de pedidos. SIN GRANT a anon ni a authenticated: '
  'PostgREST no puede nombrarla. La alcanzan solo las funciones DEFINER del '
  'motor. El actor `sistema` vive acá y solo acá.';

-- 🔴 EL CANDADO. Aunque los default privileges de Supabase concedan de más,
--    acá se revoca explícito y el cinturón lo verifica por privilegio EFECTIVO
--    (L-216: un REVOKE que deja PUBLIC intacto no cierra nada).
REVOKE ALL ON FUNCTION public._mover_estado_pedido(uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ② EL ANILLO EXTERNO — la puerta pública rechaza `sistema`
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.mover_estado_pedido(
  p_pedido_id uuid,
  p_hasta     text,
  p_actor     text,
  p_motivo    text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  -- 🔴 EL GATE QUE FALTABA, y se dice sin rodeos: `sistema` NO es un actor
  --    que alguien pueda invocar. Es el motor hablando consigo mismo — el
  --    webhook que confirma un pago, el cron que expira una reserva. Una
  --    persona que se declara «sistema» está mintiendo sobre quién es.
  IF p_actor = 'sistema' THEN
    RAISE EXCEPTION
      'actor_sistema_no_invocable: «sistema» no es un actor que se pueda declarar desde afuera; lo usa el motor por dentro'
      USING ERRCODE = '42501';
  END IF;
  IF p_actor NOT IN ('cliente','vendedor','admin') THEN
    -- Un actor desconocido no cae en ninguna rama de verificación: sin esto,
    -- inventar una palabra sería la forma de esquivar el gate.
    RAISE EXCEPTION 'actor_desconocido: %', p_actor USING ERRCODE = '42501';
  END IF;
  RETURN _mover_estado_pedido(p_pedido_id, p_hasta, p_actor, p_motivo);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ LOS ORQUESTADORES — cada uno con SU gate en el cuerpo
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper del gate: quien puede tocar un pedido es su dueño, su vendedor o un
-- admin. Un helper CON NOMBRE y no un predicado inline repetido cuatro veces
-- (molde D-700: el helper se puede auditar; la copia pegada, no).
CREATE OR REPLACE FUNCTION public._puede_operar_pedido(p_pedido_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pedidos p
    WHERE p.id = p_pedido_id
      AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id) OR is_admin())
  );
$$;
REVOKE ALL ON FUNCTION public._puede_operar_pedido(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._puede_operar_pedido(uuid) TO authenticated;

-- ── ③.a CONFIRMAR PAGO — 🔴 la puerta más cara de todas ────────────────────
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
  -- 🔴 EL GATE. Confirmar un pago es un acto del BACKEND —el webhook de la
  --    pasarela, corriendo con la llave de servicio— o de un admin. Una
  --    sesión de persona no puede declarar que le pagaron: es exactamente lo
  --    que la sonda hizo y por lo que un extraño se llevó la mercadería.
  --    `auth.uid()` NULL = no hay sesión de usuario ⇒ es el backend.
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION
      'confirmacion_de_pago_no_es_del_cliente: este camino es del webhook de la pasarela, no de una sesión de persona'
      USING ERRCODE = '42501';
  END IF;

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

  PERFORM _mover_estado_pedido(p_pedido_id, 'pago_capturado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'stock_reservado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'vendedor_notificado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'liberado_preparacion', 'sistema');

  RETURN jsonb_build_object('ok', true, 'intento_id', v_int);
END $$;

-- Y además se le quita el grant: dos candados distintos para la misma puerta,
-- porque es la que toca la plata. El backend usa la llave de servicio.
REVOKE ALL ON FUNCTION public.confirmar_pago_pedido(uuid, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;

-- ── ③.b RESERVAR STOCK ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reservar_stock_pedido(
  p_pedido_id uuid,
  p_minutos_vigencia integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_it record; v_sku uuid; v_n int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _puede_operar_pedido(p_pedido_id) THEN
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM inventario_reservas WHERE pedido_id = p_pedido_id AND estado='vigente') THEN
    RETURN jsonb_build_object('ok', true, 'ya_reservado', true);
  END IF;

  FOR v_it IN SELECT * FROM pedido_items WHERE pedido_id = p_pedido_id LOOP
    SELECT sku_id INTO v_sku FROM ofertas WHERE id = v_it.oferta_id;
    IF v_sku IS NULL THEN
      RAISE EXCEPTION 'item_sin_sku: %', v_it.id USING ERRCODE = '22023';
    END IF;
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

-- ── ③.c EMPACAR — ya rebotaba por el gate interno; ahora lo dice de frente ──
CREATE OR REPLACE FUNCTION public.empacar_pedido(
  p_pedido_id  uuid,
  p_lotes      jsonb,
  p_peso_real_kg numeric DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_l jsonb; v_faltan int; v_uid uuid := auth.uid(); v_cc uuid;
BEGIN
  -- La sonda midió que ya rebotaba (`no_sos_el_vendedor`), pero rebotaba
  -- TARDE: después de haber escrito los lotes en `pedido_items`. Un extraño
  -- no se llevaba el pedido, pero sí le ensuciaba el lote — y el lote es lo
  -- que se usa el día de un retiro de fabricante.
  SELECT cuenta_comercial_id INTO v_cc FROM pedidos WHERE id = p_pedido_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;
  IF v_uid IS NOT NULL AND NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  FOR v_l IN SELECT * FROM jsonb_array_elements(p_lotes) LOOP
    UPDATE pedido_items
       SET lote = v_l->>'lote',
           fecha_vencimiento = NULLIF(v_l->>'fecha_vencimiento','')::date,
           lote_registrado_en = now(),
           lote_registrado_por = v_uid
     WHERE id = (v_l->>'item_id')::uuid AND pedido_id = p_pedido_id;
  END LOOP;

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

  PERFORM _mover_estado_pedido(p_pedido_id, 'empacado', 'vendedor');
  RETURN jsonb_build_object('ok', true, 'items_con_lote',
    (SELECT count(*) FROM pedido_items WHERE pedido_id = p_pedido_id AND lote IS NOT NULL));
END $$;

-- ── ③.d ENTREGAR ───────────────────────────────────────────────────────────
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
  IF v_uid IS NOT NULL AND NOT _puede_operar_pedido(p_pedido_id) THEN
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;

  IF v_ped.estado <> 'entregado' THEN
    PERFORM _mover_estado_pedido(p_pedido_id, 'entregado', 'sistema');
  END IF;

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
      IF EXISTS (SELECT 1 FROM evento_producto_asignacion WHERE pedido_item_id = v_it.id) THEN
        CONTINUE;
      END IF;

      SELECT m.country_code INTO v_fam FROM mascotas m WHERE m.id = p_mascota_id;

      INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                                   procedencia, modo_captura, country_code, creado_por_user_id)
        VALUES (p_mascota_id, 'producto_asignacion', 'alimentacion', now(),
                jsonb_build_object('pedido_id', p_pedido_id, 'via', 'entregar_pedido'),
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

-- ── ③.e CANCELAR ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancelar_pedido_despensa(
  p_pedido_id uuid, p_actor text, p_motivo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_r record; v_hasta text;
BEGIN
  -- 🔴 EL `ELSE` ERA LA PUERTA. La versión de S95-D hacía
  --    `CASE p_actor WHEN 'cliente' … WHEN 'vendedor' … ELSE 'cancelado_sistema'`,
  --    así que **cualquier palabra que no fuera esas dos** caía en el camino
  --    del sistema y cancelaba el pedido de otro. Un `ELSE` que elige el
  --    camino más poderoso es un `ELSE` mal puesto.
  IF p_actor NOT IN ('cliente','vendedor','admin') THEN
    RAISE EXCEPTION 'actor_desconocido: %', p_actor USING ERRCODE = '42501';
  END IF;
  v_hasta := CASE p_actor WHEN 'cliente' THEN 'cancelado_cliente'
                          WHEN 'vendedor' THEN 'cancelado_vendedor'
                          ELSE 'cancelado_sistema' END;
  -- Por la puerta INTERNA, pero con el actor declarado: los gates de
  -- cliente/vendedor/admin del anillo interno hacen la verificación.
  PERFORM _mover_estado_pedido(p_pedido_id, v_hasta, p_actor, p_motivo);

  FOR v_r IN SELECT * FROM inventario_reservas
              WHERE pedido_id = p_pedido_id AND estado='vigente' FOR UPDATE LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
      VALUES (v_r.sku_id, 'liberacion_reserva', v_r.cantidad,
              COALESCE(p_motivo,'pedido cancelado'), 'pedido', p_pedido_id);
    UPDATE inventario_reservas SET estado='liberada', cerrada_en=now() WHERE id = v_r.id;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'estado', v_hasta);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ④ G.2 · LA FACTURA — el estado `documentado` gana su productor
--
-- El flujo del vendedor estaba CORTADO: `empacar_pedido` termina en `empacado`
-- y la tabla exige `empacado → documentado [sistema] → esperando_courier
-- [vendedor]`. Nadie emitía `documentado`, así que el botón «despachado» nunca
-- llegaba.
--
-- Y el estado que faltaba NO era de relleno: en Ecuador la factura electrónica
-- **puede fallar** —el SRI rechaza, la clave de acceso no autoriza—, y un
-- pedido empacado sin factura no puede salir. `documentado` es justamente ese
-- momento.
--
-- 🔴 LA FACTURA SE REGISTRA, NO SE EMITE (MODELO_DESPENSA §4.4-④). En Forma B
-- **el vendedor factura** con su propio sistema y su propio RUC; e-PetPlace
-- guarda el número, la clave de acceso y el archivo. Por eso no hay integración
-- con el SRI acá y `emitida_por_tercero` nace en true: *la plataforma no
-- factura lo que no vendió.*
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.registrar_factura_pedido(
  p_pedido_id     uuid,
  p_numero        text,
  p_clave_acceso  text DEFAULT NULL,
  p_archivo_url   text DEFAULT NULL,
  p_total         numeric DEFAULT NULL,
  p_estado_sri    text DEFAULT 'autorizada'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_ped record; v_fac uuid; v_existente uuid;
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;

  IF auth.uid() IS NOT NULL
     AND NOT es_vendedor_de(v_ped.cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  IF p_numero IS NULL OR length(trim(p_numero)) = 0 THEN
    -- Sin número no hay factura: un `documentado` sin documento sería la
    -- mentira exacta que este estado existe para impedir.
    RAISE EXCEPTION 'numero_factura_requerido' USING ERRCODE = '22023';
  END IF;

  -- IDEMPOTENTE por pedido: registrar dos veces no crea dos facturas.
  SELECT id INTO v_existente FROM facturas WHERE pedido_id = p_pedido_id LIMIT 1;
  IF v_existente IS NOT NULL THEN
    IF v_ped.estado = 'empacado' THEN
      PERFORM _mover_estado_pedido(p_pedido_id, 'documentado', 'sistema');
    END IF;
    RETURN jsonb_build_object('ok', true, 'factura_id', v_existente, 'ya_existia', true);
  END IF;

  INSERT INTO facturas (pedido_id, user_id, cuenta_comercial_id, country_code,
                        numero_factura, clave_acceso, tipo, total, moneda,
                        estado, archivo_url, emitida_por_tercero, fecha_emision)
    VALUES (p_pedido_id, v_ped.user_id, v_ped.cuenta_comercial_id,
            COALESCE(v_ped.country_code,'EC'), trim(p_numero), p_clave_acceso,
            'factura', COALESCE(p_total, v_ped.total), COALESCE(v_ped.moneda,'USD'),
            p_estado_sri, p_archivo_url, true, now())
    RETURNING id INTO v_fac;

  -- 🔴 EL MISMO ACTO: se registra la factura Y se mueve el estado. Separarlos
  --    dejaría posible un pedido `documentado` sin documento, que es el estado
  --    imposible que este diseño viene a evitar.
  PERFORM _mover_estado_pedido(p_pedido_id, 'documentado', 'sistema');

  RETURN jsonb_build_object('ok', true, 'factura_id', v_fac, 'estado', 'documentado');
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑤ G.3 · AJUSTAR STOCK — con motivo obligatorio y escritura al ledger
--
-- S95-E lo escribió como INSERT directo desde el wrapper y **lo sacó antes de
-- commitear**: un ajuste de inventario que solo existe adentro de una pantalla
-- es uno que ninguna automatización futura puede ejecutar. Acá nace su puerta.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ajustar_stock_vendedor(
  p_sku_id   uuid,
  p_cantidad integer,
  p_motivo   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_cc uuid; v_mov uuid; v_saldo int;
BEGIN
  SELECT cuenta_comercial_id INTO v_cc FROM vendedor_skus WHERE id = p_sku_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'sku_no_existe' USING ERRCODE = '22023'; END IF;

  IF NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  -- 🔴 EL MOTIVO ES OBLIGATORIO Y VIVE EN EL SERVIDOR, no en un `if` de la
  --    pantalla. El inventario es plata: un ajuste sin motivo es un descuadre
  --    que nadie va a poder explicar tres meses después.
  IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN
    RAISE EXCEPTION 'motivo_requerido: un ajuste de inventario sin motivo no se puede auditar'
      USING ERRCODE = '22023';
  END IF;
  IF p_cantidad = 0 THEN
    RAISE EXCEPTION 'cantidad_invalida: un ajuste de cero no ajusta nada' USING ERRCODE = '22023';
  END IF;

  -- Se escribe el MOVIMIENTO; el saldo lo materializa el trigger de la M3.
  -- `tipo='ajuste'` es el único que el CHECK `chk_signo_por_tipo` admite con
  -- signo negativo — medido, no supuesto.
  INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo,
                                      referencia_tipo, creado_por)
    VALUES (p_sku_id, CASE WHEN p_cantidad > 0 THEN 'ingreso' ELSE 'ajuste' END,
            p_cantidad, trim(p_motivo), 'manual', auth.uid())
    RETURNING id INTO v_mov;

  SELECT stock_disponible INTO v_saldo FROM vendedor_skus WHERE id = p_sku_id;
  RETURN jsonb_build_object('ok', true, 'movimiento_id', v_mov, 'stock_disponible', v_saldo);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑥ GRANTS · L-140 sobre lo nuevo y lo tocado
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_f text;
BEGIN
  FOREACH v_f IN ARRAY ARRAY[
    'mover_estado_pedido(uuid, text, text, text)',
    'reservar_stock_pedido(uuid, integer)',
    'empacar_pedido(uuid, jsonb, numeric)',
    'entregar_pedido(uuid, uuid)',
    'cancelar_pedido_despensa(uuid, text, text)',
    'registrar_factura_pedido(uuid, text, text, text, numeric, text)',
    'ajustar_stock_vendedor(uuid, integer, text)']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', v_f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', v_f);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · SE REPRODUCE EL ROJO Y SE PRUEBA LA CURA, CON CONTRA-CASOS
--
-- 🔴 No verifica que las funciones existan: **ataca**. Cada assert tiene su
--    par: el ataque rebota Y el camino legítimo sigue pasando. Sin el segundo,
--    una migración que rompiera todo daría «verde».
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_victima uuid; v_atacante uuid; v_cc uuid; v_ped uuid; v_sku uuid;
  v_pedidos_antes int; v_ok boolean; v_msg text; v_fac jsonb; v_n int; v_dueno uuid;
BEGIN
  SELECT count(*) INTO v_pedidos_antes FROM pedidos;

  -- 🔴 EL ATACANTE NO PUEDE SER ADMIN, y el cinturón lo descubrió abortando:
  --    la primera versión tomaba el perfil más viejo, que resultó estar en
  --    `admin_users` — y un admin **debe** pasar el gate de pago. El test
  --    estaba midiendo a la persona equivocada y habría reportado un agujero
  --    que no existe. El atacante es un usuario COMÚN, que es de quien hay
  --    que defenderse.
  SELECT p.id INTO v_atacante FROM profiles p
   WHERE p.email IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id AND a.activo)
   ORDER BY p.created_at LIMIT 1;
  SELECT p.id INTO v_victima FROM profiles p
   WHERE p.email IS NOT NULL AND p.id <> v_atacante
     AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id AND a.activo)
   ORDER BY p.created_at LIMIT 1;
  SELECT id INTO v_cc FROM cuentas_comerciales WHERE estado='activa'
    AND owner_profile_id IS NOT NULL AND owner_profile_id <> v_atacante LIMIT 1;
  IF v_victima IS NULL OR v_atacante IS NULL OR v_cc IS NULL THEN
    RAISE EXCEPTION 'ABORTA: sin dos personas y una cuenta ajena el cinturón no puede probar nada.';
  END IF;

  -- El rol de vendedor es FIXTURE: hoy hay CERO filas `seller_productos` en la
  -- base (medido), así que sin esto `es_vendedor_de()` es false para todos y
  -- el tramo del vendedor no se podría probar. Nace acá y muere en el
  -- desmontaje — no queda un vendedor sembrado por una migración.
  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
    VALUES (v_cc, 'seller_productos', 'activo', now(), '{"fixture":"__cint_s95g"}'::jsonb)
    ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;

  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia, numero_orden)
    VALUES (v_victima, v_cc, 100, 15, 0, 0, 115, '__cint_s95g', '__cint_s95g')
    RETURNING id INTO v_ped;
  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES (v_ped, 'creado', v_victima, 'cliente');
  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES (v_ped, 'esperando_pago', v_victima, 'cliente');

  -- El atacante entra en escena.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_atacante, 'role', 'authenticated')::text, true);

  -- ── A · el actor `sistema` ya no se puede declarar ────────────────────────
  v_ok := true;
  BEGIN
    PERFORM mover_estado_pedido(v_ped, 'pago_capturado', 'sistema');
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: el actor «sistema» sigue siendo invocable desde afuera.'; END IF;
  IF v_msg NOT LIKE 'actor_sistema_no_invocable%' THEN
    RAISE EXCEPTION 'ABORTA: rebotó por otra razón (%): el gate no es el que se está probando.', v_msg;
  END IF;

  -- ── A2 · CONTRA-CASO: un actor inventado tampoco entra ────────────────────
  v_ok := true;
  BEGIN PERFORM mover_estado_pedido(v_ped, 'pago_capturado', 'motor');
  EXCEPTION WHEN OTHERS THEN v_ok := false; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: un actor desconocido esquiva el gate.'; END IF;

  -- ── B · confirmar el pago desde una sesión de persona ─────────────────────
  v_ok := true;
  BEGIN
    PERFORM confirmar_pago_pedido(v_ped, '__cint', 'x', '__cint_s95g_pago', '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: una sesión de persona todavía puede declarar un pedido pagado.'; END IF;
  IF v_msg NOT LIKE 'confirmacion_de_pago_no_es_del_cliente%' THEN
    RAISE EXCEPTION 'ABORTA: confirmar_pago rebotó por otra razón: %', v_msg;
  END IF;

  -- ── C · reservar stock ajeno ──────────────────────────────────────────────
  v_ok := true;
  BEGIN PERFORM reservar_stock_pedido(v_ped, 5);
  EXCEPTION WHEN OTHERS THEN v_ok := false; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: un extraño todavía reserva stock de un pedido ajeno.'; END IF;

  -- ── D · entregar un pedido ajeno ──────────────────────────────────────────
  v_ok := true;
  BEGIN PERFORM entregar_pedido(v_ped, NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := false; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: un extraño todavía marca entregado un pedido ajeno.'; END IF;

  -- ── E · cancelar declarándose `sistema` ───────────────────────────────────
  v_ok := true;
  BEGIN PERFORM cancelar_pedido_despensa(v_ped, 'sistema', 'x');
  EXCEPTION WHEN OTHERS THEN v_ok := false; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: el ELSE de cancelar sigue llevando al camino del sistema.'; END IF;

  -- ── F · CONTRA-CASO MAYOR: el camino legítimo NO se rompió ────────────────
  -- Sin esto, una migración que cerrara todo daría verde y el motor estaría
  -- muerto. La víctima —dueña del pedido— sí puede cancelar el suyo.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_victima, 'role', 'authenticated')::text, true);
  PERFORM cancelar_pedido_despensa(v_ped, 'cliente', 'me arrepentí');
  SELECT estado INTO v_msg FROM pedidos WHERE id = v_ped;
  IF v_msg <> 'cancelado_cliente' THEN
    RAISE EXCEPTION 'ABORTA: el dueño no pudo cancelar su propio pedido (quedó en %).', v_msg;
  END IF;

  -- ── G · el backend SÍ puede confirmar (sin sesión de usuario) ─────────────
  -- El gate distingue «sin sesión» de «sesión de persona». Si esto rebotara,
  -- el webhook de la pasarela quedaría afuera y no habría cómo cobrar.
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia, numero_orden)
    VALUES (v_victima, v_cc, 100, 15, 0, 0, 115, '__cint_s95g_b', '__cint_s95g_b')
    RETURNING id INTO v_ped;
  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por_rol)
    VALUES (v_ped, 'creado', 'cliente');
  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por_rol)
    VALUES (v_ped, 'esperando_pago', 'cliente');
  PERFORM confirmar_pago_pedido(v_ped, '__cint', 'x', '__cint_s95g_pago_b', '{}'::jsonb);
  SELECT estado INTO v_msg FROM pedidos WHERE id = v_ped;
  IF v_msg <> 'liberado_preparacion' THEN
    RAISE EXCEPTION 'ABORTA: el backend no pudo confirmar el pago (quedó en %).', v_msg;
  END IF;

  -- ── H · G.2 · la factura desbloquea `documentado` ─────────────────────────
  -- Los dos pasos hasta `empacado` son del VENDEDOR, no del sistema — la tabla
  -- lo dice y el cinturón lo descubrió abortando contra un actor inventado por
  -- mí. Se entra con la identidad del dueño de la cuenta comercial.
  SELECT owner_profile_id INTO v_dueno FROM cuentas_comerciales WHERE id = v_cc;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno, 'role', 'authenticated')::text, true);
  PERFORM _mover_estado_pedido(v_ped, 'picking', 'vendedor');
  PERFORM _mover_estado_pedido(v_ped, 'empacado', 'vendedor');
  v_fac := registrar_factura_pedido(v_ped, '001-001-000000123', 'CLAVE-X', NULL, NULL, 'autorizada');
  SELECT estado INTO v_msg FROM pedidos WHERE id = v_ped;
  IF v_msg <> 'documentado' THEN
    RAISE EXCEPTION 'ABORTA: registrar la factura no dejó el pedido en documentado (quedó en %).', v_msg;
  END IF;
  -- Y ahora el vendedor SÍ puede despachar: el flujo dejó de estar cortado.
  SELECT count(*) INTO v_n FROM cat_transiciones_pedido
   WHERE desde='documentado' AND hasta='esperando_courier' AND actor='vendedor' AND activo;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: la transición documentado → esperando_courier no existe.'; END IF;
  -- Sin número de factura no hay documento (contra-caso de H).
  v_ok := true;
  BEGIN PERFORM registrar_factura_pedido(v_ped, '   ');
  EXCEPTION WHEN OTHERS THEN v_ok := false; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: se registró una factura sin número.'; END IF;

  -- ── I · G.3 · el ajuste de stock exige motivo ─────────────────────────────
  SELECT id INTO v_sku FROM vendedor_skus LIMIT 1;
  IF v_sku IS NOT NULL THEN
    v_ok := true;
    BEGIN PERFORM ajustar_stock_vendedor(v_sku, 5, '  ');
    EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
    IF v_ok THEN RAISE EXCEPTION 'ABORTA: se ajustó stock sin motivo.'; END IF;
    IF v_msg NOT LIKE 'motivo_requerido%' THEN
      RAISE EXCEPTION 'ABORTA: el ajuste rebotó por otra razón: %', v_msg;
    END IF;
  ELSE
    RAISE NOTICE 'CINTURÓN: sin SKUs vivos, el ajuste de stock se prueba solo por su gate de motivo en el próximo catálogo.';
  END IF;

  -- ── J · el anillo interno NO es alcanzable por `authenticated` ────────────
  -- Por privilegio EFECTIVO (L-216: un REVOKE que deja PUBLIC no cierra nada).
  IF has_function_privilege('authenticated',
       'public._mover_estado_pedido(uuid, text, text, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA: el anillo interno quedó al alcance de authenticated.';
  END IF;
  IF has_function_privilege('authenticated',
       'public.confirmar_pago_pedido(uuid, text, text, text, jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA: confirmar_pago_pedido sigue concedida a authenticated.';
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ─────────────────────────────
  DELETE FROM pagos_eventos WHERE clave_idempotencia LIKE '__cint_s95g%';
  DELETE FROM pagos_intentos WHERE clave_idempotencia LIKE '__cint_s95g%';
  DELETE FROM facturas WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia LIKE '__cint_s95g%');
  DELETE FROM inventario_reservas WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia LIKE '__cint_s95g%');
  DELETE FROM pedido_estados WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia LIKE '__cint_s95g%');
  DELETE FROM pedidos WHERE clave_idempotencia LIKE '__cint_s95g%';
  DELETE FROM cuenta_roles WHERE metadata->>'fixture' = '__cint_s95g';

  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n <> v_pedidos_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): `pedidos` quedó en % y arrancó en % — hay residuo o escritura ajena.', v_n, v_pedidos_antes;
  END IF;

  RAISE NOTICE 'CINTURÓN S95-G: las cinco puertas cerradas, el camino legítimo intacto, la factura desbloquea documentado. Residuo 0.';
END $$;

COMMIT;
