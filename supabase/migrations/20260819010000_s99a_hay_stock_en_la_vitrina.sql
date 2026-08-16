-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · `hay_stock`: LA SEÑAL QUE LA FAMILIA SÍ PUEDE LEER
--
-- FIRMA DEL FOUNDER (16-ago): dato de producto PERMANENTE, no interruptor de
-- pruebas. **Booleano y jamás número**, por las dos razones de D: la familia
-- necesita *«¿puedo comprar esto?»*, no el inventario ajeno · y *«quedan 3»*
-- es táctica de escasez **y** fuga de dato de negocio. La casa ya tiene la
-- simetría escrita al revés (§7.4: el vendedor jamás ve la mascota).
--
-- POR QUÉ DERIVADA Y NO LEÍDA: la familia **no puede leer `vendedor_skus`** —
-- su única policy es `es_vendedor_de OR is_admin` y `anon` no tiene SELECT—, y
-- eso está bien: **el inventario es del negocio.** La vitrina lee `ofertas`
-- (medido: `despensa-catalogo.ts` va contra esa tabla), así que la señal viaja
-- ahí, **igual que ya viaja el precio**.
--
-- 📌 LA FÓRMULA NO RESTA NADA, y lo declara para que nadie la "mejore":
-- `stock_disponible > 0` **ya es neto de reservas** — el trigger del ledger
-- descuenta la reserva del disponible en el mismo acto (medido del cuerpo).
--
-- 🔴 Y SE ESCRIBE SOLA, SIEMPRE: `authenticated` tiene UPDATE sobre `ofertas`,
-- así que un derivado que dependiera de la buena fe del escritor sería una
-- mentira esperando. El trigger BEFORE lo **pisa** en cada INSERT y en cada
-- UPDATE: **el valor que mande el cliente no se lee jamás.**
--
-- 76(g): NO RIGE. Reversa al pie.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ofertas
  ADD COLUMN IF NOT EXISTS hay_stock boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ofertas.hay_stock IS
  'DERIVADO de vendedor_skus.stock_disponible > 0 (neto de reservas). Lo '
  'mantienen dos triggers y NUNCA el escritor: la familia no puede leer el '
  'inventario del negocio, y esta es la única señal que necesita.';

-- ① Al escribir la oferta, el valor se DERIVA (se ignora lo que venga).
CREATE OR REPLACE FUNCTION public._trg_oferta_deriva_hay_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  SELECT COALESCE(vs.stock_disponible, 0) > 0 INTO NEW.hay_stock
    FROM vendedor_skus vs WHERE vs.id = NEW.sku_id;
  NEW.hay_stock := COALESCE(NEW.hay_stock, false);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_oferta_deriva_hay_stock ON public.ofertas;
CREATE TRIGGER trg_oferta_deriva_hay_stock
  BEFORE INSERT OR UPDATE ON public.ofertas
  FOR EACH ROW EXECUTE FUNCTION public._trg_oferta_deriva_hay_stock();

-- ② Al moverse el saldo, la señal sigue al saldo. Solo escribe si CAMBIA:
--    una venta que baja de 20 a 19 no tiene por qué tocar `ofertas`.
CREATE OR REPLACE FUNCTION public._trg_sku_propaga_hay_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF (OLD.stock_disponible > 0) IS DISTINCT FROM (NEW.stock_disponible > 0) THEN
    UPDATE ofertas SET hay_stock = (NEW.stock_disponible > 0)
     WHERE sku_id = NEW.id AND hay_stock IS DISTINCT FROM (NEW.stock_disponible > 0);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sku_propaga_hay_stock ON public.vendedor_skus;
CREATE TRIGGER trg_sku_propaga_hay_stock
  AFTER UPDATE OF stock_disponible ON public.vendedor_skus
  FOR EACH ROW EXECUTE FUNCTION public._trg_sku_propaga_hay_stock();

-- ③ Backfill de lo que ya existe.
UPDATE public.ofertas o
   SET hay_stock = (vs.stock_disponible > 0)
  FROM public.vendedor_skus vs
 WHERE vs.id = o.sku_id AND o.hay_stock IS DISTINCT FROM (vs.stock_disponible > 0);

-- La columna hereda el grant de TABLA de `ofertas`; se explicita igual para
-- que la decisión quede escrita y no heredada en silencio.
GRANT SELECT (hay_stock) ON public.ofertas TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el discriminador es que la señal SIGA al saldo por los dos
-- caminos: el de la venta (ledger) y el del escritor mentiroso.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_sku uuid; v_of uuid; v_hay boolean; v_desalineadas int;
BEGIN
  -- ① Ninguna oferta desalineada tras el backfill.
  SELECT count(*) INTO v_desalineadas FROM ofertas o JOIN vendedor_skus vs ON vs.id=o.sku_id
   WHERE o.hay_stock IS DISTINCT FROM (vs.stock_disponible > 0);
  IF v_desalineadas <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ①: % oferta(s) con la señal desalineada del saldo', v_desalineadas;
  END IF;

  -- ② EL CAMINO REAL: un ingreso por el LEDGER prende la señal, y una venta
  --    que deja el saldo en cero la apaga. Se prueba sobre un SKU en cero.
  SELECT vs.id, o.id INTO v_sku, v_of
    FROM vendedor_skus vs JOIN ofertas o ON o.sku_id=vs.id
   WHERE vs.stock_disponible = 0 AND o.estado='publicada' LIMIT 1;
  IF v_sku IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN ②: no hay SKU en cero con oferta publicada para discriminar';
  END IF;
  SELECT hay_stock INTO v_hay FROM ofertas WHERE id=v_of;
  IF v_hay THEN RAISE EXCEPTION 'CINTURÓN ②: arranca en true sobre saldo 0'; END IF;

  INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo)
    VALUES (v_sku, 'ingreso', 5, 'CINTURÓN S99-A hay_stock (se revierte)', 'manual');
  SELECT hay_stock INTO v_hay FROM ofertas WHERE id=v_of;
  IF NOT v_hay THEN RAISE EXCEPTION 'CINTURÓN ②: el ingreso NO prendió la señal'; END IF;

  INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo)
    VALUES (v_sku, 'venta_directa', 5, 'CINTURÓN S99-A hay_stock (se revierte)', 'manual');
  SELECT hay_stock INTO v_hay FROM ofertas WHERE id=v_of;
  IF v_hay THEN RAISE EXCEPTION 'CINTURÓN ②: agotar NO apagó la señal'; END IF;

  -- ③ EL ESCRITOR MENTIROSO: mandar `hay_stock=true` sobre un saldo en cero
  --    NO tiene que quedar. Es el brazo que vuelve inexpresable el estado malo.
  UPDATE ofertas SET hay_stock = true WHERE id = v_of;
  SELECT hay_stock INTO v_hay FROM ofertas WHERE id=v_of;
  IF v_hay THEN
    RAISE EXCEPTION 'CINTURÓN ③: un UPDATE del cliente pudo mentir la señal';
  END IF;

  RAISE NOTICE 'CINTURÓN hay_stock: ①②③ verdes — sigue al ledger y no se deja escribir';
  -- Los dos movimientos del brazo ② se compensan solos (ingreso 5 + venta 5 = 0)
  -- y quedan EN EL LEDGER con su motivo: un ledger append-only no se limpia
  -- borrando filas — es exactamente la lección que esta sesión cobró (L-231).
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA (escrita ANTES de aplicar; no deshace el ledger del cinturón, que es
-- append-only por diseño y quedó compensado en su propio acto):
--   DROP TRIGGER IF EXISTS trg_sku_propaga_hay_stock ON public.vendedor_skus;
--   DROP TRIGGER IF EXISTS trg_oferta_deriva_hay_stock ON public.ofertas;
--   DROP FUNCTION IF EXISTS public._trg_sku_propaga_hay_stock();
--   DROP FUNCTION IF EXISTS public._trg_oferta_deriva_hay_stock();
--   ALTER TABLE public.ofertas DROP COLUMN IF EXISTS hay_stock;
-- ⚠️ Revertir deja a la vitrina SIN forma de saber si algo se puede comprar:
--    la familia no puede leer `vendedor_skus`, así que el dato no está "en
--    otro lado" — deja de existir para ella.
-- ═══════════════════════════════════════════════════════════════════════════
