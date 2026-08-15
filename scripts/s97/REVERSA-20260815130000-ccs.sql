CREATE OR REPLACE FUNCTION public.cancelar_cita_suelta(p_cita_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth  uuid := auth.uid();
  v_cita  record;
  v_ahora timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.suscripcion_servicio_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.bono_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_paquete' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' OR v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, COALESCE(v_cita.estado_reserva, 'NULL')
      USING ERRCODE = '22023';
  END IF;

  -- P18(b): entre 24 y 2 h solo se reagenda — la plata no se mueve.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '24 hours' THEN
    RAISE EXCEPTION 'ventana_cancelacion_vencida' USING ERRCODE = '22023';
  END IF;

  -- La cancelación se DECLARA sobre el pago (7.16). La cita deja de
  -- estar cubierta: estado_reserva sale de 'pagada' (invariante intacto).
  UPDATE evento_cita_servicio
  SET estado = 'cancelada',
      estado_reserva = 'cancelada',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'motivo', 'p18_cancelacion_en_ventana',
        'cancelada_en', now(),
        'reembolso_simulado', jsonb_build_object(
          'monto', v_cita.precio,
          'simulado', true,
          'motivo', 'p18_cancelacion_en_ventana',
          'aplicado_en', now()
        )
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'cancelada',
    'reembolso_monto', v_cita.precio,
    'reembolso_simulado', true
  );
END;
$function$
