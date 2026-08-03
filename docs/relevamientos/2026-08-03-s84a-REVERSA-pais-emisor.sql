-- REVERSA de `20260803120000_s84_pais_emisor_documento.sql` (S84-A32 ①)
-- Escrita ANTES de aplicar.
--
-- ⚠️ LO QUE NO DEVUELVE: los países YA DECLARADOS se pierden con el DROP.
-- Al momento de aplicar había 9 documentos y NINGUNO con país (medido), así
-- que hoy no hay nada que perder — pero si esta reversa se corre después de
-- que la pantalla exista, **cada país borrado es un dato que su dueño
-- declaró y que nadie va a volver a preguntar**. Exportar antes.

BEGIN;
ALTER TABLE public.prestador_documentos DROP CONSTRAINT IF EXISTS chk_prestador_documentos_pais_iso2;
ALTER TABLE public.prestador_documentos DROP COLUMN IF EXISTS pais_emisor;
COMMIT;
