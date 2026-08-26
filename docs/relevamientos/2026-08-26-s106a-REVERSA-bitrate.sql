-- ============================================================================
-- REVERSA de `20260826300000_s106a_bitrate_config.sql`. Escrita ANTES.
--
-- ⚠️ QUÉ NO DESHACE: si para cuando se corra ya se cambió el valor desde el
--    panel, esta reversa BORRA ESE CAMBIO junto con la fila. Se mide antes:
--    `SELECT valor FROM app_config WHERE clave='video_bitrate_kbps';`
--    Si no es el valor sembrado, alguien lo movió y esa decisión es de la mesa.
--
--    Y la consecuencia de borrarlo: el lector devuelve el default del CÓDIGO.
--    *No queda sin bitrate — queda con uno que ya no se puede mover sin build,
--    que es exactamente el estado del que esta migración salió.*
-- ============================================================================
BEGIN;
REVOKE ALL ON FUNCTION public.obtener_config_video() FROM authenticated, anon;
DROP FUNCTION IF EXISTS public.obtener_config_video();
DELETE FROM public.app_config WHERE clave = 'video_bitrate_kbps';
COMMIT;
