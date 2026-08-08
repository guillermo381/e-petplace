-- REVERSA de 20260807200000_s91a_razas_nombre_presentable.sql (escrita ANTES)
-- Devuelve las 7 filas de perro a `activo = true` con su nombre ROTO visible
-- y quita el CHECK que impide que vuelvan a entrar nombres de archivo.
-- ⚠️ Solo se corre si apagarlas rompió algo — y en ese caso lo que se arregla
-- es lo que se rompió, no se reponen nombres que ningún humano escribiría.
-- Nota de datos: las FILAS nunca se borraron (la migración solo las apagó),
-- así que esta reversa no repone dato — reabre visibilidad.

BEGIN;

ALTER TABLE public.cat_razas DROP CONSTRAINT IF EXISTS chk_cat_razas_nombre_presentable;

UPDATE public.cat_razas
   SET activo = true, updated_at = now()
 WHERE especie = 'perro'
   AND slug IN ('bulldog-frances', 'bulldog-ingles', 'jack-rusell',
                'labrador-retriever', 'pastor-aleman', 'shih-tzu',
                'yorkshire-terrier');

COMMIT;
