-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727180000_s79_motor_alta.sql (escrita ANTES de
-- aplicar).
--
-- NOTA DE DATOS: revertir las FUNCIONES no revierte lo que hayan
-- CREADO — cuentas comerciales, prestadores 'pendiente', filas de
-- cuenta_roles/user_roles, ni los veredictos (estado/aprobado_por/
-- aprobado_en/motivo_rechazo) escritos por activar_prestador. Todo eso
-- es DATO y se gobierna con regla 41 (FKs entrantes relevadas) si
-- alguna vez hubiera que deshacerlo — jamás desde esta reversa.
-- ═════════════════════════════════════════════════════════════════════
begin;

DROP FUNCTION IF EXISTS public.invitar_prestador(text, tipo_fiscal_enum, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.activar_prestador(uuid, text, text);

commit;
