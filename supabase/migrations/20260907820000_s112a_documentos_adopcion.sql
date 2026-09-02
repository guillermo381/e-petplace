-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · 20260907820000 · LOS DOCUMENTOS DE ADOPCIÓN GANAN SU PUERTA: lector,
-- aceptación con registro probatorio, y la compuerta que la exige.
-- Adenda 10 punto 3. Entrega para C.
--
-- ROJO MEDIDO ANTES DE ESCRIBIR ESTO (contra la base, 2-sep-2026):
--   · `consentimientos.tipo` es un CHECK cerrado de SIETE
--     (registro · terminos_parent · terminos_professional · privacidad ·
--      arbitraje · dictado_voz · teleconsulta) **sin ningún valor de adopción**
--     ⇒ la aceptación del formulario era INEXPRESABLE, no «no implementada».
--   · `crear_solicitud_adopcion(uuid, text)` **no miraba consentimiento**: 0.
--
-- 🔴 SE REUSA EL LEDGER DE LA CASA, NO SE CREA UNO PARALELO. `consentimientos`
-- ya tiene usuario, tipo, versión, sello (`created_at`), IP (`ip_hash`) y
-- metadata — seis de las siete cosas que la adenda 2 pide. Falta una sola: el
-- **hash del documento**, y entra como columna propia y no en `metadata`,
-- porque es la pieza probatoria y un dato probatorio enterrado en un jsonb no
-- se puede exigir con un constraint.
--
-- 🔴 **EL HASH LO PONE EL SERVIDOR, JAMÁS EL CLIENTE.** Si la app lo mandara,
-- la evidencia diría lo que el cliente quiso decir. Se lee de la fila del
-- documento en el mismo acto.
--
-- 76(g): **NO RIGE** — cero backfill. La columna nace vacía y el CHECK se
-- ENSANCHA (ningún valor existente deja de ser válido: medido, los 5 tipos en
-- uso siguen adentro).
--
-- REVERSA ESCRITA ANTES:
--   docs/relevamientos/S112-A-REVERSA-20260907820000-documentos-adopcion.sql
--   ⚠️ y declara que NO se puede correr si ya hay una aceptación registrada.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.consentimientos ADD COLUMN IF NOT EXISTS documento_sha256 text;

COMMENT ON COLUMN public.consentimientos.documento_sha256 IS
  'S112-A · el hash del texto que la persona aceptó, leido de adopcion_documentos por el servidor. Jamas viene del cliente.';

/* ⚠️ EL NOMBRE SE MIDIÓ, NO SE ADIVINÓ — y la primera corrida lo cobró.
   Escribí `consentimientos_tipo_check` (el nombre que Postgres habría puesto
   solo) y el real es `chk_consentimiento_tipo`. **`DROP ... IF EXISTS` con un
   nombre equivocado no falla: calla** — así que el viejo siguió mordiendo
   mientras yo agregaba uno nuevo más ancho, y el INSERT rebotó contra un
   constraint que creía haber retirado.
   *`IF EXISTS` convierte una suposición equivocada en silencio.* */
ALTER TABLE public.consentimientos DROP CONSTRAINT IF EXISTS chk_consentimiento_tipo;
ALTER TABLE public.consentimientos ADD CONSTRAINT chk_consentimiento_tipo
  CHECK (tipo = ANY (ARRAY[
    'registro','terminos_parent','terminos_professional','privacidad',
    'arbitraje','dictado_voz','teleconsulta',
    -- S112-A · los dos de adopción. El acta NO entra acá: es FIRMA, no aceptación.
    'terminos_refugio','condiciones_adopcion']));

-- ═══ ① EL LECTOR ══════════════════════════════════════════════════════════
-- Devuelve **la versión junto con el cuerpo**, y eso no es comodidad: es para
-- que la app nunca ELIJA una versión. Versión y texto son el mismo dato y
-- viajan juntos (`L-166`, precedente de `URL_LEGAL`/`VERSION_LEGAL` de S104).
CREATE OR REPLACE FUNCTION public.obtener_documento_vigente(p_codigo text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v jsonb;
BEGIN
  SELECT jsonb_build_object(
           'codigo', d.codigo, 'version', d.version, 'contenido', d.contenido,
           'sha256', d.sha256, 'es_plantilla', d.es_plantilla,
           'vigente_desde', d.vigente_desde)
    INTO v
    FROM adopcion_documentos d
   WHERE d.codigo = p_codigo AND d.vigente
   ORDER BY d.version DESC LIMIT 1;

  /* Fail-closed CON VOZ: nombra el documento que falta. Un rebote mudo acá
     manda a la pantalla a mostrar una hoja en blanco. */
  IF v IS NULL THEN
    RAISE EXCEPTION 'documento_no_disponible: %', p_codigo USING ERRCODE='22023';
  END IF;
  RETURN v;
END $fn$;

-- ═══ ② ¿YA LO ACEPTÓ? — el lector que usa la compuerta y también la pantalla
CREATE OR REPLACE FUNCTION public.tengo_aceptado_documento(p_codigo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
  /* Exige que lo aceptado sea la version VIGENTE: aceptar la v1 no vale cuando
     rige la v2. Es la misma ley que la compuerta del acta aprendio hoy —
     existencia no es vigencia. */
  SELECT EXISTS (
    SELECT 1 FROM consentimientos c
      JOIN adopcion_documentos d
        ON d.codigo = c.tipo AND d.version::text = c.version AND d.vigente
     WHERE c.user_id = auth.uid() AND c.tipo = p_codigo AND c.aceptado IS TRUE);
$fn$;

-- ═══ ③ ACEPTAR ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.aceptar_documento_adopcion(
  p_codigo text, p_ip_hash text DEFAULT NULL, p_dispositivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_u uuid := auth.uid(); v_d record; v_id uuid;
BEGIN
  IF v_u IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_codigo NOT IN ('terminos_refugio','condiciones_adopcion') THEN
    RAISE EXCEPTION 'documento_no_aceptable: %', p_codigo USING ERRCODE='22023';
  END IF;

  /* La VERSION no es parametro a proposito: si la mandara el cliente, podria
     aceptar una version que ya no rige y la evidencia diria otra cosa. */
  SELECT d.codigo, d.version, d.sha256 INTO v_d
    FROM adopcion_documentos d
   WHERE d.codigo = p_codigo AND d.vigente ORDER BY d.version DESC LIMIT 1;
  IF v_d.codigo IS NULL THEN
    RAISE EXCEPTION 'documento_no_disponible: %', p_codigo USING ERRCODE='22023';
  END IF;

  /* Idempotente: dos toques del mismo boton no son dos consentimientos. */
  SELECT c.id INTO v_id FROM consentimientos c
   WHERE c.user_id = v_u AND c.tipo = v_d.codigo AND c.version = v_d.version::text
     AND c.aceptado IS TRUE LIMIT 1;
  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'consentimiento_id', v_id,
                              'codigo', v_d.codigo, 'version', v_d.version);
  END IF;

  INSERT INTO consentimientos (user_id, tipo, aceptado, ip_hash, version,
                               documento_sha256, metadata)
       VALUES (v_u, v_d.codigo, true, p_ip_hash, v_d.version::text,
               v_d.sha256,
               jsonb_build_object('dispositivo', p_dispositivo, 'origen', 'adopcion'))
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'ya_estaba', false, 'consentimiento_id', v_id,
                            'codigo', v_d.codigo, 'version', v_d.version,
                            'sha256', v_d.sha256);
END $fn$;

REVOKE ALL ON FUNCTION public.obtener_documento_vigente(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tengo_aceptado_documento(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.aceptar_documento_adopcion(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_documento_vigente(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tengo_aceptado_documento(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aceptar_documento_adopcion(text,text,text) TO authenticated;

-- ═══ ④ LA COMPUERTA EN LA PUERTA DE POSTULAR ═════════════════════════════
CREATE OR REPLACE FUNCTION public.crear_solicitud_adopcion(p_publicacion_id uuid, p_mensaje_inicial text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_user uuid := auth.uid(); v_sol uuid; v_cc text; v_estado text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT p.country_code INTO v_cc FROM adopcion_publicacion p
   WHERE p.id = p_publicacion_id AND p.estado = 'publicada';
  IF v_cc IS NULL THEN RAISE EXCEPTION 'publicacion_no_disponible' USING ERRCODE='22023'; END IF;


  /* ═══ S112-A · LA COMPUERTA DEL CONSENTIMIENTO ═════════════════════════════
     `P23` promete poder demostrar qué aceptó cada quien. Postular sin haber
     aceptado las condiciones dejaba esa promesa sin evidencia — y no por
     descuido: **el vocabulario de `consentimientos.tipo` era un CHECK cerrado
     de SIETE sin ningún valor de adopción**, así que la aceptación no estaba
     «sin implementar»: la base la rechazaba. *Un consentimiento inexpresable no
     se olvida de registrar: no se puede registrar.*

     La compuerta va ACÁ y no en la pantalla porque una autorización que decide
     el cliente es decorativa. */
  IF NOT public.tengo_aceptado_documento('condiciones_adopcion') THEN
    RAISE EXCEPTION 'condiciones_no_aceptadas' USING ERRCODE='22023';
  END IF;

  IF p_mensaje_inicial IS NOT NULL AND btrim(p_mensaje_inicial) = '' THEN
    RAISE EXCEPTION 'mensaje_vacio' USING ERRCODE='22023';
  END IF;

  /* 🔴 `L-424` PUESTA ANTES DE QUE SE COBRE: el índice sólo sabe negarse, y sin
     esto la persona recibe un `23505` crudo sobre algo que YA TIENE. El id
     viaja en el mensaje para poder LLEVARLA ahí. */
  SELECT s.id, s.estado INTO v_sol, v_estado FROM adopcion_solicitud s
   WHERE s.publicacion_id = p_publicacion_id AND s.solicitante_user_id = v_user
     AND s.estado IN ('recibida','en_conversacion');
  IF v_sol IS NOT NULL THEN
    RAISE EXCEPTION 'solicitud_ya_viva: %', v_sol USING ERRCODE='22023';
  END IF;

  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code)
       VALUES (p_publicacion_id, v_user, v_cc) RETURNING id INTO v_sol;

  IF p_mensaje_inicial IS NOT NULL THEN
    INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
         VALUES (v_sol, v_user, p_mensaje_inicial, false);
  END IF;

  /* ⚠️ LA RESPUESTA AUTOMÁTICA DEL PUBLICADOR NO SE INSERTA: su configuración
     no existe todavía (ver cabecera). La columna `automatica` queda esperando
     su productor. *No se le inventa un casillero a un texto que ninguna letra
     ubicó.* */
  RETURN jsonb_build_object('ok', true, 'solicitud_id', v_sol, 'estado', 'recibida');
END $function$
;

-- ═══ CINTURÓN · con su rojo y su contra-caso ═════════════════════════════
DO $cinturon$
DECLARE v_u uuid; v_r jsonb; v_err text; v_n int;
BEGIN
  SELECT u.id INTO v_u FROM auth.users u
   WHERE u.email = 'guillo381+alta0901@gmail.com' LIMIT 1;
  IF v_u IS NULL THEN SELECT id INTO v_u FROM auth.users LIMIT 1; END IF;
  PERFORM set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', v_u), true);

  /* ⓪ EXACTAMENTE UN check de tipo. Sin esto, dos constraints conviven y el
     mas viejo gana en silencio — que es como fallo la primera corrida. */
  SELECT count(*) INTO v_n FROM pg_constraint
   WHERE conrelid='public.consentimientos'::regclass AND contype='c'
     AND pg_get_constraintdef(oid) LIKE '%condiciones_adopcion%';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURON: hay % checks de tipo con el vocabulario nuevo (esperado 1)', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM pg_constraint
   WHERE conrelid='public.consentimientos'::regclass AND contype='c'
     AND pg_get_constraintdef(oid) LIKE '%dictado_voz%'
     AND pg_get_constraintdef(oid) NOT LIKE '%condiciones_adopcion%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: sobrevivio un check viejo del vocabulario (%)', v_n;
  END IF;

  -- ① el lector devuelve version JUNTO con el cuerpo
  v_r := public.obtener_documento_vigente('condiciones_adopcion');
  IF (v_r->>'version') IS NULL OR length(v_r->>'contenido') < 100 THEN
    RAISE EXCEPTION 'CINTURON: el lector no devuelve version+cuerpo';
  END IF;
  IF (v_r->>'sha256') <> encode(sha256(convert_to(v_r->>'contenido','UTF8')),'hex') THEN
    RAISE EXCEPTION 'CINTURON: el sha del lector no corresponde a su texto';
  END IF;

  -- ② el lector NO devuelve la version jubilada
  IF (v_r->>'version')::int <> 2 THEN
    RAISE EXCEPTION 'CINTURON: devolvio la version % y la vigente es la 2', v_r->>'version';
  END IF;

  -- ③ ROJO: sin aceptacion, postular rebota CON VOZ
  IF public.tengo_aceptado_documento('condiciones_adopcion') THEN
    RAISE EXCEPTION 'CINTURON: el sujeto de prueba ya acepto -> el rojo no se puede producir';
  END IF;

  -- ④ aceptar, y que quede la evidencia COMPLETA
  v_r := public.aceptar_documento_adopcion('condiciones_adopcion','hash-ip-test','test-device');
  IF NOT (v_r->>'ok')::boolean OR (v_r->>'ya_estaba')::boolean THEN
    RAISE EXCEPTION 'CINTURON: la aceptacion no ocurrio';
  END IF;
  SELECT count(*) INTO v_n FROM consentimientos c
   WHERE c.id = (v_r->>'consentimiento_id')::uuid
     AND c.documento_sha256 IS NOT NULL AND c.ip_hash = 'hash-ip-test'
     AND c.version IS NOT NULL AND c.created_at IS NOT NULL
     AND c.metadata->>'dispositivo' = 'test-device';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: la evidencia quedo incompleta'; END IF;

  -- ⑤ VERDE: ahora si lo tiene aceptado
  IF NOT public.tengo_aceptado_documento('condiciones_adopcion') THEN
    RAISE EXCEPTION 'CINTURON: acepto y el lector dice que no';
  END IF;

  -- ⑥ IDEMPOTENTE: dos toques no son dos consentimientos
  v_r := public.aceptar_documento_adopcion('condiciones_adopcion');
  IF NOT (v_r->>'ya_estaba')::boolean THEN
    RAISE EXCEPTION 'CINTURON: el segundo toque creo otro consentimiento';
  END IF;

  -- ⑦ el codigo que no es aceptable rebota nombrandolo
  BEGIN
    PERFORM public.aceptar_documento_adopcion('acta_adopcion');
    RAISE EXCEPTION 'CINTURON: dejo ACEPTAR el acta, que es FIRMA y no aceptacion';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE '%documento_no_aceptable%' THEN
      RAISE EXCEPTION 'CINTURON: el acta rebota por otra cosa (%)', v_err;
    END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE: lector con version+sha, aceptacion con evidencia completa, idempotente, y el acta NO se acepta';
  /* Se deshace: el cinturon escribio un consentimiento de prueba. */
  DELETE FROM consentimientos WHERE id = (v_r->>'consentimiento_id')::uuid;
  DELETE FROM consentimientos WHERE user_id = v_u AND tipo = 'condiciones_adopcion';
END $cinturon$;

DO $sonda$
BEGIN
  IF has_function_privilege('anon','public.aceptar_documento_adopcion(text,text,text)','EXECUTE')
  OR has_function_privilege('anon','public.obtener_documento_vigente(text)','EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon alcanza las funciones nuevas';
  END IF;
END $sonda$;
