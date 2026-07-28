-- ============================================================================
-- REVERSA de 20260728100000_s80a_revoke_anon_rpc_invitaciones.sql
-- Escrita ANTES de aplicar la migración (disciplina S78/S79: la reversa primero).
--
-- Restaura el estado MEDIDO el 27-jul-2026 (proacl literal pre-migración,
-- idéntico en las dos funciones):
--   {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
-- es decir: EXECUTE explícito para anon Y para PUBLIC (la entrada `=X`).
--
-- NOTA DE DATOS: la migración no toca datos — la reversa tampoco (solo grants).
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.aceptar_invitacion_pendiente_login(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.existe_invitacion_pendiente(uuid) TO anon;

-- La entrada `=X` (PUBLIC) también existía en el acl medido:
GRANT EXECUTE ON FUNCTION public.aceptar_invitacion_pendiente_login(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.existe_invitacion_pendiente(uuid) TO PUBLIC;
