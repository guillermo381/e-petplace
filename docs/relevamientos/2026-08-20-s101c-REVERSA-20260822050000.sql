-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ REVERSA de `20260822050000_s101c_revoke_confirmar_cita_pagada.sql`       ║
-- ║ Escrita ANTES de aplicar la migración (regla de la casa).                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ 🔴 QUÉ HACE ═══════════════════════════════════════════════════════════
--
-- Devuelve el `EXECUTE` de `confirmar_cita_pagada(uuid)` a `authenticated`.
--
-- ═══ 🔴 QUÉ REINTRODUCE — dicho con todas las letras ═══════════════════════
--
-- **Reintroduce `D-855`**: con este grant puesto, cualquiera con una cuenta
-- puede declarar pagada su propia cita **sin que ninguna tarjeta se toque**.
-- No es un efecto lateral de la reversa: **es exactamente lo que la migración
-- vino a cerrar.**
--
-- ⇒ Correr esto **solo** si el reemplazo dejó de funcionar y hay que volver a
--   reservar mientras se lo arregla, **con la ficha de `D-855` reabierta en el
--   mismo acto** y en un ambiente que no sea producción.
--
-- ═══ 🔴 QUÉ *NO* DESHACE ═══════════════════════════════════════════════════
--
-- ① **No devuelve la pantalla vieja.** El checkout de los cuatro oficios ya no
--    llama a esta RPC: llama a `pagos-cobro` con la cita como sujeto. Volver el
--    grant **no vuelve a enchufar la app** — para eso hay que revertir también
--    el bundle (y el bundle no vive en la base).
--    *Revertir la base sin revertir el bundle deja el grant abierto y a nadie
--    usándolo: todo el riesgo, cero del beneficio.*
--
-- ② **No borra las citas ya pagadas de verdad.** Las que pasaron por el motor
--    real quedan con su `transaction_id` y su `authorization_code` en
--    `metadata`. Eso es plata movida: no se deshace desde acá.
--
-- ③ **No toca el comentario de la función** — se repone abajo, a mano, para
--    que la base no quede diciendo que la puerta está cerrada cuando la
--    reversa la abrió.

BEGIN;

GRANT EXECUTE ON FUNCTION public.confirmar_cita_pagada(uuid) TO authenticated;

COMMENT ON FUNCTION public.confirmar_cita_pagada(uuid) IS
  'S54 · Confirma una cita contra un pago. ⚠️ REVERTIDA la revocación de S101-C: '
  'volvió a ser ejecutable por `authenticated` ⇒ D-855 ESTÁ REABIERTA. '
  'PRODUCCIÓN JAMÁS ABRE CON ESTE GRANT PUESTO.';

-- Cinturón: que la reversa haya hecho lo que dice.
DO $$
BEGIN
  IF NOT has_function_privilege('authenticated','public.confirmar_cita_pagada(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'REVERSA: el grant no quedó puesto';
  END IF;
END $$;

COMMIT;
