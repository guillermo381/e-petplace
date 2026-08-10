-- 🔴 D-731 · EL TICK DEL BARREDOR
--
-- ── R6: EL SECRETO NO SE TRANSCRIBE ─────────────────────────────────────────
-- El secreto compartido **se lee del job hermano ya curado, dentro de la misma
-- sentencia**, y jamás se imprime ni se escribe en este archivo. Es el mismo
-- procedimiento que usó D-723 con el tercer despachador: *un secreto que pasa
-- por un archivo del repo deja de ser secreto, aunque el archivo no se
-- commitee.*
--
-- ── ORDEN ───────────────────────────────────────────────────────────────────
-- La function ya está desplegada CON su guard. Programar el tick después del
-- deploy no abre ninguna ventana: si el orden fuera al revés, el primer tick
-- llamaría a una function inexistente (ruidoso, inofensivo). El orden delicado
-- es el opuesto —cron primero, deploy después— y no es el caso acá.
--
-- Cadencia `*/5`: la cola se llena solo cuando alguien borra un documento, que
-- es raro. Un minuto sería un tick vacío 288 veces por día para nada.

SELECT cron.schedule(
  'barrer-storage-tick',
  '*/5 * * * *',
  format(
    $job$
    SELECT net.http_post(
      url     := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/barrer-storage',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-despacho-secret', %L
      ),
      body    := '{}'::jsonb
    );
    $job$,
    (SELECT (regexp_match(command, '''x-despacho-secret'',\s*''([^'']+)'''))[1]
       FROM cron.job WHERE jobname = 'despachar-push-tick')
  )
);

-- Verificación SIN revelar el secreto: que el job exista, esté activo, y que
-- su comando LLEVE la cabecera (no cuál es su valor).
SELECT
  jobname,
  schedule,
  active,
  (command LIKE '%x-despacho-secret%') AS lleva_cabecera,
  (command LIKE '%barrer-storage%')    AS apunta_al_barredor
FROM cron.job
WHERE jobname = 'barrer-storage-tick';
