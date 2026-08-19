-- ═══════════════════════════════════════════════════════════════════════════
-- S100d·bis-A · `places_id` DEJA DE SER UNA COLUMNA SIN ESCRITOR
-- Firma del founder, 18-ago-2026.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── EL HALLAZGO, Y NO ES «FALTA UN DATO» ──────────────────────────────────
-- `direcciones_guardadas.places_id` existe desde su DDL. Medido hoy:
--
--     direcciones guardadas ……………………………  3
--     con places_id ………………………………………………  0
--     el wrapper manda places_id …………………  NO   (censado en direcciones.ts)
--     la RPC lo toma …………………………………………… NO   (medido en su firma)
--
-- ⇒ el cero **no prueba que Places falle: prueba que nuestra puerta nunca lo
-- guarda.** Es una COLUMNA SIN ESCRITOR — el mismo patrón que `envio_eventos`,
-- que ya costó una vuelta.
--
-- 🔴 LO QUE LO VUELVE ROJO NO ES LA COLUMNA VACÍA, ES SU CONSECUENCIA:
-- guardamos **el punto final** y **no la coordenada que Places resolvió** ⇒
-- **la divergencia entre «la dirección que el dueño eligió» y «el punto que
-- terminó guardado» NO ES AUDITABLE DESPUÉS DEL HECHO.** No hay contra qué
-- comparar.
--
-- Y el defecto que la produce está medido y reportado por el founder: en el
-- formulario, **el mapa se come el scroll** — para llegar a los botones hay que
-- arrastrar sobre él, y arrastrarlo MUEVE EL PUNTO. *«Me desacomoda la
-- dirección… si no me di cuenta, no pasa.»* ⇒ se guarda una dirección distinta
-- de la que la persona eligió, **sin que se entere**.
--
-- **Hoy son 3 direcciones: el daño es de VOLUMEN, no de diseño.** Con 500
-- clientes, cada punto corrido es una entrega fallida **sin causa rastreable**.
--
-- ── LO QUE ESTA MIGRACIÓN HACE, Y LO QUE NO ───────────────────────────────
-- HACE: que el dato NUEVO nazca completo — `places_id` y la coordenada
-- resuelta por Places viajan y se guardan **junto al punto final**. Con las
-- dos, la divergencia se vuelve **medible**: cualquier auditoría compara.
--
-- **NO HACE — y es decisión firmada:** no repara las 3 direcciones que ya
-- existen. **No se puede** (no hay contra qué comparar) y **no se inventa**:
-- *«no inventes un places_id retroactivo»*. Quedan como están, con sus tres
-- columnas en NULL, **y ese NULL es la verdad: no sabemos.**
--
-- ── ⚠️ POR QUÉ DROP + CREATE Y NO `CREATE OR REPLACE` ─────────────────────
-- `CREATE OR REPLACE` **no puede cambiar la cantidad de argumentos**: crearía
-- una SOBRECARGA y dejaría la vieja zombi (L-119), con PostgREST resolviendo
-- ambiguo. Se hace DROP explícito de la firma vieja + CREATE de la nueva.
--
-- 🔴 **Y LOS BUNDLES VIVOS NO SE ROMPEN, que es la parte que hay que declarar
-- (D-662):** los tres parámetros nuevos van **AL FINAL y con DEFAULT NULL**,
-- así que **una llamada con los argumentos viejos sigue resolviendo a la
-- función nueva**. *El bundle publicado hoy —y el que el founder tenga
-- instalado— siguen guardando direcciones igual, solo que sin la auditoría.*
-- Por eso esta migración **no exige ser un solo acto con su publish**.
--
-- ── VEDA 76(g): NO RIGE ───────────────────────────────────────────────────
-- Aditiva pura: tres columnas nullables y dos funciones con parámetros
-- opcionales. **Cero backfill, cero filas tocadas, cero anclas.**
--
-- ── REVERSA ───────────────────────────────────────────────────────────────
-- Escrita ANTES, en `docs/relevamientos/2026-08-18-s100dbis-REVERSA-places-auditable.sql`,
-- y declara lo que importa: **revertirla no rompe nada hoy, y eso es lo
-- peligroso** — el síntoma no es un error, es que dentro de seis meses una
-- entrega falle sin nada contra qué comparar.
-- ═══════════════════════════════════════════════════════════════════════════

-- ══ ① LAS TRES COLUMNAS DE AUDITORÍA ════════════════════════════════════
ALTER TABLE public.direcciones_guardadas
  ADD COLUMN IF NOT EXISTS lat_places double precision,
  ADD COLUMN IF NOT EXISTS lon_places double precision,
  ADD COLUMN IF NOT EXISTS punto_movido_a_mano boolean;

COMMENT ON COLUMN public.direcciones_guardadas.lat_places IS
  'La coordenada que PLACES resolvió, sin tocar. NULL = la dirección no se '
  'resolvió por Places (se escribió a mano) o es anterior a S100d-bis. '
  'Se compara contra lat/lon para saber si el punto se movió.';
COMMENT ON COLUMN public.direcciones_guardadas.punto_movido_a_mano IS
  'true = el dueño movió el pin después de resolver. NULL = no se sabe '
  '(dirección anterior a S100d-bis). NO se infiere de lat<>lat_places: '
  'moverlo un metro y no moverlo son cosas distintas para el dueño.';

-- ══ ② `guardar_direccion_hogar` ═════════════════════════════════════════
-- CUERPO VIEJO: idéntico salvo los tres parámetros nuevos y sus tres columnas
-- en el INSERT/UPDATE. Nada más se toca.
DROP FUNCTION IF EXISTS public.guardar_direccion_hogar(
  text, text, text, text, text, double precision, double precision);

CREATE FUNCTION public.guardar_direccion_hogar(
  p_direccion text,
  p_ciudad text,
  p_sector text DEFAULT NULL::text,
  p_referencias text DEFAULT NULL::text,
  p_telefono text DEFAULT NULL::text,
  p_lat double precision DEFAULT NULL::double precision,
  p_lon double precision DEFAULT NULL::double precision,
  -- ⬇️ S100d·bis · LOS TRES NUEVOS, al final y opcionales: un caller viejo
  --    sigue resolviendo acá.
  p_places_id text DEFAULT NULL::text,
  p_lat_places double precision DEFAULT NULL::double precision,
  p_lon_places double precision DEFAULT NULL::double precision
) RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id   uuid;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_direccion IS NULL OR btrim(p_direccion) = '' THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_ciudad IS NULL OR btrim(p_ciudad) = '' THEN
    RAISE EXCEPTION 'ciudad_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_telefono IS NOT NULL AND p_telefono ~ '^\+' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;
  IF (p_lat IS NULL) <> (p_lon IS NULL) THEN
    RAISE EXCEPTION 'coordenadas_invalidas' USING ERRCODE = '22023';
  END IF;
  IF p_lat IS NOT NULL AND (abs(p_lat) > 90 OR abs(p_lon) > 180) THEN
    RAISE EXCEPTION 'coordenadas_invalidas' USING ERRCODE = '22023';
  END IF;
  -- La coordenada de Places va en PAR igual que la del punto: media
  -- coordenada es relleno plausible (L-139).
  IF (p_lat_places IS NULL) <> (p_lon_places IS NULL) THEN
    RAISE EXCEPTION 'coordenadas_invalidas' USING ERRCODE = '22023';
  END IF;

  INSERT INTO direcciones_guardadas AS d
    (user_id, alias, direccion, ciudad, sector, referencias, telefono, lat, lon,
     es_principal, places_id, lat_places, lon_places, punto_movido_a_mano)
  VALUES
    (v_auth, 'Hogar', btrim(p_direccion), btrim(p_ciudad),
     NULLIF(btrim(p_sector), ''), NULLIF(btrim(p_referencias), ''),
     NULLIF(btrim(p_telefono), ''), p_lat, p_lon, true,
     NULLIF(btrim(p_places_id), ''), p_lat_places, p_lon_places,
     -- Solo es «movido» si HAY con qué comparar. Sin coordenada de Places la
     -- respuesta honesta es NULL: no sabemos.
     CASE WHEN p_lat_places IS NULL THEN NULL
          ELSE (p_lat IS DISTINCT FROM p_lat_places OR p_lon IS DISTINCT FROM p_lon_places)
     END)
  ON CONFLICT (user_id) WHERE es_principal
  DO UPDATE SET
    direccion   = EXCLUDED.direccion,
    ciudad      = EXCLUDED.ciudad,
    sector      = EXCLUDED.sector,
    referencias = EXCLUDED.referencias,
    telefono    = EXCLUDED.telefono,
    lat         = EXCLUDED.lat,
    lon         = EXCLUDED.lon,
    places_id           = EXCLUDED.places_id,
    lat_places          = EXCLUDED.lat_places,
    lon_places          = EXCLUDED.lon_places,
    punto_movido_a_mano = EXCLUDED.punto_movido_a_mano
  RETURNING d.id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'direccion_id', v_id,
    'snapshot', _direccion_hogar_snapshot(v_auth)
  );
END;
$function$;

-- ══ ③ `guardar_direccion_con_alias` ═════════════════════════════════════
DROP FUNCTION IF EXISTS public.guardar_direccion_con_alias(
  text, text, text, text, text, text, double precision, double precision, uuid);

CREATE FUNCTION public.guardar_direccion_con_alias(
  p_alias text,
  p_direccion text,
  p_ciudad text,
  p_sector text DEFAULT NULL::text,
  p_referencias text DEFAULT NULL::text,
  p_telefono text DEFAULT NULL::text,
  p_lat double precision DEFAULT NULL::double precision,
  p_lon double precision DEFAULT NULL::double precision,
  p_direccion_id uuid DEFAULT NULL::uuid,
  p_places_id text DEFAULT NULL::text,
  p_lat_places double precision DEFAULT NULL::double precision,
  p_lon_places double precision DEFAULT NULL::double precision
) RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id   uuid;
  v_movido boolean;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_alias IS NULL OR btrim(p_alias) = '' THEN
    RAISE EXCEPTION 'alias_requerido' USING ERRCODE = '22023';
  END IF;
  IF length(btrim(p_alias)) > 60 THEN
    RAISE EXCEPTION 'alias_muy_largo' USING ERRCODE = '22023';
  END IF;
  IF p_direccion IS NULL OR btrim(p_direccion) = '' THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_ciudad IS NULL OR btrim(p_ciudad) = '' THEN
    RAISE EXCEPTION 'ciudad_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_telefono IS NOT NULL AND p_telefono ~ '^\+' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_lat IS NULL OR p_lon IS NULL THEN
    RAISE EXCEPTION 'punto_requerido' USING ERRCODE = '22023';
  END IF;
  IF abs(p_lat) > 90 OR abs(p_lon) > 180 THEN
    RAISE EXCEPTION 'coordenadas_invalidas' USING ERRCODE = '22023';
  END IF;
  IF (p_lat_places IS NULL) <> (p_lon_places IS NULL) THEN
    RAISE EXCEPTION 'coordenadas_invalidas' USING ERRCODE = '22023';
  END IF;

  v_movido := CASE WHEN p_lat_places IS NULL THEN NULL
                   ELSE (p_lat IS DISTINCT FROM p_lat_places
                         OR p_lon IS DISTINCT FROM p_lon_places) END;

  IF p_direccion_id IS NOT NULL THEN
    UPDATE direcciones_guardadas
       SET alias       = btrim(p_alias),
           direccion   = btrim(p_direccion),
           ciudad      = btrim(p_ciudad),
           sector      = NULLIF(btrim(p_sector), ''),
           referencias = NULLIF(btrim(p_referencias), ''),
           telefono    = NULLIF(btrim(p_telefono), ''),
           lat         = p_lat,
           lon         = p_lon,
           places_id           = NULLIF(btrim(p_places_id), ''),
           lat_places          = p_lat_places,
           lon_places          = p_lon_places,
           punto_movido_a_mano = v_movido
     WHERE id = p_direccion_id
       AND user_id = v_auth
     RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'direccion_no_encontrada' USING ERRCODE = '42501';
    END IF;
  ELSE
    INSERT INTO direcciones_guardadas
      (user_id, alias, direccion, ciudad, sector, referencias, telefono,
       lat, lon, es_principal, places_id, lat_places, lon_places, punto_movido_a_mano)
    VALUES
      (v_auth, btrim(p_alias), btrim(p_direccion), btrim(p_ciudad),
       NULLIF(btrim(p_sector), ''), NULLIF(btrim(p_referencias), ''),
       NULLIF(btrim(p_telefono), ''), p_lat, p_lon,
       false,
       NULLIF(btrim(p_places_id), ''), p_lat_places, p_lon_places, v_movido)
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'direccion_id', v_id);
END;
$function$;

-- ══ ④ L-140 · las dos nacen con EXECUTE para anon y hay que quitarlo ═════
-- Toda función nueva recibe EXECUTE de `anon` por los default privileges de
-- Supabase, y `REVOKE FROM PUBLIC` NO lo quita (es un grant explícito).
REVOKE EXECUTE ON FUNCTION public.guardar_direccion_hogar(
  text, text, text, text, text, double precision, double precision,
  text, double precision, double precision) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.guardar_direccion_con_alias(
  text, text, text, text, text, text, double precision, double precision, uuid,
  text, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_direccion_hogar(
  text, text, text, text, text, double precision, double precision,
  text, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_direccion_con_alias(
  text, text, text, text, text, text, double precision, double precision, uuid,
  text, double precision, double precision) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN — cuatro brazos, y el tercero es el que de verdad prueba algo
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_n int;
BEGIN
  -- (a) las tres columnas existen
  SELECT count(*) INTO v_n FROM information_schema.columns
   WHERE table_schema='public' AND table_name='direcciones_guardadas'
     AND column_name IN ('lat_places','lon_places','punto_movido_a_mano');
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'CINTURÓN (a): faltan columnas de auditoría (hay %)', v_n;
  END IF;

  -- (b) NO quedaron sobrecargas zombi (L-119)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='guardar_direccion_hogar';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN (b): guardar_direccion_hogar tiene % versiones', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='guardar_direccion_con_alias';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN (b): guardar_direccion_con_alias tiene % versiones', v_n;
  END IF;

  -- (c) 🔴 EL BRAZO QUE PROTEGE AL BUNDLE VIVO — el que de verdad importa.
  -- Que la función exista no prueba que un caller VIEJO la alcance. Se
  -- resuelve una llamada con los argumentos de ANTES: si no resuelve, el
  -- bundle publicado dejó de poder guardar direcciones y nos enteraríamos
  -- por un usuario, no por acá.
  IF to_regprocedure('public.guardar_direccion_hogar(text,text,text,text,text,double precision,double precision)') IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public' AND p.proname='guardar_direccion_hogar'
          AND p.pronargdefaults >= 3)
  THEN
    RAISE EXCEPTION 'CINTURÓN (c): un caller con los 7 args viejos ya no resuelve — el bundle vivo quedaría roto';
  END IF;

  -- (d) L-140: ninguna de las dos quedó con EXECUTE para anon
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('guardar_direccion_hogar','guardar_direccion_con_alias')
     AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN (d): % función(es) quedaron ejecutables por anon', v_n;
  END IF;

  RAISE NOTICE 'CINTURÓN OK · columnas 3 · sin sobrecargas · caller viejo resuelve · anon en 0';
END
$cinturon$;
