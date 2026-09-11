-- REVERSA de 20260912290000_s115a_bucket_fiscal.sql (escrita ANTES de aplicar)
-- 🔴 NO borra los objetos del bucket: Postgres no puede (storage.protect_delete lo
--    rebota) y aunque pudiera, un XML de un comprobante autorizado es respaldo
--    tributario. Vaciar el bucket es un acto aparte y deliberado.
BEGIN;
DROP POLICY IF EXISTS fiscal_admin_select ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'fiscal' AND NOT EXISTS (
  SELECT 1 FROM storage.objects WHERE bucket_id = 'fiscal');
COMMIT;
