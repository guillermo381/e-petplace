-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · A15 · EL REFUGIO SUBE SU PORTADA Y SU LOGO
--
-- `poblar_vitrina_refugio` sólo tomaba `p_logo_url` **como URL ya existente**
-- ⇒ el refugio podía escribir su historia y **no podía poner una imagen**:
-- *un editor que pide una URL le pide a alguien que suba el archivo en otro
-- lado, y no hay otro lado.*
--
-- 🔴 **SE REUSA EL BUCKET DE ADOPCIÓN, NO NACE UNO.** `adopcion-fotos` ya es
-- público, ya tiene su techo de 5 MB y ya lo usan las fotos del animal. *Un
-- bucket nuevo para el mismo actor duplica policies, techos y tipos, y los
-- dos se desincronizan el día que alguien toque uno.*
--
-- ⚠️ **PERO EL PATH ES OTRO Y POR ESO HACE FALTA UN BRAZO NUEVO.** La policy
-- que existe exige `_path_es_de_mi_publicacion(name)` — la primera carpeta es
-- una PUBLICACIÓN. La vitrina no cuelga de ninguna publicación: es de la
-- CUENTA, y tiene que existir **aunque el refugio no haya publicado nada**
-- (que es justo cuando su vitrina más importa).
-- ⇒ prefijo propio: `vitrina/<cuenta_comercial_id>/…`
--
-- 76(g) — NO RIGE: policies y firma, sin backfill y sin anclas.
-- ═══════════════════════════════════════════════════════════════════════════

/* El predicado, en su propia función: la policy lo llama y el cinturón
   también. *Dos copias del mismo predicado se separan sin avisar.* */
CREATE OR REPLACE FUNCTION public._path_es_de_mi_vitrina(p_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
  SELECT auth.uid() IS NOT NULL
     AND split_part(p_name, '/', 1) = 'vitrina'
     AND EXISTS (
       SELECT 1 FROM cuentas_comerciales c
        WHERE c.owner_profile_id = auth.uid()
          AND c.id::text = split_part(p_name, '/', 2));
$fn$;
REVOKE ALL ON FUNCTION public._path_es_de_mi_vitrina(text) FROM anon, PUBLIC;

CREATE POLICY adopcion_fotos_vitrina_sube ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'adopcion-fotos' AND public._path_es_de_mi_vitrina(name));

CREATE POLICY adopcion_fotos_vitrina_borra ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'adopcion-fotos' AND public._path_es_de_mi_vitrina(name));

-- ═══ EL MOTOR GUARDA LAS DOS RUTAS ═══
DROP FUNCTION IF EXISTS public.poblar_vitrina_refugio(text,text,text,text);

CREATE OR REPLACE FUNCTION public.poblar_vitrina_refugio(
  p_historia    text DEFAULT NULL,
  p_ciudad      text DEFAULT NULL,
  p_zona        text DEFAULT NULL,
  p_logo_url    text DEFAULT NULL,
  p_portada_url text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_auth uuid := auth.uid(); v_ref jsonb; v_cc uuid; v_p record; v_creada boolean := false;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  v_ref := public.obtener_mi_cuenta_refugio();
  IF v_ref IS NULL OR v_ref->>'cuenta_comercial_id' IS NULL THEN
    RAISE EXCEPTION 'no_sos_refugio' USING ERRCODE='42501';
  END IF;
  v_cc := (v_ref->>'cuenta_comercial_id')::uuid;

  SELECT * INTO v_p FROM prestadores WHERE cuenta_comercial_id = v_cc FOR UPDATE;

  IF v_p.id IS NULL THEN
    IF EXISTS (SELECT 1 FROM prestadores WHERE user_id = v_auth) THEN
      RAISE EXCEPTION 'ya_tenes_prestador: %',
        (SELECT tipo FROM prestadores WHERE user_id = v_auth LIMIT 1) USING ERRCODE='22023';
    END IF;
    INSERT INTO prestadores (user_id, cuenta_comercial_id, tipo, nombre_comercial,
                             whatsapp, estado, descripcion, ciudad, sector, foto_url)
    SELECT v_auth, v_cc, 'refugio', cc.nombre_comercial, '', 'activo',
           p_historia, p_ciudad, p_zona, p_logo_url
      FROM cuentas_comerciales cc WHERE cc.id = v_cc
    RETURNING * INTO v_p;
    v_creada := true;
  ELSE
    UPDATE prestadores
       SET descripcion = COALESCE(p_historia, descripcion),
           ciudad      = COALESCE(p_ciudad,   ciudad),
           sector      = COALESCE(p_zona,     sector),
           foto_url    = COALESCE(p_logo_url, foto_url),
           updated_at  = now()
     WHERE id = v_p.id
    RETURNING * INTO v_p;
  END IF;

  /* 🔴 LA PORTADA VIVE EN `prestador_fotos`, que es de donde
     `v_prestadores_publicos` saca `portadas`. **No se inventa una columna**:
     escribir la portada en `prestadores` habría creado una segunda fuente que
     la vista pública no lee — *la vitrina mostraría la vieja y el editor la
     nueva, y las dos se verían correctas.*

     Se REEMPLAZA, no se acumula: la vitrina del refugio tiene UNA portada.
     *Acumular dejaría un carrusel que nadie pidió y que la pieza no dibuja.* */
  IF p_portada_url IS NOT NULL AND btrim(p_portada_url) <> '' THEN
    DELETE FROM prestador_fotos WHERE prestador_id = v_p.id;
    INSERT INTO prestador_fotos (prestador_id, url, orden) VALUES (v_p.id, p_portada_url, 0);
  END IF;

  RETURN jsonb_build_object('ok', true, 'prestador_id', v_p.id, 'creada', v_creada,
    'cuenta_comercial_id', v_cc,
    'tiene_pagina', (v_p.descripcion IS NOT NULL AND btrim(v_p.descripcion) <> ''),
    'tiene_portada', EXISTS (SELECT 1 FROM prestador_fotos WHERE prestador_id = v_p.id));
END $fn$;

REVOKE ALL ON FUNCTION public.poblar_vitrina_refugio(text,text,text,text,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.poblar_vitrina_refugio(text,text,text,text,text) TO authenticated;

-- ═══ 🔴 EL BRAZO DE LECTURA — sin él la carpeta es un vertedero ═══
-- **Medido, no supuesto:** con INSERT y DELETE puestos, el refugio subió su
-- portada (200, objeto verificado en `storage.objects`) **y no pudo ni
-- listarla ni borrarla** — el listado devolvió 0 y el DELETE un 403.
--
-- La causa: Storage **busca el objeto antes de borrarlo**, así que un DELETE
-- sin SELECT rebota; y `adopcion_fotos_refugio_lee` está keyed a PUBLICACIÓN,
-- no a cuenta. *El bucket es público para el que mira la vitrina — pero el
-- dueño no la mira: la administra, y para eso pasa por la API.*
--
-- Es la forma exacta del `avatars` de S92: **se podía escribir y no borrar**.
-- *Un contenedor de una sola dirección no se descubre subiendo: se descubre
-- el día que alguien quiere cambiar su foto y no puede.*
CREATE POLICY adopcion_fotos_vitrina_lee ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'adopcion-fotos' AND public._path_es_de_mi_vitrina(name));

DO $c$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_policy
   WHERE polrelid='storage.objects'::regclass
     AND polname IN ('adopcion_fotos_vitrina_sube','adopcion_fotos_vitrina_borra',
                     'adopcion_fotos_vitrina_lee');
  /* 🔴 LAS TRES O NINGUNA. *Subir sin poder borrar es el defecto que esta
     migración acaba de producir y curar en el mismo acto.* */
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'CINTURON: la vitrina tiene % de 3 policies — falta una dirección', v_n;
  END IF;
  RAISE NOTICE 'CINTURON VERDE: subir, leer y borrar, las tres';
END $c$;
