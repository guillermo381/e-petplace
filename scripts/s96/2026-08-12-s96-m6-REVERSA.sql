-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812170000_s96_b8_mostrador_y_reclamo.sql
--
-- ⚠️ QUÉ NO DESHACE: los eventos ya depositados por reclamos reales quedan
--    (append-only, L-231). Los movimientos de inventario de ventas de
--    mostrador quedan (el ledger no se corrige borrando filas) — si hay
--    ventas reales, restaurar el CHECK viejo de referencia_tipo REBOTA, y
--    ese rebote es correcto.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.reclamar_compra_mostrador(text, uuid);
DROP FUNCTION IF EXISTS public.registrar_venta_mostrador(uuid, jsonb);

ALTER TABLE public.evento_producto_asignacion
  DROP COLUMN IF EXISTS venta_mostrador_item_id;

DROP TABLE IF EXISTS public.venta_mostrador_items;
DROP TABLE IF EXISTS public.ventas_mostrador;

ALTER TABLE public.inventario_movimientos
  DROP CONSTRAINT IF EXISTS inventario_movimientos_referencia_tipo_check;
ALTER TABLE public.inventario_movimientos
  ADD CONSTRAINT inventario_movimientos_referencia_tipo_check
  CHECK (referencia_tipo = ANY (ARRAY['pedido'::text,'manual'::text,
                                      'expiracion'::text,'carga_inicial'::text]));
ALTER TABLE public.inventario_movimientos
  DROP CONSTRAINT IF EXISTS inventario_movimientos_tipo_check;
ALTER TABLE public.inventario_movimientos
  ADD CONSTRAINT inventario_movimientos_tipo_check
  CHECK (tipo = ANY (ARRAY['ingreso'::text,'ajuste'::text,'merma'::text,'reserva'::text,
                           'liberacion_reserva'::text,'consumo'::text]));
ALTER TABLE public.inventario_movimientos
  DROP CONSTRAINT IF EXISTS chk_signo_por_tipo;
ALTER TABLE public.inventario_movimientos
  ADD CONSTRAINT chk_signo_por_tipo
  CHECK (((tipo = ANY (ARRAY['ingreso'::text,'reserva'::text,'liberacion_reserva'::text,
                             'consumo'::text,'merma'::text])) AND cantidad > 0)
         OR tipo = 'ajuste'::text);
-- El trigger materializador vuelve a su cuerpo pre-M6:
--   scripts/s96/functiondef-pre-m6.sql (se re-aplica tal cual)

COMMIT;
