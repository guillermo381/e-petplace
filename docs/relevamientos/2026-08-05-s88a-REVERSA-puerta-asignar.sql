-- REVERSA de `20260805240000_puerta_verbo_asignar.sql`
-- Escrita ANTES de aplicar (regla de la casa).
--
-- QUÉ REVIERTE: las dos funciones nuevas. Nada más — la migración es
-- ADITIVA PURA: no toca policies, ni columnas, ni datos.
--
-- ⚠️ NOTA DE DATOS — LO QUE REVERTIR **NO** DESHACE:
--   Las citas que ya hayan sido asignadas por esta puerta CONSERVAN su
--   `empleado_id`. Revertir quita el VERBO, jamás sus efectos: una cita
--   ruteada a una persona sigue ruteada. Si además hay que devolverlas al
--   estado «de la clínica», eso es un UPDATE aparte y DELIBERADO —
--   esta reversa no lo hace sola, porque despegar en masa borraría
--   ruteos legítimos junto con los que se quieran deshacer.
--
-- ⚠️ Y LO QUE REVERTIR REABRE:
--   Nada. El tercer brazo de `cita_update_prestador` (S77) sigue vivo con o
--   sin esta migración — el profesional con chip puede seguir tomando una
--   cita sin persona por PostgREST directo. Esta puerta NO era lo que lo
--   contenía (ver el hallazgo del hueco lateral en el acta).

BEGIN;

DROP FUNCTION IF EXISTS public.asignar_cita_a_persona(uuid, uuid);
DROP FUNCTION IF EXISTS public.empleado_puede_asignar_citas(uuid);

COMMIT;
