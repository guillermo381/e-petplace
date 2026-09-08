-- REVERSA de 20260911720000_s114a_mensualidad_devenga_por_dia.sql
-- Restaura _devengar_estadia al cuerpo previo (detección por suscripcion_servicio_id).
-- ⚠️ NO revierte datos: los eventos económicos que la cura haya devengado NO se borran acá.
--    (borrarlos exige el mismo criterio del backfill de A6; se hace aparte y con gate).

CREATE OR REPLACE FUNCTION public._devengar_estadia(p_estadia_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_e record; v_c record; v_cuenta record; v_monto numeric(14,2);
  v_sus record; v_dias int; v_via text; v_ev uuid;
BEGIN
  SELECT * INTO v_e FROM guarderia_estadias WHERE id = p_estadia_id;
  IF NOT FOUND OR v_e.estado <> 'entregada' THEN RETURN NULL; END IF;

  SELECT c.id, c.precio, c.estado_reserva, c.prestador_id, c.country_code,
         c.metadata, c.suscripcion_servicio_id, c.bono_id
    INTO v_c FROM evento_cita_servicio c WHERE c.id = v_e.cita_id;
  IF v_c.id IS NULL THEN RETURN NULL; END IF;
  IF v_c.estado_reserva IS DISTINCT FROM 'pagada' THEN RETURN NULL; END IF;

  -- idempotente, anclado en la ESTADÍA
  IF EXISTS (SELECT 1 FROM eventos_economicos ee
             WHERE ee.origen_tipo='estadia' AND ee.origen_id=p_estadia_id
               AND ee.tipo_evento='cita_pagada') THEN
    RETURN NULL;
  END IF;

  IF v_c.suscripcion_servicio_id IS NOT NULL THEN
    -- MENSUALIDAD · por día ejecutado: precio_mensual / días del período
    SELECT precio_mensual, periodo_desde, periodo_hasta INTO v_sus
      FROM guarderia_suscripciones WHERE id = v_c.suscripcion_servicio_id;
    IF v_sus.precio_mensual IS NULL THEN RETURN NULL; END IF;
    v_dias := GREATEST((v_sus.periodo_hasta - v_sus.periodo_desde), 1);
    v_monto := ROUND(v_sus.precio_mensual / v_dias, 2);
    v_via := 'guarderia_mensualidad_dia';
  ELSE
    -- DÍA SUELTO o PAQUETE · el precio unitario del día vive en cita.precio
    v_monto := v_c.precio;
    v_via := CASE WHEN v_c.bono_id IS NOT NULL THEN 'guarderia_paquete' ELSE 'guarderia_dia' END;
  END IF;

  IF v_monto IS NULL OR v_monto < 0 THEN
    RAISE EXCEPTION 'estadia_sin_precio' USING ERRCODE='22023';
  END IF;
  -- un día de precio 0 (cortesía) no crea evento: no hay plata que devengar.
  IF v_monto = 0 THEN RETURN NULL; END IF;

  SELECT cc.id, cc.moneda INTO v_cuenta
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = v_c.prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE='22023';
  END IF;

  v_ev := crear_evento_economico(
    p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_cuenta_comercial_id => v_cuenta.id,
    p_country_code        => v_c.country_code,
    p_moneda              => v_cuenta.moneda,
    p_monto_bruto         => v_monto,
    p_monto_kushki_fee    => 0,
    p_origen_tipo         => 'estadia',
    p_origen_id           => p_estadia_id,
    p_fecha_devengo       => now(),
    p_fecha_cobro_kushki  => (v_c.metadata ->> 'pagado_en')::timestamptz,
    p_metadata            => jsonb_build_object('pago_simulado', true, 'via', v_via));
  RETURN v_ev;
END $function$
;
