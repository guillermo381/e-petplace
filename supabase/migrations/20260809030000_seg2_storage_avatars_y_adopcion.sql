-- ══════════════════════════════════════════════════════════════════════════
-- S92-BIS · B1 — STORAGE: `avatars` DEJA DE SER UN VERTEDERO Y LAS POLICIES
-- «ADMIN» DE ADOPCIÓN EMPIEZAN A GATEAR ADMIN (D-556 · D-616)
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** Reemplazo de policies + `UPDATE` sobre `storage.buckets` (tres
-- filas de configuración, no datos de usuario). Sin backfill; el cinturón lee
-- catálogo y no ancla filas vivas. **Ningún objeto se toca:** las policies
-- gobiernan operaciones futuras, no lo ya subido.
--
-- ── ROJO PRODUCIDO (9-ago-2026, camino real HTTP contra Storage) ─────────
-- Con un objeto que EXISTE (R4: un 404 de Storage no prueba nada — puede ser
-- que el path no exista), y con una cuenta creada al momento, dueña de nada:
--
--   `avatars`  ① anónimo por ruta pública ....... **200, descargó 77 795 bytes**
--              ② anónimo con la anon key ........ **200**
--              ③ autenticado ajeno .............. **200**
--              ④ ajeno LISTA el bucket .......... **200, enumeró 4 objetos**
--              ⑤ **ajeno ESCRIBIÓ ............... 200 — SUBIÓ UN ARCHIVO**
--
-- **Y el intento de borrarlo devolvió 400**, porque `avatars` **no tiene policy
-- de DELETE**. *Un bucket que acepta cualquier archivo de cualquiera y no deja
-- limpiarlo es un vertedero de una sola dirección.*
--
-- Los cinco buckets PRIVADOS (`mascotas`, `cita-archivos`, `grooming-archivos`,
-- `adiestramiento-clips`, `prestador-documentos` —91 objetos, documentos de
-- identidad—) **rebotaron las cinco pruebas**: la cura de S47 sigue rigiendo y
-- lo sensible está cerrado. Esta migración es sobre los públicos.
--
-- ── EL DEFECTO YA ESTABA ESCRITO, Y ESO ES PARTE DEL HALLAZGO ────────────
-- `apps/prestador/src/lib/subir-galeria.ts:11` dice, textual: *«medido por A:
-- `avatars` tiene INSERT sin validar carpeta y CERO policy»*, y
-- `subir-logo.ts:106` cita **D-616** para explicar por qué no intenta borrar.
-- *El código venía esquivando el defecto con comentarios en vez de curarlo.*
--
-- ── CENSO DE IMPACTO (R2) — por qué esto NO rompe la subida de logos ─────
-- Medido en `subir-imagen.ts:141`: el path que la app construye es
-- **`<auth.uid()>/<prefijo>-<timestamp>.<ext>`** — *la carpeta YA es el
-- usuario*. Los 10 logos de negocio vivos están así. Exigirlo en la policy
-- **no cambia nada para quien sube por la app**; solo cierra la puerta a quien
-- escribe fuera de su carpeta, que es justo lo que se midió posible.
-- Los 2 avatares legacy viven en la carpeta literal `avatars/` (patrón v2) y
-- **no se tocan**: su lectura es pública y sigue igual.
--
-- ── LOS LÍMITES, con su porqué ───────────────────────────────────────────
-- `avatars`, `adopcion-fotos` y `productos-fotos` no tenían **ni límite de
-- tamaño ni de tipo** (D-556). Sin techo, un autenticado sube un archivo de
-- cualquier peso; sin mime, sube cualquier cosa — un bucket público es hosting
-- gratis para quien lo encuentre. El techo de **5 MB** coincide con el
-- pre-check que la app ya hace (`subir-logo.ts:37`), así que **no cambia lo que
-- el usuario puede hacer**: lo hace cumplir del lado del servidor.
--
-- Reversa: `docs/relevamientos/2026-08-09-seg2-REVERSA-avatars-y-adopcion.sql`
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ══ ① `avatars` — la escritura vuelve a la carpeta propia ════════════════
DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
CREATE POLICY "Avatar upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    -- el mismo predicado que "Avatar update" YA usaba: la incoherencia entre
    -- poder ACTUALIZAR solo lo propio y poder CREAR en cualquier lado era el
    -- agujero.
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- ② la policy de DELETE que faltaba (D-616) — sin ella, lo que entra no sale
CREATE POLICY "Avatar delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      -- `owner` cubre lo subido antes de esta migración por quien lo subió:
      -- sin este brazo, un objeto que hoy está fuera de carpeta propia sería
      -- imposible de limpiar para siempre, incluso para su autor.
      OR owner = auth.uid()
    )
  );

-- ══ ③ `adopcion-fotos` — que «Admin» signifique admin (D-556) ════════════
-- El nombre decía Admin y el predicado era `bucket_id = 'adopcion-fotos'` a
-- secas: cualquier usuario logueado subía y borraba fotos de adopción. Se les
-- pone el gate que su hermano `productos-fotos` ya tenía.
DROP POLICY IF EXISTS "Admin puede subir fotos adopcion" ON storage.objects;
CREATE POLICY "Admin puede subir fotos adopcion" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'adopcion-fotos' AND public.is_admin());

DROP POLICY IF EXISTS "Admin puede eliminar fotos adopcion" ON storage.objects;
CREATE POLICY "Admin puede eliminar fotos adopcion" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'adopcion-fotos' AND public.is_admin());

-- ══ ④ LOS LÍMITES DE LOS TRES BUCKETS SIN TECHO ══════════════════════════
UPDATE storage.buckets
   SET file_size_limit = 5 * 1024 * 1024,
       allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']
 WHERE id IN ('avatars', 'adopcion-fotos', 'productos-fotos');

-- ══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN — sobre la definición VIVA.
-- ══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_insert_flojo int;
  v_sin_delete int;
  v_sin_limite int;
  v_adopcion_sin_admin int;
BEGIN
  -- (a) ninguna policy de INSERT sobre avatars puede quedar sin mirar la carpeta
  SELECT count(*) INTO v_insert_flojo
  FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects' AND cmd='INSERT'
    AND COALESCE(with_check,'') ILIKE '%avatars%'
    AND COALESCE(with_check,'') NOT ILIKE '%foldername%';
  IF v_insert_flojo > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (a): % policy(s) de INSERT sobre avatars sin validar carpeta', v_insert_flojo;
  END IF;

  -- (b) LA QUE PAGA D-616: avatars tiene que tener DELETE
  SELECT count(*) INTO v_sin_delete
  FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects' AND cmd='DELETE'
    AND COALESCE(qual,'') ILIKE '%avatars%';
  IF v_sin_delete = 0 THEN
    RAISE EXCEPTION 'CINTURÓN (b): avatars sigue sin policy de DELETE — lo que entra no sale';
  END IF;

  -- (c) los tres buckets con techo y con tipos
  SELECT count(*) INTO v_sin_limite FROM storage.buckets
   WHERE id IN ('avatars','adopcion-fotos','productos-fotos')
     AND (file_size_limit IS NULL OR allowed_mime_types IS NULL);
  IF v_sin_limite > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (c): % bucket(s) siguen sin límite de tamaño o de mime', v_sin_limite;
  END IF;

  -- (d) adopción: sus dos policies tienen que nombrar is_admin
  SELECT count(*) INTO v_adopcion_sin_admin
  FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects'
    AND (COALESCE(qual,'') ILIKE '%adopcion-fotos%' OR COALESCE(with_check,'') ILIKE '%adopcion-fotos%')
    AND cmd IN ('INSERT','DELETE')
    AND (COALESCE(qual,'') || COALESCE(with_check,'')) NOT ILIKE '%is_admin%';
  IF v_adopcion_sin_admin > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (d): % policy(s) de adopcion-fotos siguen sin gatear admin', v_adopcion_sin_admin;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE — avatars con carpeta propia y con DELETE · adopción gateando admin · 3 buckets con techo y mime';
END
$cinturon$;

COMMIT;
