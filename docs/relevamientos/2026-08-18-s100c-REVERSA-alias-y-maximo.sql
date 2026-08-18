-- REVERSA de 20260820060000_s100c_alias_direccion_y_maximo_comprable.sql
-- ESCRITA ANTES DE APLICAR (regla de la casa).
--
-- QUÉ DESHACE: las dos funciones nuevas. Nada más.
--
-- 🔴 QUÉ **NO** DESHACE, declarado:
--  · Las filas de `direcciones_guardadas` que la familia haya creado con
--    alias mientras la función existió. **Revertir el código NO borra
--    direcciones**, y borrarlas acá sería peor: son datos que una persona
--    escribió a mano. Quedan como filas con `es_principal = false` que el
--    lector viejo (`.eq('es_principal', true)`) simplemente no mira —
--    invisibles, no rotas.
--  · Nada de stock: `maximo_comprable_de_ofertas` es SOLO LECTURA. No
--    reserva, no escribe, no toca `vendedor_skus`.
--
-- La migración es ADITIVA PURA: no altera tablas, no toca columnas, no
-- modifica funciones existentes. Por eso esta reversa es un DROP y no una
-- restauración de cuerpos anteriores.

BEGIN;

DROP FUNCTION IF EXISTS public.guardar_direccion_con_alias(text, text, text, text, text, text, double precision, double precision, uuid);
DROP FUNCTION IF EXISTS public.maximo_comprable_de_ofertas(jsonb);

COMMIT;
