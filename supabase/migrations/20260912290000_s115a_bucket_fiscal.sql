-- S115-A · TANDA 1 (④) — EL ARCHIVO DE LOS COMPROBANTES
-- Letra: MODELO_FISCAL v0.3 §7 («XML y RIDE archivados en Storage PROPIO por el
-- plazo de prescripción — no delegar el archivo al proveedor de facturación»).
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912290000-bucket-fiscal.sql
-- VEDA 76(g): NO RIGE.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fiscal', 'fiscal', false, 10485760,
        ARRAY['application/xml','text/xml','text/html','application/pdf'])
ON CONFLICT (id) DO NOTHING;

/* 🔴 PRIVADO, y la única lectura por PostgREST es la de un admin. La familia NO
   lo lee por acá: lo lee por URL FIRMADA desde la puerta de `packages/api`.
   *Un comprobante fiscal servido desde un bucket público es el documento
   tributario de una persona colgado de una URL que se puede adivinar.* */
CREATE POLICY fiscal_admin_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'fiscal' AND is_admin());

DO $$
DECLARE v_pub boolean;
BEGIN
  SELECT public INTO v_pub FROM storage.buckets WHERE id = 'fiscal';
  IF v_pub IS NULL THEN RAISE EXCEPTION 'cinturon_bucket: no se creo'; END IF;
  IF v_pub THEN RAISE EXCEPTION 'cinturon_bucket_publico: el bucket fiscal NO puede ser publico'; END IF;
END $$;

COMMIT;
