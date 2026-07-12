-- ═════════════════════════════════════════════════════════════════════
-- S55-A B3 — CUENTA v1: preferencias persistidas (cierra D-316) +
-- preferencias de notificaciones por tipo (diseñadas para B4).
--
-- Dos tablas chicas con RLS propia como puerta (cero SECURITY DEFINER:
-- no nace ninguna función — L-140 sin objeto que vigilar acá; los
-- default privileges de tablas se cierran explícito para anon).
--
-- CONTRATO PARA B4 (el consumidor):
--   · user_preferencias.idioma — la voz server-side (notificaciones,
--     emails) habla el idioma del user; NULL = seguir el dispositivo
--     (el cliente sigue cacheando en AsyncStorage; la DB es la verdad
--     multi-dispositivo).
--   · user_notificacion_prefs — UNA fila por (user, tipo) con el
--     vocabulario de `notificaciones.tipo` (cita_recordatorio,
--     cita_confirmada, cita_completada, vacuna_vencida, promocion, …).
--     FILA AUSENTE = HABILITADA: los tipos nuevos nacen encendidos y
--     solo se persisten los apagados/re-encendidos. B4 filtra:
--       WHERE NOT EXISTS (SELECT 1 FROM user_notificacion_prefs p
--         WHERE p.user_id = destinatario AND p.tipo = tipo_a_enviar
--           AND p.habilitada = false)
--   La UI del dueño agrupa tipos en voz humana (Ley 3); el server
--   opera por tipo.
-- ═════════════════════════════════════════════════════════════════════

CREATE TABLE user_preferencias (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- espejo del riel: 'es' | 'en'; NULL = el idioma del dispositivo
  idioma     text CHECK (idioma IN ('es', 'en')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_notificacion_prefs (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- vocabulario de notificaciones.tipo (text libre hoy — sin FK: el
  -- catálogo de tipos es D-334, el contrato es "fila ausente = habilitada")
  tipo       text NOT NULL CHECK (length(btrim(tipo)) > 0),
  habilitada boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tipo)
);

ALTER TABLE user_preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notificacion_prefs ENABLE ROW LEVEL SECURITY;

-- La puerta es la fila propia; el server de B4 entra por service_role.
CREATE POLICY user_pref_select_own ON user_preferencias
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_pref_insert_own ON user_preferencias
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_pref_update_own ON user_preferencias
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY user_notif_select_own ON user_notificacion_prefs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_notif_insert_own ON user_notificacion_prefs
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_notif_update_own ON user_notificacion_prefs
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Higiene: anon no tiene nada que hacer acá (RLS ya lo dejaría en 0
-- filas; el REVOKE lo dice explícito).
REVOKE ALL ON TABLE user_preferencias FROM anon;
REVOKE ALL ON TABLE user_notificacion_prefs FROM anon;

COMMENT ON TABLE user_preferencias IS
  'Preferencias del user sincronizadas a DB (S55-B3, cierra D-316). idioma NULL = dispositivo. AsyncStorage es cache local; esto es la verdad multi-dispositivo y la voz server-side (B4).';
COMMENT ON TABLE user_notificacion_prefs IS
  'Preferencias de notificación por tipo (S55-B3, consumidor B4). Contrato: fila AUSENTE = habilitada; solo se persisten cambios. tipo = vocabulario de notificaciones.tipo.';
