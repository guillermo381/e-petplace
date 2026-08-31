-- REVERSA de 20260905240000_s109b_d984_el_selector_sin_consumidor.sql
-- ESCRITA ANTES DE APLICAR.
--
-- ⚠️ QUÉ NO DESHACE: revertir devuelve al timbre de guardería su `ok:true`
--    sobre un posteo que la edge ignora. **No rompe nada visible — y eso es el
--    problema**: vuelve a ser un cron que dice que ejecutó sobre un sujeto que
--    nadie cobra. El motivo por el que hoy se niega es que NO tiene consumidor.
--
--    `selectores_recurrentes_vivos` la consume `scripts/verify-selectores-
--    recurrentes.mjs`: revertir la base deja ese gate sin su lector y el gate
--    sale NO CONCLUYENTE (exit 2), que es lo correcto — jamás verde.

BEGIN;
DROP FUNCTION IF EXISTS public.selectores_recurrentes_vivos();
-- `ejecutar_renovaciones_guarderia`: re-aplicar su cuerpo de 20260904120000.
COMMIT;
