-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260907660000_s111a_bitacora_del_prestador.sql
-- ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUÉ **NO** DESHACE:
--   · Las bitácoras que el prestador YA escribió NO se borran. Son eventos del
--     Bio-Expediente con procedencia `declarado_por_prestador`: **observaciones
--     reales sobre un animal real**. Revertir el motor no las convierte en
--     falsas.
--   · Por eso el DROP de la columna está CONDICIONADO: si hay una sola fila
--     con `estadia_id`, la reversa **aborta y lo dice**. *Una reversa que borra
--     el ancla de un dato vivo lo deja huérfano y silencioso.*
--   · Los chips ya colgados quedan: cuelgan de la bitácora, no de la columna.
-- ══════════════════════════════════════════════════════════════════════════
BEGIN;

DO $rev$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.evento_bitacora_familia WHERE estadia_id IS NOT NULL;
  IF v_n > 0 THEN
    RAISE EXCEPTION
      'REVERSA ABORTADA: hay % bitacora(s) del prestador ancladas a una estadia. Borrar la columna las deja huerfanas. Decidir que hacer con ellas ANTES de revertir.', v_n;
  END IF;
END $rev$;

DROP FUNCTION IF EXISTS public.registrar_bitacora_guarderia(uuid, jsonb, text);
DROP INDEX IF EXISTS public.uq_bitacora_por_estadia;
ALTER TABLE public.evento_bitacora_familia DROP COLUMN IF EXISTS estadia_id;

COMMIT;
