-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B4/A-B5 (mitad de motor) — LA ENTREGA CON EVIDENCIA Y EL DESTINO
--                                     POR ÍTEM
--
-- Fuente de letra: `LETRA_RECORRIDO_DESPENSA_S96` §6.3 (cada ítem lleva su
-- destino: una mascota, o donación — sin esa columna, al entregar habría que
-- adivinar a qué expediente depositar) · §9.1/§9.4 (entregado pide FOTO y el
-- CÓDIGO que la familia dice en la puerta) · §4 (retiro en tienda entra a v1:
-- el mismo pedido con otro modo de entrega) · §6.4 (la donación jamás entra a
-- un expediente ni otorga beneficio comercial) · y LA REGLA GENERAL de §4:
-- **la app nunca adivina de quién es una compra; ofrece atarla, y el dueño
-- decide.**
--
-- ── QUÉ CONSTRUYE ──────────────────────────────────────────────────────────
-- ① `pedido_item_destinos` — tabla LATERAL, no columna en `pedido_items`, y
--    la razón es §7.4: el vendedor lee `pedido_items` (empaque, lotes) y un
--    `mascota_id` legible ahí sería EL HILO que conecta dos compras con la
--    misma identidad clínica — exactamente lo que la letra prohíbe. En tabla
--    aparte, su RLS es del DUEÑO del pedido y de nadie más; el motor la lee
--    por DEFINER.
-- ② El destino se elige AL COMPRAR (`crear_pedido_despensa` v2), validando
--    el acceso a la mascota EN ESE MOMENTO — quien compra decide, y solo
--    puede decidir sobre una mascota suya.
-- ③ `entregar_pedido` v2 — el cuarto escalón lo marca quien está en la
--    puerta: exige el CÓDIGO de verificación y (en despacho) la FOTO. La
--    mascota deja de ser un parámetro de la entrega: se lee del destino que
--    el comprador fijó. La donación JAMÁS deposita.
-- ④ El RETIRO EN TIENDA se enciende: caen los dos CHECKs que lo apagaban,
--    el pago le genera su código, y el vendedor entrega en el mostrador
--    contra ese código — sin repartidor, sin ventana, sin foto.
-- ⑤ `atar_item_a_mascota` — la regla general hecha función: un ítem que
--    quedó sin destino (el alimento del ave no registrada) se ata después,
--    por el dueño, y si el pedido ya se entregó el evento nace en el acto.
--
-- Reversa (escrita, verificada en disco y LEÍDA antes de aplicar):
--   scripts/s96/2026-08-12-s96-m2-REVERSA.sql
--   (+ scripts/s96/functiondef-pre-m2.sql con los cuerpos S95 capturados)
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón compra de verdad contra el catálogo vivo,
-- entrega con código y foto, DEPOSITA en el expediente de una mascota real y
-- lo deshace por id — exigiendo residuo 0 en pedidos, envíos, eventos del
-- expediente y el motor de puntos (la anti-fuente de MODELO_LOYALTY §5 SE
-- MIDE: transacciones_puntos tiene que terminar exactamente donde empezó).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① EL DESTINO POR ÍTEM — lateral, del dueño, jamás del vendedor
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.pedido_item_destinos (
  pedido_item_id uuid PRIMARY KEY REFERENCES public.pedido_items(id) ON DELETE CASCADE,
  -- SET NULL y no RESTRICT: si una mascota se borra (S92: 80 FKs la apuntan),
  -- el ítem vuelve a "sin destino" — que es la verdad — en vez de bloquear.
  mascota_id     uuid REFERENCES public.mascotas(id) ON DELETE SET NULL,
  es_donacion    boolean NOT NULL DEFAULT false,
  -- Donación y mascota son excluyentes; ninguno de los dos también es legal
  -- (el ítem sin destino existe: se compra para un ave no registrada y se
  -- ata después).
  CONSTRAINT chk_destino_excluyente CHECK (NOT (es_donacion AND mascota_id IS NOT NULL)),
  atado_en       timestamptz,
  atado_por      uuid,
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pedido_item_destinos IS
  'S96 · El destino de cada ítem: una mascota, o donación (LETRA_RECORRIDO §6.3). '
  'Tabla LATERAL a propósito: el vendedor lee pedido_items y este dato es el hilo '
  'que conectaría dos compras con una identidad clínica (§7.4) — acá su RLS es solo '
  'del dueño del pedido. La donación jamás deposita en un expediente ni otorga '
  'beneficio comercial (MODELO_LOYALTY §7.2).';

ALTER TABLE public.pedido_item_destinos ENABLE ROW LEVEL SECURITY;

-- SOLO el dueño del pedido (y el equipo). El vendedor NO tiene brazo acá,
-- y eso es la política entera: la pantalla que le mostraría esto no existe.
CREATE POLICY destinos_select ON public.pedido_item_destinos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pedido_items pi JOIN pedidos p ON p.id = pi.pedido_id
                 WHERE pi.id = pedido_item_destinos.pedido_item_id
                   AND p.user_id = auth.uid())
         OR is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.pedido_item_destinos FROM anon, authenticated;
REVOKE SELECT ON public.pedido_item_destinos FROM anon;
-- Y el mismo cierre para la tabla del rol de la M1 (quedó con el grant de
-- fábrica de anon; su policy ya era TO authenticated — esto lo vuelve doble).
REVOKE SELECT ON public.repartidores FROM anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- ② EL RETIRO SE ENCIENDE — caen los dos candados de v1
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pedidos DROP CONSTRAINT chk_retiro_apagado_v1;
ALTER TABLE public.envios  DROP CONSTRAINT chk_envio_retiro_apagado_v1;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ CREAR EL PEDIDO v2 — el destino se decide al comprar
-- ═══════════════════════════════════════════════════════════════════════════
-- La firma vieja se VA (dos versiones serían dos verdades — L-119) y entra la
-- nueva con el método de entrega. Los ítems ganan, en su jsonb, `mascota_id`
-- o `donacion`; la entrega gana `instrucciones`, `lat` y `lon`.
DROP FUNCTION public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid);

CREATE FUNCTION public.crear_pedido_despensa(
  p_cuenta_comercial_id uuid,
  p_items               jsonb,
  p_entrega             jsonb,
  p_clave_idempotencia  text,
  p_bodega_id           uuid DEFAULT NULL,
  p_metodo_entrega      text DEFAULT 'despacho'
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
  v_item_id  uuid;
  v_masc     uuid;
  v_don      boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;
  IF p_clave_idempotencia IS NULL OR length(trim(p_clave_idempotencia)) = 0 THEN
    RAISE EXCEPTION 'clave_idempotencia_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_metodo_entrega NOT IN ('despacho','retiro') THEN
    RAISE EXCEPTION 'metodo_entrega_invalido: %', p_metodo_entrega USING ERRCODE = '22023';
  END IF;

  -- IDEMPOTENCIA: la misma clave devuelve el mismo pedido, no crea otro.
  SELECT id INTO v_existente FROM pedidos WHERE clave_idempotencia = p_clave_idempotencia;
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'pedido_id', v_existente, 'ya_existia', true);
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'pedido_sin_items' USING ERRCODE = '22023';
  END IF;

  -- 🔴 EL DESTINO SE VALIDA ANTES DE ESCRIBIR NADA: elegir la mascota de otro
  --    sería atarle una compra ajena a su expediente. La donación y el ítem
  --    sin destino son legales; la mascota ajena NO.
  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_masc := NULLIF(v_it->>'mascota_id','')::uuid;
    v_don  := COALESCE((v_it->>'donacion')::boolean, false);
    IF v_don AND v_masc IS NOT NULL THEN
      RAISE EXCEPTION 'destino_contradictorio: un ítem no puede ser donación Y de una mascota'
        USING ERRCODE = '22023';
    END IF;
    -- El predicado es LA FAMILIA (adultos), no `user_tiene_acceso_a_mascota`:
    -- ese helper incluye el acceso de PRESTADOR, y un vet con acceso clínico
    -- comprando alimento NO puede atar su compra a la mascota de un cliente.
    -- La compra la ata quien convive con la mascota (y P5 de paso: los roles
    -- de menor no entran al predicado).
    IF v_masc IS NOT NULL AND NOT _user_es_familia_de_mascota(v_masc, v_uid) AND NOT is_admin() THEN
      RAISE EXCEPTION 'mascota_sin_acceso: no podés atar una compra a una mascota que no es tuya'
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia,
                       numero_orden, metodo_entrega,
                       entrega_nombre_receptor, entrega_telefono,
                       entrega_direccion, entrega_ciudad, entrega_sector,
                       entrega_referencias, entrega_instrucciones,
                       entrega_lat, entrega_lon)
  VALUES (v_uid, p_cuenta_comercial_id, 0, 0, 0, 0, 0, p_clave_idempotencia,
          'P-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
          p_metodo_entrega,
          p_entrega->>'nombre_receptor', p_entrega->>'telefono',
          CASE WHEN p_metodo_entrega = 'retiro'
               THEN COALESCE(p_entrega->>'direccion', 'Retiro en tienda')
               ELSE p_entrega->>'direccion' END,
          p_entrega->>'ciudad', p_entrega->>'sector',
          p_entrega->>'referencias', p_entrega->>'instrucciones',
          NULLIF(p_entrega->>'lat','')::double precision,
          NULLIF(p_entrega->>'lon','')::double precision)
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

    -- Se congelan precio, código de tasa Y porcentaje (S95-D, sin cambios).
    INSERT INTO pedido_items (pedido_id, producto_id, variante_id, oferta_id,
                              cuenta_comercial_id, nombre_producto, precio_unitario,
                              cantidad, subtotal, impuesto_codigo, impuesto_pct,
                              impuesto_monto)
    VALUES (v_ped, v_of.producto_id, v_of.variante_id, v_of.id,
            p_cuenta_comercial_id, v_of.nombre_producto, v_of.precio,
            (v_it->>'cantidad')::int,
            round(v_of.precio * (v_it->>'cantidad')::int, 2),
            v_of.impuesto_codigo, v_tasa,
            round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2))
    RETURNING id INTO v_item_id;

    -- El destino que el comprador fijó. Sin destino declarado no nace fila:
    -- la ausencia es la verdad, y `atar_item_a_mascota` existe para después.
    v_masc := NULLIF(v_it->>'mascota_id','')::uuid;
    v_don  := COALESCE((v_it->>'donacion')::boolean, false);
    IF v_masc IS NOT NULL OR v_don THEN
      INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion, atado_en, atado_por)
        VALUES (v_item_id, v_masc, v_don, now(), v_uid);
    END IF;

    v_sub := v_sub + round(v_of.precio * (v_it->>'cantidad')::int, 2);
    v_imp := v_imp + round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2);
    v_pf  := v_pf  + COALESCE(v_of.peso_kg,0) * (v_it->>'cantidad')::int;
    v_pv  := v_pv  + COALESCE(v_of.largo_cm * v_of.ancho_cm * v_of.alto_cm / 6000.0, 0)
                     * (v_it->>'cantidad')::int;
  END LOOP;

  -- El retiro no tiene flete NI cotización: la familia va al local.
  IF p_metodo_entrega = 'despacho' THEN
    v_cot := cotizar_envio_despensa(p_cuenta_comercial_id, v_sub, v_pf, v_pv,
                                    'EC', p_entrega->>'ciudad');
    -- 🔴 S96: fuera de cobertura (o sin regla) el pedido NO nace. La v1 lo
    --    creaba igual con flete 0 — un pedido que promete entregar donde no
    --    se entrega es el dato plausible y falso que L-139 prohíbe.
    IF NOT COALESCE((v_cot->>'ok')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_cot->>'error','cotizacion_fallida')
        USING ERRCODE = '22023', DETAIL = COALESCE(v_cot->>'detalle','');
    END IF;
    v_envio := (v_cot->>'costo')::numeric;
    IF p_bodega_id IS NOT NULL THEN
      v_prom := calcular_promesa_entrega(p_bodega_id);
    END IF;
  ELSE
    v_cot := jsonb_build_object('ok', true, 'costo', 0, 'metodo', 'retiro');
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
                            'metodo_entrega', p_metodo_entrega,
                            'cotizacion_envio', v_cot);
END $$;

REVOKE ALL ON FUNCTION public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③bis · DEFECTO DE S95 CAZADO POR EL CINTURÓN: LA RESERVA POR ÍTEM
-- ═══════════════════════════════════════════════════════════════════════════
-- `inventario_reservas` tiene UNIQUE (pedido_id, sku_id) y
-- `reservar_stock_pedido` insertaba UNA reserva POR ÍTEM: un carrito con dos
-- líneas de la misma oferta violaba el UNIQUE, y `iniciar_pago_pedido`
-- traducía ese rebote a `sin_stock` — **la familia veía «no queda» habiendo
-- stock de sobra.** Se agrupa por SKU, que es la unidad real de la reserva.
CREATE OR REPLACE FUNCTION public.reservar_stock_pedido(p_pedido_id uuid, p_minutos_vigencia integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_it record; v_n int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _puede_operar_pedido(p_pedido_id) THEN
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM inventario_reservas WHERE pedido_id = p_pedido_id AND estado='vigente') THEN
    RETURN jsonb_build_object('ok', true, 'ya_reservado', true);
  END IF;

  -- Un ítem cuya oferta no resuelve a SKU no se puede apartar — y se dice
  -- ANTES de escribir nada.
  IF EXISTS (SELECT 1 FROM pedido_items pi LEFT JOIN ofertas o ON o.id = pi.oferta_id
             WHERE pi.pedido_id = p_pedido_id AND o.sku_id IS NULL) THEN
    RAISE EXCEPTION 'item_sin_sku' USING ERRCODE = '22023';
  END IF;

  -- 🔴 POR SKU, NO POR ÍTEM: la reserva es del stock, y el stock es del SKU.
  FOR v_it IN
    SELECT o.sku_id, SUM(pi.cantidad)::int AS cantidad
    FROM pedido_items pi JOIN ofertas o ON o.id = pi.oferta_id
    WHERE pi.pedido_id = p_pedido_id
    GROUP BY o.sku_id
  LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
      VALUES (v_it.sku_id, 'reserva', v_it.cantidad, 'pedido', p_pedido_id);
    INSERT INTO inventario_reservas (sku_id, pedido_id, cantidad, expira_en)
      VALUES (v_it.sku_id, p_pedido_id, v_it.cantidad,
              now() + (p_minutos_vigencia || ' minutes')::interval);
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'reservas', v_n, 'expira_en',
                            now() + (p_minutos_vigencia || ' minutes')::interval);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ④ EL PAGO DEL RETIRO GENERA SU CÓDIGO
-- ═══════════════════════════════════════════════════════════════════════════
-- Mismo cuerpo S95-K + un paso: si el pedido es de retiro, nace su "envío"
-- de mostrador (metodo='retiro', sin repartidor) con el código que la familia
-- muestra en el local. El código tiene que existir ANTES de que el pedido
-- esté listo — por eso nace con el pago, no con el último escalón.
CREATE OR REPLACE FUNCTION public.confirmar_pago_pedido(
  p_pedido_id          uuid,
  p_proveedor          text,
  p_referencia         text,
  p_clave_idempotencia text,
  p_payload            jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_int uuid; v_ped record; v_reservas int;
BEGIN
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

  SELECT count(*) INTO v_reservas FROM inventario_reservas
   WHERE pedido_id = p_pedido_id AND estado = 'vigente';
  IF v_reservas = 0 AND EXISTS (SELECT 1 FROM pedido_items WHERE pedido_id = p_pedido_id) THEN
    RAISE EXCEPTION 'pago_sin_reserva: el pedido % no tiene stock reservado; confirmarlo lo dejaría listo para preparar sin mercadería apartada', p_pedido_id
      USING ERRCODE = '22023';
  END IF;

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

  -- S96: el retiro nace con su código de mostrador. Sin repartidor, sin
  -- ventana — el mismo mecanismo del código de la puerta, en el local.
  IF v_ped.metodo_entrega = 'retiro'
     AND NOT EXISTS (SELECT 1 FROM envios WHERE pedido_id = p_pedido_id) THEN
    INSERT INTO envios (pedido_id, cuenta_comercial_id, country_code, transportista,
                        metodo, estado, codigo_verificacion, destino_direccion,
                        intentos_entrega, costo_envio, moneda, pagado_por)
      VALUES (p_pedido_id, v_ped.cuenta_comercial_id, COALESCE(v_ped.country_code,'EC'),
              'propio', 'retiro', 'pendiente',
              lpad(floor(random() * 10000)::int::text, 4, '0'),
              'Retiro en tienda', 0, 0, COALESCE(v_ped.moneda,'USD'), 'cliente');
  END IF;

  RETURN jsonb_build_object('ok', true, 'intento_id', v_int);
END $$;

REVOKE ALL ON FUNCTION public.confirmar_pago_pedido(uuid, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑤ EL DEPÓSITO — una sola implementación, dos consumidores
-- ═══════════════════════════════════════════════════════════════════════════
-- La escritura al expediente vive UNA vez. La consumen `entregar_pedido` (al
-- entregar, ítem por ítem según su destino) y `atar_item_a_mascota` (el
-- reclamo tardío). Idempotente por `pedido_item_id`: depositar dos veces el
-- mismo ítem no crea dos eventos.
CREATE FUNCTION public._depositar_item_en_expediente(
  p_item_id    uuid,
  p_mascota_id uuid,
  p_uid        uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_it record; v_cc text; v_ev uuid;
BEGIN
  -- Solo deposita lo que ENTRA al expediente: la familia del producto decide
  -- (alimento sí, juguete no — BIO_EXPEDIENTE E2bis, la frontera de §7.1).
  SELECT pi.*, pr.familia_codigo, pv.presentacion, pv.peso_kg
    INTO v_it
  FROM pedido_items pi
  JOIN productos pr ON pr.id = pi.producto_id
  JOIN producto_variantes pv ON pv.id = pi.variante_id
  JOIN cat_familias_producto f ON f.codigo = pr.familia_codigo
  WHERE pi.id = p_item_id AND f.entra_al_expediente;
  IF v_it.id IS NULL THEN RETURN NULL; END IF;

  IF EXISTS (SELECT 1 FROM evento_producto_asignacion WHERE pedido_item_id = p_item_id) THEN
    RETURN NULL;  -- ya depositado: append-only e idempotente conviven así
  END IF;

  SELECT m.country_code INTO v_cc FROM mascotas m WHERE m.id = p_mascota_id;

  -- Procedencia: APORTADO POR LA FAMILIA — ella compró. Quién apretó el botón
  -- de entrega es el disparador, no el autor (LETRA_PANEL §3.1).
  INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                               procedencia, modo_captura, country_code, creado_por_user_id)
    VALUES (p_mascota_id, 'producto_asignacion', 'alimentacion', now(),
            jsonb_build_object('pedido_id', v_it.pedido_id, 'via', 'entregar_pedido'),
            'declarado_por_familia', 'automatico', COALESCE(v_cc,'EC'), p_uid)
    RETURNING id INTO v_ev;

  INSERT INTO evento_producto_asignacion
    (evento_id, mascota_id, producto_id, variante_id, pedido_item_id,
     nombre_producto, familia_codigo, presentacion, cantidad, peso_kg,
     fecha_compra, country_code, lote, fecha_vencimiento)
    VALUES (v_ev, p_mascota_id, v_it.producto_id, v_it.variante_id, p_item_id,
            v_it.nombre_producto, v_it.familia_codigo, v_it.presentacion,
            v_it.cantidad, v_it.peso_kg, current_date,
            COALESCE(v_cc,'EC'), v_it.lote, v_it.fecha_vencimiento);
  RETURN v_ev;
END $$;
REVOKE ALL ON FUNCTION public._depositar_item_en_expediente(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑥ ENTREGAR v2 — el cuarto escalón, con la evidencia adentro
-- ═══════════════════════════════════════════════════════════════════════════
DROP FUNCTION public.entregar_pedido(uuid, uuid);

CREATE FUNCTION public.entregar_pedido(
  p_pedido_id uuid,
  p_codigo    text,
  p_foto_path text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ped   record; v_env record; v_it record; v_ev uuid;
  v_n     int := 0; v_sku uuid; v_uid uuid := auth.uid(); v_actor text;
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;

  SELECT * INTO v_env FROM envios WHERE pedido_id = p_pedido_id FOR UPDATE;
  IF v_env.id IS NULL THEN
    RAISE EXCEPTION 'envio_no_existe: este pedido no tiene envío que entregar' USING ERRCODE = '22023';
  END IF;

  -- Quién puede: el repartidor asignado (despacho) o el vendedor (retiro en
  -- mostrador, o despacho cuando su repartidor no tiene cuenta y él responde).
  IF _es_repartidor_del_pedido(p_pedido_id) THEN
    v_actor := 'repartidor';
  ELSIF es_vendedor_de(v_ped.cuenta_comercial_id) THEN
    v_actor := 'vendedor';
  ELSIF is_admin() THEN
    v_actor := 'repartidor';   -- la rama repartidor del anillo interno admite admin
  ELSIF v_uid IS NULL THEN
    v_actor := 'sistema';
  ELSE
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;

  -- 🔴 EL CÓDIGO, SIEMPRE. Es lo que la familia dice en la puerta (o muestra
  --    en el mostrador): sin él, "entregado" es la palabra de una sola parte.
  IF p_codigo IS NULL OR btrim(p_codigo) <> v_env.codigo_verificacion THEN
    RAISE EXCEPTION 'codigo_incorrecto: el código no coincide con el de este envío'
      USING ERRCODE = '22023';
  END IF;

  -- 🔴 LA FOTO, EN EL DESPACHO. En la puerta de una casa la foto es la
  --    evidencia; en el mostrador la persona está presente y no hay puerta
  --    que fotografiar.
  IF v_env.metodo = 'despacho' AND (p_foto_path IS NULL OR length(btrim(p_foto_path)) = 0) THEN
    RAISE EXCEPTION 'foto_requerida: la entrega en puerta se cierra con su foto'
      USING ERRCODE = '22023';
  END IF;

  -- El retiro lo entrega el VENDEDOR, jamás un repartidor; el despacho lo
  -- entrega quien está en la puerta.
  IF v_env.metodo = 'retiro' AND v_actor = 'repartidor' AND NOT is_admin() THEN
    RAISE EXCEPTION 'retiro_es_del_mostrador: un retiro lo entrega el vendedor en el local'
      USING ERRCODE = '22023';
  END IF;

  IF v_ped.estado <> 'entregado' THEN
    PERFORM _mover_estado_pedido(p_pedido_id, 'entregado', v_actor);
  END IF;

  UPDATE envios SET estado = 'entregado', entregado_en = now(), verificado_en = now(),
                    foto_entrega_path = COALESCE(p_foto_path, foto_entrega_path),
                    entregado_por_nombre = COALESCE(
                      (SELECT r.nombre FROM repartidores r WHERE r.id = envios.repartidor_id),
                      entregado_por_nombre),
                    entregado_por_documento = COALESCE(
                      (SELECT r.documento FROM repartidores r WHERE r.id = envios.repartidor_id),
                      entregado_por_documento),
                    updated_at = now()
   WHERE id = v_env.id;

  -- El stock reservado se consume — POR SKU, como la reserva (el espejo del
  -- defecto de ③bis: la versión por ítem consumía solo la primera línea de
  -- cada SKU y el ledger quedaba sub-registrado).
  FOR v_it IN
    SELECT o.sku_id, SUM(pi.cantidad)::int AS cantidad
    FROM pedido_items pi JOIN ofertas o ON o.id = pi.oferta_id
    WHERE pi.pedido_id = p_pedido_id AND o.sku_id IS NOT NULL
    GROUP BY o.sku_id
  LOOP
    IF EXISTS (SELECT 1 FROM inventario_reservas
                WHERE pedido_id = p_pedido_id AND sku_id = v_it.sku_id AND estado='vigente') THEN
      INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
        VALUES (v_it.sku_id, 'consumo', v_it.cantidad, 'pedido', p_pedido_id);
      UPDATE inventario_reservas SET estado='consumida', cerrada_en=now()
       WHERE pedido_id = p_pedido_id AND sku_id = v_it.sku_id AND estado='vigente';
    END IF;
  END LOOP;

  -- 🔴 EL DEPÓSITO, POR EL DESTINO QUE EL COMPRADOR FIJÓ — ítem por ítem.
  --    La donación no tiene mascota y JAMÁS deposita (el CHECK de la tabla ya
  --    lo hace inexpresable); el ítem sin destino tampoco: la app no adivina.
  FOR v_it IN
    SELECT d.pedido_item_id, d.mascota_id
    FROM pedido_item_destinos d
    JOIN pedido_items pi ON pi.id = d.pedido_item_id
    WHERE pi.pedido_id = p_pedido_id AND d.mascota_id IS NOT NULL
  LOOP
    v_ev := _depositar_item_en_expediente(v_it.pedido_item_id, v_it.mascota_id, v_ped.user_id);
    IF v_ev IS NOT NULL THEN v_n := v_n + 1; END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
                            'eventos_expediente', v_n,
                            'narrativa', 'entregado');
END $$;

REVOKE ALL ON FUNCTION public.entregar_pedido(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.entregar_pedido(uuid, text, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑦ ATAR DESPUÉS — la regla general de §4 hecha función
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.atar_item_a_mascota(
  p_item_id    uuid,
  p_mascota_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_ped record; v_uid uuid := auth.uid(); v_ev uuid; v_dest record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;

  SELECT p.* INTO v_ped FROM pedidos p JOIN pedido_items pi ON pi.pedido_id = p.id
   WHERE pi.id = p_item_id;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'item_no_existe' USING ERRCODE = '22023'; END IF;

  -- Ata EL DUEÑO de la compra, nadie más. Ni el vendedor, ni el repartidor:
  -- la app nunca adivina de quién es una compra — ofrece atarla, y el dueño
  -- decide (LETRA_RECORRIDO §4).
  IF v_ped.user_id <> v_uid AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_es_tu_compra' USING ERRCODE = '42501';
  END IF;
  -- Mismo predicado que al comprar: la FAMILIA adulta, jamás el acceso de
  -- prestador (ver crear_pedido_despensa).
  IF NOT _user_es_familia_de_mascota(p_mascota_id, v_uid) AND NOT is_admin() THEN
    RAISE EXCEPTION 'mascota_sin_acceso' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_dest FROM pedido_item_destinos WHERE pedido_item_id = p_item_id;
  IF v_dest.es_donacion THEN
    -- Una donación no se re-ata: no hay mascota y el agradecimiento es
    -- humano, no contable (MODELO_LOYALTY §7.2).
    RAISE EXCEPTION 'donacion_no_se_ata' USING ERRCODE = '22023';
  END IF;
  IF v_dest.mascota_id IS NOT NULL THEN
    RAISE EXCEPTION 'item_ya_atado: este ítem ya tiene su mascota' USING ERRCODE = '22023';
  END IF;

  INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion, atado_en, atado_por)
    VALUES (p_item_id, p_mascota_id, false, now(), v_uid)
  ON CONFLICT (pedido_item_id)
    DO UPDATE SET mascota_id = p_mascota_id, atado_en = now(), atado_por = v_uid;

  -- Si el pedido YA se entregó, el evento nace en el acto: la compra estaba
  -- esperando a su mascota, no al revés.
  IF v_ped.estado = 'entregado' THEN
    v_ev := _depositar_item_en_expediente(p_item_id, p_mascota_id, v_ped.user_id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'item_id', p_item_id,
                            'mascota_id', p_mascota_id,
                            'evento_depositado', v_ev IS NOT NULL);
END $$;

REVOKE ALL ON FUNCTION public.atar_item_a_mascota(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atar_item_a_mascota(uuid, uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · comprar → entregar con evidencia → el expediente dice la verdad
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_vend uuid; v_of uuid; v_sku uuid; v_ped uuid; v_rep uuid; v_envio uuid;
  v_buyer uuid; v_masc uuid; v_masc_ajena uuid;
  v_ped_antes int; v_env_antes int; v_ev_antes int; v_pts_antes int; v_disp_antes int;
  v_n int; v_ok boolean; v_msg text; v_estado text; v_res jsonb; v_codigo text;
  v_item_libre uuid; v_codigo_malo text;
  v_ult_id uuid; v_ult_fecha timestamptz;
  -- El rol REAL con el que corre la migración. Medido: `db push` se conecta
  -- como `cli_login_postgres` y opera con `SET ROLE postgres` ⇒ ni RESET ROLE
  -- ni session_user devuelven al rol correcto tras una sonda RLS — los dos
  -- caen al rol del CLI, que no tiene EXECUTE sobre el motor.
  v_rol_original text := current_user;
BEGIN
  SELECT count(*) INTO v_ped_antes FROM pedidos;
  SELECT count(*) INTO v_env_antes FROM envios;
  SELECT count(*) INTO v_ev_antes  FROM eventos_mascota;
  SELECT count(*) INTO v_pts_antes FROM transacciones_puntos;

  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_vend
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT o.id, o.sku_id INTO v_of, v_sku FROM ofertas o WHERE o.estado='publicada' LIMIT 1;

  -- Un comprador REAL con mascota REAL, y una mascota que NO es suya.
  -- 🔴 DISTINTO del vendedor: la primera corrida eligió al primer
  --    familia_miembro de la base y era EL MISMO user del vendedor de
  --    pruebas — el test §7.4 medía a un comprador mirando su propia compra.
  SELECT fm.user_id, m.id INTO v_buyer, v_masc
  FROM familia_miembro fm JOIN mascotas m ON m.familia_id = fm.familia_id
  WHERE fm.hasta IS NULL AND m.estado_vida = 'activa' AND fm.user_id <> v_vend
    AND fm.rol IN ('adulto_titular','adulto_autorizado')
  LIMIT 1;
  -- La "ajena" se elige POR EL MISMO PREDICADO que la función usa — elegirla
  -- por familia distinta no alcanzó: el comprador podía llegar a ella por el
  -- codueño legacy o por ser familiar autorizado.
  SELECT m.id INTO v_masc_ajena FROM mascotas m
  WHERE m.id <> v_masc
    AND NOT _user_es_familia_de_mascota(m.id, v_buyer)
  LIMIT 1;
  IF v_cc IS NULL OR v_of IS NULL OR v_buyer IS NULL OR v_masc_ajena IS NULL THEN
    RAISE EXCEPTION 'ABORTA: faltan vendedor/oferta/comprador/mascotas para que el cinturón pruebe algo.';
  END IF;
  SELECT stock_disponible INTO v_disp_antes FROM vendedor_skus WHERE id = v_sku;

  -- El fixture deposita eventos reales sobre una mascota real y después los
  -- borra por id — pero el trigger de `ultimo_evento_*` es solo-INSERT (S48,
  -- D-307): se fotografía el perfil vigente ANTES y se restaura DESPUÉS.
  SELECT ultimo_evento_id, ultimo_evento_fecha INTO v_ult_id, v_ult_fecha
  FROM mascota_perfil_vigente WHERE mascota_id = v_masc;

  -- El repartidor del fixture (el vendedor mismo, con cuenta, para operar).
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role','authenticated')::text, true);
  v_rep := (registrar_repartidor(v_cc, '__cint2 Rep', 'CINT2-001', NULL, v_vend)->>'repartidor_id')::uuid;
  PERFORM ajustar_stock_vendedor(v_sku, 6, '__cint_s96m2 carga temporal');

  -- ── A · 🔴 la mascota ajena rebota AL COMPRAR ────────────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role','authenticated')::text, true);
  v_ok := true;
  BEGIN
    PERFORM crear_pedido_despensa(v_cc,
      jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1,
                                           'mascota_id', v_masc_ajena)),
      '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"Calle x","ciudad":"Quito"}'::jsonb,
      '__cint_s96m2_ajena');
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'mascota_sin_acceso%' THEN
    RAISE EXCEPTION 'ABORTA: se ató una compra a una mascota ajena (%).', COALESCE(v_msg,'sin error');
  END IF;

  -- ── B · la compra real: mascota + donación + sin destino ────────────────
  SELECT (crear_pedido_despensa(v_cc,
            jsonb_build_array(
              jsonb_build_object('oferta_id', v_of, 'cantidad', 1, 'mascota_id', v_masc),
              jsonb_build_object('oferta_id', v_of, 'cantidad', 1, 'donacion', true),
              jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
            '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"Calle x","ciudad":"Quito","instrucciones":"dejar en porteria"}'::jsonb,
            '__cint_s96m2')->>'pedido_id')::uuid INTO v_ped;
  IF (SELECT count(*) FROM pedido_item_destinos d JOIN pedido_items pi ON pi.id=d.pedido_item_id
       WHERE pi.pedido_id = v_ped) <> 2 THEN
    RAISE EXCEPTION 'ABORTA: los destinos no quedaron escritos (se esperaban 2: mascota y donación).';
  END IF;

  -- 🔴 EL VENDEDOR NO VE LOS DESTINOS — por RLS, medido con el rol de verdad
  --    (regla 68). La vuelta se hace EXPLÍCITA contra session_user y se
  --    VERIFICA: un fixture que sigue corriendo con el rol equivocado produce
  --    errores que apuntan a cualquier otra parte.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM pedido_item_destinos d JOIN pedido_items pi ON pi.id=d.pedido_item_id
   WHERE pi.pedido_id = v_ped;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_original);
  IF current_user <> v_rol_original THEN
    RAISE EXCEPTION 'ABORTA: el rol no volvió a % tras la sonda RLS (quedó %).', v_rol_original, current_user;
  END IF;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ABORTA §7.4: el vendedor ve % destino(s) — el hilo a la mascota quedó abierto.', v_n;
  END IF;

  -- ── C · el camino entero hasta la puerta ─────────────────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role','authenticated')::text, true);
  PERFORM iniciar_pago_pedido(v_ped, 5);
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM confirmar_pago_pedido(v_ped, '__cint', 'ref', '__cint_s96m2_pago', '{}'::jsonb);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role','authenticated')::text, true);
  PERFORM _mover_estado_pedido(v_ped, 'picking', 'vendedor');
  PERFORM empacar_pedido(v_ped,
    (SELECT jsonb_agg(jsonb_build_object('item_id', id, 'lote', '__cint2-L1'))
       FROM pedido_items WHERE pedido_id = v_ped), 5.0);
  PERFORM registrar_factura_pedido(v_ped, '__cint2 001-001-000000002');
  v_res := despachar_pedido(v_ped, v_rep);
  v_envio  := (v_res->>'envio_id')::uuid;
  v_codigo := v_res->>'codigo_verificacion';
  PERFORM marcar_en_camino_a_destino(v_envio);

  -- ── D · 🔴 sin código no hay entrega; con código y sin foto tampoco ──────
  -- El código equivocado se ELIGE distinto del real: probar con una constante
  -- que puede coincidir sería un test que a veces entrega de verdad.
  v_codigo_malo := CASE WHEN v_codigo = '0000' THEN '9999' ELSE '0000' END;
  v_ok := true;
  BEGIN PERFORM entregar_pedido(v_ped, v_codigo_malo, 'entregas/x.jpg');
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'codigo_incorrecto%' THEN
    RAISE EXCEPTION 'ABORTA: la entrega pasó con un código equivocado (%).', COALESCE(v_msg,'sin error');
  END IF;
  v_ok := true;
  BEGIN PERFORM entregar_pedido(v_ped, v_codigo, NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'foto_requerida%' THEN
    RAISE EXCEPTION 'ABORTA: la entrega en puerta pasó sin foto (%).', COALESCE(v_msg,'sin error');
  END IF;

  -- ── E · la entrega real: deposita SOLO el ítem con mascota ───────────────
  v_res := entregar_pedido(v_ped, v_codigo, 'entregas/__cint2.jpg');
  IF (v_res->>'eventos_expediente')::int <> 1 THEN
    RAISE EXCEPTION 'ABORTA: se esperaba 1 evento (mascota) y hubo % — la donación o el sin-destino depositaron.',
      v_res->>'eventos_expediente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM eventos_mascota e
                 WHERE e.mascota_id = v_masc AND e.tipo='producto_asignacion'
                   AND e.procedencia='declarado_por_familia'
                   AND e.datos->>'pedido_id' = v_ped::text) THEN
    RAISE EXCEPTION 'ABORTA: el evento no quedó con la procedencia de la familia.';
  END IF;
  IF (SELECT foto_entrega_path FROM envios WHERE id = v_envio) IS NULL
     OR (SELECT verificado_en FROM envios WHERE id = v_envio) IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la evidencia (foto/verificación) no quedó estampada en el envío.';
  END IF;

  -- ── F · atar DESPUÉS: el ítem libre gana mascota y el evento nace ya ─────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role','authenticated')::text, true);
  SELECT pi.id INTO v_item_libre FROM pedido_items pi
   WHERE pi.pedido_id = v_ped
     AND NOT EXISTS (SELECT 1 FROM pedido_item_destinos d WHERE d.pedido_item_id = pi.id);
  v_res := atar_item_a_mascota(v_item_libre, v_masc);
  IF (v_res->>'evento_depositado')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: atar después de entregado no depositó el evento.';
  END IF;

  -- ── G · 🔴 LA ANTI-FUENTE, MEDIDA: la compra jamás alimentó el loyalty ───
  SELECT count(*) INTO v_n FROM transacciones_puntos;
  IF v_n <> v_pts_antes THEN
    RAISE EXCEPTION 'ABORTA MODELO_LOYALTY §5: la compra movió el motor de puntos (% → %).', v_pts_antes, v_n;
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM evento_producto_asignacion
   WHERE pedido_item_id IN (SELECT id FROM pedido_items WHERE pedido_id = v_ped);
  DELETE FROM eventos_mascota
   WHERE tipo='producto_asignacion' AND datos->>'pedido_id' = v_ped::text;
  DELETE FROM pagos_eventos  WHERE clave_idempotencia LIKE '__cint_s96m2%';
  DELETE FROM pagos_intentos WHERE clave_idempotencia LIKE '__cint_s96m2%';
  DELETE FROM facturas       WHERE pedido_id = v_ped;
  DELETE FROM envio_eventos  WHERE envio_id = v_envio;
  DELETE FROM envios         WHERE id = v_envio;
  UPDATE inventario_reservas SET estado='liberada', cerrada_en=now()
   WHERE pedido_id = v_ped AND estado='vigente';
  DELETE FROM inventario_reservas WHERE pedido_id = v_ped;
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_vend, 'role','authenticated')::text, true);
    PERFORM ajustar_stock_vendedor(v_sku, v_disp_antes - v_n, '__cint_s96m2 devolucion del fixture');
    PERFORM set_config('request.jwt.claims', '', true);
  END IF;
  DELETE FROM inventario_movimientos
   WHERE referencia_id = v_ped OR motivo LIKE '__cint_s96m2%';
  DELETE FROM pedido_estados WHERE pedido_id = v_ped;
  DELETE FROM pedido_items   WHERE pedido_id = v_ped;   -- destinos caen por CASCADE
  DELETE FROM pedidos        WHERE clave_idempotencia LIKE '__cint_s96m2%';
  DELETE FROM repartidores   WHERE documento = 'CINT2-001';

  -- El perfil vigente de la mascota real vuelve a su foto inicial (el DELETE
  -- del evento lo dejó con ultimo_evento_id NULL y la fecha del fixture).
  UPDATE mascota_perfil_vigente
     SET ultimo_evento_id = v_ult_id, ultimo_evento_fecha = v_ult_fecha
   WHERE mascota_id = v_masc
     AND (ultimo_evento_id IS DISTINCT FROM v_ult_id
          OR ultimo_evento_fecha IS DISTINCT FROM v_ult_fecha);

  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n <> v_ped_antes THEN RAISE EXCEPTION 'ABORTA 76(g): pedidos % vs %', v_n, v_ped_antes; END IF;
  SELECT count(*) INTO v_n FROM envios;
  IF v_n <> v_env_antes THEN RAISE EXCEPTION 'ABORTA 76(g): envios % vs %', v_n, v_env_antes; END IF;
  SELECT count(*) INTO v_n FROM eventos_mascota;
  IF v_n <> v_ev_antes THEN RAISE EXCEPTION 'ABORTA 76(g): eventos_mascota % vs %', v_n, v_ev_antes; END IF;
  SELECT count(*) INTO v_n FROM transacciones_puntos;
  IF v_n <> v_pts_antes THEN RAISE EXCEPTION 'ABORTA 76(g): transacciones_puntos % vs %', v_n, v_pts_antes; END IF;
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): el stock quedó en % y arrancó en %.', v_n, v_disp_antes;
  END IF;

  RAISE NOTICE 'CINTURÓN S96-M2: la mascota ajena rebota al comprar, el vendedor NO ve destinos, sin código no hay entrega, sin foto tampoco, la entrega deposita SOLO el ítem con mascota con procedencia de familia, atar después deposita en el acto, y el loyalty no se movió un punto. Residuo 0.';
END $$;

-- ── Cinturón estructural ────────────────────────────────────────────────────
DO $$
BEGIN
  -- Una sola versión de cada función tocada (L-119: dos firmas, dos verdades).
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='entregar_pedido') <> 1 THEN
    RAISE EXCEPTION 'ABORTA L-119: entregar_pedido tiene más de una firma.';
  END IF;
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='crear_pedido_despensa') <> 1 THEN
    RAISE EXCEPTION 'ABORTA L-119: crear_pedido_despensa tiene más de una firma.';
  END IF;
  -- L-140: nada nuevo ejecutable por anon.
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proname IN ('entregar_pedido','crear_pedido_despensa','atar_item_a_mascota',
                        '_depositar_item_en_expediente')
      AND has_function_privilege('anon', p.oid, 'EXECUTE')) THEN
    RAISE EXCEPTION 'ABORTA L-140: una función quedó ejecutable por anon.';
  END IF;
  -- El depósito interno NO es alcanzable por una sesión común.
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='_depositar_item_en_expediente'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')) THEN
    RAISE EXCEPTION 'ABORTA: el anillo interno del depósito quedó alcanzable.';
  END IF;
END $$;

COMMIT;
