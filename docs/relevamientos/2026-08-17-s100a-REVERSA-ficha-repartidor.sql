-- REVERSA de `20260820040000_s100a_ficha_repartidor.sql`
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: retira la función `obtener_ficha_repartidor`.
--
-- 🔴 QUÉ **NO** DESHACE: nada de dato — la función solo LEE. Revertirla no
-- borra ni expone: **deja a la familia sin saber quién le está tocando la
-- puerta**, que es el hueco que vino a cerrar.
--
-- Y lo que revertir NO reabre, porque nunca se abrió: **la foto, el documento,
-- el teléfono, el correo y el WhatsApp del repartidor JAMÁS salieron por acá.**
-- Esta función expone tres campos y nada más.

BEGIN;
DROP FUNCTION IF EXISTS public.obtener_ficha_repartidor(uuid);
COMMIT;
