-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260814000000_s97a_alta_vendedor_puro.sql
-- Deshace: `cuenta_comercial_documentos` + sus puertas + las policies del
-- bucket `cuenta-documentos` + la puerta de nombre.
-- ⚠️ QUÉ NO DESHACE: los OBJETOS ya subidos al bucket (Postgres no puede
--    borrar blobs — precedente D-731) ni el bucket mismo (borrarlo con
--    objetos adentro exige barrido por Storage API); un nombre comercial ya
--    corregido queda corregido.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.revisar_documento_cuenta(uuid, text, text);
DROP FUNCTION IF EXISTS public.actualizar_nombre_cuenta_comercial(uuid, text);
DROP TABLE IF EXISTS public.cuenta_comercial_documentos;
DROP POLICY IF EXISTS cuenta_documentos_operador ON storage.objects;
DROP POLICY IF EXISTS admin_lee_documentos_cuentas ON storage.objects;

COMMIT;
