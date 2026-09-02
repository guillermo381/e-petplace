-- REVERSA de 20260908220000_s112a_tipo_codigo_firma.sql — ESCRITA ANTES.
-- 🔴 QUE NO DESHACE: revertir esto deja `solicitar_codigo_firma` reventando con
-- `tipo_desconocido` ⇒ NADIE puede firmar un acta. Y le devuelve a cualquiera la
-- posibilidad de apagarse a si mismo los avisos de `seguridad_cuenta` — incluido
-- el codigo de su propia firma.
BEGIN;
ALTER TABLE public.user_notificacion_prefs DROP CONSTRAINT IF EXISTS chk_no_apagar_lo_inapagable;
DELETE FROM public.cat_notificacion_tipos WHERE codigo = 'codigo_firma_adopcion';
COMMIT;
