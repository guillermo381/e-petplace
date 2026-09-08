-- REVERSA de `20260911610000_s114a_rpcs_del_caso.sql` (A3, RPCs). Escrita ANTES.
-- 🔴 NO deshace datos: los casos y sus hilos quedan. Lo que deshace es LA
--    PUERTA — sin estas funciones nadie puede abrir, responder ni resolver un
--    caso, y como la escritura de las tablas está revocada a `authenticated`
--    (F5), revertir esto deja los casos existentes en lectura para siempre.
--    *Un caso abierto que ya no se puede resolver es peor que uno que no existe.*
DROP FUNCTION IF EXISTS public.caso_elegir_destino(uuid, text);
DROP FUNCTION IF EXISTS public.caso_resolver(uuid, text, numeric, text);
DROP FUNCTION IF EXISTS public.caso_pedir_casa(uuid);
DROP FUNCTION IF EXISTS public.caso_reconocer_y_resolver(uuid, text, numeric, text);
DROP FUNCTION IF EXISTS public.caso_responder(uuid, text);
DROP FUNCTION IF EXISTS public.abrir_caso(text, uuid, text, text, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.obtener_casos_del_prestador();
DROP FUNCTION IF EXISTS public.leer_opciones_devolucion(uuid);
DROP FUNCTION IF EXISTS public.leer_mensajes_caso(uuid, timestamptz, uuid, integer);
DROP FUNCTION IF EXISTS public.leer_caso(uuid);
DROP FUNCTION IF EXISTS public.obtener_caso_de_objeto(text, uuid);
DROP FUNCTION IF EXISTS public._caso_mover(uuid, text, text, uuid, text);
DROP FUNCTION IF EXISTS public._caso_tiene_devengo(text, uuid);
DROP FUNCTION IF EXISTS public._caso_dueno_del_objeto(text, uuid);
