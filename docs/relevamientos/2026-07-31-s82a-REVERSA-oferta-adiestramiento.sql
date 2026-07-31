-- REVERSA de 20260731130000_s82_oferta_adiestramiento_publica.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- QUÉ REVIERTE: el DROP de una función nueva. La migración es ADITIVA
-- PURA — crea `obtener_oferta_adiestramiento_publica` y no toca ninguna
-- tabla, fila, policy ni función existente.
--
-- NOTA DE DATOS: **no hay nada que restaurar.** La función es de solo
-- lectura (STABLE) y no escribe una sola fila; revertir el código revierte
-- el efecto ENTERO, que es la excepción y no la regla (en migraciones con
-- backfill, revertir el código NO revierte los datos — acá sí, porque no
-- hay datos).
--
-- CONSECUENCIA VIVA DE REVERTIR: el pie de adiestramiento del cliente
-- pierde su "desde" y vuelve a `total={null}` — que es lo que hacía antes
-- y es honesto. Ningún bundle rompe: el wrapper devuelve su error tipado.

DROP FUNCTION IF EXISTS public.obtener_oferta_adiestramiento_publica();
