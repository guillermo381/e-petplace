-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA NOTA DE CRÉDITO, TOTAL Y PARCIAL, DESDE LOS CAMINOS REALES
--
-- 🔴 LO QUE LA MEDICIÓN CAMBIÓ DEL DISEÑO. La forma obvia era colgarla del
--    ledger —donde `aplicar_reembolso` escribe el evento inverso—. Medido:
--    **21 casos con devolución y sólo 2 con `evento_reembolso_id`.** Colgarla ahí
--    habría cubierto 2 de 21 y el tablero se habría visto sano.
--    *El ledger registra el efecto sobre el payout del prestador; la nota de
--    crédito documenta la plata que vuelve a la FAMILIA. Son dos hechos
--    distintos y sólo uno de ellos siempre ocurre.*
--
-- LOS DOS PUNTOS ESTRUCTURALES, medidos, que cubren los tres caminos de producto:
--   ① `casos_postventa` resuelto con devolución  → total y parcial (21 casos)
--   ② `pagos_intentos` → `reversado`             → el reverso del riel (6 intentos)
-- El tercero del ledger NO tiene trigger propio A PROPÓSITO: sus dos únicos
-- productores (`caso_resolver`, `_resolver_caso_clase1`) pasan por ① — colgarlo
-- también ahí emitiría DOS notas por la misma devolución.
--
-- ⚠️ EL ÍNDICE QUE MOLDEÓ TODO: `uq_documento_fiscal_pago` es UNIQUE sobre
--    `pago_intento_id`. Una nota de crédito NO puede reusarlo — colisionaría con
--    su propia factura. Por eso la NC se identifica por `documento_referencia_id`
--    + `origen_reembolso`, y ésa es también su llave de idempotencia: **dos
--    devoluciones parciales sobre la misma factura son DOS notas legítimas**, y
--    una llave por factura las habría fundido en una.
--
-- 76(g) — VEDA: **NO RIGE.** Columna nullable + funciones + triggers. Sin backfill.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.documentos_fiscales
  ADD COLUMN IF NOT EXISTS origen_reembolso text;

COMMENT ON COLUMN public.documentos_fiscales.origen_reembolso IS
  'Qué devolución documenta esta nota de crédito: caso:<uuid> | reverso:<uuid>. '
  'Es su llave de idempotencia — la del HECHO económico, no la de la factura, '
  'porque dos parciales sobre una misma factura son dos notas legítimas.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_documento_fiscal_origen_reembolso
  ON public.documentos_fiscales (origen_reembolso)
  WHERE origen_reembolso IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- ① DEL OBJETO DEL CASO AL INTENTO QUE LO PAGÓ
--
-- Los tres `objeto_tipo` vivos (cita=20 · estadia=5 · pedido=3) llegan por
-- caminos distintos, y la estadía llega por su cita — no tiene pago propio.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._intento_del_objeto(p_tipo text, p_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v uuid;
BEGIN
  IF p_tipo = 'cita' THEN
    SELECT id INTO v FROM public.pagos_intentos
     WHERE cita_id = p_id AND estado = 'aprobado' ORDER BY creado_en DESC LIMIT 1;

  ELSIF p_tipo = 'estadia' THEN
    /* La estadía no se paga sola: se paga su cita (o el bono/mensualidad que la
       cubre). Se resuelve por la cita, que es el único vínculo que la tabla tiene. */
    SELECT pi.id INTO v FROM public.guarderia_estadias e
      JOIN public.pagos_intentos pi ON pi.cita_id = e.cita_id AND pi.estado = 'aprobado'
     WHERE e.id = p_id ORDER BY pi.creado_en DESC LIMIT 1;

  ELSIF p_tipo = 'pedido' THEN
    SELECT pi.id INTO v FROM public.pagos_intentos pi
     WHERE pi.estado = 'aprobado'
       AND (pi.pedido_id = p_id
            OR pi.compra_id = (SELECT compra_id FROM public.pedidos WHERE id = p_id))
     ORDER BY pi.creado_en DESC LIMIT 1;
  END IF;

  RETURN v;   -- NULL es una respuesta: quien llama decide, ésta no adivina.
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- ② LA PUERTA ÚNICA
--
-- 🔴 EL TOTAL SE DERIVA DE LAS LÍNEAS, NO SE IMPONE. Se prorratean las BASES en
--    centavos enteros —el residuo lo absorbe la última línea— y el IVA de cada
--    línea se DERIVA de su base con su propia tarifa, que es la regla de la casa
--    (`chk_iva_cuadra`). *Prorratear el IVA por separado da un número que no
--    cuadra con su base, y el que lo descubre es el SRI, no nosotros.*
--    Si el total derivado se aparta del solicitado por más de un centavo, la nota
--    nace `pendiente_manual` DICIÉNDOLO — jamás se fuerza el número.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.emitir_nota_credito(
  p_pago_intento_id  uuid,
  p_alcance          text,          -- 'total' | 'parcial'
  p_monto            numeric,       -- lo devuelto a la familia (con IVA)
  p_motivo           text,
  p_origen_reembolso text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_fac        public.documentos_fiscales;
  v_lineas     jsonb := '[]'::jsonb;
  v_l          record;
  v_total_c    bigint;    -- total de la factura, en centavos
  v_pedido_c   bigint;    -- lo pedido devolver, en centavos
  v_base_c     bigint;
  v_acum_c     bigint := 0;
  v_n          int;
  v_i          int := 0;
  v_iva_c      bigint;
  v_sum_base_c bigint := 0;
  v_sum_iva_c  bigint := 0;
  v_id         uuid;
  v_estado     public.fiscal_estado_enum;
  v_motivo     text := NULL;
  v_derivado   numeric;
BEGIN
  IF p_alcance NOT IN ('total','parcial') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'alcance_invalido');
  END IF;
  IF p_origen_reembolso IS NULL OR btrim(p_origen_reembolso) = '' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_llave_de_idempotencia');
  END IF;

  -- Idempotencia primero: la misma devolución no emite dos veces.
  SELECT id INTO v_id FROM public.documentos_fiscales
   WHERE origen_reembolso = p_origen_reembolso;
  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_existia', 'documento_id', v_id);
  END IF;

  SELECT * INTO v_fac FROM public.documentos_fiscales
   WHERE pago_intento_id = p_pago_intento_id AND tipo = 'factura';
  IF v_fac.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_factura_que_acreditar',
                              'pago_intento_id', p_pago_intento_id);
  END IF;
  IF v_fac.sentido <> 'emitido' THEN
    /* En agencia la factura la emitió el tercero: la nota de crédito también es
       suya. Nosotros no acreditamos lo que no facturamos. */
    RETURN jsonb_build_object('ok', false, 'codigo', 'factura_de_tercero',
                              'documento_id', v_fac.id);
  END IF;

  v_total_c  := round(v_fac.total * 100)::bigint;
  v_pedido_c := CASE WHEN p_alcance = 'total' THEN v_total_c
                     ELSE round(COALESCE(p_monto, 0) * 100)::bigint END;
  IF v_total_c <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'factura_sin_total');
  END IF;
  IF v_pedido_c <= 0 OR v_pedido_c > v_total_c THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'monto_fuera_de_rango',
                              'pedido', v_pedido_c, 'factura', v_total_c);
  END IF;

  SELECT count(*) INTO v_n FROM public.pagos_desglose_lineas
   WHERE pago_intento_id = p_pago_intento_id;
  IF v_n = 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'factura_sin_lineas');
  END IF;

  FOR v_l IN
    SELECT * FROM public.pagos_desglose_lineas
     WHERE pago_intento_id = p_pago_intento_id ORDER BY linea
  LOOP
    v_i := v_i + 1;
    IF v_i < v_n THEN
      v_base_c := round(round(v_l.base * 100)::numeric * v_pedido_c / v_total_c)::bigint;
      v_acum_c := v_acum_c + v_base_c;
    ELSE
      /* La última absorbe el residuo: sin esto, la suma de bases prorrateadas
         se aparta del objetivo por los redondeos de cada línea. */
      v_base_c := round(round((SELECT sum(base) FROM public.pagos_desglose_lineas
                                WHERE pago_intento_id = p_pago_intento_id) * 100)::numeric
                        * v_pedido_c / v_total_c)::bigint - v_acum_c;
    END IF;
    IF v_base_c < 0 THEN v_base_c := 0; END IF;

    v_iva_c := round(v_base_c::numeric * v_l.tarifa_pct / 100)::bigint;
    v_sum_base_c := v_sum_base_c + v_base_c;
    v_sum_iva_c  := v_sum_iva_c + v_iva_c;

    v_lineas := v_lineas || jsonb_build_object(
      'linea', v_l.linea, 'descripcion', v_l.descripcion,
      'cantidad', v_l.cantidad, 'precio_unitario', round(v_base_c::numeric/100, 2),
      'descuento', 0, 'codigo_iva', v_l.codigo_iva, 'tarifa_pct', v_l.tarifa_pct,
      'base', round(v_base_c::numeric/100, 2), 'valor_iva', round(v_iva_c::numeric/100, 2),
      'origen_tipo', v_l.origen_tipo, 'origen_id', v_l.origen_id);
  END LOOP;

  v_derivado := round((v_sum_base_c + v_sum_iva_c)::numeric / 100, 2);

  IF abs(v_derivado * 100 - v_pedido_c) > 1 THEN
    v_estado := 'pendiente_manual';
    v_motivo := format('nota_credito_monto_no_cuadra: solicitado=%s derivado=%s. '
                       'El total de una nota de crédito SALE de sus líneas; '
                       'forzarlo produciría un documento que no cuadra con su IVA.',
                       round(v_pedido_c::numeric/100,2), v_derivado);
  ELSE
    v_estado := CASE WHEN v_fac.estado = 'autorizada' THEN 'borrador'
                     ELSE 'pendiente_manual' END;
    IF v_estado = 'pendiente_manual' THEN
      v_motivo := format('factura_no_autorizada(%s): no se acredita lo que el SRI '
                         'todavía no reconoció.', v_fac.estado);
    END IF;
  END IF;

  INSERT INTO public.documentos_fiscales
    (pago_intento_id, user_id, cuenta_comercial_id, country_code, tipo, total, moneda,
     estado, sentido, rol, emitida_por_tercero, tax_profile_id,
     tipo_identificacion, identificacion, razon_social, direccion, email,
     documento_referencia_id, origen_reembolso, items, motivo_rechazo, fecha_emision)
  VALUES
    (NULL,                       -- 🔴 NULL a propósito: `uq_documento_fiscal_pago`
     v_fac.user_id, v_fac.cuenta_comercial_id, v_fac.country_code,
     'nota_credito', v_derivado, v_fac.moneda,
     v_estado, 'emitido', v_fac.rol, false, v_fac.tax_profile_id,
     v_fac.tipo_identificacion, v_fac.identificacion, v_fac.razon_social,
     v_fac.direccion, v_fac.email,
     v_fac.id, p_origen_reembolso, v_lineas,
     COALESCE(v_motivo, 'motivo: ' || COALESCE(p_motivo, 'devolución')),
     public.fiscal_hoy())
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'documento_id', v_id, 'estado', v_estado,
                            'total', v_derivado, 'lineas', jsonb_array_length(v_lineas));
END $$;

COMMENT ON FUNCTION public.emitir_nota_credito(uuid, text, numeric, text, text) IS
  'La puerta única de la nota de crédito. Idempotente por origen_reembolso. '
  'El total SALE de las líneas prorrateadas; si no cuadra con lo pedido, la nota '
  'nace pendiente_manual diciéndolo.';

-- ─────────────────────────────────────────────────────────────────────────
-- ③ LOS DOS PRODUCTORES — «grita, no se cae»
--    La devolución YA ocurrió cuando estos corren. Dejar caer la excepción
--    revertiría la devolución para salvar un documento, que es exactamente al
--    revés. Se grita por los dos lugares donde alguien puede oírlo.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_caso_resuelto_nota_credito()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_intento uuid; v_r jsonb;
BEGIN
  IF NEW.resolucion_alcance IS NULL
     OR NEW.resolucion_alcance = 'sin_devolucion'
     OR COALESCE(OLD.resolucion_alcance,'') = NEW.resolucion_alcance THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_intento := public._intento_del_objeto(NEW.objeto_tipo, NEW.objeto_id);
    IF v_intento IS NULL THEN
      RAISE WARNING 'nota_credito_sin_intento caso=% objeto=%/%',
                    NEW.id, NEW.objeto_tipo, NEW.objeto_id;
      RETURN NEW;
    END IF;
    v_r := public.emitir_nota_credito(
             v_intento, NEW.resolucion_alcance, NEW.monto_devuelto,
             COALESCE(NEW.motivo_codigo, 'postventa'), 'caso:' || NEW.id::text);
    IF COALESCE((v_r->>'ok')::boolean, false) IS NOT TRUE THEN
      RAISE WARNING 'nota_credito_no_emitida caso=% %', NEW.id, v_r::text;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'nota_credito_fallo caso=% %', NEW.id, left(SQLSTATE||': '||SQLERRM, 160);
  END;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_caso_resuelto_nota_credito
  AFTER UPDATE OF resolucion_alcance ON public.casos_postventa
  FOR EACH ROW EXECUTE FUNCTION public._trg_caso_resuelto_nota_credito();

CREATE OR REPLACE FUNCTION public._trg_reverso_nota_credito()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_r jsonb;
BEGIN
  IF NEW.estado <> 'reversado' OR COALESCE(OLD.estado,'') = 'reversado' THEN
    RETURN NEW;
  END IF;
  BEGIN
    /* Un reverso del riel devuelve el cobro ENTERO: es total por definición. */
    v_r := public.emitir_nota_credito(NEW.id, 'total', NULL,
             'reverso ' || COALESCE(NEW.proveedor,'riel'), 'reverso:' || NEW.id::text);
    IF COALESCE((v_r->>'ok')::boolean, false) IS NOT TRUE THEN
      RAISE WARNING 'nota_credito_no_emitida reverso=% %', NEW.id, v_r::text;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'nota_credito_fallo reverso=% %', NEW.id, left(SQLSTATE||': '||SQLERRM, 160);
  END;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_reverso_nota_credito
  AFTER UPDATE OF estado ON public.pagos_intentos
  FOR EACH ROW EXECUTE FUNCTION public._trg_reverso_nota_credito();

-- ─────────────────────────────────────────────────────────────────────────
-- ④ EL LECTOR QUE CUENTA LO QUE NO SE ESCRIBIÓ
--    Mismo molde que `pagos_aprobados_sin_documento`: *un lector que sólo ve lo
--    que se escribió no puede ver lo que no se escribió.*
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reembolsos_sin_nota_credito()
RETURNS TABLE (camino text, referencia uuid, cuando timestamptz, monto numeric, por_que text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT 'caso'::text, c.id, c.resuelto_en, c.monto_devuelto,
         CASE WHEN public._intento_del_objeto(c.objeto_tipo, c.objeto_id) IS NULL
              THEN 'no se pudo resolver el pago del objeto ' || c.objeto_tipo
              ELSE 'la devolución ocurrió y la nota no se emitió' END
    FROM public.casos_postventa c
   WHERE c.resolucion_alcance IN ('total','parcial')
     AND NOT EXISTS (SELECT 1 FROM public.documentos_fiscales d
                      WHERE d.origen_reembolso = 'caso:' || c.id::text)
  UNION ALL
  SELECT 'reverso', p.id, p.actualizado_en, p.monto,
         'el riel devolvió y la nota no se emitió'
    FROM public.pagos_intentos p
   WHERE p.estado = 'reversado'
     AND NOT EXISTS (SELECT 1 FROM public.documentos_fiscales d
                      WHERE d.origen_reembolso = 'reverso:' || p.id::text);
$$;

-- ⑤ L-140
REVOKE EXECUTE ON FUNCTION public._intento_del_objeto(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.emitir_nota_credito(uuid, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reembolsos_sin_nota_credito() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._trg_caso_resuelto_nota_credito() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._trg_reverso_nota_credito() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.emitir_nota_credito(uuid, text, numeric, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reembolsos_sin_nota_credito() TO service_role;
GRANT EXECUTE ON FUNCTION public._intento_del_objeto(text, uuid) TO service_role;
