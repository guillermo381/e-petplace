-- REVERSA de 20260807210000_s91a_razas_firmadas.sql (escrita ANTES)
-- Devuelve las 7 filas al nombre del ARCHIVO y las vuelve a apagar.
-- ⚠️ Correrla deshace una FIRMA del founder (7-ago-2026): los nombres
-- vuelven a ser `Pastor_Aleman` y compañía, y la sugerencia del alta pierde
-- las siete razas de perro más comunes. Solo tiene sentido si los textos
-- firmados resultaran equivocados — y en ese caso lo correcto es OTRA firma,
-- no esta reversa.
-- El CHECK vuelve a NOT VALID porque con los nombres de archivo repuestos
-- ninguna validación total podría pasar.

BEGIN;

UPDATE public.cat_razas SET nombre = 'Bulldog_Frances',    activo = false, updated_at = now() WHERE especie='perro' AND slug='bulldog-frances';
UPDATE public.cat_razas SET nombre = 'Bulldog_Ingles',     activo = false, updated_at = now() WHERE especie='perro' AND slug='bulldog-ingles';
UPDATE public.cat_razas SET nombre = 'Jack_Rusell',        activo = false, updated_at = now() WHERE especie='perro' AND slug='jack-rusell';
UPDATE public.cat_razas SET nombre = 'Labrador_Retriever', activo = false, updated_at = now() WHERE especie='perro' AND slug='labrador-retriever';
UPDATE public.cat_razas SET nombre = 'Pastor_Aleman',      activo = false, updated_at = now() WHERE especie='perro' AND slug='pastor-aleman';
UPDATE public.cat_razas SET nombre = 'Shih_Tzu',           activo = false, updated_at = now() WHERE especie='perro' AND slug='shih-tzu';
UPDATE public.cat_razas SET nombre = 'Yorkshire_Terrier',  activo = false, updated_at = now() WHERE especie='perro' AND slug='yorkshire-terrier';

ALTER TABLE public.cat_razas DROP CONSTRAINT IF EXISTS chk_cat_razas_nombre_presentable;
ALTER TABLE public.cat_razas
  ADD CONSTRAINT chk_cat_razas_nombre_presentable CHECK (
        position('_' in nombre) = 0
    AND nombre = btrim(nombre)
    AND position('  ' in nombre) = 0
    AND nombre <> ''
  ) NOT VALID;

COMMIT;
