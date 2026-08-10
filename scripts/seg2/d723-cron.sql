-- 🔴 D-723 · PASO 1 DE 2 — EL CRON PRIMERO, EL DEPLOY DESPUÉS.
--
-- ⚠️ EL ORDEN NO ES PREFERENCIA: al revés deja una ventana con el CORREO CAÍDO.
-- Si se despliega el guard antes de que el cron mande el header, cada tick
-- rebota 401 hasta que el cron se actualice. Es exactamente la secuencia que
-- D-713 ya ejecutó dos veces (push y whatsapp) y que se copia acá.
--
-- ── R6: EL SECRETO NO SE TRANSCRIBE ──────────────────────────────────────────
-- No se escribe el valor en ningún lado. Se LEE del job 8 —que ya está curado y
-- lo tiene— y se re-inyecta en el job 6 dentro de la misma sentencia. El
-- secreto nunca sale a la consola, ni a un archivo, ni a este SQL.
DO $$
DECLARE
  v_secreto text;
  v_url     text := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/despachar-correo';
  v_cmd     text;
BEGIN
  -- ① el secreto, extraído del hermano ya curado (jamás tipeado acá)
  SELECT (regexp_match(command, $re$'x-despacho-secret',\s*'([^']+)'$re$))[1]
    INTO v_secreto
  FROM cron.job WHERE jobname = 'despachar-push-tick';

  IF v_secreto IS NULL OR length(v_secreto) < 20 THEN
    RAISE EXCEPTION 'no se pudo leer el secreto del job de push — se aborta sin tocar nada';
  END IF;

  -- ② el comando nuevo: MISMA forma que el de push, con el header agregado.
  --    Se conserva el Authorization: quitarlo sería un cambio que esta cura no
  --    necesita, y un cambio de más en una ventana de riesgo es cómo se rompen
  --    las cosas que funcionaban.
  v_cmd := format($cmd$
  SELECT net.http_post(
    url     := %L,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-despacho-secret', %L
    ),
    body    := '{}'::jsonb
  );
$cmd$, v_url, v_secreto);

  PERFORM cron.alter_job(job_id := 6, command := v_cmd);

  RAISE NOTICE 'job 6 actualizado';
END $$;

-- ③ VERIFICACIÓN, sin exponer el secreto: se mira que el header ESTÉ, no cuál es.
SELECT
  jobid,
  jobname,
  active,
  (command LIKE '%x-despacho-secret%') AS manda_el_header,
  (command LIKE '%despachar-correo%')  AS apunta_al_correo
FROM cron.job
WHERE jobid IN (6, 8)
ORDER BY jobid;
