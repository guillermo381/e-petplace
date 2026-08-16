-- REVERSA de 20260818010000_s99a_promesa_por_vendedor.sql (escrita ANTES)
-- Qué deshace: la función entera (lector puro — cero tablas, cero datos,
-- cero escritura; COMPONE `calcular_promesa_despensa`, que no se toca).
-- Un bundle que la llame recibe PGRST202, el wrapper lo tipa, y la
-- superficie degrada a NO decir la promesa antes de comprar — que es el
-- estado previo a la firma (se dice al checkout). Degrada, no rompe.
DROP FUNCTION IF EXISTS public.promesa_por_vendedor(uuid[], date);
