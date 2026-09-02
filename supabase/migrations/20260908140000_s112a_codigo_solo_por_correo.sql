/* ═══════════════════════════════════════════════════════════════════════════
   S112-A9b · EL CODIGO DE FIRMA VA SOLO POR CORREO
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.**

   🔴 DEFECTO MIO, EN LA MIGRACION ANTERIOR Y DEL MISMO DIA.
   `solicitar_codigo_firma` devolvia el codigo en su payload (`__codigo`) «para
   que el despachador lo mande». **Eso anula la firma entera**: cualquiera que
   llame la RPC con la sesion recibe el codigo y firma **sin pasar por el
   correo**, que es lo unico que el codigo existe para probar.

   *Un segundo factor que viaja por el mismo canal que el primero no es un
   segundo factor: es un paso mas.*

   ── Y NO ALCANZA CON QUE EL WRAPPER LO BORRE. Un wrapper protege a quien lo
      usa; la RPC es alcanzable por HTTP con la misma clave. La cura tiene que
      estar del lado del servidor.

   ── EL CODIGO SALE POR EL MOTOR DE INTENCIONES, y **se excluye de la
      campana**: si apareciera ahi, alguien con la sesion abierta lo leeria sin
      abrir el correo — el mismo defecto con otra ropa. La exclusion es por
      TIPO y vive en el lector, que es donde se puede ver.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.solicitar_codigo_firma(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_uid uuid := auth.uid(); v_acta jsonb; v_cod text; v_mail text; v_papel text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  v_acta := public.obtener_acta_adopcion(p_solicitud_id);
  v_papel := v_acta->>'mi_papel';
  IF v_papel IS NULL THEN RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501'; END IF;

  IF jsonb_array_length(v_acta->'faltantes') > 0 THEN
    RAISE EXCEPTION 'acta_incompleta: %',
      (SELECT string_agg(x::text, ', ') FROM jsonb_array_elements_text(v_acta->'faltantes') x)
      USING ERRCODE='22023';
  END IF;
  IF EXISTS (SELECT 1 FROM adopcion_firma WHERE solicitud_id=p_solicitud_id AND papel=v_papel) THEN
    RAISE EXCEPTION 'ya_firmaste' USING ERRCODE='22023';
  END IF;

  v_cod := lpad((floor(random()*100000000))::bigint::text, 8, '0');

  DELETE FROM adopcion_codigo_firma
   WHERE solicitud_id=p_solicitud_id AND user_id=v_uid AND usado_en IS NULL;
  INSERT INTO adopcion_codigo_firma (solicitud_id, user_id, version_acta, codigo_hash, expira_en)
  VALUES (p_solicitud_id, v_uid, (v_acta->>'version')::int,
          encode(sha256(convert_to(v_cod,'UTF8')),'hex'), now() + interval '10 minutes');

  SELECT email INTO v_mail FROM auth.users WHERE id = v_uid;

  /* El codigo sale por el motor de intenciones y **no vuelve por este canal**.
     Sin mascota: el postulante no es familia del adoptable antes de la entrega
     y el GATE 3 lo descartaria (medicion de D). */
  PERFORM public.registrar_intencion_notificacion(
    'codigo_firma_adopcion', v_uid, NULL, NULL,
    jsonb_build_object(
      'titulo',  'Tu código para firmar',
      'mensaje', 'Tu código es ' || v_cod || '. Vence en 10 minutos.',
      'solicitud_id', p_solicitud_id),
    'codigo_firma:' || p_solicitud_id || ':' || v_uid || ':' || extract(epoch from now())::bigint);

  /* 🔴 Devuelve A DONDE se mandó, jamas QUE se mandó. */
  RETURN jsonb_build_object('ok', true, 'enviado_a', v_mail,
                            'expira_en', now() + interval '10 minutes');
END $fn$;
REVOKE ALL ON FUNCTION public.solicitar_codigo_firma(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.solicitar_codigo_firma(uuid) TO authenticated;

/* ── LA CAMPANA NO MUESTRA EL CODIGO ─────────────────────────────────────── */
DO $cam$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_avisos';
  IF position('codigo_firma_adopcion' in v_def) > 0 THEN
    RAISE NOTICE 'CAMPANA: ya excluia el codigo'; RETURN;
  END IF;
  v_nueva := replace(v_def,
    'AND i.resuelto_como->>''despacho'' = ''para_transporte''',
    'AND i.resuelto_como->>''despacho'' = ''para_transporte''' || chr(10) ||
    '    /* 🔴 EL CODIGO DE FIRMA NO ENTRA A LA CAMPANA. Si apareciera, alguien' || chr(10) ||
    '       con la sesion abierta lo leeria sin abrir el correo — y el codigo' || chr(10) ||
    '       existe justamente para probar que controla ese correo. */' || chr(10) ||
    '    AND i.tipo <> ''codigo_firma_adopcion''');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'CAMPANA: no encontre el filtro de despacho — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $cam$;

DO $cint$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='solicitar_codigo_firma';
  -- ① 🔴 El codigo NO vuelve por la RPC.
  IF position('__codigo' in v_def) > 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la RPC sigue devolviendo el codigo';
  END IF;
  -- ①b CONTROL: el instrumento SI puede ver el payload de retorno.
  IF position('enviado_a' in v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: el censo no ve el retorno — mide otra cosa';
  END IF;
  -- ② La campana lo excluye.
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_avisos';
  IF position('codigo_firma_adopcion' in v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: la campana muestra el codigo';
  END IF;
  RAISE NOTICE 'CINTURON A9b: 2 brazos verdes (1 rojo producido, 1 control negativo)';
END $cint$;

COMMIT;
