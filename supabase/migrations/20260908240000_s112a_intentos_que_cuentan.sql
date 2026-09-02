/* ═══════════════════════════════════════════════════════════════════════════
   S112-A9e · LOS INTENTOS DEL OTP NO SE CONTABAN
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.**

   🔴 DEFECTO MIO, MEDIDO POR E DE TRES FORMAS INDEPENDIENTES:

     seis intentos con codigo falso → los SEIS dicen «quedan 4 intento(s)»
     la fila despues de los seis .... intentos = 0
     el literal ..................... UPDATE …SET intentos = intentos + 1;
                                      RAISE EXCEPTION 'codigo_incorrecto…';

   **El `UPDATE` y el `RAISE` viven en la misma transaccion ⇒ la excepcion
   revierte el incremento.** `intentos` queda en 0 para siempre, `4 - 0` da 4
   siempre, y el guard `IF v_c.intentos >= 5` **es inalcanzable**.

   ── LO QUE LO VUELVE INTERESANTE ES QUE LEER EL CODIGO NO LO MUESTRA. El
      `UPDATE` esta ahi, escrito, y parece correcto. **Solo aparece ejerciendolo
      seis veces y mirando la fila** — que es exactamente lo que E hizo. *Un
      contador que se incrementa dentro de la transaccion que va a abortar no
      cuenta: hace el gesto de contar.*

   ── LA CURA NO ES UNA TRANSACCION AUTONOMA. Postgres no las tiene, y llegar a
      una con `dblink` seria traer una dependencia entera para esquivar un
      diseño equivocado. **La cura es reconocer que un codigo errado NO ES UNA
      EXCEPCION: es un resultado esperado.** Devuelve `{ok:false, motivo}` y el
      `UPDATE` commitea, que es lo que un contador necesita.

      Es la misma forma que la casa ya usa en `ResultadoWrapper`: *lo que puede
      pasar en el uso normal se devuelve; lo que no deberia pasar se lanza.*
      Un codigo mal tecleado pasa todos los dias.

   ⚠️ CAMBIO DE CONTRATO, DECLARADO: `codigo_incorrecto` e `intentos_agotados`
      dejan de ser excepciones. Los demas rebotes —`sin_acceso`, `sin_codigo`,
      `codigo_vencido`, `ya_firmaste`, `acta_cambio_de_version`— **siguen
      lanzando**, porque ninguno necesita escribir nada.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.firmar_acta_adopcion(
  p_solicitud_id uuid, p_codigo text,
  p_cedula text DEFAULT NULL, p_domicilio text DEFAULT NULL, p_dispositivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE
  v_uid uuid := auth.uid(); v_c record; v_acta jsonb; v_papel text; v_folio text;
  v_ip text; v_hash_ip text; v_firmas int; v_tras jsonb; v_ev uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  IF p_cedula IS NOT NULL AND btrim(p_cedula) <> '' THEN
    UPDATE profiles SET cedula = btrim(p_cedula) WHERE id = v_uid;
  END IF;
  IF p_domicilio IS NOT NULL AND btrim(p_domicilio) <> '' THEN
    UPDATE profiles SET domicilio = btrim(p_domicilio) WHERE id = v_uid;
  END IF;

  v_acta := public.obtener_acta_adopcion(p_solicitud_id);
  v_papel := v_acta->>'mi_papel';
  IF v_papel IS NULL THEN RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501'; END IF;
  IF jsonb_array_length(v_acta->'faltantes') > 0 THEN
    RAISE EXCEPTION 'acta_incompleta: %',
      (SELECT string_agg(x::text, ', ') FROM jsonb_array_elements_text(v_acta->'faltantes') x)
      USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_c FROM adopcion_codigo_firma
   WHERE solicitud_id=p_solicitud_id AND user_id=v_uid AND usado_en IS NULL FOR UPDATE;
  IF v_c.id IS NULL THEN RAISE EXCEPTION 'sin_codigo' USING ERRCODE='22023'; END IF;
  IF v_c.expira_en <= now() THEN RAISE EXCEPTION 'codigo_vencido' USING ERRCODE='22023'; END IF;
  IF v_c.version_acta <> (v_acta->>'version')::int THEN
    RAISE EXCEPTION 'acta_cambio_de_version' USING ERRCODE='22023';
  END IF;

  /* ── 🔴 LOS DOS CASOS QUE **DEVUELVEN** EN VEZ DE LANZAR ─────────────────
     Son los unicos que necesitan que una escritura SOBREVIVA a la llamada. */
  IF v_c.intentos >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'intentos_agotados',
                              'intentos_restantes', 0);
  END IF;

  IF v_c.codigo_hash <> encode(sha256(convert_to(COALESCE(p_codigo,''),'UTF8')),'hex') THEN
    UPDATE adopcion_codigo_firma SET intentos = intentos + 1 WHERE id = v_c.id;
    /* Sin `RAISE`: el `UPDATE` de arriba tiene que COMMITEAR. Con excepcion,
       la transaccion lo revierte y el contador nunca avanza. */
    RETURN jsonb_build_object('ok', false, 'motivo', 'codigo_incorrecto',
                              'intentos_restantes', 5 - (v_c.intentos + 1));
  END IF;

  UPDATE adopcion_codigo_firma SET usado_en = now() WHERE id = v_c.id;

  v_ip := split_part(coalesce(
            (current_setting('request.headers', true)::json->>'x-forwarded-for'), ''), ',', 1);
  v_hash_ip := CASE WHEN btrim(v_ip) = '' THEN NULL
                    ELSE encode(sha256(convert_to(btrim(v_ip),'UTF8')),'hex') END;
  v_folio := 'F-' || to_char(now(),'YYYY') || '-' ||
             lpad(nextval('public.documento_folio_seq')::text, 6, '0');

  INSERT INTO adopcion_firma (solicitud_id, user_id, papel, version_acta, codigo_acta,
                              hash_renderizado, hash_fuente, folio, ip_hash, dispositivo)
  VALUES (p_solicitud_id, v_uid, v_papel, (v_acta->>'version')::int, v_acta->>'codigo',
          v_acta->>'hash_renderizado', v_acta->>'hash_fuente', v_folio, v_hash_ip, p_dispositivo);

  SELECT count(*) INTO v_firmas FROM adopcion_firma WHERE solicitud_id = p_solicitud_id;

  IF v_firmas >= 2 THEN
    SELECT public.traspasar_mascota_a_familia(
             (v_acta->>'mascota_id')::uuid,
             (SELECT fm.familia_id FROM familia_miembro fm
               WHERE fm.user_id = (v_acta->>'solicitante_user_id')::uuid
                 AND fm.hasta IS NULL LIMIT 1),
             (v_acta->>'version')::int, v_acta->>'codigo')
      INTO v_tras;

    INSERT INTO eventos_mascota (mascota_id, tipo_evento, fecha_evento, titulo, descripcion,
                                 procedencia, creado_por, metadata)
    VALUES ((v_acta->>'mascota_id')::uuid, 'hito_narrativo', now(),
            'Una vida nueva empieza',
            'La adopción quedó firmada por las dos partes.',
            'declarado_por_prestador', v_uid,
            jsonb_build_object('aniversario_anual', true, 'folio', v_folio,
                               'solicitud_id', p_solicitud_id))
    RETURNING id INTO v_ev;
  END IF;

  RETURN jsonb_build_object('ok', true, 'papel', v_papel, 'folio', v_folio,
    'firmas', v_firmas, 'completa', v_firmas >= 2,
    'traspaso', v_tras, 'hito_id', v_ev);
END $fn$;
REVOKE ALL ON FUNCTION public.firmar_acta_adopcion(uuid,text,text,text,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.firmar_acta_adopcion(uuid,text,text,text,text) TO authenticated;

/* ═══ CINTURON — SEIS INTENTOS DE VERDAD, Y LA FILA MIRADA DESPUES ════════
   El brazo que faltaba en A9: **ejercer el camino**. Leer el cuerpo no muestra
   este defecto; ejercerlo seis veces, si. */
DO $cint$
DECLARE
  v_sol uuid; v_uid uuid; v_pub uuid; v_i int; v_r jsonb; v_n int; v_restantes int[] := '{}';
BEGIN
  /* 🔴 EL ARNES SIEMBRA LA SUYA. La unica solicitud aceptada viva ya tiene la
     firma del adoptante, y firmar sobre ella dispararia el TRASPASO de un
     animal real desde una migracion que nadie autorizo a mover negocio
     (`L-406`). Ademas, apoyarse en un fixture ajeno haria que este cinturon
     fallara el dia que E limpie el suyo. */
  SELECT s.publicacion_id, s.solicitante_user_id INTO v_pub, v_uid
    FROM adopcion_solicitud s WHERE s.estado='aceptada' ORDER BY s.creada_en DESC LIMIT 1;
  IF v_pub IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay de donde sacar una publicacion y un adoptante — el brazo no puede dar verde por vacio';
  END IF;

  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code,
                                  estado, cerrada_en, respuestas)
  VALUES (v_pub, v_uid, 'EC', 'aceptada', now(),
          '{"hogar":{"adultos":1,"menores_0_5":0,"menores_6_12":0,"menores_13_17":0},
            "vivienda":"otro","horas_solo":0,"motivo":"sonda del cinturon A9e"}'::jsonb)
  RETURNING id INTO v_sol;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid::text, 'role','authenticated')::text, true);

  /* Codigo propio, sembrado a mano: no se llama a `solicitar_codigo_firma`
     porque eso emitiria un correo de verdad a una persona (`L-406`). */
  DELETE FROM adopcion_codigo_firma WHERE solicitud_id=v_sol AND user_id=v_uid;
  INSERT INTO adopcion_codigo_firma (solicitud_id, user_id, version_acta, codigo_hash, expira_en)
  SELECT v_sol, v_uid, (public.obtener_acta_adopcion(v_sol)->>'version')::int,
         encode(sha256(convert_to('99999999','UTF8')),'hex'), now() + interval '10 minutes';

  -- ① 🔴 SEIS INTENTOS CON CODIGO FALSO. El sexto tiene que decir AGOTADOS.
  FOR v_i IN 1..6 LOOP
    v_r := public.firmar_acta_adopcion(v_sol, '00000000');
    IF (v_r->>'ok')::boolean IS NOT FALSE THEN
      RAISE EXCEPTION 'CINTURON ROJO ①: el intento % con codigo falso paso', v_i;
    END IF;
    v_restantes := v_restantes || COALESCE((v_r->>'intentos_restantes')::int, -1);
    IF v_i = 6 AND v_r->>'motivo' <> 'intentos_agotados' THEN
      RAISE EXCEPTION 'CINTURON ROJO ①b: el SEXTO intento dijo «%» en vez de intentos_agotados — el techo es inalcanzable',
        v_r->>'motivo';
    END IF;
  END LOOP;

  -- ② 🔴 LA CUENTA REGRESIVA BAJA DE VERDAD. Es lo que E midio y no bajaba:
  --    los seis decian «quedan 4».
  IF v_restantes[1] <> 4 OR v_restantes[2] <> 3 OR v_restantes[5] <> 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: la cuenta regresiva no baja: %', v_restantes;
  END IF;

  -- ③ 🔴 Y LA FILA LO GUARDO. Sin este brazo, ② podria pasar con un contador
  --    calculado en memoria que igual se revierte.
  SELECT intentos INTO v_n FROM adopcion_codigo_firma
   WHERE solicitud_id=v_sol AND user_id=v_uid AND usado_en IS NULL;
  IF v_n <> 5 THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: la fila quedo en % intentos — el UPDATE se revirtio', v_n;
  END IF;

  -- ④ ✅ CONTROL POSITIVO (`L-482`): con el codigo CORRECTO y el contador
  --    limpio, FIRMA. Sin este brazo, los tres rojos de arriba serian los de
  --    una funcion que rechaza todo.
  --    🔴 Se corre SOLO si esta firma seria la PRIMERA: la segunda dispara el
  --    traspaso de un animal real, y un arnes no mueve negocio.
  UPDATE adopcion_codigo_firma SET intentos = 0
   WHERE solicitud_id=v_sol AND user_id=v_uid AND usado_en IS NULL;
  SELECT count(*) INTO v_n FROM adopcion_firma WHERE solicitud_id = v_sol;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'CINTURON: la solicitud sembrada ya tiene % firma(s) — imposible, algo esta mal', v_n;
  END IF;
  v_r := public.firmar_acta_adopcion(v_sol, '99999999');
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: el codigo CORRECTO no firmo: %', v_r;
  END IF;
  IF (v_r->>'folio') IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ④b: la firma no dejo folio';
  END IF;

  RAISE NOTICE 'CINTURON A9e: 4 brazos verdes · cuenta regresiva % · fila en 5 intentos',
    v_restantes;

  /* Residuo: la firma del control positivo se deshace. Es INMUTABLE por
     trigger, asi que el DELETE rebota — se deshabilita el trigger dentro de
     esta transaccion, que se cierra sola. */
  ALTER TABLE adopcion_firma DISABLE TRIGGER trg_adopcion_firma_inmutable;
  DELETE FROM adopcion_firma WHERE solicitud_id = v_sol;
  ALTER TABLE adopcion_firma ENABLE TRIGGER trg_adopcion_firma_inmutable;
  DELETE FROM adopcion_codigo_firma WHERE solicitud_id = v_sol;
  DELETE FROM adopcion_solicitud WHERE id = v_sol;
  SELECT count(*) INTO v_n FROM adopcion_firma WHERE solicitud_id = v_sol;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % firma(s)', v_n; END IF;
  SELECT count(*) INTO v_n FROM adopcion_solicitud WHERE id = v_sol;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo, la solicitud sembrada quedo'; END IF;
END $cint$;

COMMIT;
