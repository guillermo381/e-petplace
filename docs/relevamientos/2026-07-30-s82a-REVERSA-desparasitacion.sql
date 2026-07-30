-- REVERSA de 20260730010000_s82_desparasitacion.sql — escrita ANTES.
--
-- NOTA DE DATOS: revertir BORRA toda desparasitación declarada (tabla
-- tipada) y sus eventos padre. Si hay filas reales, exportar primero:
--   SELECT * FROM evento_desparasitacion_aplicada;

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_desparasitacion(uuid, text, text, date, date, text);

-- los padres del tipo (huérfanos tras el DROP de la tipada)
DELETE FROM public.eventos_mascota WHERE tipo = 'desparasitacion_aplicada';

DROP TABLE IF EXISTS public.evento_desparasitacion_aplicada;
DROP FUNCTION IF EXISTS public._trg_desparasitacion_crear_evento();

-- la fila del catálogo (regla S67: correr verificar_coherencia_tablas_tipadas() tras esto — debe dar 0)
DELETE FROM public.cat_tipos_evento WHERE codigo = 'desparasitacion_aplicada';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evento_desparasitacion_aplicada') THEN
    RAISE EXCEPTION 'reversa incompleta: la tabla sigue viva';
  END IF;
END $$;

COMMIT;
