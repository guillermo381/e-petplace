/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL RESUMEN DEL FILTRO — cuántos, desde cuánto, y POR QUÉ no
   ═══════════════════════════════════════════════════════════════════════════

   **Firma del founder (S107).** La pantalla necesita las tres cosas JUNTAS:
   con ellas pinta «desde $X», habilita o no el botón, y **dice por qué no
   puede**. Tres llamadas darían tres verdades de tres instantes distintos.

   ── 🔴 EL PRECIO SE CALCULA DESPUÉS DE FILTRAR, JAMÁS ANTES ──────────────
   `precio_desde` es el mínimo **entre los lugares que de verdad van a aparecer
   en la lista** — ya filtrados por día, cupo, radio y especie.

   > *Un «desde $8» de un lugar que después no aparece promete de más:* la
   > familia toca, ve otra lista, y el número más bajo que vio no existe.
   > **El precio es del conjunto que se va a mostrar o no es de nadie.**

   ── 🔴 LA CAUSA SE DICE CON SU NOMBRE, y sale de una CASCADA MEDIDA ──────
   No se adivina: **se relaja el filtro por etapas y se mira dónde cae a cero.**

   | etapa | qué se afloja | si cae acá, la causa es |
   |---|---|---|
   | ① | sólo especie | `especie_sin_oferta` |
   | ② | + modalidad | `nadie_vende_esa_modalidad` |
   | ③ | + cobertura | `sin_cobertura` |
   | ④ | + día operativo y cupo | `sin_cupo_ese_dia` |

   *Un «no hay» que no distingue el día de la especie manda a la familia a
   probar combinaciones al azar* — y a concluir que el producto no sirve.

   ⚠️ **`causa_indeterminada` existe y se devuelve DECLARADA**, jamás una causa
   inventada. Se da si la cascada no cae en ningún escalón (estado imposible por
   construcción, pero un lector que miente sobre el porqué es peor que uno que
   dice «no sé»).

   ⚠️ **`sin_cobertura` sólo puede ser causa si vinieron `lat`/`lon`.** Sin
   ubicación no hay filtro geográfico, así que esa etapa no descarta a nadie y
   nunca puede ser la culpable. *Nombrarla igual sería culpar a un filtro
   apagado.*

   ── 🔴 LA VÍSPERA NO ES UNA CAUSA: ES UN REBOTE ─────────────────────────
   Con `p_fecha <= hoy` esto **lanza `fecha_no_ofertable`**, no devuelve cero
   con una causa. *«Hoy no se puede reservar» no es «no hay lugares»* — es una
   precondición del flujo, y disfrazarla de causa haría que la pantalla
   ofreciera cambiar de día cuando el problema es que pidió hoy.

   **Ensanche, no función nueva:** mismo criterio que
   `obtener_guarderias_disponibles`, otra forma de salida (agregado en vez de
   lista). Los predicados se leen del MISMO helper.

   **76(g): NO RIGE.** Lector, no escribe.
   **Reversa:** `docs/relevamientos/S107-A-REVERSA-resumen-filtro.sql`.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_resumen_guarderias(
  p_modalidad text, p_fecha date, p_mascota_id uuid,
  p_lat double precision DEFAULT NULL, p_lon double precision DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_especie   int;
  v_modalidad int;
  v_cobertura int;
  v_final     int;
  v_desde     numeric;
  v_causa     text;
  v_hay_geo   boolean := (p_lat IS NOT NULL AND p_lon IS NOT NULL);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_fecha IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE='22023';
  END IF;
  IF p_modalidad IS NULL OR p_modalidad NOT IN ('dia','paquete','mensual') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE='22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE='22023';
  END IF;
  -- La víspera REBOTA (ver la cabecera): no es una causa, es una precondición.
  IF p_fecha <= public.hoy_local() THEN
    RAISE EXCEPTION 'fecha_no_ofertable' USING ERRCODE='22023';
  END IF;

  -- ① sólo especie (el helper sin modalidad ya exige «vende algo»)
  SELECT count(*) INTO v_especie FROM _guarderia_ofertas_cobrables(p_mascota_id, NULL);

  -- ② + modalidad
  SELECT count(*) INTO v_modalidad FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad);

  -- ③ + cobertura (si no hay geo, esta etapa NO descarta: arrastra ②)
  IF v_hay_geo THEN
    SELECT count(*) INTO v_cobertura
      FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad) o
     WHERE EXISTS (
       SELECT 1 FROM prestadores geo
        WHERE geo.id = o.prestador_id
          AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
          AND geo.radio_cobertura_km IS NOT NULL
          AND 2 * 6371 * asin(sqrt(
                power(sin(radians((geo.lat - p_lat) / 2)), 2)
                + cos(radians(p_lat)) * cos(radians(geo.lat))
                  * power(sin(radians((geo.lon - p_lon) / 2)), 2)
              )) <= geo.radio_cobertura_km);
  ELSE
    v_cobertura := v_modalidad;
  END IF;

  /* ④ el conjunto REAL — y sale del lector publicado, no de una copia de sus
     predicados. *Si acá se reimplementaran, el resumen y la lista podrían
     discrepar, que es exactamente el defecto que este contrato viene a evitar.* */
  SELECT count(*), min(COALESCE(d.precio_modalidad, d.precio))
    INTO v_final, v_desde
    FROM public.obtener_guarderias_disponibles(p_fecha, p_mascota_id, p_lat, p_lon, p_modalidad) d;

  IF v_final > 0 THEN
    v_causa := NULL;
  ELSIF v_especie = 0 THEN
    v_causa := 'especie_sin_oferta';
  ELSIF v_modalidad = 0 THEN
    v_causa := 'nadie_vende_esa_modalidad';
  ELSIF v_hay_geo AND v_cobertura = 0 THEN
    v_causa := 'sin_cobertura';
  ELSIF v_cobertura > 0 THEN
    v_causa := 'sin_cupo_ese_dia';
  ELSE
    -- No debería alcanzarse. Se DECLARA en vez de elegir la más plausible.
    v_causa := 'causa_indeterminada';
  END IF;

  RETURN jsonb_build_object(
    'cuantos', v_final,
    /* `null`, jamás 0: **un 0 se lee como GRATIS**, y acá significa «no hay
       ninguno del que sacar un precio». */
    'precioDesde', v_desde,
    'causa', v_causa,
    'modalidad', p_modalidad,
    'fecha', p_fecha
  );
END $fn$;

REVOKE EXECUTE ON FUNCTION public.obtener_resumen_guarderias(text,date,uuid,double precision,double precision) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_resumen_guarderias(text,date,uuid,double precision,double precision) TO authenticated;

-- ══ CINTURÓN — el discriminador es LA CAUSA, no el conteo ════════════════
DO $cint$
DECLARE
  v_rol text := current_user;
  v_masc uuid; v_duenio uuid; v_prest uuid; v_fecha date := public.hoy_local() + 4;
  v_r jsonb; v_acl text;
BEGIN
  SELECT c.mascota_id, c.user_id INTO v_masc, v_duenio
    FROM evento_cita_servicio c JOIN mascotas m ON m.id = c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT prestador_id INTO v_prest FROM prestador_servicios WHERE tipo_servicio='guarderia_dia' LIMIT 1;
  IF v_masc IS NULL OR v_prest IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin mascota o prestador para el arnes';
  END IF;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_duenio, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    -- (a) camino feliz: hay lugares, hay precio, NO hay causa
    v_r := public.obtener_resumen_guarderias('dia', v_fecha, v_masc, NULL, NULL);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF (v_r->>'cuantos')::int < 1 THEN
      RAISE EXCEPTION 'CINTURON (a): no hay lugares con el mundo tal cual esta (%)', v_r;
    END IF;
    IF v_r->>'precioDesde' IS NULL THEN
      RAISE EXCEPTION 'CINTURON (a): hay lugares pero precioDesde vino nulo (%)', v_r;
    END IF;
    IF v_r->>'causa' IS NOT NULL THEN
      RAISE EXCEPTION 'CINTURON (a): hay lugares Y una causa — se contradicen (%)', v_r;
    END IF;

    /* (b) 🔴 EL DISCRIMINADOR: se apaga la modalidad mensual y la causa tiene
       que ser `nadie_vende_esa_modalidad` — **no un cero mudo, y no la del
       día**. Sin este brazo, el verde de (a) diria «funciona» sobre un lector
       que podria estar devolviendo siempre la misma causa. */
    UPDATE prestador_servicios SET precio_mensual_plan = NULL
     WHERE prestador_id = v_prest AND tipo_servicio='guarderia_dia';

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_duenio, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_r := public.obtener_resumen_guarderias('mensual', v_fecha, v_masc, NULL, NULL);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    IF (v_r->>'cuantos')::int <> 0 THEN
      RAISE EXCEPTION 'CINTURON (b): sin precio mensual igual devolvio lugares (%)', v_r;
    END IF;
    IF v_r->>'causa' IS DISTINCT FROM 'nadie_vende_esa_modalidad' THEN
      RAISE EXCEPTION 'CINTURON (b): LA CAUSA NO DISCRIMINA — esperaba nadie_vende_esa_modalidad y vino % (%)', v_r->>'causa', v_r;
    END IF;
    IF v_r->>'precioDesde' IS NOT NULL THEN
      RAISE EXCEPTION 'CINTURON (b): sin lugares pero con precio — un desde de nadie (%)', v_r;
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  SELECT array_to_string(proacl,' ') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_resumen_guarderias';
  IF v_acl ILIKE '%anon=%' THEN RAISE EXCEPTION 'CINTURON: anon con EXECUTE (%)', v_acl; END IF;
  IF v_acl NOT ILIKE '%authenticated=%' THEN RAISE EXCEPTION 'CINTURON: authenticated sin EXECUTE (%)', v_acl; END IF;

  RAISE NOTICE 'CINTURON VERDE · camino feliz con precio y sin causa · sin modalidad: cuantos=0, causa=nadie_vende_esa_modalidad, precioDesde=null · anon fuera';
END
$cint$;

COMMIT;
