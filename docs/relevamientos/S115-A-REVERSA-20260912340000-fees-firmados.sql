-- REVERSA de 20260912340000_s115a_fees_firmados.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: los eventos económicos que se hayan devengado con los fees
--    nuevos guardan su snapshot y NO se recalculan (§3.2). Revertir devuelve el
--    catálogo de fees, jamás los eventos.
BEGIN;
-- las filas nuevas se van; las viejas vuelven a estar abiertas
DELETE FROM public.fee_configs WHERE notas LIKE 'S115%';
UPDATE public.fee_configs SET vigencia_hasta = NULL
 WHERE vigencia_hasta = '2026-10-01 00:00:00-05'::timestamptz;
ALTER TABLE public.fee_configs DROP COLUMN IF EXISTS minimo_por_transaccion;
COMMIT;
