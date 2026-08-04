-- ─────────────────────────────────────────────────────────────────────
-- S86-A · EL TIEMPO DEL NEGOCIO (D-648) + LA RESERVA FUTURA DEL LADO
-- NEGOCIO, Y LA FRONTERA QUE LAS SEPARA.
--
-- 76(g): **NO RIGE.** DDL puro. Sin backfill: **la firma del founder es
-- SOLO HACIA ADELANTE** — las filas ya escritas NO se corrigen (la
-- torcida queda declarada con su forense en D-648).
-- L-140: REVOKE + GRANT explícitos al pie, con verificación.
-- REVERSA escrita ANTES, y **avisa que revertir REPONE el defecto**:
-- `docs/relevamientos/2026-08-04-s86a-REVERSA-tiempo-y-reserva-negocio.sql`
--
-- ─── POR QUÉ LAS DOS COSAS VIAJAN JUNTAS ─────────────────────────────
-- El guard `el_mostrador_registra_no_reserva` cierra la puerta del
-- mostrador a las fechas futuras. **Encenderlo solo dejaría al negocio
-- sin NINGÚN camino para agendar** — se pasaría de una puerta que hace
-- lo incorrecto a ninguna puerta. Por eso la frontera se enciende CON su
-- alternativa (`crear_cita_negocio`), jamás sola. Es la decisión ① de la
-- lámina firmada: DOS VERBOS, honestos al motor.
-- ─────────────────────────────────────────────────────────────────────

-- ① EL DÍA DEL NEGOCIO SE RESUELVE EN SU ZONA ─────────────────────────
-- Hereda D-320 (tz hardcodeada) a propósito: la cura de fondo es la zona
-- DEL NEGOCIO, no una constante, y ese arco es más grande que este
-- defecto. Lo que NO se puede seguir haciendo es leer el día en UTC.
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
  v_hoy  date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_ahora time := (now() AT TIME ZONE 'America/Guayaquil')::time;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;

  -- ② LA FRONTERA, MECÁNICA. El mostrador REGISTRA un hecho: alguien
  -- está parado acá. Por eso no mira ocupación, cupo ni grilla — y por
  -- eso mismo NO PUEDE crear futuro: sería reservar capacidad sin
  -- comprobarla. Reservar tiene su puerta: `crear_cita_negocio`.
  IF p_fecha IS NOT NULL AND p_fecha <> v_hoy THEN
    RAISE EXCEPTION 'el_mostrador_registra_no_reserva' USING ERRCODE = '22023';
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
      v_empleado := p_empleado_id;   -- ambiguo: a la pizarra (NULL)
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
    COALESCE(p_fecha, v_hoy), COALESCE(p_hora, v_ahora),   -- ① la zona, no UTC
    p_precio, v_dur, 'confirmada', 'pendiente_pago',
    NULL, p_country_code, 'presencial',
    jsonb_build_object('origen', 'mostrador')
  ) RETURNING id INTO v_cita_id;

  RETURN v_cita_id;
END;
$function$;


-- ③ LA RESERVA FUTURA DEL LADO NEGOCIO ────────────────────────────────
-- POR QUÉ NO SE REUSÓ `crear_bloqueo_agenda`, medido y no supuesto:
--   · estampa `auth.uid()` como dueño de la cita ⇒ la cita quedaría a
--     nombre de QUIEN RECIBE, no de la familia;
--   · crea un HOLD con `expira_en` ⇒ nace pendiente de pago y se vence
--     sola a los 15' — forma equivocada para un turno dado en persona.
-- Lo que SÍ se reusa es lo que hay que reusar: los helpers de capacidad
-- y grilla. Reescribir la fórmula del cupo sería fabricar una segunda
-- verdad sobre la capacidad (D-645).
CREATE OR REPLACE FUNCTION public.crear_cita_negocio(
  p_prestador_id  uuid,
  p_mascota_id    uuid,
  p_tipo_servicio text,
  p_fecha         date,
  p_hora          time,
  p_empleado_id   uuid    DEFAULT NULL,   -- NULL = a la pizarra, a propósito
  p_precio        numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_cuenta    uuid;
  v_servicio  uuid;
  v_dur       integer;
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_family    uuid;
  v_cita_id   uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;

  -- El espejo de la frontera: reservar es HACIA ADELANTE. El pasado no
  -- se reserva — se registra, y eso es del mostrador.
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
  IF v_servicio IS NULL THEN
    RAISE EXCEPTION 'servicio_no_activo' USING ERRCODE = '22023';
  END IF;
  v_dur := COALESCE(v_dur,
    (SELECT duracion_default_minutos FROM tipos_servicio WHERE codigo = p_tipo_servicio), 30);

  -- Vacaciones / días cerrados: el helper único, no una condición nueva.
  IF public._prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_bloqueado' USING ERRCODE = '22023';
  END IF;

  -- LA GRILLA: la hora tiene que ser un inicio REALMENTE ofertado.
  -- `_inicios_disponibles_prestador` ya descuenta lo firme y los holds;
  -- por eso alcanza con preguntarle, en vez de re-derivar disponibilidad.
  IF NOT EXISTS (
    SELECT 1 FROM public._inicios_disponibles_prestador(
      p_prestador_id, v_servicio, p_fecha, v_dur, p_empleado_id) h
    WHERE h.hora = p_hora
  ) THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- ⚠️ DECLARADO Y NO TAPADO: con `p_empleado_id` NULL (a la pizarra) la
  -- ocupación POR PERSONA no se puede comprobar — no hay persona
  -- todavía. Se comprueba la grilla DEL NEGOCIO, que es lo que existe.
  -- El hueco real que eso deja está anotado como deuda propia: `tomar_cita`
  -- no verifica la ocupación de quien toma.

  -- EL user_id ES EL DE LA FAMILIA, jamás el del que agenda. Ésta es la
  -- diferencia central con `crear_bloqueo_agenda` y la razón de que esta
  -- función exista.
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
    v_dur, 'confirmada', 'pendiente_pago',
    NULL,                                    -- SIN hold: no se vence sola
    (SELECT country_code FROM mascotas WHERE id = p_mascota_id),
    'presencial',
    jsonb_build_object('origen', 'agenda_negocio', 'agendada_por', v_uid)
  ) RETURNING id INTO v_cita_id;

  RETURN jsonb_build_object(
    'ok', true, 'citaId', v_cita_id,
    'aLaPizarra', (p_empleado_id IS NULL)
  );
END;
$function$;


-- ④ EL GUARD CONTRA LA RECAÍDA — un censo ejecutable, no un comentario
-- Devuelve las funciones que deciden un DÍA con el reloj sin zona.
-- ⚠️ Despoja comentarios ANTES de mirar: un censo por `prosrc` lee los
-- comentarios como código (L-170) — comprobado hoy, la primera corrida
-- del censo se acusó a sí misma por una frase en su propia cabecera.
CREATE OR REPLACE FUNCTION public.verificar_reloj_para_dia()
RETURNS TABLE(proname text, motivo text)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  WITH limpio AS (
    SELECT p.proname::text AS nombre,
           regexp_replace(
             regexp_replace(p.prosrc, '/\*.*?\*/', ' ', 'gs'),
             '--[^\n]*', ' ', 'g') AS src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      -- EL CENSOR NO SE CENSURA A SÍ MISMO. Su cuerpo CONTIENE los
      -- literales que busca ('current_date', 'localtime') como DATO de
      -- sus propias regex — así que se acusa solo. Lo descubrió el guard
      -- abortando esta misma migración, no una revisión: es L-170 en una
      -- forma nueva —no el comentario leído como código, sino el PATRÓN
      -- leído como uso— y por eso la exclusión es por NOMBRE EXACTO, la
      -- más angosta posible: excluir "las que se parezcan" volvería a
      -- abrir el agujero que este censo existe para cerrar.
      AND p.proname <> 'verificar_reloj_para_dia'
  )
  SELECT nombre,
         CASE WHEN src ~* '\mlocaltime\M' THEN 'localtime'
              WHEN src ~* 'now\(\)\s*::\s*date' THEN 'now()::date'
              ELSE 'current_date' END
  FROM limpio
  WHERE (src ~* '\mcurrent_date\M' OR src ~* '\mlocaltime\M' OR src ~* 'now\(\)\s*::\s*date')
  ORDER BY nombre;
$$;

COMMENT ON FUNCTION public.verificar_reloj_para_dia() IS
  'S86-A/D-648 · Censo ejecutable: funciones que deciden un DÍA con el reloj sin zona. '
  'BASELINE al cerrar S86-A: 8 (7 vivas + 1 de loyalty dormido; los escenarios de test cuentan). '
  'GUARD SOLO-BAJA: si el número SUBE, alguien reintrodujo el defecto.';

DO $guard$
DECLARE
  v_n integer;
  v_lista text;
BEGIN
  SELECT count(*), string_agg(proname, ', ' ORDER BY proname)
  INTO v_n, v_lista FROM public.verificar_reloj_para_dia();

  -- El baseline se declara CONTRA QUÉ MIDIÓ (la regla que S84 dejó:
  -- todo freno dice contra qué comparó). 8 = las 9 del censo de hoy
  -- MENOS `registrar_atencion_mostrador`, que este archivo cura.
  IF v_n > 8 THEN
    RAISE EXCEPTION 'D-648: el reloj-sin-zona SUBIÓ a % (baseline 8). Lista: %', v_n, v_lista;
  END IF;
  RAISE NOTICE 'D-648 guard OK · reloj-sin-zona = % (baseline 8) · %', v_n, v_lista;
END;
$guard$;


-- ⑤ L-140 ────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.registrar_atencion_mostrador(uuid,uuid,text,numeric,uuid,time,date,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.crear_cita_negocio(uuid,uuid,text,date,time,uuid,numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verificar_reloj_para_dia() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.registrar_atencion_mostrador(uuid,uuid,text,numeric,uuid,time,date,text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.crear_cita_negocio(uuid,uuid,text,date,time,uuid,numeric) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.verificar_reloj_para_dia() TO authenticated;

DO $verificacion$
DECLARE v_nombre text; v_acl text;
BEGIN
  FOREACH v_nombre IN ARRAY ARRAY['registrar_atencion_mostrador','crear_cita_negocio','verificar_reloj_para_dia'] LOOP
    SELECT array_to_string(proacl,' ') INTO v_acl
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=v_nombre;
    IF v_acl LIKE '%anon=X%' THEN
      RAISE EXCEPTION 'L-140: anon conserva EXECUTE en % — proacl=%', v_nombre, v_acl;
    END IF;
    IF v_acl NOT LIKE '%authenticated=X%' THEN
      RAISE EXCEPTION 'authenticated NO tiene EXECUTE en % — proacl=%', v_nombre, v_acl;
    END IF;
  END LOOP;
  RAISE NOTICE 'L-140 OK en las tres';
END;
$verificacion$;
