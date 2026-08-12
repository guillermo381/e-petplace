-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA · S95-J — el vocabulario de tallas
--   supabase/migrations/20260812060000_s95j_vocabulario_tallas.sql
--
-- ⚠️ DECLARACIÓN HONESTA DE ORDEN: esta reversa se escribió DESPUÉS de aplicar,
--    no antes. El heredoc que la creaba falló en silencio y el comando
--    encadenado aplicó igual. **La regla dice ANTES y no se cumplió.** No se
--    disimula: se declara. El daño concreto fue nulo —la migración solo agrega
--    un CHECK sobre una tabla vacía— pero el orden existe para los casos en que
--    no lo es, y un incumplimiento sin declarar es peor que el incumplimiento.
--
-- ✅ La deshace entera sin pérdida: solo quita un CHECK.
--
-- 🔴 REVERTIR REABRE UN CAMPO QUE DECIDE QUÉ VE UNA MASCOTA. Sin el CHECK, un
--    producto puede declarar `tallas_aplicables = ['XL']` y quedar INVISIBLE
--    para siempre sin que nadie sepa por qué: la recomendación excluye por lo
--    que el producto declara, y una talla que nunca matchea no produce un
--    error — produce una vitrina más chica.
--    Y el momento importa: hoy `productos` tiene CERO filas. Revertir después
--    de cargar el catálogo obliga a limpiar datos para volver a ponerlo.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS chk_productos_tallas_aplicables;
COMMENT ON COLUMN public.productos.tallas_aplicables IS NULL;
COMMIT;
