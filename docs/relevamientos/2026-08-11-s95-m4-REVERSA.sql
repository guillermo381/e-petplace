-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 4 · S95-C — el pedido
--   supabase/migrations/20260811150000_s95_m4_pedido.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ HOY la deshace sin pérdida: `pedidos` y `pedido_items` estaban en CERO
--      filas (cinturón 0 de la migración lo verifica y aborta si no), y las
--      tres tablas nuevas nacieron vacías.
--
--   ❌ CON EL PRIMER PEDIDO REAL DEJA DE SERVIR, y de la peor forma: revertir
--      **borra `pedido_estados`, que es la historia de qué le pasó a un
--      pedido y quién lo movió.** `pedidos.estado_actual` es una
--      materialización: conservar el estado final sin su historia deja un
--      pedido que nadie puede auditar ante un reclamo.
--
--   ❌ Y devuelve `pedidos.items` como jsonb VACÍO. Los ítems que vivieran en
--      `pedido_items` **no se copian de vuelta al jsonb**: esta reversa
--      restituye la FORMA vieja, no traduce los datos a ella.
--
--   ⇒ Con pedidos reales, esta reversa NO se ejecuta: se escribe otra.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

DROP TRIGGER IF EXISTS trg_pedido_estado_actual ON public.pedido_estados;
DROP FUNCTION IF EXISTS public._trg_pedido_estado_actual();

DROP TABLE IF EXISTS public.pedido_descuentos;
DROP TABLE IF EXISTS public.pedido_estados;

-- ─── `pedido_items` vuelve a su forma anterior ─────────────────────────────
ALTER TABLE public.pedido_items
  DROP COLUMN IF EXISTS variante_id,
  DROP COLUMN IF EXISTS oferta_id,
  DROP COLUMN IF EXISTS cuenta_comercial_id,
  DROP COLUMN IF EXISTS moneda,
  DROP COLUMN IF EXISTS impuesto_codigo,
  DROP COLUMN IF EXISTS impuesto_pct,
  DROP COLUMN IF EXISTS impuesto_monto;

ALTER TABLE public.pedido_items
  ADD COLUMN seller_id     uuid REFERENCES public.profiles(id),
  ADD COLUMN tracking_code text,
  ADD COLUMN despachado_en timestamptz,
  ADD COLUMN entregado_en  timestamptz;

-- ─── `pedidos` vuelve a su forma anterior ──────────────────────────────────
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS chk_pedido_total_cierra;
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS chk_retiro_apagado_v1;

ALTER TABLE public.pedidos
  DROP COLUMN IF EXISTS cuenta_comercial_id,
  DROP COLUMN IF EXISTS moneda,
  DROP COLUMN IF EXISTS impuesto_total,
  DROP COLUMN IF EXISTS costo_envio,
  DROP COLUMN IF EXISTS metodo_entrega,
  DROP COLUMN IF EXISTS clave_idempotencia,
  DROP COLUMN IF EXISTS entrega_nombre_receptor,
  DROP COLUMN IF EXISTS entrega_telefono,
  DROP COLUMN IF EXISTS entrega_direccion,
  DROP COLUMN IF EXISTS entrega_ciudad,
  DROP COLUMN IF EXISTS entrega_sector,
  DROP COLUMN IF EXISTS entrega_referencias,
  DROP COLUMN IF EXISTS entrega_lat,
  DROP COLUMN IF EXISTS entrega_lon,
  DROP COLUMN IF EXISTS promesa_entrega_desde,
  DROP COLUMN IF EXISTS promesa_entrega_hasta;

-- `estado` NO se recrea: nunca se borró (estaba bloqueada por
-- v_dashboard_logistico). Solo se le quita la FK al catálogo y se le devuelve
-- su default viejo. Ídem `pagado_en` y `kushki_status`, que tampoco se fueron.
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_fkey;
ALTER TABLE public.pedidos
  ALTER COLUMN estado SET DEFAULT 'confirmado',
  ALTER COLUMN estado DROP NOT NULL;

ALTER TABLE public.pedidos
  ALTER COLUMN user_id  DROP NOT NULL,
  ALTER COLUMN total    DROP NOT NULL,
  ALTER COLUMN subtotal DROP NOT NULL,
  ADD COLUMN items            jsonb,
  ADD COLUMN direccion        text,
  ADD COLUMN ciudad           text,
  ADD COLUMN metodo_pago      text,
  ADD COLUMN guest_email      text,
  ADD COLUMN cupon_codigo     text,
  ADD COLUMN tracking_code    text,
  ADD COLUMN courier          text,
  ADD COLUMN es_programado    boolean NOT NULL DEFAULT false,
  ADD COLUMN kushki_token     text,
  ADD COLUMN kushki_charge_id text,
  ADD COLUMN kushki_response  jsonb;
-- `kushki_status` y su CHECK no se recrean: nunca se fueron.

DROP TABLE IF EXISTS public.cat_estados_pedido;

-- ─── policies ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS pedidos_select ON public.pedidos;
DROP POLICY IF EXISTS pedidos_update ON public.pedidos;
DROP POLICY IF EXISTS pedidos_delete ON public.pedidos;
CREATE POLICY pedidos_select_owner ON public.pedidos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY pedidos_select_admin ON public.pedidos FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY pedidos_update ON public.pedidos FOR UPDATE TO public
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY admins_update_pedidos ON public.pedidos FOR UPDATE TO public
  USING (is_admin());

DROP POLICY IF EXISTS items_select ON public.pedido_items;
DROP POLICY IF EXISTS items_insert ON public.pedido_items;
DROP POLICY IF EXISTS items_update ON public.pedido_items;
DROP POLICY IF EXISTS items_delete ON public.pedido_items;
CREATE POLICY pedido_items_admin ON public.pedido_items FOR ALL TO authenticated
  USING (is_admin());
CREATE POLICY pedido_items_owner ON public.pedido_items FOR SELECT TO authenticated
  USING ((pedido_id IN (SELECT pedidos.id FROM pedidos WHERE pedidos.user_id = auth.uid()))
         OR is_admin());

COMMIT;
