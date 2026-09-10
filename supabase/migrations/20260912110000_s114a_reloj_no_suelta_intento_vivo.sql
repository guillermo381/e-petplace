-- S114-A · D-1052 (SPLIT · la condición del reloj) — el reloj de reserva no suelta
-- si hay un cobro VIVO para esa compra. Firma del founder (9-sep).
--
-- ANTES: liberar_reservas_saldo_vencidas() soltaba TODA compra esperando_pago con
-- saldo reservado vencido, SIN mirar si el riel ya cobró o está en vuelo ⇒ una
-- reserva que vence mientras la pasarela aprueba dejaba a la familia pagando de
-- más (riel cobró total−saldo, reloj devolvió el saldo, confirmar rebota después).
-- AHORA: no suelta si existe un intento en estado ('pendiente','aprobado') para la
-- compra. El reloj suelta checkouts MUERTOS; el barrido pagos-conciliar resuelve
-- los VIVOS. (a) sobre (b): (b) sola dejaría colgada una reserva si el riel rechazó
-- async sin registrarse; (a) igual la suelta cuando el intento pasa a 'rechazado'.
--
-- ⚠️ SPLIT DECLARADO: el TECHO de 24h (expirar un pendiente eterno + escalar por el
-- motor + soltar) NO va en esta tanda — el escalado a la casa exige una clase de
-- audiencia que no existe (D-1054). El release está ACOPLADO al escalado y no se
-- implementa suelto (D-1053). INTERINO: un intento que nunca resuelve deja su
-- reserva RETENIDA indefinidamente (visible y recuperable a mano con
-- liberar_reserva_saldo_compra); es una decisión tomada, no un olvido.
--
-- Alcance: SÓLO el cron liberar_reservas_saldo_vencidas. liberar_reserva_saldo_compra
-- (que llama pagos-cobro en el rebote síncrono, y que es el destrabe MANUAL) NO se
-- toca. 76(g) NO RIGE (DB, sin anclas de OTA). Reversa ANTES en docs/relevamientos.

CREATE OR REPLACE FUNCTION public.liberar_reservas_saldo_vencidas()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_n int;
BEGIN
  WITH sueltas AS (
    UPDATE compras
       SET saldo_aplicado = 0, saldo_reservado_hasta = NULL, updated_at = now()
     WHERE estado = 'esperando_pago'
       AND saldo_aplicado > 0
       AND saldo_reservado_hasta IS NOT NULL
       AND saldo_reservado_hasta < now()
       -- 🔴 NO SUELTA SI HAY COBRO VIVO: el barrido resuelve estos, no el reloj.
       AND NOT EXISTS (
         SELECT 1 FROM pagos_intentos pi
          WHERE pi.compra_id = compras.id
            AND pi.estado IN ('pendiente','aprobado'))
     RETURNING 1)
  SELECT count(*) INTO v_n FROM sueltas;
  RETURN v_n;
END $function$;
REVOKE ALL ON FUNCTION public.liberar_reservas_saldo_vencidas() FROM anon, PUBLIC;

-- ── CINTURÓN · sonda con ROLLBACK (subtransacción; no toca datos reales) ──────
DO $cinturon$
DECLARE
  v_user uuid; v_cc uuid; v_ped uuid := gen_random_uuid();
  v_a uuid := gen_random_uuid(); v_b uuid := gen_random_uuid();
  v_a_saldo numeric; v_b_saldo numeric;
BEGIN
  SELECT id INTO v_user FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT cuenta_comercial_id INTO v_cc FROM prestadores WHERE cuenta_comercial_id IS NOT NULL LIMIT 1;
  BEGIN
    -- compra A: vencida + intento VIVO (pendiente) ⇒ NO debe soltarse (rojo ①)
    INSERT INTO compras (id,user_id,total,estado,saldo_aplicado,saldo_reservado_hasta,clave_idempotencia)
      VALUES (v_a, v_user, 20, 'esperando_pago', 10, now() - interval '1 hour', 'sonda-reloj-A-'||v_a::text);
    -- el intento exige UN sujeto (chk_intento_un_solo_sujeto): un pedido lo es.
    INSERT INTO pedidos (id,user_id,subtotal,impuesto_total,costo_envio,total,cuenta_comercial_id,compra_id,estado)
      VALUES (v_ped, v_user, 20, 0, 0, 20, v_cc, v_a, 'creado');
    INSERT INTO pagos_intentos (compra_id,pedido_id,proveedor,forma,monto,estado,clave_idempotencia,pagador_user_id,pagador_origen)
      VALUES (v_a, v_ped, 'nuvei', 'tokenizacion', 10, 'pendiente', 'sonda-int-A-'||v_a::text, v_user, 'sesion');
    -- compra B: vencida + SIN intento vivo ⇒ SÍ debe soltarse (verde)
    INSERT INTO compras (id,user_id,total,estado,saldo_aplicado,saldo_reservado_hasta,clave_idempotencia)
      VALUES (v_b, v_user, 20, 'esperando_pago', 10, now() - interval '1 hour', 'sonda-reloj-B-'||v_b::text);

    PERFORM liberar_reservas_saldo_vencidas();

    SELECT saldo_aplicado INTO v_a_saldo FROM compras WHERE id = v_a;
    SELECT saldo_aplicado INTO v_b_saldo FROM compras WHERE id = v_b;

    RAISE EXCEPTION 'ROLLBACK_SONDA';  -- revierte todo lo insertado y el efecto de la función
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'ROLLBACK_SONDA' THEN RAISE; END IF;
  END;

  IF v_a_saldo IS DISTINCT FROM 10 THEN
    RAISE EXCEPTION 'CINTURÓN ROJO ①: la compra con intento VIVO se soltó (saldo_aplicado=% esperado 10)', v_a_saldo;
  END IF;
  IF v_b_saldo IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'CINTURÓN VERDE: la compra SIN intento vivo NO se soltó (saldo_aplicado=% esperado 0)', v_b_saldo;
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · rojo ① (vivo NO se suelta: %) · verde (muerto se suelta: %) · residuo 0 (subtx revertida)', v_a_saldo, v_b_saldo;
END $cinturon$;
