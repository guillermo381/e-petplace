-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DEL BLOQUE 2 · S95-D — el lote
--   supabase/migrations/20260811210000_s95_m10_lote.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ HOY la deshace entera: las cuatro columnas de `pedido_items`, las dos
--      de `evento_producto_asignacion` y la vista. Las dos tablas están en
--      cero (el cinturón ③ lo verifica).
--
--   ❌ 🔴 **CON UNA SOLA COMPRA REAL DEPOSITADA, ESTA REVERSA DESTRUYE LA
--      CAPACIDAD DE RESPONDER UN RETIRO.** Borrar `lote` de
--      `evento_producto_asignacion` no es perder una columna: es perder la
--      única forma de saber qué mascota está comiendo un alimento retirado.
--      Y el expediente es append-only: el dato no se reconstruye.
--
--   ⇒ Con eventos vivos, esta reversa NO se ejecuta. Si hay que revertir el
--     resto del bloque, la columna `lote` del expediente SE QUEDA.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

DROP VIEW IF EXISTS public.v_mascotas_por_lote;

-- 🔴 ANTES DE EJECUTAR: si esto devuelve > 0, PARAR y dejar la columna.
--    SELECT count(*) FROM evento_producto_asignacion WHERE lote IS NOT NULL;
ALTER TABLE public.evento_producto_asignacion
  DROP COLUMN IF EXISTS lote,
  DROP COLUMN IF EXISTS fecha_vencimiento;

ALTER TABLE public.pedido_items
  DROP COLUMN IF EXISTS lote,
  DROP COLUMN IF EXISTS fecha_vencimiento,
  DROP COLUMN IF EXISTS lote_registrado_en,
  DROP COLUMN IF EXISTS lote_registrado_por;

COMMIT;
