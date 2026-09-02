-- REVERSA de 20260908100000_s112a_mi_adoptable.sql — ESCRITA ANTES DE APLICAR.
-- QUE NO DESHACE: revertir esto deja al refugio **sin poder LEER un borrador
-- propio**, y con `actualizar_adoptable` aceptando `Partial` eso significa que
-- abrir el formulario vacio y guardar **borra la historia del animal**. No
-- pierde datos por si mismo; habilita perderlos.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mi_adoptable(uuid);
COMMIT;
