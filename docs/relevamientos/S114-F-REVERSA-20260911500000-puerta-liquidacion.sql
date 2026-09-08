-- REVERSA de 20260911500000_s114f_puerta_liquidacion.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- QUÉ DESHACE: borra la puerta `admin_generar_liquidacion`. Nada más.
--
-- 🔴 QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
--    Las liquidaciones que se hayan generado con ella **quedan**. Son filas de
--    `liquidaciones` + `liquidacion_eventos` y eventos movidos a 'liquidado'.
--    Revertir la puerta NO devuelve esos eventos a 'pendiente_liquidar' — y no
--    debe hacerlo: una liquidación generada puede haberse pagado, y deshacerla
--    desde acá pondría a un prestador a cobrar dos veces.
--    Si hay que anular una liquidación, es un acto propio con su propia letra.
--
-- NO TOCA `generar_liquidacion` (la función del motor, §4.3): esta migración
-- nunca la modificó — sólo la envolvió.

BEGIN;

DROP FUNCTION IF EXISTS public.admin_generar_liquidacion(uuid, text, date, date);

COMMIT;
