-- REVERSA de `20260911020000_s114a_aviso_vendedor.sql` (③). Escrita ANTES.
-- QUÉ DESHACE: el trigger y su función.
-- 🔴 QUÉ NO DESHACE: las intenciones ya emitidas quedan (son hechos, no estado),
--    y revertir devuelve el sistema al defecto: `pedido_nuevo_vendedor` vuelve a
--    ser un tipo activo que nadie produce, y el vendedor deja de enterarse de
--    que le entró un pedido. Medido antes de curar: 14 pedidos pasaron por
--    `vendedor_notificado` y sólo 4 avisaron.
DROP TRIGGER  IF EXISTS trg_pedido_avisa_vendedor ON public.pedido_estados;
DROP FUNCTION IF EXISTS public._trg_pedido_avisa_vendedor();
