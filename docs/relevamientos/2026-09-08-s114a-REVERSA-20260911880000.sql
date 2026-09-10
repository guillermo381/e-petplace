-- REVERSA de 20260911880000_s114a_pagar_pedido_con_saldo.sql — escrita ANTES.
DROP FUNCTION IF EXISTS public.pagar_pedido_con_saldo(uuid);
-- NO revierte pagos ya hechos con saldo (son movimientos del ledger, historia).
