-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812150000_s96_b4_foto_entrega_90_dias.sql
--
-- Deshace: las policies del bucket `entregas`, el encolador de 90 días, su
-- cron, y la columna de purga.
--
-- ⚠️ QUÉ NO DESHACE: el bucket `entregas` NO se borra si tiene objetos
--    (fotos reales de puertas de casas de familias) — borrar el bucket
--    borraría evidencia viva. Se deja el DELETE comentado a propósito: si
--    hay que borrarlo, primero se decide qué pasa con las fotos. Tampoco
--    des-encola lo ya encolado: un objeto que el barredor ya borró no vuelve.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

SELECT cron.unschedule('purgar-fotos-entrega');
DROP FUNCTION IF EXISTS public.encolar_fotos_entrega_vencidas();

DROP POLICY IF EXISTS "Foto entrega sube el asignado" ON storage.objects;
DROP POLICY IF EXISTS "Foto entrega ve el vendedor" ON storage.objects;
DROP POLICY IF EXISTS "Foto entrega borra el admin" ON storage.objects;

ALTER TABLE public.envios DROP COLUMN IF EXISTS foto_entrega_borrada_en;

-- El bucket queda (ver arriba). Para borrarlo a mano, con las fotos ya
-- resueltas:
--   DELETE FROM storage.objects WHERE bucket_id = 'entregas';
--   DELETE FROM storage.buckets WHERE id = 'entregas';

COMMIT;
