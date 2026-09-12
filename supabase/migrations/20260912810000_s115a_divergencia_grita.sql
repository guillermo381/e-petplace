-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · `D-1083` · UN REBOTE QUE DEJA UN COMPROBANTE VIVO DEL OTRO LADO
--                     NO ES UN REBOTE: ES UNA DIVERGENCIA
--
-- 🔴 FIRMA DEL FOUNDER, 12-sep-2026: *«hoy emitió 2 de 4 y ninguna de las dos
--    condiciones se cumplió — el sistema se veía sano con dos facturas
--    huérfanas en el SRI»*. La tercera condición existe porque las dos
--    primeras miden **nuestro lado**: *procesé cero* y *emití cero*. Ninguna
--    puede ver que el proveedor hizo algo que nosotros no registramos.
--
-- 🔴 LA SEÑAL YA ESTABA Y NADIE LA MIRABA. El buzón anotó
--    `resultado='documento_no_encontrado'` **dos veces**, con firma verificada,
--    con la clave adentro. *Eso es el proveedor diciéndonos «autoricé algo que
--    vos no tenés», y quedó como una fila.* Firma del founder: **ese mensaje es
--    una alarma, no una fila.**
--
--    ⚠️ Y por eso no alcanza con contarlos: la alarma lleva **la clave**, que
--    es lo único con lo que alguien puede ir a preguntarle a Factuplan. Una
--    alarma que dice «hay 2» manda a buscar; una que dice cuáles, resuelve.
--
-- VEDA 76(g): NO RIGE — dos funciones, cero datos.
-- Reversa: `docs/relevamientos/S115-A-REVERSA-20260912810000-divergencia.sql`
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL LECTOR DE HUÉRFANOS — con la clave, que es lo accionable ───────────
CREATE OR REPLACE FUNCTION public.fiscal_webhooks_huerfanos(p_desde interval DEFAULT interval '7 days')
RETURNS TABLE (recibido_en timestamptz, evento text, clave_acceso text, delivery_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT e.recibido_en, e.evento,
         /* La clave viaja en el cuerpo crudo; se saca de ahí y no de una
            columna, porque **no hay fila del documento**: si la hubiera, el
            webhook no sería huérfano. */
         coalesce(e.cuerpo_crudo::jsonb->'data'->>'accessKey',
                  e.cuerpo_crudo::jsonb->>'accessKey'),
         e.delivery_id
    FROM public.fiscal_webhook_eventos e
   WHERE e.resultado = 'documento_no_encontrado'
     AND e.firma_verificada
     AND e.recibido_en > now() - p_desde
     AND (is_admin() OR auth.uid() IS NULL)
   ORDER BY e.recibido_en DESC;
$fn$;
REVOKE EXECUTE ON FUNCTION public.fiscal_webhooks_huerfanos(interval) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_webhooks_huerfanos(interval) TO authenticated;

-- ── ② LA TERCERA CONDICIÓN DEL GRITO ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_anotar_corrida_emision(
  p_disparo text, p_procesados int, p_emitidos int, p_rebotados int,
  p_por_motivo jsonb DEFAULT '{}'::jsonb, p_pendientes int DEFAULT 0)
RETURNS public.fiscal_emision_corridas
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v public.fiscal_emision_corridas; v_grito text; v_huerf int;
BEGIN
  /* 🔴 LA TERCERA VA PRIMERO, y el orden es la decisión: una divergencia con
     el SRI pesa más que «no emití nada». *Si la corrida emitió bien Y dejó un
     comprobante vivo del otro lado, el grito de la divergencia es el único que
     dice algo que nadie más va a notar* — las otras dos condiciones miden
     nuestro lado y ahí todo se ve sano. */
  SELECT count(*) INTO v_huerf FROM public.fiscal_webhook_eventos
   WHERE resultado='documento_no_encontrado' AND firma_verificada
     AND recibido_en > now() - interval '1 hour';

  IF v_huerf > 0 THEN
    v_grito := format('DIVERGENCIA: %s comprobante(s) autorizados por el proveedor '
                      'SIN fila nuestra en la última hora — '
                      'ver fiscal_webhooks_huerfanos()', v_huerf);
  ELSIF p_procesados = 0 AND p_pendientes > 0 THEN
    v_grito := format('no_proceso_nada_habiendo_%s_pendientes', p_pendientes);
  ELSIF p_procesados > 0 AND p_emitidos = 0 THEN
    v_grito := format('proceso_%s_y_no_emitio_ninguno: %s', p_procesados, p_por_motivo::text);
  END IF;

  INSERT INTO public.fiscal_emision_corridas
    (disparo, procesados, emitidos, rebotados, por_motivo, pendientes_al_cerrar, grito)
  VALUES (p_disparo, p_procesados, p_emitidos, p_rebotados,
          coalesce(p_por_motivo,'{}'::jsonb), p_pendientes, v_grito)
  RETURNING * INTO v;
  RETURN v;
END $fn$;
REVOKE EXECUTE ON FUNCTION public.fiscal_anotar_corrida_emision(text,int,int,int,jsonb,int) FROM PUBLIC, anon, authenticated;

-- ── ③ EL LECTOR DE SALUD LOS VE ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_salud_emision_automatica()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v jsonb; v_ultima public.fiscal_emision_corridas; v_cola int; v_encendido bool;
        v_gritos int; v_sin_correr interval; v_trabados jsonb; v_trabados_n int;
        v_huerf int;
BEGIN
  IF NOT (is_admin() OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'no_sos_admin' USING ERRCODE='42501';
  END IF;

  SELECT (valor='true') INTO v_encendido FROM app_config WHERE clave='fiscal_emision_automatica';
  SELECT * INTO v_ultima FROM fiscal_emision_corridas ORDER BY corrida_en DESC LIMIT 1;
  SELECT count(*) INTO v_cola FROM documentos_fiscales
   WHERE estado IN ('borrador','emitiendo') AND sentido='emitido';
  SELECT coalesce(jsonb_object_agg(estado,n),'{}'::jsonb), coalesce(sum(n),0)
    INTO v_trabados, v_trabados_n
    FROM (SELECT estado, count(*) n FROM documentos_fiscales
           WHERE sentido='emitido'
             AND estado IN ('pendiente_manual','esperando_receptor','no_autorizada')
           GROUP BY estado) t;
  SELECT count(*) INTO v_gritos FROM fiscal_emision_corridas
   WHERE grito IS NOT NULL AND corrida_en > now() - interval '24 hours';
  SELECT count(*) INTO v_huerf FROM fiscal_webhook_eventos
   WHERE resultado='documento_no_encontrado' AND firma_verificada;

  v_sin_correr := CASE WHEN v_ultima.corrida_en IS NULL THEN NULL
                       ELSE now() - v_ultima.corrida_en END;

  v := jsonb_build_object(
    'encendido', coalesce(v_encendido,false),
    'cola_del_reloj', v_cola,
    'trabados', v_trabados, 'trabados_total', v_trabados_n,
    'huerfanos_del_proveedor', v_huerf,
    'ultima_corrida', v_ultima.corrida_en, 'hace', v_sin_correr::text,
    'ultima', CASE WHEN v_ultima.id IS NULL THEN NULL ELSE jsonb_build_object(
        'disparo', v_ultima.disparo, 'procesados', v_ultima.procesados,
        'emitidos', v_ultima.emitidos, 'rebotados', v_ultima.rebotados,
        'por_motivo', v_ultima.por_motivo, 'grito', v_ultima.grito) END,
    'gritos_24h', v_gritos,
    /* 🔴 LA DIVERGENCIA PRESIDE EL VEREDICTO. Un comprobante autorizado que no
       está en nuestros libros no lo arregla el tiempo ni el reloj: lo arregla
       alguien preguntando. Mientras exista, el sistema NO está sano. */
    'veredicto',
      CASE
        WHEN v_huerf > 0
          THEN format('🔴 DIVERGENCIA · %s comprobante(s) del proveedor sin fila nuestra (D-1083)', v_huerf)
        WHEN v_trabados_n > 0 AND NOT coalesce(v_encendido,false)
          THEN format('apagado · %s trabado(s) esperando: %s', v_trabados_n, v_trabados::text)
        WHEN v_trabados_n > 0
          THEN format('%s trabado(s) que el reloj NO destraba: %s', v_trabados_n, v_trabados::text)
        WHEN NOT coalesce(v_encendido,false) AND v_cola > 0
          THEN format('apagado_con_%s_en_cola', v_cola)
        WHEN NOT coalesce(v_encendido,false) THEN 'apagado_y_sin_nada_esperando'
        WHEN v_ultima.id IS NULL THEN 'encendido_y_JAMAS_CORRIO'
        WHEN v_sin_correr > interval '20 minutes'
          THEN format('encendido_pero_no_corre_hace_%s', v_sin_correr::text)
        WHEN v_gritos > 0 THEN format('%s_corrida(s)_gritaron_en_24h', v_gritos)
        ELSE 'sano'
      END);
  RETURN v;
END $fn$;
REVOKE EXECUTE ON FUNCTION public.fiscal_salud_emision_automatica() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_salud_emision_automatica() TO authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE c public.fiscal_emision_corridas; v jsonb; n int;
BEGIN
  -- ① El caso REAL de hoy: 4 procesados, 2 emitidos — las dos condiciones
  --    viejas dicen "sana" y la tercera tiene que gritar.
  SELECT count(*) INTO n FROM fiscal_webhook_eventos
   WHERE resultado='documento_no_encontrado' AND firma_verificada
     AND recibido_en > now() - interval '1 hour';
  IF n = 0 THEN
    RAISE EXCEPTION 'cinturon: no hay huérfanos en la última hora — sin caso no se discrimina (L-437)';
  END IF;

  c := fiscal_anotar_corrida_emision('manual', 4, 2, 2, '{}'::jsonb, 0);
  IF c.grito IS NULL OR c.grito NOT LIKE 'DIVERGENCIA%' THEN
    RAISE EXCEPTION 'cinturon 🔴: una corrida que emitió bien CON huérfanos vivos no gritó divergencia: %',
      coalesce(c.grito,'(sin grito)');
  END IF;

  -- ② La alarma lleva la CLAVE, no sólo el conteo.
  SELECT count(*) INTO n FROM fiscal_webhooks_huerfanos()
   WHERE clave_acceso IS NOT NULL AND length(clave_acceso) = 49;
  IF n = 0 THEN
    RAISE EXCEPTION 'cinturon: el lector de huérfanos no entrega la clave — sin clave nadie puede ir a preguntar';
  END IF;

  -- ③ El veredicto de salud lo pone ARRIBA de todo.
  v := fiscal_salud_emision_automatica();
  IF v->>'veredicto' NOT LIKE '%DIVERGENCIA%' THEN
    RAISE EXCEPTION 'cinturon 🔴: hay % huérfanos y el veredicto dice «%»',
      v->>'huerfanos_del_proveedor', v->>'veredicto';
  END IF;

  DELETE FROM fiscal_emision_corridas WHERE disparo='manual';
  RAISE NOTICE 'cinturon OK · divergencia grita con corrida SANA (4/2) · la alarma lleva % clave(s) · veredicto=%',
    (SELECT count(*) FROM fiscal_webhooks_huerfanos()), (SELECT (fiscal_salud_emision_automatica())->>'veredicto');
END $cint$;
