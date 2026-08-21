-- REVERSA de 20260822030000 — el congelador del desglose. ESCRITA ANTES.
--
-- 🔴 QUÉ NO DESHACE: **los desgloses ya congelados quedan** (y está bien: son
--    lo que se le prometió al cliente). Lo que se apaga es que NAZCAN.
-- 🔴 Y LO QUE REINTRODUCE: sin congelador, toda cita nueva nace **sin
--    desglose** ⇒ la compuerta 2 del motor rebota fail-closed y **ninguna cita
--    nueva se puede cobrar**. *Revertir esto no deja las cosas como estaban:
--    deja el cobro de citas apagado.*
DROP TRIGGER IF EXISTS trg_cita_congela_desglose ON public.evento_cita_servicio;
DROP FUNCTION IF EXISTS public._trg_cita_congela_desglose();
