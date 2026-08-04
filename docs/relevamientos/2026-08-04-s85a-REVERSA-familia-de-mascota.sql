-- REVERSA de 20260804070000_s85_familia_de_mascota.sql · escrita ANTES.
-- Retira la RPC. NO toca datos, policies ni la RLS de `familia`/`familia_miembro`.
-- ⚠️ Revertir deja al consumidor llamando a una función que no existe: la ficha
-- de la mascota pierde "quién la cuida". No reabre ningún agujero — al
-- contrario: vuelve al estado donde el prestador NO puede leer la familia por
-- ningún camino (la RLS nunca lo nombró).
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_familia_de_mascota(uuid);
DO $$
BEGIN
  IF to_regprocedure('public.obtener_familia_de_mascota(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA.';
  END IF;
  RAISE NOTICE 'reversa OK.';
END $$;
COMMIT;
