-- REVERSA de 20260822020000 — `cita_desglose`. ESCRITA ANTES.
--
-- 🔴 QUÉ NO DESHACE: **borra los desgloses congelados que existan.** Y un
--    desglose congelado no es un cálculo que se pueda rehacer: es **lo que se
--    le prometió al cliente en el momento de reservar**. Si el precio del
--    servicio cambió desde entonces, recalcularlo da otro número — y ése ya no
--    es el que se cobró.
--    ⇒ Por eso la reversa **aborta si hay filas**, en vez de borrarlas.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM cita_desglose;
  IF v_n > 0 THEN
    RAISE EXCEPTION
      'NO SE PUEDE REVERTIR: % desgloses congelados. Son lo que se le prometió '
      'al cliente al reservar y NO se pueden recalcular.', v_n;
  END IF;
END $$;

DROP TABLE IF EXISTS public.cita_desglose;
