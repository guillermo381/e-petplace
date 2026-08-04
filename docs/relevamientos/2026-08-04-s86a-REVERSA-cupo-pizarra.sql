-- ─────────────────────────────────────────────────────────────────────
-- REVERSA de `20260804190000_s86_cupo_de_la_pizarra.sql`
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ AVISO PROPIO — REVERTIR REABRE UN SOBRE-CUPO QUE NO SE VE:
-- sin este guard, `crear_cita_negocio` con `p_empleado_id` NULL (la cita
-- «a la pizarra») acepta N citas sobre el MISMO slot sin rebotar. No
-- rompe nada: cada cita nace bien formada. Lo que se rompe es el día del
-- negocio, y recién el día de la cita.
--
-- La causa vive AGUAS ARRIBA y esta reversa no la toca: `_agenda_ocupacion`
-- filtra `WHERE c.empleado_id = p_empleado_id`, y `NULL = uuid` es NULL —
-- una cita sin tratante es invisible para la ocupación de TODOS.
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

-- Repone `crear_cita_negocio` SIN el conteo de la pizarra (estado
-- inmediatamente anterior). Se deja el resto idéntico a propósito: la
-- reversa revierte UNA cosa.
CREATE OR REPLACE FUNCTION public.crear_cita_negocio(
  p_prestador_id  uuid,
  p_mascota_id    uuid,
  p_tipo_servicio text,
  p_fecha         date,
  p_hora          time,
  p_empleado_id   uuid    DEFAULT NULL,
  p_precio        numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid(); v_cuenta uuid; v_servicio uuid; v_dur integer;
  v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_family uuid; v_cita_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_fecha < v_hoy THEN
    RAISE EXCEPTION 'fecha_en_el_pasado' USING ERRCODE = '22023';
  END IF;
  SELECT cuenta_comercial_id INTO v_cuenta FROM prestadores WHERE id = p_prestador_id;
  IF v_cuenta IS NULL THEN RAISE EXCEPTION 'prestador_sin_cuenta' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = v_cuenta
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501'; END IF;
  SELECT ps.id, ps.duracion_minutos INTO v_servicio, v_dur
  FROM prestador_servicios ps
  WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = p_tipo_servicio AND ps.activo
  LIMIT 1;
  IF v_servicio IS NULL THEN RAISE EXCEPTION 'servicio_no_activo' USING ERRCODE = '22023'; END IF;
  v_dur := COALESCE(v_dur,
    (SELECT duracion_default_minutos FROM tipos_servicio WHERE codigo = p_tipo_servicio), 30);
  IF public._prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_bloqueado' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public._inicios_disponibles_prestador(
      p_prestador_id, v_servicio, p_fecha, v_dur, p_empleado_id) h
    WHERE h.hora = p_hora
  ) THEN RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023'; END IF;
  SELECT user_id INTO v_family FROM mascotas WHERE id = p_mascota_id;
  IF v_family IS NULL THEN RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE = '22023'; END IF;
  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva,
    expira_en, country_code, modalidad, metadata
  ) VALUES (
    v_family, p_mascota_id, p_prestador_id, p_empleado_id, p_tipo_servicio,
    p_fecha, p_hora,
    COALESCE(p_precio, (SELECT precio FROM prestador_servicios WHERE id = v_servicio)),
    v_dur, 'confirmada', 'pendiente_pago', NULL,
    (SELECT country_code FROM mascotas WHERE id = p_mascota_id), 'presencial',
    jsonb_build_object('origen', 'agenda_negocio', 'agendada_por', v_uid)
  ) RETURNING id INTO v_cita_id;
  RETURN jsonb_build_object('ok', true, 'citaId', v_cita_id, 'aLaPizarra', (p_empleado_id IS NULL));
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.crear_cita_negocio(uuid,uuid,text,date,time,uuid,numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_cita_negocio(uuid,uuid,text,date,time,uuid,numeric) TO authenticated;

COMMIT;
