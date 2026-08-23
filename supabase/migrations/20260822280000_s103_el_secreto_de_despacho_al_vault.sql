-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL SECRETO DE DESPACHO SALE DEL TEXTO DE LOS CRONES Y VA AL VAULT
--
-- ── EL DEFECTO ─────────────────────────────────────────────────────────────
-- El valor literal de `x-despacho-secret` vivía incrustado en el texto de
-- **CINCO** jobs de cron: `barrer-storage-tick` · `despachar-notificaciones-tick`
-- · `despachar-push-tick` · `pagos-conciliar-mediodia` ·
-- `pagos-conciliar-antes-del-corte`.
--
-- Ese secreto es **lo único que gatea** el barrido de pagos y los despachadores
-- de avisos: `D-713` puso el guard ADENTRO de las funciones justamente porque
-- `verify_jwt` no las protege (*la anon key ES un JWT válido y viaja en el
-- bundle*). **La defensa se movió adentro y su llave se quedó afuera.**
--
-- ═══ 🔴 LA CORRECCIÓN DE MI PROPIO REPORTE, ANTES QUE LA CURA ══════════════
--
-- **Abrí `D-885` como ALTA escribiendo *«cualquiera que pueda leer esa tabla»*.
-- Medí después, y esa frase era FALSA:**
--
--     has_schema_privilege(…, 'cron', 'USAGE')
--       anon = false · authenticated = false · service_role = false
--
-- ⇒ **NADIE llega a `cron.job` por la API.** La exposición real es a quien
-- tiene acceso DIRECTO a la base o al panel. *Sigue siendo un defecto; no es el
-- que declaré.*
--
-- **Es la ley que la mesa acababa de firmar, cobrada en el mismo turno:
-- reportar un hallazgo sin su cota lo infla — y eso es defecto de REPORTE, no
-- de medición.** Y una segunda corrección del mismo tipo: dije **cuatro**
-- crones y son **CINCO**.
--
-- ═══ 🔴 Y EL MOLDE NOMBRADO HABRÍA ENSANCHADO EL AGUJERO ═══════════════════
--
-- La cura obvia era `app_config` —el molde existe: mi propia
-- `ejecutar_recurrencias_vencidas` lee `secreto_despacho` de ahí—. **Medido,
-- ese destino es PEOR:**
--
--   | destino                | quién lo alcanza                                |
--   |------------------------|-------------------------------------------------|
--   | `cron.job.command` hoy | nadie por API                                   |
--   | `app_config`           | 🔴 **+ los ADMIN** (`app_config_admin [ALL]`)   |
--   | `vault`                | nadie por API · **y cifrado en reposo**         |
--
-- *Una cura que mueve un secreto a un lugar con más lectores es una regresión
--  con cara de prolijidad.* ⇒ **va al `vault`**, que existe, está vacío, no
-- tiene consumidores, y **los 15 jobs corren como `postgres`, que sí lo ve**
-- (medido).
--
-- **Y de paso se cierra el camino que yo misma dejé apuntando al lugar ancho:**
-- `ejecutar_recurrencias_vencidas` pasa a leer del vault.
--
-- ── LO QUE ESTA MIGRACIÓN **NO** HACE, y es del founder ────────────────────
-- 🔑 **NO ROTA EL SECRETO.** El orden lo dicta el propio diagnóstico: *primero
-- sale del texto, después se rota — rotar sin sacarlo reescribe el mismo
-- problema con otro valor.* **La rotación es firma del founder.**
--
-- ⚠️ Y lo que queda vivo aunque esto se aplique: **el valor viejo ya estuvo en
--    claro en una tabla del sistema**, y esta migración no puede des-verlo.
--    *Sacarlo del texto reduce la superficie futura; la rotación es lo único
--     que cierra el pasado.*
--
-- ── EL VALOR NUNCA SE ESCRIBE EN NINGÚN LADO ───────────────────────────────
-- La migración lo **extrae del propio texto** con una expresión regular y lo
-- mueve. **No aparece en este archivo, ni en un `RAISE`, ni en el reporte.**
-- *Un secreto que se transcribe «para migrarlo» queda en el historial de git,
--  que es peor que donde estaba.*
--
-- ── VEDA 76(g) ─────────────────────────────────────────────────────────────
-- 🔴 **RIGE.** Reescribe el `command` de cinco jobs de cron VIVOS, dos de los
-- cuales tocan plata (`pagos-conciliar-*`). No toca filas de negocio.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- `docs/relevamientos/2026-08-22-s103a-REVERSA-20260822280000.sql`, escrita
-- ANTES, y declara que **repone el secreto en claro** y que **no puede correr
-- si alguien borró el secreto del vault**.
-- ═══════════════════════════════════════════════════════════════════════════

DO $mig$
DECLARE
  v_secreto text; v_j record; v_n int := 0; v_leido text; v_def text;
  PAT constant text := '''x-despacho-secret''\s*,\s*''([^'']+)''';
  SUB constant text := '(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''despacho_secret'')';
BEGIN
  -- ═══ ① EXTRAER SIN IMPRIMIR ═════════════════════════════════════════════
  SELECT (regexp_match(command, PAT))[1] INTO v_secreto
    FROM cron.job WHERE command ~ PAT LIMIT 1;
  IF v_secreto IS NULL OR length(v_secreto) < 16 THEN
    RAISE EXCEPTION 'ABORTA ①: no se pudo extraer el secreto del texto de ningun cron (largo=%)',
                    COALESCE(length(v_secreto), -1);
  END IF;

  /* 🔴 TODOS LOS CRONES LLEVAN EL MISMO VALOR — se verifica, no se supone.
     *Si alguno tuviera otro, moverlos a UNA sola fuente dejaría a ese cron sin
      autorización, en silencio, hasta que alguien mire un tick fallido.* */
  IF EXISTS (SELECT 1 FROM cron.job WHERE command ~ PAT
              AND (regexp_match(command, PAT))[1] IS DISTINCT FROM v_secreto) THEN
    RAISE EXCEPTION 'ABORTA ①: hay crones con secretos DISTINTOS — una sola fuente los rompe';
  END IF;

  -- ═══ ② AL VAULT ═════════════════════════════════════════════════════════
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'despacho_secret') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'despacho_secret'), v_secreto);
  ELSE
    PERFORM vault.create_secret(v_secreto, 'despacho_secret',
      'Secreto compartido cron -> edge (D-713). Salio del texto de 5 crones en S103. NO rotado: eso es firma del founder.');
  END IF;

  SELECT decrypted_secret INTO v_leido
    FROM vault.decrypted_secrets WHERE name = 'despacho_secret';
  IF v_leido IS DISTINCT FROM v_secreto THEN
    RAISE EXCEPTION 'ABORTA ②: el vault no devuelve lo que se guardo';
  END IF;

  -- ═══ ③ LOS CINCO COMANDOS DEJAN DE LLEVARLO ═════════════════════════════
  FOR v_j IN SELECT jobid, jobname, command FROM cron.job WHERE command ~ PAT LOOP
    PERFORM cron.alter_job(v_j.jobid,
      command := regexp_replace(v_j.command,
        '''x-despacho-secret''(\s*,\s*)''[^'']+''',
        '''x-despacho-secret''\1' || SUB));
    v_n := v_n + 1;
  END LOOP;
  IF v_n < 5 THEN
    RAISE EXCEPTION 'ABORTA ③: solo se reescribieron % crones, se esperaban 5', v_n;
  END IF;

  -- ═══ ④ EL TIMBRE DEL RECURRENTE DEJA DE APUNTAR A `app_config` ══════════
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'ejecutar_recurrencias_vencidas';
  IF position('app_config WHERE clave = ''secreto_despacho''' in v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA ④: el timbre no lee secreto_despacho de app_config — ¿ya se curo?';
  END IF;
  EXECUTE replace(v_def,
    'SELECT valor INTO v_secreto FROM app_config WHERE clave = ''secreto_despacho'';',
    'SELECT decrypted_secret INTO v_secreto FROM vault.decrypted_secrets WHERE name = ''despacho_secret'';');

  -- ═══ ⑤ 🔴 EL DISCRIMINADOR — que los crones resuelvan AL MISMO VALOR ════
  --     Sin esto, ③ probaria que el texto cambio y nada mas. *Un comando que
  --     ya no lleva el secreto y tampoco lo resuelve deja los cinco crones sin
  --     autorizacion, EN SILENCIO, hasta que alguien mire un tick fallido.*
  EXECUTE 'SELECT ' || SUB INTO v_leido;
  IF v_leido IS DISTINCT FROM v_secreto THEN
    RAISE EXCEPTION 'ABORTA ⑤: la subconsulta del cron NO resuelve al mismo valor';
  END IF;

  -- ═══ ⑥ NINGUN CRON LLEVA YA EL LITERAL ══════════════════════════════════
  IF EXISTS (SELECT 1 FROM cron.job WHERE command ~ PAT) THEN
    RAISE EXCEPTION 'ABORTA ⑥: quedan crones con el secreto en el texto';
  END IF;
  IF (SELECT count(*) FROM cron.job WHERE command ILIKE '%despacho_secret%') <> 5 THEN
    RAISE EXCEPTION 'ABORTA ⑥: no son 5 los crones que leen del vault';
  END IF;

  -- ═══ ⑦ CONTROL POSITIVO — los cinco siguen siendo los mismos jobs ═══════
  IF (SELECT count(*) FROM cron.job WHERE active) <> (SELECT count(*) FROM cron.job) THEN
    RAISE EXCEPTION 'ABORTA ⑦: algun cron quedo desactivado';
  END IF;

  RAISE NOTICE 'VERDE 7/7 — el secreto vive en el vault, % crones lo LEEN y ninguno lo LLEVA. NO fue rotado: eso es firma del founder.', v_n;
END $mig$;
