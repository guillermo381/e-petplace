-- REVERSA de 20260817230000_s99a_d837_capacidad_en_repartidor.sql (ANTES)
-- Qué deshace y qué NO:
--  · DROP de la puerta y de la columna `repartidor_id` de recursos_reparto —
--    SE PIERDEN LOS VÍNCULOS recurso→repartidor (los del backfill y los que
--    el vendedor haya atado). Las CAPACIDADES no se pierden: viven en las
--    filas de recursos_reparto, que esta reversa no toca.
--  · `cupo_reparto_del_dia` NO se tocó en la migración (suma por cuenta,
--    igual que siempre) — nada que revertir ahí.
DROP FUNCTION IF EXISTS public.configurar_capacidad_repartidor(uuid, integer, integer[]);
ALTER TABLE public.recursos_reparto DROP COLUMN IF EXISTS repartidor_id;
