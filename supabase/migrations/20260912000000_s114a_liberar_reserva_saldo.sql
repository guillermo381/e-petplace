-- S114-A · 🔴 EL RELOJ QUE SUELTA LA RESERVA DE SALDO — plata que no se cuelga sola.
--
-- INCIDENTE (founder, 9-sep): pagó, el riel rebotó (Nuvei: «order.amount Invalid»),
-- volvió y el saldo ya no estaba. Medido: NO se consumió (cero movimientos) — quedó
-- RESERVADO (saldo_aplicado>0 sobre una compra esperando_pago) y saldo_hogar_disponible
-- lo resta ⇒ disponible=0. El diseño evitó el CONSUMO; lo que faltaba es SOLTAR la
-- reserva cuando el riel no confirma. Hoy NADA la suelta (cero cron sobre compras,
-- cero columna de expiración): la plata se cuelga sola cada vez que un cobro falla.
--
-- FIRMA (founder): la reserva se suelta POR SÍ SOLA, con su reloj y su rojo — no por
-- un acto del usuario, porque el usuario ya se fue.
--
-- DOS liberadores + un reloj:
--  · liberar_reserva_saldo_compra(compra) — suelta UNA (la llama pagos-cobro cuando el
--    riel rebota SÍNCRONO, y este mismo incidente). Idempotente.
--  · liberar_reservas_saldo_vencidas() — el reloj: suelta las que pasaron su ventana
--    (rebote async / webhook que no llegó / usuario que se fue). Cron cada 15 min.
--  · compras.saldo_reservado_hasta — la ventana; la pone aplicar_saldo_a_compra al
--    reservar. Soltar = saldo_aplicado=0 (la reserva deja de restar; el saldo vuelve).
--    NO se toca ningún movimiento: nada se consumió, no hay nada que acreditar.
--
-- La compra queda esperando_pago (retomable): si la familia reintenta, C llama de
-- nuevo a aplicar_saldo_a_compra y re-reserva. Soltar la reserva ≠ matar la compra.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA). Reversa ANTES.

ALTER TABLE public.compras
  ADD COLUMN IF NOT EXISTS saldo_reservado_hasta timestamptz;

COMMENT ON COLUMN public.compras.saldo_reservado_hasta IS
  'S114-A. Hasta cuándo vale la reserva del saldo aplicado a una compra en '
  'esperando_pago. Vencida sin confirmar el riel, el reloj liberar_reservas_saldo_'
  'vencidas() suelta la reserva (saldo_aplicado=0) y el saldo vuelve al hogar. '
  'NULL cuando no hay reserva viva.';

-- ── aplicar_saldo_a_compra pone la ventana al reservar ──────────────────────
-- (CREATE OR REPLACE con el cuerpo de 20260911960000 + saldo_reservado_hasta)
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

  v_disp_sin_esta := saldo_hogar_disponible(v_fam) + COALESCE(v_c.saldo_aplicado, 0);
  v_aplicar := LEAST(COALESCE(p_monto_saldo, v_disp_sin_esta), v_disp_sin_esta, v_c.total);
  IF v_aplicar IS NULL OR v_aplicar < 0 THEN v_aplicar := 0; END IF;
  v_aplicar := ROUND(v_aplicar, 2);

  IF v_aplicar <= 0 THEN
    UPDATE compras
       SET saldo_aplicado = 0, saldo_reservado_hasta = NULL,
           estado = CASE WHEN estado='creada' THEN 'esperando_pago' ELSE estado END,
           updated_at = now()
     WHERE id = p_compra_id;
    RETURN jsonb_build_object('ok',true,'saldo_aplicado',0,
      'resto_a_cobrar', v_c.total, 'requiere_riel', true,
      'saldo_restante', saldo_hogar_disponible(v_fam));
  END IF;

  v_resto := ROUND(v_c.total - v_aplicar, 2);

  IF v_resto <= 0 THEN
    SELECT count(*) INTO v_sin_reserva
      FROM pedidos p
     WHERE p.compra_id = p_compra_id
       AND EXISTS (SELECT 1 FROM pedido_items pi WHERE pi.pedido_id = p.id)
       AND NOT EXISTS (SELECT 1 FROM inventario_reservas ir
                        WHERE ir.pedido_id = p.id AND ir.estado = 'vigente');
    IF v_sin_reserva > 0 THEN
      RETURN jsonb_build_object('ok',false,'codigo','pago_sin_reserva'); END IF;

    -- full-saldo: paga en el acto, sin reserva viva (no va al riel)
    UPDATE compras SET saldo_aplicado = v_c.total, saldo_reservado_hasta = NULL,
           estado = 'pagada', updated_at = now()
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

  -- MIXTO: reserva CON VENTANA. El riel tiene que confirmar antes de que venza;
  -- si no, el reloj la suelta y el saldo vuelve.
  UPDATE compras
     SET saldo_aplicado = v_aplicar,
         saldo_reservado_hasta = now() + interval '30 minutes',
         estado = CASE WHEN estado='creada' THEN 'esperando_pago' ELSE estado END,
         updated_at = now()
   WHERE id = p_compra_id;

  RETURN jsonb_build_object('ok',true,'saldo_aplicado', v_aplicar,
    'resto_a_cobrar', v_resto, 'requiere_riel', true,
    'saldo_restante', saldo_hogar_disponible(v_fam));
END $fn$;
REVOKE ALL ON FUNCTION public.aplicar_saldo_a_compra(uuid, numeric) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.aplicar_saldo_a_compra(uuid, numeric) TO authenticated;

-- ── liberar UNA reserva (la llama pagos-cobro en rebote síncrono) ───────────
CREATE OR REPLACE FUNCTION public.liberar_reserva_saldo_compra(p_compra_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_c record;
BEGIN
  SELECT * INTO v_c FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_c.id IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','compra_no_existe'); END IF;
  -- Sólo suelta una reserva VIVA: esperando_pago con saldo aplicado. Idempotente:
  -- si ya está pagada o sin reserva, no hace nada (no des-consume una pagada).
  IF v_c.estado <> 'esperando_pago' OR COALESCE(v_c.saldo_aplicado,0) <= 0 THEN
    RETURN jsonb_build_object('ok',true,'liberado',false,'codigo','sin_reserva_viva'); END IF;
  UPDATE compras SET saldo_aplicado = 0, saldo_reservado_hasta = NULL, updated_at = now()
   WHERE id = p_compra_id;
  RETURN jsonb_build_object('ok',true,'liberado',true,'monto', v_c.saldo_aplicado);
END $fn$;
REVOKE ALL ON FUNCTION public.liberar_reserva_saldo_compra(uuid) FROM anon, PUBLIC;
-- authenticated NO: la suelta el motor (pagos-cobro con service_role) y el cron.

-- ── el reloj: suelta las reservas vencidas ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.liberar_reservas_saldo_vencidas()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_n int;
BEGIN
  WITH sueltas AS (
    UPDATE compras
       SET saldo_aplicado = 0, saldo_reservado_hasta = NULL, updated_at = now()
     WHERE estado = 'esperando_pago'
       AND saldo_aplicado > 0
       AND saldo_reservado_hasta IS NOT NULL
       AND saldo_reservado_hasta < now()
     RETURNING 1)
  SELECT count(*) INTO v_n FROM sueltas;
  RETURN v_n;
END $fn$;
REVOKE ALL ON FUNCTION public.liberar_reservas_saldo_vencidas() FROM anon, authenticated, PUBLIC;

SELECT cron.schedule('liberar-reservas-saldo', '*/15 * * * *',
  'SELECT public.liberar_reservas_saldo_vencidas()');

-- ── CINTURÓN · el rojo del founder: una reserva vencida se suelta sola ───────
DO $cinturon$
DECLARE
  v_user uuid; v_fam uuid; v_d0 numeric; v_compra_vieja uuid; v_compra_nueva uuid;
  v_n int; v_disp_con_reservas numeric;
BEGIN
  SELECT c.user_id, _familia_del_user(c.user_id) INTO v_user, v_fam
    FROM compras c WHERE _familia_del_user(c.user_id) IS NOT NULL LIMIT 1;
  v_d0 := saldo_hogar_disponible(v_fam);
  PERFORM acreditar_saldo_hogar(v_fam, 100.00, 'ajuste', 'SONDA-LIB-cred', NULL);

  -- una reserva VENCIDA (hace 1 hora) y una VIGENTE (vence en 1 hora)
  INSERT INTO compras (user_id, subtotal, impuesto_total, envio_total, total, moneda,
                       estado, clave_idempotencia, saldo_aplicado, saldo_reservado_hasta)
  VALUES (v_user, 50,0,0,50,'USD','esperando_pago','SONDA-LIB-vieja-'||gen_random_uuid()::text, 30, now() - interval '1 hour')
  RETURNING id INTO v_compra_vieja;
  INSERT INTO compras (user_id, subtotal, impuesto_total, envio_total, total, moneda,
                       estado, clave_idempotencia, saldo_aplicado, saldo_reservado_hasta)
  VALUES (v_user, 50,0,0,50,'USD','esperando_pago','SONDA-LIB-nueva-'||gen_random_uuid()::text, 20, now() + interval '1 hour')
  RETURNING id INTO v_compra_nueva;

  -- las dos reservas restan: disponible = d0 + 100 - 30 - 20 = d0 + 50
  v_disp_con_reservas := saldo_hogar_disponible(v_fam);
  IF v_disp_con_reservas <> v_d0 + 50.00 THEN
    RAISE EXCEPTION 'CINTURÓN: las dos reservas no restaron bien (% esperado %)', v_disp_con_reservas, v_d0 + 50.00; END IF;

  -- el reloj: suelta SÓLO la vencida
  v_n := liberar_reservas_saldo_vencidas();
  IF v_n < 1 THEN RAISE EXCEPTION 'CINTURÓN: el reloj no soltó ninguna reserva vencida'; END IF;

  -- la vieja quedó liberada (saldo_aplicado 0), la nueva intacta (20 sigue restando)
  IF (SELECT saldo_aplicado FROM compras WHERE id=v_compra_vieja) <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN: la reserva VENCIDA no se soltó'; END IF;
  IF (SELECT saldo_aplicado FROM compras WHERE id=v_compra_nueva) <> 20 THEN
    RAISE EXCEPTION 'CINTURÓN: el reloj tocó una reserva VIGENTE (no debía)'; END IF;
  -- disponible recuperó los 30 de la vencida: d0 + 100 - 20 = d0 + 80
  IF saldo_hogar_disponible(v_fam) <> v_d0 + 80.00 THEN
    RAISE EXCEPTION 'CINTURÓN: el saldo no volvió tras soltar la vencida (% esperado %)', saldo_hogar_disponible(v_fam), v_d0 + 80.00; END IF;

  -- liberar_reserva_saldo_compra suelta la nueva a mano (el camino síncrono de pagos-cobro)
  PERFORM liberar_reserva_saldo_compra(v_compra_nueva);
  IF (SELECT saldo_aplicado FROM compras WHERE id=v_compra_nueva) <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN: liberar_reserva_saldo_compra no soltó la reserva'; END IF;

  -- idempotente: soltar una ya suelta no rompe ni des-consume
  IF (liberar_reserva_saldo_compra(v_compra_nueva)->>'liberado')::boolean <> false THEN
    RAISE EXCEPTION 'CINTURÓN: liberar dos veces no es idempotente'; END IF;

  -- LIMPIEZA (residuo 0)
  DELETE FROM compras WHERE id IN (v_compra_vieja, v_compra_nueva);
  DELETE FROM saldo_hogar_movimientos WHERE clave_idempotencia LIKE 'SONDA-LIB%';
  IF saldo_hogar_disponible(v_fam) <> v_d0 THEN
    RAISE EXCEPTION 'CINTURÓN: la sonda dejó residuo (% <> %)', saldo_hogar_disponible(v_fam), v_d0; END IF;

  RAISE NOTICE 'CINTURÓN VERDE · reloj suelta SÓLO la vencida · la vigente intacta · saldo vuelve · liberar_una idempotente · residuo 0';
END $cinturon$;
