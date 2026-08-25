-- REVERSA de 20260824235000_s105d_sella_credencial_desde_el_dato.sql
-- Escrita ANTES de aplicar la migración (regla de la casa).
-- Pista S105-D · 24-ago-2026 · D-912.
--
-- ⚠️ QUÉ DESHACE Y QUÉ NO
--
-- DESHACE: vuelve `_webhook_events_sella_credencial` a su cuerpo del 22-ago
--          (derivación por texto en BEFORE INSERT) y RETIRA el guard de
--          UPDATE que esta migración crea.
--
-- 🔴 NO DESHACE — y hay que leerlo antes de correrla:
--
--   1. LOS DATOS. Toda `credencial` que se haya sellado por UPDATE mientras la
--      cura estuvo viva SE QUEDA COMO ESTÁ. No se puede distinguir por columna
--      cuál se selló antes y cuál después, así que esta reversa NO intenta
--      adivinarlo: revertir el código no revierte los veredictos ya escritos.
--
--   2. 🔴 REVERTIR REABRE D-912. Con el sellador viejo, todo evento nuevo de
--      Nuvei vuelve a nacer con `credencial = NULL` —porque el buzón persiste
--      antes de analizar y en el INSERT el texto todavía no existe— y por lo
--      tanto `_evento_autenticado` le da `false` para siempre.
--      ⇒ el cliente paga, Nuvei aprueba, y el pedido no avanza. **Sin síntoma.**
--
--   3. LA EDGE. Si se revierte esto SIN revertir `pagos-webhook-stg`, la edge
--      va a seguir escribiendo `credencial` en su UPDATE. Eso NO rompe nada
--      (sin guard, el UPDATE pasa) y de hecho D-912 seguiría curada por el lado
--      de la edge. **Lo que se pierde es el candado**: la columna vuelve a ser
--      libremente reescribible, que es justo lo que el comentario del trigger
--      viejo afirmaba tener y no tenía.
--
--   ⇒ El orden seguro de reversa completa es: revertir la edge PRIMERO
--     (redeploy de la versión previa), y esta migración DESPUÉS.

BEGIN;

DROP TRIGGER IF EXISTS trg_webhook_events_credencial_una_vez ON public.webhook_events;
DROP FUNCTION IF EXISTS public._webhook_events_credencial_una_vez();

-- El cuerpo exacto del 22-ago (20260822260000), restaurado tal cual.
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

COMMIT;
