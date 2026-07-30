-- REVERSA de 20260730011000_s82_alergias_ninguna_declarada.sql — escrita ANTES.
--
-- NOTA DE DATOS: revertir BORRA las declaraciones "ninguna alergia
-- conocida" (fecha + quién). Exportar primero si hay reales:
--   SELECT mascota_id, alergias_ninguna_declarada_en, alergias_ninguna_declarada_por
--     FROM mascota_perfil_vigente WHERE alergias_ninguna_declarada_en IS NOT NULL;

BEGIN;

DROP FUNCTION IF EXISTS public.declarar_sin_alergias_conocidas(uuid);

ALTER TABLE public.mascota_perfil_vigente
  DROP CONSTRAINT IF EXISTS chk_alergias_ninguna_coherente;

ALTER TABLE public.mascota_perfil_vigente
  DROP COLUMN IF EXISTS alergias_ninguna_declarada_en,
  DROP COLUMN IF EXISTS alergias_ninguna_declarada_por;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_schema='public' AND table_name='mascota_perfil_vigente'
     AND column_name LIKE 'alergias_ninguna%';
  IF n <> 0 THEN RAISE EXCEPTION 'reversa incompleta: quedan % columnas', n; END IF;
END $$;

COMMIT;
