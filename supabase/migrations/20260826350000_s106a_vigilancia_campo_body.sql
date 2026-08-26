-- ============================================================================
-- S106-A tanda 2 · EL CAMPO SE LLAMA `body`, NO `content`
--
-- 🔴 Relevé el tipo DESPUÉS de que reventara, no antes: `net.http_response`
--    tiene **`status_code`, `headers`, `body`**. Escribí `.content` de memoria.
--    Es la cuarta vez en la tanda que un nombre adivinado cuesta una corrida
--    (regla 22 / `L-057`), y la cuarta vez que lo caza ejercer y no leer.
--
-- ✅ **Y LA CORRIDA TRAJO LA BUENA NOTICIA QUE IMPORTA:** la petición `63796`
--    volvió **`HTTP 200` con `{"ok":true,…}`** ⇒ **el header
--    `x-despacho-secret` y el secreto `despacho_secret` del vault SON los que
--    el guard de D espera.** *Eso era lo que la mesa mandó verificar, y quedó
--    verificado por la respuesta y no por el ledger de jobs.*
--
-- ── VEDA 76(g): NO RIGE. Reemplaza una función. ────────────────────────────
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-vigilancia-campo-body.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.vigilar_consumo_video()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp', 'net', 'vault'
AS $$
DECLARE
  k_destinatario constant uuid := '75d0798a-ea90-4a97-a2f2-74f3234d892a';
  k_url          constant text := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/video-consumo';

  v_previo   bigint;
  v_resp     record;
  v_cuerpo   jsonb;
  v_secreto  text;
  v_req      bigint;
  v_mes      text := to_char(now() AT TIME ZONE 'America/Guayaquil', 'YYYY-MM');
  v_gb       numeric;
  v_supera   boolean;
  v_estado   text := 'sin_pedido_previo';
BEGIN
  ---------------------------------------------------------------------------
  -- ① COBRAR LO DE LA CORRIDA ANTERIOR
  ---------------------------------------------------------------------------
  SELECT request_id INTO v_previo FROM public.vigilancia_consumo_pedido WHERE unica;

  IF v_previo IS NOT NULL THEN
    BEGIN
      SELECT * INTO v_resp FROM net._http_collect_response(v_previo, true);
      v_estado := coalesce(v_resp.status::text, 'sin_estado');
      IF v_resp.status = 'SUCCESS' THEN
        v_cuerpo := (v_resp.response).body::jsonb;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_cuerpo := NULL; v_estado := 'no_se_pudo_cobrar';
    END;

    v_gb     := (v_cuerpo ->> 'gb_estimados')::numeric;
    v_supera := (v_cuerpo ->> 'supera_umbral')::boolean;

    -- ①a · NO SE PUDO MEDIR ⇒ SE AVISA. Nunca silencio.
    IF v_cuerpo IS NULL OR (v_cuerpo ->> 'ok') IS DISTINCT FROM 'true' OR v_gb IS NULL THEN
      PERFORM public.registrar_intencion_notificacion(
        'sistema', k_destinatario, NULL, NULL,
        jsonb_build_object(
          'asunto', 'La vigilancia del consumo de video no pudo medir',
          'detalle', 'El silencio de esta vigilancia NO significa que el consumo esté bajo: '
                  || 'significa que no se midió. Revisar el guard de video-consumo y el secreto.',
          'mes', v_mes,
          'estado_del_pedido', v_estado,
          'http_status', coalesce(((v_resp.response).status_code)::text, '(sin status)'),
          'respuesta_cruda', left(coalesce((v_resp.response).body, v_resp.message, '(vacío)'), 300)
        ),
        'consumo_video_sin_medicion_' || v_mes
      );

    -- ①b · MIDIÓ y cruzó el umbral ⇒ avisa UNA vez en el mes.
    ELSIF v_supera THEN
      PERFORM public.registrar_intencion_notificacion(
        'sistema', k_destinatario, NULL, NULL,
        jsonb_build_object(
          'asunto', 'El consumo de video cruzó los 30 GB del mes',
          'gb_estimados', v_gb,
          'umbral_gb', v_cuerpo ->> 'umbral_gb',
          'mes', v_mes,
          -- ⚠️ Un día de latencia, DICHO: este número es de la corrida anterior.
          'medido_en', to_char((SELECT pedido_en FROM public.vigilancia_consumo_pedido WHERE unica),
                               'YYYY-MM-DD HH24:MI'),
          'advertencia', v_cuerpo ->> 'advertencia',
          'que_hacer', v_cuerpo -> 'que_hacer_si_supera'
        ),
        'consumo_video_umbral_' || v_mes
      );
    END IF;
  END IF;

  ---------------------------------------------------------------------------
  -- ② PEDIR PARA LA PRÓXIMA
  --
  --    🔴 El header y el secreto son **el molde de la casa, verificado contra
  --    el literal de D**: header `x-despacho-secret`, secreto `despacho_secret`
  --    del vault. *Mandar otro nombre daría 401 en cada corrida y el ledger de
  --    jobs lo mostraría como «anda».*
  ---------------------------------------------------------------------------
  SELECT decrypted_secret INTO v_secreto
  FROM vault.decrypted_secrets WHERE name = 'despacho_secret';

  IF v_secreto IS NULL THEN
    RAISE EXCEPTION 'no_hay_despacho_secret_en_vault';
  END IF;

  SELECT net.http_post(
    url     := k_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-despacho-secret', v_secreto),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) INTO v_req;

  INSERT INTO public.vigilancia_consumo_pedido (unica, request_id, pedido_en)
  VALUES (true, v_req, now())
  ON CONFLICT (unica) DO UPDATE SET request_id = EXCLUDED.request_id, pedido_en = EXCLUDED.pedido_en;

  RETURN jsonb_build_object(
    'ok', true,
    'cobro_previo', v_estado,
    'gb_estimados', v_gb,
    'supera_umbral', v_supera,
    'pedido_nuevo', v_req,
    'mes', v_mes
  );
END;
$$;

COMMENT ON FUNCTION public.vigilar_consumo_video() IS
  'S106 · Vigilancia del consumo de video EN DOS TIEMPOS: cobra lo de la corrida anterior '
  '(pg_net no despacha hasta el COMMIT) y pide para la proxima. Avisa tambien si NO pudo medir.';

REVOKE EXECUTE ON FUNCTION public.vigilar_consumo_video() FROM PUBLIC, anon, authenticated;

DO $cinturon$
DECLARE v_n integer;
BEGIN
  IF has_function_privilege('anon', 'public.vigilar_consumo_video()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.vigilar_consumo_video()', 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: la vigilancia quedo alcanzable desde una app';
  END IF;
  SELECT count(*) INTO v_n FROM cron.job WHERE jobname = 'vigilar-consumo-video';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: el job no esta agendado (% filas)', v_n; END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'despacho_secret') THEN
    RAISE EXCEPTION 'cinturon: no hay despacho_secret en el vault';
  END IF;
  -- La puerta canónica tiene que existir: si no, el aviso no nace.
  IF to_regprocedure('public.registrar_intencion_notificacion(text,uuid,uuid,uuid,jsonb,text)') IS NULL THEN
    RAISE EXCEPTION 'cinturon: falta la puerta registrar_intencion_notificacion';
  END IF;
  RAISE NOTICE 'cinturon vigilancia v5 (campo body): OK';
END;
$cinturon$;
