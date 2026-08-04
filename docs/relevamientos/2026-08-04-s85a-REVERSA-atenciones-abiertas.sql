-- REVERSA de 20260804090000_s85_atenciones_abiertas.sql · escrita ANTES.
-- Retira la RPC. NO toca datos: solo LEE.
-- ⚠️ Revertir deja "Necesita tu atención" sin su cuarta fuente — y con ella se
-- pierde de vista la ÚNICA atención terminada sin cerrar que hay hoy (19 días,
-- plata que no devengó). El defecto no se nota: la franja simplemente muestra
-- menos, y menos se lee como "no hay nada pendiente".
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_atenciones_abiertas(uuid, integer);
DO $$
BEGIN
  IF to_regprocedure('public.obtener_atenciones_abiertas(uuid, integer)') IS NOT NULL THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA.';
  END IF;
  RAISE NOTICE 'reversa OK.';
END $$;
COMMIT;
