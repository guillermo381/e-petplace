-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260821050000_s101b_alias_tarjeta.sql`
-- Escrita ANTES de aplicar la migración (regla de la casa).
--
-- 🔴 QUÉ NO DESHACE, y hay que decirlo antes de correrla:
--
--  ① **BORRA LOS ALIAS QUE LAS FAMILIAS HAYAN ESCRITO.** No es metadata
--     derivable: es texto que una persona tipeó para reconocer su propia
--     tarjeta. **No se puede reconstruir de ningún lado.**
--     ⇒ Antes de revertir, si hay filas con alias, se exportan. Si no se
--       exportan, se pierden.
--
--  ② Las tarjetas NO se tocan: siguen guardadas y siguen cobrando. Lo que se
--     pierde es cómo la familia las llamaba.
--
--  ③ Si el endpoint o la página siguen mandando `alias`, la llamada **no
--     falla**: el parámetro se ignora. *Es aditivo en las dos puntas, así que
--     revertir la base no rompe el flujo — solo lo vuelve mudo.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Antes de correr esto en serio:
--   SELECT id, alias FROM public.tarjetas_guardadas WHERE alias IS NOT NULL;

DROP FUNCTION IF EXISTS public.resolver_alta_tarjeta(uuid, text, text, text, text, text, text, text, text, boolean, text);

-- Se restaura la firma de 10 parámetros (sin alias).
-- El cuerpo vive en `supabase/migrations/20260821040000_s101b_altas_tarjeta.sql`:
-- revertir exige re-aplicar ESA definición, no improvisarla.

ALTER TABLE public.tarjetas_guardadas DROP COLUMN IF EXISTS alias;

COMMIT;
