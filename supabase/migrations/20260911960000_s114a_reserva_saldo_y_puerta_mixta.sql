-- S114-A · PAGO MIXTO ① · LA RESERVA DEL SALDO Y LA PUERTA QUE APLICA SALDO.
--
-- Firma del founder: si la familia tiene $13 y el pedido son $20, paga $13 con
-- saldo y $7 por el riel. El saldo se consume DESPUÉS de que el riel confirme la
-- diferencia (LO HACE confirmar_pago_compra, migración siguiente). La atomicidad
-- no se relaja: todo o nada sobre los N pedidos de la compra.
--
-- DOS PIEZAS:
--  ① saldo_hogar_disponible pasa a RESTAR la reserva. Una compra en
--     'esperando_pago' con saldo_aplicado>0 tiene ese saldo APARTADO: no está
--     disponible para otro checkout. Sin esto, la familia podría gastar dos veces
--     el mismo saldo entre que reserva y el webhook confirma. La reserva se
--     libera al marcar la compra pagada (o cancelada/fallida) — el movimiento
--     real de consumo lo escribe confirmar_pago_compra al confirmar el riel.
--  ② aplicar_saldo_a_compra(compra, monto?): reserva el saldo (o lo aplica
--     entero si cubre todo). REEMPLAZA a pagar_compra_con_saldo (20260911890000,
--     cero consumidores — C la frenó antes de montar). Una cosa, una puerta.
--     · full-saldo (cubre el total): camino directo — consume, marca pagada,
--       mueve pedidos. Sin intento de riel (no hay nada que conciliar).
--     · parcial: reserva saldo_aplicado, deja la compra en esperando_pago y
--       devuelve resto_a_cobrar para que el checkout dispare el riel por esa
--       diferencia.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; sin backfill de negocio). Reversa ANTES
-- en docs/relevamientos/2026-09-08-s114a-REVERSA-20260911960000-reserva-y-puerta-mixta.sql

-- ① saldo_hogar_disponible resta la reserva del pago mixto ─────────────────────
CREATE OR REPLACE FUNCTION public.saldo_hogar_disponible(p_familia uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT (
    COALESCE((SELECT sum(monto) FROM saldo_hogar_movimientos WHERE familia_id = p_familia), 0)
    -- 🔴 RESERVA DEL PAGO MIXTO: el saldo apartado por una compra en vuelo no
    --    está disponible. Se marca pagada ANTES de consumir (libera esta resta),
    --    y el consumo lo baja del sum ⇒ nunca se cuenta dos veces.
    - COALESCE((
        SELECT sum(c.saldo_aplicado)
          FROM compras c
         WHERE c.estado = 'esperando_pago'
           AND c.saldo_aplicado > 0
           AND _familia_del_user(c.user_id) = p_familia
      ), 0)
  )::numeric(12,2);
$fn$;
REVOKE ALL ON FUNCTION public.saldo_hogar_disponible(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.saldo_hogar_disponible(uuid) TO authenticated;

-- ② la puerta que aplica saldo (reemplaza pagar_compra_con_saldo) ──────────────
DROP FUNCTION IF EXISTS public.pagar_compra_con_saldo(uuid);

CREATE OR REPLACE FUNCTION public.aplicar_saldo_a_compra(
  p_compra_id uuid, p_monto_saldo numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_yo uuid := auth.uid();
  v_c record; v_fam uuid; v_disp_sin_esta numeric;
  v_aplicar numeric; v_resto numeric; v_sin_reserva int; v_cons jsonb; v_ped record;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;

  SELECT * INTO v_c FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_c.id IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','compra_no_existe'); END IF;
  IF v_c.user_id <> v_yo THEN RETURN jsonb_build_object('ok',false,'codigo','no_es_tuya'); END IF;

  IF v_c.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok',true,'duplicado',true,'codigo','ya_pagada'); END IF;
  IF v_c.estado NOT IN ('creada','esperando_pago') THEN
    RETURN jsonb_build_object('ok',false,'codigo','compra_no_pagable'); END IF;

  v_fam := _familia_del_user(v_yo);
  IF v_fam IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_familia'); END IF;

  -- Disponible SIN contar la reserva de ESTA compra ⇒ re-aplicar es idempotente
  -- (no descuenta dos veces lo que esta misma compra ya tenía apartado).
  v_disp_sin_esta := saldo_hogar_disponible(v_fam) + COALESCE(v_c.saldo_aplicado, 0);

  -- Cuánto aplicar: lo pedido (capado por lo disponible y por el total), o todo
  -- lo que alcance hasta el total si no se pide monto.
  v_aplicar := LEAST(COALESCE(p_monto_saldo, v_disp_sin_esta), v_disp_sin_esta, v_c.total);
  IF v_aplicar IS NULL OR v_aplicar < 0 THEN v_aplicar := 0; END IF;
  v_aplicar := ROUND(v_aplicar, 2);

  IF v_aplicar <= 0 THEN
    -- Nada de saldo: libera cualquier reserva previa; el riel cobra todo.
    UPDATE compras
       SET saldo_aplicado = 0,
           estado = CASE WHEN estado='creada' THEN 'esperando_pago' ELSE estado END,
           updated_at = now()
     WHERE id = p_compra_id;
    RETURN jsonb_build_object('ok',true,'saldo_aplicado',0,
      'resto_a_cobrar', v_c.total, 'requiere_riel', true,
      'saldo_restante', saldo_hogar_disponible(v_fam));
  END IF;

  v_resto := ROUND(v_c.total - v_aplicar, 2);

  -- ═══ CAMINO DIRECTO · el saldo cubre TODO ═════════════════════════════════
  IF v_resto <= 0 THEN
    SELECT count(*) INTO v_sin_reserva
      FROM pedidos p
     WHERE p.compra_id = p_compra_id
       AND EXISTS (SELECT 1 FROM pedido_items pi WHERE pi.pedido_id = p.id)
       AND NOT EXISTS (SELECT 1 FROM inventario_reservas ir
                        WHERE ir.pedido_id = p.id AND ir.estado = 'vigente');
    IF v_sin_reserva > 0 THEN
      RETURN jsonb_build_object('ok',false,'codigo','pago_sin_reserva'); END IF;

    -- Marca pagada ANTES de consumir: libera la reserva de esta compra en
    -- saldo_hogar_disponible, para que el consumo no la reste dos veces.
    UPDATE compras SET saldo_aplicado = v_c.total, estado = 'pagada', updated_at = now()
     WHERE id = p_compra_id;

    v_cons := consumir_saldo_hogar(v_fam, v_c.total, 'compra:' || p_compra_id::text, p_compra_id);
    IF (v_cons->>'ok')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'consumo_de_saldo_fallo_en_full_saldo: %', v_cons USING ERRCODE='22023'; END IF;

    FOR v_ped IN SELECT id FROM pedidos WHERE compra_id = p_compra_id LOOP
      PERFORM _mover_estado_pedido(v_ped.id, 'pago_capturado', 'sistema', 'pago con saldo del hogar');
    END LOOP;

    RETURN jsonb_build_object('ok',true,'pagado_con','saldo',
      'saldo_aplicado', v_c.total, 'resto_a_cobrar', 0, 'requiere_riel', false,
      'saldo_restante', saldo_hogar_disponible(v_fam));
  END IF;

  -- ═══ CAMINO MIXTO · reserva el saldo; el resto lo cobra el riel ════════════
  UPDATE compras
     SET saldo_aplicado = v_aplicar,
         estado = CASE WHEN estado='creada' THEN 'esperando_pago' ELSE estado END,
         updated_at = now()
   WHERE id = p_compra_id;

  RETURN jsonb_build_object('ok',true,'saldo_aplicado', v_aplicar,
    'resto_a_cobrar', v_resto, 'requiere_riel', true,
    'saldo_restante', saldo_hogar_disponible(v_fam));
END $fn$;

REVOKE ALL ON FUNCTION public.aplicar_saldo_a_compra(uuid, numeric) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.aplicar_saldo_a_compra(uuid, numeric) TO authenticated;

COMMENT ON FUNCTION public.aplicar_saldo_a_compra(uuid, numeric) IS
  'S114-A pago mixto. Aplica saldo del hogar a una compra: full (cubre el total → '
  'consume, marca pagada, mueve pedidos) o parcial (reserva saldo_aplicado, deja '
  'esperando_pago y devuelve resto_a_cobrar para el riel). El consumo real del '
  'saldo parcial lo escribe confirmar_pago_compra al confirmar el riel.';

-- ── CINTURÓN · la RESERVA baja el disponible y se libera al pagar ────────────
-- (aplicar_saldo_a_compra exige sesión ⇒ su E2E vive en el assert del wrapper
--  con JWT real. Acá se prueba la pieza riesgosa nueva: la resta de la reserva.)
DO $cinturon$
DECLARE
  v_user uuid; v_fam uuid; v_d0 numeric; v_d1 numeric; v_d2 numeric; v_d3 numeric;
  v_compra uuid;
BEGIN
  SELECT c.user_id, _familia_del_user(c.user_id) INTO v_user, v_fam
    FROM compras c WHERE _familia_del_user(c.user_id) IS NOT NULL LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'CINTURÓN: no hay un usuario con familia para probar'; END IF;

  v_d0 := saldo_hogar_disponible(v_fam);
  PERFORM acreditar_saldo_hogar(v_fam, 100.00, 'ajuste', 'SONDA-MIXTO-credito', NULL);
  v_d1 := saldo_hogar_disponible(v_fam);
  IF v_d1 <> v_d0 + 100.00 THEN RAISE EXCEPTION 'CINTURÓN: acreditar no sumó 100 (% -> %)', v_d0, v_d1; END IF;

  -- una compra en vuelo con 30 reservados debe RESTAR 30 del disponible
  INSERT INTO compras (user_id, subtotal, impuesto_total, envio_total, total, moneda,
                       estado, clave_idempotencia, saldo_aplicado)
  VALUES (v_user, 50, 0, 0, 50, 'USD', 'esperando_pago', 'SONDA-MIXTO-'||gen_random_uuid()::text, 30)
  RETURNING id INTO v_compra;

  v_d2 := saldo_hogar_disponible(v_fam);
  IF v_d2 <> v_d1 - 30.00 THEN
    RAISE EXCEPTION 'CINTURÓN: la reserva de 30 no bajó el disponible (% esperado %)', v_d2, v_d1 - 30.00;
  END IF;

  -- al marcar la compra pagada, la reserva se LIBERA (el consumo real lo hace
  -- confirmar_pago_compra; acá sólo verificamos que 'pagada' ya no resta)
  UPDATE compras SET estado='pagada' WHERE id = v_compra;
  v_d3 := saldo_hogar_disponible(v_fam);
  IF v_d3 <> v_d1 THEN
    RAISE EXCEPTION 'CINTURÓN: marcar pagada no liberó la reserva (% esperado %)', v_d3, v_d1;
  END IF;

  -- la puerta existe, es DEFINER y no la alcanza anon
  IF has_function_privilege('anon','public.aplicar_saldo_a_compra(uuid,numeric)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: anon puede ejecutar aplicar_saldo_a_compra';
  END IF;
  IF NOT has_function_privilege('authenticated','public.aplicar_saldo_a_compra(uuid,numeric)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: authenticated no puede ejecutar aplicar_saldo_a_compra';
  END IF;

  -- pagar_compra_con_saldo (la v2) YA NO existe: una cosa, una puerta
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='pagar_compra_con_saldo' AND pronamespace='public'::regnamespace) THEN
    RAISE EXCEPTION 'CINTURÓN: pagar_compra_con_saldo sigue viva — dos puertas sobre la misma plata';
  END IF;

  -- LIMPIEZA (residuo 0)
  DELETE FROM compras WHERE id = v_compra;
  DELETE FROM saldo_hogar_movimientos WHERE clave_idempotencia LIKE 'SONDA-MIXTO%';
  IF saldo_hogar_disponible(v_fam) <> v_d0 THEN
    RAISE EXCEPTION 'CINTURÓN: la sonda dejó residuo (% <> inicial %)', saldo_hogar_disponible(v_fam), v_d0;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · reserva resta el disponible · pagada libera la reserva · puerta DEFINER · pagar_compra_con_saldo retirada · residuo 0';
END $cinturon$;
