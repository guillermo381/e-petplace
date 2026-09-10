-- REVERSA de 20260912330000_s115a_precio_neto_derivado.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: nada de datos — esta migración NO cambia ningún precio.
--    Declara semántica (comentarios) y agrega derivación. Revertirla devuelve la
--    ambigüedad, no un número.
BEGIN;
DROP VIEW IF EXISTS public.v_catalogo_precio_final;
DROP FUNCTION IF EXISTS public.precio_final(numeric, text);
DROP FUNCTION IF EXISTS public.precio_final_de_oferta(uuid);
COMMENT ON COLUMN public.prestador_servicios.precio IS NULL;
COMMENT ON COLUMN public.prestador_servicios.precio_paquete IS NULL;
COMMENT ON COLUMN public.prestador_servicios.precio_mensual_plan IS NULL;
COMMENT ON COLUMN public.prestador_servicios.precio_plan IS NULL;
COMMENT ON COLUMN public.prestador_servicios.precio_emergencia IS NULL;
COMMENT ON COLUMN public.prestador_servicio_tallas.precio IS NULL;
COMMENT ON COLUMN public.prestador_programas.precio_programa IS NULL;
COMMIT;
