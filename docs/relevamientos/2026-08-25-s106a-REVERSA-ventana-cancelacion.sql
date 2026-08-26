-- REVERSA de 20260826200000_s106a_ventana_cancelacion_parametro.sql
-- ESCRITA ANTES DE APLICAR (regla de la casa).
--
-- QUÉ DESHACE: devuelve `cancelar_cita_suelta` a su literal `interval '24
-- hours'` y elimina la columna `tipos_servicio.ventana_cancelacion_minutos`.
--
-- QUÉ **NO** DESHACE, declarado:
--   · Las citas que se hayan CANCELADO gracias a la ventana de 30 min de
--     telemedicina NO se descancelan. Revertir el código no revierte los
--     datos: una teleconsulta cancelada a 40 minutos de su hora queda
--     cancelada, y su registro de devolución también.
--   · Si alguien cambió a mano el valor de la columna para otro servicio,
--     ese valor se pierde con el DROP y no se puede reconstruir.

BEGIN;

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
  v_dest  uuid;
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

  SELECT pr.user_id INTO v_dest
    FROM prestadores pr WHERE pr.id = v_cita.prestador_id;

  IF v_dest IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'cita_cancelada_cliente',
      p_destinatario_user_id => v_dest,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object(
                                  'cita_id', p_cita_id,
                                  'cuando', to_char(v_cita.fecha,'DD/MM') || ' ' || to_char(v_cita.hora,'HH24:MI'))
                                || public._voz_notificacion(
                                     'cita_cancelada_cliente', v_dest, v_cita.mascota_id,
                                     jsonb_build_object('cuando',
                                       to_char(v_cita.fecha,'DD/MM') || ' ' || to_char(v_cita.hora,'HH24:MI'))),
      p_clave_dedup          => 'cita_cancelada:' || p_cita_id::text
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'cancelada',
    'reembolso_monto', v_cita.precio,
    'reembolso_simulado', true
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.cancelar_cita_suelta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cancelar_cita_suelta(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public._ventana_cancelacion_minutos(text);
ALTER TABLE public.tipos_servicio DROP COLUMN IF EXISTS ventana_cancelacion_minutos;

COMMIT;
