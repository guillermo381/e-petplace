-- REVERSA de 20260911890000_s114a_pagar_compra_con_saldo.sql — escrita ANTES.
DROP FUNCTION IF EXISTS public.pagar_compra_con_saldo(uuid);
-- Restaura pagar_pedido_con_saldo (re-aplicar 20260911880000). NO revierte pagos
-- ya hechos con saldo (movimientos del ledger, historia).
