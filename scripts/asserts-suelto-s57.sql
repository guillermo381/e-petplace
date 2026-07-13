-- ═══════════════════════════════════════════════════════════════════
-- S57-A3 — Asserts imperativos de CANCELACIÓN Y REAGENDA DEL SUELTO
-- (P18) con ROLLBACK del camino completo. Correr con:
--   npx supabase --experimental db query --linked -f scripts/asserts-suelto-s57.sql
-- Termina SIEMPRE en RAISE EXCEPTION (ASSERTS_OK = todo pasó y todo se
-- revierte). El tiempo se simula moviendo filas como postgres (L-122a).
-- ═══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_user      uuid;
  v_prestador uuid;
  v_mascota   uuid;
  v_serv30    uuid;
  v_serv120   uuid;
  v_sabado    date;
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_ahora     timestamp := (now() AT TIME ZONE 'America/Guayaquil');
  v_ledger0   int;
  v_r         jsonb;
  v_c30       uuid;   -- cita suelta 30'
  v_c120      uuid;   -- cita suelta 120'
  v_cpq       uuid;   -- cita de paquete (guard)
  v_ev        record;
  v_n         int;
  v_rep       text := E'\n';
BEGIN
  SELECT u.id INTO v_user FROM auth.users u JOIN prestadores p ON p.user_id=u.id WHERE u.email LIKE '%demo%' LIMIT 1;
  SELECT p.id INTO v_prestador FROM prestadores p WHERE p.user_id = v_user;
  SELECT m.id INTO v_mascota FROM mascotas m JOIN familia_miembro fm ON fm.familia_id=m.familia_id
  WHERE m.nombre='Zeus' AND fm.user_id=v_user LIMIT 1;
  SELECT ps.id INTO v_serv30 FROM prestador_servicios ps
  WHERE ps.prestador_id=v_prestador AND ps.tipo_servicio='paseo' AND ps.duracion_minutos=30 AND ps.activo;
  SELECT ps.id INTO v_serv120 FROM prestador_servicios ps
  WHERE ps.prestador_id=v_prestador AND ps.tipo_servicio='paseo' AND ps.duracion_minutos=120 AND ps.activo;
  IF v_serv30 IS NULL OR v_serv120 IS NULL THEN
    RAISE EXCEPTION 'PRECONDICION: faltan ofertas demo 30/120';
  END IF;
  v_sabado := v_hoy + ((6 - EXTRACT(DOW FROM v_hoy)::int + 7) % 7);
  IF v_sabado = v_hoy THEN v_sabado := v_sabado + 7; END IF;
  SELECT count(*) INTO v_ledger0 FROM eventos_economicos;
  v_rep := v_rep || 'T0 baseline ledger=' || v_ledger0 || ' sábado=' || v_sabado || E'\n';

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- ── T1: nace el suelto pagado (hold + pago simulado del flujo S54) ──
  v_r := crear_bloqueo_agenda(v_prestador, v_serv30, v_mascota, v_sabado, '11:00');
  v_c30 := (v_r->>'cita_id')::uuid;
  v_r := confirmar_cita_pagada(v_c30);
  IF (v_r->>'estado_reserva') <> 'pagada' THEN RAISE EXCEPTION 'FALLO T1: %', v_r; END IF;
  v_rep := v_rep || 'T1 suelto 30'' pagado (hold→pago simulado) ✓' || E'\n';

  -- ── T2: reagendar ≥24 h — franja real, re-snapshot, la vieja se libera ──
  v_r := reagendar_cita_suelta(v_c30, v_sabado, '11:30');
  SELECT fecha, hora, metadata->'reagendada_de'->>'hora' AS de_hora,
         estado, estado_reserva INTO v_ev
  FROM evento_cita_servicio WHERE id = v_c30;
  IF v_ev.hora <> '11:30' OR v_ev.de_hora <> '11:00:00'
     OR v_ev.estado <> 'confirmada' OR v_ev.estado_reserva <> 'pagada' THEN
    RAISE EXCEPTION 'FALLO T2: reagenda mal formada (% % %)', v_ev.hora, v_ev.de_hora, v_ev.estado;
  END IF;
  EXECUTE 'RESET ROLE';
  IF _agenda_ocupacion(v_prestador, v_sabado, '11:00', 30) <> 0 THEN
    RAISE EXCEPTION 'FALLO T2: la franja vieja NO se liberó';
  END IF;
  IF (SELECT fecha_evento FROM eventos_mascota em JOIN evento_cita_servicio c ON c.evento_id=em.id WHERE c.id=v_c30)
     <> (v_sabado + time '11:30') THEN
    RAISE EXCEPTION 'FALLO T2: el hito padre no siguió a la cita';
  END IF;
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 THEN RAISE EXCEPTION 'FALLO T2: reagendar tocó el ledger'; END IF;
  v_rep := v_rep || 'T2 reagenda 11:00→11:30, franja vieja LIBRE, hito padre sigue, ledger INTACTO ✓' || E'\n';

  -- ── T3: D-349 — el auto-solape NO rebota (cupo 1, ventana propia) ──
  v_r := crear_bloqueo_agenda(v_prestador, v_serv120, v_mascota, v_sabado, '08:00');
  v_c120 := (v_r->>'cita_id')::uuid;
  v_r := confirmar_cita_pagada(v_c120);
  -- mover 08:00-10:00 → 09:00-11:00: solapa SU PROPIA ventana vieja.
  -- Sin la cura, _agenda_ocupacion se cuenta a sí misma y rebota
  -- slot_ocupado con cupo 1. Con la cura, pasa.
  v_r := reagendar_cita_suelta(v_c120, v_sabado, '09:00');
  IF (v_r->>'hora') <> '09:00:00' THEN RAISE EXCEPTION 'FALLO T3: %', v_r; END IF;
  v_rep := v_rep || 'T3 D-349: mover 120'' sobre su propia ventana (08→09) PASA con cupo 1 ✓' || E'\n';

  -- ── T4: cancelar ≥24 h — reembolso SIMULADO DECLARADO sobre el pago ──
  v_r := cancelar_cita_suelta(v_c120);
  SELECT estado, estado_reserva,
         (metadata->'reembolso_simulado'->>'monto')::numeric AS monto,
         (metadata->'reembolso_simulado'->>'simulado')::boolean AS simulado
  INTO v_ev FROM evento_cita_servicio WHERE id = v_c120;
  IF v_ev.estado <> 'cancelada' OR v_ev.estado_reserva <> 'cancelada'
     OR v_ev.monto <> 10.00 OR NOT v_ev.simulado THEN
    RAISE EXCEPTION 'FALLO T4: cancelación mal declarada (% % % %)', v_ev.estado, v_ev.estado_reserva, v_ev.monto, v_ev.simulado;
  END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 THEN RAISE EXCEPTION 'FALLO T4: la cancelación tocó el ledger (7.16 violada)'; END IF;
  EXECUTE 'RESET ROLE';
  IF _agenda_ocupacion(v_prestador, v_sabado, '09:00', 120) <> 0 THEN
    RAISE EXCEPTION 'FALLO T4: la franja cancelada NO se liberó';
  END IF;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_rep := v_rep || 'T4 cancelación ≥24h: declarada sobre el pago ($10 simulado), franja libre, ledger INTACTO ✓' || E'\n';

  -- ── T5: ventana (b) 24-2 h — cancelar NO, reagendar SÍ ──
  EXECUTE 'RESET ROLE';
  UPDATE evento_cita_servicio
  SET fecha = v_hoy, hora = (v_ahora + interval '3 hours')::time
  WHERE id = v_c30;
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    v_r := cancelar_cita_suelta(v_c30);
    RAISE EXCEPTION 'FALLO T5a: cancelar con 3 h NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'ventana_cancelacion_vencida%' THEN RAISE EXCEPTION 'FALLO T5a: %', SQLERRM; END IF;
  END;
  v_r := reagendar_cita_suelta(v_c30, v_sabado, '11:00');
  IF (v_r->>'fecha')::date <> v_sabado THEN RAISE EXCEPTION 'FALLO T5b: %', v_r; END IF;
  v_rep := v_rep || 'T5 ventana (b): cancelar rebota tipado, reagendar mueve ✓' || E'\n';

  -- ── T6: ventana (c) <2 h — tampoco se reagenda ──
  EXECUTE 'RESET ROLE';
  UPDATE evento_cita_servicio
  SET fecha = v_hoy, hora = (v_ahora + interval '1 hour')::time
  WHERE id = v_c30;
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    v_r := reagendar_cita_suelta(v_c30, v_sabado, '11:00');
    RAISE EXCEPTION 'FALLO T6: reagendar con 1 h NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'ventana_vencida%' THEN RAISE EXCEPTION 'FALLO T6: %', SQLERRM; END IF;
  END;
  v_rep := v_rep || 'T6 ventana (c): <2 h ya no se mueve (ventana_vencida) ✓' || E'\n';

  -- ── T7: no_show del suelto — el paseador devenga al precio snapshoteado ──
  EXECUTE 'RESET ROLE';
  UPDATE evento_cita_servicio SET fecha = v_hoy - 1 WHERE id = v_c30;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_r := marcar_no_show_cita(v_c30);
  SELECT ee.monto_bruto, ee.monto_payout, ee.monto_plataforma, ee.metadata->>'cierre' AS cierre
  INTO v_ev FROM eventos_economicos ee WHERE ee.id = (v_r->>'evento_economico_id')::uuid;
  IF v_ev.monto_bruto <> 6.00 OR v_ev.monto_payout <> 5.10 OR v_ev.monto_plataforma <> 0.90
     OR v_ev.cierre <> 'no_show' THEN
    RAISE EXCEPTION 'FALLO T7: devengo no_show mal formado (bruto=% payout=% plat=%)', v_ev.monto_bruto, v_ev.monto_payout, v_ev.monto_plataforma;
  END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 + 1 THEN RAISE EXCEPTION 'FALLO T7: ledger esperaba +1'; END IF;
  v_rep := v_rep || 'T7 no_show suelto devenga $6.00 snapshoteado (payout 5.10/plataforma 0.90) ✓' || E'\n';

  -- ── T8: los guards de familia — plan y paquete rebotan tipado ──
  EXECUTE 'RESET ROLE';
  UPDATE prestador_servicios SET precio_paquete = 5.00 WHERE id = v_serv30;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_r := comprar_paquete_salidas(v_prestador, v_serv30, v_mascota, 5);
  v_r := reservar_salida_paquete(v_prestador, v_serv30, v_mascota, v_sabado, '11:00');
  v_cpq := (v_r->>'cita_id')::uuid;
  BEGIN
    v_r := cancelar_cita_suelta(v_cpq);
    RAISE EXCEPTION 'FALLO T8a: cancelar_cita_suelta aceptó una cita de paquete';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'cita_es_de_paquete%' THEN RAISE EXCEPTION 'FALLO T8a: %', SQLERRM; END IF;
  END;
  SELECT c.id INTO v_cpq FROM evento_cita_servicio c
  WHERE c.user_id = v_user AND c.suscripcion_servicio_id IS NOT NULL AND c.estado = 'confirmada'
  LIMIT 1;
  IF v_cpq IS NOT NULL THEN
    BEGIN
      v_r := reagendar_cita_suelta(v_cpq, v_sabado, '11:30');
      RAISE EXCEPTION 'FALLO T8b: reagendar_cita_suelta aceptó una cita de plan';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM NOT LIKE 'cita_es_de_plan%' THEN RAISE EXCEPTION 'FALLO T8b: %', SQLERRM; END IF;
    END;
    v_rep := v_rep || 'T8 guards: paquete y plan rebotan tipado (cada familia con su política) ✓' || E'\n';
  ELSE
    v_rep := v_rep || 'T8 guard paquete ✓ (plan sin cita viva para probar — declarado)' || E'\n';
  END IF;

  RAISE EXCEPTION 'ASSERTS_OK (8/8) — todo se revierte ahora.%', v_rep;
END $$;
