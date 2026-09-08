-- REVERSA de `20260911650000_s114a_mis_casos.sql`. Escrita ANTES.
-- Deshace obtener_mis_casos y revierte leer_caso a su forma sin etapa_en_escalera.
-- No toca datos.
DROP FUNCTION IF EXISTS public.obtener_mis_casos();
-- leer_caso se recrea desde su cuerpo previo (en 20260911610000); revertir
-- exige reaplicar esa versión. La única diferencia es la clave `etapa_en_escalera`.
