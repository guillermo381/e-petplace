-- S73-B · ASSERTS del GATE D-464 (regla 68: SET LOCAL ROLE + JWTs REALES;
-- L-151: fixtures que discriminan). UNA transacción, ROLLBACK — residuos 0.
-- Actores: demo-vet 4f572081 (dueño Aurora) · diana c5651de2 (fixture
-- empleada activa de Aurora SIN rol, in-txn) · titular de Thor dd024680.
-- Mascota: Thor d2e31d70 (78 eventos al relevar; el total se RE-LEE como
-- postgres dentro de la txn — el assert compara contra la verdad del día).
BEGIN;
CREATE TEMP TABLE _res (linea text) ON COMMIT DROP;
GRANT INSERT ON _res TO authenticated, anon;
CREATE TEMP TABLE _total (n integer) ON COMMIT DROP;
INSERT INTO _total SELECT count(*) FROM eventos_mascota
  WHERE mascota_id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
GRANT SELECT ON _total TO authenticated;

-- fixture: Diana empleada ACTIVA de Aurora, SIN rol en la hija
INSERT INTO prestador_empleados (id, prestador_id, user_id, rol, nombre, created_by)
VALUES ('99990000-0000-4000-8000-0000000000f8'::uuid,
        'de680000-0000-4000-8000-0000000000e5',
        'c5651de2-2c59-416a-8bd5-e63ed874ce1a',
        'empleado', 'FIXTURE G2 (rollback)', '4f572081-26a5-4d3b-9d80-25ea751fdc9c');

-- ── G1: el vet CON rol (dueño de Aurora) LEE el expediente clínico entero
SET LOCAL request.jwt.claims = '{"sub":"4f572081-26a5-4d3b-9d80-25ea751fdc9c","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$
DECLARE v integer; t integer;
BEGIN
  SELECT n INTO t FROM _total;
  SELECT count(*) INTO v FROM eventos_mascota WHERE mascota_id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
  IF v IS DISTINCT FROM t OR t = 0 THEN
    RAISE EXCEPTION 'G1: el vet con rol lee % de % eventos', v, t;
  END IF;
  INSERT INTO _res VALUES (format('G1 OK: vet con rol lee el expediente entero (%s eventos)', v));
END $$;
RESET ROLE;

-- ── G2: la empleada activa SIN rol — clínico NO · identidad SÍ · perfil NO (ventana D-489)
SET LOCAL request.jwt.claims = '{"sub":"c5651de2-2c59-416a-8bd5-e63ed874ce1a","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_ev integer; v_masc integer; v_perfil integer; v_hc integer;
BEGIN
  SELECT count(*) INTO v_ev FROM eventos_mascota WHERE mascota_id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
  SELECT count(*) INTO v_hc FROM evento_historia_clinica_registrada WHERE mascota_id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
  SELECT count(*) INTO v_masc FROM mascotas WHERE id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
  SELECT count(*) INTO v_perfil FROM mascota_perfil_vigente WHERE mascota_id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
  IF v_ev <> 0 OR v_hc <> 0 THEN RAISE EXCEPTION 'G2a: sin rol lee clínico (eventos=%, hc=%)', v_ev, v_hc; END IF;
  IF v_masc <> 1 THEN RAISE EXCEPTION 'G2b: sin rol perdió la IDENTIDAD (mascotas=%)', v_masc; END IF;
  IF v_perfil <> 0 THEN RAISE EXCEPTION 'G2c: el perfil no quedó gateado (ventana D-489)'; END IF;
  INSERT INTO _res VALUES ('G2 OK: sin rol — clínico 0 · identidad 1 · perfil 0 (ventana D-489 declarada)');
END $$;
RESET ROLE;

-- ── G3: la MISMA empleada CON rol profesional (asignado por el dueño) LEE
SET LOCAL request.jwt.claims = '{"sub":"4f572081-26a5-4d3b-9d80-25ea751fdc9c","role":"authenticated"}';
SET LOCAL ROLE authenticated;
INSERT INTO empleado_roles (empleado_id, rol, asignado_por)
VALUES ('99990000-0000-4000-8000-0000000000f8', 'profesional', '4f572081-26a5-4d3b-9d80-25ea751fdc9c');
RESET ROLE;
SET LOCAL request.jwt.claims = '{"sub":"c5651de2-2c59-416a-8bd5-e63ed874ce1a","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$
DECLARE v integer; t integer;
BEGIN
  SELECT n INTO t FROM _total;
  SELECT count(*) INTO v FROM eventos_mascota WHERE mascota_id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
  IF v IS DISTINCT FROM t THEN RAISE EXCEPTION 'G3: profesional lee % de %', v, t; END IF;
  INSERT INTO _res VALUES (format('G3 OK: con rol profesional lee el expediente entero (%s eventos)', v));
END $$;
RESET ROLE;

-- ── G4: LA FAMILIA LEE IGUAL QUE ANTES (pata byte-idéntica en runtime)
SET LOCAL request.jwt.claims = '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$
DECLARE v integer; t integer; v_perfil integer;
BEGIN
  SELECT n INTO t FROM _total;
  SELECT count(*) INTO v FROM eventos_mascota WHERE mascota_id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
  SELECT count(*) INTO v_perfil FROM mascota_perfil_vigente WHERE mascota_id = 'd2e31d70-54fc-4d47-b425-1617239257eb';
  IF v IS DISTINCT FROM t THEN RAISE EXCEPTION 'G4: la familia lee % de % eventos', v, t; END IF;
  IF v_perfil <> 1 THEN RAISE EXCEPTION 'G4b: la familia perdió el perfil vigente'; END IF;
  INSERT INTO _res VALUES (format('G4 OK: la familia lee IGUAL (%s eventos + perfil vigente)', v));
END $$;
RESET ROLE;

SELECT json_agg(linea) AS resultados FROM _res;
ROLLBACK; -- residuos 0 (fixture G2/G3 + fila de rol + temps mueren acá)
