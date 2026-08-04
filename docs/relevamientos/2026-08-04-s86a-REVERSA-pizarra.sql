-- ─────────────────────────────────────────────────────────────────────
-- REVERSA de `20260804170000_s86_motor_pizarra.sql`
-- Escrita ANTES de aplicar la migración (regla de la casa).
--
-- QUÉ REVIERTE: el lector y el escritor de LA PIZARRA (S86-A, lámina
-- firmada 4-ago-2026).
--
-- ⚠️ AVISO PROPIO — LO QUE REVERTIR **NO** DESHACE:
-- `tomar_cita` ESCRIBE: rellena `evento_cita_servicio.empleado_id`.
-- Revertir quita la PUERTA, jamás los efectos. **Las citas que ya fueron
-- tomadas quedan asignadas a su tratante**, y esta reversa no las suelta
-- — soltarlas sería peor: pondría en NULL asignaciones que alguien tomó
-- a propósito y sobre las que ya hay gente organizando su día.
--
-- Si de verdad hiciera falta soltar alguna, es un acto SEPARADO, por id
-- y medido, no un efecto colateral de revertir código. Hoy el único
-- productor de NULL sigue siendo `dar_de_baja_empleado` (S77 §11(a)).
--
-- CÓMO SABER QUÉ TOCÓ, si hay que auditarlo:
--   SELECT id, empleado_id, updated_at FROM evento_cita_servicio
--   WHERE metadata ? 'tomada_en';
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

DROP FUNCTION IF EXISTS public.tomar_cita(uuid);
DROP FUNCTION IF EXISTS public.obtener_pizarra(uuid);

COMMIT;
