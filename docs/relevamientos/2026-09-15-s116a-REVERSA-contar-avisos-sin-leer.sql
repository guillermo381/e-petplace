-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260915120000_s116a_contar_avisos_sin_leer.sql`
-- ESCRITA ANTES DE APLICAR (regla de la casa), y con su nota de qué NO deshace.
--
-- ⚠️ LO QUE ESTA REVERSA **SÍ** DESHACE: la función. Nada más, porque la
-- migración no crea nada más — es DDL puro, sin backfill, sin datos tocados.
--
-- ⚠️ LO QUE **NO** DESHACE, y por eso está escrito: **revertir la base sin
-- revertir el bundle deja la campana sin contador.** El wrapper llamaría a una
-- RPC que ya no existe y el lector caería a 0 — o sea, la campana diría «no hay
-- nada» con avisos sin leer. *Es el silencio que `D-1120` vino a sacar.*
-- ⇒ si esto se revierte, se revierte también el bundle que la consume, o se
--   acepta a sabiendas que el número desaparece.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.contar_avisos_sin_leer();

DO $cint$
BEGIN
  IF to_regprocedure('public.contar_avisos_sin_leer()') IS NOT NULL THEN
    RAISE EXCEPTION 'reversa incompleta: la función sigue viva';
  END IF;
  -- CONTROL POSITIVO: el instrumento ve funciones de verdad, así que su «no
  -- está» significa algo. Sin esto, un `to_regprocedure` roto daría verde.
  IF to_regprocedure('public.obtener_mis_avisos(integer)') IS NULL THEN
    RAISE EXCEPTION 'reversa: el control positivo falló — este censo no ve nada';
  END IF;
  RAISE NOTICE 'reversa verde: la función no está y el censo sí ve';
END $cint$;

COMMIT;
