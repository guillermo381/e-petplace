-- REVERSA de 20260814150000_s97a_factura_estado_default.sql (escrita ANTES)
-- Devuelve `registrar_factura_pedido` a pasar `p_estado_sri` crudo.
-- 🔴 Revertir REINTRODUCE el defecto: llamarla sin `p_estado_sri` vuelve a
--    reventar con un 23502 crudo en vez de nacer 'pendiente'.
-- No hay datos que perder. El cuerpo previo vive en su migración de origen.
BEGIN;
\echo 'REVERSA: cambiar COALESCE(p_estado_sri, ...) por p_estado_sri en registrar_factura_pedido'
COMMIT;
