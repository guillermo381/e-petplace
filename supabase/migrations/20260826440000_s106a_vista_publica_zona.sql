-- ============================================================================
-- S106-A tanda 3 · 🔴 P0 — LA VITRINA PÚBLICA REBOTABA ENTERA PARA TODA FAMILIA
--
-- ── EL SÍNTOMA, REPORTADO POR EL FOUNDER EN EL PASO 7 DEL GATE ─────────────
-- *«Al listar Clínica Aurora no llegan las fotos ni el logo · al tocar la
-- clínica la pantalla sale EN BLANCO · hay un texto de error de conexión
-- cortado a la mitad · al volver, los datos siguen sin aparecer.»*
--
-- ── LA CAUSA, MEDIDA POR DISCRIMINADOR ─────────────────────────────────────
-- `v_prestadores_publicos` es **`security_invoker`** (S79, a propósito: la
-- vista no debía ser una puerta trasera a la RLS). Sus columnas `zona_lat` y
-- `zona_lon` **calculan el centro desplazado leyendo `p.lat` y `p.lon`** — y
-- desde S84 **`authenticated` NO tiene grant sobre esas dos columnas**, porque
-- S84 sacó la coordenada exacta del teléfono a propósito.
--
-- ⇒ Postgres no devuelve las columnas que sí puede: **rebota la consulta
-- entera** con `permission denied for table prestadores`.
--
-- **Discriminador corrido en una transacción deshecha:**
--
-- | | |
-- |---|---|
-- | sin grant `lat`/`lon` | `permission denied for table prestadores` |
-- | con grant `lat`/`lon` | **10 filas** |
--
-- ── 🔴 EL ALCANCE, Y NO ES DE TELEMEDICINA ─────────────────────────────────
-- Esta vista es **el listado público de prestadores del producto entero**.
-- Rebotando, se caen las fotos, el logo, las portadas, los servicios y el clip
-- **de los cinco oficios**, para **toda familia logueada**. *Estaba en
-- producción, y lo encontró un founder mirando una pantalla — no un gate.*
--
-- Y explica los tres síntomas de una sola vez: no hay fotos porque `portadas`
-- sale de acá; no hay logo porque `foto_url` sale de acá; y la pantalla queda
-- en blanco con voz de red **porque la app trata el rebote de permisos como un
-- fallo de conexión** — *mintiendo sobre la causa, que es el hallazgo ① del
-- founder y queda como deuda de superficie aparte.*
--
-- ── LA CURA, Y POR QUÉ NO ES EL GRANT ──────────────────────────────────────
-- 🔴 **NO se concede `lat`/`lon` a `authenticated`.** Eso arreglaría la vista
-- deshaciendo S84 y volvería a mandar **la coordenada exacta de la casa de un
-- prestador** al teléfono de cualquiera. *La elección no es entre la vitrina y
-- la privacidad: es entre leer la columna y no leerla.*
--
-- El cálculo se muda a un helper **`SECURITY DEFINER`**, que lee `lat`/`lon`
-- con los privilegios del dueño y devuelve **sólo el punto desplazado**. La
-- vista deja de nombrar esas columnas ⇒ deja de necesitar el grant.
--
-- ⚠️ **El helper devuelve el desplazado y NADA MÁS.** No expone `lat`/`lon`
-- crudos por ninguna de sus salidas: *un DEFINER que devuelve lo que su gate
-- existía para tapar es el agujero con mejor letra.* El desplazamiento es el
-- mismo de S84, **estable por `id`** (un ofuscado que varía no ofusca:
-- promedia).
--
-- ── VEDA 76(g): NO RIGE. Función nueva + `CREATE OR REPLACE VIEW`. Cero DDL
--    de tablas, cero backfill, cero anclas.
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-vista-publica-zona.sql
--    ⚠️ y NO es neutra: revertir apaga la vitrina otra vez.
-- ============================================================================

CREATE OR REPLACE FUNCTION public._zona_aproximada(p_prestador_id uuid)
RETURNS TABLE (zona_lat double precision, zona_lon double precision, zona_radio_m integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  /* El desplazamiento de S84, verbatim: radio ~500 m, ángulo y distancia
     derivados del `id` ⇒ **estable**. Un ofuscado que cambia en cada lectura
     no ofusca: promediando unas cuantas se recupera el centro real. */
  SELECT
    CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::double precision
         ELSE p.lat
            + (500::numeric * (0.30 + (abs(hashtext(p.id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision
            * cos(((abs(hashtext(p.id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi())
            / 111320::double precision
    END,
    CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::double precision
         ELSE p.lon
            + (500::numeric * (0.30 + (abs(hashtext(p.id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision
            * sin(((abs(hashtext(p.id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi())
            / (111320::double precision * GREATEST(cos(radians(p.lat)), 0.01::double precision))
    END,
    CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::integer ELSE 500 END
  FROM prestadores p
  WHERE p.id = p_prestador_id
    -- El mismo gate que la vista: sólo activos. *Un helper más ancho que su
    -- único consumidor es una puerta que nadie recuerda haber abierto.*
    AND p.estado = 'activo';
$function$;

COMMENT ON FUNCTION public._zona_aproximada(uuid) IS
  'S106 · Centro DESPLAZADO ~500m estable por id (S84). DEFINER para que la vista '
  'publica no necesite grant sobre lat/lon. Jamas devuelve la coordenada exacta.';

REVOKE EXECUTE ON FUNCTION public._zona_aproximada(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._zona_aproximada(uuid) TO authenticated;

-- ── LA VISTA, sin nombrar lat/lon ──────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_prestadores_publicos
WITH (security_invoker = true) AS
SELECT p.id, p.user_id, p.tipo, p.nombre_comercial, p.descripcion, p.foto_url,
       p.ciudad, p.sector,
       z.zona_lat, z.zona_lon, z.zona_radio_m,
       p.calificacion_promedio, p.total_resenas, p.total_citas,
       p.acepta_emergencias, p.radio_cobertura_km, p.country_code,
       p.cohorte, p.cohorte_anio,
       COALESCE((SELECT jsonb_agg(jsonb_build_object(
                   'id', ps.id, 'tipo', ps.tipo_servicio,
                   'nombre', COALESCE(ps.nombre_custom, ps.tipo_servicio),
                   'precio', ps.precio, 'duracion_minutos', ps.duracion_minutos,
                   'categoria', ts.categoria) ORDER BY ps.tipo_servicio)
                 FROM prestador_servicios ps
                 LEFT JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
                 WHERE ps.prestador_id = p.id AND ps.activo = true), '[]'::jsonb) AS servicios,
       COALESCE((SELECT jsonb_agg(pf.url ORDER BY pf.orden, pf.creado_en)
                 FROM prestador_fotos pf WHERE pf.prestador_id = p.id), '[]'::jsonb) AS portadas,
       p.clip_url
FROM prestadores p
LEFT JOIN LATERAL public._zona_aproximada(p.id) z ON true
WHERE p.estado = 'activo'::text;

-- ── CINTURÓN: los DOS lados, y el segundo es el que importa ────────────────
DO $cinturon$
DECLARE
  v_rol text := current_user;   -- ⚠️ jamás RESET ROLE
  v_n int; v_err text := '(sin error)';
  v_lat double precision; v_zlat double precision;
BEGIN
  -- ① LA VITRINA SE LEE COMO LA FAMILIA — por el camino real, con JWT.
  EXECUTE 'SET LOCAL request.jwt.claims = ''{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}''';
  SET LOCAL ROLE authenticated;
  BEGIN
    SELECT count(*) INTO v_n FROM v_prestadores_publicos;
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM; v_n := -1; END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  IF v_n <= 0 THEN
    RAISE EXCEPTION 'cinturon: la vitrina NO se lee como la familia (%) — %', v_n, v_err;
  END IF;

  -- ② 🔴 Y LA COORDENADA EXACTA SIGUE SIN VIAJAR. *Curar la vitrina abriendo
  --    lat/lon habría dado verde en ① y deshecho S84 sin que nadie lo notara.*
  IF has_column_privilege('authenticated','public.prestadores','lat','SELECT')
     OR has_column_privilege('authenticated','public.prestadores','lon','SELECT') THEN
    RAISE EXCEPTION 'cinturon: authenticated recupero grant sobre lat/lon — eso deshace S84';
  END IF;

  -- ③ Y el desplazado NO es la coordenada real: si coincidieran, el ofuscado
  --    no estaría ofuscando nada.
  SELECT p.lat, (SELECT zona_lat FROM v_prestadores_publicos v WHERE v.id = p.id)
    INTO v_lat, v_zlat
  FROM prestadores p WHERE p.estado='activo' AND p.lat IS NOT NULL LIMIT 1;
  IF v_lat IS NOT NULL AND v_zlat IS NOT NULL AND v_lat = v_zlat THEN
    RAISE EXCEPTION 'cinturon: zona_lat coincide con lat — el desplazamiento no se aplico';
  END IF;

  RAISE NOTICE 'cinturon vitrina: OK · % prestador(es) visibles · lat/lon siguen sin grant · desplazamiento vivo', v_n;
END;
$cinturon$;
