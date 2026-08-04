-- REVERSA de 20260804010000_s85_plata_del_dia.sql · escrita ANTES de aplicar.
--
-- Retira la RPC. NO toca datos: solo LEE.
--
-- ⚠️ Revertir deja al consumidor (`obtenerPlataDelDia`) llamando a una función
-- que no existe — el rebote le llega al prestador al abrir su portada. Los dos
-- cuerpos se mueven juntos.
--
-- Y lo que NO devuelve la reversa: el `precio` de las citas SIGUE siendo
-- legible por la RLS para quien ve la cita (D-641). Esta función nunca fue la
-- puerta del dato: fue la puerta del TOTAL.

BEGIN;
DROP FUNCTION IF EXISTS public.obtener_plata_del_dia(uuid, date);
DO $$
BEGIN
  IF to_regprocedure('public.obtener_plata_del_dia(uuid, date)') IS NOT NULL THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: la función sigue viva.';
  END IF;
  RAISE NOTICE 'reversa OK.';
END $$;
COMMIT;
