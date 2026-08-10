-- 🔴 D-710 · BORRADO DE LOS 27 DOCUMENTOS SIN DUEÑO (decisión del founder).
--
-- Alcance ESTRICTO: solo objetos de `prestador-documentos` que cumplan **las
-- dos** condiciones a la vez —ninguna fila los referencia **y** su carpeta no
-- corresponde a ningún prestador ni usuario vivo—. **Los 56 con dueño vivo NO
-- se tocan**, por orden explícita.
--
-- ⚠️ SE DECLARA LO QUE ESTE BORRADO NO HACE: quita la fila de
-- `storage.objects`, que es lo que vuelve el objeto inexistente para la API y
-- para todo listado. **El blob en el backend lo recoge Supabase por su cuenta**;
-- no hay forma de forzarlo desde SQL. *Para datos de identidad conviene saberlo:
-- el objeto deja de ser alcanzable, no se sobrescribe.*
BEGIN;

CREATE TEMP TABLE _a_borrar ON COMMIT DROP AS
SELECT o.id, o.name, (o.metadata->>'size')::bigint AS bytes
FROM storage.objects o
WHERE o.bucket_id = 'prestador-documentos'
  AND NOT EXISTS (
    SELECT 1 FROM prestador_documentos d WHERE d.archivo_url LIKE '%' || o.name
  )
  AND NOT EXISTS (
    SELECT 1 FROM prestadores p WHERE p.id::text = split_part(o.name, '/', 1)
  )
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id::text = split_part(o.name, '/', 1)
  );

-- ANTES
SELECT
  'ANTES' AS momento,
  (SELECT count(*) FROM storage.objects WHERE bucket_id='prestador-documentos') AS objetos_bucket,
  (SELECT count(*) FROM _a_borrar) AS a_borrar,
  round((SELECT coalesce(sum(bytes),0) FROM _a_borrar) / 1048576.0, 1) AS mb_a_borrar;

DELETE FROM storage.objects o USING _a_borrar b WHERE o.id = b.id;

-- DESPUÉS — y el guard que importa: los 56 con dueño vivo TIENEN que seguir.
SELECT
  'DESPUES' AS momento,
  (SELECT count(*) FROM storage.objects WHERE bucket_id='prestador-documentos') AS objetos_bucket,
  (SELECT count(*)
     FROM storage.objects o
    WHERE o.bucket_id='prestador-documentos'
      AND NOT EXISTS (SELECT 1 FROM prestador_documentos d WHERE d.archivo_url LIKE '%' || o.name)
      AND (EXISTS (SELECT 1 FROM prestadores p WHERE p.id::text = split_part(o.name,'/',1))
        OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = split_part(o.name,'/',1)))
  ) AS huerfanos_con_dueno_vivo_INTACTOS;

COMMIT;
