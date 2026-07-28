-- ============================================================================
-- S80-A1 · REVOKE de anon/PUBLIC sobre las 2 RPCs de invitaciones (familia
-- L-140: el grant heredado sin decisión escrita se revoca o se justifica).
--
-- Estado medido pre-migración (27-jul-2026, proacl idéntico en ambas):
--   {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
-- Son funciones PRE-cura-de-defaults (subsistema empleados, mayo 2026): nacieron
-- antes de que L-140 cerrara los default privileges en S54. El resto del stock
-- con anon queda censado en D-568 (92 funciones) — esta es la primera entrega.
--
-- 76(g): NO RIGE — DDL de grants puro, cero escritura de datos, sin backfill.
--
-- REGLA 78 (apply que toca GRANTS — las tres preguntas contra el BUNDLE VIVO,
-- MEDIDAS el 27-jul-2026, no supuestas):
--   ① ¿Qué llama el bundle publicado?
--      `aceptar_invitacion_pendiente_login`: UN caller vivo — el wrapper
--      `aceptarInvitacionEquipo` (packages/api/src/wrappers/equipo.ts:834),
--      consumido por /invitacion de la app prestador (OTA vigente S79-B).
--      `existe_invitacion_pendiente`: CERO callers en el monorepo (grep: solo
--      database.types generado); el portal legado la tiene solo en sus tipos y
--      NO está desplegado (enmienda D-471, S79). DB-side: cero funciones
--      nombran a ninguna de las dos (censo por prosrc, query vacía).
--   ② ¿Con qué rol llama?
--      authenticated SIEMPRE: /invitacion solo es alcanzable por redirect del
--      guard raíz CON sesión ((tabs)/_layout.tsx — la sonda corre después de
--      `obtenerSesion` ok con data no-null), y el RPC además rebota sin
--      auth.uid() ('Sin sesión'). No existe camino anon en ninguna superficie.
--   ③ ¿Escribe algo todavía?
--      Sí — activo=true + activado_en en prestador_empleados, el piso
--      'recepcion' en empleado_roles, y el estado de la invitación. Siempre
--      autenticado. Este REVOKE no toca authenticated: cero impacto en el
--      bundle vivo (verificación imperativa abajo lo asegura).
--
-- Reversa escrita ANTES de aplicar:
--   docs/relevamientos/2026-07-27-s80a-REVERSA-acl-invitaciones.sql
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.aceptar_invitacion_pendiente_login(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.existe_invitacion_pendiente(uuid) FROM PUBLIC, anon;

-- Verificación imperativa (L-140 parte 2): cada función queda SIN anon y CON
-- authenticated — si cualquiera de las dos condiciones falla, la migración
-- aborta entera.
DO $$
DECLARE
  v_fn text;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY[
    'public.aceptar_invitacion_pendiente_login(uuid)',
    'public.existe_invitacion_pendiente(uuid)'
  ] LOOP
    IF has_function_privilege('anon', v_fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'REVOKE incompleto: anon todavía ejecuta %', v_fn;
    END IF;
    IF NOT has_function_privilege('authenticated', v_fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'REVOKE se pasó de largo: authenticated perdió EXECUTE sobre %', v_fn;
    END IF;
  END LOOP;
END $$;
