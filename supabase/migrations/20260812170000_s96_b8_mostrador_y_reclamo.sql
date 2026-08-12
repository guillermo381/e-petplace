-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B8 — LA VENTA DE MOSTRADOR Y SU RECLAMO
--
-- Fuente de letra: `LETRA_RECORRIDO_DESPENSA_S96` §4 — 🔴 EL VENDEDOR JAMÁS
-- ELIGE LA MASCOTA. El caso es real y es un canal de adquisición: la
-- veterinaria vende una bolsa a alguien que entró caminando.
--
--   1. El vet registra la venta CONTRA NADIE. Descuenta su inventario.
--   2. Su factura lleva UN CÓDIGO.
--   3. El cliente mete el código en la app y la compra se ata a él y a la
--      mascota que él elija — recién ahí nace el evento.
--
-- LO QUE ESTO COMPRA: el vendedor nunca busca personas ni ve expedientes —
-- **no hay nada que limitar: la pantalla no existe.** En este archivo no hay
-- una sola función de búsqueda de personas, y el juez lo vigila. La factura
-- es la invitación (decisión founder ③ del arranque: el código se muestra en
-- la app Negocios y el vet lo escribe en su factura).
--
-- LA REGLA GENERAL DE §4, que vale más que el caso: la compra es la puerta
-- de entrada al expediente, y la app nunca adivina de quién es una compra —
-- ofrece atarla, y el dueño decide.
--
-- EL CÓDIGO (decisión técnica de esta pista, con doble check, a la firma en
-- el reporte): 8 caracteres de un alfabeto sin ambiguos (sin 0/O/1/I/L),
-- ~40 bits — no adivinable por fuerza bruta contra un endpoint con sesión —
-- y EXPIRA A 90 DÍAS (propuesto en el prompt de arranque; espejo del plazo
-- de la foto de entrega). La expiración es PEREZOSA (patrón del hold S54):
-- se evalúa al reclamar, cero cron.
--
-- Reversa: scripts/s96/2026-08-12-s96-m6-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón registra una venta real contra el stock
-- vivo, la reclama con una mascota real, deposita y deshace por id con
-- residuo 0 (stock compensado por la puerta, L-231).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① LAS TABLAS — la venta sin persona
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.ventas_mostrador (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  -- El código de la factura. Único GLOBAL: el cliente lo mete sin decir de
  -- qué tienda es.
  codigo_reclamo      text NOT NULL UNIQUE,
  total               numeric NOT NULL DEFAULT 0,
  moneda              text NOT NULL DEFAULT 'USD',
  expira_en           timestamptz NOT NULL,
  -- El reclamo. La venta nace CONTRA NADIE: estos tres son NULL hasta que el
  -- dueño decide.
  reclamada_por       uuid REFERENCES public.profiles(id),
  reclamada_mascota_id uuid REFERENCES public.mascotas(id) ON DELETE SET NULL,
  reclamada_en        timestamptz,
  registrada_por      uuid,
  country_code        text NOT NULL DEFAULT 'EC',
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_reclamo_completo CHECK (
    (reclamada_por IS NULL AND reclamada_en IS NULL)
    OR (reclamada_por IS NOT NULL AND reclamada_en IS NOT NULL))
);
CREATE TABLE public.venta_mostrador_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id     uuid NOT NULL REFERENCES public.ventas_mostrador(id) ON DELETE CASCADE,
  sku_id       uuid NOT NULL REFERENCES public.vendedor_skus(id),
  producto_id  uuid NOT NULL REFERENCES public.productos(id),
  variante_id  uuid NOT NULL REFERENCES public.producto_variantes(id),
  nombre_producto text NOT NULL,
  cantidad     integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric,
  moneda       text NOT NULL DEFAULT 'USD',
  lote         text,
  fecha_vencimiento date,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ventas_mostrador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_mostrador_items ENABLE ROW LEVEL SECURITY;

-- El vendedor ve SUS ventas; el que reclamó ve la suya (es su compra); el
-- equipo todo. El código jamás se lista para terceros: no hay policy que lo
-- exponga a otra persona.
CREATE POLICY ventas_mostrador_select ON public.ventas_mostrador FOR SELECT TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR reclamada_por = auth.uid() OR is_admin());
CREATE POLICY venta_items_select ON public.venta_mostrador_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ventas_mostrador v WHERE v.id = venta_id
                   AND (es_vendedor_de(v.cuenta_comercial_id)
                        OR v.reclamada_por = auth.uid() OR is_admin())));
REVOKE INSERT, UPDATE, DELETE ON public.ventas_mostrador, public.venta_mostrador_items
  FROM anon, authenticated;
REVOKE SELECT ON public.ventas_mostrador, public.venta_mostrador_items FROM anon;

-- El movimiento de stock de mostrador es un tipo de referencia propio — y un
-- TIPO DE MOVIMIENTO propio: `consumo` descuenta de lo RESERVADO (así lo
-- materializa `_trg_inventario_aplicar_movimiento`), y la venta de mostrador
-- no tiene reserva — la bolsa se va del DISPONIBLE en el acto. Usar `consumo`
-- acá habría consumido la reserva de OTRO pedido (medido por el cinturón de
-- la primera corrida).
ALTER TABLE public.inventario_movimientos
  DROP CONSTRAINT inventario_movimientos_referencia_tipo_check;
ALTER TABLE public.inventario_movimientos
  ADD CONSTRAINT inventario_movimientos_referencia_tipo_check
  CHECK (referencia_tipo = ANY (ARRAY['pedido'::text,'manual'::text,'expiracion'::text,
                                      'carga_inicial'::text,'venta_mostrador'::text]));
ALTER TABLE public.inventario_movimientos
  DROP CONSTRAINT inventario_movimientos_tipo_check;
ALTER TABLE public.inventario_movimientos
  ADD CONSTRAINT inventario_movimientos_tipo_check
  CHECK (tipo = ANY (ARRAY['ingreso'::text,'ajuste'::text,'merma'::text,'reserva'::text,
                           'liberacion_reserva'::text,'consumo'::text,'venta_directa'::text]));
ALTER TABLE public.inventario_movimientos
  DROP CONSTRAINT chk_signo_por_tipo;
ALTER TABLE public.inventario_movimientos
  ADD CONSTRAINT chk_signo_por_tipo
  CHECK (((tipo = ANY (ARRAY['ingreso'::text,'reserva'::text,'liberacion_reserva'::text,
                             'consumo'::text,'merma'::text,'venta_directa'::text]))
          AND cantidad > 0) OR tipo = 'ajuste'::text);

-- El trigger materializador aprende el tipo (pre-M6 capturado en
-- scripts/s96/functiondef-pre-m6.sql para la reversa).
CREATE OR REPLACE FUNCTION public._trg_inventario_aplicar_movimiento()
 RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_delta_disp integer := 0;
  v_delta_res  integer := 0;
BEGIN
  CASE NEW.tipo
    WHEN 'ingreso'            THEN v_delta_disp :=  NEW.cantidad;
    WHEN 'ajuste'             THEN v_delta_disp :=  NEW.cantidad;   -- con signo
    WHEN 'merma'              THEN v_delta_disp := -NEW.cantidad;
    WHEN 'reserva'            THEN v_delta_disp := -NEW.cantidad; v_delta_res :=  NEW.cantidad;
    WHEN 'liberacion_reserva' THEN v_delta_disp :=  NEW.cantidad; v_delta_res := -NEW.cantidad;
    WHEN 'consumo'            THEN v_delta_res  := -NEW.cantidad;  -- sale de lo reservado
    -- S96: la venta de mostrador sale del DISPONIBLE — nunca hubo reserva.
    WHEN 'venta_directa'      THEN v_delta_disp := -NEW.cantidad;
    ELSE RAISE EXCEPTION 'tipo de movimiento no soportado: %', NEW.tipo;
  END CASE;

  UPDATE vendedor_skus
     SET stock_disponible = stock_disponible + v_delta_disp,
         stock_reservado  = stock_reservado  + v_delta_res,
         updated_at       = now()
   WHERE id = NEW.sku_id;

  -- Los CHECK `>= 0` de vendedor_skus son los que rebotan sobrerreserva y
  -- consumo de lo que no está reservado. No hace falta duplicarlos acá: el
  -- estado imposible ya es inexpresable en la tabla del saldo.
  RETURN NEW;
END $function$;

-- La tipada del expediente gana el hilo al ítem de mostrador (para la
-- idempotencia del depósito — el de pedidos usa pedido_item_id).
ALTER TABLE public.evento_producto_asignacion
  ADD COLUMN venta_mostrador_item_id uuid REFERENCES public.venta_mostrador_items(id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ② REGISTRAR LA VENTA — contra nadie, descuenta stock, genera el código
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.registrar_venta_mostrador(
  p_cuenta_comercial_id uuid,
  p_items               jsonb   -- [{sku_id, cantidad, lote?, fecha_vencimiento?}]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_venta uuid; v_it jsonb; v_sku record; v_codigo text;
  v_total numeric := 0; v_n int := 0;
  -- Sin 0/O/1/I/L: un código que se dicta por teléfono o se lee de una
  -- factura arrugada no puede depender de distinguir una O de un 0.
  v_abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'venta_sin_items' USING ERRCODE = '22023';
  END IF;

  -- El código: 8 del alfabeto, reintentando ante la colisión improbable.
  LOOP
    SELECT string_agg(substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1), '')
      INTO v_codigo FROM generate_series(1, 8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM ventas_mostrador WHERE codigo_reclamo = v_codigo);
  END LOOP;

  INSERT INTO ventas_mostrador (cuenta_comercial_id, codigo_reclamo, expira_en, registrada_por)
    VALUES (p_cuenta_comercial_id, v_codigo, now() + interval '90 days', auth.uid())
    RETURNING id INTO v_venta;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT vs.id, vs.cuenta_comercial_id, vs.stock_disponible, vs.variante_id,
           pv.producto_id, p.nombre, o.precio, o.moneda
      INTO v_sku
    FROM vendedor_skus vs
    JOIN producto_variantes pv ON pv.id = vs.variante_id
    JOIN productos p ON p.id = pv.producto_id
    LEFT JOIN ofertas o ON o.sku_id = vs.id AND o.estado = 'publicada'
    WHERE vs.id = (v_it->>'sku_id')::uuid;

    IF v_sku.id IS NULL OR v_sku.cuenta_comercial_id <> p_cuenta_comercial_id THEN
      RAISE EXCEPTION 'sku_invalido: % no es de esta casa', v_it->>'sku_id' USING ERRCODE = '22023';
    END IF;
    IF v_sku.stock_disponible < (v_it->>'cantidad')::int THEN
      -- La bolsa está EN EL MOSTRADOR — si el sistema dice que no hay, el
      -- inventario está mal, y eso se dice: el ajuste con motivo es el camino.
      RAISE EXCEPTION 'stock_insuficiente: el inventario dice % y la venta pide %',
        v_sku.stock_disponible, (v_it->>'cantidad')::int USING ERRCODE = '22023';
    END IF;

    INSERT INTO venta_mostrador_items (venta_id, sku_id, producto_id, variante_id,
                                       nombre_producto, cantidad, precio_unitario,
                                       moneda, lote, fecha_vencimiento)
      VALUES (v_venta, v_sku.id, v_sku.producto_id, v_sku.variante_id,
              v_sku.nombre, (v_it->>'cantidad')::int, v_sku.precio,
              COALESCE(v_sku.moneda, 'USD'), NULLIF(v_it->>'lote',''),
              NULLIF(v_it->>'fecha_vencimiento','')::date);

    -- El stock sale por el ledger, jamás pisando el saldo. `venta_directa`:
    -- del disponible, porque en el mostrador nunca hubo reserva.
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo,
                                        referencia_id, creado_por)
      VALUES (v_sku.id, 'venta_directa', (v_it->>'cantidad')::int, 'venta_mostrador',
              v_venta, auth.uid());

    v_total := v_total + COALESCE(v_sku.precio, 0) * (v_it->>'cantidad')::int;
    v_n := v_n + 1;
  END LOOP;

  UPDATE ventas_mostrador SET total = v_total WHERE id = v_venta;

  RETURN jsonb_build_object('ok', true, 'venta_id', v_venta,
                            'codigo_reclamo', v_codigo,
                            'items', v_n, 'total', v_total,
                            'expira_en', now() + interval '90 days');
END $$;
REVOKE ALL ON FUNCTION public.registrar_venta_mostrador(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_venta_mostrador(uuid, jsonb) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ EL RECLAMO — el cliente decide, y recién ahí nace el evento
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.reclamar_compra_mostrador(
  p_codigo     text,
  p_mascota_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_venta record; v_it record;
  v_cc_masc text; v_ev uuid; v_n int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_venta FROM ventas_mostrador
   WHERE codigo_reclamo = upper(btrim(p_codigo)) FOR UPDATE;
  IF v_venta.id IS NULL THEN
    RAISE EXCEPTION 'codigo_invalido' USING ERRCODE = '22023';
  END IF;
  IF v_venta.reclamada_por IS NOT NULL THEN
    RAISE EXCEPTION 'compra_ya_reclamada' USING ERRCODE = '22023';
  END IF;
  IF v_venta.expira_en < now() THEN
    -- Expiración PEREZOSA: se evalúa acá, cero cron.
    RAISE EXCEPTION 'codigo_expirado' USING ERRCODE = '22023';
  END IF;
  -- La mascota la elige EL CLIENTE, y solo de su familia (el mismo predicado
  -- del destino del carrito).
  IF NOT _user_es_familia_de_mascota(p_mascota_id, v_uid) AND NOT is_admin() THEN
    RAISE EXCEPTION 'mascota_sin_acceso' USING ERRCODE = '42501';
  END IF;

  UPDATE ventas_mostrador
     SET reclamada_por = v_uid, reclamada_mascota_id = p_mascota_id, reclamada_en = now()
   WHERE id = v_venta.id;

  SELECT m.country_code INTO v_cc_masc FROM mascotas m WHERE m.id = p_mascota_id;

  -- El depósito: SOLO lo que entra al expediente (la familia del producto
  -- decide), con la procedencia de la familia — ella compró y ella reclamó.
  FOR v_it IN
    SELECT vi.*, pr.familia_codigo, pv.presentacion, pv.peso_kg
    FROM venta_mostrador_items vi
    JOIN productos pr ON pr.id = vi.producto_id
    JOIN producto_variantes pv ON pv.id = vi.variante_id
    JOIN cat_familias_producto f ON f.codigo = pr.familia_codigo
    WHERE vi.venta_id = v_venta.id AND f.entra_al_expediente
  LOOP
    IF EXISTS (SELECT 1 FROM evento_producto_asignacion
               WHERE venta_mostrador_item_id = v_it.id) THEN
      CONTINUE;   -- idempotencia del depósito
    END IF;
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                                 procedencia, modo_captura, country_code, creado_por_user_id)
      VALUES (p_mascota_id, 'producto_asignacion', 'alimentacion', now(),
              jsonb_build_object('venta_mostrador_id', v_venta.id, 'via', 'reclamo_mostrador'),
              'declarado_por_familia', 'automatico', COALESCE(v_cc_masc,'EC'), v_uid)
      RETURNING id INTO v_ev;
    INSERT INTO evento_producto_asignacion
      (evento_id, mascota_id, producto_id, variante_id, venta_mostrador_item_id,
       nombre_producto, familia_codigo, presentacion, cantidad, peso_kg,
       fecha_compra, country_code, lote, fecha_vencimiento)
      VALUES (v_ev, p_mascota_id, v_it.producto_id, v_it.variante_id, v_it.id,
              v_it.nombre_producto, v_it.familia_codigo, v_it.presentacion,
              v_it.cantidad, v_it.peso_kg, v_venta.created_at::date,
              COALESCE(v_cc_masc,'EC'), v_it.lote, v_it.fecha_vencimiento);
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'venta_id', v_venta.id,
                            'mascota_id', p_mascota_id,
                            'eventos_expediente', v_n);
END $$;
REVOKE ALL ON FUNCTION public.reclamar_compra_mostrador(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reclamar_compra_mostrador(text, uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_original text := current_user;
  v_cc uuid; v_vend uuid; v_sku uuid; v_buyer uuid; v_masc uuid;
  v_res jsonb; v_venta uuid; v_codigo text;
  v_ventas_antes int; v_ev_antes int; v_disp_antes int; v_pts_antes int; v_n int;
  v_ok boolean; v_msg text;
  v_ult_id uuid; v_ult_fecha timestamptz;
BEGIN
  SELECT count(*) INTO v_ventas_antes FROM ventas_mostrador;
  SELECT count(*) INTO v_ev_antes FROM eventos_mascota;
  SELECT count(*) INTO v_pts_antes FROM transacciones_puntos;

  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_vend
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT o.sku_id INTO v_sku FROM ofertas o WHERE o.estado='publicada' LIMIT 1;
  SELECT fm.user_id, m.id INTO v_buyer, v_masc
  FROM familia_miembro fm JOIN mascotas m ON m.familia_id = fm.familia_id
  WHERE fm.hasta IS NULL AND m.estado_vida = 'activa' AND fm.user_id <> v_vend
    AND fm.rol IN ('adulto_titular','adulto_autorizado') LIMIT 1;
  SELECT stock_disponible INTO v_disp_antes FROM vendedor_skus WHERE id = v_sku;
  SELECT ultimo_evento_id, ultimo_evento_fecha INTO v_ult_id, v_ult_fecha
  FROM mascota_perfil_vigente WHERE mascota_id = v_masc;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role','authenticated')::text, true);
  PERFORM ajustar_stock_vendedor(v_sku, 2, '__cint_s96m6 carga temporal');

  -- ── A · la venta nace contra nadie y descuenta el stock ──────────────────
  v_res := registrar_venta_mostrador(v_cc,
    jsonb_build_array(jsonb_build_object('sku_id', v_sku, 'cantidad', 1, 'lote', '__cint6-L')));
  v_venta  := (v_res->>'venta_id')::uuid;
  v_codigo := v_res->>'codigo_reclamo';
  IF length(v_codigo) <> 8 THEN RAISE EXCEPTION 'ABORTA: el código no tiene 8.'; END IF;
  IF (SELECT reclamada_por FROM ventas_mostrador WHERE id = v_venta) IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: la venta nació con dueño — tenía que nacer contra NADIE.';
  END IF;
  IF (SELECT stock_disponible FROM vendedor_skus WHERE id = v_sku) <> v_disp_antes + 1 THEN
    RAISE EXCEPTION 'ABORTA: la venta no descontó el stock por el ledger.';
  END IF;
  -- Y NO hay evento todavía: el vendedor no eligió mascota porque NO PUEDE.
  IF (SELECT count(*) FROM eventos_mascota) <> v_ev_antes THEN
    RAISE EXCEPTION 'ABORTA §7.4: la venta de mostrador depositó SIN reclamo.';
  END IF;

  -- ── B · 🔴 el código equivocado y la mascota ajena rebotan ───────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role','authenticated')::text, true);
  v_ok := true;
  BEGIN PERFORM reclamar_compra_mostrador('XXXXXXXX', v_masc);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'codigo_invalido%' THEN
    RAISE EXCEPTION 'ABORTA: un código inventado reclamó una compra (%).', COALESCE(v_msg,'sin error');
  END IF;

  -- ── C · el reclamo real: se ata al cliente y deposita ────────────────────
  v_res := reclamar_compra_mostrador(v_codigo, v_masc);
  IF (v_res->>'eventos_expediente')::int <> 1 THEN
    RAISE EXCEPTION 'ABORTA: el reclamo depositó % eventos (se esperaba 1).', v_res->>'eventos_expediente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM eventos_mascota e
                 WHERE e.mascota_id = v_masc AND e.tipo='producto_asignacion'
                   AND e.procedencia='declarado_por_familia'
                   AND e.datos->>'venta_mostrador_id' = v_venta::text) THEN
    RAISE EXCEPTION 'ABORTA: el evento del reclamo no quedó con su procedencia.';
  END IF;

  -- ── D · reclamar dos veces rebota ────────────────────────────────────────
  v_ok := true;
  BEGIN PERFORM reclamar_compra_mostrador(v_codigo, v_masc);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'compra_ya_reclamada%' THEN
    RAISE EXCEPTION 'ABORTA: la misma compra se reclamó dos veces (%).', COALESCE(v_msg,'sin error');
  END IF;

  -- ── E · la anti-fuente, otra vez medida ──────────────────────────────────
  IF (SELECT count(*) FROM transacciones_puntos) <> v_pts_antes THEN
    RAISE EXCEPTION 'ABORTA MODELO_LOYALTY §5: el mostrador movió el motor de puntos.';
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM evento_producto_asignacion
   WHERE venta_mostrador_item_id IN (SELECT id FROM venta_mostrador_items WHERE venta_id = v_venta);
  DELETE FROM eventos_mascota
   WHERE tipo='producto_asignacion' AND datos->>'venta_mostrador_id' = v_venta::text;
  DELETE FROM ventas_mostrador WHERE id = v_venta;   -- items caen por CASCADE
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_vend, 'role','authenticated')::text, true);
    PERFORM ajustar_stock_vendedor(v_sku, v_disp_antes - v_n, '__cint_s96m6 devolucion del fixture');
    PERFORM set_config('request.jwt.claims', '', true);
  END IF;
  DELETE FROM inventario_movimientos
   WHERE referencia_id = v_venta OR motivo LIKE '__cint_s96m6%';
  UPDATE mascota_perfil_vigente
     SET ultimo_evento_id = v_ult_id, ultimo_evento_fecha = v_ult_fecha
   WHERE mascota_id = v_masc
     AND (ultimo_evento_id IS DISTINCT FROM v_ult_id
          OR ultimo_evento_fecha IS DISTINCT FROM v_ult_fecha);

  SELECT count(*) INTO v_n FROM ventas_mostrador;
  IF v_n <> v_ventas_antes THEN RAISE EXCEPTION 'ABORTA 76(g): ventas % vs %', v_n, v_ventas_antes; END IF;
  SELECT count(*) INTO v_n FROM eventos_mascota;
  IF v_n <> v_ev_antes THEN RAISE EXCEPTION 'ABORTA 76(g): eventos % vs %', v_n, v_ev_antes; END IF;
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN RAISE EXCEPTION 'ABORTA 76(g): stock % vs %', v_n, v_disp_antes; END IF;

  RAISE NOTICE 'CINTURÓN S96-M6: la venta nace contra nadie y sin evento, el código inventado rebota, el reclamo ata y deposita con procedencia de familia, el doble reclamo rebota, y el loyalty no se movió. Residuo 0.';
END $$;

COMMIT;
