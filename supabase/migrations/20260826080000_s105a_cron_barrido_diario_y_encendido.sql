-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · EL BARRIDO DE DEUNA: DIARIO A LAS 03:00, Y ENCENDIDO
--
-- LA CADENCIA, firmada por el founder con la razón MEDIDA que trajo D: con el
-- webhook vivo, `*/5` son **288 corridas diarias** para buscar casos que hoy
-- son **cero**, consumiendo **rate limit compartido con clientes pagando en
-- vivo**. *Un vigilante que gasta el mismo recurso que la operación que
-- vigila, para no encontrar nada, es un costo con forma de cuidado.*
-- ⇒ **03:00 America/Guayaquil**, la de la letra. Si aparecen webhooks
-- perdidos, se acorta **con la evidencia detrás**, no antes.
--
-- 🔴 EL HUSO SE MIDIÓ CONTRA UN CONTROL POSITIVO, no se supuso: el servidor
-- corre en UTC, y `cobrar-recurrencias` está en `0 14 * * *` = **09:00
-- Guayaquil**, que es exactamente lo que su canon declara. ⇒ `0 8 * * *` son
-- las **03:00**. *Un desfase de huso se verifica contra un cron cuya hora local
-- ya está escrita, jamás restando cinco de memoria.*
--
-- ⚠️ Y ACÁ SE GIRA LA LLAVE. El job nació `active := false` porque la edge es
-- de D y un guard que yo no podía escribir no era un guard. **Hoy la edge está
-- desplegada y su camino corrió de punta a punta con el pago real de Carlos**
-- ⇒ la precondición de la regla ③ de encendido está cumplida y el founder
-- firmó. *La llave se gira cuando lo que enciende ya se probó, no cuando el
-- cable está listo.*
--
-- 76(g) — VEDA: **NO RIGE.** Un job de cron.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826080000.sql`
-- ══════════════════════════════════════════════════════════════════════════

SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname='pagos-deuna-barrido-tick'),
  schedule := '0 8 * * *',
  active := true);

DO $cint$
DECLARE v_s text; v_a boolean; v_local text; v_secreto boolean;
BEGIN
  SELECT schedule, active INTO v_s, v_a FROM cron.job WHERE jobname='pagos-deuna-barrido-tick';
  IF v_s <> '0 8 * * *' THEN RAISE EXCEPTION 'CINTURÓN: cadencia quedó en %', v_s; END IF;
  IF NOT v_a THEN RAISE EXCEPTION 'CINTURÓN: el job quedó APAGADO'; END IF;

  -- la hora local se IMPRIME, no se afirma
  v_local := (('2026-08-26 08:00:00+00'::timestamptz) AT TIME ZONE 'America/Guayaquil')::text;
  IF v_local NOT LIKE '% 03:00:00' THEN
    RAISE EXCEPTION 'CINTURÓN: 0 8 * * * NO son las 03:00 locales, son las %', v_local;
  END IF;

  SELECT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='despacho_secret') INTO v_secreto;
  IF NOT v_secreto THEN
    RAISE EXCEPTION 'CINTURÓN: sin despacho_secret el cron da 401 en cada tick y se lee igual que «nada que conciliar»';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · cadencia=% · local=% · activo=% · secreto=%', v_s, v_local, v_a, v_secreto;
END $cint$;
