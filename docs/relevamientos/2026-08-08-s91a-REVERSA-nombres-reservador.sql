-- REVERSA de 20260808040000_s91a_nombres_reservador_por_cita.sql (escrita ANTES)
-- Quita la función. Su consumidor (el chip de PERSONA del histórico del
-- prestador, B) se queda sin nombres y su hilera vuelve a ofrecer solo
-- mascotas — que es el estado honesto que B dejó por construcción («vacío no
-- es estado degradado acá»), así que revertir NO rompe la pantalla.
-- Nota de datos: no toca ninguna fila.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_nombres_reservador_por_cita(uuid[]);
COMMIT;
