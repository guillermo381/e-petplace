-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260806260000_s89a_documento_token_carnet.sql
-- Escrita ANTES. Mata RPC y tabla enteras (nacieron ahí).
-- Nota: los tokens vivos mueren con la tabla — el botón de descarga del
-- cliente deja de funcionar (la función rebota token_invalido).
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.emitir_token_documento(uuid, text);
DROP TABLE IF EXISTS public.documento_token;
