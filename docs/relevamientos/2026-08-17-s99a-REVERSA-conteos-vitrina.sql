-- REVERSA de 20260817190000_s99a_l5b_conteos_vitrina_por_eje.sql (escrita ANTES)
-- Qué deshace: la función entera (es un lector puro — cero tablas, cero datos).
-- Un bundle que la llame recibe PGRST202; el wrapper lo tipa y la superficie
-- degrada a navegar sin conteos (ofrecer sin saber — el estado pre-migración).
DROP FUNCTION IF EXISTS public.conteos_vitrina_por_eje();
