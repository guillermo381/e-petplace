DO $$
DECLARE v_e1 text; v_e2 text; v_r jsonb; v_pre1 text; v_pre2 text;
BEGIN
  -- estado previo de los dos casos reales
  SELECT etapa INTO v_pre1 FROM casos_postventa WHERE id::text like '82ff1424%';
  SELECT etapa INTO v_pre2 FROM casos_postventa WHERE id::text like '83e5c976%';
  RAISE NOTICE 'previo: 82ff=% · 83e5=%', v_pre1, v_pre2;

  -- POSITIVO: al 82ff le vence el plazo (al pasado); al 83e5 lo dejamos futuro.
  UPDATE casos_postventa SET plazo_prestador_hasta = now() - interval '1 hour'
   WHERE id::text like '82ff1424%';
  UPDATE casos_postventa SET plazo_prestador_hasta = now() + interval '10 hours'
   WHERE id::text like '83e5c976%';

  v_r := vencer_casos_sin_respuesta();

  SELECT etapa INTO v_e1 FROM casos_postventa WHERE id::text like '82ff1424%';
  SELECT etapa INTO v_e2 FROM casos_postventa WHERE id::text like '83e5c976%';
  RAISE NOTICE 'POSITIVO 82ff (vencido)  -> % (esperado con_casa)', v_e1;
  RAISE NOTICE 'ROJO     83e5 (futuro)   -> % (esperado con_prestador)', v_e2;

  IF v_pre1 = 'con_prestador' AND v_e1 <> 'con_casa' THEN
    RAISE EXCEPTION 'CINTURON ROJO: el vencido NO se movio (%)', v_e1; END IF;
  IF v_pre2 = 'con_prestador' AND v_e2 <> 'con_prestador' THEN
    RAISE EXCEPTION 'CINTURON ROJO: el futuro se movio indebidamente (%)', v_e2; END IF;

  RAISE NOTICE 'CINTURON VERDE (4): vencido->con_casa, futuro intacto. vencidos=%', v_r->>'vencidos';
  RAISE EXCEPTION 'ROLLBACK_CINTURON_OK: verificado, deshaciendo (no persiste nada)';
END $$;
