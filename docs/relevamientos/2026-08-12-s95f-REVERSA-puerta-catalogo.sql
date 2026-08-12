-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260812010000_s95f_puerta_catalogo.sql`  (S95-F, 11-ago-2026)
-- ESCRITA ANTES DE APLICAR LA MIGRACIÓN. No se ejecuta salvo decisión expresa.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 LO QUE ESTA REVERSA **NO** DESHACE — leer antes de correrla:
--
--   1. **Los datos que las funciones hayan creado.** `productos`,
--      `producto_variantes`, `vendedor_skus` y `ofertas` quedan como están.
--      Borrar las funciones no borra el catálogo que cargaron, y está bien
--      que sea así: el catálogo es dato del negocio, no artefacto de la
--      migración.
--
--   2. **La unicidad natural de `productos`.** Al soltar
--      `uq_producto_natural` vuelve a ser EXPRESABLE cargar dos productos
--      con la misma marca y el mismo nombre en la misma familia. Si en el
--      medio se cargaron filas, revertir NO las deduplica — deja la puerta
--      abierta hacia adelante. **Volver a crear el índice después puede
--      fallar** si para entonces existen duplicados.
--
--   3. **El estado de los SKU ya publicados.** Un SKU que quedó `aceptado`
--      con su oferta `publicada` sigue igual. La reversa quita la puerta,
--      no cierra la vitrina.
--
-- ⚠️ Y la advertencia de secuencia: revertir la base sin revertir el
--    cargador deja `tools/carga-catalogo` llamando funciones que ya no
--    existen. El cargador va a fallar con `PGRST202` (función no resuelta),
--    que es un fallo RUIDOSO y por lo tanto aceptable — pero conviene
--    saberlo antes de que alguien lo lea como "la base se rompió".
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.publicar_oferta_sku(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text);
DROP FUNCTION IF EXISTS public._cuenta_es_vendedora(uuid);

DROP INDEX IF EXISTS public.uq_producto_natural;

COMMIT;
