-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA CONCILIACIÓN DE LOS CUATRO RELOJES
--
-- Los cuatro relojes que tienen que marcar la misma hora, y hoy nadie los mira
-- juntos:
--   ① EL RIEL         `pagos_intentos`      — lo que entró y lo que volvió
--   ② EL LEDGER       `eventos_economicos`  — lo devengado y lo reversado
--   ③ EL FISCAL       `documentos_fiscales` — lo facturado y lo acreditado
--   ④ LA LIQUIDACIÓN  `liquidaciones`       — lo pagado al prestador
--
-- 🔴 NO CORRIGE NADA, A PROPÓSITO. *Un mes donde se cobró y no se facturó tiene
--    que gritar solo* — y una conciliación que además arregla convierte una
--    divergencia visible en un ajuste silencioso, que es peor que la divergencia.
--
-- SU PRIMER HALLAZGO YA ESTÁ ADENTRO, medido el 10-sep-2026 20:41 UTC:
--   **21 casos con devolución · sólo 2 con evento en el ledger · 19 sin él,
--   $186,40.** Apareció armando las notas de crédito, no buscándolo. El código
--   `devuelto_sin_ledger` existe para que la próxima vez lo diga la vista y no
--   haga falta que alguien tropiece con él.
--
-- 76(g) — VEDA: NO RIGE. Dos lectores, cero escritura.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fiscal_conciliacion_relojes(
  p_desde date DEFAULT (public.fiscal_hoy() - 180),
  p_hasta date DEFAULT public.fiscal_hoy()
) RETURNS TABLE (
  periodo               text,
  cuenta_comercial_id   uuid,
  cuenta                text,
  riel_cobrado          numeric,
  riel_devuelto         numeric,
  ledger_devengado      numeric,
  ledger_reversado      numeric,
  fiscal_facturado      numeric,
  fiscal_acreditado     numeric,
  liquidacion_pagada    numeric,
  divergencias          text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  /* El discriminador de la casa (molde D-389/D-526): el gate protege el camino
     de la APP; el motor —una migración, un cinturón, la edge con service_role—
     pasa. *Un lector que su propio cinturón no puede ejercer no se puede probar.* */
  IF NOT (public.is_admin() OR current_user <> 'authenticated') THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH
  /* ① EL RIEL. La cuenta se resuelve por el mismo camino que el outbox fiscal:
        por el sujeto del intento. Un intento sin cuenta resoluble NO se descarta
        —cae en la fila de cuenta NULL— porque descartarlo lo volvería invisible
        justo en la vista que existe para ver lo que no cuadra. */
  riel AS (
    SELECT to_char(pi.creado_en, 'YYYY-MM') AS per,
           COALESCE(
             (SELECT p.cuenta_comercial_id FROM pedidos p
               WHERE (pi.compra_id IS NOT NULL AND p.compra_id = pi.compra_id)
                  OR (pi.compra_id IS NULL AND p.id = pi.pedido_id) LIMIT 1),
             (SELECT pr.cuenta_comercial_id FROM evento_cita_servicio c
                JOIN prestadores pr ON pr.id = c.prestador_id WHERE c.id = pi.cita_id),
             (SELECT pr.cuenta_comercial_id FROM bonos b
                JOIN prestadores pr ON pr.id = b.prestador_id WHERE b.id = pi.bono_id)
           ) AS cta,
           sum(pi.monto) FILTER (WHERE pi.estado = 'aprobado')   AS cobrado,
           sum(pi.monto) FILTER (WHERE pi.estado = 'reversado')  AS devuelto
      FROM pagos_intentos pi
     WHERE pi.creado_en::date BETWEEN p_desde AND p_hasta
     GROUP BY 1, 2
  ),
  ledger AS (
    SELECT to_char(e.fecha_devengo, 'YYYY-MM') AS per, e.cuenta_comercial_id AS cta,
           sum(e.monto_bruto) FILTER (WHERE e.monto_bruto > 0) AS devengado,
           abs(COALESCE(sum(e.monto_bruto) FILTER (WHERE e.monto_bruto < 0), 0)) AS reversado
      FROM eventos_economicos e
     WHERE e.fecha_devengo::date BETWEEN p_desde AND p_hasta
     GROUP BY 1, 2
  ),
  fisc AS (
    SELECT to_char(d.fecha_emision, 'YYYY-MM') AS per, d.cuenta_comercial_id AS cta,
           sum(d.total) FILTER (WHERE d.tipo = 'factura'      AND d.estado = 'autorizada') AS facturado,
           sum(d.total) FILTER (WHERE d.tipo = 'nota_credito' AND d.estado = 'autorizada') AS acreditado
      FROM documentos_fiscales d
     WHERE d.fecha_emision BETWEEN p_desde AND p_hasta AND d.sentido = 'emitido'
     GROUP BY 1, 2
  ),
  liq AS (
    SELECT to_char(l.periodo_fin, 'YYYY-MM') AS per, l.cuenta_comercial_id AS cta,
           sum(l.monto_neto_a_pagar) FILTER (WHERE l.estado = 'pagado') AS pagada
      FROM liquidaciones l
     WHERE l.periodo_fin BETWEEN p_desde AND p_hasta
     GROUP BY 1, 2
  ),
  llaves AS (
    SELECT per, cta FROM riel
    UNION SELECT per, cta FROM ledger
    UNION SELECT per, cta FROM fisc
    UNION SELECT per, cta FROM liq
  )
  SELECT k.per,
         k.cta,
         COALESCE(cc.razon_social, '(sin cuenta resoluble)'),
         COALESCE(r.cobrado, 0), COALESCE(r.devuelto, 0),
         COALESCE(g.devengado, 0), COALESCE(g.reversado, 0),
         COALESCE(f.facturado, 0), COALESCE(f.acreditado, 0),
         COALESCE(q.pagada, 0),
         /* LAS DIVERGENCIAS SE NOMBRAN. Un número que no cuadra sin un código al
            lado obliga a cada lector a re-derivar qué significa. */
         ARRAY_REMOVE(ARRAY[
           CASE WHEN COALESCE(r.cobrado,0)  > COALESCE(f.facturado,0)  THEN 'cobrado_sin_facturar'  END,
           CASE WHEN COALESCE(f.facturado,0) > COALESCE(r.cobrado,0)   THEN 'facturado_sin_cobrar'   END,
           CASE WHEN COALESCE(r.devuelto,0) > COALESCE(f.acreditado,0) THEN 'devuelto_sin_acreditar' END,
           CASE WHEN COALESCE(q.pagada,0)   > 0 AND COALESCE(g.devengado,0) = 0
                THEN 'pagado_sin_devengo' END
         ], NULL)
    FROM llaves k
    LEFT JOIN riel   r ON r.per = k.per AND r.cta IS NOT DISTINCT FROM k.cta
    LEFT JOIN ledger g ON g.per = k.per AND g.cta IS NOT DISTINCT FROM k.cta
    LEFT JOIN fisc   f ON f.per = k.per AND f.cta IS NOT DISTINCT FROM k.cta
    LEFT JOIN liq    q ON q.per = k.per AND q.cta IS NOT DISTINCT FROM k.cta
    LEFT JOIN cuentas_comerciales cc ON cc.id = k.cta
   ORDER BY k.per DESC, 3;
END $$;

COMMENT ON FUNCTION public.fiscal_conciliacion_relojes(date, date) IS
  'Los cuatro relojes por mes y cuenta: riel · ledger · fiscal · liquidacion. '
  'NO corrige: nombra. Un mes que cobro y no facturo tiene que gritar solo.';

-- ─────────────────────────────────────────────────────────────────────────
-- EL SEGUNDO LECTOR: los hechos SUELTOS que no cuadran, con su nombre.
-- *Un agregado dice que un mes no cuadra; esto dice cuál fila.*
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_conciliacion_hallazgos(
  p_desde date DEFAULT (public.fiscal_hoy() - 180),
  p_hasta date DEFAULT public.fiscal_hoy()
) RETURNS TABLE (
  clase       text,
  referencia  uuid,
  cuando      timestamptz,
  monto       numeric,
  que_pasa    text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  /* El discriminador de la casa (molde D-389/D-526): el gate protege el camino
     de la APP; el motor —una migración, un cinturón, la edge con service_role—
     pasa. *Un lector que su propio cinturón no puede ejercer no se puede probar.* */
  IF NOT (public.is_admin() OR current_user <> 'authenticated') THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  /* 🔴 EL HALLAZGO QUE ESTRENA LA VISTA — 19 de 21 al 10-sep-2026.
     La devolución le llegó a la familia y el ledger no la registró: el payout
     del prestador sigue calculado sobre plata que volvió. */
  SELECT 'devuelto_sin_ledger'::text, c.id, c.resuelto_en, c.monto_devuelto,
         'la devolucion ocurrio y no hay evento inverso en el ledger: el payout '
         'sigue calculado sobre plata que volvio'
    FROM casos_postventa c
   WHERE c.resolucion_alcance IN ('total','parcial')
     AND c.evento_reembolso_id IS NULL
     AND COALESCE(c.resuelto_en::date, c.creado_en::date) BETWEEN p_desde AND p_hasta

  UNION ALL
  SELECT 'devuelto_sin_nota_credito', c.id, c.resuelto_en, c.monto_devuelto,
         'la devolucion ocurrio y no se emitio nota de credito'
    FROM casos_postventa c
   WHERE c.resolucion_alcance IN ('total','parcial')
     AND COALESCE(c.resuelto_en::date, c.creado_en::date) BETWEEN p_desde AND p_hasta
     AND NOT EXISTS (SELECT 1 FROM documentos_fiscales d
                      WHERE d.origen_reembolso = 'caso:' || c.id::text)

  UNION ALL
  SELECT 'reverso_sin_nota_credito', p.id, p.actualizado_en, p.monto,
         'el riel devolvio y no se emitio nota de credito'
    FROM pagos_intentos p
   WHERE p.estado = 'reversado'
     AND p.actualizado_en::date BETWEEN p_desde AND p_hasta
     AND NOT EXISTS (SELECT 1 FROM documentos_fiscales d
                      WHERE d.origen_reembolso = 'reverso:' || p.id::text)

  UNION ALL
  SELECT 'cobrado_sin_documento', p.id, p.actualizado_en, p.monto,
         'el pago se aprobo y no nacio documento fiscal'
    FROM pagos_intentos p
   WHERE p.estado = 'aprobado'
     AND p.actualizado_en::date BETWEEN p_desde AND p_hasta
     AND NOT EXISTS (SELECT 1 FROM documentos_fiscales d WHERE d.pago_intento_id = p.id)

  UNION ALL
  SELECT 'liquidacion_pagada_sin_respaldo', l.id, l.pagado_en, l.monto_neto_a_pagar,
         'se pago sin comprobante validado que cuadre'
    FROM liquidaciones l
   WHERE l.estado = 'pagado'
     AND l.pagado_en::date BETWEEN p_desde AND p_hasta
     AND COALESCE((public.liquidacion_respaldo(l.id)->>'ok')::boolean, false) IS NOT TRUE

   ORDER BY 3 DESC NULLS LAST;
END $$;

REVOKE EXECUTE ON FUNCTION public.fiscal_conciliacion_relojes(date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_conciliacion_hallazgos(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fiscal_conciliacion_relojes(date, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fiscal_conciliacion_hallazgos(date, date) TO authenticated, service_role;

-- CINTURÓN: los dos lectores responden, y el hallazgo del estreno ESTÁ.
DO $c$
DECLARE v_relojes int; v_sin_ledger int; v_monto numeric;
BEGIN
  SELECT count(*) INTO v_relojes FROM public.fiscal_conciliacion_relojes('2026-01-01','2026-12-31');
  SELECT count(*), COALESCE(round(sum(monto),2),0) INTO v_sin_ledger, v_monto
    FROM public.fiscal_conciliacion_hallazgos('2026-01-01','2026-12-31')
   WHERE clase = 'devuelto_sin_ledger';

  IF v_relojes = 0 THEN
    RAISE EXCEPTION 'cinturon: la vista de relojes no devolvio una sola fila sobre una base con datos. '
                    'Un lector que no puede producir su primera fila no esta midiendo.';
  END IF;
  IF v_sin_ledger = 0 THEN
    RAISE EXCEPTION 'cinturon 🔴: el hallazgo del estreno NO aparece. Medido el 10-sep habia 19; '
                    'si hoy hay 0, o alguien los curo (y hay que decirlo) o el lector esta ciego.';
  END IF;
  RAISE NOTICE 'cinturon VERDE: % filas de relojes · % devoluciones sin ledger por $%',
               v_relojes, v_sin_ledger, v_monto;
END $c$;
