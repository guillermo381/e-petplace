-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA · S95-J2 — el vocabulario de `momentos_aplicables`
--   supabase/migrations/20260812070000_s95j2_vocabulario_momentos.sql
--
-- ✅ La deshace entera y sin pérdida: solo quita un CHECK y un comentario.
--
-- 🔴 REVERTIR REABRE LA PUERTA A `M6` EN EL CATÁLOGO DE PRODUCTOS, y eso no es
--    un detalle de vocabulario. **M6 es memorial**, y `MODELO_LOYALTY` §7.1
--    apaga TODO el motor en memorial — cero hitos, cero rachas, cero
--    beneficios, cero menciones. Un alimento etiquetado «para fin de vida» es
--    exactamente lo que ese artículo prohíbe, y el apagado es ESTRUCTURAL, no
--    un filtro de pantalla que se pueda agregar después.
--
-- ⚠️ Y el momento importa: hoy `productos` tiene CERO filas. Revertir después
--    de cargar el catálogo obliga a limpiar datos para volver a ponerlo.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS chk_productos_momentos_aplicables;
COMMENT ON COLUMN public.productos.momentos_aplicables IS NULL;
COMMIT;
