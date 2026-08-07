-- REVERSA de 20260807030000_s89a_registrar_push_token.sql (escrita ANTES).
-- Mata la RPC; la tabla push_tokens NO se toca (es pre-existente, S81).
DROP FUNCTION IF EXISTS public.registrar_push_token(text, text);
