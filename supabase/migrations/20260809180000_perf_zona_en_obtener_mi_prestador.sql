-- ══════════════════════════════════════════════════════════════════════════
-- S94-PERF · LA ZONA VIAJA EN LA MISMA RPC — muere el segundo viaje del
-- wrapper más llamado de la app.
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** DDL puro sobre una función de lectura. Cero backfill, cero
-- escritura, cero ancla que pueda moverse mientras corre.
--
-- ── EL NÚMERO QUE JUSTIFICA ESTA MIGRACIÓN (medido, no estimado) ──────────
-- `obtenerMiPrestador()` aparece en **28 de los efectos de foco censados** —
-- es, por lejos, el wrapper más invocado del monorepo. Y hace DOS viajes
-- encadenados: esta RPC, y con el id que devuelve, una lectura a
-- `v_prestadores_publicos` por tres columnas de zona (`packages/api/src/
-- wrappers/prestador.ts`, función `leerZona`).
--
--     hoy, dos viajes encadenados :  p50 316.1 ms
--     la zona en la misma RPC     :  p50 155.6 ms
--     ahorro por llamada          :  160.5 ms  (50.8 %)
--
-- Medido con token real por la misma puerta que la app (PostgREST), 15 tiros
-- con 3 de calentamiento descartados: `scripts/perf/b5-camino-real.mjs`.
--
-- El contexto que lo vuelve la cura correcta y no una micro-optimización: se
-- midió que **traer 1 fila y traer 105 cuesta lo mismo** (155,8 vs 149,9 ms).
-- El costo de esta app no está en los datos ni en el trabajo de la base: está
-- en la CANTIDAD DE VIAJES. *No hay consultas que optimizar; hay viajes que
-- eliminar.* Éste es el viaje más repetido que existe.
--
-- ── POR QUÉ ESTO NO ENSANCHA NADA (probado, no argumentado) ───────────────
-- Las tres columnas de zona ya son legibles por **cualquier `authenticated`**
-- a través de `v_prestadores_publicos` (medido: `has_table_privilege` da true
-- para `authenticated`, false para `anon`). Esta función es DEFINER, `anon` no
-- la puede ejecutar, y gatea por `user_gestiona_prestador`. **Su audiencia es
-- estrictamente más angosta que la de la vista**, así que mover el dato hacia
-- adentro no puede exponerlo a nadie nuevo. No se toca ninguna policy.
--
-- ── LA TRAMPA QUE ESTA MIGRACIÓN ESQUIVA (R3: mismo resultado) ────────────
-- La vista lleva `WHERE estado = 'activo'`. Hoy, un prestador que NO está
-- activo recibe `zona_* = NULL` porque su fila sencillamente no está en la
-- vista. Calcular la zona inline con la fórmula habría dado valores REALES a
-- ese prestador — un cambio de resultado disfrazado de optimización.
-- **Hay exactamente un caso vivo que lo discrimina**: un prestador
-- `en_revision` CON coordenadas. Por eso no se re-implementa la fórmula: se
-- hace `LEFT JOIN` contra la vista, que conserva la expresión **y** el filtro
-- por construcción. El cinturón de abajo lo verifica fila por fila.
--
-- Reversa escrita ANTES de aplicar:
--   `docs/relevamientos/2026-08-09-s94perf-REVERSA-zona-en-mi-prestador.sql`
--   (declara que revertir la base SIN revertir el bundle deja la zona rota).
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Cambiar el `RETURNS TABLE` exige DROP: no es un `CREATE OR REPLACE`.
-- Sobrecarga única verificada antes (`obtener_mi_prestador()`, sin argumentos).
DROP FUNCTION IF EXISTS public.obtener_mi_prestador();

CREATE FUNCTION public.obtener_mi_prestador()
 RETURNS TABLE(id uuid, nombre_comercial text, tipo text, country_code text,
               cuenta_comercial_id uuid, direccion text, ciudad text, sector text,
               lat double precision, lon double precision, radio_cobertura_km integer,
               grooming_extra_pelaje_largo numeric, grooming_recargo_domicilio numeric,
               descripcion text, telefono text, whatsapp text, email_contacto text,
               sitio_web text, estado text, foto_url text, clip_url text,
               expone_personas boolean, cohorte text, cohorte_anio integer,
               zona_lat double precision, zona_lon double precision, zona_radio_m integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Gate: el MISMO predicado de la policy del dueño, así que titular Y
  -- equipo activo entran (la puerta del arco de equipo de S75 sigue abierta).
  RETURN QUERY
  SELECT p.id, p.nombre_comercial, p.tipo, p.country_code,
         p.cuenta_comercial_id, p.direccion, p.ciudad, p.sector,
         p.lat, p.lon, p.radio_cobertura_km,
         p.grooming_extra_pelaje_largo, p.grooming_recargo_domicilio,
         p.descripcion, p.telefono, p.whatsapp, p.email_contacto,
         p.sitio_web, p.estado, p.foto_url, p.clip_url,
         p.expone_personas, p.cohorte, p.cohorte_anio,
         -- ⚠️ LEFT JOIN contra la vista, JAMÁS la fórmula copiada: así el
         -- ofuscado de S84 tiene UNA sola implementación y el filtro
         -- `estado='activo'` viaja con ella. Un prestador no activo sigue
         -- recibiendo NULL, exactamente como hoy.
         v.zona_lat, v.zona_lon, v.zona_radio_m
    FROM prestadores p
    LEFT JOIN v_prestadores_publicos v ON v.id = p.id
   WHERE public.user_gestiona_prestador(p.id)
   LIMIT 1;
END;
$function$;

-- ACL restaurado EXACTO al medido antes del DROP (un DROP se lleva el ACL
-- entero): postgres · authenticated · service_role. `anon` afuera.
REVOKE ALL ON FUNCTION public.obtener_mi_prestador() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_mi_prestador() TO authenticated, service_role;

DO $cinturon$
DECLARE
  v_cols        integer;
  v_anon        boolean;
  v_auth        boolean;
  v_srv         boolean;
  v_divergentes integer;
  v_no_activo   integer;
BEGIN
  -- (a) EXISTE con las tres columnas nuevas.
  SELECT count(*) INTO v_cols
    FROM unnest(string_to_array(pg_get_function_result(
           'public.obtener_mi_prestador()'::regprocedure), ',')) c
   WHERE c ILIKE '%zona_%';
  IF v_cols <> 3 THEN
    RAISE EXCEPTION 'CINTURÓN (a): la función no devuelve las 3 columnas de zona (devuelve %)', v_cols;
  END IF;

  -- (b) LA AUDIENCIA NO SE MOVIÓ. Por `has_function_privilege`, jamás por
  --     `LIKE` sobre `proacl` — el error que en S91 abortó una migración de
  --     seguridad con el agujero abierto (L-216).
  v_anon := has_function_privilege('anon',          'public.obtener_mi_prestador()', 'EXECUTE');
  v_auth := has_function_privilege('authenticated', 'public.obtener_mi_prestador()', 'EXECUTE');
  v_srv  := has_function_privilege('service_role',  'public.obtener_mi_prestador()', 'EXECUTE');
  IF v_anon OR NOT v_auth OR NOT v_srv THEN
    RAISE EXCEPTION 'CINTURÓN (b): la audiencia cambió — anon=% auth=% service_role=%', v_anon, v_auth, v_srv;
  END IF;

  /* (c) EL PAR DISCRIMINADOR (R3 · mismo resultado que antes).
     ⚠️ La primera versión de este assert comparaba `v_prestadores_publicos`
     contra `v_prestadores_publicos` para el mismo id y contaba las
     divergencias. Da 0 SIEMPRE — es la misma consulta dos veces. *Habría
     salido verde con la fórmula copiada mal adentro*, que es exactamente lo
     que vino a impedir. Un assert que no puede fallar no es un assert.

     Lo que sí discrimina son DOS BRAZOS con resultado opuesto, y la llave es
     el `WHERE estado='activo'` de la vista:
       · un prestador NO activo con coordenadas → las tres columnas en NULL
         (hoy también: su fila no está en la vista y el wrapper leía nada);
       · un prestador activo con coordenadas    → las tres con valor.
     Si alguien reemplazara el JOIN por la fórmula inline, el primer brazo
     pasaría a devolver valores y este cinturón abortaría la migración. */
  SELECT count(*) INTO v_no_activo
    FROM prestadores WHERE estado <> 'activo' AND lat IS NOT NULL;
  IF v_no_activo = 0 THEN
    RAISE EXCEPTION 'CINTURÓN (c0): no existe el caso que discrimina (no-activo con coordenadas) — el par no probaría nada';
  END IF;

  SELECT count(*) INTO v_divergentes
    FROM prestadores p
    LEFT JOIN v_prestadores_publicos v ON v.id = p.id
   WHERE (p.estado <> 'activo' AND p.lat IS NOT NULL
          AND (v.zona_lat IS NOT NULL OR v.zona_lon IS NOT NULL OR v.zona_radio_m IS NOT NULL))
      OR (p.estado  = 'activo' AND p.lat IS NOT NULL
          AND (v.zona_lat IS NULL OR v.zona_lon IS NULL OR v.zona_radio_m IS NULL));
  IF v_divergentes <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN (c): % prestadores caen del lado equivocado del par (no-activo con zona, o activo sin ella)', v_divergentes;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE — 3 columnas de zona · audiencia intacta · 0 divergencias sobre % prestadores · el caso no-activo con coordenadas existe (%)',
    (SELECT count(*) FROM prestadores), v_no_activo;
END
$cinturon$;

COMMIT;
