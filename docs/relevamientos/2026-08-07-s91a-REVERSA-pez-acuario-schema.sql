-- REVERSA de 20260807173000_s91a_pez_acuario_schema.sql (escrita ANTES de aplicar)
-- ⚠️ Nota de datos: revertir BORRA la marca de sistema y el tipo de agua de
-- todo acuario nacido después de aplicar la migración — esas filas quedarían
-- indistinguibles de una mascota individual. Al aplicar la migración había
-- 0 mascotas especie='pez' (medido); si al revertir hay acuarios vivos, la
-- reversa destruye dato de usuario y ESO SE DECLARA antes de correrla:
--   SELECT count(*) FROM mascotas WHERE sujeto = 'acuario';

BEGIN;

ALTER TABLE public.mascotas DROP CONSTRAINT IF EXISTS chk_mascotas_sujeto;
ALTER TABLE public.mascotas DROP CONSTRAINT IF EXISTS chk_mascotas_acuario_solo_pez;
ALTER TABLE public.mascotas DROP CONSTRAINT IF EXISTS chk_mascotas_acuario_sin_raza;
ALTER TABLE public.mascotas DROP CONSTRAINT IF EXISTS chk_mascotas_tipo_agua;
ALTER TABLE public.mascotas DROP CONSTRAINT IF EXISTS chk_mascotas_tipo_agua_solo_acuario;
ALTER TABLE public.mascotas DROP COLUMN IF EXISTS tipo_agua;
ALTER TABLE public.mascotas DROP COLUMN IF EXISTS sujeto;

COMMIT;
