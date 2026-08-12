-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DEL BLOQUE 3 · S95-D — los estados en dos capas
--   supabase/migrations/20260811220000_s95_m11_estados.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ HOY la deshace: devuelve los 9 estados originales de S95-C, borra las
--      dos tablas nuevas y la vista. `pedidos` está en CERO (el cinturón de la
--      migración lo verifica y aborta si no).
--
--   ❌ 🔴 **CON UN SOLO PEDIDO VIVO ES IMPOSIBLE EJECUTARLA.** Los 23 estados
--      internos no tienen equivalente en los 9 viejos: un pedido en
--      `esperando_courier` no se puede mapear a `despachado` sin inventar. Y
--      `pedido_estados` es append-only: su historia quedaría apuntando a
--      códigos que ya no existen.
--
--   ⇒ Con pedidos vivos NO se revierte: se APAGAN los estados nuevos
--     (`activo = false` con su motivo), que es el mecanismo que este mismo
--     bloque construyó para cerrar un camino sin borrarlo.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

DROP VIEW  IF EXISTS public.v_pedidos_narrativa;
DROP TABLE IF EXISTS public.cat_transiciones_pedido;

ALTER TABLE public.cat_estados_pedido DROP CONSTRAINT IF EXISTS chk_estado_inactivo_con_motivo;
ALTER TABLE public.cat_estados_pedido ALTER COLUMN narrativa DROP NOT NULL;

-- 🔴 ANTES DE EJECUTAR: si esto devuelve > 0, PARAR.
--    SELECT count(*) FROM pedidos;  /  SELECT count(*) FROM pedido_estados;
DELETE FROM public.cat_estados_pedido;

INSERT INTO public.cat_estados_pedido (codigo, nombre, descripcion, es_terminal, orden, activo) VALUES
  ('creado',         'Creado',         'La familia armó el pedido; todavía no confirmó.', false, 1, true),
  ('confirmado',     'Confirmado',     'Se confirmó y se bloqueó el stock. Espera el pago.', false, 2, true),
  ('pagado',         'Pagado',         'El pago se completó contra la pasarela.', false, 3, true),
  ('en_preparacion', 'En preparación', 'El vendedor lo está armando.', false, 4, true),
  ('despachado',     'Despachado',     'Salió del depósito.', false, 5, true),
  ('entregado',      'Entregado',      'Llegó a la familia.', true,  6, true),
  ('cancelado',      'Cancelado',      'Se canceló antes de la entrega.', true, 7, true),
  ('devuelto',       'Devuelto',       'La familia lo devolvió.', true, 8, true),
  ('contracargo',    'Contracargo',    'El banco revirtió el cobro.', true, 9, true);

ALTER TABLE public.cat_estados_pedido
  DROP COLUMN IF EXISTS narrativa,
  DROP COLUMN IF EXISTS visible_familia,
  DROP COLUMN IF EXISTS motivo_inactivo,
  DROP COLUMN IF EXISTS exige_motivo,
  DROP COLUMN IF EXISTS updated_at;

DROP TABLE IF EXISTS public.cat_narrativas_pedido;

COMMIT;
