-- ─────────────────────────────────────────────────────────────────────
-- S86-A · FIXTURE DE LA PIZARRA — con EL ROJO PRODUCIDO ANTES (L-199)
--
-- Todo in-txn con ROLLBACK: residuo 0. No escribe nada que sobreviva.
--
-- POR QUÉ HAY QUE FABRICAR EL CASO: medido hoy, **CERO de 107 citas
-- tienen `empleado_id` NULL** — la pizarra no tiene habitantes todavía.
-- Sin fabricar uno, "funciona" sería una afirmación sobre un conjunto
-- vacío, que es la forma más barata de un verde falso.
--
-- EL DISCRIMINADOR QUE IMPORTA (T0): antes de probar que la cura
-- funciona, se prueba QUE HACÍA FALTA. Un UPDATE sin la cláusula
-- `empleado_id IS NULL` **pisa a un tratante ya asignado y no avisa** —
-- ese es el rojo. Si no se produce acá, la cura queda sin evidencia
-- para siempre (L-199) y nadie puede distinguir "el guard funciona" de
-- "el guard nunca hizo falta".
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

CREATE TEMP TABLE r(paso text, resultado text) ON COMMIT DROP;

-- Dos citas SIN TRATANTE, clonadas de una real (así heredan NOT NULLs
-- y forma sin inventar datos).
CREATE TEMP TABLE ids(k text primary key, v uuid) ON COMMIT DROP;

INSERT INTO ids(k, v)
SELECT 'cita_pizarra', gen_random_uuid();
INSERT INTO ids(k, v)
SELECT 'cita_rojo', gen_random_uuid();

INSERT INTO evento_cita_servicio
  (id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
   fecha, hora, precio, duracion_minutos, estado, estado_reserva,
   country_code, modalidad, metadata)
SELECT (SELECT v FROM ids WHERE k='cita_pizarra'),
       c.user_id, c.mascota_id, c.prestador_id, NULL, c.tipo_servicio,
       ((now() AT TIME ZONE 'America/Guayaquil')::date + 1), '11:00', c.precio,
       c.duracion_minutos, 'confirmada', c.estado_reserva,
       c.country_code, c.modalidad, jsonb_build_object('fixture_s86a', true)
FROM evento_cita_servicio c
WHERE c.prestador_id = 'de300000-0000-4000-8000-0000000000e5'
  AND c.tipo_servicio = 'paseo'
LIMIT 1;

INSERT INTO evento_cita_servicio
  (id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
   fecha, hora, precio, duracion_minutos, estado, estado_reserva,
   country_code, modalidad, metadata)
SELECT (SELECT v FROM ids WHERE k='cita_rojo'),
       c.user_id, c.mascota_id, c.prestador_id,
       'c59827f4-31f5-4558-a654-53cddef116d7',          -- YA tiene tratante (el titular)
       c.tipo_servicio,
       ((now() AT TIME ZONE 'America/Guayaquil')::date + 1), '12:00', c.precio,
       c.duracion_minutos, 'confirmada', c.estado_reserva,
       c.country_code, c.modalidad, jsonb_build_object('fixture_s86a', true)
FROM evento_cita_servicio c
WHERE c.prestador_id = 'de300000-0000-4000-8000-0000000000e5'
  AND c.tipo_servicio = 'paseo'
LIMIT 1;

-- ── T0 · EL ROJO: la puerta INGENUA (sin la cláusula) PISA ───────────
UPDATE evento_cita_servicio
SET empleado_id = '5c0bf879-d3c8-4f26-8ffd-bbc7b9422dbf'   -- Guillermo
WHERE id = (SELECT v FROM ids WHERE k='cita_rojo');

INSERT INTO r
SELECT 'T0 · ROJO — UPDATE sin la cláusula sobre cita YA asignada',
       CASE WHEN empleado_id = '5c0bf879-d3c8-4f26-8ffd-bbc7b9422dbf'
            THEN 'PISÓ al tratante anterior y NO avisó — el guard hace falta'
            ELSE 'no pisó (inesperado)' END
FROM evento_cita_servicio WHERE id = (SELECT v FROM ids WHERE k='cita_rojo');

-- Las temp tables nacen de `postgres`; al bajar a `authenticated` hay que
-- poder seguir escribiendo el registro del fixture (no es parte de la
-- prueba: es el cuaderno donde se anota).
GRANT SELECT, INSERT ON r    TO authenticated;
GRANT SELECT         ON ids  TO authenticated;

-- ── Ahora la puerta REAL, como Guillermo (empleado con chip) ─────────
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"1038b1b9-e2f9-4ba4-aae3-caf23d9abe8f","role":"authenticated"}';

INSERT INTO r
SELECT 'T1 · la cita SIN tratante aparece en su pizarra',
       CASE WHEN count(*) = 1 THEN 'SÍ (1 fila)' ELSE 'NO (' || count(*) || ')' END
FROM public.obtener_pizarra('de300000-0000-4000-8000-0000000000e5') p
WHERE p.cita_id = (SELECT v FROM ids WHERE k='cita_pizarra');

INSERT INTO r
SELECT 'T2 · tomar_cita (primera vez)',
       (public.tomar_cita((SELECT v FROM ids WHERE k='cita_pizarra')))::text;

INSERT INTO r
SELECT 'T3 · ya NO aparece en la pizarra (tiene tratante)',
       CASE WHEN count(*) = 0 THEN 'correcto: 0 filas' ELSE 'sigue apareciendo' END
FROM public.obtener_pizarra('de300000-0000-4000-8000-0000000000e5') p
WHERE p.cita_id = (SELECT v FROM ids WHERE k='cita_pizarra');

-- ── T4 · EL PAR: el titular intenta tomarla DESPUÉS ──────────────────
-- Los dos son elegibles para 'paseo' (Guillermo por chip, el titular por
-- rol), así que un rebote acá SOLO puede ser por atomicidad — jamás por
-- especialidad. Ese aislamiento es lo que vuelve al par un discriminador.
SET LOCAL request.jwt.claims = '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}';

DO $$
DECLARE v_err text;
BEGIN
  PERFORM public.tomar_cita((SELECT v FROM ids WHERE k='cita_pizarra'));
  INSERT INTO r VALUES ('T4 · segunda toma sobre la MISMA cita', '⚠️ NO REBOTÓ — pisó en silencio');
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
  INSERT INTO r VALUES ('T4 · segunda toma sobre la MISMA cita', 'rebotó TIPADO: ' || v_err);
END $$;

INSERT INTO r
SELECT 'T5 · el tratante NO cambió (sigue el primero)',
       CASE WHEN empleado_id = '5c0bf879-d3c8-4f26-8ffd-bbc7b9422dbf'
            THEN 'correcto: sigue Guillermo' ELSE 'CAMBIÓ — el guard falló' END
FROM evento_cita_servicio WHERE id = (SELECT v FROM ids WHERE k='cita_pizarra');

SELECT * FROM r ORDER BY paso;

ROLLBACK;
