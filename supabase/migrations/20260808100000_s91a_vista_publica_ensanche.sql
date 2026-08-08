-- ============================================================================
-- S91-A · LA VITRINA PÚBLICA SE ENSANCHA — tres campos (pedido literal de C)
-- ============================================================================
-- **El orden importó y se respetó:** primero la cura de la fuga
-- (`20260808080000`, que dejó a esta vista como LA única puerta pública y en
-- `security_invoker=false`), y recién ahora el ensanche. Al revés, el ensanche
-- habría sumado columnas a una vista que estaba a punto de cambiar de modo de
-- seguridad — dos movimientos pisándose sobre la misma pieza.
--
-- ── ① `categoria` EN CADA SERVICIO (corrección de mesa sobre el pedido) ────
-- El pedido original ofrecía `es_medico` **o** `categoria`, uno de los dos, y
-- **el freno de C eligió bien: va `categoria`.** El porqué, que es medible:
-- `es_medico` solo separa Veterinaria; para todo el resto de oficios el
-- cliente tendría que re-implementar el mapa de **29 códigos de
-- `tipos_servicio`** — *la segunda verdad que diverge sola.* `categoria`
-- resuelve todo con un campo: veterinaria directo, y emergencia/telemedicina
-- se agrupan con la MISMA regla que ya usa el prestador.
-- *Y el precedente S69 sigue vigente y no se contradice: la JORNADA clínica
-- se compone por `es_medico` (filtrar por categoría perdía telemedicina y
-- urgencias). Son dos preguntas distintas — «¿es un acto clínico?» vs «¿de
-- qué oficio hablo?»— y cada una tiene su campo.*
--
-- ── ② PORTADAS y ③ `clip_url` ──────────────────────────────────────────────
-- Sin ellas **la familia vería una ficha más pobre que la que el prestador
-- cree mostrar**, y el espejo dejaría de ser espejo (letra de C). Las portadas
-- salen de `prestador_fotos` **en el orden de `orden`**, que es el contrato
-- vivo de `listarFotosGaleria`: **`[0]` es la portada.** No se inventa un
-- criterio de portada acá — se respeta el que ya rige.
--
-- ── LA FORMA: SUBCONSULTAS, NO DOS LEFT JOIN ───────────────────────────────
-- La vista ya agregaba `servicios` con un `LEFT JOIN` + `GROUP BY`. Sumar un
-- segundo `LEFT JOIN` (fotos) habría multiplicado filas: **N servicios × M
-- fotos**, y los agregados habrían contado cada cosa M o N veces. Con dos
-- agregados independientes, las subconsultas son la forma correcta — no una
-- preferencia de estilo.
--
-- Veda 76(g): NO RIGE — solo redefine una vista; cero datos.
-- D-662: la vista GANA columnas (aditivo). Ningún bundle vivo las pide, y los
-- que piden las 21 de antes siguen recibiéndolas.
-- Reversa: docs/relevamientos/2026-08-08-s91a-REVERSA-vista-publica-ensanche.sql
-- ============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.v_prestadores_publicos AS
SELECT p.id,
       p.user_id,
       p.tipo,
       p.nombre_comercial,
       p.descripcion,
       p.foto_url,
       p.ciudad,
       p.sector,
       CASE
         WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::double precision
         ELSE p.lat + (500::numeric * (0.30 + (abs(hashtext(p.id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision * cos(((abs(hashtext(p.id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi()) / 111320::double precision
       END AS zona_lat,
       CASE
         WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::double precision
         ELSE p.lon + (500::numeric * (0.30 + (abs(hashtext(p.id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision * sin(((abs(hashtext(p.id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi()) / (111320::double precision * GREATEST(cos(radians(p.lat)), 0.01::double precision))
       END AS zona_lon,
       CASE
         WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::integer
         ELSE 500
       END AS zona_radio_m,
       p.calificacion_promedio,
       p.total_resenas,
       p.total_citas,
       p.acepta_emergencias,
       p.acepta_telemedicina,
       p.radio_cobertura_km,
       p.country_code,
       p.cohorte,
       p.cohorte_anio,
       -- ① los servicios, ahora con su CATEGORÍA
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object(
                  'id', ps.id,
                  'tipo', ps.tipo_servicio,
                  'nombre', COALESCE(ps.nombre_custom, ps.tipo_servicio),
                  'precio', ps.precio,
                  'duracion_minutos', ps.duracion_minutos,
                  'categoria', ts.categoria)
                ORDER BY ps.tipo_servicio)
           FROM prestador_servicios ps
           LEFT JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
          WHERE ps.prestador_id = p.id AND ps.activo = true
       ), '[]'::jsonb) AS servicios,
       -- ② las portadas EN EL ORDEN DE `orden`: [0] es la portada (contrato
       --    vivo de `listarFotosGaleria` — acá se respeta, no se re-decide)
       COALESCE((
         SELECT jsonb_agg(pf.url ORDER BY pf.orden, pf.creado_en)
           FROM prestador_fotos pf
          WHERE pf.prestador_id = p.id
       ), '[]'::jsonb) AS portadas,
       -- ③ el clip de la vitrina: el prestador lo sube para que se vea.
       -- ⚠️ VA AL FINAL, y no por gusto: `CREATE OR REPLACE VIEW` NO PUEDE
       -- insertar una columna en el medio —rebota 42P16 «cannot change name
       -- of view column»—. Las columnas nuevas de una vista existente solo
       -- se APENDEAN. (Medido: el primer intento puso clip_url tras foto_url
       -- y Postgres lo leyó como un RENAME de `ciudad`.)
       p.clip_url
  FROM prestadores p
 WHERE p.estado = 'activo';

-- El modo de seguridad se re-declara: un CREATE OR REPLACE VIEW conserva las
-- reloptions, pero dejarlo implícito sería confiar en un detalle. La cura de
-- la fuga depende de que esta vista NO sea invoker.
ALTER VIEW public.v_prestadores_publicos SET (security_invoker = false);

COMMENT ON VIEW public.v_prestadores_publicos IS
  'LA única puerta de lectura PÚBLICA de prestadores (S91: la tabla dejó de ser legible por clientes). Zona ofuscada estable por id (S84: la coordenada exacta no viaja). S91 suma clip_url, portadas (orden de `orden`: [0] es la portada) y `categoria` en cada servicio — categoria y no es_medico, porque es_medico solo separa Veterinaria y el resto obligaría al cliente a re-implementar el mapa de 29 códigos.';

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_n int; v_cat int; v_srv jsonb;
BEGIN
  -- Las 21 de antes SIGUEN estando (aditivo de verdad, no reemplazo)
  SELECT count(*) INTO v_n FROM information_schema.columns
   WHERE table_schema='public' AND table_name='v_prestadores_publicos'
     AND column_name IN ('id','user_id','tipo','nombre_comercial','descripcion','foto_url',
       'ciudad','sector','zona_lat','zona_lon','zona_radio_m','calificacion_promedio',
       'total_resenas','total_citas','acepta_emergencias','acepta_telemedicina',
       'radio_cobertura_km','country_code','cohorte','cohorte_anio','servicios');
  IF v_n <> 21 THEN RAISE EXCEPTION 'cinturon_vista: se perdio alguna de las 21 originales (% presentes)', v_n; END IF;

  -- Y las TRES nuevas están
  SELECT count(*) INTO v_n FROM information_schema.columns
   WHERE table_schema='public' AND table_name='v_prestadores_publicos'
     AND column_name IN ('clip_url','portadas');
  IF v_n <> 2 THEN RAISE EXCEPTION 'cinturon_vista: faltan clip_url/portadas'; END IF;

  -- `categoria` viaja DENTRO de cada servicio, y se mide sobre DATO REAL:
  -- un cinturón que solo mirara el DDL no probaría que el LEFT JOIN resuelve.
  SELECT servicios INTO v_srv FROM v_prestadores_publicos
   WHERE jsonb_array_length(servicios) > 0 LIMIT 1;
  IF v_srv IS NULL THEN
    RAISE EXCEPTION 'cinturon_vista: ningun prestador activo con servicios — no se pudo probar categoria sobre dato real';
  END IF;
  SELECT count(*) INTO v_cat FROM jsonb_array_elements(v_srv) e
   WHERE e->>'categoria' IS NOT NULL;
  IF v_cat = 0 THEN
    RAISE EXCEPTION 'cinturon_vista: `categoria` viene NULL en todos los servicios — el join a tipos_servicio no resuelve';
  END IF;

  -- El ofuscado de S84 sigue vivo (esto NO lo tocó)
  IF EXISTS (SELECT 1 FROM v_prestadores_publicos v JOIN prestadores p ON p.id=v.id
              WHERE v.zona_lat IS NOT NULL AND v.zona_lat = p.lat) THEN
    RAISE EXCEPTION 'cinturon_vista: la zona coincide con la coordenada EXACTA — el ofuscado se rompio';
  END IF;

  -- Y la vista NO volvió a invoker (de eso depende la cura de la fuga)
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname='public' AND c.relname='v_prestadores_publicos'
                AND 'security_invoker=true' = ANY(c.reloptions)) THEN
    RAISE EXCEPTION 'cinturon_vista: la vista volvio a invoker — la fuga se reabrio';
  END IF;
END $$;

COMMIT;
