/* REVERSA de `20260830020000_s107a_resumen_filtro.sql` — ESCRITA ANTES DE APLICAR.
   🔴 QUÉ NO DESHACE: nada de datos (es un lector). Correrla deja la pantalla del
   filtro SIN «desde $X», sin saber si habilitar el botón y **sin poder decir por
   qué no hay lugares** — vuelve al «no hay» mudo que manda a la familia a probar
   combinaciones al azar. No toca `obtener_guarderias_disponibles`. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_resumen_guarderias(text, date, uuid, double precision, double precision);
COMMIT;
