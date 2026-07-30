-- REVERSA de 20260730120000_s82_plan_vacunal.sql — escrita ANTES.
--
-- NOTA DE DATOS (76(g) RIGE en la ida — hay backfill):
--  · `evento_vacuna_aplicada.vacuna_codigo` se backfillea desde
--    `tipo_vacuna` (22 de 32 filas medidas al escribir esto). Revertir
--    BORRA ese puente; el dato de origen (`tipo_vacuna`) NO se toca en
--    la ida, así que el backfill es RE-EJECUTABLE sin pérdida.
--  · `cat_plan_vacunal` es catálogo NUEVO: revertir borra el plan base
--    entero (11 filas sembradas). Si alguien lo editó, exportar antes:
--      SELECT * FROM cat_plan_vacunal;

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_plan_vacunal(uuid);
DROP FUNCTION IF EXISTS public._proxima_vacuna_derivada(date, integer);

ALTER TABLE public.evento_vacuna_aplicada DROP COLUMN IF EXISTS vacuna_codigo;

DROP TABLE IF EXISTS public.cat_plan_vacunal;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cat_plan_vacunal') THEN
    RAISE EXCEPTION 'reversa incompleta: cat_plan_vacunal sigue viva';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='evento_vacuna_aplicada' AND column_name='vacuna_codigo') THEN
    RAISE EXCEPTION 'reversa incompleta: vacuna_codigo sigue viva';
  END IF;
END $$;

COMMIT;
