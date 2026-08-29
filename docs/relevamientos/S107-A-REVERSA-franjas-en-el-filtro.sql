/* REVERSA de `20260830060000_s107a_franjas_en_el_filtro.sql` — ESCRITA ANTES DE APLICAR.
   🔴 QUÉ NO DESHACE: nada de datos. Correrla devuelve el N+1 (una llamada por
   lugar para las ventanas) y **rompe a quien ya lea `recogeDesde`/`devuelveDesde`
   de la lista** ⇒ antes de correrla, la pantalla vuelve a `obtenerFranjasGuarderia`.
   Los cuerpos previos: `S107-A-REVERSA-filtro-antes-de-franjas.sql`. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_guarderias_disponibles(date, uuid, double precision, double precision, text);
DROP FUNCTION IF EXISTS public._guarderia_ofertas_cobrables(uuid, text);
-- re-crear desde el archivo de cuerpos previos.
COMMIT;
