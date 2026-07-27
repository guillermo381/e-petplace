-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727160000_s79_remate_documentos.sql (escrita ANTES
-- de aplicar).
--
-- NOTA DE DATOS: revertir el DDL NO revierte los VEREDICTOS que el
-- admin haya escrito con revisar_documento_prestador (estado /
-- revisado_por / revisado_en / notas_revision quedan como estén — son
-- datos, no schema). El resto vuelve al estado medido en la Tanda 1:
-- bucket sin mime types, sin CHECK de path, y las DOS policies
-- duplicadas (pd_own se recrea con su predicado literal relevado).
-- ═════════════════════════════════════════════════════════════════════
begin;

-- 3) muere la RPC de veredicto
DROP FUNCTION IF EXISTS public.revisar_documento_prestador(uuid, text, text);

-- 2) cae el CHECK de path
ALTER TABLE public.prestador_documentos
  DROP CONSTRAINT IF EXISTS prestador_documentos_archivo_es_path;

-- 1) el bucket vuelve a mime libre
UPDATE storage.buckets
   SET allowed_mime_types = NULL
 WHERE id = 'prestador-documentos';

-- 4) vuelve la policy duplicada (predicado literal de la Tanda 1)
CREATE POLICY "pd_own" ON public.prestador_documentos
  FOR ALL TO authenticated
  USING (
    (prestador_id IN (SELECT prestadores.id FROM prestadores
                      WHERE prestadores.user_id = auth.uid()))
    OR is_admin()
  );

commit;
