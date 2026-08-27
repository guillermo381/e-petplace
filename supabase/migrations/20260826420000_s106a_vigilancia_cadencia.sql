-- ============================================================================
-- S106-A tanda 3 · LA VIGILANCIA MEDÍA CADA 24 h CONTRA UN TTL DE 6 h
--
-- 🔴 EL DEFECTO, Y ES DEL DISEÑO DE AYER — NO DE UN DATO ────────────────────
-- `20260826340000` resolvió que **`pg_net` no despacha hasta el COMMIT** con
-- dos tiempos: cada corrida COBRA lo que pidió la anterior y PIDE para la
-- próxima. Correcto — **y con un supuesto no medido: que la respuesta seguiría
-- ahí.**
--
-- Medido hoy contra el objeto: **`pg_net.ttl = 6 hours`**, y el job corría
-- `0 10 * * *` ⇒ **24 h entre corridas.** La respuesta de la anterior lleva
-- **18 horas borrada** cuando la siguiente va a cobrarla.
--
-- ⇒ La vigilancia habría mandado *«no pude medir»* **todos los días, para
-- siempre, sin medir una sola vez.** Y el ledger de `cron.job_run_details` la
-- habría mostrado corriendo puntual y sin errores.
--
-- > 🔴 *Es EXACTAMENTE el modo de falla que la cabecera de `340000` declara
-- > haber evitado — «el monitor que parece vivo y nunca mide» — reintroducido
-- > por otra puerta. La versión vieja moría por TRANSACCIÓN; ésta moría por
-- > RELOJ, y ningún gate mira relojes.*
--
-- Y su segunda mitad es peor que la primera: **un aviso que llega todos los
-- días se apaga solo en la cabeza de quien lo lee.** Al mes, el día que el
-- consumo cruce de verdad los 30 GB, ese correo ya no lo abre nadie.
--
-- ── LA CURA, Y POR QUÉ ÉSTA Y NO OTRA ──────────────────────────────────────
-- **① La cadencia baja a 4 h** (`0 */4 * * *`), dentro del TTL con margen.
-- Se descartaron dos alternativas más cortas:
--   · *dos jobs, pedir y cobrar a 15 min* — correcto, pero **acopla dos
--     schedules**: el día que alguien mueva uno solo, el otro cobra vacío y
--     vuelve el mismo silencio.
--   · *guardar el último GB conocido y reusarlo* — tapa el síntoma: el
--     monitor seguiría sin medir y encima **diría un número viejo como si
--     fuera de hoy.**
--
-- **② La función se AUTO-DIAGNOSTICA**, que es lo que la vuelve difícil de
-- romper de nuevo: lee **su propia cadencia de `cron.job` y el `pg_net.ttl`
-- vivos**, y si la primera excede al segundo **lo dice dentro del aviso**.
-- *Un cinturón de migración sólo mira el día que la migración corre; esto mira
-- cada corrida.* El día que alguien vuelva a poner esto en diario, el primer
-- aviso nombra la causa en vez de mandar a buscar un endpoint sano.
--
-- **③ El aviso de «no pude medir» gana dedup POR DÍA** (antes: por mes, la
-- misma clave que el de umbral). *Con la clave mensual, un fallo del día 2
-- habría silenciado el del 3 al 31 — el monitor tapándose a sí mismo.*
--
-- ── ⚠️ SOBRE «PROGRAMALA MENSUAL» (encargo del founder) ────────────────────
-- La firma pedía cadencia mensual. **Se cumple donde importa y se declara
-- dónde no:** lo MENSUAL es *cuántas veces te molesto* — el aviso de umbral
-- lleva `clave_dedup` con el mes y sale **una sola vez por mes**. Lo que sube
-- de frecuencia es la MEDICIÓN, y sube por una razón medida: *sobre una cuota
-- mensual, medir una vez al mes es enterarse hasta 30 días tarde de que ya se
-- está pagando* — y encima el TTL lo volvía imposible.
--
-- ── VEDA 76(g): NO RIGE. `CREATE OR REPLACE` + `cron.alter_job`. Cero DDL de
--    tablas, cero backfill.
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-vigilancia-cadencia.sql
--    ⚠️ y esa reversa NO es neutra: revertir REINTRODUCE el defecto.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.vigilar_consumo_video()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp', 'net', 'vault', 'cron'
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
  v_dia      text := to_char(now() AT TIME ZONE 'America/Guayaquil', 'YYYY-MM-DD');
  v_gb       numeric;
  v_supera   boolean;
  v_estado   text := 'sin_pedido_previo';
  v_ttl      interval;
  v_sched    text;
  v_cadencia text := 'ok';
BEGIN
  ---------------------------------------------------------------------------
  -- ⓪ EL AUTO-DIAGNÓSTICO DE CADENCIA — se mide, no se supone.
  --
  -- 🔴 Lee el TTL VIVO de `pg_net` y la cadencia VIVA del propio job. No hay
  -- constante transcrita: *un número copiado acá diverge del real sin avisar,
  -- y su modo de falla es el peor —seguir diciendo «ok»— justo cuando dejó de
  -- ser cierto.*
  ---------------------------------------------------------------------------
  BEGIN
    SELECT setting::interval INTO v_ttl FROM pg_settings WHERE name = 'pg_net.ttl';
    SELECT j.schedule INTO v_sched FROM cron.job j WHERE j.jobname = 'vigilar-consumo-video';
    IF v_sched IS NULL THEN
      v_cadencia := 'ATENCION: esta vigilancia no esta agendada en cron.job';
    ELSIF v_sched ~ '^0 \d+ \* \* \*$' AND v_ttl < interval '24 hours' THEN
      -- diaria (una hora fija al día) con TTL menor a un día ⇒ nunca cobra
      v_cadencia := format(
        'ATENCION: la cadencia es DIARIA (%s) y pg_net.ttl es %s ⇒ la respuesta '
        || 'de la corrida anterior YA ESTA BORRADA cuando esta corrida va a cobrarla. '
        || 'Esta vigilancia no puede medir NUNCA con esta cadencia.', v_sched, v_ttl);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_cadencia := 'no se pudo auto-diagnosticar la cadencia';
  END;

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
    --      🔴 DEDUP POR DÍA, no por mes: con la clave mensual un fallo del día 2
    --      silenciaba del 3 al 31 — el monitor tapándose a sí mismo.
    IF v_cuerpo IS NULL OR (v_cuerpo ->> 'ok') IS DISTINCT FROM 'true' OR v_gb IS NULL THEN
      PERFORM public.registrar_intencion_notificacion(
        'sistema', k_destinatario, NULL, NULL,
        jsonb_build_object(
          'asunto', 'La vigilancia del consumo de video no pudo medir',
          'detalle', 'El silencio de esta vigilancia NO significa que el consumo esté bajo: '
                  || 'significa que no se midió.',
          'mes', v_mes,
          'estado_del_pedido', v_estado,
          -- 🔴 la causa más probable, NOMBRADA, en vez de mandar a buscarla
          'diagnostico_cadencia', v_cadencia,
          'pg_net_ttl', coalesce(v_ttl::text, '(no leído)'),
          'http_status', coalesce(((v_resp.response).status_code)::text, '(sin status)'),
          'respuesta_cruda', left(coalesce((v_resp.response).body, v_resp.message, '(vacío)'), 300)
        ),
        'consumo_video_sin_medicion_' || v_dia
      );

    -- ①b · MIDIÓ y cruzó el umbral ⇒ avisa UNA vez en el mes.
    --      Acá el dedup MENSUAL es la firma del founder («programala mensual»):
    --      lo mensual es cuántas veces se molesta, no cada cuánto se mide.
    ELSIF v_supera THEN
      PERFORM public.registrar_intencion_notificacion(
        'sistema', k_destinatario, NULL, NULL,
        jsonb_build_object(
          'asunto', 'El consumo de video cruzó los 30 GB del mes',
          'gb_estimados', v_gb,
          'umbral_gb', v_cuerpo ->> 'umbral_gb',
          'mes', v_mes,
          -- ⚠️ La latencia, DICHA: este número es de la corrida anterior.
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
  --    Header `x-despacho-secret` + secreto `despacho_secret` del vault: el
  --    molde de la casa, verificado contra el literal de D. *Mandar otro
  --    nombre daría 401 en cada corrida y el ledger lo mostraría como «anda».*
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
    'cadencia', v_cadencia,
    'mes', v_mes
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.vigilar_consumo_video() FROM PUBLIC, anon, authenticated;

-- ── LA CADENCIA, DENTRO DEL TTL ────────────────────────────────────────────
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'vigilar-consumo-video'),
  schedule => '0 */4 * * *'
);

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
-- No declara: **compara la cadencia nueva contra el TTL vivo** y exige que la
-- primera quepa en el segundo. *Un cinturón que sólo verifique «el schedule
-- dice 4 h» no mediría nada: mediría que escribí lo que escribí.*
DO $cinturon$
DECLARE
  v_ttl interval; v_sched text; v_gap interval;
BEGIN
  SELECT setting::interval INTO v_ttl FROM pg_settings WHERE name='pg_net.ttl';
  IF v_ttl IS NULL THEN RAISE EXCEPTION 'cinturon: no se pudo leer pg_net.ttl'; END IF;

  SELECT j.schedule INTO v_sched FROM cron.job j WHERE j.jobname='vigilar-consumo-video';
  IF v_sched IS NULL THEN RAISE EXCEPTION 'cinturon: el job no esta agendado'; END IF;

  -- `0 */N * * *` ⇒ cada N horas. Cualquier otra forma se rechaza en vez de
  -- interpretarse: *adivinar una cadencia es peor que no medirla.*
  IF v_sched !~ '^0 \*/\d+ \* \* \*$' THEN
    RAISE EXCEPTION 'cinturon: cadencia inesperada (%) — no se puede comparar con el ttl', v_sched;
  END IF;
  v_gap := ((regexp_match(v_sched, '^0 \*/(\d+)'))[1]::int || ' hours')::interval;

  IF v_gap >= v_ttl THEN
    RAISE EXCEPTION 'cinturon: la cadencia (%) NO cabe en pg_net.ttl (%) — la vigilancia no podria cobrar nunca',
                    v_gap, v_ttl;
  END IF;

  IF has_function_privilege('anon','public.vigilar_consumo_video()','EXECUTE')
     OR has_function_privilege('authenticated','public.vigilar_consumo_video()','EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: la vigilancia quedo alcanzable desde una app';
  END IF;

  RAISE NOTICE 'cinturon cadencia: OK · cada % · pg_net.ttl % · margen %', v_gap, v_ttl, v_ttl - v_gap;
END;
$cinturon$;
