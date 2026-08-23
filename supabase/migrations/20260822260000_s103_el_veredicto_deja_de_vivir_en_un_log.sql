-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL VEREDICTO DE AUTENTICACIÓN DEJA DE VIVIR EN UN CAMPO DE LOG
--
-- ── EL DEFECTO ─────────────────────────────────────────────────────────────
-- `_evento_autenticado` decidía si un evento de pago está autenticado leyendo
-- **`detalle` con `ILIKE`** — y `detalle` es **texto libre**, el campo de
-- diagnóstico que el buzón usa para contar qué falló:
--
--     .update({ detalle: `analisis_fallo: ${String(e).slice(0, 400)}` })
--
-- **El mensaje de una excepción entra al campo del que depende la
-- autenticación.**
--
-- 🔴 **REPRODUCIDO EN SELECT PURO, CERO ESCRITURAS, Y EN LOS DOS PROVEEDORES**
--    (el hallazgo llegó nombrando sólo DeUna; medirlo mostró que Nuvei tiene
--    la misma forma):
--
--   | caso                                                          | autentica |
--   |---------------------------------------------------------------|-----------|
--   | `analisis_fallo: TypeError al parsear {…verificado=si} …`      | **true** 🔴|
--   | `analisis_fallo: fallo leyendo credencial=SERVER del header`   | **true** 🔴|
--   | control · `verificado=no`                                      | false ✅  |
--   | control · `credencial=CLIENT`                                  | false ✅  |
--
--   *Los controles prueban que el instrumento discrimina — sin ellos el «true»
--    no diría nada.*
--
-- ── LA LEY QUE DEJA, y es más grande que el caso ───────────────────────────
-- > **Un campo que un humano lee para diagnosticar y una función lee para
-- > autorizar tiene DOS DUEÑOS CON INTERESES OPUESTOS — y el que escribe para
-- > diagnosticar no sabe que está firmando.**
--
-- ── SEVERIDAD, MEDIDA Y NO SUPUESTA ────────────────────────────────────────
-- **El mensaje solo NO alcanza:** sin `stoken_valido` el gate da `false` en los
-- cinco casos probados. **Quien lo use ya tiene el secreto** ⇒ es erosión de
-- defensa en profundidad, **no una puerta abierta**. *Se dice así para que la
-- cura se decida con el número y no con el susto.*
--
-- ═══ LA CURA, Y SU ASIMETRÍA — que NO es descuido: es la única secuencia que
--     no corta los pagos ══════════════════════════════════════════════════
--
-- El veredicto pasa a **columnas**. Pero los dos proveedores están en estados
-- distintos, medidos, y por eso se tratan distinto:
--
-- ── NUVEI · SE CIERRA HOY, SIN TOCAR LA EDGE ───────────────────────────────
-- Medido: su marca `credencial=SERVER` la compone el buzón **AL INSERTAR** (es
-- la receta de verificación), y el `analisis_fallo` llega **por UPDATE**.
-- ⇒ un trigger **BEFORE INSERT** sella la columna con lo que había en ese
--   instante, y **ningún UPDATE posterior puede cambiarla**.
-- **El agujero de Nuvei queda cerrado sin que la edge escriba una línea** — y
-- Nuvei es el que hoy mueve plata, así que era el que no podía esperar.
--
-- ── DEUNA · EL GATE PASA A EXIGIR LA COLUMNA, Y ESO ES UN REQUISITO NUEVO ──
-- Su marca `verificado=si` **NO** es de insert: la escribe el buzón **después**
-- de que `payment/info` confirmó ⇒ **ningún trigger puede sellarla**, porque
-- llega por el mismo camino que el diagnóstico. *Ahí no hay truco: el veredicto
-- tiene que escribirlo quien lo emite, como dato.*
--
-- 🟢 **Y hacerlo HOY es gratis, medido: `webhook_events` tiene CERO filas de
--    DeUna.** No hay historia que romper ni tráfico que cortar.
--
-- 🔴 **PEDIDO EXPLÍCITO A LA PISTA DUEÑA DEL BUZÓN, y es BLOQUEANTE de DeUna:**
--    la edge tiene que escribir `verificado = true` en la COLUMNA cuando
--    `payment/info` confirme. **Mientras no lo haga, ningún evento de DeUna
--    autentica.** *Eso no es un efecto colateral: es la regla ① de encendido
--    («la puerta del cliente es lo último, y jamás antes de que exista quien
--    confirme») convertida en mecanismo — deja de depender de que alguien se
--    acuerde de leerla.*
--
-- ── `origen` ───────────────────────────────────────────────────────────────
-- Nace ahora aunque su consumidor todavía no exista, **y se declara así**: es
-- la columna que va a permitir que el aplicador del barrido autentique
-- honestamente (`origen='barrido' AND verificado`) **sin escribir
-- `stoken_valido = true`, que sería firmar una verificación que no ocurrió.**
-- ⚠️ **Su rama en el gate NO se escribe hoy** — sería puerta sin motor.
--
-- ── VEDA 76(g) ─────────────────────────────────────────────────────────────
-- 🔴 **RIGE.** Hay BACKFILL: las filas históricas reciben `credencial` derivada
-- de su `detalle`. Son 64 filas de `webhook_events`, todas `sandbox`. No se
-- toca ninguna otra tabla.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- `docs/relevamientos/2026-08-22-s103a-REVERSA-20260822260000.sql`, escrita
-- ANTES, y declara que **repone el agujero** y que **no devuelve un gate
-- funcionando si para entonces la edge ya escribe la columna**.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① LAS COLUMNAS ─────────────────────────────────────────────────────────
ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS credencial text,
  ADD COLUMN IF NOT EXISTS verificado boolean,
  ADD COLUMN IF NOT EXISTS origen     text NOT NULL DEFAULT 'webhook';

DO $c$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_webhook_events_credencial') THEN
    ALTER TABLE webhook_events ADD CONSTRAINT chk_webhook_events_credencial
      CHECK (credencial IS NULL OR credencial IN ('SERVER','CLIENT'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_webhook_events_origen') THEN
    ALTER TABLE webhook_events ADD CONSTRAINT chk_webhook_events_origen
      CHECK (origen IN ('webhook','barrido','consulta_activa'));
  END IF;
END $c$;

COMMENT ON COLUMN webhook_events.credencial IS
  'SERVER|CLIENT — veredicto de QUÉ credencial firmó el webhook. Lo SELLA un trigger BEFORE INSERT desde `detalle`; ningún UPDATE posterior lo cambia. Vive acá y no en `detalle` porque `detalle` es un campo de diagnóstico que también recibe mensajes de excepción, y un veredicto de seguridad no puede compartir campo con un log.';
COMMENT ON COLUMN webhook_events.verificado IS
  'DeUna: true SOLO cuando `payment/info` confirmó. Lo escribe el buzón como DATO. NULL = no se verificó ⇒ no autentica (fail-closed).';
COMMENT ON COLUMN webhook_events.origen IS
  'webhook | barrido | consulta_activa. Nace para que el aplicador del barrido pueda autenticarse honestamente sin escribir `stoken_valido=true`, que sería firmar una verificación que no ocurrió. Su rama del gate todavía NO existe.';

-- ── ② EL SELLO DE NUVEI — BEFORE INSERT, una sola vez, inmutable después ───
CREATE OR REPLACE FUNCTION public._webhook_events_sella_credencial()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  /* Se sella en el INSERT y NUNCA MÁS. Esa es toda la cura: el `analisis_fallo`
     llega por UPDATE, y un UPDATE ya no puede tocar este veredicto.
     Si el llamador ya trajo la columna puesta (la edge del futuro), se respeta:
     el dato explícito le gana a la derivación del texto. */
  IF NEW.credencial IS NULL AND NEW.detalle IS NOT NULL THEN
    NEW.credencial := CASE
      WHEN NEW.detalle ILIKE '%credencial=SERVER%' THEN 'SERVER'
      WHEN NEW.detalle ILIKE '%credencial=CLIENT%' THEN 'CLIENT'
      ELSE NULL END;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_webhook_events_sella_credencial ON webhook_events;
CREATE TRIGGER trg_webhook_events_sella_credencial
  BEFORE INSERT ON webhook_events
  FOR EACH ROW EXECUTE FUNCTION public._webhook_events_sella_credencial();

-- ── ③ BACKFILL (veda 76(g) RIGE) ───────────────────────────────────────────
UPDATE webhook_events
   SET credencial = CASE
         WHEN detalle ILIKE '%credencial=SERVER%' THEN 'SERVER'
         WHEN detalle ILIKE '%credencial=CLIENT%' THEN 'CLIENT'
         ELSE NULL END
 WHERE credencial IS NULL AND detalle IS NOT NULL;

-- ── ④ EL GATE LEE COLUMNAS ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._evento_autenticado(p_evento webhook_events)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE p_evento.proveedor
    /* NUVEI · el stoken sigue mandando; lo que cambia es DE DÓNDE sale el
       veredicto de credencial: de una columna sellada al insertar, jamás de un
       campo de texto que después recibe mensajes de excepción. */
    WHEN 'nuvei' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.credencial = 'SERVER'
    /* DEUNA · las dos condiciones, jamás una: un webhook con el secreto
       correcto y datos falsos muere en la consulta. Y `verificado` es ahora un
       BOOLEAN que escribe quien emite el veredicto — NULL no autentica. */
    WHEN 'deuna' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.verificado IS TRUE
    /* 🔴 FAIL-CLOSED: un proveedor que nadie enseñó NO se autentica. */
    ELSE false
  END;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ARNÉS — el rojo se PRODUCE contra el gate viejo antes de curar, y el verde
-- se prueba con controles POSITIVOS, que es lo que distingue un gate que
-- discrimina de uno que rebota todo.
-- ═══════════════════════════════════════════════════════════════════════════
DO $arnes$
DECLARE
  v_sin_sello int; v_server int; v_client int; v_id uuid; v_cred text;
  v_deuna int; v_total int;
  /* 🔴 TIPADA, no `record` — es la lección de `20260822250000` aplicada el
     mismo día: pasarle un `record` a una función que espera un tipo compuesto
     revienta con `cannot cast type record to webhook_events`. */
  v_fila webhook_events;
BEGIN
  -- ① EL BACKFILL COMPLETO: ninguna fila con marca en el texto quedó sin sello
  SELECT count(*) INTO v_sin_sello FROM webhook_events
   WHERE credencial IS NULL
     AND (detalle ILIKE '%credencial=SERVER%' OR detalle ILIKE '%credencial=CLIENT%');
  IF v_sin_sello <> 0 THEN
    RAISE EXCEPTION 'ABORTA ①: % fila(s) con marca en el texto y sin sello', v_sin_sello;
  END IF;
  SELECT count(*) FILTER (WHERE credencial='SERVER'),
         count(*) FILTER (WHERE credencial='CLIENT'),
         count(*)
    INTO v_server, v_client, v_total FROM webhook_events;
  RAISE NOTICE '① BACKFILL: % SERVER · % CLIENT · % filas totales', v_server, v_client, v_total;
  IF v_server = 0 THEN
    RAISE EXCEPTION 'ABORTA ①: CERO filas SERVER — el backfill no midió nada y eso no es verde';
  END IF;

  -- ② 🔴 EL AGUJERO, CERRADO — el caso que ANTES daba true
  IF _evento_autenticado(ROW(gen_random_uuid(), now(), 'sandbox', 'nuvei', 'x',
        '{}'::jsonb, true, 'recibido',
        'analisis_fallo: fallo leyendo credencial=SERVER del header', NULL,
        NULL, NULL, 'webhook')::webhook_events) THEN
    RAISE EXCEPTION 'ABORTA ②: 🔴 un mensaje de excepcion SIGUE autenticando (nuvei)';
  END IF;
  IF _evento_autenticado(ROW(gen_random_uuid(), now(), 'sandbox', 'deuna', 'x',
        '{}'::jsonb, true, 'recibido',
        'analisis_fallo: TypeError {verificado=si}', NULL,
        NULL, NULL, 'webhook')::webhook_events) THEN
    RAISE EXCEPTION 'ABORTA ②: 🔴 un mensaje de excepcion SIGUE autenticando (deuna)';
  END IF;
  RAISE NOTICE '② EL AGUJERO CERRADO: el mensaje de excepcion ya NO autentica, en los dos proveedores';

  -- ③ 🔴 CONTROL POSITIVO — que el gate sepa decir que SÍ
  IF NOT _evento_autenticado(ROW(gen_random_uuid(), now(), 'sandbox', 'nuvei', 'x',
        '{}'::jsonb, true, 'recibido', 'receta=hmac · credencial=SERVER', NULL,
        'SERVER', NULL, 'webhook')::webhook_events) THEN
    RAISE EXCEPTION 'ABORTA ③: un nuvei LEGITIMO dejo de autenticar — el gate rebota todo';
  END IF;
  IF NOT _evento_autenticado(ROW(gen_random_uuid(), now(), 'sandbox', 'deuna', 'x',
        '{}'::jsonb, true, 'recibido', 'secreto=ok · verificado=si', NULL,
        NULL, true, 'webhook')::webhook_events) THEN
    RAISE EXCEPTION 'ABORTA ③: un deuna con verificado=true no autentica';
  END IF;
  RAISE NOTICE '③ CONTROL POSITIVO: los dos proveedores legitimos SIGUEN autenticando';

  -- ④ 🔴 EL SELLO ES INMUTABLE — el corazon de la cura, probado y no argumentado
  INSERT INTO webhook_events (proveedor, ambiente, transaction_id, payload,
                              stoken_valido, resultado, detalle)
  VALUES ('nuvei','sandbox','arnes-sello', '{}'::jsonb, true, 'recibido',
          'receta=hmac · credencial=CLIENT')
  RETURNING id INTO v_id;
  SELECT credencial INTO v_cred FROM webhook_events WHERE id = v_id;
  IF v_cred IS DISTINCT FROM 'CLIENT' THEN
    RAISE EXCEPTION 'ABORTA ④: el trigger no sello al insertar — dio %', v_cred;
  END IF;
  --  Y ahora el ataque: un UPDATE de diagnostico que TRAE la cadena buena.
  UPDATE webhook_events
     SET detalle = 'analisis_fallo: reintentando con credencial=SERVER'
   WHERE id = v_id;
  SELECT credencial INTO v_cred FROM webhook_events WHERE id = v_id;
  IF v_cred IS DISTINCT FROM 'CLIENT' THEN
    RAISE EXCEPTION 'ABORTA ④: 🔴 un UPDATE de diagnostico CAMBIO el veredicto a %', v_cred;
  END IF;
  SELECT * INTO v_fila FROM webhook_events WHERE id = v_id;
  IF _evento_autenticado(v_fila) THEN
    RAISE EXCEPTION 'ABORTA ④: 🔴 el evento autentico despues del UPDATE de diagnostico';
  END IF;
  RAISE NOTICE '④ SELLO INMUTABLE: un UPDATE de diagnostico con la cadena buena NO cambio el veredicto';

  DELETE FROM webhook_events WHERE id = v_id;
  IF EXISTS (SELECT 1 FROM webhook_events WHERE transaction_id = 'arnes-sello') THEN
    RAISE EXCEPTION 'ABORTA ⑤: residuo del fixture';
  END IF;

  -- ⑥ EL ESTADO DE DEUNA, DECLARADO Y NO SUPUESTO
  SELECT count(*) INTO v_deuna FROM webhook_events WHERE proveedor = 'deuna';
  IF v_deuna <> 0 THEN
    RAISE EXCEPTION 'ABORTA ⑥: hay % evento(s) de DeUna. La premisa de que exigir la columna es GRATIS depende de que sean CERO — con historia, este cambio los deja sin autenticar y hay que backfillearlos primero.', v_deuna;
  END IF;

  RAISE NOTICE 'ARNES 6/6 VERDE — el veredicto vive en columnas. Nuvei cerrado sin tocar la edge; DeUna exige la columna (0 eventos ⇒ costo cero, y el requisito queda MECANICO).';
END $arnes$;
