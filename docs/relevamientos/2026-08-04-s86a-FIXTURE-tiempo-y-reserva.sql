-- ─────────────────────────────────────────────────────────────────────
-- S86-A · FIXTURE del lote TIEMPO (D-648) + RESERVA FUTURA DEL NEGOCIO
-- In-txn con ROLLBACK. Residuo 0.
--
-- LOS DOS PARES QUE IMPORTAN:
--   · LA FRONTERA: el mostrador ACEPTA hoy y RECHAZA mañana. Un guard
--     probado solo por su rechazo no distingue "frontera" de "puerta
--     rota" — hay que ver el lado que pasa.
--   · EL SLOT: la misma hora, dos veces. La segunda rebota.
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

CREATE TEMP TABLE r(paso text, resultado text) ON COMMIT DROP;
GRANT SELECT, INSERT ON r TO authenticated;

CREATE TEMP TABLE ctx(k text primary key, v text) ON COMMIT DROP;
GRANT SELECT ON ctx TO authenticated;

-- Un slot REALMENTE ofertado por Paseos Andres, elegido del motor y no
-- inventado: si lo inventáramos, un rebote no distinguiría "ocupado" de
-- "esa hora nunca existió".
INSERT INTO ctx(k, v)
SELECT 'servicio', ps.id::text
FROM prestador_servicios ps
WHERE ps.prestador_id = 'de300000-0000-4000-8000-0000000000e5'
  AND ps.tipo_servicio = 'paseo' AND ps.activo LIMIT 1;

INSERT INTO ctx(k, v)
SELECT 'hora', h.hora::text
FROM public._inicios_disponibles_prestador(
       'de300000-0000-4000-8000-0000000000e5',
       (SELECT v::uuid FROM ctx WHERE k='servicio'),
       ((now() AT TIME ZONE 'America/Guayaquil')::date + 3), 30, NULL) h
LIMIT 1;

INSERT INTO ctx(k, v)
SELECT 'mascota', c.mascota_id::text
FROM evento_cita_servicio c
WHERE c.prestador_id = 'de300000-0000-4000-8000-0000000000e5' LIMIT 1;

SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"4f572081-26a5-4d3b-9d80-25ea751fdc9c","role":"authenticated"}';

-- ── PAR 1 · LA FRONTERA registrar/reservar ───────────────────────────
DO $$
DECLARE e text;
BEGIN
  PERFORM public.registrar_atencion_mostrador(
    'de680000-0000-4000-8000-0000000000e5',        -- Clínica Aurora
    (SELECT v::uuid FROM ctx WHERE k='mascota'),
    'consulta', 20,
    NULL, NULL,
    ((now() AT TIME ZONE 'America/Guayaquil')::date + 5));   -- FUTURO
  INSERT INTO r VALUES ('P1a · mostrador con fecha FUTURA', '⚠️ LA ACEPTÓ — la frontera no existe');
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS e = MESSAGE_TEXT;
  INSERT INTO r VALUES ('P1a · mostrador con fecha FUTURA', 'rebotó: ' || e);
END $$;

DO $$
DECLARE e text;
BEGIN
  PERFORM public.registrar_atencion_mostrador(
    'de680000-0000-4000-8000-0000000000e5',
    (SELECT v::uuid FROM ctx WHERE k='mascota'),
    'consulta', 20, NULL, NULL,
    (now() AT TIME ZONE 'America/Guayaquil')::date);          -- HOY
  INSERT INTO r VALUES ('P1b · mostrador con fecha de HOY', 'pasó la frontera (llegó a los guards de negocio)');
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS e = MESSAGE_TEXT;
  INSERT INTO r VALUES ('P1b · mostrador con fecha de HOY',
    CASE WHEN e = 'el_mostrador_registra_no_reserva'
         THEN '⚠️ LA FRONTERA RECHAZA HOY — está mal puesta'
         ELSE 'pasó la frontera; se detuvo después en: ' || e END);
END $$;

-- ── PAR 2 · EL SLOT ──────────────────────────────────────────────────
-- Cambia el actor A PROPÓSITO: la frontera se probó con el titular de
-- Aurora (dueño del mostrador clínico); el slot se prueba con el de
-- Paseos Andres, que es quien tiene la grilla de paseo. Probar los dos
-- con el mismo usuario habría dado `no_access_to_prestador` y yo habría
-- leído "rebotó" como si fuera el guard que quería medir.
SET LOCAL request.jwt.claims = '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}';

DO $$
DECLARE e text; v_out jsonb;
BEGIN
  v_out := public.crear_cita_negocio(
    'de300000-0000-4000-8000-0000000000e5',
    (SELECT v::uuid FROM ctx WHERE k='mascota'), 'paseo',
    ((now() AT TIME ZONE 'America/Guayaquil')::date + 3),
    (SELECT v::time FROM ctx WHERE k='hora'),
    NULL, 15);
  INSERT INTO r VALUES ('P2a · crear_cita_negocio (primera)', v_out::text);
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS e = MESSAGE_TEXT;
  INSERT INTO r VALUES ('P2a · crear_cita_negocio (primera)', 'rebotó: ' || e);
END $$;

INSERT INTO r
SELECT 'P2b · el user_id es el de la FAMILIA, no el de quien agenda',
       CASE WHEN c.user_id = m.user_id THEN 'correcto: es la familia (' || m.user_id || ')'
            ELSE 'MAL: quedó a nombre de otro' END
FROM evento_cita_servicio c JOIN mascotas m ON m.id = c.mascota_id
WHERE c.metadata->>'origen' = 'agenda_negocio' LIMIT 1;

INSERT INTO r
SELECT 'P2c · nace SIN hold de pago (no se vence sola)',
       CASE WHEN c.expira_en IS NULL THEN 'correcto: expira_en NULL' ELSE 'MAL: nació con hold' END
FROM evento_cita_servicio c WHERE c.metadata->>'origen' = 'agenda_negocio' LIMIT 1;

DO $$
DECLARE e text;
BEGIN
  PERFORM public.crear_cita_negocio(
    'de300000-0000-4000-8000-0000000000e5',
    (SELECT v::uuid FROM ctx WHERE k='mascota'), 'paseo',
    ((now() AT TIME ZONE 'America/Guayaquil')::date + 3),
    (SELECT v::time FROM ctx WHERE k='hora'),
    NULL, 15);
  INSERT INTO r VALUES ('P2d · MISMO slot, SEGUNDA a la pizarra',
    'aceptada — y es CORRECTO: hay 2 personas elegibles libres');
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS e = MESSAGE_TEXT;
  INSERT INTO r VALUES ('P2d · MISMO slot, SEGUNDA a la pizarra', '⚠️ rebotó de más: ' || e);
END $$;

-- P2e · LA TERCERA es el discriminador REAL del cupo: con 2 personas
-- elegibles libres, la tercera cita sin tratante NO tiene quién la tome.
-- (Sin este caso, "no rebotó" en la segunda se leería como agujero — y
-- sería una alarma falsa: dos libres admiten dos.)
DO $$
DECLARE e text;
BEGIN
  PERFORM public.crear_cita_negocio(
    'de300000-0000-4000-8000-0000000000e5',
    (SELECT v::uuid FROM ctx WHERE k='mascota'), 'paseo',
    ((now() AT TIME ZONE 'America/Guayaquil')::date + 3),
    (SELECT v::time FROM ctx WHERE k='hora'),
    NULL, 15);
  INSERT INTO r VALUES ('P2e · TERCERA a la pizarra (solo hay 2 elegibles)',
    '⚠️ NO REBOTÓ — el cupo de la pizarra no rige');
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS e = MESSAGE_TEXT;
  INSERT INTO r VALUES ('P2e · TERCERA a la pizarra (solo hay 2 elegibles)', 'rebotó TIPADO: ' || e);
END $$;

-- ── T3 · el pasado no se reserva ─────────────────────────────────────
DO $$
DECLARE e text;
BEGIN
  PERFORM public.crear_cita_negocio(
    'de300000-0000-4000-8000-0000000000e5',
    (SELECT v::uuid FROM ctx WHERE k='mascota'), 'paseo',
    ((now() AT TIME ZONE 'America/Guayaquil')::date - 1), '10:00', NULL, 15);
  INSERT INTO r VALUES ('T3 · reservar en el PASADO', '⚠️ la aceptó');
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS e = MESSAGE_TEXT;
  INSERT INTO r VALUES ('T3 · reservar en el PASADO', 'rebotó: ' || e);
END $$;

SELECT * FROM r ORDER BY paso;

ROLLBACK;
