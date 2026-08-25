-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · ③ EL RELOJ DEL BARRIDO DE DEUNA — TENDIDO E INERTE
--
-- POR QUÉ SE PUEDE ENCENDER SIN EL WEBHOOK, medido hoy: el barrido **pregunta**,
-- no espera. `payment/info` corrió de punta a punta con el pago real de Carlos
-- (`EPyh9vgbab`, APPROVED, $75,86) **sin que existiera ningún webhook de DeUna
-- en la base**. *El barrido es exactamente la pieza que cubre el caso de que el
-- aviso del proveedor no llegue nunca* — no necesita el alta de ellos.
--
-- 🔴 NACE `active := false`, Y LA LLAVE ES DEL FOUNDER.
-- El recurrente resuelve esto con su guard adentro del timbre (`recurrente_vivo`);
-- acá la edge es territorio D y **un guard que yo no puedo escribir no es un
-- guard: es una esperanza**. Así que la llave se pone donde sí es mía —
-- `cron.job.active` — y el founder la gira con:
--     SELECT cron.alter_job((SELECT jobid FROM cron.job
--                             WHERE jobname='pagos-deuna-barrido-tick'),
--                           active := true);
-- *Un cable que se tiende bajo presión se tiende mal; una llave que se gira
-- sola no es una llave.*
--
-- CADENCIA: cada 5 minutos, gracia 10 — firmada por el founder. La gracia es
-- del BARRIDO (va en el body), no del cron: un intento recién nacido puede
-- estar en vuelo y preguntarle al proveedor por él sólo produce ruido.
--
-- ⚠️ PRECONDICIÓN QUE **NO** VERIFICA ESTA MIGRACIÓN: que
-- `pagos-deuna-barrido` esté DESPLEGADA. Si no lo está, cada tick va a dar 404
-- en silencio — `net.http_post` no lanza. **Antes de girar la llave se confirma
-- el despliegue con una corrida a mano.** *Es la regla ③ de encendido de
-- `LETRA_DEUNA` §13bis, y aplica igual acá.*
--
-- 76(g) — VEDA: **NO RIGE.** Un job de cron, inerte.
-- REVERSA: `docs/relevamientos/S105-A-REVERSA-20260826020000.sql`
-- ══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE v_id bigint;
BEGIN
  -- idempotente: si ya existe, no se duplica ni se enciende por accidente
  SELECT jobid INTO v_id FROM cron.job WHERE jobname = 'pagos-deuna-barrido-tick';
  IF v_id IS NOT NULL THEN
    RAISE NOTICE 'el job ya existe (jobid=%) — no se toca su estado activo', v_id;
    RETURN;
  END IF;

  PERFORM cron.schedule(
    'pagos-deuna-barrido-tick',
    '*/5 * * * *',
    $cmd$
  SELECT net.http_post(
    url := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-deuna-barrido',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-despacho-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'despacho_secret'),
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bHRpcHFzY2RzZHN4bmpjbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDMxMDYsImV4cCI6MjA5MjM3OTEwNn0.kvHD9-JvaGytu0a7kAwgTyVXExrhIaGg1Z8_-99SOxA'),
    body := '{"origen":"pg_cron","pasada":"deuna","minutos_de_gracia":10}'::jsonb);
    $cmd$
  );

  SELECT jobid INTO v_id FROM cron.job WHERE jobname = 'pagos-deuna-barrido-tick';
  -- 🔴 LA LLAVE: nace apagado. No es un detalle de despliegue, es la decisión.
  PERFORM cron.alter_job(v_id, active := false);
  RAISE NOTICE 'job % creado e INERTE', v_id;
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — sólo lee. Su brazo importante es el SEGUNDO: que nazca apagado.
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_n int; v_activo boolean; v_sched text; v_secreto boolean;
BEGIN
  SELECT count(*) INTO v_n FROM cron.job WHERE jobname='pagos-deuna-barrido-tick';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURÓN: hay % jobs con ese nombre', v_n; END IF;

  SELECT active, schedule INTO v_activo, v_sched
    FROM cron.job WHERE jobname='pagos-deuna-barrido-tick';

  IF v_activo THEN
    RAISE EXCEPTION 'CINTURÓN: el job nació ACTIVO — la llave es del founder, no de la migración';
  END IF;
  IF v_sched <> '*/5 * * * *' THEN
    RAISE EXCEPTION 'CINTURÓN: cadencia inesperada %', v_sched;
  END IF;

  /* 🔴 EL SECRETO SALE DEL VAULT, NO DEL TEXTO — `L-408`. Se verifica que
     exista: un cron que manda un header vacío da 401 en cada tick y **eso se
     lee igual que «no hay nada que conciliar»**. */
  SELECT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='despacho_secret')
    INTO v_secreto;
  IF NOT v_secreto THEN
    RAISE EXCEPTION 'CINTURÓN: no existe el secreto despacho_secret en el vault';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · job creado · activo=% (debe ser false) · cadencia=% · secreto en vault=%',
    v_activo, v_sched, v_secreto;
END $cint$;
