-- ═════════════════════════════════════════════════════════════════════
-- S68-A7 — los tipos de PRESUPUESTO no se reservan por vitrina
-- Origen: letra §6 de MODELO_VETERINARIA v1.2 — "se llega a ellos por
-- el PRESUPUESTO (§8)" (V4), jamás por vitrina. Cura del hueco latente
-- declarado en el reporte S68-A6 (reservable=true por DEFAULT de A1).
--
-- 76(g) — declaración de veda: ADITIVA PURA (UPDATE de valor constante
-- a filas de catálogo); sin backfill anclado a datos vivos → la veda NO
-- rige (declarado igual). CERO lectores tocados → sin byte-check.
-- Nota de cuenta declarada: la lista literal del dictado son 7 códigos;
-- el probatorio suma emergencia (ya false por A1) = 8 filas.
-- Ley S67 al cierre (toca catálogo).
-- ═════════════════════════════════════════════════════════════════════

DO $do$
DECLARE
  v_antes_true int;
  v_despues_false int;
  r record;
BEGIN
  -- SELECT probatorio ANTES (los 7 del presupuesto + emergencia):
  FOR r IN
    SELECT codigo, reservable FROM tipos_servicio
    WHERE codigo IN ('cirugia','ecografia','radiografia','laboratorio',
                     'certificado_viaje','certificado_apoyo',
                     'vacunacion_internacional','emergencia')
    ORDER BY codigo
  LOOP
    RAISE NOTICE 'S68-A7 ANTES  %: reservable=%', r.codigo, r.reservable;
  END LOOP;
  SELECT count(*) INTO v_antes_true FROM tipos_servicio
  WHERE codigo IN ('cirugia','ecografia','radiografia','laboratorio',
                   'certificado_viaje','certificado_apoyo',
                   'vacunacion_internacional')
    AND reservable;
  IF v_antes_true <> 7 THEN
    RAISE EXCEPTION 'S68-A7 abort: esperaba 7 tipos de presupuesto reservables antes, hay %', v_antes_true;
  END IF;

  UPDATE tipos_servicio SET reservable = false
  WHERE codigo IN ('cirugia','ecografia','radiografia','laboratorio',
                   'certificado_viaje','certificado_apoyo',
                   'vacunacion_internacional');

  -- SELECT probatorio DESPUÉS (7 nuevos false + emergencia false = 8):
  FOR r IN
    SELECT codigo, reservable FROM tipos_servicio
    WHERE codigo IN ('cirugia','ecografia','radiografia','laboratorio',
                     'certificado_viaje','certificado_apoyo',
                     'vacunacion_internacional','emergencia')
    ORDER BY codigo
  LOOP
    RAISE NOTICE 'S68-A7 DESPUÉS %: reservable=%', r.codigo, r.reservable;
  END LOOP;
  SELECT count(*) INTO v_despues_false FROM tipos_servicio
  WHERE codigo IN ('cirugia','ecografia','radiografia','laboratorio',
                   'certificado_viaje','certificado_apoyo',
                   'vacunacion_internacional','emergencia')
    AND NOT reservable;
  IF v_despues_false <> 8 THEN
    RAISE EXCEPTION 'S68-A7 abort: esperaba 8 no-reservables después (7 presupuesto + emergencia), hay %', v_despues_false;
  END IF;
  RAISE NOTICE 'S68-A7: 7 tipos de presupuesto → reservable=false; emergencia verificada false (8/8)';
END;
$do$;

-- Ley S67: coherencia tabla_tipada ↔ schema real en 0.
DO $do$
DECLARE r record; v_n int := 0;
BEGIN
  FOR r IN SELECT * FROM verificar_coherencia_tablas_tipadas() LOOP
    v_n := v_n + 1;
    RAISE NOTICE 'S68-A7 D-415 incoherencia: % → % (%)', r.codigo, r.tabla_tipada, r.problema;
  END LOOP;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'S68-A7 abort: verificar_coherencia_tablas_tipadas() encontró % incoherencias', v_n;
  END IF;
  RAISE NOTICE 'S68-A7: coherencia tabla_tipada ↔ schema real: LIMPIA';
END;
$do$;

NOTIFY pgrst, 'reload schema';
