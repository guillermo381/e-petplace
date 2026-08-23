-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260822260000_s103_el_veredicto_deja_de_vivir_en_un_log.sql`
-- Escrita ANTES de aplicar. S103-A · 22-ago-2026.
--
-- 🔴 QUÉ REPONE: **que un mensaje de excepción autentique un evento de pago.**
--
-- La migración movió el veredicto de autenticación de un `ILIKE` sobre
-- `detalle` —campo de texto libre que el buzón usa para contar qué falló— a
-- columnas propias. Revertirla devuelve el gate a leer el log.
--
-- **Reproducido antes de curar, en SELECT puro y en LOS DOS proveedores:**
--   `analisis_fallo: TypeError al parsear {secreto=ok, verificado=si} …` → true
--   `analisis_fallo: fallo leyendo credencial=SERVER del header`        → true
--   controles (`verificado=no`, `credencial=CLIENT`)                    → false
--
-- ⚠️ **SEVERIDAD MEDIDA, para que la reversa se decida con el número y no con
--    el susto:** el agujero **NO es explotable solo** — medido, sin
--    `stoken_valido` da `false` en los cinco casos. Quien lo use **ya tiene el
--    secreto**. Es erosión de defensa en profundidad, no una puerta abierta.
--
-- ── 🔴 Y LO QUE ESTA REVERSA ROMPE ADEMÁS DE REPONER EL AGUJERO ────────────
-- Si DeUna ya está vivo cuando esto se corra, **revertir NO devuelve el gate
-- viejo funcionando**: el gate viejo lee `detalle ILIKE '%verificado=si%'`, y
-- si para entonces la edge de DeUna escribe el veredicto **en la columna y ya
-- no en el texto**, el `ILIKE` no encuentra nada ⇒ **ningún evento de DeUna
-- autentica.** *Revertir una migración de datos no revierte a los productores
-- que se adaptaron a ella.*
-- ⇒ **antes de correr esto, medir si la edge de DeUna escribe `verificado`.**
--
-- Las columnas NO se borran: dejarlas vacías no molesta a nadie, y borrarlas
-- perdería el backfill de las 64 filas históricas, que se derivó de un texto
-- que puede haber cambiado.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP TRIGGER IF EXISTS trg_webhook_events_sella_credencial ON webhook_events;
DROP FUNCTION IF EXISTS _webhook_events_sella_credencial();

CREATE OR REPLACE FUNCTION public._evento_autenticado(p_evento webhook_events)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE p_evento.proveedor
    WHEN 'nuvei' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.detalle ILIKE '%credencial=SERVER%'
    WHEN 'deuna' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.detalle ILIKE '%verificado=si%'
    ELSE false
  END;
$function$;

DO $rev$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = '_evento_autenticado';
  IF position('credencial = ''SERVER''' in v_def) > 0 THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: el gate sigue leyendo la columna';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_webhook_events_sella_credencial') THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: el trigger sigue vivo';
  END IF;
  RAISE NOTICE 'REVERSA VERDE — el gate vuelve a leer el log. El agujero esta repuesto.';
END $rev$;

COMMIT;
