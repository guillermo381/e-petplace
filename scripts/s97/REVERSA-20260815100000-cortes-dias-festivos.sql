-- REVERSA de 20260815100000_s97a_cortes_dias_festivos.sql
-- ESCRITA ANTES DE APLICAR.
--
-- QUÉ DESHACE: quita `dias_semana` e `incluye_festivos` de
-- `entrega_turnos`, con sus CHECKs.
--
-- 🔴 QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
--   · **Se pierde lo que cada vendedor haya configurado.** Al volver, todo
--     corte vuelve a aplicar TODOS los días — que es el estado de hoy, así
--     que **no rompe nada operativo**, pero **borra decisiones reales**: el
--     que había dicho «sábados no» vuelve a entregar sábados **sin que nadie
--     se lo avise**.
--   · *Por eso la reversa no es simétrica con el backfill:* el backfill
--     escribe lo que ya era cierto (todos los días); la reversa borra lo que
--     alguien decidió después.
--   · ⚠️ Si ya hay filas con `dias_semana` distinto del set completo, **la
--     reversa se corre después de exportarlas**, o se pierde la
--     configuración sin registro.

BEGIN;

ALTER TABLE public.entrega_turnos
  DROP CONSTRAINT IF EXISTS chk_ret_dias_semana_validos,
  DROP CONSTRAINT IF EXISTS chk_ret_dias_semana_sin_repetidos;

ALTER TABLE public.entrega_turnos
  DROP COLUMN IF EXISTS dias_semana,
  DROP COLUMN IF EXISTS incluye_festivos;

-- La función del CHECK muere con su único consumidor.
DROP FUNCTION IF EXISTS public._dias_sin_repetidos(smallint[]);

COMMIT;
