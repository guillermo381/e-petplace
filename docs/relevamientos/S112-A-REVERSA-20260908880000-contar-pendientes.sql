-- REVERSA de 20260908880000 · la burbuja de pendientes.
--
-- Dos piezas, dos reversas:
--   ① `contar_pendientes()` se cae. Los dos lectores de lista siguen
--      devolviendo su `sin_leer` fila por fila — la burbuja desaparece, el
--      dato no. Nada que perder: la función es de sólo lectura.
--   ② `adopcion_lectura` sale de la publicación. La burbuja deja de
--      corregirse sola al marcar leído EN OTRO APARATO; en el aparato que
--      marca, C refresca igual. `adopcion_mensaje` NO se toca acá — su
--      reversa es la de `20260908720000`.
--
-- ⚠️ QUÉ NO DESHACE: los eventos ya entregados por el socket. No hay estado
-- que revertir — realtime no persiste nada.

DROP FUNCTION IF EXISTS public.contar_pendientes();
ALTER PUBLICATION supabase_realtime DROP TABLE public.adopcion_lectura;
