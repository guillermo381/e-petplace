-- ============================================================================
-- REVERSA de `20260826290000_s106a_cuadro_teleconsulta.sql`
-- Escrita ANTES de aplicar.
--
-- ⚠️ QUÉ **NO** DESHACE:
--    Esta reversa quita LA PUERTA, **no los adjuntos que entraron por ella**.
--    Las filas de `evento_archivo_adjunto` creadas por esta función quedan
--    vivas y visibles en el expediente — **y así debe ser**: son imágenes
--    clínicas de un acto que ocurrió, y borrarlas porque se revierte una
--    migración sería destruir expediente para deshacer código.
--
--    ⇒ Consecuencia práctica: revertir esto deja al profesional **sin poder
--    adjuntar cuadros nuevos**, con los viejos intactos. Es el estado correcto.
--
--    Y lo que no deshace en Storage: los objetos ya subidos siguen en el
--    bucket. Si además hay que retirarlos, es una decisión aparte y tiene su
--    propio camino (la cola de borrado de `D-731`), no esta reversa.
-- ============================================================================

BEGIN;

REVOKE ALL ON FUNCTION public.adjuntar_cuadro_teleconsulta(uuid, text, text, text, bigint, text) FROM authenticated;
DROP FUNCTION IF EXISTS public.adjuntar_cuadro_teleconsulta(uuid, text, text, text, bigint, text);

COMMIT;
