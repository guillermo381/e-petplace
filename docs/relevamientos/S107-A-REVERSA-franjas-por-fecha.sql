/* REVERSA de `20260830080000_s107a_franjas_por_fecha.sql` — ESCRITA ANTES DE APLICAR.
   🔴 QUÉ NO DESHACE: nada de datos. Pero **correrla reinstala el defecto**: las
   ventanas vuelven a salir de un `min`/`max` sobre TODOS los días, y un lugar
   con recogida L-V 07:00-09:00 y sábados 09:00-11:00 vuelve a mostrarse como
   07:00-11:00 — un rango que no ofrece ningún día. Cuerpos previos en
   `S107-A-REVERSA-filtro-antes-de-por-fecha.sql`. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_guarderias_disponibles(date, uuid, double precision, double precision, text);
DROP FUNCTION IF EXISTS public._guarderia_ofertas_cobrables(uuid, text, date);
-- re-crear desde el archivo de cuerpos previos.
COMMIT;
