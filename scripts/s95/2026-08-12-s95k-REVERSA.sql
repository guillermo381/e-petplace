-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA · S95-K — la reserva se mueve ANTES del pago
--   supabase/migrations/20260812090000_s95k_reservar_antes_de_pagar.sql
--
-- 🔴 REVERTIR REABRE UN AGUJERO DE PLATA MEDIDO, no supuesto. La sonda
--    `scripts/s95/medir-k2-k4.mjs` lo produjo dentro de una transacción
--    revertida, contra el catálogo real:
--
--      stock_disponible ......... 0
--      la reserva ............... FALLÓ (vendedor_skus_stock_disponible_check)
--      reservas_vigentes ........ 0
--      pagos APROBADOS .......... 1        ← 🔴
--      estado final ............. liberado_preparacion
--
--    **Se cobró por algo que no se puede despachar**, y el pedido quedó listo
--    para preparar. Con la despensa abierta, revertir esto es cobrarle a una
--    familia una bolsa que no existe.
--
-- ⚠️ NO deshace pedidos ya creados. Un pedido que pasó por `iniciar_pago_pedido`
--    y reservó stock queda con su reserva viva; borrarla acá sería devolver
--    stock que alguien ya tiene comprometido.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.iniciar_pago_pedido(uuid, integer);

-- `confirmar_pago_pedido` vuelve a su cuerpo de S95-G (sin la verificación de
-- que exista reserva). Se restaura re-aplicando su migración, no copiando el
-- cuerpo acá — una copia envejece contra su fuente.
--   \i supabase/migrations/20260812020000_s95g_gate_motor.sql

COMMIT;
