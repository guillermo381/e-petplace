-- ═══════════════════════════════════════════════════════════════════════════
-- S90-A · ORDEN 9 ① — LAS FECHAS DE LA MATRÍCULA: UNA SOLA, EN UN SOLO LUGAR
--
-- LA DIVERGENCIA (letra founder, 🔴): lo construido no hacía lo pedido.
-- Había TRES fechas sobre dos preguntas: el que nace era exigido desde el
-- 7-ago (debía ser 15) · _empleado_matricula_ok cortaba el 15 y APAGABA a
-- los existentes (no debían apagarse) · vets_sin_matricula contaba gracia
-- contra el 1-sep (huérfana). Ya divergieron tres veces — porque eran tres.
--
-- LO FIRMADO: UNA SOLA FECHA, 15-AGO, para las dos preguntas.
--   · Antes del 15: nadie es exigido.
--   · Desde el 15: el que NACE debe cargar matrícula.
--   · Los 16 existentes NO pierden visibilidad JAMÁS. Exentos para CITAS.
--
-- LA FORMA QUE LO CUMPLE SIN RELOJ: exigido ⟺ la persona NACIÓ el 15-ago o
-- después. Antes del 15 nadie vivo nació después del 15 (nadie exigido);
-- desde el 15, los nuevos nacen exigidos y los viejos quedan exentos para
-- siempre. UN predicado, CERO now(): la frontera es de nacimiento, no de
-- calendario — no hay día en que a alguien «se lo apague».
--
-- Y EL GATE QUE IGUAL LOS ALCANZA, el correcto (sin tocar acá): el PAPEL.
-- El certificado exige matrícula literal SIN gracia; la receta cae al
-- fallback del negocio Y LO DICE IMPRESO. La exención es de AGENDA, jamás
-- de FIRMA.
--
-- LA FECHA VIVE EN UN SOLO LUGAR: `_corte_matricula()`. Los dos consumidores
-- la llaman; el cinturón verifica que NINGUNO lleve fecha propia.
--
-- 76(g) VEDA: NO RIGE — CREATE OR REPLACE ×2 + una función nueva, cero
--   backfill. D-662: mismas firmas y RETURNS (dias_de_gracia se vuelve
--   NULLABLE — cero consumidores vivos medidos: solo comentarios).
-- L-140: la función nueva nace con REVOKE/GRANT explícitos.
-- REVERSA: docs/relevamientos/2026-08-07-s90a-REVERSA-fechas-matricula.sql
--   (restaura la divergencia, declarado).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── LA FRONTERA — el único lugar donde la fecha existe ─────────────────────
CREATE FUNCTION public._corte_matricula()
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $function$ SELECT DATE '2026-08-15' $function$;
COMMENT ON FUNCTION public._corte_matricula() IS
  'S90-A orden 9 (firma founder): LA frontera de la matrícula. Exigido ⟺ el empleado NACIÓ en o después de esta fecha. Los existentes quedan exentos PARA CITAS para siempre; los papeles tienen su propio gate (certificado sin gracia; receta con fallback declarado). Dos constantes sobre la misma frontera divergen solas: por eso hay UNA.';

REVOKE EXECUTE ON FUNCTION public._corte_matricula() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._corte_matricula() TO authenticated;

-- ── EL GATE DE AGENDA/VISIBILIDAD, con la semántica firmada ────────────────
CREATE OR REPLACE FUNCTION public._empleado_matricula_ok(p_empleado_id uuid, p_tipo_servicio text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_medico boolean;
  v_mat    text;
  v_creado timestamptz;
BEGIN
  IF p_empleado_id IS NULL THEN RETURN true; END IF;   -- a la pizarra: nadie asignado
  SELECT ts.es_medico INTO v_medico FROM tipos_servicio ts WHERE ts.codigo = p_tipo_servicio;
  IF NOT COALESCE(v_medico, false) THEN RETURN true; END IF;   -- lo no-medico no pide matricula

  SELECT pe.matricula_profesional, pe.created_at INTO v_mat, v_creado
  FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_creado IS NULL THEN RETURN false; END IF;
  IF coalesce(btrim(v_mat), '') <> '' THEN RETURN true; END IF;

  -- LA FIRMA (orden 9): exigido solo quien NACE desde el corte. Los
  -- existentes quedan exentos PARA CITAS, sin reloj que los apague.
  RETURN (v_creado AT TIME ZONE 'America/Guayaquil')::date < public._corte_matricula();
END;
$function$;

-- ── EL LISTADO DEL GESTOR, contra la misma frontera ────────────────────────
-- `dias_de_gracia` pasa a NULLABLE y dice la verdad nueva: NULL = exento (no
-- hay cuenta regresiva que le corra); 0 = nacido desde el corte, exigido ya.
CREATE OR REPLACE FUNCTION public.vets_sin_matricula()
 RETURNS TABLE(empleado_id uuid, nombre text, negocio text, dias_de_gracia integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT DISTINCT pe.id, pe.nombre, pr.nombre_comercial,
         CASE WHEN (pe.created_at AT TIME ZONE 'America/Guayaquil')::date < public._corte_matricula()
              THEN NULL
              ELSE 0 END
  FROM prestador_empleados pe
  JOIN prestadores pr ON pr.id = pe.prestador_id
  JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
  JOIN prestador_servicios ps ON ps.id = pes.servicio_id
  JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio AND ts.es_medico
  WHERE pe.activo
    AND coalesce(btrim(pe.matricula_profesional), '') = ''
    AND public._user_opera_cuenta_comercial(pr.cuenta_comercial_id, auth.uid());
$function$;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_src text; v_acl aclitem[];
BEGIN
  -- los dos consumidores llaman a LA frontera y ninguno lleva fecha propia
  FOR v_src IN
    SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('_empleado_matricula_ok', 'vets_sin_matricula')
  LOOP
    IF v_src NOT LIKE '%!_corte!_matricula()%' ESCAPE '!' THEN
      RAISE EXCEPTION 'cinturon_fechas: un consumidor no consulta la frontera unica';
    END IF;
    IF v_src ~ '\d{4}-\d{2}-\d{2}' THEN
      RAISE EXCEPTION 'cinturon_fechas: un consumidor lleva una fecha propia — la divergencia renace';
    END IF;
  END LOOP;
  -- la frontera dice lo firmado
  IF public._corte_matricula() <> DATE '2026-08-15' THEN
    RAISE EXCEPTION 'cinturon_fechas: la frontera no es el 15-ago firmado';
  END IF;
  -- L-140 en la función nueva
  SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = '_corte_matricula';
  IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl,'{}'::aclitem[])) a
             WHERE a::text LIKE 'anon=%' OR a::text LIKE '=%') THEN
    RAISE EXCEPTION 'cinturon_fechas: la frontera quedo ejecutable por anon/PUBLIC (L-140)';
  END IF;
END $cint$;
