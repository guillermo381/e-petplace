-- REVERSA de 20260912010000. Restaura caso_resolver SIN el tope tipado (cuerpo de
-- 20260911980000, recuperable por git), quita el helper y devuelve
-- caso_reconocer_y_resolver a su firma con p_destino (motivo hardcodeado):
DROP FUNCTION IF EXISTS public.caso_reconocer_y_resolver(uuid,text,numeric,text);
CREATE OR REPLACE FUNCTION public.caso_reconocer_y_resolver(p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL, p_destino text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$ SELECT public.caso_resolver(p_caso_id, p_alcance, p_monto, 'el prestador lo reconoció'); $fn$;
DROP FUNCTION IF EXISTS public._caso_monto_objeto(text, uuid);
-- (caso_resolver: reaplicar el CREATE OR REPLACE de 20260911980000)
