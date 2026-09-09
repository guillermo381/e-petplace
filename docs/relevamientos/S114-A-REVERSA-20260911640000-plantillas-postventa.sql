-- REVERSA de `20260911640000_s114a_plantillas_postventa.sql`. Escrita ANTES.
-- Deshace los dos mapeos de postventa. NO deshace nada más: el mecanismo
-- (columnas + resolvedor) es de `20260911030000`.
UPDATE public.cat_notificacion_tipos SET plantilla_whatsapp = NULL
 WHERE codigo IN ('caso_elegir_devolucion','caso_resuelto');
