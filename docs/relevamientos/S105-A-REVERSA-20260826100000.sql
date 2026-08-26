-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260826100000_s105a_retomar_compra.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: retira `retomar_compra` y la columna
-- `pedido_items.precio_unitario_prometido`.
--
-- 🔴 QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
--   · Las compras que YA se retomaron **quedan retomadas**: su stock está
--     re-apartado y, si hubo baja de precio, su desglose ya dice el número
--     nuevo. *La plata y el inventario se movieron de verdad.*
--   · 🔴 **DROPEAR LA COLUMNA BORRA EL REGISTRO DE LO PROMETIDO AQUEL DÍA.**
--     Es el único lugar donde vive el precio original de un ítem ajustado.
--     **Antes de correr esta reversa, ese dato se exporta o se pierde:**
--         SELECT id, pedido_id, precio_unitario, precio_unitario_prometido
--           FROM pedido_items WHERE precio_unitario_prometido IS NOT NULL;
--   · Las 37 compras abandonadas vuelven a no tener camino de retome.
--
-- ⚠️ Si sólo se quiere apagar el retome sin perder el registro, **no se corre
-- esta reversa**: se revoca la función y la columna queda.
--     REVOKE EXECUTE ON FUNCTION public.retomar_compra(uuid) FROM authenticated;
-- *Borrar la columna para desactivar una función es cómo se pierde el dato que
-- la función existía para conservar.*
-- ══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.retomar_compra(uuid);
ALTER TABLE public.pedido_items DROP COLUMN IF EXISTS precio_unitario_prometido;
