-- REVERSA de 20260822010000 — el puntero a la cita y el invariante. ESCRITA ANTES.
--
-- 🔴 QUÉ NO DESHACE:
-- ① Si para entonces existen intentos de CITA, el `DROP COLUMN cita_id` **los
--    deja huérfanos de sujeto** — el intento queda sin apuntar a nada y su
--    plata sin objeto. Por eso la reversa **aborta si hay alguno**, en vez de
--    borrar en silencio.
-- ② Quitar el CHECK **reintroduce el estado que la migración vino a hacer
--    imposible**: un intento apuntando a dos objetos o a ninguno. *La reversa
--    no es neutra: devuelve el camino de la despensa a vivir por disciplina.*

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pagos_intentos WHERE cita_id IS NOT NULL;
  IF v_n > 0 THEN
    RAISE EXCEPTION
      'NO SE PUEDE REVERTIR: % intentos apuntan a una cita. Borrar la columna '
      'los dejaría sin sujeto. Decidir qué se hace con ellos ANTES.', v_n;
  END IF;
END $$;

DROP INDEX IF EXISTS public.uq_pagos_intentos_tx_por_cita;
ALTER TABLE public.pagos_intentos DROP CONSTRAINT IF EXISTS chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS cita_id;
