-- ═══════════════════════════════════════════════════════════════════════════
-- S90 · EL LECTOR DEL SELECTOR DE CONSULTA PARA LA RECETA — literal de C,
-- aplicado por A con DOS ADAPTACIONES MEDIDAS Y DECLARADAS (C verifica y
-- firma, o se revierte — método §6):
--
--   ① C leía `profiles.nombre_completo` — ESA COLUMNA NO EXISTE (medido:
--     profiles tiene `nombre`). Y la fuente primaria pasa a
--     `prestador_empleados.nombre` CON profiles.nombre de respaldo, porque
--     ES LO QUE LA RECETA IMPRIME como firmante: el selector y el papel no
--     pueden decir nombres distintos.
--   ② C leía `cuentas_comerciales.nombre_comercial` (existe) — se cambia a
--     `prestadores.nombre_comercial` POR LA MISMA REGLA: es la fuente que
--     la banda de la receta imprime. Un picker que dice un negocio y un
--     papel que dice otro es una divergencia fabricada.
--   ③ L-140: el literal venía sin REVOKE — toda función nace ejecutable por
--     anon y eso no se hereda en silencio.
--
-- El predicado es EL MISMO de emitir_token_documento (para no rebotar):
--   EXISTS (SELECT 1 FROM evento_medicacion_prescrita m
--            WHERE m.cita_id = p_ref AND m.mascota_id = p_mascota_id)
--
-- 76(g) VEDA: NO RIGE — una función nueva de lectura, cero backfill.
-- REVERSA: docs/relevamientos/2026-08-07-s90a-REVERSA-lector-consultas-receta.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.obtener_consultas_con_receta(p_mascota_id uuid)
RETURNS TABLE (cita_id uuid, fecha date, hora time, negocio text,
               profesional text, medicamentos integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE='42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT c.id, c.fecha, c.hora,
         p.nombre_comercial,
         COALESCE(NULLIF(btrim(pe.nombre), ''), NULLIF(btrim(prof.nombre), '')),
         count(*)::integer
    FROM evento_medicacion_prescrita m
    JOIN evento_cita_servicio c ON c.id = m.cita_id
    LEFT JOIN prestadores p          ON p.id = c.prestador_id
    LEFT JOIN prestador_empleados pe ON pe.id = c.empleado_id
    LEFT JOIN profiles prof          ON prof.id = pe.user_id
   WHERE m.mascota_id = p_mascota_id
   GROUP BY c.id, c.fecha, c.hora, p.nombre_comercial, pe.nombre, prof.nombre
   ORDER BY c.fecha DESC, c.hora DESC;
END $$;

REVOKE EXECUTE ON FUNCTION public.obtener_consultas_con_receta(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_consultas_con_receta(uuid) TO authenticated;

DO $cint$
DECLARE v_acl aclitem[];
BEGIN
  SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.proname='obtener_consultas_con_receta';
  IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl,'{}'::aclitem[])) a
             WHERE a::text LIKE 'anon=%' OR a::text LIKE '=%') THEN
    RAISE EXCEPTION 'cinturon_lector_receta: ejecutable por anon/PUBLIC (L-140)';
  END IF;
END $cint$;
