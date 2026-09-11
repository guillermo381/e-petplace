-- S115-A · TANDA 1 (e) — EL DESGLOSE POR LÍNEA
-- Letra: MODELO_FISCAL v0.3 §4 (regla 2) y §8. Reversa: docs/relevamientos/S115-A-REVERSA-20260912230000-lineas-fiscales.sql
-- VEDA 76(g): NO RIGE (tabla nueva; no reescribe desgloses existentes).
--
-- POR QUÉ EXISTE: el desglose congelado de hoy es POR COMPRA y sólo TOTALES
-- (`subtotal · impuesto · total`). Una factura necesita base y tarifa POR LÍNEA.
-- El único IVA por ítem que hay en la casa vive en `pedido_items` (la despensa).
--
-- 🔴 LA CONVENCIÓN NO SE ELIGIÓ: SE MIDIÓ. El precio guardado es la BASE y el IVA
--    se SUMA encima — medido sobre las líneas reales al 15 %: `impuesto_monto`
--    coincide exacto con `subtotal × pct` (1,01 sobre 6,70) y en `pedidos`
--    `subtotal + impuesto_total = total` cierra en todas.
--    ⚠️ CONSECUENCIA PARA LA MESA, declarada y NO decidida acá: hoy los servicios
--    van a IVA 0 y total = subtotal, así que nada cambia. **El día que F1 resuelva
--    15 % para veterinaria, o cualquier servicio pase a gravado, hay que decidir si
--    el precio del prestador pasa a ser BRUTO o si la familia paga 15 % más de lo
--    que ve.** Es decisión de producto y de letra, no de esta migración.
--
-- 🔴 EL REDONDEO ES UNA REGLA DE LA BASE, NO UNA CONVENCIÓN. `_shared/iva.ts`
--    declara hoy que «tolera las dos formas a propósito». Acá deja de tolerarlas:
--    cada línea redondea a dos decimales y el total es la SUMA DE LAS LÍNEAS.
--    Vive como CHECK ⇒ una línea mal redondeada es inexpresable, no un bug a cazar.

BEGIN;

CREATE TABLE public.pagos_desglose_lineas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_intento_id     uuid NOT NULL REFERENCES public.pagos_intentos(id) ON DELETE CASCADE,
  linea               int  NOT NULL,
  descripcion         text NOT NULL,
  cantidad            numeric(12,3) NOT NULL DEFAULT 1,
  precio_unitario     numeric(12,2) NOT NULL,
  descuento           numeric(12,2) NOT NULL DEFAULT 0,
  codigo_iva          text NOT NULL REFERENCES public.cat_tasas_impuesto(codigo) ON DELETE RESTRICT,
  tarifa_pct          numeric(5,2)  NOT NULL,   -- SNAPSHOT: la tarifa del día, no la de hoy
  base                numeric(12,2) NOT NULL,
  valor_iva           numeric(12,2) NOT NULL,
  cuenta_comercial_id uuid REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  origen_tipo         text NOT NULL,
  origen_id           uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_linea_por_intento UNIQUE (pago_intento_id, linea),
  CONSTRAINT chk_linea_positiva   CHECK (linea >= 1),
  CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT chk_descuento_no_negativo CHECK (descuento >= 0),
  /* La base es cantidad × precio − descuento, redondeada UNA vez. */
  CONSTRAINT chk_base_cuadra CHECK (
    base = round(cantidad * precio_unitario - descuento, 2)
  ),
  /* 🔴 LA REGLA DE REDONDEO, EN LA BASE. Y NO al revés: `round(iva/base*100)` invierte
     la operación y arrastra el error del redondeo al porcentaje — de ahí salió el
     14,98 que rompió todo el 25-ago (`_shared/iva.ts` lo tiene escrito). */
  CONSTRAINT chk_iva_cuadra CHECK (
    valor_iva = round(base * tarifa_pct / 100, 2)
  ),
  CONSTRAINT chk_tarifa_no_negativa CHECK (tarifa_pct >= 0)
);

COMMENT ON TABLE public.pagos_desglose_lineas IS
  'La base imponible LÍNEA POR LÍNEA de un pago. Es la fuente de la que salen los tres campos del riel (taxable_amount, tax_percentage, vat) y los ítems del documento canónico. `tarifa_pct` es SNAPSHOT: una factura vieja sigue diciendo la tarifa con la que se emitió.';

CREATE INDEX idx_lineas_intento ON public.pagos_desglose_lineas (pago_intento_id, linea);
CREATE INDEX idx_lineas_cuenta  ON public.pagos_desglose_lineas (cuenta_comercial_id) WHERE cuenta_comercial_id IS NOT NULL;

ALTER TABLE public.pagos_desglose_lineas ENABLE ROW LEVEL SECURITY;
/* Se lee por la puerta de packages/api (DEFINER), no por PostgREST: una línea
   fiscal ajena no se ofrece ni filtrada. */
CREATE POLICY lineas_admin ON public.pagos_desglose_lineas
  FOR SELECT TO authenticated USING (is_admin());

-- ── LOS TRES CAMPOS DEL RIEL, DERIVADOS ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.totales_fiscales_del_intento(p_intento_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_base numeric; v_iva numeric; v_n int; v_pcts int;
BEGIN
  SELECT count(*), sum(base), sum(valor_iva), count(DISTINCT tarifa_pct)
    INTO v_n, v_base, v_iva, v_pcts
    FROM public.pagos_desglose_lineas WHERE pago_intento_id = p_intento_id;

  /* 🔴 FAIL-CLOSED. Un intento sin líneas no vale CERO: no se sabe cuánto vale.
     Devolver ceros acá le daría al riel un `taxable_amount` mentiroso y la
     diferencia aparecería recién en la conciliación del mes. */
  IF COALESCE(v_n,0) = 0 THEN
    RAISE EXCEPTION 'intento_sin_lineas_fiscales'
      USING ERRCODE = '22023',
            DETAIL  = 'No hay desglose por línea para este pago: no se puede derivar la base imponible.';
  END IF;

  RETURN jsonb_build_object(
    'taxable_amount', v_base,
    'vat',            v_iva,
    /* Con una sola tarifa se declara esa; con varias, el campo del riel no puede
       decir un porcentaje único y se dice NULL en vez de inventar un promedio.
       *Un promedio de tarifas no es una tarifa.* */
    'tax_percentage', CASE WHEN v_pcts = 1
                           THEN (SELECT DISTINCT tarifa_pct FROM public.pagos_desglose_lineas
                                  WHERE pago_intento_id = p_intento_id)
                           ELSE NULL END,
    'total',          v_base + v_iva,
    'lineas',         v_n,
    'tarifas_distintas', v_pcts
  );
END $fn$;
REVOKE EXECUTE ON FUNCTION public.totales_fiscales_del_intento(uuid) FROM PUBLIC, anon;

COMMIT;
