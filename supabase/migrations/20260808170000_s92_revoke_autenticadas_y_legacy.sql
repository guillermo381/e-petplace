-- ══════════════════════════════════════════════════════════════════════════
-- S92-A · D-701 · TANDA 2 — LAS DE USUARIO AUTENTICADO, EL LEGACY Y LA GEO
--
-- Cierra `anon`/PUBLIC sobre 27 SECURITY DEFINER más y **deja escrito** el
-- GRANT a `authenticated`, para que la audiencia de cada una sea una DECISIÓN
-- y no el resto de un default (que es toda la diferencia entre D-701 y una
-- herencia).
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** DCL puro; sin DDL de estructura, sin backfill, y el cinturón
-- lee catálogo (`has_function_privilege`), que no ancla ninguna fila viva.
--
-- ── ROJO PRODUCIDO ANTES (`scripts/s92/b1-rojos.mjs`, 8-ago-2026) ─────────
-- Las 27 con `has_function_privilege('anon', …) = true`. Confirmadas ejecutando
-- de verdad como `anon` por camino real, entre otras:
--   · `get_user_features` → devolvió la config de features (max_mascotas, …)
--   · `validate_beta_access` → devolvió su mensaje de acceso
--   · `verificar_identificacion_disponible` → **`{"disponible":true}`** ⇒ es un
--     ORÁCULO DE CÉDULAS: con un número real dice si ya hay cuenta
--   · `get_estado_onboarding` → 200 · `service_active_in` → 200
--   · `email_status_para_invitacion`, `obtener_paseo_por_cita`,
--     `obtener_resumen_actividad_prestador`, `obtener_alertas_…` → **el permiso
--     PASÓ** y cortó el gate del CUERPO (`auth_required`). *Un rebote de negocio
--     prueba que el permiso pasó; uno de auth, que el gate funcionó* — acá el
--     cuerpo salvó lo que el permiso no.
--
-- ── LOS TRES GRUPOS Y SU PORQUÉ ───────────────────────────────────────────
-- ① DE AUTENTICADO (18). El portal legado invoca 14 de ellas por `rpc('…')`,
--    todas desde código que corre con sesión (`src/lib/citas.ts`,
--    `paseo/index.ts`, `atencion/index.ts`, `cuentaComercial.ts`). `anon` sale;
--    `authenticated` queda escrito. **`cerrar_paseo_con_calidad` está acá y es
--    la más cara: DEVENGA DINERO, y hasta hoy la anon key del bundle llegaba a
--    su puerta.**
-- ② LEGACY SIN CONSUMIDOR (8). Cero invocaciones en el monorepo y cero
--    `rpc('…')` en los cuatro repos vecinos (regla 69): solo aparecen en las
--    migraciones donde NACIERON, que no es consumo. Se revoca `anon` y se
--    CONSERVA `authenticated`: la cura barata de un legado compartido es la
--    reversible. **El DROP no se hace acá** — es deuda con su propio disparo,
--    igual que en D-471.
-- ③ GEO (1). `encontrar_prestador_emergencia` entrega **lat/lon exactas** a
--    `anon`. **No es una decisión nueva: es la letra de S84 aplicada donde
--    faltaba** — esa sesión firmó sacar `lat`/`lon` de `v_prestadores_publicos`
--    y esta puerta quedó afuera del barrido. *La ley existía; se había aplicado
--    en una puerta y no en la otra.*
--
-- ── LO QUE ESTA MIGRACIÓN **NO** TOCA, y por qué ──────────────────────────
--   · **`email_exists`** — FRENO declarado (freno 2 del arranque: cambia
--     comportamiento visible). Es enumeración de usuarios probada, PERO su
--     único consumidor medido es `e-petplace-v2/src/pages/Checkout.tsx`, un
--     checkout que por naturaleza corre sin sesión. Cerrarlo puede romper un
--     flujo de terceros; queda con su medición para la mesa.
--   · **`is_admin`** — QUEDA ABIERTA A `anon`, con su porqué: **11 policies con
--     rol `{public}` la llaman** (`profiles`, `productos`, `pedidos`,
--     `mascotas_adopcion`, `objects` de storage, tres `evento_caso_clinico_*`,
--     `evento_hito_narrativo`, `solicitudes_adopcion`). Revocarle EXECUTE a
--     `anon` **no la vuelve más segura: rompe la evaluación de esas 11 policies**
--     y con ella la lectura pública de adopción. Devuelve `false` sin sesión.
--     *Es infraestructura de policy, no una puerta.*
--
-- Reversa: `docs/relevamientos/2026-08-08-s92a-REVERSA-tanda2-autenticadas-y-legacy.sql`
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① DE USUARIO AUTENTICADO (18) ─────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.agregar_novedad_paseo(uuid, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cerrar_paseo_con_calidad(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirmar_cita_servicio(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.desactivar_rasgo_identidad_personal(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_status_para_invitacion(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_estado_onboarding() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_estado_onboarding_dueno() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.iniciar_atencion_cita(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.marcar_invitacion_aceptada(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.obtener_alertas_activas_mascota_para_familia_servicio(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.obtener_paseo_por_cita(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.obtener_resumen_actividad_prestador(uuid, text, date, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rechazar_cita_servicio(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rechazar_invitacion_pendiente_login(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_archivo_atencion(uuid, text, text, text, text, text, text, bigint) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_track_paseo(uuid, jsonb, boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_puede_ver_dimension(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verificar_identificacion_disponible(text, text) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.agregar_novedad_paseo(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cerrar_paseo_con_calidad(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_cita_servicio(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.desactivar_rasgo_identidad_personal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.email_status_para_invitacion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_estado_onboarding() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_estado_onboarding_dueno() TO authenticated;
GRANT EXECUTE ON FUNCTION public.iniciar_atencion_cita(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_invitacion_aceptada(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_alertas_activas_mascota_para_familia_servicio(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_paseo_por_cita(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_resumen_actividad_prestador(uuid, text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rechazar_cita_servicio(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rechazar_invitacion_pendiente_login(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_archivo_atencion(uuid, text, text, text, text, text, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_track_paseo(uuid, jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_puede_ver_dimension(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_identificacion_disponible(text, text) TO authenticated;

-- ── ② LEGACY SIN CONSUMIDOR (8) — `anon` fuera, `authenticated` conserva ──
REVOKE EXECUTE ON FUNCTION public.get_country_config(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_features(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(uuid, text, text, text, text, jsonb, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_analytics_event(text, uuid, jsonb, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.service_active_in(text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.use_beta_invite(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_feature(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_beta_access(text, text) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_country_config(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_features(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, text, text, text, text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_analytics_event(text, uuid, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.service_active_in(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_beta_invite(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_feature(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_beta_access(text, text) TO authenticated;

-- ── ③ GEO (1) — la letra de S84, aplicada donde faltaba ───────────────────
REVOKE EXECUTE ON FUNCTION public.encontrar_prestador_emergencia(double precision, double precision, text, integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.encontrar_prestador_emergencia(double precision, double precision, text, integer) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN — por `has_function_privilege`, sobre el catálogo vivo.
-- Sus tres brazos se probaron EN ROJO antes de confiarle la tanda 1
-- (`scripts/s92/b1-probar-cinturon.mjs`): los tres saben fallar.
-- ══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_abiertas int;
  v_auth_rotos int;
  v_is_admin_ok boolean;
BEGIN
  SELECT count(*) INTO v_abiertas
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'agregar_novedad_paseo','cerrar_paseo_con_calidad','confirmar_cita_servicio',
      'desactivar_rasgo_identidad_personal','email_status_para_invitacion',
      'get_estado_onboarding','get_estado_onboarding_dueno','iniciar_atencion_cita',
      'marcar_invitacion_aceptada','obtener_alertas_activas_mascota_para_familia_servicio',
      'obtener_paseo_por_cita','obtener_resumen_actividad_prestador','rechazar_cita_servicio',
      'rechazar_invitacion_pendiente_login','registrar_archivo_atencion','registrar_track_paseo',
      'user_puede_ver_dimension','verificar_identificacion_disponible','get_country_config',
      'get_user_features','log_admin_action','log_analytics_event','service_active_in',
      'use_beta_invite','user_has_feature','validate_beta_access','encontrar_prestador_emergencia')
    AND has_function_privilege('anon', p.oid, 'EXECUTE');

  IF v_abiertas > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (a): % de las 27 siguen alcanzables por anon', v_abiertas;
  END IF;

  -- el brazo del LADO SANO: las 27 tienen que seguir vivas para `authenticated`
  SELECT count(*) INTO v_auth_rotos
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'agregar_novedad_paseo','cerrar_paseo_con_calidad','confirmar_cita_servicio',
      'desactivar_rasgo_identidad_personal','email_status_para_invitacion',
      'get_estado_onboarding','get_estado_onboarding_dueno','iniciar_atencion_cita',
      'marcar_invitacion_aceptada','obtener_alertas_activas_mascota_para_familia_servicio',
      'obtener_paseo_por_cita','obtener_resumen_actividad_prestador','rechazar_cita_servicio',
      'rechazar_invitacion_pendiente_login','registrar_archivo_atencion','registrar_track_paseo',
      'user_puede_ver_dimension','verificar_identificacion_disponible','get_country_config',
      'get_user_features','log_admin_action','log_analytics_event','service_active_in',
      'use_beta_invite','user_has_feature','validate_beta_access','encontrar_prestador_emergencia')
    AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE');

  IF v_auth_rotos > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (b): % quedaron cerradas a authenticated — cortaría el camino legítimo', v_auth_rotos;
  END IF;

  -- (c) EL GUARD DE LA DECISIÓN ESCRITA: `is_admin` DEBE seguir alcanzable por
  --     `anon`. Si una tanda futura la revoca «por prolijidad», rompe 11
  --     policies {public} y el síntoma aparece lejos. Que salte acá.
  SELECT has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') INTO v_is_admin_ok;
  IF NOT v_is_admin_ok THEN
    RAISE EXCEPTION 'CINTURÓN (c): is_admin quedó cerrada a anon — rompe las 11 policies {public} que la llaman';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE — 27 cerradas a anon · 27 vivas para authenticated · is_admin conservada por decisión';
END
$cinturon$;

COMMIT;
