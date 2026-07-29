-- REVERSA de 20260729233000_s82_foto_encuadre_mascota.sql
-- Escrita ANTES de aplicar (disciplina S77+).
--
-- NOTA DE DATOS: revertir el DDL BORRA los encuadres que las familias
-- hayan declarado (cx/cy/z por mascota). No hay tabla espejo: el dato
-- se pierde. Si al momento de revertir hay encuadres reales declarados
-- (foto_cx <> 0.5 OR foto_cy <> 0.42 OR foto_z <> 1.3), exportarlos
-- primero:
--   SELECT id, foto_cx, foto_cy, foto_z FROM public.mascotas
--    WHERE foto_cx <> 0.5 OR foto_cy <> 0.42 OR foto_z <> 1.3;

BEGIN;

DROP FUNCTION IF EXISTS public.declarar_foto_mascota(uuid, numeric, numeric, numeric, text);

ALTER TABLE public.mascotas
  DROP CONSTRAINT IF EXISTS mascotas_foto_cx_rango,
  DROP CONSTRAINT IF EXISTS mascotas_foto_cy_rango,
  DROP CONSTRAINT IF EXISTS mascotas_foto_z_rango;

ALTER TABLE public.mascotas
  DROP COLUMN IF EXISTS foto_cx,
  DROP COLUMN IF EXISTS foto_cy,
  DROP COLUMN IF EXISTS foto_z;

-- Verificación: las tres columnas afuera
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'mascotas'
     AND column_name IN ('foto_cx', 'foto_cy', 'foto_z');
  IF n <> 0 THEN
    RAISE EXCEPTION 'reversa incompleta: quedan % columnas de encuadre', n;
  END IF;
END $$;

COMMIT;
