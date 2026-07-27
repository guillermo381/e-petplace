-- REVERSA de la migracion S78-A4 (trigger de herencia de chips, §6.1
-- LETRA_RECEPCION_S76). Escrita ANTES de aplicar, el 26-jul-2026.
--
-- La migracion es ADITIVA PURA: crea UNA funcion y UN trigger, y no toca
-- ninguna fila existente. Por eso la reversa es simetrica y completa.
--
-- NOTA HONESTA: revertir el CODIGO no revierte los DATOS. Los chips que
-- el trigger haya heredado a ofertas nuevas QUEDAN escritos en
-- prestador_empleado_servicios; esta reversa solo apaga la herencia
-- FUTURA. Si ademas se quisieran retirar esos chips, es una decision de
-- producto (le quita disponibilidad a gente que hoy la tiene) y pide su
-- propio DELETE con censo previo — jamas se hace de arrastre.

DROP TRIGGER IF EXISTS trg_ps_hereda_chips ON public.prestador_servicios;
DROP FUNCTION IF EXISTS public._trg_ps_hereda_chips();
