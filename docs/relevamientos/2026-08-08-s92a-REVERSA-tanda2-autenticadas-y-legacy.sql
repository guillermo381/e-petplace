-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260808170000_s92_revoke_autenticadas_y_legacy.sql` (S92-A · D-701)
-- ESCRITA ANTES DE APLICAR LA MIGRACIÓN.
--
-- QUÉ DESHACE: devuelve EXECUTE a `anon` y PUBLIC sobre las 27 funciones de la
-- tanda 2. No toca los GRANT a `authenticated` que la migración dejó escritos:
-- ésos son la conservación deliberada del camino legítimo y correrlos de nuevo
-- no haría daño, pero tampoco hace falta.
--
-- QUÉ **NO** DESHACE:
--   · Reabre a `anon` puertas que ESCRIBEN y una que DEVENGA DINERO
--     (`cerrar_paseo_con_calidad`). Ese es el estado del que veníamos, no un
--     estado neutro.
--   · Reabre a `anon` `encontrar_prestador_emergencia`, que entrega **lat/lon
--     exactas** de un prestador — lo que S84 firmó sacar de la superficie
--     pública. Correr esta reversa DESHACE UNA LETRA FIRMADA, no solo una cura.
--
-- Si hay que revertir por un consumidor roto, lo barato y honesto es revertir
-- SOLO la función que rompió, no las 27.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── (b) DE USUARIO AUTENTICADO (18) ───────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.agregar_novedad_paseo(uuid, text, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.cerrar_paseo_con_calidad(uuid, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirmar_cita_servicio(uuid, uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.desactivar_rasgo_identidad_personal(uuid, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_status_para_invitacion(text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_estado_onboarding() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_estado_onboarding_dueno() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.iniciar_atencion_cita(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.marcar_invitacion_aceptada(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_alertas_activas_mascota_para_familia_servicio(uuid, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_paseo_por_cita(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_resumen_actividad_prestador(uuid, text, date, date) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.rechazar_cita_servicio(uuid, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.rechazar_invitacion_pendiente_login(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_archivo_atencion(uuid, text, text, text, text, text, text, bigint) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_track_paseo(uuid, jsonb, boolean) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_puede_ver_dimension(uuid, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_identificacion_disponible(text, text) TO anon, PUBLIC;

-- ── LEGACY SIN CONSUMIDOR (8) ─────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_country_config(text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_features(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, text, text, text, text, jsonb, jsonb) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_analytics_event(text, uuid, jsonb, text, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_active_in(text, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.use_beta_invite(uuid, uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_feature(uuid, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_beta_access(text, text) TO anon, PUBLIC;

-- ── GEO (1) — ojo: esto REABRE lat/lon exactas a anon ─────────────────────
GRANT EXECUTE ON FUNCTION public.encontrar_prestador_emergencia(double precision, double precision, text, integer) TO anon, PUBLIC;

COMMIT;
