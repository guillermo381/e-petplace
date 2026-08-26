-- ============================================================================
-- S106-A tanda 2 · LA VIGILANCIA DEJA DE PODER COLGARSE
--
-- 🔴 EL DEFECTO, MEDIDO AL EJERCERLA — no leído, no supuesto.
--    `20260826310000` cobraba la respuesta con
--    `net._http_collect_response(id, async := false)`, que **BLOQUEA SIN
--    TECHO**. Al ejercer la función contra la edge real, la llamada **murió a
--    los 2 minutos sin devolver nada**, y el `timeout_milliseconds := 30000`
--    del `http_post` **no la acotó**: ese techo gobierna la petición HTTP, no
--    la espera del cobro. *Son dos relojes distintos y yo trataba a uno como
--    si fuera el otro.*
--
--    **Un cron que puede colgarse indefinidamente es peor que uno que no
--    corre**: ocupa un worker, y su silencio se lee como «todo bien» — que es
--    exactamente lo que esta vigilancia existe para no producir.
--
-- ── LA CURA: SE COBRA POLLEANDO, CON TECHO ─────────────────────────────────
--    `async := true` devuelve **`PENDING` en el acto** en vez de esperar. Se
--    reintenta con techo (20 × 2 s ≈ 40 s) y, si al final sigue `PENDING`,
--    **cae al brazo que ya existía: «no pude medir», que AVISA.**
--
--    *Eso es lo que vuelve barata la cura: el camino del timeout no necesitó
--    inventar nada — desemboca en la alarma que la migración anterior ya había
--    construido para el caso de que el instrumento fallara.*
--
--    ⚠️ **Y la espera no es gratis y se declara:** `pg_sleep` dentro de un job
--    de cron ocupa su worker esos 40 s. Es aceptable **porque corre una vez
--    por día a las 05:00**; no lo sería en un tick de cada minuto.
--
-- ── VEDA 76(g): NO RIGE. Reemplaza una función. Cero datos tocados. ────────
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-vigilancia-cobro-acotado.sql
--    ⚠️ Su reversa NO restaura el cuerpo viejo a propósito: revertir esta cura
--    es DESACTIVAR la vigilancia, no volver a la versión que se colgaba.
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
  i          integer;
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
  -- 🔴 SE POLLEA CON TECHO. `async := true` contesta `PENDING` en el acto;
  --    `false` bloquea sin techo y **colgó la corrida real a los 2 minutos**.
  --    Si se agota el techo, el flujo cae solo al brazo «no pude medir».
  BEGIN
    FOR i IN 1..20 LOOP
      SELECT * INTO v_resp FROM net._http_collect_response(v_req, true);
      EXIT WHEN v_resp.status <> 'PENDING';
      PERFORM pg_sleep(2);
    END LOOP;

    IF v_resp.status = 'SUCCESS' THEN
      v_cuerpo := (v_resp.response).content::jsonb;
    ELSE
      v_cuerpo := NULL;   -- PENDING agotado o ERROR ⇒ avisa por el brazo ①
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
        'estado_del_pedido', coalesce(v_resp.status::text, '(sin estado)'),
        'respuesta_cruda', left(coalesce(v_resp.message, '(sin mensaje)'), 300)
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

  RAISE NOTICE 'cinturon vigilancia_consumo v2: OK (cobro acotado + permisos + job + vocabulario)';
END;
$cinturon$;
