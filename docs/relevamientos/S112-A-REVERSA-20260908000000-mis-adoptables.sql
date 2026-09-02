-- REVERSA de 20260908000000_s112a_mis_adoptables.sql — ESCRITA ANTES DE APLICAR.
-- QUE NO DESHACE: revertir esto **deja al refugio sin poder ver sus propios
-- animales en borrador**. La vidriera publica no los muestra (ni debe), asi que
-- el tab Mascotas del portal se queda sin de donde leer y el paso 3 del
-- recorrido del founder no se puede caminar. No pierde datos.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mis_adoptables();
COMMIT;
