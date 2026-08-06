-- REVERSA de `20260805270000_lector_posicion_prestador.sql`. Escrita ANTES.
-- Aditiva pura: la reversa es un DROP y no toca datos ni otras funciones.
--
-- ⚠️ REVERTIR devuelve a las cuatro superficies a derivar el rol de «cuántas
--    filas leí» (D-664) — que da TRUE para TODOS los miembros. No es volver a
--    un estado seguro: es volver al defecto medido.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mi_posicion_en_prestador(uuid);
COMMIT;
