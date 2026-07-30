-- REVERSA de 20260730121000_s82_dias_cerrados.sql — escrita ANTES.
--
-- NOTA DE DATOS: revertir BORRA los días cerrados que cada negocio haya
-- declarado. Exportar primero si hay filas reales:
--   SELECT prestador_id, dia_semana, motivo FROM prestador_dias_cerrados;
-- La tabla nace VACÍA (0 filas al aplicar), así que revertir el mismo
-- día es inocuo.

BEGIN;

DROP FUNCTION IF EXISTS public.declarar_dia_cerrado(uuid, integer, boolean, text);
DROP FUNCTION IF EXISTS public.obtener_dias_cerrados(uuid);
DROP TABLE IF EXISTS public.prestador_dias_cerrados;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='prestador_dias_cerrados') THEN
    RAISE EXCEPTION 'reversa incompleta: la tabla sigue viva';
  END IF;
END $$;

COMMIT;
