-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ REVERSA de 20260821090000 — el actuador (APAGADO) + el comprobante      ║
-- ║ ESCRITA ANTES DE APLICAR.                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- QUÉ DESHACE: borra `aplicar_evento_de_pago`, la bandera `pagos_actuador_vivo`
-- y el tipo de notificación del comprobante.
--
-- 🔴 QUÉ **NO** DESHACE: si el actuador llegó a estar ENCENDIDO, **las compras
--    que confirmó siguen confirmadas y los correos enviados no vuelven.**
--    Revertir apaga la puerta; no deshace lo que pasó por ella.
--    *En pagos, revertir código nunca es revertir hechos.*

DROP FUNCTION IF EXISTS public.aplicar_evento_de_pago(uuid);
DELETE FROM app_config WHERE clave = 'pagos_actuador_vivo';
