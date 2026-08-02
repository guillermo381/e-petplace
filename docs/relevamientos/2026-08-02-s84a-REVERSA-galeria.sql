-- REVERSA de `20260802140000_s84_galeria_prestador.sql` (S84-A4)
-- Escrita ANTES de aplicar.
--
-- ⚠️ LO QUE ESTA REVERSA **NO** DEVUELVE — declarado para que nadie la
-- corra creyendo que restaura el estado anterior:
--
-- ① **Los BYTES del bucket NO se borran.** Si alguien ya subió fotos o un
--    clip, revertir el código deja los objetos en `prestador-galeria`
--    huérfanos de toda fila. Se dejan a propósito (clase D-303: jamás se
--    borra material de alguien "por las dudas"). Para sacarlos hay que
--    vaciar el bucket a mano ANTES de correr esto — el `DELETE FROM
--    storage.buckets` de abajo **falla si el bucket tiene objetos**, y esa
--    falla es deseable: avisa en vez de dejar basura silenciosa.
--
-- ② **`fotos_galeria` vuelve VACÍA.** La columna se restituye por si algún
--    consumidor del portal legado la esperara, pero **su contenido no se
--    recupera**: al dropearla tenía 0 de 7 filas con datos (medido), así
--    que no se pierde nada real — pero que quede dicho, no supuesto.
--
-- ③ **Las filas de `prestador_fotos` se pierden con el DROP TABLE.** Si
--    hay galerías reales cargadas, exportarlas antes.

BEGIN;

-- ① la tabla y todo lo suyo (policies, índice y constraints caen con ella)
DROP TABLE IF EXISTS public.prestador_fotos;

-- ② el clip
ALTER TABLE public.prestadores DROP CONSTRAINT IF EXISTS chk_prestadores_clip_url_es_path;
ALTER TABLE public.prestadores DROP COLUMN IF EXISTS clip_url;

-- ③ el homónimo vuelve — VACÍO (ver ② arriba)
ALTER TABLE public.prestadores ADD COLUMN IF NOT EXISTS fotos_galeria jsonb;

-- ④ las policies del bucket
DROP POLICY IF EXISTS "galeria prestador lectura" ON storage.objects;
DROP POLICY IF EXISTS "galeria prestador insert"  ON storage.objects;
DROP POLICY IF EXISTS "galeria prestador update"  ON storage.objects;
DROP POLICY IF EXISTS "galeria prestador delete"  ON storage.objects;

-- ⑤ el bucket. FALLA A PROPÓSITO si tiene objetos adentro (ver ① arriba):
--    preferimos que grite a que borre material ajeno en silencio.
DELETE FROM storage.buckets WHERE id = 'prestador-galeria';

COMMIT;
