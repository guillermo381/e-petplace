-- REVERSA de 20260912070000: quita el mapeo de plantillas de los dos tipos.
UPDATE cat_notificacion_tipos SET plantilla_whatsapp = NULL
 WHERE codigo IN ('caso_devolucion_por_elegir','devolucion_estado');
