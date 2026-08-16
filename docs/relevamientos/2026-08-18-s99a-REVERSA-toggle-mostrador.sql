-- REVERSA de 20260817220000_s99a_toggle_mostrador_y_oficios_locales.sql
-- (escrita ANTES de aplicar)
-- Qué deshace y qué NO:
--  · DROP de la columna `venta_mostrador_activa` — SE PIERDE la decisión de
--    los vendedores que la hayan prendido/apagado (incluido el backfill de
--    las 2 cuentas con ventas de retiro). Declarado: es una perilla de
--    config, no un hecho de negocio — se re-configura, no se reconstruye.
--  · DROP de `configurar_venta_mostrador`.
--  · `obtener_contexto_arranque` vuelve a la versión de 20260817170000
--    (repartidor_de incluido, sin venta_mostrador_activa/oficios_locales):
--    EJECUTAR EL BLOQUE `CREATE OR REPLACE FUNCTION public.obtener_contexto_arranque`
--    ÍNTEGRO del archivo supabase/migrations/20260817170000_s99a_repartidor_en_contexto.sql
--    (líneas del CREATE al REVOKE/GRANT inclusive) — se referencia y no se
--    copia acá para no tener DOS fuentes del mismo cuerpo que diverjan.
--  · Bundles: el wrapper lee los campos ausentes como false/[] (L-247,
--    degradación propia) — el tab ATENDER degrada a su composición previa.

DROP FUNCTION IF EXISTS public.configurar_venta_mostrador(uuid, boolean);
ALTER TABLE public.cuentas_comerciales DROP COLUMN IF EXISTS venta_mostrador_activa;
-- + el bloque del contexto de 20260817170000, como se declara arriba.
