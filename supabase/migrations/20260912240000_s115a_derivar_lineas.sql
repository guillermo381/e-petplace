-- S115-A · TANDA 1 (e·2) — LA DERIVACIÓN: LOS SIETE COMPRABLES, UN SOLO LUGAR
-- Reversa: la misma de (e) — docs/relevamientos/S115-A-REVERSA-20260912230000-lineas-fiscales.sql
-- VEDA 76(g): NO RIGE.
--
-- 🔴 EL HALLAZGO QUE ESTA MIGRACIÓN DESTAPA Y **NO** RESUELVE — es de mesa:
--    El catálogo (d) ya dice que paseo · grooming · adiestramiento · guardería son
--    **EC_IVA_15** (letra §3 flujo 4). Y **los 103 desgloses congelados de servicio
--    dicen `impuesto = 0`**, medido. O sea: la tarifa del catálogo y la plata que se
--    congeló NO COINCIDEN, y la diferencia es el 15 % del precio.
--    Las dos salidas son decisiones de PRODUCTO, no de migración:
--      (a) el precio del prestador pasa a ser BRUTO ⇒ la familia paga lo mismo y el
--          prestador recibe menos; o
--      (b) el IVA se suma ⇒ la familia paga 15 % más de lo que ve hoy.
--    Mientras nadie firme, esto **NO se resuelve en silencio**: la derivación es fiel
--    al CATÁLOGO y `reconciliar_lineas_con_congelado()` REBOTA cuando no cierran.
--    *Elegir una sola de las dos acá sería cambiarle el precio a las familias desde
--    una migración que nadie autorizó a mover plata.*

BEGIN;

CREATE OR REPLACE FUNCTION public.escribir_lineas_del_intento(p_intento_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_i public.pagos_intentos; v_n int := 0; v_pct numeric; v_cod text;
  v_desc text; v_cuenta uuid; v_base numeric; v_tipo text;
BEGIN
  SELECT * INTO v_i FROM public.pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF v_i.id IS NULL THEN
    RAISE EXCEPTION 'intento_no_existe' USING ERRCODE='22023';
  END IF;

  -- IDEMPOTENTE: reescribir líneas de un pago ya desglosado cambiaría su base.
  SELECT count(*) INTO v_n FROM public.pagos_desglose_lineas WHERE pago_intento_id = p_intento_id;
  IF v_n > 0 THEN
    RETURN jsonb_build_object('ok', true, 'lineas', v_n, 'ya_existian', true);
  END IF;

  -- ══ LA COMPRA — la única con líneas REALES hoy (pedido_items) ══════════════
  IF v_i.compra_id IS NOT NULL OR v_i.pedido_id IS NOT NULL THEN
    INSERT INTO public.pagos_desglose_lineas
      (pago_intento_id, linea, descripcion, cantidad, precio_unitario, descuento,
       codigo_iva, tarifa_pct, base, valor_iva, cuenta_comercial_id, origen_tipo, origen_id)
    SELECT p_intento_id,
           row_number() OVER (ORDER BY pi.id),
           pi.nombre_producto,
           pi.cantidad,
           pi.precio_unitario,
           0,
           pi.impuesto_codigo,
           pi.impuesto_pct,
           round(pi.cantidad * pi.precio_unitario, 2),
           round(round(pi.cantidad * pi.precio_unitario, 2) * pi.impuesto_pct / 100, 2),
           p.cuenta_comercial_id,
           'pedido_item', pi.id
      FROM public.pedido_items pi
      JOIN public.pedidos p ON p.id = pi.pedido_id
     WHERE (v_i.compra_id IS NOT NULL AND p.compra_id = v_i.compra_id)
        OR (v_i.compra_id IS NULL AND p.id = v_i.pedido_id);
    GET DIAGNOSTICS v_n = ROW_COUNT;

    IF v_n = 0 THEN
      RAISE EXCEPTION 'compra_sin_items'
        USING ERRCODE='22023', DETAIL='La compra no tiene items: no hay base imponible que derivar.';
    END IF;
    RETURN jsonb_build_object('ok', true, 'lineas', v_n, 'sujeto', 'compra');
  END IF;

  -- ══ LOS SUJETOS DE UNA SOLA LÍNEA ═════════════════════════════════════════
  /* Cada uno aporta TRES cosas y nada más: su tipo de servicio (de donde sale la
     tarifa), su precio NETO congelado, y su cuenta comercial. La tarifa NUNCA se
     teclea: se lee de `tipos_servicio`, que es donde (d) la puso. */
  IF v_i.cita_id IS NOT NULL THEN
    SELECT c.tipo_servicio, d.subtotal, pr.cuenta_comercial_id
      INTO v_tipo, v_base, v_cuenta
      FROM public.evento_cita_servicio c
      JOIN public.cita_desglose d ON d.cita_id = c.id
      LEFT JOIN public.prestadores pr ON pr.id = c.prestador_id
     WHERE c.id = v_i.cita_id;
    v_desc := 'cita'; 

  ELSIF v_i.bono_id IS NOT NULL THEN
    SELECT b.tipo_servicio, d.subtotal, pr.cuenta_comercial_id
      INTO v_tipo, v_base, v_cuenta
      FROM public.bonos b
      JOIN public.bono_desglose d ON d.bono_id = b.id
      LEFT JOIN public.prestadores pr ON pr.id = b.prestador_id
     WHERE b.id = v_i.bono_id;
    v_desc := 'bono';

  ELSIF v_i.programa_contratado_id IS NOT NULL THEN
    SELECT COALESCE(ps.tipo_servicio,'adiestramiento'), d.subtotal, pr.cuenta_comercial_id
      INTO v_tipo, v_base, v_cuenta
      FROM public.programas_contratados pc
      JOIN public.programa_desglose d ON d.programa_contratado_id = pc.id
      LEFT JOIN public.prestador_servicios ps ON ps.id = pc.prestador_servicio_id
      LEFT JOIN public.prestadores pr ON pr.id = pc.prestador_id
     WHERE pc.id = v_i.programa_contratado_id;
    v_desc := 'programa';

  ELSIF v_i.guarderia_suscripcion_id IS NOT NULL THEN
    SELECT 'guarderia_mensual', d.subtotal, pr.cuenta_comercial_id
      INTO v_tipo, v_base, v_cuenta
      FROM public.guarderia_suscripciones g
      JOIN public.guarderia_suscripcion_desglose d
        ON d.guarderia_suscripcion_id = g.id AND d.periodo = v_i.guarderia_suscripcion_periodo
      LEFT JOIN public.prestadores pr ON pr.id = g.prestador_id
     WHERE g.id = v_i.guarderia_suscripcion_id;
    v_desc := 'mensualidad de guardería';

  ELSIF v_i.suscripcion_servicio_id IS NOT NULL THEN
    SELECT s.tipo_servicio, d.subtotal, pr.cuenta_comercial_id
      INTO v_tipo, v_base, v_cuenta
      FROM public.suscripciones_servicio s
      JOIN public.suscripcion_desglose d
        ON d.suscripcion_servicio_id = s.id AND d.periodo = v_i.suscripcion_periodo
      LEFT JOIN public.prestadores pr ON pr.id = s.prestador_id
     WHERE s.id = v_i.suscripcion_servicio_id;
    v_desc := 'plan';

  ELSIF v_i.recurrencia_id IS NOT NULL THEN
    /* 🔴 SIN COBERTURA, Y SE DICE. `recurrencia_desglose` tiene CERO filas (medido):
       el sujeto nunca congeló un desglose, así que no hay de dónde derivar líneas.
       Devolver 0 líneas dejaría al riel con base 0 sobre plata real. */
    RAISE EXCEPTION 'recurrencia_sin_desglose_congelado'
      USING ERRCODE='22023',
            DETAIL='recurrencia_desglose está vacía: no hay base imponible congelada de la que derivar.';
  ELSE
    RAISE EXCEPTION 'intento_sin_sujeto_conocido'
      USING ERRCODE='22023', DETAIL='El intento no declara ninguno de los sujetos con desglose.';
  END IF;

  IF v_base IS NULL THEN
    RAISE EXCEPTION 'sujeto_sin_desglose_congelado'
      USING ERRCODE='22023', DETAIL='El sujeto existe pero no tiene desglose congelado.';
  END IF;

  SELECT ts.codigo_iva, ct.pct, ts.nombre
    INTO v_cod, v_pct, v_desc
    FROM public.tipos_servicio ts
    JOIN public.cat_tasas_impuesto ct ON ct.codigo = ts.codigo_iva
   WHERE ts.codigo = v_tipo;

  IF v_cod IS NULL THEN
    /* Fail-closed de la letra: un ítem sin tarifa NO se factura al 0 %. */
    RAISE EXCEPTION 'item_sin_codigo_iva'
      USING ERRCODE='22023', DETAIL=format('El tipo de servicio %s no declara tarifa.', v_tipo);
  END IF;

  INSERT INTO public.pagos_desglose_lineas
    (pago_intento_id, linea, descripcion, cantidad, precio_unitario, descuento,
     codigo_iva, tarifa_pct, base, valor_iva, cuenta_comercial_id, origen_tipo, origen_id)
  VALUES (p_intento_id, 1, v_desc, 1, v_base, 0, v_cod, v_pct,
          round(v_base, 2), round(round(v_base,2) * v_pct / 100, 2),
          v_cuenta, v_tipo, COALESCE(v_i.cita_id, v_i.bono_id, v_i.programa_contratado_id,
                                     v_i.guarderia_suscripcion_id, v_i.suscripcion_servicio_id));

  RETURN jsonb_build_object('ok', true, 'lineas', 1, 'sujeto', v_tipo, 'codigo_iva', v_cod, 'tarifa_pct', v_pct);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.escribir_lineas_del_intento(uuid) FROM PUBLIC, anon, authenticated;

-- ── LA RECONCILIACIÓN QUE HACE SONAR EL CONFLICTO ───────────────────────────
CREATE OR REPLACE FUNCTION public.reconciliar_lineas_con_congelado(p_intento_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_lineas numeric; v_congelado numeric;
BEGIN
  SELECT sum(base + valor_iva) INTO v_lineas
    FROM public.pagos_desglose_lineas WHERE pago_intento_id = p_intento_id;
  SELECT monto INTO v_congelado FROM public.pagos_intentos WHERE id = p_intento_id;

  RETURN jsonb_build_object(
    'lineas_total', v_lineas,
    'monto_intento', v_congelado,
    'cuadra', (v_lineas IS NOT NULL AND v_congelado IS NOT NULL AND round(v_lineas,2) = round(v_congelado,2)),
    'diferencia', round(COALESCE(v_lineas,0) - COALESCE(v_congelado,0), 2),
    /* El motivo se NOMBRA, no se deja a que alguien lo deduzca de dos números. */
    'motivo', CASE
      WHEN v_lineas IS NULL THEN 'sin_lineas'
      WHEN v_congelado IS NULL THEN 'sin_monto'
      WHEN round(v_lineas,2) = round(v_congelado,2) THEN NULL
      ELSE 'tarifa_del_catalogo_no_coincide_con_el_congelado' END
  );
END $fn$;
REVOKE EXECUTE ON FUNCTION public.reconciliar_lineas_con_congelado(uuid) FROM PUBLIC, anon;

COMMIT;
