-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA · S95-G — el gate del actor `sistema` y las dos funciones que faltaban
--   supabase/migrations/20260812020000_s95g_gate_motor.sql
--
-- 🔴 LO QUE ESTA REVERSA HACE Y LO QUE NO:
--
--   ✅ Deshace la estructura: borra `_mover_estado_pedido`,
--      `registrar_factura_pedido` y `ajustar_stock_vendedor`, y devuelve las
--      cinco funciones del motor a su cuerpo de S95-D.
--
--   🔴 **REVERTIR REABRE CINCO AGUJEROS DE SEGURIDAD MEDIDOS.** No es una
--      opinión: la sonda `scripts/s95/sonda-superficie-motor-s95g.mjs` los
--      produjo por el camino real, con la anon key del bundle y un usuario
--      común, sobre el pedido de otra persona:
--        · `confirmar_pago_pedido`  → pedido ajeno marcado PAGADO
--        · `reservar_stock_pedido`  → stock ajeno reservado
--        · `entregar_pedido`        → pedido ajeno marcado ENTREGADO
--        · `cancelar_pedido_despensa` con actor `sistema` → pedido ajeno cancelado
--        · `mover_estado_pedido`    con actor `sistema` → estado ajeno movido
--      **Ejecutar esta reversa con la despensa abierta al público es regalar
--      productos.** Si hay que revertir, se hace con el frente apagado.
--
--   ⚠️ NO deshace los DATOS. Una factura registrada, un ajuste de stock o un
--      movimiento de estado que ya ocurrieron NO se borran acá: viven en
--      tablas append-only y borrarlos sería reescribir historia.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.ajustar_stock_vendedor(uuid, integer, text);
DROP FUNCTION IF EXISTS public.registrar_factura_pedido(uuid, text, text, text, numeric, text);

-- Las cinco vuelven a su cuerpo de S95-D re-aplicando `20260812000000`.
-- 🔴 SE HACE POR RE-EJECUCIÓN DE LA MIGRACIÓN ORIGINAL, no copiando cuerpos
--    acá: una copia de 300 líneas envejece contra su fuente y la reversa
--    terminaría restaurando una versión que nunca existió.
--    \i supabase/migrations/20260812000000_s95_m13_motor.sql
--    (su cinturón corre un pedido completo, así que la re-ejecución además
--     verifica que el motor viejo sigue funcionando.)

-- Y recién ahí se puede borrar el anillo interno, porque hasta que las cinco
-- no vuelvan a llamar a `mover_estado_pedido` lo están llamando a él.
DROP FUNCTION IF EXISTS public._mover_estado_pedido(uuid, text, text, text);

COMMIT;
