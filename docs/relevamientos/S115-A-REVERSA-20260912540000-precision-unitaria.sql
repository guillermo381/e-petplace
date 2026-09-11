-- REVERSA de 20260912540000 · escrita ANTES.
-- ⚠️ ACHICAR LA PRECISIÓN REDONDEA LOS DATOS QUE YA ESTÉN ADENTRO. Al aplicar la
--    migración hay 0 filas, pero el día que se revierta con líneas vivas, cada
--    `precio_unitario` de 6 decimales pierde 4 y NO se recupera. Revertir con
--    filas exige medir antes cuántas tienen decimales más allá de 2.
ALTER TABLE public.pagos_desglose_lineas
  ALTER COLUMN precio_unitario TYPE numeric(12,2),
  ALTER COLUMN cantidad        TYPE numeric(12,3);
