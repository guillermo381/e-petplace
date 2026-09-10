-- REVERSA de 20260912150000. Quita la columna y restaura el CHECK sin los estados de recepción.
ALTER TABLE public.notificacion_entrega DROP COLUMN IF EXISTS proveedor_msg_id;
ALTER TABLE public.notificacion_entrega DROP CONSTRAINT IF EXISTS notificacion_entrega_estado_check;
ALTER TABLE public.notificacion_entrega ADD CONSTRAINT notificacion_entrega_estado_check
  CHECK (estado = ANY (ARRAY['encolada','aceptada_transporte','fallida']));
