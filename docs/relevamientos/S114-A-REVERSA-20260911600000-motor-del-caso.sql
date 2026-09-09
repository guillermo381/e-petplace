-- REVERSA de `20260911600000_s114a_motor_del_caso.sql` (A3, tablas). Escrita ANTES.
--
-- 🔴 QUÉ NO DESHACE, y hay que leerlo antes de correrla:
--    · **Los casos son hechos de una familia**, no estado de una app. Borrarlos
--      borra la constancia de un reclamo y de la plata que se le devolvió.
--      Si ya hay casos resueltos, esto NO se corre: se conversa.
--    · Los `caso_mensajes` son una conversación de tres partes. Un hilo borrado
--      no se reconstruye.
--    · Las RPCs viven en `20260911070000` y hay que quitarlas ANTES (dependen
--      de estas tablas).
--
-- Censo obligatorio antes de revertir:
--   select count(*) from casos_postventa;                     -- si > 0, PARAR
--   select count(*) from casos_postventa where etapa='resuelto';  -- si > 0, PARAR
DROP TABLE IF EXISTS public.caso_mensajes;
DROP TABLE IF EXISTS public.casos_postventa;
DROP TABLE IF EXISTS public.cat_transiciones_caso;
DROP TABLE IF EXISTS public.cat_estados_caso;
DROP FUNCTION IF EXISTS public.caso_ventana_dias();
