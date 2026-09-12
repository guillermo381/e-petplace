-- REVERSA de 20260912770000_s115a_fiscal_policy_dueno.sql
-- Escrita ANTES de aplicar.
--
-- 🔴 QUÉ PASA AL REVERTIR: la familia vuelve a NO poder bajar su propia
--    factura. El objeto sigue existiendo y `fiscal_ruta_archivo` sigue
--    devolviendo su ruta; lo que rebota es `createSignedUrl`, y **Storage lo
--    dice como `NoSuchKey`** — o sea que el síntoma vuelve disfrazado de
--    archivo faltante (L-546). Quien revierta esto va a diagnosticar mal.
DROP POLICY IF EXISTS fiscal_dueno_select ON storage.objects;
