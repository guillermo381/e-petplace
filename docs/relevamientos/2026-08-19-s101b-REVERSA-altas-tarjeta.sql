-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260821040000_s101b_altas_tarjeta.sql`
-- Escrita ANTES de aplicar la migración (regla de la casa).
--
-- 🔴 QUÉ NO DESHACE ESTA REVERSA — se declara antes de que alguien la corra:
--
--  ① **Las tarjetas ya guardadas NO se tocan.** `tarjetas_guardadas` es de
--     S101-A y sigue viva. Esta reversa borra el registro de ALTAS, no las
--     tarjetas: una familia que guardó su tarjeta la conserva.
--
--  ② **Se pierde la traza de los intentos de alta**: quién intentó, cuándo,
--     con qué desenlace, y las que vencieron. *Eso es auditoría de un flujo
--     de medios de pago — si hay una disputa sobre «yo nunca agregué esa
--     tarjeta», este registro es lo que la contesta.* Revertir la borra.
--
--  ③ **`abandonada` deja de ser medible.** Sin filas que venzan, el estado no
--     tiene de dónde salir: la app volvería a no poder distinguir «cerró la
--     ventana» de «el alta venció» — que es exactamente lo que la enmienda de
--     mesa del 19-ago vino a arreglar.
--
--  ④ Si el endpoint `pagos-alta-tarjeta` sigue desplegado, **queda apuntando
--     a objetos que ya no existen** y va a fallar en cada llamada. El orden
--     de reversa es: retirar el endpoint PRIMERO, después correr esto.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.resolver_alta_tarjeta(uuid, text, text, text, text, text, text, text, boolean, text);
DROP FUNCTION IF EXISTS public.obtener_alta_tarjeta(uuid);
DROP FUNCTION IF EXISTS public.crear_alta_tarjeta(text);

-- La FK de `tarjetas_guardadas` hacia altas se va con la tabla.
DROP TABLE IF EXISTS public.altas_tarjeta;

COMMIT;
