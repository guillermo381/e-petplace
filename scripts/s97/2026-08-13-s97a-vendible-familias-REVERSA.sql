-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813200000_s97a_vendible_y_familias_maestro.sql
--
-- Deshace: la columna `productos.vendible` y las TRES familias nuevas del
-- maestro (heno · acondicionador_agua · sustrato), y devuelve `higiene` a
-- INACTIVA.
--
-- ⚠️ QUÉ NO DESHACE Y POR QUÉ NO SE CORRE A LA LIGERA:
--   · Si hay PRODUCTOS cargados en las familias nuevas, el UPDATE de
--     desactivación los deja con familia inactiva (la puerta canónica ya no
--     los re-propondría) — no los borra: borrarlos es decisión aparte.
--   · Revertir `vendible` BORRA la línea comercial trazada en datos (los
--     productos marcados no-comprables pierden esa marca SIN backup acá).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

ALTER TABLE public.productos DROP COLUMN IF EXISTS vendible;

UPDATE public.cat_familias_producto SET activo = false
 WHERE codigo IN ('heno','acondicionador_agua','sustrato','higiene');

-- Las tres nuevas se borran SOLO si ningún producto las referencia; si hay
-- productos, quedan inactivas (el DELETE rebota por FK y es correcto).
DELETE FROM public.cat_familias_producto
 WHERE codigo IN ('heno','acondicionador_agua','sustrato')
   AND NOT EXISTS (SELECT 1 FROM public.productos p
                    WHERE p.familia_codigo = cat_familias_producto.codigo);

COMMIT;
