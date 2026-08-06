-- S88-A · D-661 — SOLO RECEPCIÓN ASIGNA (firma del founder, 5-ago-2026)
--
-- «El profesional que ve una cita huérfana se la pide a quien reparte; un solo
--  dueño del reparto, sin carreras entre dos que la toman.»
--
-- LA PARED QUE SE CIERRA: el TERCER BRAZO de `cita_update_prestador` (S77)
-- dejaba a cualquier empleado activo CON EL CHIP del oficio hacer `UPDATE`
-- sobre una cita sin persona por PostgREST directo — y ponerse a sí mismo.
-- `asignar_cita_a_persona` (20260805240000) lo rebota con `rol_sin_asignacion`:
-- **la puerta rebotaba y la pared de al lado lo dejaba pasar.**
--
-- 76(g) — VEDA: **NO RIGE.** DDL de policy, sin backfill, sin anclas, sin
--   escritura de datos.
--
-- ─────────────────────────────────────────────────────────────────────────
-- LO QUE SE MIDIÓ ANTES DE ACOTAR — porque estrechar un gate a ciegas rompe
-- caminos igual que ensancharlo abre agujeros:
--
--   ① citas con `empleado_id IS NULL` .......... 0 de 112
--      El brazo solo alcanza citas huérfanas ⇒ hoy no alcanza ninguna.
--      (Cero es «no hay», jamás «no puede»: el primer `dar_de_baja_empleado`
--       de un negocio con agenda futura las produce.)
--
--   ② wrappers que hacen `.update()` sobre `evento_cita_servicio` ...... 0
--      Censo completo de packages/api: TODA escritura sobre la cita viaja por
--      RPC `SECURITY DEFINER`, que salta la RLS. **El brazo no tenía un solo
--      consumidor de producto** — era superficie de ataque sin camino.
--
--   ⇒ El estrechamiento no rompe nada vivo, y se declara medido, no supuesto.
-- ─────────────────────────────────────────────────────────────────────────
--
-- Y LA SEGUNDA COSA QUE ESTE BRAZO CONCEDÍA, que nadie había nombrado:
--   vivía también en el `WITH CHECK`, así que una persona podía **DESPEGARSE
--   de su propia cita** (dejarla en `empleado_id = NULL`) por UPDATE directo —
--   USING pasaba por el segundo brazo, y el resultado huérfano lo validaba el
--   tercero. Abandonar una cita sin que nadie se entere no es un verbo firmado
--   de esta casa. **Muere con el mismo corte.**

BEGIN;

DROP POLICY IF EXISTS cita_update_prestador ON public.evento_cita_servicio;

-- Quedan los DOS brazos legítimos, textualmente idénticos a los de S77:
--   ① el TITULAR del negocio         ② la PERSONA dueña de la cita
CREATE POLICY cita_update_prestador ON public.evento_cita_servicio
FOR UPDATE
USING (
  (prestador_id IN (SELECT p.id FROM prestadores p WHERE p.user_id = auth.uid()))
  OR (empleado_id IN (SELECT pe.id FROM prestador_empleados pe
                      WHERE pe.user_id = auth.uid() AND pe.activo = true))
)
WITH CHECK (
  (prestador_id IN (SELECT p.id FROM prestadores p WHERE p.user_id = auth.uid()))
  OR (empleado_id IN (SELECT pe.id FROM prestador_empleados pe
                      WHERE pe.user_id = auth.uid() AND pe.activo = true))
);

COMMENT ON POLICY cita_update_prestador ON public.evento_cita_servicio IS
  'S77 + S88/D-661: titular del negocio O persona dueña de la cita. El tercer '
  'brazo (empleado con chip sobre cita huérfana) MURIÓ con la firma «solo '
  'recepción asigna» — ese verbo vive en asignar_cita_a_persona, con su gate.';

-- ── CINTURÓN ──────────────────────────────────────────────────────────────
-- Mide SIN efectos laterales, y mide EL VERBO que la migración cambia:
-- que el brazo ya no está EN EL TEXTO de la policy vigente (sobre el objeto,
-- jamás sobre la prosa de arriba).
DO $belt$
DECLARE
  v_using text;
  v_check text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid), pg_get_expr(polwithcheck, polrelid)
    INTO v_using, v_check
  FROM pg_policy
  WHERE polrelid = 'public.evento_cita_servicio'::regclass
    AND polname  = 'cita_update_prestador';

  IF v_using IS NULL OR v_check IS NULL THEN
    RAISE EXCEPTION 'CINTURON: la policy no quedó creada';
  END IF;

  IF v_using LIKE '%prestador_empleado_servicios%'
     OR v_check LIKE '%prestador_empleado_servicios%' THEN
    RAISE EXCEPTION 'CINTURON: el tercer brazo SIGUE VIVO en la policy';
  END IF;

  -- Y que los dos legítimos NO se cayeron de paso (un corte de más también
  -- es un defecto: dejaría al titular sin poder tocar sus propias citas).
  IF v_using NOT LIKE '%prestadores%' OR v_using NOT LIKE '%prestador_empleados%' THEN
    RAISE EXCEPTION 'CINTURON: falta alguno de los dos brazos legítimos';
  END IF;

  RAISE NOTICE 'CINTURON VERDE: tercer brazo ausente, los dos legítimos presentes.';
END
$belt$;

COMMIT;
