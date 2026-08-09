-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260809030000_seg2_storage_avatars_y_adopcion.sql`
-- ESCRITA ANTES DE APLICAR LA MIGRACIÓN.
--
-- QUÉ DESHACE: devuelve las policies de `avatars` y `adopcion-fotos` a su
-- expresión original, y quita los límites de tamaño/mime de los buckets.
--
-- QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
--   · Reabre `avatars` a que **cualquier autenticado escriba en la carpeta de
--     cualquier otro** — el precedente exacto de S47 con el bucket `mascotas`.
--   · Reabre `adopcion-fotos` a que **cualquier autenticado suba y borre**
--     fotos de adopción, con dos policies cuyo nombre dice «Admin» y cuyo
--     predicado no mira quién es.
--   · Quita los límites de tamaño y de tipo ⇒ el bucket vuelve a aceptar
--     **cualquier archivo de cualquier peso**.
--   · **Vuelve a dejar `avatars` sin policy de DELETE** (D-616): lo que entre
--     no se podrá borrar por la API.
--
-- Los objetos ya subidos NO se ven afectados por nada de esto, ni en un
-- sentido ni en el otro: las policies gobiernan operaciones futuras.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── avatars ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
CREATE POLICY "Avatar upload" ON storage.objects
  FOR INSERT TO public
  WITH CHECK ((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text));

DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;

-- (Avatar read y Avatar update no se tocan en la migración; no hace falta
--  recrearlas acá.)

-- ── adopcion-fotos ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin puede subir fotos adopcion" ON storage.objects;
CREATE POLICY "Admin puede subir fotos adopcion" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'adopcion-fotos'::text);

DROP POLICY IF EXISTS "Admin puede eliminar fotos adopcion" ON storage.objects;
CREATE POLICY "Admin puede eliminar fotos adopcion" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'adopcion-fotos'::text);

-- ── los límites de los buckets ────────────────────────────────────────────
UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL
 WHERE id IN ('avatars', 'adopcion-fotos', 'productos-fotos');

COMMIT;
