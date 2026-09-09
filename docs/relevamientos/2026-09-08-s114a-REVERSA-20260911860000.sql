-- REVERSA de 20260911860000_s114a_productor_avisos_caso.sql — escrita ANTES.
DROP TRIGGER IF EXISTS trg_caso_abierto_avisa ON public.casos_postventa;
DROP TRIGGER IF EXISTS trg_caso_mensaje_avisa ON public.caso_mensajes;
DROP FUNCTION IF EXISTS public._trg_caso_abierto_avisa();
DROP FUNCTION IF EXISTS public._trg_caso_mensaje_avisa();
DELETE FROM cat_notificacion_tipos WHERE codigo IN ('caso_abierto','caso_prestador_respondio','caso_familia_escribio');
-- NO revierte intenciones ya registradas (son historia).
