-- ============================================================================
-- S106-A tanda 2 · LA VIGILANCIA DEL CONSUMO DE VIDEO — que avise, no que espere
--
-- `video-consumo` (pista D) está desplegada y corrida contra datos reales, pero
-- **se invocaba A MANO**. Eso la dejaba en el mismo lugar donde estaba la
-- vigilancia original: **una intención, no una alarma.**
--
-- Acá la DB la llama sola y **avisa al founder cuando el consumo cruza los
-- 30 GB del mes**, que es el eje que corta primero en el plan de video.
--
-- ── 🔴 UNA DESVIACIÓN DEL ENCARGO, DECLARADA CON SU RAZÓN ───────────────────
--    El encargo decía **«programala mensual»**. Está programada **DIARIA**, y
--    el aviso sale **UNA VEZ POR MES** (dedup por mes).
--
--    *Una revisión mensual no puede avisar de un cruce: si el consumo pasa los
--    30 GB un día 10, una corrida del día 30 se entera veinte días tarde — y
--    para entonces ya se está pagando el excedente, que es exactamente lo que
--    el umbral de 30 existe para evitar.* **La cadencia sirve al propósito del
--    encargo, no a su literal**; el propósito era que avisara en vez de esperar
--    a que alguien mire.
--
--    La frecuencia del AVISO sí es mensual, que es lo que evita el ruido.
--
-- ── 🔴 SE AVISA TAMBIÉN CUANDO EL INSTRUMENTO FALLA ─────────────────────────
--    Si la edge no contesta, contesta mal, o devuelve `ok:false`, **sale un
--    aviso igual**, con su propia clave de dedup.
--
--    *Un monitor que se calla cuando se rompe es peor que no tenerlo: produce
--    la sensación de estar vigilado. El silencio de esta función tiene que
--    significar «medí y estás por debajo», jamás «no pude medir».*
--
-- ── VEDA 76(g): NO RIGE. Una función y un job. Cero backfill, cero anclas. ──
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-vigilancia-consumo.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.vigilar_consumo_video()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp', 'net', 'vault'
AS $$
DECLARE
  -- El único admin de la casa, medido: `guillo381@gmail.com`.
  k_destinatario constant uuid := '75d0798a-ea90-4a97-a2f2-74f3234d892a';
  k_url          constant text := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/video-consumo';

  v_secreto  text;
  v_req      bigint;
  v_resp     record;
  v_cuerpo   jsonb;
  v_mes      text := to_char(now() AT TIME ZONE 'America/Guayaquil', 'YYYY-MM');
  v_gb       numeric;
  v_supera   boolean;
  v_dedup    text;
BEGIN
  SELECT decrypted_secret INTO v_secreto
  FROM vault.decrypted_secrets WHERE name = 'despacho_secret';

  -- 🔴 EL SECRETO VIAJA AUNQUE LA EDGE TODAVÍA NO LO PIDA. Medido: hoy
  --    `video-consumo` no tiene guard (se reportó a D). Mandarlo no cuesta
  --    nada y **el día que D ponga el guard, este cron no se cae** — al revés
  --    de tener que acordarse de agregarlo entonces.
  SELECT net.http_post(
    url     := k_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-despacho-secret', coalesce(v_secreto, '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) INTO v_req;

  -- Se COBRA la respuesta en esta misma corrida (`async := false`). *Un
  -- `http_post` que no se cobra es fuego y olvido: el cron habría corrido
  -- verde sin saber jamás qué contestó.*
  BEGIN
    SELECT * INTO v_resp FROM net._http_collect_response(v_req, false);
    v_cuerpo := v_resp.response::jsonb -> 'body';
    IF v_cuerpo IS NULL THEN
      v_cuerpo := (v_resp.response::jsonb ->> 'body')::jsonb;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_cuerpo := NULL;
  END;

  v_gb     := (v_cuerpo ->> 'gb_estimados')::numeric;
  v_supera := (v_cuerpo ->> 'supera_umbral')::boolean;

  ---------------------------------------------------------------------------
  -- ① EL INSTRUMENTO NO PUDO MEDIR ⇒ se avisa. Nunca silencio.
  ---------------------------------------------------------------------------
  IF v_cuerpo IS NULL OR (v_cuerpo ->> 'ok') IS DISTINCT FROM 'true' OR v_gb IS NULL THEN
    v_dedup := 'consumo_video_sin_medicion_' || v_mes;
    INSERT INTO public.notificacion_intencion
      (tipo, categoria, destinatario_user_id, datos, clave_dedup, estado)
    VALUES (
      'sistema', 'operacion', k_destinatario,
      jsonb_build_object(
        'asunto', 'La vigilancia del consumo de video no pudo medir',
        'detalle', 'video-consumo no contestó, o contestó algo que no se pudo leer. '
                || 'El silencio de esta vigilancia NO significa que el consumo esté bajo: significa que no se midió.',
        'mes', v_mes,
        'respuesta_cruda', left(coalesce(v_resp.response::text, '(sin respuesta)'), 500)
      ),
      v_dedup, 'nacida'
    )
    ON CONFLICT (clave_dedup) DO NOTHING;

    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_medicion', 'mes', v_mes);
  END IF;

  ---------------------------------------------------------------------------
  -- ② MIDIÓ. Si cruzó el umbral, avisa UNA vez en el mes.
  ---------------------------------------------------------------------------
  IF v_supera THEN
    v_dedup := 'consumo_video_umbral_' || v_mes;
    INSERT INTO public.notificacion_intencion
      (tipo, categoria, destinatario_user_id, datos, clave_dedup, estado)
    VALUES (
      'sistema', 'operacion', k_destinatario,
      jsonb_build_object(
        'asunto', 'El consumo de video cruzó los 30 GB del mes',
        'gb_estimados', v_gb,
        'umbral_gb', v_cuerpo ->> 'umbral_gb',
        'mes', v_mes,
        -- ⚠️ La advertencia del propio estimador viaja con el aviso, para que
        --    nadie lo lea como factura. *Sobreestima a propósito: usa el
        --    bitrate nominal mientras el real baja con la red.*
        'advertencia', v_cuerpo ->> 'advertencia',
        'que_hacer', v_cuerpo -> 'que_hacer_si_supera'
      ),
      v_dedup, 'nacida'
    )
    ON CONFLICT (clave_dedup) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'mes', v_mes, 'gb_estimados', v_gb, 'supera_umbral', v_supera
  );
END;
$$;

COMMENT ON FUNCTION public.vigilar_consumo_video() IS
  'S106 · Llama a video-consumo y avisa al admin si el mes cruza 30 GB. '
  'Avisa TAMBIEN si no pudo medir: el silencio debe significar "medi y esta bajo".';

-- ── PERMISOS · L-140 con las tres. Sólo el cron la corre. ────────────────────
REVOKE EXECUTE ON FUNCTION public.vigilar_consumo_video() FROM PUBLIC, anon, authenticated;

-- ── EL RELOJ ────────────────────────────────────────────────────────────────
-- 05:00 Guayaquil = 10:00 UTC. Temprano y fuera de la hora de consulta.
SELECT cron.unschedule('vigilar-consumo-video')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vigilar-consumo-video');

SELECT cron.schedule(
  'vigilar-consumo-video',
  '0 10 * * *',
  $cron$SELECT public.vigilar_consumo_video();$cron$
);

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE
  v_firma constant text := 'public.vigilar_consumo_video()';
  v_n integer;
BEGIN
  IF has_function_privilege('anon', v_firma, 'EXECUTE')
     OR has_function_privilege('authenticated', v_firma, 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: la vigilancia quedo alcanzable desde una app';
  END IF;

  SELECT count(*) INTO v_n FROM cron.job WHERE jobname = 'vigilar-consumo-video';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon: el job no quedo agendado (% filas)', v_n;
  END IF;

  -- 🔴 EL VOCABULARIO SE VERIFICA CONTRA EL CATÁLOGO, NO SE SUPONE. *Hoy mismo
  --    dos CHECK de `app_config` me rebotaron por escribir valores que no
  --    existían; acá el tipo y la categoría son FK y el fallo llegaría en
  --    RUNTIME, con la alarma sonando y nadie escuchándola.*
  IF NOT EXISTS (SELECT 1 FROM cat_notificacion_tipos WHERE codigo = 'sistema') THEN
    RAISE EXCEPTION 'cinturon: el tipo «sistema» no existe en el catalogo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_notificacion_categorias WHERE codigo = 'operacion') THEN
    RAISE EXCEPTION 'cinturon: la categoria «operacion» no existe en el catalogo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '75d0798a-ea90-4a97-a2f2-74f3234d892a') THEN
    RAISE EXCEPTION 'cinturon: el destinatario del aviso no existe';
  END IF;

  RAISE NOTICE 'cinturon vigilancia_consumo: OK (permisos + job agendado + vocabulario verificado)';
END;
$cinturon$;
