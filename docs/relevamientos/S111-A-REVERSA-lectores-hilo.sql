/* REVERSA de `20260907580000_s111a_lectores_del_hilo.sql` — ESCRITA ANTES.
   🔴 QUÉ HACE AL CORRERLA: **apaga las DOS superficies del hilo.** El motor de
   la mensajería queda entero —los tres escritores y el reloj siguen— y sin nada
   con qué dibujarlo: motor sin puerta otra vez, que es de donde vino.
   NO borra ninguna solicitud ni ningún mensaje: sólo saca los lectores. */
BEGIN;
DROP FUNCTION IF EXISTS public.contar_solicitudes_por_revisar();
DROP FUNCTION IF EXISTS public.obtener_solicitudes_de_mis_publicaciones(boolean);
DROP FUNCTION IF EXISTS public.obtener_mis_solicitudes_adopcion();
DROP FUNCTION IF EXISTS public._hilo_mensajes(uuid);
COMMIT;
