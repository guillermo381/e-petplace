-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260821010000_s101_motor_pagos.sql
-- S101-A · 19-ago-2026 · migración 2 (enmienda a `pagos_intentos`)
--
-- 🔴 QUÉ NO DESHACE — leer antes de correr:
--
--  ① Los DATOS de las columnas nuevas se PIERDEN.
--     `compra_id`, `confirmado_por`, `proveedor_transaction_id`,
--     `authorization_code`, `marca`, `bin`, `ultimos4` se borran con la
--     columna. Si ya hubo cobros reales, `proveedor_transaction_id` es el
--     único puente hacia el DF de la pasarela: sin él, reconciliar un cobro
--     contra Nuvei deja de ser posible desde nuestra base.
--     ⇒ EXPORTAR ANTES si hay filas con esas columnas pobladas:
--        \copy (select id, pedido_id, compra_id, proveedor,
--                      proveedor_transaction_id, authorization_code,
--                      confirmado_por, marca, bin, ultimos4
--               from public.pagos_intentos
--               where proveedor_transaction_id is not null)
--          to 'pagos_intentos_backup.csv' csv header
--
--  ② Los ESTADOS ya movidos NO vuelven.
--     `confirmar_pago_compra` avanza pedidos por `_mover_estado_pedido` y
--     pone `compras.estado='pagada'`. Revertir borra la función, **no
--     deshace los pedidos que ya avanzaron ni las compras ya marcadas**.
--     Un pedido confirmado sigue confirmado; el vendedor ya fue avisado.
--
--  ③ No toca `confirmar_pago_pedido`: esta migración NO la modificó.
-- ═══════════════════════════════════════════════════════════════════════════

-- ⑤ la orquestación
DROP FUNCTION IF EXISTS public.confirmar_pago_compra(
  uuid, text, text, text, jsonb, text, text, numeric, text, text, text, text);

-- ⑥ la lápida (vuelve a quedar sin comentario, como estaba)
COMMENT ON FUNCTION public.crear_intento_pago(uuid, text) IS NULL;

-- ① la frontera declarada sobre pagos_eventos
COMMENT ON TABLE public.pagos_eventos IS NULL;

-- ② el candado
DROP INDEX IF EXISTS public.uq_pagos_intentos_tx_por_pedido;

-- ③ y ④ las columnas
DROP INDEX IF EXISTS public.idx_pagos_intentos_compra;
ALTER TABLE public.pagos_intentos
  DROP COLUMN IF EXISTS ultimos4,
  DROP COLUMN IF EXISTS bin,
  DROP COLUMN IF EXISTS marca,
  DROP COLUMN IF EXISTS authorization_code,
  DROP COLUMN IF EXISTS proveedor_transaction_id,
  DROP COLUMN IF EXISTS confirmado_por,
  DROP COLUMN IF EXISTS compra_id;
