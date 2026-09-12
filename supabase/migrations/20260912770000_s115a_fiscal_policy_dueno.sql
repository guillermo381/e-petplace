-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · D-1076 · LA FAMILIA LEE SU PROPIA FACTURA PORQUE ES SUYA
--
-- 🔴 LO QUE HABÍA, MEDIDO: el bucket `fiscal` tenía UNA sola policy de SELECT
--    —`fiscal_admin_select`, con `is_admin()`— y **ninguna para el dueño**.
--    `createSignedUrl` desde el cliente autenticado rebotaba, y Storage
--    contesta `not_found`/`NoSuchKey` cuando el fallo es de PERMISO: el
--    síntoma decía «falta el archivo» y lo que faltaba era el acceso (L-546).
--    *Medido antes de curar: los objetos estaban —28.797 B el RIDE, 9.498 B el
--    XML— y no había una sola ruta huérfana en toda la tabla.* Curar el
--    síntoma habría mandado a re-archivar lo que ya estaba archivado.
--
-- 🔴 POR QUÉ POLICY Y NO FIRMAR DESDE UNA EDGE — firma del founder, 11-sep:
--    *«la familia lee su propio archivo porque es suyo, y eso se dice en la
--    base. Firmar desde una edge pone un salto de red en cada descarga y
--    esconde la autorización donde nadie la busca.»*
--
-- 🔴 EL PREDICADO ES LA RUTA QUE EL DOCUMENTO DECLARA, no la carpeta parseada.
--    Se compara contra `pdf_url`/`xml_url`, que es **la misma fuente que usa
--    `fiscal_ruta_archivo`** ⇒ las dos puertas no pueden divergir. Las
--    alternativas se descartaron por medición, no por gusto:
--      · `(storage.foldername(name))[1]::uuid` **revienta** con los objetos de
--        `ensayo/…` que ya viven en el bucket — la carpeta ahí es texto, no
--        uuid, y un cast que falla en un `USING` mata la consulta entera.
--      · Comparar por prefijo de texto deja leer cualquier objeto que alguien
--        suba bajo una carpeta con nombre de documento ajeno.
--    Y el efecto lateral es correcto: **un objeto que ningún documento reclama
--    no lo lee nadie.** Si la fila no lo declara suyo, no es suyo.
--
-- USA `idx_documentos_fiscales_user` (medido presente) para el EXISTS.
--
-- VEDA 76(g): NO RIGE — sólo una policy, cero DDL sobre datos, cero backfill.
-- Reversa: `docs/relevamientos/S115-A-REVERSA-20260912770000.sql`.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS fiscal_dueno_select ON storage.objects;

CREATE POLICY fiscal_dueno_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'fiscal'
    AND EXISTS (
      SELECT 1 FROM public.documentos_fiscales d
       WHERE d.user_id = auth.uid()
         AND storage.objects.name IN (d.pdf_url, d.xml_url)
    )
  );

-- ── CINTURÓN · CON SU ROJO, que es la mitad que importa ─────────────────────
-- L-459: la primera prueba de un guard nuevo no es que dé VERDE, es que dé
-- ROJO sobre el caso real. Acá el rojo es *otra familia no puede leer*.
DO $cint$
DECLARE
  v_rol_mig  text := current_user;   -- ⚠️ jamás RESET ROLE bajo db push
  v_dueno    uuid;
  v_ajeno    uuid;
  v_ruta     text;
  n_dueno    int;
  n_ajeno    int;
  n_anon     int;
BEGIN
  SELECT d.user_id, d.pdf_url INTO v_dueno, v_ruta
    FROM public.documentos_fiscales d
   WHERE d.pdf_url IS NOT NULL
     AND EXISTS (SELECT 1 FROM storage.objects o
                  WHERE o.bucket_id='fiscal' AND o.name = d.pdf_url)
   LIMIT 1;

  -- L-437: un censo que no puede producir su rojo no está midiendo.
  IF v_dueno IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay ningún documento con archivo REAL en Storage — sin caso, esta policy no se puede discriminar';
  END IF;

  SELECT u.id INTO v_ajeno FROM auth.users u WHERE u.id <> v_dueno LIMIT 1;
  IF v_ajeno IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay un segundo usuario contra el cual probar el rojo';
  END IF;

  -- ① EL DUEÑO VE LO SUYO
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_dueno, 'role', 'authenticated')::text);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n_dueno FROM storage.objects
   WHERE bucket_id='fiscal' AND name = v_ruta;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  -- ② 🔴 EL ROJO: OTRA FAMILIA NO VE ESE OBJETO
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_ajeno, 'role', 'authenticated')::text);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n_ajeno FROM storage.objects
   WHERE bucket_id='fiscal' AND name = v_ruta;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  -- ③ ANÓNIMO TAMPOCO
  SET LOCAL request.jwt.claims = '{"role":"anon"}';
  SET LOCAL ROLE anon;
  SELECT count(*) INTO n_anon FROM storage.objects
   WHERE bucket_id='fiscal' AND name = v_ruta;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  SET LOCAL request.jwt.claims = '';

  IF n_dueno <> 1 THEN
    RAISE EXCEPTION 'cinturon: el DUEÑO ve % filas de lo suyo, esperaba 1 — la policy no abre', n_dueno;
  END IF;
  IF n_ajeno <> 0 THEN
    RAISE EXCEPTION 'cinturon 🔴 FUGA: otra familia ve % filas de un archivo ajeno', n_ajeno;
  END IF;
  IF n_anon <> 0 THEN
    RAISE EXCEPTION 'cinturon 🔴 FUGA: anon ve % filas', n_anon;
  END IF;

  RAISE NOTICE 'cinturon OK · dueño=% · ajeno=% (rojo probado) · anon=%', n_dueno, n_ajeno, n_anon;
END $cint$;
