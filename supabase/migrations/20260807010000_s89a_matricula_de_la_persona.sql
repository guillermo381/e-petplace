-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · ORDEN 11 ① — LA MATRÍCULA ES DE LA PERSONA (firma founder)
--
-- LA LETRA DEL FOUNDER: «para poder asignar citas a un empleado veterinario,
-- su matrícula debe estar cargada» — la matrícula es CONDICIÓN DE
-- ELEGIBILIDAD para recibir citas, no dato decorativo. Nace CON la receta:
-- un papel firmable exige firmante completo.
--
-- EL HUECO QUE CURA (medido S89-A): `prestador_empleados` no tenía NINGUNA
-- columna de credencial (16 medidas, ninguna); la `matricula_profesional`
-- vivía en `prestadores` — o sea EN EL NEGOCIO. Sirve para un consultorio
-- unipersonal y MIENTE en cuanto la clínica tiene dos veterinarios: el papel
-- diría la matrícula del negocio bajo el nombre de otro profesional.
--
-- ⚠️ LA TRANSICIÓN, propuesta CON SU MEDICIÓN (la mesa fija la fecha):
-- CERO negocios tienen matrícula cargada hoy y hay 3 empleados con chip
-- médico (los tres de Clínica Aurora). Un gate duro hoy los deja a los tres
-- sin poder recibir citas. Por eso el helper distingue:
--   · empleado creado DESPUÉS de esta migración -> matrícula EXIGIDA ya;
--   · empleado que YA EXISTÍA -> GRACIA hasta 2026-09-01 (propuesta: un mes
--     antes del soft launch), y `vets_sin_matricula()` deja al titular verlos
--     para completarlos.
-- Nadie queda bloqueado retroactivamente sin aviso; el que nace hoy nace
-- completo. La fecha vive en UNA constante del helper: moverla es un REPLACE.
--
-- 76(g): NO RIGE - DDL aditivo + REPLACE, cero backfill.
-- D-662: cero contrato roto (columnas nuevas; el rebote nuevo es tipado).
-- L-140: los dos helpers nacen con REVOKE/GRANT explícitos.
-- REVERSA: docs/relevamientos/2026-08-07-s89a-REVERSA-matricula-persona.sql
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.prestador_empleados
  ADD COLUMN matricula_profesional text,
  ADD COLUMN matricula_pais_emisor text;

COMMENT ON COLUMN public.prestador_empleados.matricula_profesional IS
  'S89 D-676: el registro profesional DE LA PERSONA. Condicion de elegibilidad para citas medicas (firma founder). La de prestadores queda para el consultorio unipersonal.';

CREATE OR REPLACE FUNCTION public._empleado_matricula_ok(p_empleado_id uuid, p_tipo_servicio text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_corte  date := DATE '2026-09-01';   -- LA TRANSICION, propuesta a mesa (S89)
  v_medico boolean;
  v_mat    text;
  v_creado timestamptz;
BEGIN
  IF p_empleado_id IS NULL THEN RETURN true; END IF;   -- a la pizarra: nadie asignado
  SELECT ts.es_medico INTO v_medico FROM tipos_servicio ts WHERE ts.codigo = p_tipo_servicio;
  IF NOT COALESCE(v_medico, false) THEN RETURN true; END IF;   -- lo no-medico no pide matricula

  SELECT pe.matricula_profesional, pe.created_at INTO v_mat, v_creado
  FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_creado IS NULL THEN RETURN false; END IF;
  IF coalesce(btrim(v_mat), '') <> '' THEN RETURN true; END IF;

  -- GRACIA: el que ya existia tiene hasta el corte; el que nace hoy, no.
  RETURN v_creado < DATE '2026-08-07'
         AND (now() AT TIME ZONE 'America/Guayaquil')::date < v_corte;
END;
$function$;

-- El lector del titular: a quien le falta (para completarlos ANTES del corte)
CREATE OR REPLACE FUNCTION public.vets_sin_matricula()
RETURNS TABLE (empleado_id uuid, nombre text, negocio text, dias_de_gracia int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT DISTINCT pe.id, pe.nombre, pr.nombre_comercial,
         GREATEST(0, (DATE '2026-09-01' - (now() AT TIME ZONE 'America/Guayaquil')::date))::int
  FROM prestador_empleados pe
  JOIN prestadores pr ON pr.id = pe.prestador_id
  JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
  JOIN prestador_servicios ps ON ps.id = pes.servicio_id
  JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio AND ts.es_medico
  WHERE pe.activo
    AND coalesce(btrim(pe.matricula_profesional), '') = ''
    AND public._user_opera_cuenta_comercial(pr.cuenta_comercial_id, auth.uid());
$function$;

REVOKE EXECUTE ON FUNCTION public._empleado_matricula_ok(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vets_sin_matricula() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._empleado_matricula_ok(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vets_sin_matricula() TO authenticated;

CREATE OR REPLACE FUNCTION public.asignar_cita_a_persona(p_cita_id uuid, p_empleado_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid           uuid := auth.uid();
  v_prestador     uuid;
  v_tipo          text;
  v_estado        text;
  v_empleado_hoy  uuid;
  v_es_futura     boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- ── LA CITA EXISTE ────────────────────────────────────────────────────
  SELECT c.prestador_id, c.tipo_servicio, c.estado, c.empleado_id,
         (c.fecha + c.hora) > (now() AT TIME ZONE 'America/Guayaquil')
    INTO v_prestador, v_tipo, v_estado, v_empleado_hoy, v_es_futura
  FROM evento_cita_servicio c
  WHERE c.id = p_cita_id;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;

  -- ── GATE 1 · EL ROL ───────────────────────────────────────────────────
  -- Acá rebota el profesional puro. La ventanilla gatea por MEMBRESÍA
  -- (ley madre S76) y ruteo es ventanilla, no acto clínico.
  IF NOT public.empleado_puede_asignar_citas(v_prestador) THEN
    RAISE EXCEPTION 'rol_sin_asignacion: quien rutea es la recepción, el administrador o el titular'
      USING ERRCODE = '42501';
  END IF;

  -- ── GATE 2 · LA CITA NO TIENE PERSONA ─────────────────────────────────
  -- REASIGNAR ES OTRO VERBO, y su precondición es el aviso a la familia
  -- que todavía NO EXISTE (`notificar_reasignacion_cita`, medido: ausente
  -- — es el mismo artefacto que gatea la vitrina desde S78).
  -- Mover una cita YA asignada sin avisar sería cambiarle el profesional a
  -- una familia por la espalda.
  IF v_empleado_hoy IS NOT NULL THEN
    RAISE EXCEPTION 'cita_ya_asignada: ya tiene persona (%); reasignar exige el aviso a la familia, que aún no existe',
      v_empleado_hoy USING ERRCODE = '22023';
  END IF;

  -- ── GATE 3 · LA CITA ES RUTEABLE ──────────────────────────────────────
  -- Espeja EXACTAMENTE `_cita_despegable`: estado pendiente/confirmada y en
  -- el futuro. El conjunto de lo ASIGNABLE == el conjunto de lo DESPEGABLE,
  -- a propósito: el verbo no debe alcanzar nada que el despegue no produzca.
  -- Una cita pasada sin persona se queda «de la clínica» — que es lo que
  -- §11(a) firmó — y jamás se reescribe quién la atendió.
  IF v_estado NOT IN ('pendiente', 'confirmada') THEN
    RAISE EXCEPTION 'cita_no_asignable: estado %; solo se rutea lo pendiente o confirmado',
      v_estado USING ERRCODE = '22023';
  END IF;

  IF NOT v_es_futura THEN
    RAISE EXCEPTION 'cita_no_asignable: la cita ya ocurrió; asignarla reescribiría quién atendió'
      USING ERRCODE = '22023';
  END IF;

  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'cita_sin_tipo_servicio: sin oficio no se puede verificar el chip de la persona'
      USING ERRCODE = '22023';
  END IF;

  -- ── GATE 4 · LA PERSONA ES DE ESTE NEGOCIO Y ESTÁ ACTIVA ──────────────
  IF NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe
    WHERE pe.id = p_empleado_id
      AND pe.prestador_id = v_prestador
      AND pe.activo = true
  ) THEN
    RAISE EXCEPTION 'persona_no_es_del_negocio: no hay vínculo activo con este negocio'
      USING ERRCODE = '22023';
  END IF;

  -- ── GATE 5 · LA PERSONA TIENE EL OFICIO ───────────────────────────────
  -- Espeja el tercer brazo de `cita_update_prestador` (S77): el chip es por
  -- TIPO de servicio, que es equivalente por construcción a la oferta —
  -- los chips se dan y se quitan a oficio completo.
  IF NOT EXISTS (
    SELECT 1
    FROM prestador_empleado_servicios pes
    JOIN prestador_servicios ps ON ps.id = pes.servicio_id
    WHERE pes.empleado_id = p_empleado_id
      AND ps.tipo_servicio = v_tipo
  ) THEN
    RAISE EXCEPTION 'persona_sin_oficio: no tiene el chip de % en este negocio', v_tipo
      USING ERRCODE = '22023';
  END IF;

  -- ── EL ACTO ───────────────────────────────────────────────────────────
  -- De los 5 triggers de la tabla, este UPDATE dispara SOLO
  -- `trg_evento_cita_servicio_updated_at` (los otros tres son `UPDATE OF
  -- estado` y el quinto es AFTER INSERT) — medido en S77 y citado acá para
  -- que nadie lo vuelva a medir.
    -- D-676 (S89, firma founder): la matrícula es CONDICIÓN DE ELEGIBILIDAD
  -- para recibir citas médicas, no dato decorativo. Un papel firmable exige
  -- firmante completo.
  IF NOT public._empleado_matricula_ok(p_empleado_id, v_cita.tipo_servicio) THEN
    RAISE EXCEPTION 'matricula_profesional_faltante' USING ERRCODE = '22023';
  END IF;

UPDATE evento_cita_servicio
  SET empleado_id = p_empleado_id
  WHERE id = p_cita_id;

  RETURN jsonb_build_object(
    'ok',          true,
    'cita_id',     p_cita_id,
    'empleado_id', p_empleado_id
  );
END;
$function$
;


CREATE OR REPLACE FUNCTION public.fijar_fecha_procedimiento(p_cita uuid, p_fecha date, p_hora time without time zone, p_empleado uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid           uuid := auth.uid();
  v_cita          record;
  v_pres          record;
  v_cuenta        uuid;
  v_emp_prestador uuid;
  v_capacidad     int;
  v_ocupados      int;
  v_ahora         timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_notif_user    uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_empleado IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  -- cita + elegibilidad (fecha NULL + presupuesto aprobado)
  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.presupuesto_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_presupuesto' USING ERRCODE = '22023';
  END IF;
  IF v_cita.fecha IS NOT NULL THEN
    RAISE EXCEPTION 'cita_ya_fijada' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_pres FROM presupuesto WHERE id = v_cita.presupuesto_id;
  IF v_pres.estado <> 'aprobado' THEN
    RAISE EXCEPTION 'presupuesto_no_aprobado: %', COALESCE(v_pres.estado, 'inexistente')
      USING ERRCODE = '22023';
  END IF;
  v_cuenta := v_pres.cuenta_comercial_id;

  -- persona que fija: habilitada de la cuenta
  IF NOT public._user_opera_cuenta_comercial(v_cuenta, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;

  -- persona asignada (reasignación §2): activa y de la MISMA cuenta
  SELECT pe.prestador_id INTO v_emp_prestador
  FROM prestador_empleados pe
  JOIN prestadores pr ON pr.id = pe.prestador_id
  WHERE pe.id = p_empleado
    AND pe.activo = true
    AND pr.cuenta_comercial_id = v_cuenta;
  IF v_emp_prestador IS NULL THEN
    RAISE EXCEPTION 'empleado_no_es_de_cuenta' USING ERRCODE = '22023';
  END IF;

  -- D-676 (S89): matrícula = condición de elegibilidad para lo médico.
  IF NOT public._empleado_matricula_ok(p_empleado, v_cita.tipo_servicio) THEN
    RAISE EXCEPTION 'matricula_profesional_faltante' USING ERRCODE = '22023';
  END IF;

  -- higiene: la fecha coordinada no vive en el pasado (espejo reagendar_cita_suelta)
  IF (p_fecha + p_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- serializar por prestador+fecha (mismo patrón del motor de ventana)
  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_emp_prestador::text || ':' || p_fecha::text, 0)
  );

  -- ocupación real del motor de ventana (regla de mezcla V0), duración
  -- SNAPSHOTEADA de la cita respetada; el procedimiento es exclusivo por
  -- default (cupo_techo NULL ⇒ capacidad 1). No se impone la grilla
  -- reservable (fuera_de_horario): la fecha del procedimiento se coordina,
  -- no se reserva contra el horario público.
  v_capacidad := COALESCE(
    (SELECT cupo_techo FROM tipos_servicio WHERE codigo = v_cita.tipo_servicio), 1);
  v_ocupados := public._agenda_ocupacion(
    p_empleado, p_fecha, p_hora, v_cita.duracion_minutos, p_cita, v_cita.tipo_servicio);
  IF v_ocupados >= v_capacidad THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- fijar fecha/hora/empleado + re-derivar prestador (asignación autoritativa).
  -- PRECIO CONGELADO INTACTO — no se toca `precio`.
  -- S72-A: la todo-libre gana un TIPO CONSUMIBLE al coordinar — sin él, la
  -- cita queda invisible a la agenda vet (los lectores discriminan por el
  -- embed tipos_servicio). COALESCE: jamás pisa un tipo que la cita ya tenga.
  UPDATE evento_cita_servicio
  SET fecha        = p_fecha,
      hora         = p_hora,
      empleado_id  = p_empleado,
      prestador_id = v_emp_prestador,
      tipo_servicio = COALESCE(tipo_servicio, 'procedimiento'),
      metadata     = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                       'fecha_fijada_en', now(),
                       'fijada_por',      v_uid
                     ),
      updated_at   = now()
  WHERE id = p_cita;

  -- si la cita tiene evento de timeline, mover su fecha (no-op si NULL)
  IF v_cita.evento_id IS NOT NULL THEN
    UPDATE eventos_mascota
    SET fecha_evento = (p_fecha + p_hora)
    WHERE id = v_cita.evento_id;
  END IF;

  -- Notificación al dueño SIEMPRE. El caso fantasma sin user en app no tiene
  -- destino in-app (declarado): se notifica cuando hay dueño real.
  -- S89 · D-674: la voz lee los valores POST-update — p_fecha/p_hora (los que
  -- esta llamada acaba de fijar; v_cita.* traía los NULL del snapshot) y
  -- v_emp_prestador (la asignación autoritativa re-derivada). Y el dato del
  -- presupuesto sale de la CITA (v_cita.presupuesto_id): la referencia S87 a
  -- un parámetro que esta firma no tiene daba 42703 en la rama real.
  -- (El nombre del token muerto no se escribe acá A PROPÓSITO: el cinturón lo
  -- busca en prosrc, y prosrc lee los comentarios como código — L-170.)
  v_notif_user := v_cita.user_id;
  IF v_notif_user IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'procedimiento_agendado',
      p_destinatario_user_id => v_notif_user,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object('cita_id', v_cita.id,
                                                   'presupuesto_id', v_cita.presupuesto_id,
                                                   'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_cita.mascota_id),
                                                   'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_emp_prestador),
                                                   'fecha', to_char(p_fecha,'DD/MM'), 'hora', to_char(p_hora,'HH24:MI'))
            || public._voz_notificacion('procedimiento_agendado', v_notif_user, v_cita.mascota_id,
                 jsonb_build_object(
                   'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_emp_prestador),
                   'fecha',   to_char(p_fecha,'DD/MM'),
                   'hora',    to_char(p_hora,'HH24:MI'))),
      p_clave_dedup          => 'proc-agendado:' || v_cita.id
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita,
    'fecha', p_fecha,
    'hora', p_hora,
    'empleado_id', p_empleado,
    'prestador_id', v_emp_prestador,
    'dueno_notificado', (v_notif_user IS NOT NULL)
  );
END;
$function$
;


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

DO $cint$
DECLARE v_fn text; v_src text;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY['asignar_cita_a_persona','fijar_fecha_procedimiento','crear_bloqueo_agenda'] LOOP
    SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=v_fn;
    IF v_src NOT LIKE '%_empleado_matricula_ok%' THEN
      RAISE EXCEPTION 'cinturon_matricula: % no consulta el helper', v_fn;
    END IF;
  END LOOP;
  IF NOT public._empleado_matricula_ok(
       (SELECT id FROM prestador_empleados WHERE activo LIMIT 1), 'paseo') THEN
    RAISE EXCEPTION 'cinturon_matricula: el gate desbordo a un oficio no-medico';
  END IF;
END $cint$;
