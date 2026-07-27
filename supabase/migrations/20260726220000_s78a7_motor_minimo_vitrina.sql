-- S78-A7 — EL MOTOR MINIMO DE LA VITRINA (LETRA_VITRINA_S78)
-- ==================================================================
-- FIRMA DEL FOUNDER: **construir SI, encender NO.** La vitrina por
-- persona se construye entera; lo que NO se hace es encenderla en un
-- negocio real hasta que exista el aviso de reasignacion — porque §2 de
-- MODELO_VETERINARIA ya firmo que, con persona elegida, mover la cita
-- SE AVISA ("eligio a alguien; la verdad firme es con ese alguien").
--
-- Y LA PRECONDICION ES **MECANICA, NO PROSA** (exigencia del founder, y
-- tiene razon: "una precondicion solo en letra es la que un S79 apurado
-- se salta"). El camino que enciende `expone_personas` VERIFICA que el
-- disparo exista, y si no existe REBOTA HABLADO. Ver el trigger abajo.
--
-- 76(g) — DECLARACION OBLIGATORIA: **NO RIGE**. Hay DDL (ADD COLUMN con
-- DEFAULT constante — no reescribe tabla en PG11+; DROP/CREATE de tres
-- funciones) pero **cero backfill y cero calculo de anclas sobre datos
-- vivos**. La columna nace `false` en las 5 filas, que es exactamente su
-- comportamiento de hoy: **esta migracion no concede nada** (L-176).
--
-- L-119 — LOS TRES DROP SON OBLIGATORIOS, NO HIGIENE: agregar un
-- parametro CAMBIA LA FIRMA, y `CREATE OR REPLACE` crearia una
-- SOBRECARGA dejando la vieja zombi. Se dropea la firma vieja explicita.
-- Los callers que pasan los argumentos de siempre resuelven a la nueva
-- por el DEFAULT — **las 9 lectoras no se migran** (LETRA_VITRINA §5).
--
-- REVERSA: docs/relevamientos/2026-07-26-s78a-REVERSA-vitrina.sql
-- ==================================================================


-- ── 1. LA COLUMNA ───────────────────────────────────────────────────
ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS expone_personas boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.prestadores.expone_personas IS
  'S78 LETRA_VITRINA — false (default): la familia reserva "con el negocio" '
  'y el sistema fija persona. true: la familia VE y ELIGE persona, y la '
  'reasignacion interna deja de ser silenciosa (MODELO_VETERINARIA §2). '
  'Encenderla exige que exista el disparo de aviso: lo gatea el trigger '
  'trg_prestadores_gate_vitrina, no la buena voluntad de quien la toque.';


-- ── 2. EL GUARD MECANICO DEL ENCENDIDO ──────────────────────────────
--
-- Nombra EL ARTEFACTO QUE ABRE (L-171: el orden en piedra nombra el
-- artefacto, jamas el archivo donde se lo espera). El dia que alguien
-- construya `notificar_reasignacion_cita(uuid, uuid)`, **este gate se
-- abre solo** — no hay que acordarse de venir a borrarlo.
--
-- Por que `to_regprocedure` y no un flag de configuracion: un flag es
-- otra prosa, se puede prender sin que el aviso exista. La existencia de
-- la FUNCION es el hecho, y es incontrovertible.
--
-- Estado medido hoy (26-jul-2026): `notificaciones` existe y esta VIVA
-- (8 tipos con filas), pero su unico productor es
-- `_notificar_dueño_prestador`, que notifica AL PRESTADOR. **No existe
-- productor del aviso a la FAMILIA por reasignacion.** Por eso el gate
-- esta cerrado hoy, y es correcto que lo este.

CREATE OR REPLACE FUNCTION public._trg_prestadores_gate_vitrina()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.expone_personas IS NOT TRUE OR OLD.expone_personas IS TRUE THEN
    RETURN NEW;   -- solo gatea el FLIP a encendido
  END IF;

  IF to_regprocedure('public.notificar_reasignacion_cita(uuid, uuid)') IS NULL THEN
    RAISE EXCEPTION 'aviso_reasignacion_no_existe'
      USING ERRCODE = '23514',
            HINT = 'Exponer personas obliga a avisarle a la familia si la cita '
                   'cambia de profesional (MODELO_VETERINARIA §2). Ese aviso '
                   'todavia no existe: construir notificar_reasignacion_cita '
                   'antes de encender la vitrina.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prestadores_gate_vitrina ON public.prestadores;
CREATE TRIGGER trg_prestadores_gate_vitrina
BEFORE UPDATE ON public.prestadores
FOR EACH ROW EXECUTE FUNCTION public._trg_prestadores_gate_vitrina();

REVOKE EXECUTE ON FUNCTION public._trg_prestadores_gate_vitrina() FROM PUBLIC, anon;


-- ── 3. LAS TRES PUERTAS GANAN p_empleado_id (DEFAULT NULL) ──────────
DROP FUNCTION IF EXISTS public._inicios_disponibles_prestador(uuid, uuid, date, integer);
CREATE OR REPLACE FUNCTION public._inicios_disponibles_prestador(p_prestador_id uuid, p_servicio_id uuid, p_fecha date, p_duracion_minutos integer, p_empleado_id uuid DEFAULT NULL)
 RETURNS TABLE(hora time without time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  -- V0-actor: unión de ventanas de las PERSONAS habilitadas para el
  -- servicio (§2: el dueño siempre; el empleado, si su oferta lo
  -- habilita vía prestador_empleado_servicios). Hoy N=1: colapsa exacto
  -- al titular. Capacidad efectiva = LEAST(franja, cupo_techo).
  -- S68: lo no reservable (tipo O oferta) no genera inicios.
  SELECT DISTINCT s.s_hora
  FROM (
    SELECT
      h.empleado_id AS s_emp,
      ts.codigo     AS s_tipo,
      (h.hora_inicio + make_interval(mins => g.n * h.duracion_slot_minutos))::time AS s_hora,
      h.hora_fin AS s_fin,
      LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(ts.cupo_techo, 1)) AS s_capacidad
    FROM prestador_horarios h
    JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
    JOIN prestador_servicios ps ON ps.id = p_servicio_id AND ps.reservable
    JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio AND ts.reservable
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE h.prestador_id = p_prestador_id
      -- S78-A7 (LETRA_VITRINA §5): la eleccion de persona es UN `AND` MAS.
      -- NULL = cualquiera, que es el comportamiento de siempre — por eso
      -- los 9 callers existentes no se tocan.
      AND (p_empleado_id IS NULL OR h.empleado_id = p_empleado_id)
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
      AND (pe.rol = 'dueño' OR EXISTS (
            SELECT 1 FROM prestador_empleado_servicios pes
            WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
  ) s
  WHERE p_duracion_minutos > 0
    -- la ventana entera cabe en SU franja
    AND EXTRACT(EPOCH FROM s.s_hora)::int + p_duracion_minutos * 60
        <= EXTRACT(EPOCH FROM s.s_fin)::int
    -- cupo libre en TODO el recorrido (helper único, ahora por persona)
    AND (s.s_capacidad - _agenda_ocupacion(s.s_emp, p_fecha, s.s_hora, p_duracion_minutos, NULL, s.s_tipo)) > 0
    AND (p_fecha + s.s_hora) > (now() AT TIME ZONE 'America/Guayaquil')
    AND NOT _prestador_bloqueado(p_prestador_id, p_fecha);
$function$
;

DROP FUNCTION IF EXISTS public.obtener_inicios_vet_disponibles(date, text, uuid);
CREATE OR REPLACE FUNCTION public.obtener_inicios_vet_disponibles(p_fecha date, p_tipo_servicio text, p_mascota_id uuid, p_empleado_id uuid DEFAULT NULL)
 RETURNS TABLE(hora time without time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_solo_hoy boolean;
  v_reservable boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  SELECT ts.reserva_solo_hoy, ts.reservable INTO v_solo_hoy, v_reservable
  FROM tipos_servicio ts
  WHERE ts.codigo = p_tipo_servicio
    AND ts.categoria IN ('veterinario', 'telemedicina', 'emergencia')
    AND ts.activo;
  IF v_reservable IS NULL THEN
    RAISE EXCEPTION 'servicio_invalido' USING ERRCODE = '22023';
  END IF;
  -- S68: el tipo existe pero no se reserva (telemedicina/emergencia) —
  -- rebote tipado, no disfraz de inexistente.
  IF NOT v_reservable THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, p_tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- fecha en el pasado: vacío sin error (cinturón heredado adiestramiento)
  IF p_fecha < (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RETURN;
  END IF;
  -- S68: urgencia solo-HOY — otro día devuelve VACÍO (cinturón; la ley
  -- dura vive en crear_bloqueo_agenda con error tipado urgencia_solo_hoy)
  IF v_solo_hoy AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT i.hora
  FROM _vet_ofertas_cobrables(p_mascota_id) o
  CROSS JOIN LATERAL _inicios_disponibles_prestador(
    o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos, p_empleado_id
  ) i
  WHERE o.tipo_servicio = p_tipo_servicio
    AND (p_fecha + i.hora) > (now() AT TIME ZONE 'America/Guayaquil')
  ORDER BY 1;
END;
$function$
;

DROP FUNCTION IF EXISTS public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text);
CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone, p_modalidad text DEFAULT NULL::text, p_empleado_id uuid DEFAULT NULL)
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


-- ── 4. QUIENES ATIENDEN ESTE SERVICIO (el lector del selector) ──────
--
-- El CUANDO necesita saber a quien puede ofrecer. **El predicado NO se
-- inventa: es el mismo que ya vive en `_inicios_disponibles_prestador`**
-- (`pe.rol = 'dueño' OR EXISTS(chip en esa oferta)`), extraido para que
-- la puerta no ofrezca a nadie que el motor no vaya a aceptar (Ley 23).
--
-- Devuelve TODAS las personas habilitadas, tengan o no franja cargada —
-- y eso es deliberado: la pantalla necesita distinguir "no atiende esto"
-- de "atiende pero no tiene horario" (D-540 en su forma visible). Quien
-- no tenga franja no producira inicios, y ESO lo dice el CUANDO, no este
-- lector inventando una ausencia.

CREATE OR REPLACE FUNCTION public.obtener_personas_que_atienden(
  p_prestador_id uuid,
  p_servicio_id  uuid
)
RETURNS TABLE(empleado_id uuid, nombre text, tiene_jornada boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    pe.id,
    pr.nombre,
    EXISTS (SELECT 1 FROM prestador_horarios h
             WHERE h.empleado_id = pe.id AND h.activo)
  FROM prestador_empleados pe
  LEFT JOIN profiles pr ON pr.id = pe.user_id
  WHERE pe.prestador_id = p_prestador_id
    AND pe.activo
    AND (pe.rol = 'dueño' OR EXISTS (
          SELECT 1 FROM prestador_empleado_servicios pes
          WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
  ORDER BY (pe.rol = 'dueño') DESC, pr.nombre ASC, pe.id ASC;
END;
$function$;


-- ── L-140: proacl explicito ─────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.obtener_personas_que_atienden(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_personas_que_atienden(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public._inicios_disponibles_prestador(uuid, uuid, date, integer, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._inicios_disponibles_prestador(uuid, uuid, date, integer, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.obtener_inicios_vet_disponibles(date, text, uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_inicios_vet_disponibles(date, text, uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid) TO authenticated;
