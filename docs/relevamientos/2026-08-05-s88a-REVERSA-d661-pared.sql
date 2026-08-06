-- REVERSA de `20260805250000_d661_solo_recepcion_asigna.sql`
-- Escrita ANTES de aplicar.
--
-- QUÉ REVIERTE: devuelve `cita_update_prestador` a su forma de S77 — con el
-- TERCER BRAZO vivo.
--
-- ⚠️ REVERTIR REABRE EL AGUJERO, y hay que decirlo con todas las letras:
--   con el tercer brazo de vuelta, cualquier empleado activo CON EL CHIP del
--   oficio puede, por PostgREST directo:
--     (a) ponerse a sí mismo en una cita sin persona — auto-rutearse,
--         esquivando `asignar_cita_a_persona` y su gate de rol;
--     (b) DESPEGARSE de una cita propia (dejarla en `empleado_id = NULL`),
--         que hoy tampoco tiene camino de producto.
--   Es exactamente lo que la firma del founder del 5-ago cerró
--   («solo recepción asigna: un solo dueño del reparto, sin carreras entre
--   dos que la toman»).
--
-- ⚠️ Y LO QUE REVERTIR **NO** DESHACE: nada. La migración no toca datos.

BEGIN;

DROP POLICY IF EXISTS cita_update_prestador ON public.evento_cita_servicio;

CREATE POLICY cita_update_prestador ON public.evento_cita_servicio
FOR UPDATE
USING (
  (prestador_id IN (SELECT p.id FROM prestadores p WHERE p.user_id = auth.uid()))
  OR (empleado_id IN (SELECT pe.id FROM prestador_empleados pe
                      WHERE pe.user_id = auth.uid() AND pe.activo = true))
  OR (EXISTS (SELECT 1
              FROM prestador_empleados pe
              JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
              JOIN prestador_servicios ps ON ps.id = pes.servicio_id
              WHERE pe.user_id = auth.uid() AND pe.activo = true
                AND pe.prestador_id = evento_cita_servicio.prestador_id
                AND ps.tipo_servicio = evento_cita_servicio.tipo_servicio
                AND evento_cita_servicio.empleado_id IS NULL))
)
WITH CHECK (
  (prestador_id IN (SELECT p.id FROM prestadores p WHERE p.user_id = auth.uid()))
  OR (empleado_id IN (SELECT pe.id FROM prestador_empleados pe
                      WHERE pe.user_id = auth.uid() AND pe.activo = true))
  OR (EXISTS (SELECT 1
              FROM prestador_empleados pe
              JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
              JOIN prestador_servicios ps ON ps.id = pes.servicio_id
              WHERE pe.user_id = auth.uid() AND pe.activo = true
                AND pe.prestador_id = evento_cita_servicio.prestador_id
                AND ps.tipo_servicio = evento_cita_servicio.tipo_servicio
                AND evento_cita_servicio.empleado_id IS NULL))
);

COMMIT;
