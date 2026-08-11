-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 2 · S95-C — el catálogo
--   supabase/migrations/20260811130000_s95_m2_catalogo.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ PUEDE deshacerla ENTERA sin pérdida de dato, y esto es cierto por una
--      razón medida y no por optimismo: `productos` tenía CERO filas al
--      aplicarse (cinturón 0 de la migración lo verifica y aborta si no).
--      Las cinco tablas que nacen empiezan vacías.
--
--   ❌ DEJA DE SER CIERTO EN EL MOMENTO EN QUE SE CARGUE EL PRIMER PRODUCTO.
--      Desde esa carga, revertir borra catálogo real. **Si ya hay productos,
--      esta reversa no se ejecuta: se escribe otra.**
--
--   ⚠️ Revertir REABRE la lectura anónima de `productos`
--      (`productos_public_read`, USING(true) TO public) y devuelve los grants
--      de `anon`. Se incluye por completitud, no porque convenga.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── PARTE 1 · las cinco tablas nuevas, en orden de dependencia ────────────
DROP TABLE IF EXISTS public.ofertas;
DROP TABLE IF EXISTS public.vendedor_skus;
DROP TABLE IF EXISTS public.producto_variantes;
DROP TABLE IF EXISTS public.cat_tasas_impuesto;
-- cat_familias_producto va última: `productos.familia_codigo` la referencia y
-- esa columna se quita en la parte 2. Si esto se ejecuta en orden, para acá
-- todavía existe la FK — por eso el DROP de la columna va ANTES.

-- ─── PARTE 2 · `productos` vuelve a su forma anterior ──────────────────────
ALTER TABLE public.productos
  DROP COLUMN IF EXISTS familia_codigo,
  DROP COLUMN IF EXISTS marca,
  DROP COLUMN IF EXISTS especies_aplicables,
  DROP COLUMN IF EXISTS tallas_aplicables,
  DROP COLUMN IF EXISTS momentos_aplicables,
  DROP COLUMN IF EXISTS ingredientes_activos,
  DROP COLUMN IF EXISTS alergenos,
  DROP COLUMN IF EXISTS es_dieta_prescripcion,
  DROP COLUMN IF EXISTS origen_carga,
  DROP COLUMN IF EXISTS creado_por;

DROP TABLE IF EXISTS public.cat_familias_producto;

ALTER TABLE public.productos
  ADD COLUMN categoria        text NOT NULL DEFAULT 'sin_categoria',
  ADD COLUMN precio           numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN para_especie     text NOT NULL DEFAULT 'todos',
  ADD COLUMN seller_id        uuid REFERENCES public.profiles(id),
  ADD COLUMN seller_perfil_id uuid REFERENCES public.seller_perfil(id) ON DELETE SET NULL,
  ADD COLUMN stock            integer DEFAULT 0,
  ADD COLUMN stock_minimo     integer DEFAULT 5,
  ADD COLUMN sku              text,
  ADD COLUMN peso_kg          numeric(5,2),
  ADD COLUMN variantes        jsonb DEFAULT '[]'::jsonb;
-- El DEFAULT de `categoria` es de la reversa, no del original: la columna era
-- NOT NULL sin default y agregarla sobre una tabla con filas exige un valor.
-- Se declara para que nadie lo lea como el schema de antes.

ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_estado_check;
ALTER TABLE public.productos ADD CONSTRAINT productos_estado_check
  CHECK (estado = ANY (ARRAY['activo'::text,'inactivo'::text,'agotado'::text,'eliminado'::text]));

-- ─── PARTE 3 · el helper ───────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.es_vendedor_de(uuid);

-- ─── PARTE 4 · las policies y grants de `productos` ────────────────────────
-- ⚠️ Esto REABRE la lectura anónima del catálogo.
DROP POLICY IF EXISTS productos_select ON public.productos;
DROP POLICY IF EXISTS productos_insert ON public.productos;
DROP POLICY IF EXISTS productos_update ON public.productos;
DROP POLICY IF EXISTS productos_delete ON public.productos;
CREATE POLICY admins_manage_productos ON public.productos FOR ALL TO public
  USING (is_admin());
CREATE POLICY productos_public_read ON public.productos FOR SELECT TO public
  USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.productos TO anon;

COMMIT;
