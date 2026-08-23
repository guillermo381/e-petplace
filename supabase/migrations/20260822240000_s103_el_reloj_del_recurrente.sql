-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL RELOJ DEL RECURRENTE — el cable que faltaba, y el aviso al
--          alcance real.
--
-- ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
-- El motor del cobro recurrente quedó APLICADO en `20260822235000` con sus
-- cuatro cinturones y 17 asserts en verde… **y sin un solo llamador.** Lo
-- encontró `P-CIRCUITO` a los diez minutos de nacer: las ocho piezas existen,
-- ningún reloj las llama. *Los gates miden la pieza; ninguno puede notar que
-- falta el cable* — es `L-393`, y esta migración es su cura.
--
-- ── 🔴 CREAR EL RELOJ **NO** ENCIENDE EL COBRO, y eso es de diseño ─────────
-- `ejecutar_recurrencias_vencidas()` arranca leyendo `app_config.recurrente_vivo`
-- y sin esa clave devuelve `recurrente_apagado` sin tocar nada. La clave **no
-- existe** (medido). ⇒ **el cron es EL CABLE; la llave sigue siendo del
-- founder.** El día que la ponga, el cobro arranca **sin otra migración**.
--
-- *Es la forma correcta de pagar un «motor sin puerta»: se conecta el cable
--  ahora, con la corriente cortada, en vez de dejar la conexión para el día
--  del apuro. Un cable que se tiende bajo presión se tiende mal.*
--
-- ── LA HORA, ELEGIDA Y NO HEREDADA: 14:00 UTC = 09:00 Guayaquil ───────────
-- Las tres razones, en orden de peso:
--   ① **UNA HORA DESPUÉS DEL AVISO** (`avisar-recurrencias`, 13:00 UTC). El
--      aviso SIEMPRE precede al cobro. Si compartieran hora, una familia
--      podría recibir «te vamos a cobrar» y el cobro en el mismo minuto, que
--      es lo mismo que no avisar.
--   ② **DEJA EL DÍA HÁBIL POR DELANTE.** Un cobro que falla a las 9 de la
--      mañana se puede mirar, entender y resolver hoy. A las 3 de la mañana
--      —donde vive `cerrar-renovar-planes`— nadie lo ve hasta mañana, y una
--      recurrencia fallida que espera un día es una familia sin su pedido.
--   ③ **NO PISA A NADIE.** Medido: `0 14 * * *` está libre (las ocupadas son
--      3, 8, 8:30, 13, 17, 21:15 UTC y los tickers por minuto).
--
-- ⚠️ Correr dos veces NO cobra dos veces: la compuerta 0 del motor lo cubre y
--    está probada por el caso A del arnés de `20260822235000`.
--
-- ── ACTO 2 · EL AVISO DEJA DE PROMETER LO QUE NO EXISTE ────────────────────
-- Decía `'puede': 'saltar, mover o cancelar'`. **Medido contra el objeto: no
-- existe ninguna función de saltar ni de mover.** Lo único construido es
-- `alternar_recurrencia` (apaga la recurrencia) y `configurar_recurrencia`.
-- ⇒ el texto pasa a `'cancelar'`, por dictamen de mesa.
--
-- *Un aviso que ofrece dos caminos inexistentes no es un texto optimista: es
--  una promesa que la app va a incumplir delante de la familia, en el peor
--  momento — cuando está por cobrársele.*
--
-- 🟡 Ficha para producto, citada acá para que no se pierda: **saltar y mover
--    no están en ninguna firma de v1.** Si se quieren, se firman y se
--    construyen; hasta entonces el aviso dice la verdad.
--
-- ⚠️ NOTA DE PRECISIÓN, para que nadie la «corrija» mal después:
--    `alternar_recurrencia` es un TOGGLE de `activo` ⇒ técnicamente se puede
--    volver a encender, o sea que se parece más a PAUSAR que a cancelar. Se
--    escribe «cancelar» porque es la palabra que la mesa dictó, no porque el
--    motor no admita la otra. *La palabra de producto la elige la mesa; acá
--    queda medido lo que el motor hace, que es lo que yo puedo afirmar.*
--
-- ── VEDA 76(g) ─────────────────────────────────────────────────────────────
-- **NO RIGE.** Esta migración no hace backfill, no toca una sola fila de datos
-- de negocio y no reescribe historia: crea un job de cron y reemplaza el
-- cuerpo de una función. No hay anclas que se puedan mover bajo los pies de
-- otra pista.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- Escrita ANTES de aplicar, en
-- `docs/relevamientos/2026-08-22-s103a-REVERSA-20260822240000.sql`, y declara
-- lo que NO puede deshacer: si alguien ya prendió `recurrente_vivo`, borrar el
-- cron detiene los cobros futuros y **no devuelve la plata que ya movió**.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ACTO 1 · EL RELOJ ──────────────────────────────────────────────────────
SELECT cron.unschedule('cobrar-recurrencias')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cobrar-recurrencias');

SELECT cron.schedule(
  'cobrar-recurrencias',
  '0 14 * * *',                       -- 09:00 Guayaquil
  $$SELECT public.ejecutar_recurrencias_vencidas()$$
);

-- ── ACTO 2 · EL AVISO AL ALCANCE REAL ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.avisar_recurrencias_proximas()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_n int := 0;
BEGIN
  FOR v_r IN
    SELECT * FROM pedidos_recurrencias
    WHERE activo
      AND proximo_pedido_fecha - aviso_dias <= current_date
      AND proximo_pedido_fecha >= current_date
      AND (aviso_enviado_para IS DISTINCT FROM proximo_pedido_fecha)
  LOOP
    PERFORM registrar_intencion_notificacion(
      'pedido_recurrente', v_r.user_id, NULL, NULL,
      jsonb_build_object('recurrencia_id', v_r.id,
                         'proximo_pedido_fecha', v_r.proximo_pedido_fecha,
                         'puede', 'cancelar'),
      'recurrencia:' || v_r.id || ':' || v_r.proximo_pedido_fecha);
    UPDATE pedidos_recurrencias SET aviso_enviado_para = proximo_pedido_fecha
     WHERE id = v_r.id;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'avisadas', v_n);
END $function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — cinco brazos, y el tercero es el que vale: **prueba que el cable
-- está conectado Y que la corriente está cortada**, que son dos afirmaciones
-- distintas y las dos hacen falta.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_sched text; v_activo boolean; v_cmd text;
  v_choques int; v_r jsonb; v_def text; v_llave_previa boolean;
BEGIN
  -- ① EL RELOJ EXISTE, CON SU HORA Y SU MANDADO
  SELECT schedule, active, command INTO v_sched, v_activo, v_cmd
    FROM cron.job WHERE jobname = 'cobrar-recurrencias';
  IF v_sched IS NULL THEN
    RAISE EXCEPTION 'ABORTA ①: el cron `cobrar-recurrencias` no se creo';
  END IF;
  IF v_sched <> '0 14 * * *' THEN
    RAISE EXCEPTION 'ABORTA ①: hora inesperada «%» (se pidio 0 14 * * *)', v_sched;
  END IF;
  IF NOT v_activo THEN
    RAISE EXCEPTION 'ABORTA ①: el cron nacio DESACTIVADO';
  END IF;
  IF position('ejecutar_recurrencias_vencidas' in v_cmd) = 0 THEN
    RAISE EXCEPTION 'ABORTA ①: el cron no llama al motor — llama a «%»', v_cmd;
  END IF;

  -- ② NO PISA A NADIE — la razón ② de la hora, medida y no argumentada
  SELECT count(*) INTO v_choques FROM cron.job
   WHERE schedule = '0 14 * * *' AND jobname <> 'cobrar-recurrencias';
  IF v_choques > 0 THEN
    RAISE EXCEPTION 'ABORTA ②: % cron(es) ya corren a las 14:00 UTC', v_choques;
  END IF;

  -- ③ 🔴 EL DISCRIMINADOR — el cable conectado y la corriente cortada.
  --    Primero: HOY el timbre no hace nada, y dice por qué.
  v_r := public.ejecutar_recurrencias_vencidas();
  IF v_r->>'motivo' IS DISTINCT FROM 'recurrente_apagado' THEN
    RAISE EXCEPTION 'ABORTA ③a: el timbre NO esta apagado — devolvio %', v_r;
  END IF;

  --    Y ahora la otra mitad, que es la que convierte esto en discriminador:
  --    con la llave puesta el timbre CAMBIA de conducta. Sin esta mitad, el
  --    brazo ③a probaria «no hace nada» y seria compatible con un timbre roto
  --    que nunca hace nada. *Un guard que solo mide el caso apagado no
  --    distingue apagado de muerto.*
  --
  --    ⚠️ Y se hace SOLO SI LA LLAVE NO EXISTE. La ausencia se midio hoy, pero
  --    entre la medicion y esta corrida el founder pudo haberla puesto: un
  --    `DELETE` a ciegas le apagaria el cobro sin que nadie se entere. *Un
  --    cinturon que limpia lo que no ensucio es un defecto con cara de
  --    prolijidad.* Si ya esta puesta, este brazo se declara NO CORRIDO —
  --    jamas se salta en silencio.
  SELECT EXISTS (SELECT 1 FROM app_config WHERE clave = 'recurrente_vivo')
    INTO v_llave_previa;

  IF v_llave_previa THEN
    RAISE NOTICE '③b NO CORRIDO: `recurrente_vivo` ya existia y no es mio para tocarlo. El discriminador queda a medias y se DICE.';
  ELSE
    INSERT INTO app_config (clave, valor, tipo, descripcion)
    VALUES ('recurrente_vivo', 'true', 'booleano',
            'sonda del cinturon de 20260822240000 — se borra en la misma txn');
    v_r := public.ejecutar_recurrencias_vencidas();
    IF v_r->>'motivo' IS DISTINCT FROM 'sin_configurar' THEN
      RAISE EXCEPTION 'ABORTA ③b: con la llave puesta esperaba «sin_configurar», dio %', v_r;
    END IF;
    --  Se deshace EN LA MISMA TRANSACCION: la llave la pone el founder, jamas
    --  una migracion. Dejarla puesta seria encender el cobro por accidente.
    DELETE FROM app_config WHERE clave = 'recurrente_vivo';
    IF EXISTS (SELECT 1 FROM app_config WHERE clave = 'recurrente_vivo') THEN
      RAISE EXCEPTION 'ABORTA ③c: la llave de prueba quedo puesta — residuo';
    END IF;
  END IF;

  -- ④ EL AVISO DICE LO QUE EXISTE, Y NO DICE LO QUE NO
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'avisar_recurrencias_proximas';
  IF position('''cancelar''' in v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA ④: el aviso no ofrece cancelar';
  END IF;
  IF position('saltar' in v_def) > 0 OR position('mover' in v_def) > 0 THEN
    RAISE EXCEPTION 'ABORTA ④: el aviso sigue prometiendo saltar o mover';
  END IF;

  -- ⑤ NO SE ROMPIO EL AVISO: sigue siendo el mismo lector, no un cascaron
  IF position('pedidos_recurrencias' in v_def) = 0
     OR position('registrar_intencion_notificacion' in v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA ⑤: el aviso perdio su lector o su despacho';
  END IF;

  RAISE NOTICE 'CINTURON 5/5 VERDE — reloj a las 14:00 UTC (09:00 GYE), inerte hasta que el founder ponga la llave; aviso al alcance real';
END $cinturon$;
