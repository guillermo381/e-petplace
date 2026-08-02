-- S84-A4 · LA GALERÍA DEL PRESTADOR — bucket propio, tabla con RLS de
-- nacimiento, y la PORTADA COMO ORDEN MÍNIMO.
--
-- ADJUDICADO POR LA MESA (2-ago-2026), sobre el freno medido en S84-A2:
--   · bucket NUEVO — **no se cura `avatars`**
--   · INSERT validado POR CARPETA
--   · `file_size_limit` y `allowed_mime_types` EN EL BUCKET
--   · el clip vive acá, no en `adiestramiento-clips`
--   · SIN tope duro de filas
--
-- ── POR QUÉ BUCKET NUEVO Y NO CURAR `avatars` (el voto que la mesa firmó)
-- `avatars` tiene 10 objetos vivos y consumidores **que este censo no
-- midió** — incluido el portal legado, que comparte esta misma DB
-- (hallazgo S49). Reemplazar su policy INSERT en caliente es tocar algo
-- de alcance desconocido. Un bucket nuevo **nace correcto sin tocar nada
-- vivo**, y deja el saneo de `avatars` como su propia ficha (D-616 (b)).
--
-- ── LOS NÚMEROS DEL BUCKET, MEDIDOS, NO ELEGIDOS A OJO ────────────────
--   · fotos reales de la casa (`avatars`): promedio 131 kB · máx **327 kB**
--   · el único clip real (`adiestramiento-clips`): **6.7 MB**
--   ⇒ `file_size_limit = 10 MB` cubre los dos con margen, y es **el mismo
--     techo que `cita-archivos` y `grooming-archivos`** ya usan: se copia
--     el precedente en vez de inventar un número.
--   · mime: las 3 imágenes que la casa ya acepta + los 2 video que el
--     clip necesita. Nada más — un bucket que acepta todo no es un techo.
--
-- ── LA PORTADA ES EL ORDEN MÍNIMO (criterio de Fluvi, estado medido §7)
-- **No existe `es_portada`.** Un flag separado del orden permite el estado
-- imposible «dos portadas» y su gemelo «la portada no es la primera»;
-- derivarla de `MIN(orden)` los vuelve **inexpresables**. El
-- `UNIQUE (prestador_id, orden)` es lo que lo garantiza: sin él, dos filas
-- podrían empatar en el mínimo y la portada volvería a ser ambigua.
-- *Una sola verdad en vez de dos que se contradicen.*
--
-- ── `url` GUARDA UN PATH, NO UNA URL — y por eso lleva CHECK ──────────
-- La firma de la mesa nombró la columna `url`. Se respeta, **y se le pone
-- el mismo CHECK que `mascotas.foto_url`** (S47, `..._es_path`): una URL
-- absoluta persistida se rompe el día que cambia el dominio o el bucket
-- pasa a privado. La casa ya tiene ese precedente exacto: una columna
-- `*_url` que guarda path. **El nombre es de la firma; la forma, de la
-- lección.**
--
-- ── EL CENSO DE `fotos_galeria` ANTES DE MATARLA (el freno de la orden)
-- **APARECIÓ un lector que el censo de A2 no había visto** — y resultó no
-- serlo, pero solo al mirar el objeto vivo:
--   · `git grep` la encuentra en DOS migraciones (`20260714110000` D-389 y
--     `20260727200000`), ambas listando columnas protegidas del trigger.
--   · **La definición VIVA de ese trigger NO la nombra**: censadas TODAS
--     las funciones de `public` con `pg_get_functiondef ILIKE`, el conteo
--     da **CERO**. Los archivos son historia; la función de hoy es otra.
--   **Es L-166 exacta: el archivo decía una cosa y el objeto otra.** Si
--   hubiera frenado con el grep, habría frenado contra un fantasma; si
--   hubiera dropeado sin mirar el objeto, habría sido suerte.
--   · Portal legado: aparece **solo en `database.types.ts`** (tipos
--     generados). Cero código.
--   · Datos: **0 filas con contenido en las 7 de `prestadores`**.
--
-- ⇒ Se DROPea en esta misma migración. **Ley 37 y la razón de la mesa: un
-- homónimo muerto en la misma tabla donde nace el bueno no se difiere** —
-- quien abra `prestadores` mañana vería una columna llamada "fotos_galeria"
-- que no es la galería.
--
-- **LOS OTROS TRES, NOMBRADOS Y NO TOCADOS** (son de otros dominios; ficha
-- D-620): `refugios.fotos_galeria` (0 filas) · `criaderos.fotos_galeria`
-- (0 filas) · `productos.imagenes` (0 filas). **Cuatro implementaciones de
-- "galería" en jsonb, las cuatro sin un solo dato.**
--
-- 76(g): **NO RIGE** — DDL. El único dato tocado es el DROP de una columna
-- **medida en cero** (0 de 7 filas con contenido).
-- REVERSA: `docs/relevamientos/2026-08-02-s84a-REVERSA-galeria.sql`.

BEGIN;

-- ── ① EL BUCKET, con su techo ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prestador-galeria', 'prestador-galeria', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ── ② LAS CUATRO POLICIES — las que a `avatars` le faltan ─────────────
-- La carpeta es `auth.uid()`, igual que el logo. La diferencia con
-- `avatars` es que acá **el INSERT también la valida**, no solo el UPDATE.
DROP POLICY IF EXISTS "galeria prestador lectura"   ON storage.objects;
DROP POLICY IF EXISTS "galeria prestador insert"    ON storage.objects;
DROP POLICY IF EXISTS "galeria prestador update"    ON storage.objects;
DROP POLICY IF EXISTS "galeria prestador delete"    ON storage.objects;

-- lectura: la vitrina es pública (el bucket también) — es identidad
-- pública del negocio, como el logo.
CREATE POLICY "galeria prestador lectura" ON storage.objects
  FOR SELECT USING (bucket_id = 'prestador-galeria');

CREATE POLICY "galeria prestador insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prestador-galeria'
              AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "galeria prestador update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'prestador-galeria'
         AND (auth.uid())::text = (storage.foldername(name))[1]);

-- DELETE: **la que `avatars` no tiene**, y sin la cual "borrar" solo
-- quitaría la fila y dejaría los bytes (el punto fino de S84-A2: un tope
-- en la tabla no es un tope de almacenamiento).
CREATE POLICY "galeria prestador delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'prestador-galeria'
         AND (auth.uid())::text = (storage.foldername(name))[1]);

-- ── ③ LA TABLA ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prestador_fotos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id  uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  -- PATH en `prestador-galeria`, jamás una URL absoluta (ver cabecera).
  url           text NOT NULL,
  orden         integer NOT NULL,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_prestador_fotos_url_es_path CHECK (url !~ '^https?://'),
  CONSTRAINT chk_prestador_fotos_url_no_vacia CHECK (length(trim(url)) > 0),
  -- LA PORTADA ES EL ORDEN MÍNIMO: sin este UNIQUE, dos filas podrían
  -- empatar en el mínimo y "cuál es la portada" volvería a ser ambiguo.
  CONSTRAINT uq_prestador_fotos_orden UNIQUE (prestador_id, orden)
);

CREATE INDEX IF NOT EXISTS ix_prestador_fotos_prestador_orden
  ON public.prestador_fotos (prestador_id, orden);

-- ── ④ RLS DESDE EL NACIMIENTO (no después) ────────────────────────────
ALTER TABLE public.prestador_fotos ENABLE ROW LEVEL SECURITY;

-- LECTURA: la vitrina de un negocio ACTIVO. El gate por `estado` evita
-- exponer las fotos de un negocio pendiente o rechazado — que no está en
-- vitrina y por lo tanto no tiene por qué mostrarse.
-- `TO authenticated`: el cliente de la app está logueado; `anon` queda
-- afuera por la familia L-140.
CREATE POLICY prestador_fotos_select_vitrina ON public.prestador_fotos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.prestadores p
     WHERE p.id = prestador_fotos.prestador_id
       AND (p.estado = 'activo' OR p.user_id = auth.uid())
  ));

-- ESCRITURA: **solo el titular**, coherente con D-513 (la gestión de
-- negocio es titular-only). Las tres, por separado, para que el día que
-- un rol gane escritura se enmiende la que corresponda y no un `ALL`.
CREATE POLICY prestador_fotos_insert_titular ON public.prestador_fotos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.prestadores p
     WHERE p.id = prestador_fotos.prestador_id AND p.user_id = auth.uid()
  ));

CREATE POLICY prestador_fotos_update_titular ON public.prestador_fotos
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.prestadores p
     WHERE p.id = prestador_fotos.prestador_id AND p.user_id = auth.uid()
  ));

CREATE POLICY prestador_fotos_delete_titular ON public.prestador_fotos
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.prestadores p
     WHERE p.id = prestador_fotos.prestador_id AND p.user_id = auth.uid()
  ));

-- L-140: nace sin `anon` ni PUBLIC. Se concede explícito y se verifica.
REVOKE ALL ON public.prestador_fotos FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prestador_fotos TO authenticated;

-- ── ⑤ EL CLIP — UNO solo, columna y no tabla ──────────────────────────
ALTER TABLE public.prestadores ADD COLUMN IF NOT EXISTS clip_url text;
ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_clip_url_es_path
  CHECK (clip_url IS NULL OR clip_url !~ '^https?://');
-- La columna nace SIN grant (regla de la casa, skill `epetplace-db`: toda
-- columna nueva de `prestadores` nace sin privilegio); el wrapper la
-- gana cuando su escritor exista.

-- ── ⑥ EL HOMÓNIMO MUERE ACÁ, no "después" (Ley 37) ────────────────────
ALTER TABLE public.prestadores DROP COLUMN IF EXISTS fotos_galeria;

-- ── ⑦ CINTURÓN — la migración no se declara buena sola (L-192) ────────
DO $$
DECLARE v_pol int; v_buck int; v_col int; v_rls boolean;
BEGIN
  SELECT count(*) INTO v_buck FROM storage.buckets
   WHERE id='prestador-galeria' AND public
     AND file_size_limit = 10485760 AND allowed_mime_types IS NOT NULL;
  IF v_buck <> 1 THEN RAISE EXCEPTION 'el bucket no quedó con su techo: %', v_buck; END IF;

  SELECT count(DISTINCT cmd) INTO v_pol FROM pg_policies
   WHERE schemaname='storage' AND tablename='objects'
     AND policyname LIKE 'galeria prestador%';
  IF v_pol <> 4 THEN RAISE EXCEPTION 'se esperaban 4 comandos con policy, hay %', v_pol; END IF;

  SELECT relrowsecurity INTO v_rls FROM pg_class WHERE oid='public.prestador_fotos'::regclass;
  IF NOT v_rls THEN RAISE EXCEPTION 'prestador_fotos nació SIN RLS'; END IF;

  SELECT count(*) INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='prestadores' AND column_name='fotos_galeria';
  IF v_col <> 0 THEN RAISE EXCEPTION 'fotos_galeria sigue viva'; END IF;

  -- anon no puede haber quedado con nada (L-140, sonda explícita)
  IF EXISTS (SELECT 1 FROM information_schema.role_table_grants
              WHERE table_schema='public' AND table_name='prestador_fotos'
                AND grantee IN ('anon','PUBLIC')) THEN
    RAISE EXCEPTION 'prestador_fotos quedó con grants para anon/PUBLIC';
  END IF;
END $$;

-- ── ⑧ LA PORTADA ES INEXPRESABLEMENTE AMBIGUA — probado, no afirmado ──
-- El UNIQUE es la pieza que sostiene "la portada es el orden mínimo".
-- Si no rebotara, «dos portadas» sería un estado alcanzable y toda la
-- decisión de diseño se caería en silencio.
DO $$
DECLARE v_p uuid;
BEGIN
  SELECT id INTO v_p FROM public.prestadores LIMIT 1;
  IF v_p IS NULL THEN RAISE NOTICE 'sin prestadores: la auto-prueba no corre'; RETURN; END IF;

  INSERT INTO public.prestador_fotos (prestador_id, url, orden)
  VALUES (v_p, 'auto-prueba/a.jpg', 0);

  BEGIN
    INSERT INTO public.prestador_fotos (prestador_id, url, orden)
    VALUES (v_p, 'auto-prueba/b.jpg', 0);
    RAISE EXCEPTION 'DOS PORTADAS FUE POSIBLE: el UNIQUE no protege';
  EXCEPTION WHEN unique_violation THEN
    NULL; -- rebotó: «dos portadas» es inexpresable
  END;

  -- control positivo: un orden distinto SÍ entra (si rebotara todo, el
  -- rojo de arriba no probaría nada — es la lección de S84-A1).
  INSERT INTO public.prestador_fotos (prestador_id, url, orden)
  VALUES (v_p, 'auto-prueba/b.jpg', 1);

  -- y el CHECK de path: una URL absoluta rebota
  BEGIN
    INSERT INTO public.prestador_fotos (prestador_id, url, orden)
    VALUES (v_p, 'https://ejemplo.com/x.jpg', 2);
    RAISE EXCEPTION 'ACEPTÓ UNA URL ABSOLUTA: el CHECK de path no protege';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  DELETE FROM public.prestador_fotos WHERE prestador_id = v_p AND url LIKE 'auto-prueba/%';
  IF EXISTS (SELECT 1 FROM public.prestador_fotos) THEN
    RAISE EXCEPTION 'la auto-prueba dejó residuo';
  END IF;
END $$;

COMMIT;
