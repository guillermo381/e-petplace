-- REVERSA de 20260908660000 · mueren la respuesta automática del refugio y
-- la marca de lectura del hilo.
-- ⚠️ BORRA DATOS: los textos que los refugios hayan escrito y las marcas de
-- lectura de cada persona. Lo primero es contenido que nadie más tiene; lo
-- segundo se re-deriva solo (todo vuelve a verse como no leído una vez).
DROP FUNCTION IF EXISTS public.marcar_hilo_leido(uuid);
DROP FUNCTION IF EXISTS public.definir_respuesta_automatica_refugio(text);
DROP TABLE IF EXISTS public.adopcion_lectura;
DROP TABLE IF EXISTS public.adopcion_respuesta_automatica;
-- crear_solicitud_adopcion se recupera de pg_get_functiondef del commit anterior.
