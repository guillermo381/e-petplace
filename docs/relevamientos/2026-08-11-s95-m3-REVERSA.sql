-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 3 · S95-C — el inventario
--   supabase/migrations/20260811140000_s95_m3_inventario.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ HOY la deshace ENTERA sin pérdida: las tres tablas nacieron vacías y
--      la migración verifica por cinturón que quedaron vacías (residuo 0).
--
--   ❌ DEJA DE SER CIERTO CON EL PRIMER MOVIMIENTO DE STOCK REAL. Desde ahí,
--      revertir **borra el ledger de inventario**, que es la única fuente de
--      verdad del stock: `vendedor_skus.stock_disponible` es una
--      materialización, no un registro. **Borrar el ledger y conservar el
--      número deja un saldo que nadie puede auditar ni reconstruir.**
--
--   ⇒ Si ya hay movimientos, esta reversa NO se ejecuta: se escribe otra que
--     conserve `inventario_movimientos` aunque se caiga el resto.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- El trigger primero: si se va la función con el trigger vivo, falla.
DROP TRIGGER IF EXISTS trg_inventario_aplicar_movimiento ON public.inventario_movimientos;
DROP FUNCTION IF EXISTS public._trg_inventario_aplicar_movimiento();
DROP FUNCTION IF EXISTS public.expirar_reservas_vencidas();

DROP VIEW  IF EXISTS public.v_inventario_reservas_vigentes;
DROP TABLE IF EXISTS public.inventario_reservas;
DROP TABLE IF EXISTS public.inventario_movimientos;
DROP TABLE IF EXISTS public.vendedor_bodegas;

-- NOTA: `vendedor_skus.stock_disponible` y `stock_reservado` NO se tocan —
-- nacieron en la M2, no en ésta. Tras revertir quedan como columnas que nadie
-- escribe: es exactamente el estado que la M3 vino a curar, y hay que saberlo.

COMMIT;
