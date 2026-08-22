-- ═══════════════════════════════════════════════════════════════════════════
-- S102-B · CURA 1 — LA FILA CO DEL 14 % SE CIERRA (desactivada CON MARCA)
--
-- 🔴 ESTADO: **PREPARADA Y NO APLICADA.** Vive en docs/relevamientos/ a
--    propósito: en supabase/migrations/ un `db push` la barrería sin firma, y
--    además desemparejaría el contador local↔remoto que el canon mide.
--    **A la mueve a supabase/migrations/ el día que el founder firme el apply.**
--
-- ORIGEN: firma founder #1, 21-ago-2026 (relevo 2, punto 6), verbatim:
--    «la fila CO del 14 % SE CIERRA: desactivada con marca, no borrada.
--     Colombia no está en v1; el día que abra, su fee nace con firma propia
--     y base declarada.»
--
-- TERRITORIO: la DB es de la pista A. B la REDACTA; **A la aplica.** (§6 del
--    método: se declara y se pide, no se clona.)
--
-- ── DECLARACIÓN 76(g) — VEDA: **NO RIGE**, con su porqué medido ─────────────
--    Ningún paso computa anclas sobre datos vivos. Es un UPDATE de UNA fila de
--    configuración, y su verificación consulta el resolutor, no un snapshot de
--    datos de usuario. **Medido 21-ago: `resolver_comision_despensa` tiene CERO
--    consumidores** (censo en DB + grep en apps/, packages/, supabase/functions/,
--    scripts/) y **el ledger tiene CERO eventos de `pedido`** ⇒ no hay cómputo
--    vivo que dependa de esta fila. Si al aplicar eso ya no fuera cierto, la
--    veda pasa a regir y esta declaración se re-escribe.
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ① LA REVERSA — ESCRITA ANTES DE APLICAR NADA                              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- QUÉ DESHACE: devuelve la fila CO a su estado exacto de hoy (activa, sin
--              vigencia_hasta, sin nota).
--
-- ⚠️ QUÉ **NO** DESHACE, y hay que saberlo antes de aplicar:
--    · `fee_configs_historial` conserva las DOS escrituras (el cierre y su
--      reversa). El trigger `trg_audit_fee_configs` es AFTER INSERT OR DELETE
--      OR UPDATE — verificado en el objeto. **Eso es deseable: la marca del
--      cierre sobrevive aunque se revierta.**
--    · Si entre el apply y la reversa alguien resolvió un fee de CO, el evento
--      económico resultante NO se toca. Hoy es imposible (cero consumidores),
--      pero la reversa no puede prometer lo que no controla.

/*  ── REVERSA (no ejecutar salvo que haya que revertir) ──
UPDATE public.fee_configs
   SET activo         = true,
       vigencia_hasta = NULL,
       notas          = NULL
 WHERE id = '3b75b736-a0c1-4a4a-ba70-a749b08b1554';

DO $rev$
BEGIN
  IF (public.resolver_comision_despensa('CO', now())->>'pct')::numeric IS DISTINCT FROM 14.00 THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: CO no volvió a resolver 14.00';
  END IF;
END $rev$;
*/


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ② LA MIGRACIÓN                                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

BEGIN;

-- ── Guard de identidad: la fila tiene que ser LA que se midió ───────────────
-- Sin esto, un id que cambió de significado se edita en silencio.
DO $guard$
DECLARE v_pct numeric; v_pais text; v_origen text; v_activo boolean; v_hasta timestamptz;
BEGIN
  SELECT (parametros->>'pct')::numeric, country_code, tipo_origen, activo, vigencia_hasta
    INTO v_pct, v_pais, v_origen, v_activo, v_hasta
    FROM public.fee_configs
   WHERE id = '3b75b736-a0c1-4a4a-ba70-a749b08b1554';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ABORTA: la fila CO no existe. Nada que cerrar — releer antes de tocar.';
  END IF;
  IF v_pct IS DISTINCT FROM 14.00 OR v_pais <> 'CO' OR v_origen <> 'pedido'
     OR v_activo IS NOT TRUE OR v_hasta IS NOT NULL THEN
    RAISE EXCEPTION
      'ABORTA: la fila no es la medida el 21-ago (pct=% pais=% origen=% activo=% hasta=%). La firma se dio sobre OTRO estado.',
      v_pct, v_pais, v_origen, v_activo, v_hasta;
  END IF;
END $guard$;

-- ── El cierre: DESACTIVADA CON MARCA, JAMÁS BORRADA ────────────────────────
-- `activo=false` es lo que la saca del resolutor.
-- `vigencia_hasta` deja la historia coherente: rigió hasta hoy.
-- `notas` es la MARCA — el porqué viaja con el dato, no solo en un acta.
UPDATE public.fee_configs
   SET activo         = false,
       vigencia_hasta = now(),
       notas          = 'S102-B (21-ago-2026): CERRADA por firma del founder. '
                     || 'Llevaba el 14 % DEROGADO (S95 firmó 10 % para EC y cerró la fila EC, '
                     || 'y esta quedo abierta) y ademas NO declaraba `base`, exenta del CHECK '
                     || 'chk_fee_pedido_declara_base porque nacio NOT VALID. '
                     || 'Colombia no esta en v1 (MODELO_DESPENSA: USD/Ecuador). '
                     || 'El dia que CO abra, su fee NACE DE CERO con firma propia y base declarada '
                     || '— esta fila NO se reactiva.'
 WHERE id = '3b75b736-a0c1-4a4a-ba70-a749b08b1554';

-- ── CINTURÓN, con DISCRIMINADOR ────────────────────────────────────────────
-- No basta con que CO deje de resolver: hay que probar que EC NO se movió.
-- Un cinturón que solo mira lo que cambió no distingue "cerré CO" de "rompí todo".
DO $cinturon$
DECLARE v_co jsonb; v_ec jsonb; v_n int;
BEGIN
  v_co := public.resolver_comision_despensa('CO', now());
  v_ec := public.resolver_comision_despensa('EC', now());

  IF v_co IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: CO sigue resolviendo un fee: %', v_co::text;
  END IF;

  -- EL DISCRIMINADOR: si esto también fallara, el cinturón de arriba no probaría nada.
  IF (v_ec->>'pct')::numeric IS DISTINCT FROM 10
     OR v_ec->>'base' IS DISTINCT FROM 'total_con_impuesto' THEN
    RAISE EXCEPTION 'ABORTA: EC dejó de resolver 10 %% con base total_con_impuesto: %', v_ec::text;
  END IF;

  -- La marca quedó en el historial: "no borrada" se PRUEBA, no se declara.
  SELECT count(*) INTO v_n FROM public.fee_configs_historial
   WHERE fee_config_id = '3b75b736-a0c1-4a4a-ba70-a749b08b1554';
  IF v_n = 0 THEN
    RAISE EXCEPTION 'ABORTA: el cierre no dejó rastro en fee_configs_historial.';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — CO: NULL · EC: 10 %% base total_con_impuesto · historial: % filas', v_n;
END $cinturon$;

COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- ③ LO QUE ESTA CURA **NO** HACE — declarado, no omitido
-- ═══════════════════════════════════════════════════════════════════════════
--
-- · NO valida el CHECK `chk_fee_pedido_declara_base`. Sigue NOT VALID. Al
--   cerrar la fila CO, **la única fila de `pedido` viva pasa a ser la del 10 %,
--   que SÍ declara base** ⇒ validarlo se vuelve posible sin romper nada.
--   **Se deja fuera a propósito:** es una decisión aparte y merece su firma.
--   El comando sería: ALTER TABLE public.fee_configs VALIDATE CONSTRAINT
--   chk_fee_pedido_declara_base;   (y su reversa no existe — un CHECK validado
--   no se "des-valida"; se dropea y se recrea NOT VALID.)
--
-- · NO toca la fila EC del 14 % ya cerrada (`7fb48cd6…`). Su `vigencia_hasta`
--   la sacó del resolutor en S95 y su `activo` sigue en true a propósito:
--   es historia, y el resolutor la ignora por fecha.
--
-- · NO toca el 15 % de servicios (EC ni CO). Fuera de alcance de la firma.
