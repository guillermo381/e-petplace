/* REVERSA de `20260829200000_s107a_flag_guarderia_ec.sql` — ESCRITA ANTES DE APLICAR.

   Apaga `services_enabled.guarderia` en EC.

   🔴 QUÉ **NO** DESHACE:
   ① **Las reservas ya hechas NO se cancelan.** Apagar el flag saca la guardería
      de Explorar — **no toca las estadías que ya existan**. Una familia que
      reservó sigue con su reserva, y el prestador con su día. *Un flag de
      vitrina no es un interruptor de servicio: apagarlo esconde la puerta, no
      vacía la casa.*
   ② **No apaga la oferta del prestador.** `prestador_servicios.activo` sigue en
      `true` y Clínica Aurora seguiría viendo su guardería configurada y
      publicada de su lado. Si la intención es que el prestador TAMBIÉN deje de
      ofrecerla, eso es otro acto y se hace en su taller — no acá.
   ③ **CO no se toca en ninguna dirección**: nunca se encendió, y además su
      `is_active` es `false`. */
BEGIN;
UPDATE public.country_config
   SET services_enabled = jsonb_set(services_enabled, '{guarderia}', 'false'::jsonb),
       updated_at = now()
 WHERE country_code = 'EC';
COMMIT;
