-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260822280000_s103_el_secreto_de_despacho_al_vault.sql`
-- Escrita ANTES de aplicar. S103-A · 22-ago-2026.
--
-- 🔴 QUÉ REPONE: **el secreto de despacho, EN CLARO, en el texto de cinco
--    crones** — cuatro de los cuales despachan avisos y dos tocan plata.
--
-- ⚠️ Y LO HACE SIN PODER LEERLO DE NINGÚN LADO SI EL VAULT SE BORRÓ: esta
--    reversa **lee el valor del vault** para volver a incrustarlo. Si alguien
--    borró el secreto del vault antes de correr esto, **no hay de dónde
--    sacarlo** y los cinco crones quedan sin autorización ⇒ el barrido de pagos
--    y el despachador de avisos dejan de funcionar, en silencio, hasta que
--    alguien mire un tick fallido.
--    ⇒ **medir ANTES:**  SELECT count(*) FROM vault.secrets WHERE name='despacho_secret';
--
-- ── POR QUÉ ALGUIEN QUERRÍA REVERTIR ESTO, y por qué probablemente no debería
--
-- El único motivo legítimo sería que los crones dejaran de resolver la
-- subconsulta al vault. **Eso se mide, no se supone:** los 15 jobs corren como
-- `postgres`, y `has_schema_privilege('postgres','vault','USAGE')` da `true`
-- (medido el 22-ago). Si algún día eso cambia, la salida correcta **no es
-- volver al literal**: es devolverle el permiso al dueño del job.
--
-- *Volver a poner un secreto en el texto de un job para arreglar un problema de
--  permisos es cambiar una llave por una copia de la llave debajo del felpudo.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $rev$
DECLARE v_secreto text; v_j record; v_n int := 0;
BEGIN
  SELECT decrypted_secret INTO v_secreto
    FROM vault.decrypted_secrets WHERE name = 'despacho_secret';
  IF v_secreto IS NULL OR length(v_secreto) = 0 THEN
    RAISE EXCEPTION 'ABORTA: el secreto no esta en el vault — no hay de donde reponerlo. Los crones quedarian sin autorizacion.';
  END IF;

  FOR v_j IN SELECT jobid, jobname, command FROM cron.job
              WHERE command ILIKE '%despacho_secret%' LOOP
    PERFORM cron.alter_job(v_j.jobid, command :=
      replace(v_j.command,
        '(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''despacho_secret'')',
        quote_literal(v_secreto)));
    v_n := v_n + 1;
  END LOOP;

  IF v_n = 0 THEN
    RAISE EXCEPTION 'ABORTA: ningun cron lee del vault — ¿ya esta revertida?';
  END IF;

  -- El timbre del recurrente vuelve a `app_config`
  EXECUTE replace(
    (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='ejecutar_recurrencias_vencidas'),
    'SELECT decrypted_secret INTO v_secreto FROM vault.decrypted_secrets WHERE name = ''despacho_secret'';',
    'SELECT valor INTO v_secreto FROM app_config WHERE clave = ''secreto_despacho'';');

  RAISE NOTICE 'REVERSA VERDE — % cron(es) volvieron a llevar el secreto EN CLARO en su texto.', v_n;
END $rev$;

COMMIT;
