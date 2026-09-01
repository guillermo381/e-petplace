/* REVERSA de `20260907540000_s111a_mensajeria_adopcion.sql` — ESCRITA ANTES.
   🔴 QUÉ NO DESHACE:
   1. **DESTRUYE LOS HILOS.** `adopcion_mensaje` es APPEND-ONLY por diseño —
      corregir es agregar, no editar. Dropearla borra conversaciones entre dos
      personas, que es justo el material de una disputa.
   2. **DESTRUYE LAS SOLICITUDES** y con ellas el registro de quién postuló y
      cuándo. `creada_en` es el reloj de §5: sin la tabla no hay reloj.
   3. Volver el CHECK de `notificaciones.tipo` a sus 31 valores **FALLA si ya
      se emitió alguno de los seis nuevos** — las filas viejas lo violarían.
   ⇒ Mirar antes:
      SELECT count(*) FROM adopcion_solicitud;
      SELECT count(*) FROM adopcion_mensaje;
      SELECT tipo, count(*) FROM notificaciones
       WHERE tipo LIKE 'adopcion_%' OR tipo LIKE 'padrinazgo_%' GROUP BY 1; */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_solicitudes_en_silencio();
DROP FUNCTION IF EXISTS public.cerrar_solicitud_adopcion(uuid, text);
DROP FUNCTION IF EXISTS public.responder_solicitud_adopcion(uuid, text);
DROP FUNCTION IF EXISTS public.crear_solicitud_adopcion(uuid, text);
DROP TABLE IF EXISTS public.adopcion_mensaje;
DROP TABLE IF EXISTS public.adopcion_solicitud;
DELETE FROM public.cat_notificacion_tipos WHERE codigo IN
  ('adopcion_solicitud_nueva','adopcion_mensaje_nuevo','adopcion_solicitud_respondida',
   'adopcion_sin_respuesta','padrinazgo_ahijado_adoptado','padrinazgo_refugio_inactivo');
-- El CHECK de notificaciones.tipo se repone A MANO desde su migración de origen.
COMMIT;
