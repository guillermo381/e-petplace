-- ═══════════════════════════════════════════════════════════════════
-- S57 — Asserts imperativos del PAQUETE DE SALIDAS (D-343 + enmienda
-- v1.4 del gate: F1 comprar≠reservar · F2 paquete DEL HOGAR · F3
-- especie por servicio) con ROLLBACK del camino completo. Correr con:
--   npx supabase --experimental db query --linked -f scripts/asserts-paquete-s57.sql
--
-- Termina SIEMPRE en RAISE EXCEPTION: ASSERTS_OK = todo pasó y todo se
-- revierte (patrón L-135). El tiempo se simula moviendo filas como
-- postgres (L-122a: now() es constante en la transacción). Las mascotas
-- extra del hogar (Rocky perro, Michi gato) nacen DENTRO de la
-- transacción — jamás persisten.
-- ═══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_email      text;
  v_user       uuid;
  v_familia    uuid;
  v_prestador  uuid;
  v_zeus       uuid;
  v_rocky      uuid;
  v_michi      uuid;
  v_servicio   uuid;
  v_sabado     date;
  v_hoy        date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_ledger0    int;
  v_citas0     int;
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
  SELECT fm.familia_id INTO v_familia FROM familia_miembro fm
  WHERE fm.user_id = v_user AND fm.hasta IS NULL LIMIT 1;
  SELECT m.id INTO v_zeus FROM mascotas m
  WHERE m.nombre = 'Zeus' AND m.familia_id = v_familia LIMIT 1;
  SELECT ps.id INTO v_servicio FROM prestador_servicios ps
  WHERE ps.prestador_id = v_prestador AND ps.tipo_servicio = 'paseo'
    AND ps.duracion_minutos = 30 AND ps.activo;
  IF v_user IS NULL OR v_familia IS NULL OR v_zeus IS NULL OR v_servicio IS NULL THEN
    RAISE EXCEPTION 'PRECONDICION: fixtures demo incompletas (user=% familia=% zeus=% servicio=%)', v_user, v_familia, v_zeus, v_servicio;
  END IF;
  -- el hogar crece DENTRO del rollback: Rocky (perro) y Michi (gato)
  INSERT INTO mascotas (user_id, familia_id, nombre, especie, origen, country_code)
  VALUES (v_user, v_familia, 'Rocky DEMO S57', 'perro', 'desconocido', 'EC')
  RETURNING id INTO v_rocky;
  INSERT INTO mascotas (user_id, familia_id, nombre, especie, origen, country_code)
  VALUES (v_user, v_familia, 'Michi DEMO S57', 'gato', 'desconocido', 'EC')
  RETURNING id INTO v_michi;

  v_sabado := v_hoy + ((6 - EXTRACT(DOW FROM v_hoy)::int + 7) % 7);
  IF v_sabado = v_hoy THEN v_sabado := v_sabado + 7; END IF;

  SELECT count(*) INTO v_ledger0 FROM eventos_economicos;
  v_rep := v_rep || 'T0 baseline: ledger=' || v_ledger0 || ' · hogar demo con Rocky y Michi (rollback) ✓' || E'\n';

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- ── T1: preset fuera de la letra rebota ──
  BEGIN
    v_r := comprar_paquete_salidas(v_prestador, v_servicio, 7);
    RAISE EXCEPTION 'FALLO T1: preset 7 NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'preset_invalido%' THEN RAISE EXCEPTION 'FALLO T1: error inesperado %', SQLERRM; END IF;
  END;
  v_rep := v_rep || 'T1 preset invalido rebota tipado ✓' || E'\n';

  -- ── T2: bloque sin precio_paquete configurado rebota ──
  BEGIN
    v_r := comprar_paquete_salidas(v_prestador, v_servicio, 5);
    RAISE EXCEPTION 'FALLO T2: compra sin precio_paquete NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'paquete_no_disponible%' THEN RAISE EXCEPTION 'FALLO T2: error inesperado %', SQLERRM; END IF;
  END;
  v_rep := v_rep || 'T2 sin precio_paquete rebota tipado ✓' || E'\n';

  -- ── T3: comprar SIN mascota — del hogar, y COMPRAR NO ES RESERVAR ──
  EXECUTE 'RESET ROLE';
  UPDATE prestador_servicios SET precio_paquete = 5.00 WHERE id = v_servicio;
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_citas0 FROM evento_cita_servicio;
  v_r := comprar_paquete_salidas(v_prestador, v_servicio, 5);
  v_bono1 := (v_r->>'bono_id')::uuid;
  IF (v_r->>'total')::numeric <> 25.00 OR (v_r->>'saldo_total')::int <> 5 THEN
    RAISE EXCEPTION 'FALLO T3: compra mal formada %', v_r;
  END IF;
  SELECT familia_id, mascota_id INTO v_ev FROM bonos WHERE id = v_bono1;
  IF v_ev.familia_id <> v_familia OR v_ev.mascota_id IS NOT NULL THEN
    RAISE EXCEPTION 'FALLO T3: el bono no es del hogar (familia=% mascota=%)', v_ev.familia_id, v_ev.mascota_id;
  END IF;
  SELECT count(*) INTO v_n FROM evento_cita_servicio;
  IF v_n <> v_citas0 THEN RAISE EXCEPTION 'FALLO T3: comprar CREÓ % cita(s) — comprar no es reservar (v1.4)', v_n - v_citas0; END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 THEN RAISE EXCEPTION 'FALLO T3: el pago del paquete TOCÓ el ledger'; END IF;
  -- el bono1 "se compró ayer" (L-122a: sin esto el FIFO no tiene cronología)
  EXECUTE 'RESET ROLE';
  UPDATE bonos SET fecha_compra = v_hoy - 1, created_at = created_at - interval '1 day'
  WHERE id = v_bono1;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_rep := v_rep || 'T3 compra SIN mascota (bono del hogar), CERO citas creadas, ledger INTACTO ✓' || E'\n';

  -- ── T4: la lista de compra existe sin ventana (F1) ──
  SELECT count(*) INTO v_n FROM obtener_paseadores_con_paquete(30, NULL) q
  WHERE q.prestador_id = v_prestador AND q.precio_paquete = 5.00;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALLO T4: obtener_paseadores_con_paquete no lista al demo (n=%)', v_n; END IF;
  v_rep := v_rep || 'T4 obtener_paseadores_con_paquete lista al demo SIN fecha/hora ✓' || E'\n';

  -- ── T5: un paquete, DOS mascotas (F2) + especie manda (F3) ──
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_zeus, v_sabado, '08:00');
  v_cita := (v_r->>'cita_id')::uuid;
  IF (v_r->>'precio_origen')::numeric <> 5.00 THEN RAISE EXCEPTION 'FALLO T5a: %', v_r; END IF;
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_rocky, v_sabado, '08:30');
  v_c2 := (v_r->>'cita_id')::uuid;
  IF (SELECT bono_id FROM evento_cita_servicio WHERE id = v_c2) <> v_bono1
     OR (v_r->>'precio_origen')::numeric <> 5.00 OR (v_r->>'saldo_restante')::int <> 3 THEN
    RAISE EXCEPTION 'FALLO T5b: la reserva de Rocky no salió del MISMO paquete del hogar (%)', v_r;
  END IF;
  BEGIN
    v_r := reservar_salida_paquete(v_prestador, v_servicio, v_michi, v_sabado, '09:00');
    RAISE EXCEPTION 'FALLO T5c: el gato reservó un paseo';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'mascota_no_elegible%' THEN RAISE EXCEPTION 'FALLO T5c: %', SQLERRM; END IF;
  END;
  BEGIN
    v_r := crear_bloqueo_agenda(v_prestador, v_servicio, v_michi, v_sabado, '09:00');
    RAISE EXCEPTION 'FALLO T5d: el gato creó un hold de paseo';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'mascota_no_elegible%' THEN RAISE EXCEPTION 'FALLO T5d: %', SQLERRM; END IF;
  END;
  v_rep := v_rep || 'T5 dos reservas (Zeus+Rocky) del MISMO paquete a precio de origen; Michi rebota en reservar Y en hold (mascota_no_elegible) ✓' || E'\n';

  -- ── T6: cancelar en ventana — la salida vuelve al saldo del hogar ──
  v_r := cancelar_reserva_paquete(v_c2);
  SELECT unidades_usadas INTO v_n FROM bonos WHERE id = v_bono1;
  IF v_n <> 1 OR (v_r->>'saldo')::int <> 4 THEN RAISE EXCEPTION 'FALLO T6: (usadas=% r=%)', v_n, v_r; END IF;
  v_rep := v_rep || 'T6 cancelación en ventana: salida al saldo del hogar (4) ✓' || E'\n';

  -- ── T7: no_show — devenga al precio de ORIGEN, salida consumida ──
  EXECUTE 'RESET ROLE';
  UPDATE evento_cita_servicio SET fecha = v_hoy - 1 WHERE id = v_cita;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_r := marcar_no_show_cita(v_cita);
  SELECT ee.monto_bruto, ee.monto_payout, ee.metadata->>'cierre' AS cierre
  INTO v_ev FROM eventos_economicos ee WHERE ee.id = (v_r->>'evento_economico_id')::uuid;
  IF v_ev.monto_bruto <> 5.00 OR v_ev.monto_payout <> 4.25 OR v_ev.cierre <> 'no_show' THEN
    RAISE EXCEPTION 'FALLO T7: evento no_show mal formado (bruto=% payout=%)', v_ev.monto_bruto, v_ev.monto_payout;
  END IF;
  SELECT unidades_usadas INTO v_n FROM bonos WHERE id = v_bono1;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALLO T7: la salida del no_show volvió al saldo'; END IF;
  v_rep := v_rep || 'T7 no_show devenga $5.00 origen (payout $4.25), salida consumida ✓' || E'\n';

  -- ── T8: RENOVAR con rollover DEL HOGAR — sin evento económico ──
  EXECUTE 'RESET ROLE';
  UPDATE prestador_servicios SET precio_paquete = 5.50 WHERE id = v_servicio;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_r := comprar_paquete_salidas(v_prestador, v_servicio, 5);
  v_bono2 := (v_r->>'bono_id')::uuid;
  IF (v_r->>'salidas_rollover')::int <> 4 OR (v_r->>'saldo_total')::int <> 9 THEN
    RAISE EXCEPTION 'FALLO T8: rollover mal (%)', v_r;
  END IF;
  IF (SELECT fecha_vencimiento FROM bonos WHERE id = v_bono1)
     <> (SELECT fecha_vencimiento FROM bonos WHERE id = v_bono2) THEN
    RAISE EXCEPTION 'FALLO T8: la vigencia del bono viejo no se extendió';
  END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 + 1 THEN RAISE EXCEPTION 'FALLO T8: el rollover generó evento económico'; END IF;
  v_rep := v_rep || 'T8 rollover del hogar: 4 viejas + 5 nuevas = 9, vigencia extendida, SIN evento ✓' || E'\n';

  -- ── T9: FIFO — las viejas primero (mezclando mascotas), cada una a SU precio ──
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_rocky, v_sabado, '08:30');
  IF (SELECT bono_id FROM evento_cita_servicio WHERE id = (v_r->>'cita_id')::uuid) <> v_bono1
     OR (v_r->>'precio_origen')::numeric <> 5.00 THEN
    RAISE EXCEPTION 'FALLO T9a: FIFO no tomó el bono viejo (%)', v_r;
  END IF;
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_zeus, v_sabado, '09:00');
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_rocky, v_sabado, '09:30');
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_zeus, v_sabado, '10:00');
  SELECT estado, unidades_usadas INTO v_ev FROM bonos WHERE id = v_bono1;
  IF v_ev.estado <> 'agotado' OR v_ev.unidades_usadas <> 5 THEN
    RAISE EXCEPTION 'FALLO T9b: bono viejo no se agotó (% %)', v_ev.estado, v_ev.unidades_usadas;
  END IF;
  v_r := reservar_salida_paquete(v_prestador, v_servicio, v_zeus, v_sabado, '10:30');
  v_c2 := (v_r->>'cita_id')::uuid;
  IF (SELECT bono_id FROM evento_cita_servicio WHERE id = v_c2) <> v_bono2
     OR (v_r->>'precio_origen')::numeric <> 5.50 THEN
    RAISE EXCEPTION 'FALLO T9c: la 6ª salida no saltó al bono nuevo a $5.50 (%)', v_r;
  END IF;
  v_rep := v_rep || 'T9 FIFO: 5 viejas a $5.00 (bono agotado), la 6ª del nuevo a $5.50 ✓' || E'\n';

  -- ── T10: <2 h ya no se cancela (P16b) ──
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
  v_r := vencer_paquetes_salidas();
  IF (v_r->>'avisados')::int <> 0 THEN RAISE EXCEPTION 'FALLO T11b: el aviso se repitió'; END IF;
  v_rep := v_rep || 'T11 aviso sereno: UNO (idempotente) ✓' || E'\n';

  -- ── T12: vencer sin renovar — BREAKAGE declarado ──
  UPDATE bonos SET fecha_compra = v_hoy - 32, fecha_vencimiento = v_hoy - 1 WHERE id = v_bono2;
  v_r := vencer_paquetes_salidas();
  IF (v_r->>'vencidos')::int <> 1 OR (v_r->>'breakage_total')::numeric <> 22.00 THEN
    RAISE EXCEPTION 'FALLO T12a: esperaba breakage 4×5.50=$22.00 (%)', v_r;
  END IF;
  SELECT ee.monto_bruto, ee.monto_plataforma, ee.monto_payout, ee.estado::text AS estado, ee.cuenta_comercial_id
  INTO v_ev FROM eventos_economicos ee
  WHERE ee.origen_tipo = 'bono' AND ee.origen_id = v_bono2 AND ee.tipo_evento = 'bono_breakage';
  IF v_ev.monto_bruto <> 22.00 OR v_ev.monto_plataforma <> 22.00
     OR v_ev.monto_payout IS NOT NULL OR v_ev.estado <> 'no_aplica' OR v_ev.cuenta_comercial_id IS NOT NULL THEN
    RAISE EXCEPTION 'FALLO T12b: breakage mal formado';
  END IF;
  v_r := vencer_paquetes_salidas();
  IF (v_r->>'breakage_total')::numeric <> 0 THEN RAISE EXCEPTION 'FALLO T12c: breakage duplicado'; END IF;
  SELECT count(*) INTO v_n FROM eventos_economicos;
  IF v_n <> v_ledger0 + 2 THEN RAISE EXCEPTION 'FALLO T12: ledger esperaba exactamente +2'; END IF;
  v_rep := v_rep || 'T12 breakage $22.00 plataforma sin payout, idempotente, ledger +2 exacto ✓' || E'\n';

  RAISE EXCEPTION 'ASSERTS_OK (12/12) — todo se revierte ahora.%', v_rep;
END $$;
