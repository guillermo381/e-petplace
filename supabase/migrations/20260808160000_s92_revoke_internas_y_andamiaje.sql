-- ══════════════════════════════════════════════════════════════════════════
-- S92-A · D-701 · TANDA 1 — LAS INTERNAS Y EL ANDAMIAJE DE TEST
--
-- CIERRA el acceso de `anon`/PUBLIC a 30 SECURITY DEFINER que NINGÚN camino
-- anónimo legítimo necesita. Es la primera de las tres tandas del loop de
-- seguridad de S92 (las otras dos: las de usuario autenticado, y los rojos con
-- decisión de producto).
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** Esta migración es DCL puro (REVOKE de EXECUTE): no hace DDL de
-- estructura, no computa backfill, y su verificación NO ancla snapshots sobre
-- datos vivos — el cinturón lee `has_function_privilege` del catálogo, que no
-- depende de ninguna fila. El founder puede escribir datos mientras corre.
--
-- ── ROJO PRODUCIDO ANTES (8-ago-2026, `scripts/s92/b1-rojos.mjs`) ─────────
-- Las 30 tenían `has_function_privilege('anon', …, 'EXECUTE') = true`, y de
-- ellas SEIS se confirmaron ejecutando de verdad por camino real como `anon`:
--   · `_familia_tiene_miembros_vigentes`, `_user_es_miembro_familia`,
--     `_user_es_titular_familia`, `_user_es_familiar_autorizado_mascota`,
--     `_user_es_codueño_mascota`  → devolvieron `false` (o sea: ejecutaron)
--   · `_validar_ownership_cuenta_comercial` → devolvió su estructura completa
--   · `mi_email`, `_notificar_dueño_prestador` → devolvieron `null`
--   · `test_guard_activo` → `false` · `test_marca_metadata` → objeto con
--     `test_data:true` · `test_marca_nombre` → **devolvió el texto marcado**
--   · `simular_prestador_inicia_paseo` → ejecutó y contestó que exige
--     SERVICE_ROLE (tiene guard adentro; el permiso igual pasó)
-- Las mutadoras y los triggers NO se invocaron a propósito: su rojo es de
-- catálogo y se dice que es de catálogo (salvaguarda declarada).
--
-- ── CENSO DE IMPACTO (L-215 · el instrumento `scripts/s92/censo-impacto.mjs`)
-- ① Los 11 triggers: un trigger NO exige EXECUTE al rol que dispara la
--    escritura — corre con el contexto del trigger. Revocar no puede romperlos.
-- ② Los helpers de policy están en 31 policies (`_user_es_codueño_mascota` 17,
--    `_user_es_titular_familia` 8, `_user_es_familiar_autorizado_mascota` 3,
--    `_user_es_miembro_familia` 2, `_familia_tiene_miembros_vigentes` 1). **Se
--    midió que TODAS son `{authenticated}`** — ninguna alcanza a `anon`/public
--    (`scripts/s92/b1-riesgos.mjs`). Por eso `authenticated` CONSERVA su
--    EXECUTE acá: revocárselo sí rompería las 31.
-- ③ El andamiaje: `git grep` en los cuatro repos vecinos que comparten esta DB
--    (regla 69) — solo aparece en `e-petplace-sistema-pruebas`, **congelado en
--    S38**, y en migraciones del legado (donde NACIÓ, que no es consumo).
--    Ninguna invocación `rpc('…')` viva. `service_role` conserva: si ese
--    andamiaje revive, corre con la llave con la que debió correr siempre.
--
-- ── LO QUE ESTA MIGRACIÓN NO HACE, dicho ──────────────────────────────────
-- **No borra nada.** El andamiaje de test SIGUE EXISTIENDO en producción; lo
-- que se cierra es quién puede alcanzarlo. El DROP exige mirar el portal legado
-- (regla 69) y es deuda aparte, no un efecto colateral de un loop de permisos.
--
-- Reversa: `docs/relevamientos/2026-08-08-s92a-REVERSA-tanda1-internas-y-andamiaje.sql`
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① TRIGGERS (11) — nadie los llama por PostgREST; el trigger no pide EXECUTE
REVOKE EXECUTE ON FUNCTION public._trg_eventos_auto_log_atencion() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._trg_eventos_update_ultimo() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._trg_eventos_validar_profundidad() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._trg_mascotas_auto_crear_visibilidad_config() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._trg_mascotas_crear_perfil_vigente() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._trg_mascotas_espejar_user_id_a_titular() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._trg_otorgar_acceso_por_cita_confirmada() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._trg_propagar_estado_vida_desde_evento() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_fee_configs() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_prestador_documentos_notif_cambio_estado() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_device_last_seen() FROM anon, PUBLIC;

-- ── ② HELPERS INTERNOS Y DE POLICY (10) — `authenticated` CONSERVA ────────
--    (las 31 policies que los usan son todas {authenticated}: medido, no supuesto)
REVOKE EXECUTE ON FUNCTION public._atencion_en_estados(uuid, text[]) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._atencion_operable(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._familia_tiene_miembros_vigentes(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._user_es_familiar_autorizado_mascota(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._user_es_miembro_familia(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._user_es_titular_familia(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public."_user_es_codueño_mascota"(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._validar_ownership_cuenta_comercial(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public."_notificar_dueño_prestador"(uuid, text, text, text, text, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mi_email() FROM anon, PUBLIC;

-- Y el GRANT explícito a `authenticated`, para que la conservación sea una
-- DECISIÓN ESCRITA y no un resto del default (es idempotente si ya lo tenía).
GRANT EXECUTE ON FUNCTION public._atencion_en_estados(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public._atencion_operable(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._familia_tiene_miembros_vigentes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._user_es_familiar_autorizado_mascota(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._user_es_miembro_familia(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._user_es_titular_familia(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public."_user_es_codueño_mascota"(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._validar_ownership_cuenta_comercial(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mi_email() TO authenticated;

-- ── ③ ANDAMIAJE DE TEST (9) — fuera de anon Y de authenticated ────────────
--    «Con guard o sin él, esa clase no vive en producción» (orden de S90).
--    `service_role` conserva: es la llave con la que un simulador debe correr.
REVOKE EXECUTE ON FUNCTION public.escenario_paseo_iniciado() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simular_cliente_crea_familia(uuid, text, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simular_cliente_crea_mascota(uuid, text, uuid, uuid, text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simular_cliente_otorga_acceso_prestador(uuid, uuid, uuid, uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simular_prestador_inicia_paseo(uuid, uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.test_guard_activo() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.test_marca_metadata(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.test_marca_nombre(text, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.test_registry_insert(text, uuid, uuid, text, jsonb) FROM anon, authenticated, PUBLIC;

-- ══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN — sobre el catálogo VIVO, y por `has_function_privilege`.
--
-- ⚠️ Se escribe así por el error ② de S91, que costó caro: aquel cinturón cazó
-- PUBLIC con `LIKE '%=X/%'` y matcheó `postgres=X/postgres`, **abortando una
-- migración de seguridad con el agujero todavía abierto** — un rojo verdadero
-- por una razón falsa. `has_function_privilege` pregunta lo que de verdad
-- importa: si el rol PUEDE ejecutar, contando defaults y PUBLIC.
-- ══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_abiertas_anon int;
  v_auth_rotos    int;
  v_andamiaje     int;
BEGIN
  -- (a) ninguna de las 30 puede quedar alcanzable por `anon`
  SELECT count(*) INTO v_abiertas_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      '_trg_eventos_auto_log_atencion','_trg_eventos_update_ultimo',
      '_trg_eventos_validar_profundidad','_trg_mascotas_auto_crear_visibilidad_config',
      '_trg_mascotas_crear_perfil_vigente','_trg_mascotas_espejar_user_id_a_titular',
      '_trg_otorgar_acceso_por_cita_confirmada','_trg_propagar_estado_vida_desde_evento',
      'audit_fee_configs','trg_prestador_documentos_notif_cambio_estado',
      'update_device_last_seen','_atencion_en_estados','_atencion_operable',
      '_familia_tiene_miembros_vigentes','_user_es_familiar_autorizado_mascota',
      '_user_es_miembro_familia','_user_es_titular_familia','_user_es_codueño_mascota',
      '_validar_ownership_cuenta_comercial','_notificar_dueño_prestador','mi_email',
      'escenario_paseo_iniciado','simular_cliente_crea_familia','simular_cliente_crea_mascota',
      'simular_cliente_otorga_acceso_prestador','simular_prestador_inicia_paseo',
      'test_guard_activo','test_marca_metadata','test_marca_nombre','test_registry_insert')
    AND has_function_privilege('anon', p.oid, 'EXECUTE');

  IF v_abiertas_anon > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (a): % de las 30 siguen alcanzables por anon', v_abiertas_anon;
  END IF;

  -- (b) EL BRAZO QUE IMPORTA: los 9 helpers de policy DEBEN seguir abiertos a
  --     `authenticated`. Si este brazo falla, la migración habría roto 31
  --     policies — que es exactamente el incidente de S91 repitiéndose.
  SELECT count(*) INTO v_auth_rotos
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('_atencion_en_estados','_atencion_operable',
      '_familia_tiene_miembros_vigentes','_user_es_familiar_autorizado_mascota',
      '_user_es_miembro_familia','_user_es_titular_familia','_user_es_codueño_mascota',
      '_validar_ownership_cuenta_comercial','mi_email')
    AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE');

  IF v_auth_rotos > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (b): % helpers quedaron cerrados a authenticated — rompería 31 policies', v_auth_rotos;
  END IF;

  -- (c) el andamiaje tampoco puede quedar al alcance de un autenticado
  SELECT count(*) INTO v_andamiaje
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('escenario_paseo_iniciado','simular_cliente_crea_familia',
      'simular_cliente_crea_mascota','simular_cliente_otorga_acceso_prestador',
      'simular_prestador_inicia_paseo','test_guard_activo','test_marca_metadata',
      'test_marca_nombre','test_registry_insert')
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

  IF v_andamiaje > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (c): % del andamiaje siguen al alcance de authenticated', v_andamiaje;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE — 30 cerradas a anon · 9 helpers vivos para authenticated · andamiaje fuera de alcance';
END
$cinturon$;

COMMIT;
