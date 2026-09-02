/* ═══════════════════════════════════════════════════════════════════════════
   S112-A7 · EL FORMULARIO DE POSTULACION
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Dos columnas nullable sobre una tabla con pocas
   filas vivas, funciones nuevas. Cero backfill.

   ── EL ESQUEMA ES CERRADO Y REBOTA CON EL NOMBRE DE LA CLAVE ─────────────
      Y el motivo no es prolijidad: **§5.9 prohibe nombres y edades exactas de
      menores.** Si una clave desconocida se ignorara en silencio, la pantalla
      podria mandar `{"nombre_menor": "..."}`, la casa lo guardaria, y el
      formulario pasaria a contener **datos de un menor de edad que nadie
      autorizo a guardar**. *Ignorar en silencio lo que no se conoce es como
      entra un dato que la ley no deja tener.*

      Los menores se cuentan **por rango**, jamas por edad ni por nombre:
      `menores_0_5`, `menores_6_12`, `menores_13_17`.

   ── 🔴 Y LA MITAD QUE CASI SE PIERDE: LA PURGA DE 90 DIAS.
      El founder firmo *«a los 90 dias se borra el formulario Y la identidad»*.
      `purgar_postulaciones_vencidas` anula `solicitante_user_id` y
      `autor_user_id` — **y una columna NUEVA sobrevive**. El hogar declarado
      (cuantos adultos, cuantos menores) quedaria para siempre.

      **Es la advertencia de D en la otra direccion:** el aviso, cuando curo su
      purga, la vio por ESTADOS —«el dia que agregues `desistida`, la purga no
      falla: omite»—. Aca la misma clase entra por COLUMNAS. Y la cura es la
      misma: **no se enumera, se CLASIFICA.**

      `_columnas_solicitud_clasificadas()` lee las columnas VIVAS de la tabla y
      exige que cada una este en «se borra» o «se conserva». **Una columna sin
      clasificar hace SONAR la purga en vez de dejarla omitir en silencio.**
      *Enumerar se olvida; clasificar avisa.*

   ── N1 · EL TECHO. `uq_solicitud_viva` ya existia y cubre «una por animal»
      (medicion de D). Falta el techo de TRES en total **y sobre todo el guard
      tipado que EXPLICA**: un indice solo sabe negarse (`L-424`).
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

ALTER TABLE public.adopcion_solicitud
  ADD COLUMN IF NOT EXISTS respuestas    jsonb,
  ADD COLUMN IF NOT EXISTS aceptacion_id uuid REFERENCES public.consentimientos(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.adopcion_solicitud.respuestas IS
  'S112-A7. Esquema CERRADO validado por _respuestas_postulacion_validas. Los '
  'menores se cuentan por RANGO — nunca nombre ni edad exacta (§5.9). Se BORRA '
  'a los 90 dias junto con la identidad: esta clasificada en '
  '_columnas_solicitud_clasificadas y una columna sin clasificar hace sonar la purga.';

/* ── ① EL VALIDADOR ────────────────────────────────────────────────────────
   Devuelve NULL si esta bien, o **el nombre de lo que falla**: la puerta lo
   pone en el mensaje y la pantalla puede llevar al campo exacto. */
CREATE OR REPLACE FUNCTION public._respuestas_postulacion_validas(p jsonb)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_k text; v_h jsonb;
  v_raiz text[] := ARRAY['hogar','vivienda','otros_animales','horas_solo','experiencia','motivo'];
  v_hogar text[] := ARRAY['adultos','menores_0_5','menores_6_12','menores_13_17'];
BEGIN
  IF p IS NULL OR jsonb_typeof(p) <> 'object' THEN RETURN 'respuestas'; END IF;

  FOR v_k IN SELECT jsonb_object_keys(p) LOOP
    IF NOT (v_k = ANY(v_raiz)) THEN RETURN v_k; END IF;
  END LOOP;

  v_h := p->'hogar';
  IF v_h IS NULL OR jsonb_typeof(v_h) <> 'object' THEN RETURN 'hogar'; END IF;
  FOR v_k IN SELECT jsonb_object_keys(v_h) LOOP
    /* 🔴 Aca cae `nombre_menor`, `edad_menor` y cualquier cosa parecida. */
    IF NOT (v_k = ANY(v_hogar)) THEN RETURN 'hogar.' || v_k; END IF;
  END LOOP;
  FOREACH v_k IN ARRAY v_hogar LOOP
    IF jsonb_typeof(v_h->v_k) IS DISTINCT FROM 'number' THEN RETURN 'hogar.' || v_k; END IF;
    IF (v_h->>v_k)::numeric < 0 OR (v_h->>v_k)::numeric > 30 THEN RETURN 'hogar.' || v_k; END IF;
  END LOOP;
  IF (v_h->>'adultos')::numeric < 1 THEN RETURN 'hogar.adultos'; END IF;

  IF (p->>'vivienda') IS NULL
     OR (p->>'vivienda') NOT IN ('casa_con_patio','casa_sin_patio','departamento','otro')
  THEN RETURN 'vivienda'; END IF;

  IF jsonb_typeof(p->'horas_solo') IS DISTINCT FROM 'number'
     OR (p->>'horas_solo')::numeric < 0 OR (p->>'horas_solo')::numeric > 24
  THEN RETURN 'horas_solo'; END IF;

  IF (p->>'motivo') IS NULL OR btrim(p->>'motivo') = '' THEN RETURN 'motivo'; END IF;
  IF length(p->>'motivo') > 2000 THEN RETURN 'motivo'; END IF;
  IF length(coalesce(p->>'experiencia','')) > 2000 THEN RETURN 'experiencia'; END IF;
  IF length(coalesce(p->>'otros_animales','')) > 500 THEN RETURN 'otros_animales'; END IF;

  RETURN NULL;
END $fn$;

/* Y el CHECK, para que una fila mala sea inexpresable aunque alguien escriba
   por fuera de la puerta. *Un validador que solo vive en la funcion protege al
   que la usa, no a la tabla.* */
DO $$ BEGIN
  ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT chk_respuestas_esquema_cerrado
    CHECK (respuestas IS NULL OR public._respuestas_postulacion_validas(respuestas) IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

/* ── ② LA CLASIFICACION DE COLUMNAS (la cura de D, aplicada a columnas) ──── */
CREATE OR REPLACE FUNCTION public._columnas_solicitud_clasificadas()
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path TO 'public','pg_temp' AS $fn$
DECLARE
  v_borra text[] := ARRAY['solicitante_user_id','respuestas','aceptacion_id'];
  v_conserva text[] := ARRAY['id','publicacion_id','estado','creada_en','cerrada_en',
                             'aviso_silencio_emitido_en','country_code','anonimizada_en'];
  v_sin text[];
BEGIN
  SELECT COALESCE(array_agg(c.column_name::text), '{}')
    INTO v_sin
    FROM information_schema.columns c
   WHERE c.table_schema='public' AND c.table_name='adopcion_solicitud'
     AND NOT (c.column_name::text = ANY(v_borra))
     AND NOT (c.column_name::text = ANY(v_conserva));

  IF cardinality(v_sin) > 0 THEN
    /* 🔴 SUENA en vez de omitir. El founder firmo que a los 90 dias se borra el
       formulario Y la identidad: una columna que nadie clasifico puede ser
       cualquiera de las dos, y elegir por defecto es elegir mal la mitad de las
       veces. */
    RAISE EXCEPTION 'columnas_sin_clasificar: % — decidí si se borran o se conservan a los 90 dias',
      array_to_string(v_sin, ', ') USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('borra', to_jsonb(v_borra), 'conserva', to_jsonb(v_conserva));
END $fn$;

/* ── ③ LA PURGA APRENDE A BORRAR EL FORMULARIO ───────────────────────────── */
DO $pur$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='purgar_postulaciones_vencidas';
  IF v_def IS NULL THEN RAISE EXCEPTION 'PURGA: la funcion no existe'; END IF;

  IF position('respuestas' in v_def) > 0 THEN
    RAISE NOTICE 'PURGA: ya borraba el formulario'; RETURN;
  END IF;

  v_nueva := replace(v_def,
    'SET solicitante_user_id = NULL, anonimizada_en = now()',
    'SET solicitante_user_id = NULL, anonimizada_en = now(),' || chr(10) ||
    '           /* S112-A7 · el founder firmo «se borra el formulario Y la' || chr(10) ||
    '              identidad». Sin esta linea el hogar declarado quedaba para' || chr(10) ||
    '              siempre — y la omision no fallaba: pasaba en silencio. */' || chr(10) ||
    '           respuestas = NULL, aceptacion_id = NULL');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'PURGA: no encontre el UPDATE de anonimizacion — mirar el cuerpo antes de tocar';
  END IF;

  /* La clasificacion se llama ADENTRO de la purga: si alguien agrega una
     columna y no la clasifica, la purga SUENA en su corrida diaria. */
  v_nueva := replace(v_nueva,
    'RETURN jsonb_build_object(''ok'', true, ''anonimizadas'', v_n',
    'PERFORM public._columnas_solicitud_clasificadas();' || chr(10) ||
    '  RETURN jsonb_build_object(''ok'', true, ''anonimizadas'', v_n');
  EXECUTE v_nueva;
END $pur$;

/* ── ④ LA PUERTA ─────────────────────────────────────────────────────────── */
DROP FUNCTION IF EXISTS public.crear_solicitud_adopcion(uuid, text);
CREATE OR REPLACE FUNCTION public.crear_solicitud_adopcion(
  p_publicacion_id uuid,
  p_respuestas jsonb,
  p_aceptacion_id uuid DEFAULT NULL,
  p_mensaje_inicial text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_user uuid := auth.uid(); v_sol uuid; v_cc text; v_malo text; v_vivas int; v_acep uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT p.country_code INTO v_cc FROM adopcion_publicacion p
   WHERE p.id = p_publicacion_id AND p.estado = 'publicada';
  IF v_cc IS NULL THEN RAISE EXCEPTION 'publicacion_no_disponible' USING ERRCODE='22023'; END IF;

  /* La compuerta va ACA y no en la pantalla: una autorizacion que decide el
     cliente es decorativa. */
  IF NOT public.tengo_aceptado_documento('condiciones_adopcion') THEN
    RAISE EXCEPTION 'condiciones_no_aceptadas' USING ERRCODE='22023';
  END IF;

  v_malo := public._respuestas_postulacion_validas(p_respuestas);
  IF v_malo IS NOT NULL THEN
    /* Rebota **con el nombre**: la pantalla lleva al campo exacto. Y si el
       nombre no esta en el esquema, la persona ve que ese dato no se pide —
       que es exactamente lo que pasa con `hogar.nombre_menor`. */
    RAISE EXCEPTION 'respuesta_no_valida: %', v_malo USING ERRCODE='22023';
  END IF;

  /* 🔴 N1 · EL TECHO. El indice cubre «una por animal»; esto cubre el total
     **y lo EXPLICA**, que es la mitad que un indice no puede dar (`L-424`). */
  SELECT count(*) INTO v_vivas FROM adopcion_solicitud s
   WHERE s.solicitante_user_id = v_user AND s.estado IN ('recibida','en_conversacion');
  IF v_vivas >= 3 THEN
    RAISE EXCEPTION 'tope_de_solicitudes: %', v_vivas USING ERRCODE='22023';
  END IF;

  SELECT s.id INTO v_sol FROM adopcion_solicitud s
   WHERE s.publicacion_id = p_publicacion_id AND s.solicitante_user_id = v_user
     AND s.estado IN ('recibida','en_conversacion');
  IF v_sol IS NOT NULL THEN
    RAISE EXCEPTION 'solicitud_ya_viva: %', v_sol USING ERRCODE='22023';
  END IF;

  IF p_mensaje_inicial IS NOT NULL AND btrim(p_mensaje_inicial) = '' THEN
    RAISE EXCEPTION 'mensaje_vacio' USING ERRCODE='22023';
  END IF;

  /* La aceptacion se RESUELVE en el servidor, no se cree la que manda la
     pantalla: si viniera un id ajeno, la solicitud quedaria apuntando a la
     aceptacion de otra persona. Si la pantalla manda uno, se verifica. */
  SELECT c.id INTO v_acep FROM consentimientos c
   WHERE c.user_id = v_user AND c.tipo = 'condiciones_adopcion'
   ORDER BY c.created_at DESC LIMIT 1;
  IF p_aceptacion_id IS NOT NULL AND p_aceptacion_id IS DISTINCT FROM v_acep THEN
    RAISE EXCEPTION 'aceptacion_no_es_tuya' USING ERRCODE='42501';
  END IF;

  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code,
                                  respuestas, aceptacion_id)
       VALUES (p_publicacion_id, v_user, v_cc, p_respuestas, v_acep)
    RETURNING id INTO v_sol;

  IF p_mensaje_inicial IS NOT NULL THEN
    INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
         VALUES (v_sol, v_user, p_mensaje_inicial, false);
  END IF;

  RETURN jsonb_build_object('ok', true, 'solicitud_id', v_sol, 'estado', 'recibida',
                            'solicitudes_vivas', v_vivas + 1);
END $fn$;

REVOKE ALL ON FUNCTION public.crear_solicitud_adopcion(uuid,jsonb,uuid,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_adopcion(uuid,jsonb,uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public._columnas_solicitud_clasificadas() FROM anon, PUBLIC;

/* ═══ CINTURON ════════════════════════════════════════════════════════════ */
DO $cint$
DECLARE v_ok jsonb; v_r text;
BEGIN
  v_ok := '{"hogar":{"adultos":2,"menores_0_5":0,"menores_6_12":1,"menores_13_17":0},
            "vivienda":"casa_con_patio","otros_animales":"un gato",
            "horas_solo":6,"experiencia":"tuve perros de chica",
            "motivo":"Vi a Luna en la app y quiero darle un lugar."}'::jsonb;

  -- ① ✅ POSITIVO: el formulario completo pasa. Sin este brazo, los rojos de
  --    abajo pasarian con un validador que rechaza todo.
  IF public._respuestas_postulacion_validas(v_ok) IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: un formulario valido no pasa: %',
      public._respuestas_postulacion_validas(v_ok);
  END IF;

  -- ② 🔴 EL NOMBRE DE UN MENOR REBOTA, Y REBOTA NOMBRANDO LA CLAVE.
  v_r := public._respuestas_postulacion_validas(v_ok || '{"hogar":{"adultos":2,"menores_0_5":0,"menores_6_12":1,"menores_13_17":0,"nombre_menor":"Ana"}}'::jsonb);
  IF v_r IS DISTINCT FROM 'hogar.nombre_menor' THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: el nombre de un menor entro o rebotó sin nombrarse (%)', v_r;
  END IF;

  -- ③ 🔴 Una clave de raiz inventada rebota con su nombre.
  v_r := public._respuestas_postulacion_validas(v_ok || '{"ingreso_mensual":900}'::jsonb);
  IF v_r IS DISTINCT FROM 'ingreso_mensual' THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: una clave fuera del esquema entro (%)', v_r;
  END IF;

  -- ④ 🔴 Una vivienda inventada, un horas_solo imposible y un motivo vacio.
  IF public._respuestas_postulacion_validas(v_ok || '{"vivienda":"cueva"}'::jsonb) IS NULL
     OR public._respuestas_postulacion_validas(v_ok || '{"horas_solo":40}'::jsonb) IS NULL
     OR public._respuestas_postulacion_validas(v_ok || '{"motivo":"  "}'::jsonb) IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: un valor imposible paso';
  END IF;

  -- ⑤ 🔴 Un hogar sin ningun adulto no es un hogar.
  IF public._respuestas_postulacion_validas(
       '{"hogar":{"adultos":0,"menores_0_5":2,"menores_6_12":0,"menores_13_17":0},
         "vivienda":"departamento","horas_solo":4,"motivo":"x"}'::jsonb) IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤: un hogar de puros menores paso';
  END IF;

  -- ⑥ 🔴 EL CHECK de la tabla lo rebota tambien, no solo la funcion.
  BEGIN
    INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code, respuestas)
    SELECT p.id, p.publicada_por, 'EC', '{"lo_que_sea":1}'::jsonb
      FROM adopcion_publicacion p LIMIT 1;
    RAISE EXCEPTION 'CINTURON ROJO ⑥: se escribio una fila fuera del esquema por afuera de la puerta';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- ⑦ ✅ LA CLASIFICACION esta completa hoy...
  PERFORM public._columnas_solicitud_clasificadas();

  -- ⑧ 🔴 ...y SUENA con una columna sin clasificar. El rojo se produce de
  --    verdad: se agrega una columna y se saca en el mismo acto.
  BEGIN
    ALTER TABLE public.adopcion_solicitud ADD COLUMN __sonda_sin_clasificar text;
    BEGIN
      PERFORM public._columnas_solicitud_clasificadas();
      ALTER TABLE public.adopcion_solicitud DROP COLUMN __sonda_sin_clasificar;
      RAISE EXCEPTION 'CINTURON ROJO ⑧: una columna sin clasificar NO hizo sonar la purga';
    EXCEPTION WHEN SQLSTATE '22023' THEN
      ALTER TABLE public.adopcion_solicitud DROP COLUMN __sonda_sin_clasificar;
    END;
  END;

  -- ⑨ La purga aprendio a borrar el formulario.
  IF (SELECT position('respuestas = NULL' in pg_get_functiondef(p.oid))
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='purgar_postulaciones_vencidas') = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑨: la purga sigue sin borrar el formulario';
  END IF;

  RAISE NOTICE 'CINTURON A7: 9 brazos verdes (6 rojos producidos, 2 controles positivos)';
END $cint$;

COMMIT;
