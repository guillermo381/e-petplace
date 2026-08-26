-- REVERSA de 20260826210000_s106a_modalidad_y_consentimiento.sql
-- ESCRITA ANTES DE APLICAR.
--
-- QUÉ DESHACE:
--   · Devuelve `crear_bloqueo_agenda` a su firma de 7 argumentos y a su
--     cuerpo previo (embebido literal más abajo).
--   · Quita de `consentimientos` la columna `cita_id`, los dos CHECK y el
--     índice único parcial.
--   · Borra `_version_aviso_teleconsulta()`.
--
-- ⚠️ QUÉ **NO** DESHACE, declarado sin adorno:
--   · **Las filas de consentimiento ya registradas NO se borran** — y no
--     deben borrarse: son EVIDENCIA de que una persona aceptó un texto en
--     una fecha. Pero `DROP COLUMN cita_id` **destruye el vínculo
--     consentimiento↔cita** aunque conserve la fila. *Quien revierta esto
--     pierde la capacidad de demostrar a qué cita pertenecía cada
--     consentimiento — que es justamente lo que el abogado pidió poder
--     demostrar.*
--   · Las citas de telemedicina ya creadas conservan `modalidad =
--     'telemedicina'`. La reversa del código no reescribe datos, y está
--     bien: esas citas FUERON teleconsultas.
--
-- ⇒ El orden correcto para revertir de verdad es: primero decidir qué se
--   hace con la evidencia, después correr esto.
--
-- 🔴 EL CUERPO DE 7 ARGS VA EMBEBIDO PORQUE ESTA REVERSA ES SU ÚNICA
--    FUENTE: la función vivía en la base y NO en ningún archivo del repo
--    (ninguna migración la creó con esta forma). Capturado con
--    `pg_get_functiondef` el 25-ago-2026, ANTES de aplicar la migración.

BEGIN;

-- L-119: la firma de 8 args se dropea EXPLÍCITO — `CREATE OR REPLACE` con
-- otra aridad no reemplaza: deja las dos vivas como sobrecarga.
DROP FUNCTION IF EXISTS public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid, boolean);

CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone, p_modalidad text DEFAULT NULL::text, p_empleado_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth        uuid := auth.uid();
  v_servicio    record;
  v_ocupados    int;
  v_country     text;
  v_eje         text;
  v_visibilidad jsonb;
  v_evento_id   uuid;
  v_cita_id     uuid;
  v_expira      timestamptz;
  v_direccion   jsonb;   -- D-339
  v_modalidad   text;    -- S61 D-392
  -- S59-A5: resolución grooming por talla (MODELO_GROOMING §2/§6)
  v_talla          text;
  v_pelaje         text;
  v_precio_talla   numeric;
  v_duracion_talla int;
  -- V0-actor: la persona del hold + la semántica de concurrencia
  v_empleado    uuid;
  v_cupo_techo  int;
  -- S68: reservable en dos niveles + same-day declarativo
  v_ts_reservable boolean;
  v_ts_solo_hoy   boolean;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  -- S55-B2: la duración de la oferta entra al snapshot junto al precio.
  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.duracion_minutos, ps.atiende_local, ps.atiende_domicilio, ps.reservable
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- S68: la puerta del hold es del MOTOR — reservable en DOS niveles y
  -- el same-day de urgencia (declarativo, tipos_servicio.reserva_solo_hoy).
  SELECT ts.reservable, ts.reserva_solo_hoy INTO v_ts_reservable, v_ts_solo_hoy
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;
  IF NOT v_servicio.reservable OR NOT COALESCE(v_ts_reservable, true) THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(v_ts_solo_hoy, false)
     AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN  -- D-320, espejo S57/S60
    RAISE EXCEPTION 'urgencia_solo_hoy' USING ERRCODE = '22023';
  END IF;

  -- F3 S57 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  -- P19 (S59): el paseo es GRUPAL por norma.
  IF EXISTS (
       SELECT 1 FROM tipos_servicio ts
       WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
     )
     AND NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;

  -- S59-A5 (MODELO_GROOMING §2/§6): el GROOMING cotiza por TALLA del
  -- PERFIL + extra pelaje + recargo domicilio — server-side, ANTES de
  -- validar ventana/cupo, y se CONGELA como snapshot (INTACTO en V0).
  IF EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'grooming'
  ) THEN
    SELECT m.talla, m.pelaje INTO v_talla, v_pelaje
    FROM mascotas m WHERE m.id = p_mascota_id;
    IF v_talla IS NULL THEN
      RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
    END IF;
    SELECT pst.precio, pst.duracion_minutos
    INTO v_precio_talla, v_duracion_talla
    FROM prestador_servicio_tallas pst
    WHERE pst.prestador_servicio_id = v_servicio.id AND pst.talla = v_talla;
    IF v_precio_talla IS NULL OR v_duracion_talla IS NULL THEN
      RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_pelaje = 'largo' THEN
      v_precio_talla := v_precio_talla + COALESCE(
        (SELECT pr.grooming_extra_pelaje_largo FROM prestadores pr WHERE pr.id = p_prestador_id), 0);
    END IF;
    v_modalidad := COALESCE(p_modalidad, 'local');
    IF v_modalidad NOT IN ('local', 'domicilio') THEN
      RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'domicilio' AND NOT v_servicio.atiende_domicilio THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'local' AND NOT v_servicio.atiende_local THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'domicilio' THEN
      v_precio_talla := v_precio_talla + COALESCE(
        (SELECT pr.grooming_recargo_domicilio FROM prestadores pr WHERE pr.id = p_prestador_id), 0);
    END IF;
    v_servicio.precio := v_precio_talla;
    v_servicio.duracion_minutos := v_duracion_talla;
  END IF;

  -- S68: la urgencia A DOMICILIO es domicilio por tipo — hereda VERBATIM
  -- el mecanismo D-339/D-392 (dirección al snapshot + guard del pago).
  IF v_servicio.tipo_servicio = 'urgencia_domicilio' THEN
    IF NOT v_servicio.atiende_domicilio THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    v_modalidad := 'domicilio';
  END IF;

  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: prestador con bloqueo vigente no recibe holds nuevos.
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  -- V0-actor: primero la GEOMETRÍA de la franja (fuera_de_horario
  -- intacto), después la PERSONA (§2: reserva "con el negocio" — el
  -- sistema fija persona en el hold: la disponible; a igualdad, menor
  -- carga del día). Capacidad efectiva = LEAST(franja, cupo_techo).
  IF NOT EXISTS (
    SELECT 1 FROM prestador_horarios h
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32
      AND p_hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM p_hora)::int + v_servicio.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  ) THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  SELECT ts.cupo_techo INTO v_cupo_techo
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;

  SELECT pe.id INTO v_empleado
  FROM prestador_horarios h
  JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
  WHERE h.prestador_id = p_prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
    AND p_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_hora)::int + v_servicio.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    AND (pe.rol = 'dueño' OR EXISTS (
          SELECT 1 FROM prestador_empleado_servicios pes
          WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
    -- D-676 (S89): quien no tiene matrícula NO SE OFRECE para lo médico — el
    -- motor no elige a alguien a quien después no podría asignar la cita.
    AND public._empleado_matricula_ok(pe.id, v_servicio.tipo_servicio)
    AND _agenda_ocupacion(pe.id, p_fecha, p_hora, v_servicio.duracion_minutos, NULL, v_servicio.tipo_servicio)
        < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
    -- S78-A7: si la familia ELIGIO persona, el reparto no elige — se fija
    -- esa. Y si esa persona no puede, se REBOTA: elegir a alguien y
    -- recibir a otro en silencio es peor que no poder elegir.
    AND (p_empleado_id IS NULL OR pe.id = p_empleado_id)
  -- S78-A5 — LA CONTINUIDAD CLINICA VENCE AL BALANCEO.
  -- Primer criterio, ANTES de la carga del dia: si la mascota tiene un
  -- caso ACTIVO cuyo tratante es esta persona, esta persona gana. Es la
  -- tesis del producto en su forma literal: el vet no atendio una
  -- consulta, adopto un caso.
  --
  -- Solo REORDENA: el conjunto de candidatas ya viene filtrado por chip,
  -- geometria de franja y cupo — la continuidad jamas mete a alguien que
  -- no podia atender, y jamas saca a nadie.
  --
  -- GATEADO POR es_medico (decision declarada, no heredada): un caso
  -- clinico abierto no debe rutear un GROOMING. La ley madre S76 dice
  -- que lo clinico se gatea por lo clinico; extenderlo a los cuatro
  -- oficios seria un alcance que nadie firmo. Reversible en una linea.
  --
  -- 'activo' es el estado abierto (chk_caso_clinico_estado, leido literal:
  -- activo|resuelto|transferido|abandonado), y chk_caso_clinico_cierre_
  -- coherente garantiza fecha_cierre IS NULL mientras esta activo.
  --
  -- LA TRAMPA DEL NOMBRE, medida antes de escribir esto:
  -- caso_clinico.empleado_tratante_id NO es un prestador_empleados.id —
  -- guarda un auth.users.id. Lo dice el comentario de abrir_caso_clinico
  -- ("empleado_tratante_id → auth.users(id): es el USUARIO del vet"), lo
  -- prueba su INSERT (estampa v_uid, no p_empleado_id) y lo confirman las
  -- 2 filas vivas (2/2 matchean pe.user_id, 0/2 matchean pe.id).
  -- El cruce va POR user_id. Comparar contra pe.id compilaria, correria
  -- verde y seria LETRA MUERTA SILENCIOSA: jamas habria un solo match.
  --
  -- EL EMPATE, declarado (lo destapo el fixture, no el diseno): una
  -- mascota puede tener VARIOS casos activos con personas DISTINTAS del
  -- mismo negocio — Thor hoy tiene dos. Cuando dos candidatas satisfacen
  -- la continuidad, este criterio empata y el desempate CAE al balanceo
  -- de siempre. Es degradacion honesta, no bug: sin saber a que caso
  -- pertenece esta cita, el motor no puede elegir entre dos tratantes.
  -- Resolverlo de verdad pide que la cita DIGA su caso al nacer — que es
  -- justo lo que abre A3 (el caso al principio de la consulta). Hasta
  -- entonces, la continuidad desempata el caso UNICO, que es el 99%.
  ORDER BY (CASE WHEN EXISTS (
              SELECT 1 FROM caso_clinico kc
              JOIN tipos_servicio kts ON kts.codigo = v_servicio.tipo_servicio
              WHERE kc.mascota_id = p_mascota_id
                AND kc.estado = 'activo'
                AND kc.empleado_tratante_id = pe.user_id
                AND kts.es_medico
            ) THEN 0 ELSE 1 END),
           (SELECT count(*) FROM evento_cita_servicio cc
            WHERE cc.empleado_id = pe.id AND cc.fecha = p_fecha
              AND (cc.estado IN ('confirmada', 'en_curso')
                   OR (cc.estado = 'pendiente' AND cc.estado_reserva = 'pendiente_pago'
                       AND cc.expira_en > now()))),
           pe.created_at, pe.id
  LIMIT 1;
  IF v_empleado IS NULL THEN
    IF p_empleado_id IS NOT NULL THEN
      RAISE EXCEPTION 'persona_no_disponible' USING ERRCODE = '22023';
    END IF;
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  v_ocupados := 0;  -- (la pregunta de cupo ya se respondió por persona)

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;

  SELECT cte.eje_jtbd, cte.visibilidad_default
  INTO v_eje, v_visibilidad
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- D-339: dirección del hogar al snapshot del hold (NULL honesto).
  IF EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
  )
  OR v_modalidad = 'domicilio' THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'crear_bloqueo_agenda', 'tipo_servicio', v_servicio.tipo_servicio),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  v_expira := now() + interval '15 minutes';
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva, expira_en, country_code,
    direccion_snapshot, modalidad
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_empleado, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_servicio.precio, v_servicio.duracion_minutos,
    'pendiente', 'pendiente_pago', v_expira,
    COALESCE(v_country, 'EC'),
    v_direccion,
    COALESCE(v_modalidad, 'presencial')
  ) RETURNING id INTO v_cita_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'expira_en', v_expira,
    'precio', v_servicio.precio,
    'duracion_minutos', v_servicio.duracion_minutos,
    'fecha', p_fecha,
    'hora', p_hora
  );
END;
$function$
;

REVOKE EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid) TO authenticated, service_role;

ALTER TABLE public.consentimientos DROP CONSTRAINT IF EXISTS chk_consentimiento_tipo;
ALTER TABLE public.consentimientos DROP CONSTRAINT IF EXISTS chk_consentimiento_teleconsulta_con_cita;
DROP INDEX IF EXISTS public.uq_consentimiento_teleconsulta_por_cita;
ALTER TABLE public.consentimientos DROP COLUMN IF EXISTS cita_id;

DROP FUNCTION IF EXISTS public._version_aviso_teleconsulta();

COMMIT;
