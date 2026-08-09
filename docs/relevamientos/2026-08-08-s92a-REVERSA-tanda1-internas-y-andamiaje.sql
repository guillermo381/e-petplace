-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260808160000_s92_revoke_internas_y_andamiaje.sql`  (S92-A · D-701)
-- ESCRITA ANTES DE APLICAR LA MIGRACIÓN (disciplina de la casa).
--
-- QUÉ DESHACE: devuelve EXECUTE a `anon` y a PUBLIC sobre las 30 funciones de
-- la tanda 1, y a `authenticated` sobre las 9 del andamiaje de test.
--
-- QUÉ **NO** DESHACE — y es lo único que importa leer antes de correrla:
--   · Correr esta reversa REABRE el acceso de `anon` a 30 SECURITY DEFINER,
--     incluidas nueve funciones de ANDAMIAJE DE TEST que viven en producción
--     (`simular_*`, `test_*`, `escenario_paseo_iniciado`). Dos de ellas se
--     midieron ejecutando de verdad para `anon` el 8-ago-2026.
--   · No es una reversa neutra: es volver a abrir puertas. Se corre solo si la
--     migración rompió algo medido, y se declara qué.
--
-- CÓMO SE USA: se aplica ENTERA; los REVOKE de la migración son idempotentes y
-- estos GRANT también.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① TRIGGERS (11) ───────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public._trg_eventos_auto_log_atencion() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._trg_eventos_update_ultimo() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._trg_eventos_validar_profundidad() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._trg_mascotas_auto_crear_visibilidad_config() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._trg_mascotas_crear_perfil_vigente() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._trg_mascotas_espejar_user_id_a_titular() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._trg_otorgar_acceso_por_cita_confirmada() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._trg_propagar_estado_vida_desde_evento() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_fee_configs() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.trg_prestador_documentos_notif_cambio_estado() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_device_last_seen() TO anon, PUBLIC;

-- ── ② HELPERS INTERNOS Y DE POLICY (10) ───────────────────────────────────
GRANT EXECUTE ON FUNCTION public._atencion_en_estados(uuid, text[]) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._atencion_operable(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._familia_tiene_miembros_vigentes(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._user_es_familiar_autorizado_mascota(uuid, uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._user_es_miembro_familia(uuid, uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._user_es_titular_familia(uuid, uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public."_user_es_codueño_mascota"(uuid, uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._validar_ownership_cuenta_comercial(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public."_notificar_dueño_prestador"(uuid, text, text, text, text, jsonb) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.mi_email() TO anon, PUBLIC;

-- ── ③ ANDAMIAJE DE TEST (9) — acá `authenticated` también vuelve ──────────
GRANT EXECUTE ON FUNCTION public.escenario_paseo_iniciado() TO anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.simular_cliente_crea_familia(uuid, text, uuid) TO anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.simular_cliente_crea_mascota(uuid, text, uuid, uuid, text, text) TO anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.simular_cliente_otorga_acceso_prestador(uuid, uuid, uuid, uuid, text) TO anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.simular_prestador_inicia_paseo(uuid, uuid, uuid) TO anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.test_guard_activo() TO anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.test_marca_metadata(uuid, text) TO anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.test_marca_nombre(text, uuid) TO anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.test_registry_insert(text, uuid, uuid, text, jsonb) TO anon, authenticated, PUBLIC;

COMMIT;
