-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812190000_s96_b10_cinco_avisos.sql
-- ⚠️ QUÉ NO DESHACE: las intenciones/notificaciones ya nacidas de los tipos
--    nuevos quedan (historia). Si existe alguna fila en `notificaciones` con
--    un tipo nuevo, restaurar el CHECK viejo REBOTA — y ese rebote es
--    correcto: primero se decide qué hacer con esas filas.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP TRIGGER IF EXISTS trg_pedido_avisa_familia ON public.pedido_estados;
DROP FUNCTION IF EXISTS public._trg_pedido_avisa_familia();

DELETE FROM public.cat_notificacion_tipos
 WHERE codigo IN ('pedido_confirmado','pedido_en_camino','pedido_hacia_destino',
                  'pedido_entregado','pedido_entrega_fallida');

ALTER TABLE public.notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;
ALTER TABLE public.notificaciones ADD CONSTRAINT notificaciones_tipo_check
  CHECK (tipo = ANY (ARRAY['pedido_estado','cita_recordatorio','cita_confirmada',
    'vacuna_vencida','wearable_alerta','mensaje_nuevo','promocion','sistema',
    'pago_confirmado','devolucion_estado','pedido_recurrente','cita_rechazada',
    'cita_completada','cita_no_show','cita_solicitada','cita_cancelada_cliente',
    'cita_calificada','prestador_aprobado','prestador_rechazado','prestador_suspendido',
    'documento_aprobado','documento_rechazado','liquidacion_disponible',
    'alta_asistida_pendiente_enviar_email','alta_asistida_completada_por_cliente',
    'alta_asistida_vencida_soporte']::text[]));

COMMIT;
