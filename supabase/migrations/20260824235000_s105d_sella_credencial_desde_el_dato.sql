-- ═══════════════════════════════════════════════════════════════════════════
-- S105-D · D-912 · EL SELLADOR DEJA DE LEER UN TEXTO Y PASA A ACEPTAR EL DATO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE.** Esta migración es DDL sobre funciones
-- y triggers; no hace backfill, no toca una sola fila de `webhook_events` ni de
-- ninguna tabla de dinero. No hay anclas que congelar.
--
-- REVERSA: escrita ANTES de aplicar, en
--   docs/relevamientos/S105-D-REVERSA-20260824235000-sellador-credencial.sql
--   ⚠️ Su nota dice con todas las letras que revertir REABRE D-912.
--
-- ── LA CAUSA, MEDIDA CONTRA EL OBJETO (no leída de la ficha) ────────────────
--
-- `_webhook_events_sella_credencial` es BEFORE INSERT y deriva la credencial de
-- `detalle` con ILIKE. Pero desde S103 el buzón **persiste antes de analizar**:
-- el INSERT escribe `detalle = 'crudo persistido antes de analizar'`, que no
-- contiene ningún `credencial=`. ⇒ la columna nace NULL, y el trigger sella
-- «una vez y nunca más».
--
-- Y `_evento_autenticado` exige, para nuvei:
--     coalesce(stoken_valido,false) AND credencial = 'SERVER'
-- ⇒ con `credencial` NULL da false ⇒ el actuador no toca el evento ⇒ queda en
-- `recibido` para siempre. **Es fail-closed** (no hay plata mal cobrada; hay
-- plata cobrada que la casa no registra) **y es 1 de 1 sobre el tráfico
-- posterior a la cura de S103.**
--
-- Medición del corte, por fecha (`webhook_events`, proveedor nuvei):
--     08-20/21 → SERVER sellado (25 filas): el buzón viejo insertaba UNA vez,
--                con el detalle ya completo, y la derivación funcionaba.
--     08-22    → CLIENT sellado (2): idem, antes de la cura.
--     08-23    → **(NULL) · stoken=true · recibido — 1 fila, 1 de 1.**
--
--   > La cura de S103 movió CUÁNDO se congela el veredicto, no DE DÓNDE sale.
--   > Cerró su modo de falla —un mensaje de excepción ya no puede autenticar—
--   > y abrió el simétrico: **un texto que todavía no está escrito tampoco
--   > puede producir el veredicto.**
--
-- ── 🔴 DOS HALLAZGOS QUE LA FICHA NO TENÍA, medidos acá y que cambian la cura ─
--
-- ① **EL COMENTARIO DEL TRIGGER VIEJO AFIRMA UNA PROPIEDAD QUE NO TIENE.**
--    Dice: *«Se sella en el INSERT y NUNCA MÁS … un UPDATE ya no puede tocar
--    este veredicto.»* **Medido: hay UN SOLO trigger en la tabla, y es BEFORE
--    INSERT.** Nada impide hoy que un UPDATE reescriba `credencial`.
--    Lo que S103 quitó fue la *derivación automática desde el texto* en UPDATE;
--    **la escritura explícita quedó libre.** *La propiedad real era más débil
--    que la escrita, y nadie lo iba a notar porque ningún camino la ejercía.*
--    ⇒ esta migración **hace verdadero el comentario**, con un guard de verdad.
--
-- ② **LA CURA INGENUA ROMPE EL BUZÓN ENTERO.** `pagos-webhook-stg` calcula
--    `credencial = esServer ? 'SERVER' : appCode ? 'CLIENT' : 'desconocida'`,
--    y el CHECK vivo es:
--        credencial IS NULL OR credencial IN ('SERVER','CLIENT')
--    ⇒ escribir `v.credencial` tal cual haría **fallar el UPDATE con
--    'desconocida'**, y el análisis entero caería al catch. *Sería cambiar un
--    evento sin veredicto por un evento sin análisis.* El mapeo
--    `'desconocida' → NULL` vive en la edge, y NULL es el valor correcto:
--    significa exactamente «no se pudo determinar».
--
-- ── LA CURA, EN DOS PIEZAS (la otra mitad es la edge) ───────────────────────
--
-- DB (acá):
--   (a) el BEFORE INSERT **deja de derivar del texto**. Era letra muerta desde
--       S103 —medido: no selló ni una de las filas nuevas— y es exactamente lo
--       que la lección de S103 prohíbe: *un campo que un humano lee para
--       diagnosticar no debe ser el que una función lee para autorizar.*
--       El INSERT sigue respetando la columna si el llamador la trae puesta.
--   (b) nace un guard **BEFORE UPDATE de una sola vía**:
--          NULL → valor    ✅ permitido  (el sellado tardío que D-912 necesita)
--          valor → mismo   ✅ permitido  (todo UPDATE que no toca la columna)
--          valor → otro    ⛔ PROHIBIDO
--          valor → NULL    ⛔ PROHIBIDO
--       *Un veredicto se emite una vez. Que se pueda emitir TARDE no es lo
--       mismo que se pueda CAMBIAR.*
--
-- Edge (`pagos-webhook-stg`, misma tanda): el UPDATE que ya escribe
--   `stoken_valido` pasa a escribir también `credencial`, con el mapeo de ②.
--   **El dato sale del payload del proveedor** (`app_code` termina en
--   `-SERVER`), no de un texto nuestro.
--
-- ⚠️ ORDEN DE APLICACIÓN (L-179): esta migración es **segura en cualquier
--    orden respecto del deploy**. Con la edge vieja, todo sigue como hoy
--    (NULL, fail-closed); con la edge nueva y sin migración, también funciona
--    pero sin candado. **Se aplica primero la migración y después la edge**,
--    para que la columna nunca esté escribible y poblada a la vez.
--
-- NO TOCA: `_evento_autenticado` · `aplicar_evento_de_pago` · el CHECK ·
--          los 4 eventos del grupo ① de D-912 (su reproceso es de A, y va
--          DESPUÉS de esto: reprocesar contra un sellador roto los deja igual).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── (a) EL SELLADOR: acepta el dato, ya no lee el texto ────────────────────
CREATE OR REPLACE FUNCTION public._webhook_events_sella_credencial()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  /* 🔴 LA DERIVACIÓN POR TEXTO MURIÓ ACÁ (D-912).
     Vivía como `NEW.detalle ILIKE '%credencial=SERVER%'` y desde S103 no
     sellaba nada: el buzón persiste ANTES de analizar, así que en el INSERT
     `detalle` dice 'crudo persistido antes de analizar' y nunca la credencial.
     Se retira por las dos razones juntas: **no funcionaba** y **no debía**
     —un campo de diagnóstico no es fuente de autorización, que es la lección
     madre de S103—.

     Lo que queda es lo único correcto: **si el llamador trae la columna, se
     respeta; si no, queda NULL**, y NULL significa «sin veredicto», que es
     distinto de 'CLIENT' y hace fail-closed en `_evento_autenticado`.

     El trigger se conserva (en vez de borrarse) para que este porqué viva
     donde alguien lo va a leer: en el objeto, no en un acta. */
  RETURN NEW;
END $function$;

COMMENT ON FUNCTION public._webhook_events_sella_credencial() IS
  'D-912: ya no deriva la credencial de `detalle`. La escribe quien la mide '
  '(la edge, desde el payload del proveedor). NULL = sin veredicto.';

-- ── (b) EL GUARD: el veredicto se emite una vez, y puede emitirse TARDE ────
CREATE OR REPLACE FUNCTION public._webhook_events_credencial_una_vez()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  /* Sellado de una sola vía. `IS DISTINCT FROM` y no `<>` a propósito: con
     `<>` un cambio a NULL daría NULL (ni verdadero ni falso) y **el guard
     dejaría pasar justo el caso de borrar un veredicto**. */
  IF OLD.credencial IS NOT NULL
     AND NEW.credencial IS DISTINCT FROM OLD.credencial THEN
    RAISE EXCEPTION
      'credencial_ya_sellada: % -> % (webhook_events.id=%)',
      OLD.credencial, coalesce(NEW.credencial,'NULL'), OLD.id
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $function$;

COMMENT ON FUNCTION public._webhook_events_credencial_una_vez() IS
  'D-912: NULL->valor permitido (sellado tardio). valor->otro y valor->NULL '
  'prohibidos. Hace verdadero lo que el trigger viejo AFIRMABA y no tenia.';

DROP TRIGGER IF EXISTS trg_webhook_events_credencial_una_vez ON public.webhook_events;
CREATE TRIGGER trg_webhook_events_credencial_una_vez
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW EXECUTE FUNCTION public._webhook_events_credencial_una_vez();

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — se prueba EN ROJO adentro de la transacción, sobre filas propias
-- que se borran acá mismo. **Si algo no discrimina, la migración ABORTA.**
-- (L-321: «el permiso está revocado» es una lectura; «rebotó con 42501» es un
--  hecho. Y L-406: el arnés que escribe corre en subtransacción que se deshace.)
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_id uuid;
  v_cred text;
  v_ok boolean;
BEGIN
  -- ① El INSERT ya NO deriva del texto: un detalle que lo dice queda en NULL.
  INSERT INTO public.webhook_events (ambiente, proveedor, payload, resultado, detalle)
  VALUES ('sandbox','nuvei','{"_cinturon":"s105d"}'::jsonb,'desconocido',
          'receta=x · credencial=SERVER · autenticado=true')
  RETURNING id INTO v_id;

  SELECT credencial INTO v_cred FROM public.webhook_events WHERE id = v_id;
  IF v_cred IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON ①: el texto todavia sella (credencial=%). '
      'La derivacion no murio.', v_cred;
  END IF;

  -- ② CONTROL POSITIVO: el dato explícito en el INSERT SÍ se respeta.
  --    Sin esto, ① pasaría también con un trigger que rompe todo sellado.
  DECLARE v_id2 uuid; v_cred2 text;
  BEGIN
    INSERT INTO public.webhook_events (ambiente, proveedor, payload, resultado, credencial)
    VALUES ('sandbox','nuvei','{"_cinturon":"s105d-2"}'::jsonb,'desconocido','SERVER')
    RETURNING id INTO v_id2;
    SELECT credencial INTO v_cred2 FROM public.webhook_events WHERE id = v_id2;
    IF v_cred2 IS DISTINCT FROM 'SERVER' THEN
      RAISE EXCEPTION 'CINTURON ②: el dato explicito NO se respeta (quedo %). '
        'El sellador estaria roto en la direccion contraria.', coalesce(v_cred2,'NULL');
    END IF;
    DELETE FROM public.webhook_events WHERE id = v_id2;
  END;

  -- ③ EL SELLADO TARDÍO FUNCIONA: NULL -> 'SERVER' por UPDATE. Es D-912.
  UPDATE public.webhook_events SET credencial = 'SERVER', stoken_valido = true
   WHERE id = v_id;
  SELECT credencial INTO v_cred FROM public.webhook_events WHERE id = v_id;
  IF v_cred IS DISTINCT FROM 'SERVER' THEN
    RAISE EXCEPTION 'CINTURON ③: el sellado tardio NO funciona (quedo %). '
      'D-912 seguiria viva.', coalesce(v_cred,'NULL');
  END IF;

  -- ④ ROJO PRODUCIDO: valor -> otro valor REBOTA.
  v_ok := false;
  BEGIN
    UPDATE public.webhook_events SET credencial = 'CLIENT' WHERE id = v_id;
  EXCEPTION WHEN insufficient_privilege THEN
    v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'CINTURON ④: se pudo CAMBIAR un veredicto ya sellado. '
      'El guard no discrimina.';
  END IF;

  -- ⑤ ROJO PRODUCIDO: valor -> NULL también REBOTA (el caso que `<>` dejaría pasar).
  v_ok := false;
  BEGIN
    UPDATE public.webhook_events SET credencial = NULL WHERE id = v_id;
  EXCEPTION WHEN insufficient_privilege THEN
    v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'CINTURON ⑤: se pudo BORRAR un veredicto ya sellado.';
  END IF;

  -- ⑥ Un UPDATE que NO toca la columna pasa (si no, el buzón no podría
  --    escribir `analisis_fallo` sobre un evento ya sellado).
  UPDATE public.webhook_events SET detalle = 'analisis_fallo: cinturon'
   WHERE id = v_id;

  -- Residuo 0: la fila de prueba se va.
  DELETE FROM public.webhook_events WHERE id = v_id;
  IF EXISTS (SELECT 1 FROM public.webhook_events
              WHERE payload->>'_cinturon' IS NOT NULL) THEN
    RAISE EXCEPTION 'CINTURON: quedo residuo de fixtures.';
  END IF;

  RAISE NOTICE 'CINTURON D-912: 6/6 verdes, residuo 0.';
END $cinturon$;

COMMIT;
