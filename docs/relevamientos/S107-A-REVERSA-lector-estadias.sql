/* REVERSA de `20260830000000_s107a_lector_estadias.sql` — ESCRITA ANTES DE APLICAR.
   🔴 QUÉ NO DESHACE: nada de datos — es un lector, no escribe. Correrla deja al
   hub de la familia SIN log, sin entrada al durante y sin acta: las tres cosas
   que este lector destraba a la vez. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mis_estadias_guarderia(uuid);
COMMIT;
