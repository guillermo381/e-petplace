-- REVERSA de 20260912080000: registrar_intencion vuelve a su cuerpo previo
-- (recuperable por git); se quita el helper y la columna spec.
DROP FUNCTION IF EXISTS public._ensamblar_plantilla(text, jsonb, jsonb, uuid);
ALTER TABLE public.cat_notificacion_tipos DROP COLUMN IF EXISTS plantilla_variables;
