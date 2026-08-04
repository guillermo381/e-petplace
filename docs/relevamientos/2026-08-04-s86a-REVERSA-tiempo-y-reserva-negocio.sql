-- ─────────────────────────────────────────────────────────────────────
-- REVERSA de `20260804180000_s86_tiempo_negocio_y_reserva.sql`
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ AVISO PROPIO — REVERTIR **REPONE UN DEFECTO QUE NO SE VE**:
-- esta reversa devuelve `registrar_atencion_mostrador` a
-- `current_date`/`localtime`, o sea **vuelve a estampar la hora en UTC**
-- (D-648). Una atención registrada después de las 19:00 locales volverá
-- a nacer en la agenda de mañana, sin avisar y sin romper nada.
--
-- Es de la misma clase que la reversa de la zona aproximada de S84:
-- revertir no es neutro — reabre algo. Se declara acá para que quien la
-- corra lo sepa ANTES, no después.
--
-- LO QUE NO DESHACE: nada de datos. Las citas creadas por
-- `crear_cita_negocio` mientras estuvo viva QUEDAN — son citas reales de
-- familias reales, y soltarlas sería peor que dejarlas.
-- Para auditarlas:  SELECT id FROM evento_cita_servicio
--                   WHERE metadata->>'origen' = 'agenda_negocio';
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

DROP FUNCTION IF EXISTS public.crear_cita_negocio(uuid, uuid, text, date, time, uuid, numeric);
DROP FUNCTION IF EXISTS public.verificar_reloj_para_dia();

-- Reponer la puerta del mostrador TAL CUAL vivía antes de S86-A:
-- con `current_date`/`localtime` y SIN el guard de fecha futura.
CREATE OR REPLACE FUNCTION public.registrar_atencion_mostrador(
  p_prestador_id uuid, p_mascota_id uuid, p_tipo_servicio_codigo text,
  p_precio numeric, p_empleado_id uuid DEFAULT NULL::uuid,
  p_hora time without time zone DEFAULT NULL::time without time zone,
  p_fecha date DEFAULT NULL::date, p_country_code text DEFAULT 'EC'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_cuenta uuid;
  v_empleado uuid := p_empleado_id;
  v_dur integer;
  v_cita_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;

  SELECT cuenta_comercial_id INTO v_cuenta FROM prestadores WHERE id = p_prestador_id;
  IF v_cuenta IS NULL THEN RAISE EXCEPTION 'prestador_sin_cuenta' USING ERRCODE = '22023'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = v_cuenta
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tipos_servicio WHERE codigo = p_tipo_servicio_codigo AND es_medico = true) THEN
    RAISE EXCEPTION 'tipo_no_medico' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM prestador_servicios ps
    WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = p_tipo_servicio_codigo AND ps.activo = true
  ) THEN
    RAISE EXCEPTION 'servicio_no_activo' USING ERRCODE = '22023';
  END IF;

  IF p_precio IS NULL OR p_precio < 0 THEN RAISE EXCEPTION 'precio_invalido' USING ERRCODE = '22023'; END IF;
  IF p_country_code NOT IN ('EC','CO','MX','PE','CL','BR','AR','US') THEN
    RAISE EXCEPTION 'country_invalido' USING ERRCODE = '22023';
  END IF;

  IF v_empleado IS NULL THEN
    SELECT id INTO v_empleado FROM prestador_empleados
    WHERE prestador_id = p_prestador_id AND activo = true
    LIMIT 1;
    IF (SELECT count(*) FROM prestador_empleados WHERE prestador_id = p_prestador_id AND activo = true) > 1 THEN
      v_empleado := p_empleado_id;
    END IF;
  END IF;

  v_dur := COALESCE(
    (SELECT duracion_minutos FROM prestador_servicios WHERE prestador_id = p_prestador_id AND tipo_servicio = p_tipo_servicio_codigo AND activo = true LIMIT 1),
    (SELECT duracion_default_minutos FROM tipos_servicio WHERE codigo = p_tipo_servicio_codigo),
    30);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva,
    expira_en, country_code, modalidad, metadata
  ) VALUES (
    (SELECT user_id FROM mascotas WHERE id = p_mascota_id),
    p_mascota_id, p_prestador_id, v_empleado, p_tipo_servicio_codigo,
    COALESCE(p_fecha, current_date), COALESCE(p_hora, localtime),
    p_precio, v_dur, 'confirmada', 'pendiente_pago',
    NULL, p_country_code, 'presencial',
    jsonb_build_object('origen', 'mostrador')
  ) RETURNING id INTO v_cita_id;

  RETURN v_cita_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_atencion_mostrador(uuid,uuid,text,numeric,uuid,time,date,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.registrar_atencion_mostrador(uuid,uuid,text,numeric,uuid,time,date,text) TO authenticated;

COMMIT;
