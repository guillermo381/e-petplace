-- ═══ REVERSA de 20260907340000_s109b_el_pendiente_no_bloquea.sql ═══
-- Escrita ANTES de aplicar.
SELECT cron.unschedule('expirar-programas-sin-pago');
SELECT cron.unschedule('expirar-mensualidades-sin-pago');
SELECT cron.unschedule('expirar-planes-sin-pago');
DROP FUNCTION IF EXISTS expirar_programas_sin_pago();
DROP FUNCTION IF EXISTS expirar_mensualidades_sin_pago();
DROP FUNCTION IF EXISTS expirar_planes_sin_pago();
ALTER TABLE guarderia_suscripciones ALTER COLUMN mascota_id DROP NOT NULL;
ALTER TABLE evento_cita_servicio    ALTER COLUMN mascota_id DROP NOT NULL;
DROP INDEX IF EXISTS uq_susc_viva_por_lugar;
CREATE UNIQUE INDEX uq_susc_viva_por_lugar ON guarderia_suscripciones
  USING btree (familia_id, prestador_id) WHERE (estado = 'activa');
-- El guard de `contratar_programa` y el fallback de
-- `cobrar_periodo_mensualidad_guarderia` se restauran desde el objeto.
--
-- ⚠️ QUÉ **NO** DESHACE:
--   · Las filas que los expiradores ya cancelaron QUEDAN canceladas. No se
--     resucitan, y no deberían: nunca se pagaron.
--   · Revertir REABRE los dos defectos medidos: ① un intento de pago fallido
--     vuelve a dejar a la familia trabada PARA SIEMPRE sobre ese sujeto, y ② una
--     mensualidad de una mascota vuelve a bloquear a TODAS las demás del hogar en
--     ese prestador — que es lo que el founder reprodujo en el teléfono.
--   · Y devuelve el fallback que ELIGE una mascota cuando no hay: el tercer
--     comportamiento que nadie firmó.
--   · No toca plata: ningún cobro, ningún reverso, ningún comprobante.
