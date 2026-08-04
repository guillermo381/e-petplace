-- REVERSA de 20260804050000_s85_d639_expediente_modulado.sql · escrita ANTES.
--
-- Retira la RPC. NO toca datos ni policies: solo LEE.
--
-- ⚠️ REVERTIR **REABRE EL AGUJERO DE PRIVACIDAD** que la migración cierra, y
-- por eso pide que D-639 vuelva a 🔴 en el mismo acto — igual que la reversa de
-- la zona aproximada en S84.
-- *Sin la RPC, el único camino al expediente es la RLS, que concede la FILA
-- ENTERA: un prestador vuelve a leer el CONTENIDO de los aportes de otro.*
-- **Medido antes de curar: 84 de 85 aportes de A con su contenido visible para B.**

BEGIN;
DROP FUNCTION IF EXISTS public.obtener_expediente_modulado(uuid);
DO $$
BEGIN
  IF to_regprocedure('public.obtener_expediente_modulado(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: la función sigue viva.';
  END IF;
  RAISE WARNING '⚠️ D-639 VUELVE A 🔴 — el expediente se concede entero otra vez.';
END $$;
COMMIT;
