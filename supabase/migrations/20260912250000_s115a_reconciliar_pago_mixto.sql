-- S115-A · TANDA 1 (e·3) — EL RECONCILIADOR APRENDE EL PAGO MIXTO
-- Reversa: cubierta por la de (e).
-- VEDA 76(g): NO RIGE.
--
-- 🔴 DEFECTO DEL INSTRUMENTO, CAZADO MIDIENDO — no del producto.
--    La v1 comparaba las líneas contra `pagos_intentos.monto`. Pero en un PAGO
--    MIXTO (S114) `monto` es SÓLO la parte del riel: la otra mitad la puso el saldo
--    del hogar (`compras.saldo_aplicado`). Medido sobre una compra real:
--      monto=208,10 · saldo_aplicado=75,50 · total pedidos=283,60 · líneas=283,60
--    ⇒ el reconciliador reportaba **75,50 de divergencia sobre un pago que cerraba
--    perfecto**, y lo habría hecho para toda compra pagada con saldo.
--    *Un instrumento que compara contra la mitad de la plata no mide una divergencia:
--    fabrica una.* La cura suma las dos fuentes, que es lo que S114 firmó:
--    cada parte de su fuente, pero el documento fiscal es por el TOTAL.

BEGIN;

CREATE OR REPLACE FUNCTION public.reconciliar_lineas_con_congelado(p_intento_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_lineas numeric; v_riel numeric; v_saldo numeric := 0; v_pagado numeric;
BEGIN
  SELECT sum(base + valor_iva) INTO v_lineas
    FROM public.pagos_desglose_lineas WHERE pago_intento_id = p_intento_id;

  SELECT pi.monto, COALESCE(c.saldo_aplicado, 0)
    INTO v_riel, v_saldo
    FROM public.pagos_intentos pi
    LEFT JOIN public.compras c ON c.id = pi.compra_id
   WHERE pi.id = p_intento_id;

  v_pagado := COALESCE(v_riel,0) + COALESCE(v_saldo,0);

  RETURN jsonb_build_object(
    'lineas_total',  v_lineas,
    'riel',          v_riel,
    'saldo',         v_saldo,
    'pagado_total',  v_pagado,
    'cuadra', (v_lineas IS NOT NULL AND v_riel IS NOT NULL AND round(v_lineas,2) = round(v_pagado,2)),
    'diferencia',    round(COALESCE(v_lineas,0) - v_pagado, 2),
    'motivo', CASE
      WHEN v_lineas IS NULL THEN 'sin_lineas'
      WHEN v_riel   IS NULL THEN 'sin_intento'
      WHEN round(v_lineas,2) = round(v_pagado,2) THEN NULL
      ELSE 'tarifa_del_catalogo_no_coincide_con_el_congelado' END
  );
END $fn$;
REVOKE EXECUTE ON FUNCTION public.reconciliar_lineas_con_congelado(uuid) FROM PUBLIC, anon;

COMMIT;
