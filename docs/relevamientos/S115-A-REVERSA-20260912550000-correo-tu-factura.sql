-- REVERSA de 20260912550000 · escrita ANTES.
-- ⚠️ Las intenciones ya registradas NO se borran (son historia de lo enviado).
--    Revertir apaga el productor: desde ahí, una factura autorizada deja de
--    llegarle a la familia y nadie se entera — el silencio se ve igual que
--    «todavía no hubo facturas».
DROP TRIGGER IF EXISTS trg_factura_autorizada_correo ON public.documentos_fiscales;
DROP FUNCTION IF EXISTS public._trg_factura_autorizada_correo();
DELETE FROM public.cat_notificacion_tipos WHERE codigo = 'factura_emitida';
