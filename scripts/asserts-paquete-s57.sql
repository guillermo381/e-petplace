-- ═══════════════════════════════════════════════════════════════════
-- S57-A2c — Asserts imperativos del PAQUETE DE SALIDAS (D-343) con
-- ROLLBACK del camino completo. Se corre con:
--   npx supabase --experimental db query --linked "$(cat scripts/asserts-paquete-s57.sql)"
--
-- El bloque termina SIEMPRE en RAISE EXCEPTION: si todo pasó, el
-- mensaje empieza con ASSERTS_OK y trae el reporte — la excepción ES el
-- rollback (patrón L-135: la verificación sobrevive al test). Cero
-- residuos garantizados por diseño.
--
-- Camino (mandato S57-A2c): comprar → reservar → cancelar en ventana
-- (vuelve al saldo) → reservar → no_show (devenga a precio de ORIGEN)
-- → renovar con rollover (FIFO: las viejas primero) → vencer sin
-- renovar (breakage). Ledger LITERAL verificado en cada paso.
-- El tiempo se simula moviendo filas (fecha/vencimiento) como postgres
-- dentro de la transacción — now() es constante (L-122a).
-- ═══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_email      text;
  v_user       uuid;
  v_prestador  uuid;
  v_mascota    uuid;
  v_servicio   uuid;
  v_sabado     date;
  v_hoy        date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_ledger0    int;
  v_bonos0     int;
  v_r          jsonb;
  v_bono1      uuid;
  v_bono2      uuid;
  v_cita       uuid;
  v_c2         uuid;
  v_ev         record;
  v_n          int;
  v_txt        text;
  v_rep        text := E'\n';
BEGIN
  -- ── fixtures (todo leído de DB, D-352 rige también acá) ──
  SELECT u.email, u.id INTO v_email, v_user FROM auth.users u
  JOIN prestadores p ON p.user_id = u.id WHERE u.email LIKE '%demo%' LIMIT 1;
  SELECT p.id INTO v_prestador FROM prestadores p WHERE p.user_id = v_user;
  SELECT m.id INTO v_mascota FROM mascotas m
  JOIN familia_miembro fm ON fm.familia_id = m.familia_id
  WHERE m.nombre = 'Zeus' AND fm.user_id = v_user LIMIT 1;
  SELECT ps.id INTO v_servicio FROM prestador_servicios ps
  WHERE ps.prestador_id = v_prestador AND ps.tipo_servicio = 'paseo'
    AND ps.duracion_minutos = 30 AND ps.activo;
  IF v_user IS NULL OR v_mascota IS NULL OR v_servicio IS NULL THEN
    RAISE EXCEPTION 'PRECONDICION: fixtures demo incompletas (user=% mascota=% servicio=%)', v_user, v_mascota, v_servicio;
  END IF;
  v_sabado := v_hoy + ((6 - EXTRACT(DOW FROM v_hoy)::int + 7) % 7);
  IF v_sabado = v_hoy THEN v_sabado := v_sabado + 7; END IF;

  SELECT count(*) INTO v_ledger0 FROM eventos_economicos;
  SELECT count(*) INTO v_bonos0 FROM bonos;
  v_rep := v_rep || 'T0 baseline: ledger=' || v_ledger0 || ' bonos=' || v_bonos0 || E'\n';

  -- claims del dueño demo (L-052): las RPCs gatean por auth.uid()
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- ── T1: preset fuera de la letra rebota ──
  BEGIN
    v_r := comprar_paquete_salidas(v_prestador, v_servicio, v_mascota, 7);
    RAISE EXCEPTION 'FALLO T1: preset 7 NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'preset_invalido%' THEN RAISE EXCEPTION 'FALLO T1: error inesperado %', SQLERRM; END IF;
  END;
  v_rep := v_rep || 'T1 preset invalido rebota tipado ✓' || E'\n';

  -- ── T2: bloque sin precio_paquete configurado rebota ──
  BEGIN
    v_r := comprar_paquete_salidas(v_prestador, v_servicio, v_mascota, 5);
    RAISE EXCEPTION 'FALLO T2: compra sin precio_paquete NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'paquete_no_disponible%' THEN RAISE EXCEPTION 'FALLO T2: error inesperado %', SQLERRM; END IF;
  END;
  v_rep := v_rep || 'T2 sin precio_paquete rebota tipado ✓' || E'\n';

  -- ── T3: el prestador enciende el paquete ($5.00/salida) y el dueño compra 5 ──
  EXECUTE 'RESET ROLE';
  UPDATE prestador_servicios SET precio_paquete = 5.00 WHERE id = v_servicio;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_r := comprar_paquete_salidas(v_prestador, v_servicio, v_mascota, 5);
  v_bono1 := (v_r->>'bono_id')::uuid;
  IF (v_r->>'total')::numeric <> 25.00 OR (v_r->>'precio_por_unidad')::numeric <> 5.00
     OR (v_r->>'saldo_total')::int <> 5 OR (v_r->>'salidas_rollover')::int <> 0 THEN
    RAISE EXCEPTION 'FALLO T3: compra mal formada %', v_r;
  END IF;
  IF (v_r->>'vence_el')::date <> (v_hoy + interval '1 month')::date THEN
    RAISE EXCEPTION 'FALLO T3: vigencia no es mensual %', v_r->>'vence_el';
  END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 THEN RAISE EXCEPTION 'FALLO T3: el pago del paquete TOCÓ el ledger (%→%)', v_ledger0, v_n; END IF;
  -- el bono1 "se compró ayer": now() es constante en la transacción
  -- (L-122a) y sin esto el FIFO de T9 no tendría cronología que ordenar
  EXECUTE 'RESET ROLE';
  UPDATE bonos SET fecha_compra = v_hoy - 1, created_at = created_at - interval '1 day'
  WHERE id = v_bono1;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_rep := v_rep || 'T3 compra 5×$5.00=$25, vence ' || (v_r->>'vence_el') || ', ledger INTACTO ✓' || E'\n';

  -- ── T4: reservar contra saldo — cita firme y cubierta SIN pago ──
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_mascota, v_sabado, '08:00');
  v_cita := (v_r->>'cita_id')::uuid;
  SELECT estado, estado_reserva, precio, bono_id, metadata->>'origen' AS origen
  INTO v_ev FROM evento_cita_servicio WHERE id = v_cita;
  IF v_ev.estado <> 'confirmada' OR v_ev.estado_reserva <> 'pagada'
     OR v_ev.precio <> 5.00 OR v_ev.bono_id <> v_bono1 OR v_ev.origen <> 'paquete' THEN
    RAISE EXCEPTION 'FALLO T4: cita mal formada % % % % %', v_ev.estado, v_ev.estado_reserva, v_ev.precio, v_ev.bono_id, v_ev.origen;
  END IF;
  SELECT unidades_usadas INTO v_n FROM bonos WHERE id = v_bono1;
  IF v_n <> 1 OR (v_r->>'saldo_restante')::int <> 4 THEN RAISE EXCEPTION 'FALLO T4: saldo mal (usadas=% r=%)', v_n, v_r; END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 THEN RAISE EXCEPTION 'FALLO T4: reservar tocó el ledger'; END IF;
  v_rep := v_rep || 'T4 reserva confirmada+pagada a precio de origen, saldo 4, ledger INTACTO ✓' || E'\n';

  -- ── T5: cancelar en ventana (≥2 h) — la salida VUELVE al saldo ──
  v_r := cancelar_reserva_paquete(v_cita);
  SELECT estado INTO v_txt FROM evento_cita_servicio WHERE id = v_cita;
  SELECT unidades_usadas INTO v_n FROM bonos WHERE id = v_bono1;
  IF v_txt <> 'cancelada' OR v_n <> 0 OR (v_r->>'saldo')::int <> 5 THEN
    RAISE EXCEPTION 'FALLO T5: cancelación no devolvió la salida (estado=% usadas=% r=%)', v_txt, v_n, v_r;
  END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 THEN RAISE EXCEPTION 'FALLO T5: cancelar tocó el ledger'; END IF;
  v_rep := v_rep || 'T5 cancelación en ventana: salida al saldo (5), ledger INTACTO ✓' || E'\n';

  -- ── T6: la franja quedó LIBRE — se re-reserva el mismo slot ──
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_mascota, v_sabado, '08:00');
  v_cita := (v_r->>'cita_id')::uuid;
  v_rep := v_rep || 'T6 franja liberada re-reservada (mismo slot) ✓' || E'\n';

  -- ── T7: no_show — el paseador DEVENGA al precio de ORIGEN ──
  -- (a) antes de la hora de recogida, marcar rebota (gate S57)
  BEGIN
    v_r := marcar_no_show_cita(v_cita);
    RAISE EXCEPTION 'FALLO T7a: no_show ANTES de la hora NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'cita_aun_no_ocurre%' THEN RAISE EXCEPTION 'FALLO T7a: error inesperado %', SQLERRM; END IF;
  END;
  -- (b) la cita "ocurre" (se mueve a ayer, como postgres) y no vino
  EXECUTE 'RESET ROLE';
  UPDATE evento_cita_servicio SET fecha = v_hoy - 1 WHERE id = v_cita;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_r := marcar_no_show_cita(v_cita);
  IF (v_r->>'estado') <> 'no_show' OR (v_r->>'evento_economico_id') IS NULL THEN
    RAISE EXCEPTION 'FALLO T7b: no_show sin devengo %', v_r;
  END IF;
  SELECT ee.tipo_evento::text AS tipo, ee.monto_bruto, ee.monto_plataforma, ee.monto_payout,
         ee.estado::text AS estado, ee.metadata->>'cierre' AS cierre
  INTO v_ev FROM eventos_economicos ee WHERE ee.id = (v_r->>'evento_economico_id')::uuid;
  IF v_ev.tipo <> 'cita_pagada' OR v_ev.monto_bruto <> 5.00 OR v_ev.cierre <> 'no_show'
     OR v_ev.monto_payout <> 4.25 OR v_ev.monto_plataforma <> 0.75 THEN
    RAISE EXCEPTION 'FALLO T7b: evento no_show mal formado: tipo=% bruto=% plat=% payout=% cierre=%',
      v_ev.tipo, v_ev.monto_bruto, v_ev.monto_plataforma, v_ev.monto_payout, v_ev.cierre;
  END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 + 1 THEN RAISE EXCEPTION 'FALLO T7b: ledger esperaba +1'; END IF;
  -- (c) la salida quedó CONSUMIDA (no vuelve) y el guard anti-duplicado rige
  SELECT unidades_usadas INTO v_n FROM bonos WHERE id = v_bono1;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALLO T7c: la salida del no_show volvió al saldo'; END IF;
  BEGIN
    v_r := marcar_no_show_cita(v_cita);
    RAISE EXCEPTION 'FALLO T7d: doble no_show NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'cita_estado_invalido_para_no_show%' THEN RAISE EXCEPTION 'FALLO T7d: %', SQLERRM; END IF;
  END;
  v_rep := v_rep || 'T7 no_show devenga $5.00 origen (payout $4.25 / plataforma $0.75), salida consumida, anti-duplicado ✓' || E'\n';

  -- ── T8: RENOVAR con rollover — precio nuevo, saldo viejo se suma ──
  EXECUTE 'RESET ROLE';
  UPDATE prestador_servicios SET precio_paquete = 5.50 WHERE id = v_servicio;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_r := comprar_paquete_salidas(v_prestador, v_servicio, v_mascota, 5);
  v_bono2 := (v_r->>'bono_id')::uuid;
  IF (v_r->>'salidas_rollover')::int <> 4 OR (v_r->>'saldo_total')::int <> 9
     OR (v_r->>'precio_por_unidad')::numeric <> 5.50 THEN
    RAISE EXCEPTION 'FALLO T8: rollover mal (%)', v_r;
  END IF;
  IF (SELECT fecha_vencimiento FROM bonos WHERE id = v_bono1)
     <> (SELECT fecha_vencimiento FROM bonos WHERE id = v_bono2) THEN
    RAISE EXCEPTION 'FALLO T8: la vigencia del bono viejo no se extendió';
  END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 + 1 THEN RAISE EXCEPTION 'FALLO T8: el rollover generó evento económico (prohibido: transferencia de saldo)'; END IF;
  v_rep := v_rep || 'T8 rollover: 4 viejas + 5 nuevas = 9, vigencia extendida, SIN evento económico ✓' || E'\n';

  -- ── T9: FIFO — las viejas se gastan primero, cada una a SU precio ──
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_mascota, v_sabado, '08:30');
  IF (SELECT bono_id FROM evento_cita_servicio WHERE id = (v_r->>'cita_id')::uuid) <> v_bono1
     OR (v_r->>'precio_origen')::numeric <> 5.00 THEN
    RAISE EXCEPTION 'FALLO T9a: FIFO no tomó el bono viejo (%)', v_r;
  END IF;
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_mascota, v_sabado, '09:00');
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_mascota, v_sabado, '09:30');
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_mascota, v_sabado, '10:00');
  SELECT estado, unidades_usadas INTO v_ev FROM bonos WHERE id = v_bono1;
  IF v_ev.estado <> 'agotado' OR v_ev.unidades_usadas <> 5 THEN
    RAISE EXCEPTION 'FALLO T9b: bono viejo no se agotó (% %)', v_ev.estado, v_ev.unidades_usadas;
  END IF;
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_mascota, v_sabado, '10:30');
  v_c2 := (v_r->>'cita_id')::uuid;
  IF (SELECT bono_id FROM evento_cita_servicio WHERE id = v_c2) <> v_bono2
     OR (v_r->>'precio_origen')::numeric <> 5.50 THEN
    RAISE EXCEPTION 'FALLO T9c: la 6ª salida no saltó al bono nuevo a $5.50 (%)', v_r;
  END IF;
  v_rep := v_rep || 'T9 FIFO: 5 viejas a $5.00 (bono agotado), la 6ª del nuevo a $5.50 ✓' || E'\n';

  -- ── T10: <2 h ya no se cancela (P16b: rige el no-show) ──
  EXECUTE 'RESET ROLE';
  UPDATE evento_cita_servicio
  SET fecha = v_hoy, hora = ((now() AT TIME ZONE 'America/Guayaquil') + interval '90 minutes')::time
  WHERE id = v_c2;
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    v_r := cancelar_reserva_paquete(v_c2);
    RAISE EXCEPTION 'FALLO T10: cancelar con <2 h NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'ventana_vencida%' THEN RAISE EXCEPTION 'FALLO T10: %', SQLERRM; END IF;
  END;
  v_rep := v_rep || 'T10 <2 h rebota tipado (ventana_vencida) ✓' || E'\n';

  -- ── T11: aviso de vencimiento — UNO y sereno, jamás dos ──
  EXECUTE 'RESET ROLE';
  UPDATE bonos SET fecha_vencimiento = v_hoy + 2 WHERE id = v_bono2;
  v_r := vencer_paquetes_salidas();
  IF (v_r->>'avisados')::int <> 1 THEN RAISE EXCEPTION 'FALLO T11a: esperaba 1 avisado (%)', v_r; END IF;
  SELECT count(*) INTO v_n FROM notificaciones
  WHERE user_id = v_user AND datos->>'subtipo' = 'paquete_vencimiento';
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALLO T11a: notificación no nació'; END IF;
  v_r := vencer_paquetes_salidas();
  IF (v_r->>'avisados')::int <> 0 THEN RAISE EXCEPTION 'FALLO T11b: el aviso se repitió (dark pattern)'; END IF;
  v_rep := v_rep || 'T11 aviso sereno: UNO (idempotente en la 2ª corrida) ✓' || E'\n';

  -- ── T12: vencer sin renovar — BREAKAGE declarado, plataforma, sin payout ──
  -- solo el bono2 (activo): el bono1 agotado prueba justamente que el
  -- pase de vencimiento no lo toca. Compra y vencimiento retro-datados
  -- JUNTOS (CHECK bonos_vencimiento_valido: vencimiento > compra).
  UPDATE bonos SET fecha_compra = v_hoy - 32, fecha_vencimiento = v_hoy - 1 WHERE id = v_bono2;
  v_r := vencer_paquetes_salidas();
  IF (v_r->>'vencidos')::int <> 1 OR (v_r->>'breakage_total')::numeric <> 22.00 THEN
    RAISE EXCEPTION 'FALLO T12a: esperaba 1 vencido con breakage 4×5.50=$22.00 (%)', v_r;
  END IF;
  SELECT ee.tipo_evento::text AS tipo, ee.monto_bruto, ee.monto_plataforma, ee.monto_payout,
         ee.estado::text AS estado, ee.cuenta_comercial_id
  INTO v_ev FROM eventos_economicos ee
  WHERE ee.origen_tipo = 'bono' AND ee.origen_id = v_bono2 AND ee.tipo_evento = 'bono_breakage';
  IF v_ev.tipo IS NULL OR v_ev.monto_bruto <> 22.00 OR v_ev.monto_plataforma <> 22.00
     OR v_ev.monto_payout IS NOT NULL OR v_ev.estado <> 'no_aplica' OR v_ev.cuenta_comercial_id IS NOT NULL THEN
    RAISE EXCEPTION 'FALLO T12b: breakage mal formado: bruto=% plat=% payout=% estado=% cuenta=%',
      v_ev.monto_bruto, v_ev.monto_plataforma, v_ev.monto_payout, v_ev.estado, v_ev.cuenta_comercial_id;
  END IF;
  IF (SELECT estado FROM bonos WHERE id = v_bono1) <> 'agotado' THEN
    RAISE EXCEPTION 'FALLO T12c: el bono agotado no debía tocarse (0 restantes = 0 breakage)';
  END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 + 2 THEN RAISE EXCEPTION 'FALLO T12: ledger esperaba exactamente +2 (no_show + breakage)'; END IF;
  -- idempotencia: la 2ª corrida no duplica
  v_r := vencer_paquetes_salidas();
  IF (v_r->>'vencidos')::int <> 0 OR (v_r->>'breakage_total')::numeric <> 0 THEN
    RAISE EXCEPTION 'FALLO T12d: la corrida repetida fabricó breakage (%)', v_r;
  END IF;
  v_rep := v_rep || 'T12 breakage $22.00 plataforma sin payout (no_aplica, cuenta NULL), agotado intacto, idempotente ✓' || E'\n';

  RAISE EXCEPTION 'ASSERTS_OK (12/12) — todo se revierte ahora.%', v_rep;
END $$;
