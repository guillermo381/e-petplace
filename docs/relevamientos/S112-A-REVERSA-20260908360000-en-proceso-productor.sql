-- REVERSA de 20260908360000_s112a_en_proceso_productor.sql — ESCRITA ANTES.
-- 🔴 QUE NO DESHACE:
--   · Las publicaciones que esten en `en_proceso` VIOLAN el CHECK viejo ⇒ la
--     reversa las lleva a `publicada`, y eso las devuelve a la vidriera
--     **aceptando postulaciones nuevas sobre un animal con adopcion en curso**.
--     Es perdida de informacion Y un estado equivocado, declarado.
--   · Vuelve el estado DERIVADO en `obtener_mis_adoptables`, con su divergencia:
--     la fila dice `publicada` y el lector dice `en_proceso`.
BEGIN;
UPDATE public.adopcion_publicacion SET estado='publicada' WHERE estado='en_proceso';
ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_estado_adoptable;
ALTER TABLE public.adopcion_publicacion ADD CONSTRAINT chk_estado_adoptable
  CHECK (estado IN ('borrador','publicada','pausada','adoptada','no_disponible'));
COMMIT;
