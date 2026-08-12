-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812230000_s96_oferta_expone_vendedor.sql
--
-- Deshace: `ofertas.cuenta_comercial_id` (denormalización derivada) y su
-- trigger de estampado.
--
-- ⚠️ QUÉ NO DESHACE: nada de datos propios — la columna es DERIVADA del
--    `sku_id` (vendedor_skus.cuenta_comercial_id) y se reconstruye entera al
--    re-aplicar. Pero revertir ROMPE el checkout del cliente: la app vuelve a
--    no poder saber a quién le compra (el bloqueante de la pista D del
--    12-ago). No se revierte con pantallas de D publicadas encima.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP TRIGGER IF EXISTS trg_oferta_estampa_vendedor ON public.ofertas;
DROP FUNCTION IF EXISTS public._trg_oferta_estampa_vendedor();
ALTER TABLE public.ofertas DROP COLUMN IF EXISTS cuenta_comercial_id;

COMMIT;
