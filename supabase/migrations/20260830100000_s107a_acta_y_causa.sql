/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · DOS DEFECTOS DE LA MISMA FAMILIA: algo que responde con la palabra
   equivocada. **Los dos medidos por otras pistas, los dos propios.**
   ═══════════════════════════════════════════════════════════════════════════

   ── 🔴 ① LAS DOS ACTAS DE UNA ESTADÍA DEVOLVÍAN LAS MISMAS FOTOS (medido por D)
   `obtener_acta_guarderia` traía la media con `estadia_id + mascota_id` **y
   nada más**: sin dirección y sin corte temporal.

   > ⇒ **la de RECOGIDA mostraba las fotos de la DEVOLUCIÓN, y al revés.**
   >
   > El acta tiene **un solo trabajo** —responder *cuándo* apareció una lesión—
   > y así **ninguna de las dos lo hacía**. *No es una foto de más: es el valor
   > probatorio entero, que era la razón de existir de la pieza.*

   **La cura no necesita columnas ni tabla puente**, como D señaló: los dos datos
   ya existen — **`gm.capturada_en`** y **`a.cerrada_en`**.
   · **recogida** → lo capturado hasta su cierre.
   · **devolución** → lo capturado **después del cierre de la recogida** y hasta
     el suyo. Sin acta de recogida, toma todo lo anterior a su propio cierre.

   ⚠️ **Una media SIN `capturada_en` no entra en ninguna de las dos.** Fail-closed
   a propósito: *una foto que no se puede ubicar en el tiempo, en un registro
   probatorio, es peor mostrada en el acta equivocada que no mostrada.*

   ── 🔴 ② «NO ABRE» SE REPORTABA COMO «SE LLENÓ» (medido por C) ───────────
   Aurora opera L-V; **el domingo devolvía `sin_cupo_ese_dia`** ⇒ la pantalla le
   decía a la familia que **se llenó** y la mandaba a probar otro día **en un
   lugar que nunca abre los domingos**.

   🔴 **Y la casa ya había firmado esa distinción un piso arriba:** el calendario
   de cupo tiene **`no_opera`** como estado propio, justamente porque *«no abre»
   no es «se llenó»* y **desde la pantalla los dos llegan como `disponible = 0`**.
   La cascada de causas perdía la diferencia que el calendario sí hacía.

   ⇒ **nace `no_opera_ese_dia`**, etapa propia entre la cobertura y el cupo,
   medida con `_guarderia_dia_operativo` — **el mismo helper que usa el lector**:
   no se reimplementa el calendario del lugar (`D-976`, de hace dos horas).

   ⚠️ **Su voz NO lleva «prueba con otro día» pegado**: en un lugar cerrado los
   domingos, otro domingo tampoco sirve. *La causa dice el hecho; qué ofrecer es
   de la pantalla, y con este dato ya puede ofrecer lo correcto.*

   **76(g): NO RIGE.** Lectores.
   **Reversa:** `S107-A-REVERSA-acta-y-causa.sql` — **correrla reinstala los dos**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_acta_guarderia(p_acta_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_mascota uuid; v_prest uuid; v_r jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT c.mascota_id, c.prestador_id INTO v_mascota, v_prest
    FROM guarderia_actas a
    JOIN guarderia_estadias e ON e.id = a.estadia_id
    JOIN evento_cita_servicio c ON c.id = e.cita_id
   WHERE a.id = p_acta_id;
  IF v_mascota IS NULL THEN RAISE EXCEPTION 'acta_no_existe' USING ERRCODE='22023'; END IF;

  /* Las DOS audiencias del acta: la familia del animal y quien gestiona el
     negocio que la levantó. Nadie más — ni con el id en la mano. */
  IF NOT user_tiene_acceso_a_mascota(v_mascota)
     AND NOT user_gestiona_prestador(v_prest)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  SELECT jsonb_build_object(
    'actaId',           a.id,
    'estadiaId',        a.estadia_id,
    'direccion',        a.direccion,
    'carnetVerificado', a.carnet_verificado,
    'objetos',          a.objetos,
    'observaciones',    a.observaciones,
    'conformidad',      a.conformidad,
    'conformidadEn',    a.conformidad_en,
    'reservaTexto',     a.reserva_texto,
    /* 🔴 LA HORA DE LA PUERTA, no la de llegada del dato: `cerrada_en` la pone
       el cliente al cerrar el acta en la casa; `recibida_en` es cuándo el
       servidor la recibió. **Son dos hechos distintos y se muestran los dos.** */
    'cerradaEn',        a.cerrada_en,
    'recibidaEn',       a.recibida_en,
    'mascotaNombre',    m.nombre,
    'prestadorNombre',  pr.nombre_comercial,
    'media', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'mediaId', gm.id, 'tipo', gm.tipo,
               'archivoUrl', gm.archivo_url, 'miniaturaUrl', gm.miniatura_url,
               'capturadaEn', gm.capturada_en)
             ORDER BY gm.capturada_en)
        FROM guarderia_media_etiquetas et
        JOIN guarderia_media gm ON gm.id = et.media_id
       WHERE et.estadia_id = a.estadia_id
         AND et.mascota_id = c.mascota_id
         /* 🔴 EL CORTE TEMPORAL — sin él las DOS actas devolvían LAS MISMAS
            fotos, y el acta perdía su único trabajo: decir CUÁNDO apareció
            algo. Sale de dos datos que ya existen: `gm.capturada_en` y
            `a.cerrada_en`. Ni columna nueva, ni tabla puente. */
         AND gm.capturada_en IS NOT NULL
         AND gm.capturada_en <= COALESCE(a.cerrada_en, now())
         AND (
           a.direccion = 'recogida'
           /* La de DEVOLUCIÓN empieza donde terminó la de recogida. Si no hay
              acta de recogida, toma todo lo anterior a su propio cierre. */
           OR gm.capturada_en > COALESCE(
                (SELECT ar2.cerrada_en FROM guarderia_actas ar2
                  WHERE ar2.estadia_id = a.estadia_id AND ar2.direccion = 'recogida'),
                '-infinity'::timestamptz)
         )
    ), '[]'::jsonb)
  ) INTO v_r
    FROM guarderia_actas a
    JOIN guarderia_estadias e   ON e.id = a.estadia_id
    JOIN evento_cita_servicio c ON c.id = e.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    JOIN prestadores pr         ON pr.id = c.prestador_id
   WHERE a.id = p_acta_id;

  RETURN v_r;
END $function$
;

CREATE OR REPLACE FUNCTION public.obtener_resumen_guarderias(p_modalidad text, p_fecha date, p_mascota_id uuid, p_lat double precision DEFAULT NULL::double precision, p_lon double precision DEFAULT NULL::double precision)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_especie   int;
  v_modalidad int;
  v_cobertura int;
  v_final     int;
  v_desde     numeric;
  v_causa     text;
  v_hay_geo   boolean := (p_lat IS NOT NULL AND p_lon IS NOT NULL);
  v_opera     int;
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
  SELECT count(*) INTO v_especie FROM _guarderia_ofertas_cobrables(p_mascota_id, NULL, NULL);

  -- ② + modalidad
  SELECT count(*) INTO v_modalidad FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad, NULL);

  -- ③ + cobertura (si no hay geo, esta etapa NO descarta: arrastra ②)
  IF v_hay_geo THEN
    SELECT count(*) INTO v_cobertura
      FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad, NULL) o
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

  /* ③bis ¿ALGUNO ABRE ESE DÍA? — etapa propia entre la cobertura y el cupo.
     Se mide con `_guarderia_dia_operativo`, el mismo helper que usa el lector:
     no se reimplementa el calendario del lugar. */
  SELECT count(*) INTO v_opera
    FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad, p_fecha) o
   WHERE public._guarderia_dia_operativo(o.prestador_id, p_fecha)
     AND (NOT v_hay_geo OR EXISTS (
       SELECT 1 FROM prestadores geo
        WHERE geo.id = o.prestador_id
          AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
          AND geo.radio_cobertura_km IS NOT NULL
          AND 2 * 6371 * asin(sqrt(
                power(sin(radians((geo.lat - p_lat) / 2)), 2)
                + cos(radians(p_lat)) * cos(radians(geo.lat))
                  * power(sin(radians((geo.lon - p_lon) / 2)), 2)
              )) <= geo.radio_cobertura_km));

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
  ELSIF v_opera = 0 THEN
    /* 🔴 «NO ABRE» NO ES «SE LLENÓ», y la casa ya firmó esa distinción un piso
       arriba: el calendario de cupo tiene `no_opera` como estado propio. Desde
       la pantalla los dos llegan como `disponible = 0` — la cascada los
       separaba mal y le decía a la familia que se llenó un domingo en el que
       el lugar **nunca abre**, mandándola a probar otro día del mismo lugar. */
    v_causa := 'no_opera_ese_dia';
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
END $function$
;

REVOKE EXECUTE ON FUNCTION public.obtener_acta_guarderia(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_acta_guarderia(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.obtener_resumen_guarderias(text,date,uuid,double precision,double precision) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_resumen_guarderias(text,date,uuid,double precision,double precision) TO authenticated;

DO $cint$
DECLARE
  v_rol text := current_user; v_masc uuid; v_duenio uuid; v_prest uuid;
  v_domingo date; v_lunes date; v_r jsonb;
BEGIN
  SELECT c.mascota_id, c.user_id INTO v_masc, v_duenio
    FROM evento_cita_servicio c JOIN mascotas m ON m.id = c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT prestador_id INTO v_prest FROM prestador_servicios WHERE tipo_servicio='guarderia_dia' LIMIT 1;

  SELECT min(d)::date INTO v_domingo FROM generate_series(public.hoy_local()+1, public.hoy_local()+9,'1 day') d
   WHERE EXTRACT(dow FROM d)::int = 0;
  SELECT min(d)::date INTO v_lunes FROM generate_series(public.hoy_local()+1, public.hoy_local()+9,'1 day') d
   WHERE EXTRACT(dow FROM d)::int = 1;

  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_duenio, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_r := public.obtener_resumen_guarderias('dia', v_domingo, v_masc, NULL, NULL);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  /* 🔴 EL DISCRIMINADOR DE ②: el domingo dice NO OPERA, no «se llenó». */
  IF v_r->>'causa' IS DISTINCT FROM 'no_opera_ese_dia' THEN
    RAISE EXCEPTION 'CINTURON (2): el domingo dice %, esperaba no_opera_ese_dia (%)', v_r->>'causa', v_r;
  END IF;

  /* Y EL OTRO BRAZO: el lunes SÍ opera ⇒ ninguna causa. Sin esto, un lector que
     devolviera siempre `no_opera_ese_dia` pasaría el brazo de arriba. */
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_duenio, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_r := public.obtener_resumen_guarderias('dia', v_lunes, v_masc, NULL, NULL);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  IF v_r->>'causa' IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON (2b): el lunes trajo causa % y el lugar SI opera (%)', v_r->>'causa', v_r;
  END IF;

  RAISE NOTICE 'CINTURON VERDE · domingo=no_opera_ese_dia · lunes sin causa · el corte del acta aplicado (su par se ejerce en el arnes de abajo)';
END
$cint$;

COMMIT;
