-- ─────────────────────────────────────────────────────────────────────
-- S86-A · EL CUPO DE LA PIZARRA — una cita sin tratante TAMBIÉN ocupa
--
-- 76(g): NO RIGE (DDL puro). L-140 al pie.
-- REVERSA escrita ANTES, con su aviso: revertir REABRE el sobre-cupo.
--
-- ─── EL DEFECTO, HALLADO POR EL FIXTURE DE ESTA MISMA SESIÓN ─────────
-- El par del fixture midió el MISMO slot dos veces y la segunda NO
-- rebotó. La causa, leída del literal y no supuesta:
--
--     _agenda_ocupacion → WHERE c.empleado_id = p_empleado_id
--
-- y `NULL = uuid` es **NULL**, no `false`. ⇒ **una cita «a la pizarra»
-- es invisible para la ocupación de TODAS las personas.** Se pueden
-- apilar N sobre el mismo horario y la grilla las sigue ofreciendo.
--
-- ⚠️ ES LA MISMA FORMA QUE S78 YA HABÍA CAZADO en el motor de recepción
-- (`c.empleado_id = v_mi_fila` con NULL da FALSO, y la sección «Del
-- negocio» existía por eso). **La casa ya conocía esta trampa; la volví
-- a pisar** — por eso la cura se escribe con su nombre, para que el
-- próximo la encuentre buscando "pizarra" o buscando "NULL".
--
-- POR QUÉ NO SE CURA EN `_agenda_ocupacion`, que sería lo tentador:
-- esa función responde *"¿cuánto ocupa ESTA persona?"* y su respuesta es
-- correcta — una cita sin tratante NO ocupa a nadie en particular. El
-- defecto no es suyo: es que **falta la pregunta del NEGOCIO**. Meterle
-- el caso NULL adentro cambiaría el significado de un helper con 11
-- consumidores para arreglar UN caller. La cura vive en el caller.
--
-- LA REGLA QUE SE APLICA, y es la honesta:
--   una cita a la pizarra se puede aceptar SOLO si, a esa hora, queda
--   al menos una persona ELEGIBLE libre por cada cita sin tratante que
--   ya exista — incluida la que se está creando.
--   Es decir: `pizarra_existentes + 1 <= personas_elegibles_libres`.
-- El predicado de elegibilidad es el de S78 (dueño o chip), el mismo
-- que usa la pizarra para listar: **lo que no se puede tomar, no se
-- puede agendar a la pizarra.**
-- ─────────────────────────────────────────────────────────────────────

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
  v_uid      uuid := auth.uid();
  v_cuenta   uuid;
  v_servicio uuid;
  v_dur      integer;
  v_hoy      date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_family   uuid;
  v_cita_id  uuid;
  v_libres   integer;
  v_pizarra  integer;
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
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;

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
  ) THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- ── EL CUPO DE LA PIZARRA ────────────────────────────────────────
  IF p_empleado_id IS NULL THEN
    -- Personas ELEGIBLES (predicado de S78) que a esa hora tienen el
    -- inicio libre. Se pregunta POR PERSONA: así el cupo sale del mismo
    -- motor que gobierna todo lo demás, sin re-derivar la fórmula.
    SELECT count(*) INTO v_libres
    FROM prestador_empleados pe
    WHERE pe.prestador_id = p_prestador_id
      AND pe.activo
      AND (
        pe.rol = 'dueño'
        OR EXISTS (
          SELECT 1 FROM prestador_empleado_servicios pes
          WHERE pes.empleado_id = pe.id AND pes.servicio_id = v_servicio
        )
      )
      AND EXISTS (
        SELECT 1 FROM public._inicios_disponibles_prestador(
          p_prestador_id, v_servicio, p_fecha, v_dur, pe.id) h
        WHERE h.hora = p_hora
      );

    -- Las que YA están a la pizarra a esa hora y se solapan con esta.
    SELECT count(*) INTO v_pizarra
    FROM evento_cita_servicio c
    WHERE c.prestador_id = p_prestador_id
      AND c.empleado_id IS NULL
      AND c.fecha = p_fecha
      AND c.estado = ANY(public._estados_cita_contables())
      AND (c.hora, c.hora + make_interval(mins => c.duracion_minutos))
          OVERLAPS (p_hora, p_hora + make_interval(mins => v_dur));

    IF v_pizarra + 1 > COALESCE(v_libres, 0) THEN
      -- Voz PROPIA: no es "el slot está ocupado" — es que no queda quién
      -- pueda tomarla. Dos verdades distintas, dos códigos distintos
      -- (el precedente es `persona_no_disponible` vs `slot_ocupado`, S78).
      RAISE EXCEPTION 'sin_quien_la_tome' USING ERRCODE = '22023';
    END IF;
  END IF;

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

DO $verificacion$
DECLARE v_acl text;
BEGIN
  SELECT array_to_string(proacl,' ') INTO v_acl
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='crear_cita_negocio';
  IF v_acl LIKE '%anon=X%' THEN RAISE EXCEPTION 'L-140: anon con EXECUTE — %', v_acl; END IF;
  IF v_acl NOT LIKE '%authenticated=X%' THEN RAISE EXCEPTION 'authenticated sin EXECUTE — %', v_acl; END IF;
  RAISE NOTICE 'L-140 OK · crear_cita_negocio';
END;
$verificacion$;
