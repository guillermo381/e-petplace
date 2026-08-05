-- REVERSA de `20260805120000_lote2_d657_memorial_planes.sql` (S88-A · D-657).
-- Escrita ANTES de aplicar.
--
-- ⚠️ NOTA DE DATOS Y DE LEY — esta reversa NO es neutra:
--  1. Revertir REABRE D-657 ENTERA: el motor vuelve a renovar y cobrar planes
--     de mascotas en memorial (el ANTES medido: renovados=1 + 29 citas firmes
--     nuevas para una mascota fallecida). Y desde S87 el motor de avisos calla
--     lo de esa mascota ⇒ revertir reinstala EL COBRO SILENCIOSO.
--  2. Revertir el código NO revierte los datos: una suscripción cancelada por
--     el trigger con su liberación queda cancelada y liberada. Correcto: la
--     enmienda de la cláusula S80 (POLITICAS P16 + FINANCIERO §2) sigue
--     firmada aunque el motor se revierta.
--  3. Los cuerpos anteriores de `cerrar_y_renovar_planes` y
--     `contratar_plan_paseo` viven en el historial de migraciones — se
--     re-aplican ESOS, no se improvisan.

BEGIN;
DROP TRIGGER IF EXISTS trg_mascotas_memorial_planes ON public.mascotas;
DROP FUNCTION IF EXISTS public._trg_mascotas_memorial_planes();
-- cerrar_y_renovar_planes y contratar_plan_paseo: re-aplicar los cuerpos del
-- historial (20260805070000 y su origen respectivamente).
COMMIT;
