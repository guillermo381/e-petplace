-- ═══════════════════════════════════════════════════════════════════════
-- V0 — LA FUNDACIÓN DEL MODELO DE ACTOR (S67, orden founder + Opción 1
-- ratificada con doble check).
--
-- Contrato: MODELO_VETERINARIA.md v1.0 PARTE I + §17-V0. Blueprint
-- firmado: camino (b) titular materializado · muerte de las 5 franjas
-- Satori · min(franja, techo) con paseo = cupo techo 4 · D-415 absorbida
-- (cura por NULL honesto; nacen solo las 3 tablas de caso) · D-426
-- intacta · techo de especies médicas = las 11 del catálogo.
--
-- Prueba reina (Opción 1): identidad ANTES/DESPUÉS intra-transacción con
-- whitelist COMPUTADA — diferencia admitida SOLO donde (i) el slot solapa
-- una cita firme de servicio exclusivo de la persona, o (ii) el delta es
-- únicamente cupos_restantes de un servicio exclusivo en franja cupo>1
-- recortado a exactamente 1. Las 2 citas de adiestramiento del 23-24/07
-- NO se tocan: son el FIXTURE — la migración prueba que post-fundación
-- esas horas ya no se ofertan (el bug encontrado pasa a ser el test).
--
-- Enmienda blessed: backfill de evento_cita_servicio.empleado_id (56) y
-- todos los escritores de citas firmes escriben persona al insertar.
-- Toda falla de assert ABORTA la migración entera (residuos 0).
-- ═══════════════════════════════════════════════════════════════════════

-- El juez corre con la sesión simulada del dueño de Zeus (las entradas
-- fijas del relevamiento docs/relevamientos/2026-07-17-bloque0-motor).
-- set_config local: muere con la transacción de la migración.
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}',
  true
);

-- ═══════════════ T6.pre — CAPTURA DEL ANTES (motor viejo, mismo now()) ═

CREATE TEMP TABLE _v0_antes_inicios (oficio text, hora time);
CREATE TEMP TABLE _v0_antes_quien  (fn text, fila jsonb);
CREATE TEMP TABLE _v0_antes_slots  (servicio text, fecha date, hora time, cupos int);
CREATE TEMP TABLE _v0_md5_intactas (fn text, firma text);

INSERT INTO _v0_antes_inicios SELECT 'paseo30', i.hora FROM obtener_inicios_paseo_disponibles('2026-07-24', 30) i;
INSERT INTO _v0_antes_inicios SELECT 'paseo60', i.hora FROM obtener_inicios_paseo_disponibles('2026-07-24', 60) i;
INSERT INTO _v0_antes_inicios SELECT 'grooming', i.hora FROM obtener_inicios_grooming_disponibles('2026-07-24', 'grooming', 'a3332037-c487-45c1-875f-83caf342f59e', 'local') i;
INSERT INTO _v0_antes_inicios SELECT 'adiestramiento', i.hora FROM obtener_inicios_adiestramiento_disponibles('2026-07-24', 'a3332037-c487-45c1-875f-83caf342f59e', NULL) i;

INSERT INTO _v0_antes_quien SELECT 'paseadores30', to_jsonb(t) FROM obtener_paseadores_disponibles('2026-07-24', '10:00', 30) t;
INSERT INTO _v0_antes_quien SELECT 'paseadores60', to_jsonb(t) FROM obtener_paseadores_disponibles('2026-07-24', '10:00', 60) t;
INSERT INTO _v0_antes_quien SELECT 'groomers', to_jsonb(t) FROM obtener_groomers_disponibles('2026-07-24', '10:00', 'grooming', 'a3332037-c487-45c1-875f-83caf342f59e', 'local') t;
INSERT INTO _v0_antes_quien SELECT 'groomers_completo', to_jsonb(t) FROM obtener_groomers_disponibles('2026-07-24', '10:00', 'grooming_completo', 'a3332037-c487-45c1-875f-83caf342f59e', 'local') t;
INSERT INTO _v0_antes_quien SELECT 'adiestradores', to_jsonb(t) FROM obtener_adiestradores_disponibles('2026-07-24', '10:00', 'a3332037-c487-45c1-875f-83caf342f59e') t;

INSERT INTO _v0_antes_slots SELECT 'paseo30', s.fecha, s.hora, s.cupos_restantes FROM obtener_slots_disponibles('de300000-0000-4000-8000-0000000000e5', 'de300000-0000-4000-8000-00000000a5e0', '2026-07-20', '2026-07-26') s;
INSERT INTO _v0_antes_slots SELECT 'grooming', s.fecha, s.hora, s.cupos_restantes FROM obtener_slots_disponibles('de300000-0000-4000-8000-0000000000e5', '388fbd60-f4e6-42f1-a265-d10ff799da7a', '2026-07-20', '2026-07-26') s;
INSERT INTO _v0_antes_slots SELECT 'adiestramiento', s.fecha, s.hora, s.cupos_restantes FROM obtener_slots_disponibles('de300000-0000-4000-8000-0000000000e5', '8fc664dd-04ee-41f4-8c47-a0606cc42680', '2026-07-20', '2026-07-26') s;

-- Los cierres y el pago NO se tocan (orden explícita): firma md5 del ANTES.
INSERT INTO _v0_md5_intactas
SELECT p.proname, md5(pg_get_functiondef(p.oid))
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('cerrar_paseo_con_calidad', 'cerrar_grooming_con_calidad',
                    'cerrar_atencion_adiestramiento', 'confirmar_cita_pagada');

DO $do$
DECLARE v_n int;
BEGIN
  -- FIXTURE CONSAGRADO: las 2 citas firmes de adiestramiento 23-24/07
  -- 08:00-09:00 adentro de franjas cupo 3 — NO se tocan; son el test.
  SELECT count(*) INTO v_n
  FROM evento_cita_servicio c
  WHERE c.prestador_id = 'de300000-0000-4000-8000-0000000000e5'
    AND c.tipo_servicio = 'adiestramiento'
    AND c.fecha IN ('2026-07-23', '2026-07-24')
    AND c.hora = '08:00' AND c.duracion_minutos = 60
    AND c.estado = 'confirmada' AND c.estado_reserva = 'pagada';
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'V0 abort: fixture consagrado ausente — se esperaban 2 citas de adiestramiento firmes 23-24/07 08:00, hay % (a la mesa)', v_n;
  END IF;

  -- El ANTES abría el agujero (queda probado literal):
  IF NOT EXISTS (SELECT 1 FROM _v0_antes_inicios WHERE oficio = 'paseo30' AND hora = '08:00')
     OR NOT EXISTS (SELECT 1 FROM _v0_antes_inicios WHERE oficio = 'paseo30' AND hora = '08:30')
     OR NOT EXISTS (SELECT 1 FROM _v0_antes_inicios WHERE oficio = 'grooming' AND hora = '08:00')
     OR NOT EXISTS (SELECT 1 FROM _v0_antes_inicios WHERE oficio = 'adiestramiento' AND hora = '08:00') THEN
    RAISE EXCEPTION 'V0 abort: el ANTES no muestra el agujero del fixture (08:00/08:30 del 24/07) — el juez perdió su línea de base (a la mesa)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _v0_antes_slots WHERE servicio = 'grooming' AND fecha = '2026-07-23' AND hora = '08:00')
     OR NOT EXISTS (SELECT 1 FROM _v0_antes_slots WHERE servicio = 'adiestramiento' AND fecha = '2026-07-24' AND hora = '08:00')
     OR NOT EXISTS (SELECT 1 FROM _v0_antes_slots WHERE servicio = 'paseo30' AND fecha = '2026-07-24' AND hora = '08:00') THEN
    RAISE EXCEPTION 'V0 abort: el ANTES de slots no muestra el agujero del fixture (a la mesa)';
  END IF;

  RAISE NOTICE 'V0 T6.pre: ANTES capturado — % inicios, % filas QUIÉN, % slots',
    (SELECT count(*) FROM _v0_antes_inicios),
    (SELECT count(*) FROM _v0_antes_quien),
    (SELECT count(*) FROM _v0_antes_slots);
END;
$do$;

-- ═══════════════ TRAMO 1 — EL TITULAR MATERIALIZADO (camino b) ═════════

DO $do$
DECLARE
  v_n int;
  r record;
BEGIN
  -- 1a. Cada prestador gana su persona titular (rol='dueño', que el
  -- CHECK del schema ya conocía y ninguna fila usaba). Idempotente.
  SELECT count(*) INTO v_n FROM prestadores;
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'V0 abort T1: se esperaban 4 prestadores, hay % (a la mesa)', v_n;
  END IF;

  INSERT INTO prestador_empleados (
    prestador_id, user_id, rol, nombre, activo, modelo_pago,
    datos_bancarios, activado_en, created_by
  )
  SELECT pr.id, pr.user_id, 'dueño',
         COALESCE(p.nombre, pr.nombre_comercial),
         true, 'manual', '{}'::jsonb, now(), pr.user_id
  FROM prestadores pr
  LEFT JOIN profiles p ON p.id = pr.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe
    WHERE pe.prestador_id = pr.id AND pe.rol = 'dueño'
  );

  IF EXISTS (
    SELECT 1 FROM prestadores pr
    WHERE (SELECT count(*) FROM prestador_empleados pe
           WHERE pe.prestador_id = pr.id AND pe.rol = 'dueño' AND pe.activo) <> 1
  ) THEN
    RAISE EXCEPTION 'V0 abort T1: hay prestador sin titular único activo';
  END IF;
  RAISE NOTICE 'V0 T1: titulares materializados (4 prestadores, 1 dueño c/u)';

  -- 1c. Las 5 franjas de empleado de Satori MUEREN (decisión founder).
  -- SELECT probatorio literal al log ANTES de tocar:
  FOR r IN
    SELECT h.id, h.prestador_id, h.empleado_id, h.dia_semana,
           h.hora_inicio, h.hora_fin, h.max_citas_por_slot
    FROM prestador_horarios h
    WHERE h.empleado_id IS NOT NULL
    ORDER BY h.dia_semana
  LOOP
    RAISE NOTICE 'V0 T1 franja-empleado a borrar: id=% prestador=% empleado=% dia=% %-% cupo=%',
      r.id, r.prestador_id, r.empleado_id, r.dia_semana, r.hora_inicio, r.hora_fin, r.max_citas_por_slot;
  END LOOP;

  SELECT count(*) INTO v_n FROM prestador_horarios WHERE empleado_id IS NOT NULL;
  IF v_n <> 5 THEN
    RAISE EXCEPTION 'V0 abort T1: se esperaban exactamente 5 franjas de empleado, hay % — ABORT y a la mesa', v_n;
  END IF;
  IF EXISTS (
    SELECT 1 FROM prestador_horarios
    WHERE empleado_id IS NOT NULL
      AND (prestador_id <> '2052f109-143a-41d1-b338-de8973d8fb20'
           OR empleado_id <> '2e989931-b884-4c04-9971-3be4b9bd0319')
  ) THEN
    RAISE EXCEPTION 'V0 abort T1: hay una franja de empleado que NO es de Satori/"Test Empleado" — ABORT y a la mesa';
  END IF;

  DELETE FROM prestador_horarios WHERE empleado_id IS NOT NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 5 THEN
    RAISE EXCEPTION 'V0 abort T1: el DELETE tocó % filas (esperadas 5)', v_n;
  END IF;
  RAISE NOTICE 'V0 T1: las 5 franjas de Satori muertas';

  -- 1d. Backfill de franjas generales → el titular de su prestador.
  SELECT count(*) INTO v_n FROM prestador_horarios WHERE empleado_id IS NULL;
  IF v_n <> 18 THEN
    RAISE EXCEPTION 'V0 abort T1: se esperaban 18 franjas generales, hay %', v_n;
  END IF;
  UPDATE prestador_horarios h
  SET empleado_id = (SELECT pe.id FROM prestador_empleados pe
                     WHERE pe.prestador_id = h.prestador_id AND pe.rol = 'dueño')
  WHERE h.empleado_id IS NULL;
  IF EXISTS (SELECT 1 FROM prestador_horarios WHERE empleado_id IS NULL) THEN
    RAISE EXCEPTION 'V0 abort T1: quedaron franjas sin persona';
  END IF;
  RAISE NOTICE 'V0 T1: 18 franjas backfilleadas al titular';

  -- 1b. Backfill evento_atencion → titular. El relevamiento del 17-07
  -- contó 13; la DB viva sumó UNA legítima el mismo día (adiestramiento
  -- de Andres, cita 17/07 08:00, iniciada 18:33 UTC, empleado NULL —
  -- fila literal en el reporte S67): el ancla honesta es 14.
  SELECT count(*) INTO v_n FROM evento_atencion;
  IF v_n <> 14 THEN
    RAISE EXCEPTION 'V0 abort T1: se esperaban 14 evento_atencion, hay %', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM evento_atencion WHERE empleado_id IS NOT NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'V0 abort T1: evento_atencion ya tiene % filas con persona (se esperaban 0)', v_n;
  END IF;
  UPDATE evento_atencion ea
  SET empleado_id = (SELECT pe.id FROM prestador_empleados pe
                     WHERE pe.prestador_id = ea.prestador_id AND pe.rol = 'dueño')
  WHERE ea.empleado_id IS NULL;
  IF EXISTS (SELECT 1 FROM evento_atencion WHERE empleado_id IS NULL) THEN
    RAISE EXCEPTION 'V0 abort T1: quedaron atenciones sin persona';
  END IF;
  RAISE NOTICE 'V0 T1: 14 evento_atencion backfilleadas al titular';

  -- Enmienda blessed: la tabla de OCUPACIÓN también se personifica.
  SELECT count(*) INTO v_n FROM evento_cita_servicio;
  IF v_n <> 56 THEN
    RAISE EXCEPTION 'V0 abort T1: se esperaban 56 evento_cita_servicio, hay %', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM evento_cita_servicio WHERE empleado_id IS NOT NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'V0 abort T1: evento_cita_servicio ya tiene % filas con persona (se esperaban 0)', v_n;
  END IF;
  UPDATE evento_cita_servicio c
  SET empleado_id = (SELECT pe.id FROM prestador_empleados pe
                     WHERE pe.prestador_id = c.prestador_id AND pe.rol = 'dueño')
  WHERE c.empleado_id IS NULL AND c.prestador_id IS NOT NULL;
  SELECT count(*) INTO v_n FROM evento_cita_servicio WHERE empleado_id IS NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'V0 abort T1: quedaron % citas sin persona', v_n;
  END IF;
  RAISE NOTICE 'V0 T1: 56 citas backfilleadas al titular';
END;
$do$;

-- Post-backfill: la franja SIEMPRE es de una persona. NOT NULL duro.
ALTER TABLE prestador_horarios ALTER COLUMN empleado_id SET NOT NULL;

-- evento_atencion: NOT NULL — verificado contra los callers relevados:
-- las ÚNICAS rutas de INSERT son iniciar_atencion_{paseo,grooming,
-- adiestramiento} (los simular_prestador_inicia_* delegan en ellas), y
-- las tres renacen abajo resolviendo persona (param → cita → titular).
ALTER TABLE evento_atencion ALTER COLUMN empleado_id SET NOT NULL;

-- evento_cita_servicio.empleado_id queda NULLABLE declarado: todos los
-- escritores relevados escriben persona desde hoy (crear_bloqueo_agenda,
-- _generar_citas_programa, _generar_citas_plan, reservar_salida_paquete,
-- simular_cliente_agenda_cita) y el backfill cubrió la historia; el
-- NOT NULL duro espera a relevar escritores fuera del monorepo (admin).

-- ═══════════════ TRAMO 3 — CONCURRENCIA DECLARADA (§3) ═════════════════
-- (antes que T2: el motor nuevo lee estas columnas)

ALTER TABLE tipos_servicio
  ADD COLUMN concurrencia text NOT NULL DEFAULT 'exclusiva',
  ADD COLUMN cupo_techo integer;

ALTER TABLE tipos_servicio
  ADD CONSTRAINT tipos_servicio_concurrencia_check
    CHECK (concurrencia IN ('exclusiva', 'cupo')),
  ADD CONSTRAINT tipos_servicio_cupo_techo_coherente
    CHECK ((concurrencia = 'exclusiva' AND cupo_techo IS NULL)
        OR (concurrencia = 'cupo' AND cupo_techo IS NOT NULL AND cupo_techo >= 1));

-- Seed firmado: SOLO el paseo declara cupo (techo de plataforma 4).
-- Servicio que no declara = exclusivo (§3 literal). Nadie más declara.
UPDATE tipos_servicio SET concurrencia = 'cupo', cupo_techo = 4
WHERE categoria = 'paseo';

DO $do$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM tipos_servicio WHERE concurrencia = 'cupo';
  IF v_n <> 5 THEN
    RAISE EXCEPTION 'V0 abort T3: se esperaban 5 tipos paseo con cupo, hay %', v_n;
  END IF;
  IF EXISTS (SELECT 1 FROM tipos_servicio WHERE concurrencia = 'exclusiva' AND cupo_techo IS NOT NULL) THEN
    RAISE EXCEPTION 'V0 abort T3: exclusiva con cupo_techo';
  END IF;
  RAISE NOTICE 'V0 T3: concurrencia declarada (paseo=cupo techo 4, resto exclusiva)';
END;
$do$;

-- ═══════════════ TRAMO 2 — EL MOTOR GENERALIZADO ═══════════════════════

-- L-119: la firma cambia (prestador→empleado + tipo de servicio):
-- DROP explícito de la vieja — jamás sobrecarga zombi.
DROP FUNCTION public._agenda_ocupacion(uuid, date, time without time zone, integer, uuid);

CREATE FUNCTION public._agenda_ocupacion(
  p_empleado_id uuid,
  p_fecha date,
  p_hora time without time zone,
  p_duracion_minutos integer,
  p_excluir_cita uuid DEFAULT NULL::uuid,
  p_tipo_servicio text DEFAULT NULL::text
) RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $fn$
  -- V0-actor (S67): la ocupación es de la PERSONA (MODELO_VETERINARIA
  -- §2) y la regla de mezcla vive en la fuente (§3): una persona a un
  -- instante está libre / en UNA exclusiva / en UN grupo de un MISMO
  -- servicio con cupo. Intactos: firmes + holds pendiente_pago vigentes
  -- (expiración perezosa) · exclusión D-349 · máximo de solape simultáneo.
  -- CONTRATO: si algún ocupante NO es agrupable con el candidato (otro
  -- tipo_servicio — mezcla imposible; una exclusiva ajena cae acá),
  -- devuelve 32767 (saturado). Si todos los ocupantes son del MISMO
  -- servicio, devuelve el tamaño máximo del grupo; la capacidad efectiva
  -- la pone el caller: LEAST(cupo de franja, cupo_techo del servicio) —
  -- para exclusiva cupo_techo NULL ⇒ capacidad 1 (C=1 colapsa a hoy).
  WITH ocupantes AS (
    SELECT EXTRACT(EPOCH FROM c.hora)::bigint                           AS ini,
           EXTRACT(EPOCH FROM c.hora)::bigint + c.duracion_minutos * 60 AS fin,
           c.tipo_servicio
    FROM evento_cita_servicio c
    WHERE c.empleado_id = p_empleado_id
      AND c.fecha = p_fecha
      AND c.id IS DISTINCT FROM p_excluir_cita   -- D-349
      AND (
        c.estado IN ('confirmada', 'en_curso')                          -- firmes
        OR (c.estado = 'pendiente'                                      -- holds vigentes
            AND c.estado_reserva = 'pendiente_pago'
            AND c.expira_en > now())                                    -- expiración perezosa
      )
      AND EXTRACT(EPOCH FROM c.hora)::bigint
          < EXTRACT(EPOCH FROM p_hora)::bigint + p_duracion_minutos * 60
      AND EXTRACT(EPOCH FROM c.hora)::bigint + c.duracion_minutos * 60
          > EXTRACT(EPOCH FROM p_hora)::bigint
  ),
  instantes AS (
    SELECT EXTRACT(EPOCH FROM p_hora)::bigint AS t
    UNION
    SELECT o.ini FROM ocupantes o
    WHERE o.ini > EXTRACT(EPOCH FROM p_hora)::bigint
  )
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM ocupantes o
      WHERE o.tipo_servicio IS DISTINCT FROM p_tipo_servicio
    ) THEN 32767
    ELSE (
      SELECT COALESCE(MAX(n), 0)::int
      FROM (
        SELECT (SELECT count(*) FROM ocupantes o WHERE o.ini <= i.t AND o.fin > i.t) AS n
        FROM instantes i
      ) conteos
    )
  END;
$fn$;

-- L-140 de nacimiento: helper interno — nadie lo ejecuta directo.
REVOKE ALL ON FUNCTION public._agenda_ocupacion(uuid, date, time without time zone, integer, uuid, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._inicios_disponibles_prestador(
  p_prestador_id uuid, p_servicio_id uuid, p_fecha date, p_duracion_minutos integer
) RETURNS TABLE(hora time without time zone)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $fn$
  -- V0-actor: unión de ventanas de las PERSONAS habilitadas para el
  -- servicio (§2: el dueño siempre; el empleado, si su oferta lo
  -- habilita vía prestador_empleado_servicios). Hoy N=1: colapsa exacto
  -- al titular. Capacidad efectiva = LEAST(franja, cupo_techo).
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
    JOIN prestador_servicios ps ON ps.id = p_servicio_id
    JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE h.prestador_id = p_prestador_id
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
$fn$;

CREATE OR REPLACE FUNCTION public.obtener_inicios_paseo_disponibles(p_fecha date, p_duracion_minutos integer)
RETURNS TABLE(hora time without time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  -- V0-actor: la franja es de la persona; la capacidad efectiva es
  -- LEAST(cupo de franja, cupo_techo del servicio).
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT DISTINCT s.s_hora
  FROM (
    SELECT
      pr.id AS s_prestador,
      h.empleado_id AS s_emp,
      ps.tipo_servicio AS s_tipo,
      (h.hora_inicio + make_interval(mins => g.n * h.duracion_slot_minutos))::time AS s_hora,
      h.hora_fin AS s_fin,
      LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(ts.cupo_techo, 1)) AS s_capacidad
    FROM prestador_servicios ps
    JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
    JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
    JOIN prestador_horarios h    ON h.prestador_id = pr.id
                                AND h.activo
                                AND h.duracion_slot_minutos > 0
                                AND (h.servicio_id IS NULL OR h.servicio_id = ps.id)
                                AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int  -- regla 32
    JOIN prestador_empleados pe  ON pe.id = h.empleado_id AND pe.activo
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE ps.activo
      AND ps.duracion_minutos = p_duracion_minutos
      AND (pe.rol = 'dueño' OR EXISTS (
            SELECT 1 FROM prestador_empleado_servicios pes
            WHERE pes.empleado_id = pe.id AND pes.servicio_id = ps.id))
  ) s
  WHERE
    EXTRACT(EPOCH FROM s.s_hora)::int + p_duracion_minutos * 60 <= EXTRACT(EPOCH FROM s.s_fin)::int
    AND (s.s_capacidad - _agenda_ocupacion(s.s_emp, p_fecha, s.s_hora, p_duracion_minutos, NULL, s.s_tipo)) > 0
    AND (p_fecha + s.s_hora) > v_ahora_local
    AND NOT _prestador_bloqueado(s.s_prestador, p_fecha)      -- D-341
  ORDER BY 1;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.obtener_paseadores_disponibles(p_fecha date, p_hora time without time zone, p_duracion_minutos integer)
RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, precio_plan numeric, duracion_minutos integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');
BEGIN
  -- V0-actor: el QUIÉN pregunta por PERSONA habilitada con capacidad
  -- LEAST(franja, cupo_techo); firma pública INTACTA.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= v_ahora_local THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.precio,
    -- D-375: el precio del plan viaja al dueño — espejo EXACTO del server
    -- de cobro (COALESCE en contratar_plan_paseo); NULL honesto.
    ps.precio_plan,
    ps.duracion_minutos
  FROM prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  WHERE ps.activo
    AND ps.duracion_minutos = p_duracion_minutos
    AND NOT _prestador_bloqueado(pr.id, p_fecha)              -- D-341
    AND EXISTS (
      SELECT 1
      FROM prestador_horarios h
      JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
      WHERE h.prestador_id = pr.id
        AND h.activo
        AND h.duracion_slot_minutos > 0
        AND (h.servicio_id IS NULL OR h.servicio_id = ps.id)
        AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
        AND p_hora >= h.hora_inicio
        AND EXTRACT(EPOCH FROM p_hora)::int + p_duracion_minutos * 60
            <= EXTRACT(EPOCH FROM h.hora_fin)::int
        AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
        AND (pe.rol = 'dueño' OR EXISTS (
              SELECT 1 FROM prestador_empleado_servicios pes
              WHERE pes.empleado_id = pe.id AND pes.servicio_id = ps.id))
        AND _agenda_ocupacion(pe.id, p_fecha, p_hora, p_duracion_minutos, NULL, ps.tipo_servicio)
            < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(ts.cupo_techo, 1))
    )
  ORDER BY 5, 3;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.obtener_slots_disponibles(p_prestador_id uuid, p_servicio_id uuid, p_desde date, p_hasta date)
RETURNS TABLE(fecha date, hora time without time zone, duracion_minutos integer, cupos_restantes integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_dur int;
  v_tipo text;
  v_cupo_techo int;
BEGIN
  -- V0-actor: cupos_restantes = el MEJOR resto entre las personas
  -- habilitadas (N=1: el titular). Capacidad = LEAST(franja, techo).
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_desde IS NULL OR p_hasta IS NULL OR p_hasta < p_desde OR (p_hasta - p_desde) > 60 THEN
    RAISE EXCEPTION 'rango_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  -- La duración de la OFERTA manda la ventana (S55-B2).
  SELECT ps.duracion_minutos, ps.tipo_servicio INTO v_dur, v_tipo
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_dur IS NULL OR v_dur <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  SELECT ts.cupo_techo INTO v_cupo_techo FROM tipos_servicio ts WHERE ts.codigo = v_tipo;

  RETURN QUERY
  WITH dias AS (
    SELECT d::date AS dia
    FROM generate_series(p_desde::timestamp, p_hasta::timestamp, interval '1 day') AS d
  ),
  slots AS (
    SELECT
      h.empleado_id AS s_emp,
      di.dia AS s_fecha,
      (h.hora_inicio + make_interval(mins => g.n * h.duracion_slot_minutos))::time AS s_hora,
      h.hora_fin AS s_fin,
      LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1)) AS s_capacidad
    FROM prestador_horarios h
    JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
    JOIN dias di ON EXTRACT(DOW FROM di.dia)::int = h.dia_semana          -- regla 32
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
      AND (pe.rol = 'dueño' OR EXISTS (
            SELECT 1 FROM prestador_empleado_servicios pes
            WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
  ),
  libres AS (
    SELECT s.s_fecha, s.s_hora,
           (s.s_capacidad - _agenda_ocupacion(s.s_emp, s.s_fecha, s.s_hora, v_dur, NULL, v_tipo)) AS libre
    FROM slots s
    WHERE EXTRACT(EPOCH FROM s.s_hora)::int + v_dur * 60 <= EXTRACT(EPOCH FROM s.s_fin)::int
      AND (s.s_fecha + s.s_hora) > v_ahora_local
      AND NOT _prestador_bloqueado(p_prestador_id, s.s_fecha)   -- D-341
  )
  SELECT l.s_fecha, l.s_hora, v_dur, max(l.libre)::int
  FROM libres l
  GROUP BY l.s_fecha, l.s_hora
  HAVING max(l.libre) > 0
  ORDER BY 1, 2;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone, p_modalidad text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
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
  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.duracion_minutos, ps.atiende_local, ps.atiende_domicilio
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
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
  ORDER BY (SELECT count(*) FROM evento_cita_servicio cc
            WHERE cc.empleado_id = pe.id AND cc.fecha = p_fecha
              AND (cc.estado IN ('confirmada', 'en_curso')
                   OR (cc.estado = 'pendiente' AND cc.estado_reserva = 'pendiente_pago'
                       AND cc.expira_en > now()))),
           pe.created_at, pe.id
  LIMIT 1;
  IF v_empleado IS NULL THEN
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
$fn$;

CREATE OR REPLACE FUNCTION public._generar_citas_programa(p_programa_contratado_id uuid, p_fecha_inicio date, p_hora time without time zone, p_pagado_en timestamp with time zone)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_prog      record;
  v_tipo_srv  text;
  v_k         int;
  v_fecha     date;
  v_country   text;
  v_eje       text;
  v_visib     jsonb;
  v_evento_id uuid;
  v_direccion jsonb;
  v_precio    numeric(14,2);
  -- V0-actor
  v_empleado    uuid;
  v_cupo_techo  int;
BEGIN
  SELECT * INTO v_prog FROM programas_contratados WHERE id = p_programa_contratado_id;
  IF v_prog.id IS NULL THEN
    RAISE EXCEPTION 'programa_no_encontrado' USING ERRCODE = '22023';
  END IF;

  SELECT ps.tipo_servicio INTO v_tipo_srv
  FROM prestador_servicios ps WHERE ps.id = v_prog.prestador_servicio_id;
  SELECT ts.cupo_techo INTO v_cupo_techo FROM tipos_servicio ts WHERE ts.codigo = v_tipo_srv;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = v_prog.mascota_id;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visib
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  v_direccion := _direccion_hogar_snapshot(v_prog.user_id);

  FOR v_k IN 1..v_prog.n_sesiones LOOP
    v_fecha := p_fecha_inicio + ((v_k - 1) * 7);

    -- la vigencia congelada debe cubrir el calendario completo
    IF v_fecha > v_prog.vigencia_hasta THEN
      RAISE EXCEPTION 'programa_excede_vigencia: %', v_fecha USING ERRCODE = '22023';
    END IF;

    -- D-341: el programa tampoco nace sobre las vacaciones del adiestrador.
    IF _prestador_bloqueado(v_prog.prestador_id, v_fecha) THEN
      RAISE EXCEPTION 'prestador_no_disponible: %', v_fecha USING ERRCODE = '22023';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('agenda:' || v_prog.prestador_id::text || ':' || v_fecha::text, 0)
    );

    -- V0-actor: geometría de franja (fuera_de_horario) y luego PERSONA
    -- disponible (fecha_sin_cupo). Capacidad = LEAST(franja, techo).
    IF NOT EXISTS (
      SELECT 1 FROM prestador_horarios h
      WHERE h.prestador_id = v_prog.prestador_id
        AND h.activo
        AND h.duracion_slot_minutos > 0
        AND (h.servicio_id IS NULL OR h.servicio_id = v_prog.prestador_servicio_id)
        AND h.dia_semana = EXTRACT(DOW FROM v_fecha)::int          -- regla 32
        AND p_hora >= h.hora_inicio
        AND EXTRACT(EPOCH FROM p_hora)::int + v_prog.duracion_minutos * 60
            <= EXTRACT(EPOCH FROM h.hora_fin)::int
        AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    ) THEN
      RAISE EXCEPTION 'fuera_de_horario: %', v_fecha USING ERRCODE = '22023';
    END IF;

    SELECT pe.id INTO v_empleado
    FROM prestador_horarios h
    JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
    WHERE h.prestador_id = v_prog.prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = v_prog.prestador_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM v_fecha)::int
      AND p_hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM p_hora)::int + v_prog.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
      AND (pe.rol = 'dueño' OR EXISTS (
            SELECT 1 FROM prestador_empleado_servicios pes
            WHERE pes.empleado_id = pe.id AND pes.servicio_id = v_prog.prestador_servicio_id))
      AND _agenda_ocupacion(pe.id, v_fecha, p_hora, v_prog.duracion_minutos, NULL, v_tipo_srv)
          < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
    ORDER BY (SELECT count(*) FROM evento_cita_servicio cc
              WHERE cc.empleado_id = pe.id AND cc.fecha = v_fecha
                AND (cc.estado IN ('confirmada', 'en_curso')
                     OR (cc.estado = 'pendiente' AND cc.estado_reserva = 'pendiente_pago'
                         AND cc.expira_en > now()))),
             pe.created_at, pe.id
    LIMIT 1;
    IF v_empleado IS NULL THEN
      RAISE EXCEPTION 'fecha_sin_cupo: %', v_fecha USING ERRCODE = '22023';
    END IF;

    -- la ÚLTIMA sesión absorbe el residuo: sum(precios) == precio_total
    IF v_k = v_prog.n_sesiones THEN
      v_precio := v_prog.precio_total - v_prog.precio_unitario_efectivo * (v_prog.n_sesiones - 1);
    ELSE
      v_precio := v_prog.precio_unitario_efectivo;
    END IF;

    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
      creado_por_user_id, datos, visibilidad, country_code
    ) VALUES (
      v_prog.mascota_id, 'cita_servicio', v_eje, (v_fecha + p_hora), v_prog.prestador_id,
      v_prog.user_id,
      jsonb_build_object('origen', 'programa_adiestramiento',
                         'programa_contratado_id', p_programa_contratado_id,
                         'sesion_numero', v_k),
      v_visib, COALESCE(v_country, 'EC')
    ) RETURNING id INTO v_evento_id;

    INSERT INTO evento_cita_servicio (
      evento_id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
      fecha, hora, precio, duracion_minutos, estado, estado_reserva,
      expira_en, country_code, programa_contratado_id, sesion_numero,
      direccion_snapshot, metadata
    ) VALUES (
      v_evento_id, v_prog.user_id, v_prog.mascota_id, v_prog.prestador_id, v_empleado, v_tipo_srv,
      v_fecha, p_hora, v_precio, v_prog.duracion_minutos,
      'confirmada', 'pagada',
      NULL, COALESCE(v_country, 'EC'), p_programa_contratado_id, v_k,
      v_direccion,
      jsonb_build_object('origen', 'programa', 'pago_simulado', true, 'pagado_en', p_pagado_en,
                         'n_sesiones', v_prog.n_sesiones)
    );
  END LOOP;

  RETURN v_prog.n_sesiones;
END;
$fn$;

CREATE OR REPLACE FUNCTION public._generar_citas_plan(p_suscripcion_id uuid, p_periodo_inicio date, p_periodo_fin date, p_pagado_en timestamp with time zone)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_susc      record;
  v_fecha     date;
  v_country   text;
  v_eje       text;
  v_visib     jsonb;
  v_evento_id uuid;
  v_direccion jsonb;
  v_n         int := 0;
  v_ahora     timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  -- V0-actor
  v_tipo        text;
  v_empleado    uuid;
  v_cupo_techo  int;
BEGIN
  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = p_suscripcion_id;
  IF v_susc.id IS NULL THEN
    RAISE EXCEPTION 'plan_no_encontrado' USING ERRCODE = '22023';
  END IF;

  SELECT ps.tipo_servicio INTO v_tipo
  FROM prestador_servicios ps WHERE ps.id = v_susc.prestador_servicio_id;
  SELECT ts.cupo_techo INTO v_cupo_techo FROM tipos_servicio ts WHERE ts.codigo = v_tipo;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = v_susc.mascota_id;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visib
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  v_direccion := _direccion_hogar_snapshot(v_susc.user_id);

  FOR v_fecha IN SELECT * FROM _fechas_periodo_plan(p_periodo_inicio, v_susc.dias_semana, v_susc.frecuencia)
  LOOP
    IF (v_fecha + v_susc.hora) <= v_ahora THEN
      CONTINUE;  -- el arranque del plan jamás fabrica citas en el pasado
    END IF;

    -- D-341: el plan tampoco nace sobre las vacaciones del paseador.
    IF _prestador_bloqueado(v_susc.prestador_id, v_fecha) THEN
      RAISE EXCEPTION 'prestador_no_disponible: %', v_fecha USING ERRCODE = '22023';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('agenda:' || v_susc.prestador_id::text || ':' || v_fecha::text, 0)
    );

    -- V0-actor: geometría (fuera_de_horario) → persona (fecha_sin_cupo).
    IF NOT EXISTS (
      SELECT 1 FROM prestador_horarios h
      WHERE h.prestador_id = v_susc.prestador_id
        AND h.activo
        AND h.duracion_slot_minutos > 0
        AND (h.servicio_id IS NULL OR h.servicio_id = v_susc.prestador_servicio_id)
        AND h.dia_semana = EXTRACT(DOW FROM v_fecha)::int          -- regla 32
        AND v_susc.hora >= h.hora_inicio
        AND EXTRACT(EPOCH FROM v_susc.hora)::int + v_susc.duracion_minutos * 60
            <= EXTRACT(EPOCH FROM h.hora_fin)::int
        AND (EXTRACT(EPOCH FROM (v_susc.hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    ) THEN
      RAISE EXCEPTION 'fuera_de_horario: %', v_fecha USING ERRCODE = '22023';
    END IF;

    SELECT pe.id INTO v_empleado
    FROM prestador_horarios h
    JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
    WHERE h.prestador_id = v_susc.prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = v_susc.prestador_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM v_fecha)::int
      AND v_susc.hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM v_susc.hora)::int + v_susc.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (v_susc.hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
      AND (pe.rol = 'dueño' OR EXISTS (
            SELECT 1 FROM prestador_empleado_servicios pes
            WHERE pes.empleado_id = pe.id AND pes.servicio_id = v_susc.prestador_servicio_id))
      AND _agenda_ocupacion(pe.id, v_fecha, v_susc.hora, v_susc.duracion_minutos, NULL, v_tipo)
          < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
    ORDER BY (SELECT count(*) FROM evento_cita_servicio cc
              WHERE cc.empleado_id = pe.id AND cc.fecha = v_fecha
                AND (cc.estado IN ('confirmada', 'en_curso')
                     OR (cc.estado = 'pendiente' AND cc.estado_reserva = 'pendiente_pago'
                         AND cc.expira_en > now()))),
             pe.created_at, pe.id
    LIMIT 1;
    IF v_empleado IS NULL THEN
      RAISE EXCEPTION 'fecha_sin_cupo: %', v_fecha USING ERRCODE = '22023';
    END IF;

    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
      creado_por_user_id, datos, visibilidad, country_code
    ) VALUES (
      v_susc.mascota_id, 'cita_servicio', v_eje, (v_fecha + v_susc.hora), v_susc.prestador_id,
      v_susc.user_id,
      jsonb_build_object('origen', 'plan_paseo', 'suscripcion_servicio_id', p_suscripcion_id),
      v_visib, COALESCE(v_country, 'EC')
    ) RETURNING id INTO v_evento_id;

    INSERT INTO evento_cita_servicio (
      evento_id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
      fecha, hora, precio, duracion_minutos, estado, estado_reserva,
      expira_en, country_code, suscripcion_servicio_id, direccion_snapshot, metadata
    ) VALUES (
      v_evento_id, v_susc.user_id, v_susc.mascota_id, v_susc.prestador_id, v_empleado,
      v_tipo,
      v_fecha, v_susc.hora, v_susc.precio_unitario_efectivo, v_susc.duracion_minutos,
      'confirmada', 'pagada',
      NULL, COALESCE(v_country, 'EC'), p_suscripcion_id, v_direccion,
      jsonb_build_object('origen', 'plan', 'pago_simulado', true, 'pagado_en', p_pagado_en,
                         'periodo_inicio', p_periodo_inicio, 'periodo_fin', p_periodo_fin)
    );

    v_n := v_n + 1;
  END LOOP;

  RETURN v_n;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.reservar_salida_paquete(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth        uuid := auth.uid();
  v_familia     uuid;
  v_servicio    record;
  v_bono        record;
  v_country     text;
  v_eje         text;
  v_visibilidad jsonb;
  v_evento_id   uuid;
  v_cita_id     uuid;
  v_direccion   jsonb;
  v_saldo       int;
  -- V0-actor
  v_empleado    uuid;
  v_cupo_techo  int;
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
  SELECT fm.familia_id INTO v_familia
  FROM familia_miembro fm
  WHERE fm.user_id = v_auth AND fm.hasta IS NULL
  LIMIT 1;
  IF v_familia IS NULL THEN
    RAISE EXCEPTION 'sin_familia' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;
  SELECT ps.id, ps.tipo_servicio INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  -- F3 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  -- P19 (S59): el paseo es GRUPAL por norma.
  IF NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  -- FIFO DEL HOGAR (v1.4): el bono más viejo con saldo y vigencia.
  SELECT b.* INTO v_bono
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= p_fecha
  ORDER BY b.fecha_compra, b.created_at, b.id
  LIMIT 1
  FOR UPDATE;
  IF v_bono.id IS NULL THEN
    RAISE EXCEPTION 'sin_saldo_paquete' USING ERRCODE = '22023';
  END IF;

  -- V0-actor: geometría (fuera_de_horario) → persona (slot_ocupado).
  IF NOT EXISTS (
    SELECT 1 FROM prestador_horarios h
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32
      AND p_hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM p_hora)::int + v_bono.duracion_minutos * 60
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
    AND EXTRACT(EPOCH FROM p_hora)::int + v_bono.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    AND (pe.rol = 'dueño' OR EXISTS (
          SELECT 1 FROM prestador_empleado_servicios pes
          WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
    AND _agenda_ocupacion(pe.id, p_fecha, p_hora, v_bono.duracion_minutos, NULL, v_servicio.tipo_servicio)
        < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
  ORDER BY (SELECT count(*) FROM evento_cita_servicio cc
            WHERE cc.empleado_id = pe.id AND cc.fecha = p_fecha
              AND (cc.estado IN ('confirmada', 'en_curso')
                   OR (cc.estado = 'pendiente' AND cc.estado_reserva = 'pendiente_pago'
                       AND cc.expira_en > now()))),
           pe.created_at, pe.id
  LIMIT 1;
  IF v_empleado IS NULL THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visibilidad
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  v_direccion := _direccion_hogar_snapshot(v_auth);   -- D-339

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'reservar_salida_paquete', 'bono_id', v_bono.id),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  -- Cita firme y CUBIERTA (tercer escritor del invariante, S57).
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva,
    expira_en, country_code, bono_id, direccion_snapshot, metadata
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_empleado, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_bono.precio_por_unidad, v_bono.duracion_minutos,
    'confirmada', 'pagada',
    NULL, COALESCE(v_country, 'EC'), v_bono.id, v_direccion,
    jsonb_build_object(
      'origen', 'paquete', 'pago_simulado', true,
      'pagado_en', v_bono.pago_metadata ->> 'pagado_en'
    )
  ) RETURNING id INTO v_cita_id;

  UPDATE bonos
  SET unidades_usadas = unidades_usadas + 1,
      estado = CASE WHEN unidades_usadas + 1 >= unidades_total THEN 'agotado' ELSE estado END,
      agotado_en = CASE WHEN unidades_usadas + 1 >= unidades_total THEN now() ELSE agotado_en END
  WHERE id = v_bono.id;

  SELECT COALESCE(sum(b.unidades_total - b.unidades_usadas), 0)::int INTO v_saldo
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.fecha_vencimiento >= (now() AT TIME ZONE 'America/Guayaquil')::date;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'bono_id', v_bono.id,
    'fecha', p_fecha,
    'hora', p_hora,
    'precio_origen', v_bono.precio_por_unidad,
    'saldo_restante', v_saldo
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.reagendar_cita_suelta(p_cita_id uuid, p_nueva_fecha date, p_nueva_hora time without time zone)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_ocupados int;
  v_servicio_id uuid;
  v_ahora    timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  -- V0-actor: la persona de la cita viaja con ella
  v_emp        uuid;
  v_capacidad  int;
  v_cupo_techo int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_nueva_fecha IS NULL OR p_nueva_hora IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
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

  -- P18(c): con <2 h el paseo se pierde — ya no se mueve.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '2 hours' THEN
    RAISE EXCEPTION 'ventana_vencida' USING ERRCODE = '22023';
  END IF;
  IF (p_nueva_fecha + p_nueva_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: mover a un día bloqueado del paseador rebota.
  IF _prestador_bloqueado(v_cita.prestador_id, p_nueva_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_cita.prestador_id::text || ':' || p_nueva_fecha::text, 0)
  );

  -- V0-actor: la reagenda respeta a la persona de la cita (la verdad
  -- firme es con ese alguien, §2); legacy sin persona → titular.
  v_emp := v_cita.empleado_id;
  IF v_emp IS NULL THEN
    SELECT pe.id INTO v_emp FROM prestador_empleados pe
    WHERE pe.prestador_id = v_cita.prestador_id AND pe.rol = 'dueño' AND pe.activo
    LIMIT 1;
  END IF;
  IF v_emp IS NULL THEN
    RAISE EXCEPTION 'cita_sin_persona' USING ERRCODE = '22023';
  END IF;
  SELECT ts.cupo_techo INTO v_cupo_techo
  FROM tipos_servicio ts WHERE ts.codigo = v_cita.tipo_servicio;

  -- La oferta del tipo de la cita (para franjas atadas a servicio); la
  -- duración que manda es la SNAPSHOTEADA en la cita (S55-B2).
  SELECT ps.id INTO v_servicio_id
  FROM prestador_servicios ps
  WHERE ps.prestador_id = v_cita.prestador_id
    AND ps.tipo_servicio = v_cita.tipo_servicio
    AND ps.duracion_minutos = v_cita.duracion_minutos
    AND ps.activo
  LIMIT 1;

  SELECT LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
  INTO v_capacidad
  FROM prestador_horarios h
  WHERE h.prestador_id = v_cita.prestador_id
    AND h.empleado_id = v_emp
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = v_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_capacidad IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- D-349 curada de nacimiento: la propia cita no ocupa su ventana vieja.
  v_ocupados := _agenda_ocupacion(v_emp, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos, p_cita_id, v_cita.tipo_servicio);
  IF v_ocupados >= v_capacidad THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- Re-snapshot de fecha/hora; el pago viaja con la cita (P18a).
  UPDATE evento_cita_servicio
  SET fecha = p_nueva_fecha,
      hora = p_nueva_hora,
      empleado_id = COALESCE(empleado_id, v_emp),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'reagendada_de', jsonb_build_object('fecha', v_cita.fecha, 'hora', v_cita.hora),
        'reagendada_en', now()
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  UPDATE eventos_mascota
  SET fecha_evento = (p_nueva_fecha + p_nueva_hora)
  WHERE id = v_cita.evento_id;

  RETURN jsonb_build_object(
    'ok', true, 'cita_id', p_cita_id,
    'fecha', p_nueva_fecha, 'hora', p_nueva_hora
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.reagendar_sesion_programa(p_cita_id uuid, p_nueva_fecha date, p_nueva_hora time without time zone)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_prog     record;
  v_ocupados int;
  v_prev     timestamp;
  v_next     timestamp;
  v_ahora    timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  -- V0-actor
  v_emp        uuid;
  v_capacidad  int;
  v_cupo_techo int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_nueva_fecha IS NULL OR p_nueva_hora IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.programa_contratado_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_programa' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: %', v_cita.estado USING ERRCODE = '22023';
  END IF;

  -- P14(c): con <24 h la sesión se pierde — no hay reagenda automática.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '24 hours' THEN
    RAISE EXCEPTION 'aviso_tarde' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_prog FROM programas_contratados WHERE id = v_cita.programa_contratado_id FOR UPDATE;
  IF v_prog.estado <> 'activo' THEN
    RAISE EXCEPTION 'programa_no_activo: %', v_prog.estado USING ERRCODE = '22023';
  END IF;

  -- dentro de la VIGENCIA y jamás al pasado
  IF p_nueva_fecha > v_prog.vigencia_hasta THEN
    RAISE EXCEPTION 'fuera_de_vigencia' USING ERRCODE = '22023';
  END IF;
  IF (p_nueva_fecha + p_nueva_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- GUARD DE ORDEN (§1): la fecha nueva de la sesión k queda
  -- ESTRICTAMENTE entre la vigente de k−1 y la de k+1.
  SELECT max(c.fecha + c.hora) INTO v_prev
  FROM evento_cita_servicio c
  WHERE c.programa_contratado_id = v_cita.programa_contratado_id
    AND c.sesion_numero < v_cita.sesion_numero
    AND c.estado <> 'cancelada';
  SELECT min(c.fecha + c.hora) INTO v_next
  FROM evento_cita_servicio c
  WHERE c.programa_contratado_id = v_cita.programa_contratado_id
    AND c.sesion_numero > v_cita.sesion_numero
    AND c.estado <> 'cancelada';
  IF (v_prev IS NOT NULL AND (p_nueva_fecha + p_nueva_hora) <= v_prev)
     OR (v_next IS NOT NULL AND (p_nueva_fecha + p_nueva_hora) >= v_next) THEN
    RAISE EXCEPTION 'orden_programa_violado' USING ERRCODE = '22023';
  END IF;

  -- D-341: tampoco se reagenda sobre las vacaciones del adiestrador.
  IF _prestador_bloqueado(v_cita.prestador_id, p_nueva_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_cita.prestador_id::text || ':' || p_nueva_fecha::text, 0)
  );

  -- V0-actor: la reagenda respeta a la persona de la cita.
  v_emp := v_cita.empleado_id;
  IF v_emp IS NULL THEN
    SELECT pe.id INTO v_emp FROM prestador_empleados pe
    WHERE pe.prestador_id = v_cita.prestador_id AND pe.rol = 'dueño' AND pe.activo
    LIMIT 1;
  END IF;
  IF v_emp IS NULL THEN
    RAISE EXCEPTION 'cita_sin_persona' USING ERRCODE = '22023';
  END IF;
  SELECT ts.cupo_techo INTO v_cupo_techo
  FROM tipos_servicio ts WHERE ts.codigo = v_cita.tipo_servicio;

  SELECT LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
  INTO v_capacidad
  FROM prestador_horarios h
  WHERE h.prestador_id = v_cita.prestador_id
    AND h.empleado_id = v_emp
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = v_prog.prestador_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_capacidad IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- D-349: la propia cita se excluye del conteo de ocupación.
  v_ocupados := _agenda_ocupacion(v_emp, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos, p_cita_id, v_cita.tipo_servicio);
  IF v_ocupados >= v_capacidad THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
  SET fecha = p_nueva_fecha,
      hora = p_nueva_hora,
      empleado_id = COALESCE(empleado_id, v_emp),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'reagendada_de', jsonb_build_object('fecha', v_cita.fecha, 'hora', v_cita.hora),
        'reagendada_en', now()
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  UPDATE eventos_mascota
  SET fecha_evento = (p_nueva_fecha + p_nueva_hora)
  WHERE id = v_cita.evento_id;

  RETURN jsonb_build_object(
    'ok', true, 'cita_id', p_cita_id,
    'sesion_numero', v_cita.sesion_numero,
    'fecha', p_nueva_fecha, 'hora', p_nueva_hora
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.saltar_cita_plan(p_cita_id uuid, p_nueva_fecha date, p_nueva_hora time without time zone)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_susc     record;
  v_ocupados int;
  v_ahora    timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  -- V0-actor
  v_emp        uuid;
  v_capacidad  int;
  v_cupo_techo int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_nueva_fecha IS NULL OR p_nueva_hora IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.suscripcion_servicio_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: %', v_cita.estado USING ERRCODE = '22023';
  END IF;

  -- P14(c): con <24 h la cita se pierde — no hay reagenda automática.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '24 hours' THEN
    RAISE EXCEPTION 'aviso_tarde' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = v_cita.suscripcion_servicio_id;
  -- dentro del MISMO período y jamás al pasado
  IF p_nueva_fecha < v_susc.periodo_inicio OR p_nueva_fecha >= v_susc.periodo_fin THEN
    RAISE EXCEPTION 'fuera_del_periodo' USING ERRCODE = '22023';
  END IF;
  IF (p_nueva_fecha + p_nueva_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: mover una salida a un día bloqueado del paseador rebota.
  IF _prestador_bloqueado(v_cita.prestador_id, p_nueva_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_cita.prestador_id::text || ':' || p_nueva_fecha::text, 0)
  );

  -- V0-actor: la persona de la cita viaja con ella.
  v_emp := v_cita.empleado_id;
  IF v_emp IS NULL THEN
    SELECT pe.id INTO v_emp FROM prestador_empleados pe
    WHERE pe.prestador_id = v_cita.prestador_id AND pe.rol = 'dueño' AND pe.activo
    LIMIT 1;
  END IF;
  IF v_emp IS NULL THEN
    RAISE EXCEPTION 'cita_sin_persona' USING ERRCODE = '22023';
  END IF;
  SELECT ts.cupo_techo INTO v_cupo_techo
  FROM tipos_servicio ts WHERE ts.codigo = v_cita.tipo_servicio;

  SELECT LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
  INTO v_capacidad
  FROM prestador_horarios h
  WHERE h.prestador_id = v_cita.prestador_id
    AND h.empleado_id = v_emp
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = v_susc.prestador_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_capacidad IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- D-349: la propia cita no se cuenta como ocupante de su ventana vieja.
  v_ocupados := _agenda_ocupacion(v_emp, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos, p_cita_id, v_cita.tipo_servicio);
  IF v_ocupados >= v_capacidad THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
  SET fecha = p_nueva_fecha,
      hora = p_nueva_hora,
      empleado_id = COALESCE(empleado_id, v_emp),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'reagendada_de', jsonb_build_object('fecha', v_cita.fecha, 'hora', v_cita.hora),
        'reagendada_en', now()
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  UPDATE eventos_mascota
  SET fecha_evento = (p_nueva_fecha + p_nueva_hora)
  WHERE id = v_cita.evento_id;

  RETURN jsonb_build_object(
    'ok', true, 'cita_id', p_cita_id,
    'fecha', p_nueva_fecha, 'hora', p_nueva_hora
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.iniciar_atencion_paseo(p_cita_id uuid, p_empleado_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth_uid        uuid := auth.uid();
  v_now             timestamptz := now();
  v_cita_existe     boolean;
  v_cita_estado     text;
  v_cita_fecha      date;
  v_cita_evento_id  uuid;
  v_cita_empleado   uuid;
  v_mascota_id      uuid;
  v_prestador_id    uuid;
  v_country_code    text;
  v_tipo_servicio   text;
  v_categoria       text;
  v_eje_jtbd        text;
  v_evento_hijo_id  uuid;
  v_atencion_id     uuid;
  v_paseo_id        uuid;
  v_persona         uuid;   -- V0-actor
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN
    RAISE EXCEPTION 'cita_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT true, ecs.estado, ecs.fecha, ecs.evento_id, ecs.empleado_id, ecs.mascota_id, ecs.prestador_id,
         ecs.country_code, ecs.tipo_servicio, ts.categoria
  INTO v_cita_existe, v_cita_estado, v_cita_fecha, v_cita_evento_id, v_cita_empleado, v_mascota_id, v_prestador_id,
       v_country_code, v_tipo_servicio, v_categoria
  FROM evento_cita_servicio ecs
  JOIN tipos_servicio ts ON ts.codigo = ecs.tipo_servicio
  WHERE ecs.id = p_cita_id;

  IF v_cita_existe IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_categoria IS DISTINCT FROM 'paseo' THEN
    RAISE EXCEPTION 'cita_no_es_paseo' USING ERRCODE = '22023';
  END IF;
  IF v_mascota_id IS NULL OR v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_mascota_o_prestador' USING ERRCODE = '22023';
  END IF;
  IF v_cita_evento_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_evento_padre' USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(v_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF v_cita_estado NOT IN ('confirmada', 'en_curso') THEN
    RAISE EXCEPTION 'cita_estado_invalido_para_iniciar: %', v_cita_estado USING ERRCODE = '22023';
  END IF;
  -- S60-A7: la cita de MAÑANA no se inicia (gate en el MOTOR; tz D-320).
  IF v_cita_fecha > (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RAISE EXCEPTION 'cita_aun_no_ocurre' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM evento_atencion
    WHERE cita_id = p_cita_id AND mascota_id = v_mascota_id
  ) THEN
    RAISE EXCEPTION 'atencion_paseo_ya_existe_para_cita' USING ERRCODE = '23505';
  END IF;

  -- V0-actor: la atención SIEMPRE tiene persona — param explícito >
  -- persona de la cita > titular (empleado_id NOT NULL desde V0).
  v_persona := COALESCE(p_empleado_id, v_cita_empleado);
  IF v_persona IS NULL THEN
    SELECT pe.id INTO v_persona FROM prestador_empleados pe
    WHERE pe.prestador_id = v_prestador_id AND pe.rol = 'dueño' AND pe.activo
    LIMIT 1;
  END IF;
  IF v_persona IS NULL THEN
    RAISE EXCEPTION 'atencion_sin_persona' USING ERRCODE = '22023';
  END IF;

  SELECT eje_jtbd INTO v_eje_jtbd
  FROM cat_tipos_evento WHERE codigo = 'atencion_paseo_registrada';
  IF v_eje_jtbd IS NULL THEN
    RAISE EXCEPTION 'cat_tipos_evento_sin_paseo' USING ERRCODE = '22023';
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, evento_padre_id,
    prestador_id, empleado_id, creado_por_user_id, country_code, datos
  ) VALUES (
    v_mascota_id, 'atencion_paseo_registrada', v_eje_jtbd, v_now, v_cita_evento_id,
    v_prestador_id, v_persona, v_auth_uid, v_country_code,
    jsonb_build_object('cita_id', p_cita_id)
  )
  RETURNING id INTO v_evento_hijo_id;

  INSERT INTO evento_atencion (
    evento_id, cita_id, familia, mascota_id, prestador_id, empleado_id,
    country_code, estado, iniciada_en
  ) VALUES (
    v_evento_hijo_id, p_cita_id, 'paseo', v_mascota_id, v_prestador_id, v_persona,
    v_country_code, 'en_curso', v_now
  )
  RETURNING id INTO v_atencion_id;

  INSERT INTO eventos_mascota_paseo (
    evento_atencion_id, mascota_id, prestador_id, empleado_id, country_code
  ) VALUES (
    v_atencion_id, v_mascota_id, v_prestador_id, v_persona, v_country_code
  )
  RETURNING id INTO v_paseo_id;

  UPDATE evento_cita_servicio
  SET estado = 'en_curso'
  WHERE id = p_cita_id AND estado = 'confirmada';

  RETURN jsonb_build_object(
    'ok', true,
    'paseo_id', v_paseo_id,
    'evento_atencion_id', v_atencion_id,
    'evento_id', v_evento_hijo_id,
    'cita_id', p_cita_id,
    'estado', 'en_curso'
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.iniciar_atencion_grooming(p_cita_id uuid, p_empleado_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth_uid        uuid := auth.uid();
  v_now             timestamptz := now();
  v_cita_existe     boolean;
  v_cita_estado     text;
  v_cita_fecha      date;
  v_cita_evento_id  uuid;
  v_cita_empleado   uuid;
  v_mascota_id      uuid;
  v_prestador_id    uuid;
  v_country_code    text;
  v_tipo_servicio   text;
  v_categoria       text;
  v_eje_jtbd        text;
  v_evento_hijo_id  uuid;
  v_atencion_id     uuid;
  v_grooming_id     uuid;
  v_persona         uuid;   -- V0-actor
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN
    RAISE EXCEPTION 'cita_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT true, ecs.estado, ecs.fecha, ecs.evento_id, ecs.empleado_id, ecs.mascota_id, ecs.prestador_id,
         ecs.country_code, ecs.tipo_servicio, ts.categoria
  INTO v_cita_existe, v_cita_estado, v_cita_fecha, v_cita_evento_id, v_cita_empleado, v_mascota_id, v_prestador_id,
       v_country_code, v_tipo_servicio, v_categoria
  FROM evento_cita_servicio ecs
  JOIN tipos_servicio ts ON ts.codigo = ecs.tipo_servicio
  WHERE ecs.id = p_cita_id;

  IF v_cita_existe IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_categoria IS DISTINCT FROM 'grooming' THEN
    RAISE EXCEPTION 'cita_no_es_grooming' USING ERRCODE = '22023';
  END IF;
  IF v_mascota_id IS NULL OR v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_mascota_o_prestador' USING ERRCODE = '22023';
  END IF;
  IF v_cita_evento_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_evento_padre' USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(v_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF v_cita_estado NOT IN ('confirmada', 'en_curso') THEN
    RAISE EXCEPTION 'cita_estado_invalido_para_iniciar: %', v_cita_estado USING ERRCODE = '22023';
  END IF;
  -- S60-A7: espejo EXACTO del gate del paseo (precedente S57 + D-320).
  IF v_cita_fecha > (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RAISE EXCEPTION 'cita_aun_no_ocurre' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM evento_atencion
    WHERE cita_id = p_cita_id AND mascota_id = v_mascota_id
  ) THEN
    RAISE EXCEPTION 'atencion_grooming_ya_existe_para_cita' USING ERRCODE = '23505';
  END IF;

  -- V0-actor: la atención SIEMPRE tiene persona.
  v_persona := COALESCE(p_empleado_id, v_cita_empleado);
  IF v_persona IS NULL THEN
    SELECT pe.id INTO v_persona FROM prestador_empleados pe
    WHERE pe.prestador_id = v_prestador_id AND pe.rol = 'dueño' AND pe.activo
    LIMIT 1;
  END IF;
  IF v_persona IS NULL THEN
    RAISE EXCEPTION 'atencion_sin_persona' USING ERRCODE = '22023';
  END IF;

  SELECT eje_jtbd INTO v_eje_jtbd
  FROM cat_tipos_evento WHERE codigo = 'atencion_grooming_registrada';
  IF v_eje_jtbd IS NULL THEN
    RAISE EXCEPTION 'cat_tipos_evento_sin_grooming' USING ERRCODE = '22023';
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, evento_padre_id,
    prestador_id, empleado_id, creado_por_user_id, country_code, datos
  ) VALUES (
    v_mascota_id, 'atencion_grooming_registrada', v_eje_jtbd, v_now, v_cita_evento_id,
    v_prestador_id, v_persona, v_auth_uid, v_country_code,
    jsonb_build_object('cita_id', p_cita_id)
  )
  RETURNING id INTO v_evento_hijo_id;

  INSERT INTO evento_atencion (
    evento_id, cita_id, familia, mascota_id, prestador_id, empleado_id,
    country_code, estado, iniciada_en
  ) VALUES (
    v_evento_hijo_id, p_cita_id, 'grooming', v_mascota_id, v_prestador_id, v_persona,
    v_country_code, 'en_curso', v_now
  )
  RETURNING id INTO v_atencion_id;

  INSERT INTO eventos_mascota_grooming (
    evento_atencion_id, mascota_id, prestador_id, empleado_id, country_code
  ) VALUES (
    v_atencion_id, v_mascota_id, v_prestador_id, v_persona, v_country_code
  )
  RETURNING id INTO v_grooming_id;

  UPDATE evento_cita_servicio
  SET estado = 'en_curso'
  WHERE id = p_cita_id AND estado = 'confirmada';

  RETURN jsonb_build_object(
    'ok', true,
    'grooming_id', v_grooming_id,
    'evento_atencion_id', v_atencion_id,
    'evento_id', v_evento_hijo_id,
    'cita_id', p_cita_id,
    'estado', 'en_curso'
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.iniciar_atencion_adiestramiento(p_cita_id uuid, p_empleado_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth_uid        uuid := auth.uid();
  v_now             timestamptz := now();
  v_cita_existe     boolean;
  v_cita_estado     text;
  v_cita_fecha      date;
  v_cita_evento_id  uuid;
  v_cita_empleado   uuid;
  v_mascota_id      uuid;
  v_prestador_id    uuid;
  v_country_code    text;
  v_categoria       text;
  v_eje_jtbd        text;
  v_evento_hijo_id  uuid;
  v_atencion_id     uuid;
  v_adiestramiento  uuid;
  v_persona         uuid;   -- V0-actor
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN
    RAISE EXCEPTION 'cita_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT true, ecs.estado, ecs.fecha, ecs.evento_id, ecs.empleado_id, ecs.mascota_id, ecs.prestador_id,
         ecs.country_code, ts.categoria
  INTO v_cita_existe, v_cita_estado, v_cita_fecha, v_cita_evento_id, v_cita_empleado, v_mascota_id, v_prestador_id,
       v_country_code, v_categoria
  FROM evento_cita_servicio ecs
  JOIN tipos_servicio ts ON ts.codigo = ecs.tipo_servicio
  WHERE ecs.id = p_cita_id;

  IF v_cita_existe IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_categoria IS DISTINCT FROM 'adiestramiento' THEN
    RAISE EXCEPTION 'cita_no_es_adiestramiento' USING ERRCODE = '22023';
  END IF;
  IF v_mascota_id IS NULL OR v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_mascota_o_prestador' USING ERRCODE = '22023';
  END IF;
  IF v_cita_evento_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_evento_padre' USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(v_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF v_cita_estado NOT IN ('confirmada', 'en_curso') THEN
    RAISE EXCEPTION 'cita_estado_invalido_para_iniciar: %', v_cita_estado USING ERRCODE = '22023';
  END IF;
  -- Gate temporal (espejo EXACTO paseo/grooming, precedente S57 + D-320).
  IF v_cita_fecha > (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RAISE EXCEPTION 'cita_aun_no_ocurre' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM evento_atencion
    WHERE cita_id = p_cita_id AND mascota_id = v_mascota_id
  ) THEN
    RAISE EXCEPTION 'atencion_adiestramiento_ya_existe_para_cita' USING ERRCODE = '23505';
  END IF;

  -- V0-actor: la atención SIEMPRE tiene persona.
  v_persona := COALESCE(p_empleado_id, v_cita_empleado);
  IF v_persona IS NULL THEN
    SELECT pe.id INTO v_persona FROM prestador_empleados pe
    WHERE pe.prestador_id = v_prestador_id AND pe.rol = 'dueño' AND pe.activo
    LIMIT 1;
  END IF;
  IF v_persona IS NULL THEN
    RAISE EXCEPTION 'atencion_sin_persona' USING ERRCODE = '22023';
  END IF;

  SELECT eje_jtbd INTO v_eje_jtbd
  FROM cat_tipos_evento WHERE codigo = 'atencion_adiestramiento_registrada';
  IF v_eje_jtbd IS NULL THEN
    RAISE EXCEPTION 'cat_tipos_evento_sin_adiestramiento' USING ERRCODE = '22023';
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, evento_padre_id,
    prestador_id, empleado_id, creado_por_user_id, country_code, datos
  ) VALUES (
    v_mascota_id, 'atencion_adiestramiento_registrada', v_eje_jtbd, v_now, v_cita_evento_id,
    v_prestador_id, v_persona, v_auth_uid, v_country_code,
    jsonb_build_object('cita_id', p_cita_id)
  )
  RETURNING id INTO v_evento_hijo_id;

  INSERT INTO evento_atencion (
    evento_id, cita_id, familia, mascota_id, prestador_id, empleado_id,
    country_code, estado, iniciada_en
  ) VALUES (
    v_evento_hijo_id, p_cita_id, 'adiestramiento', v_mascota_id, v_prestador_id, v_persona,
    v_country_code, 'en_curso', v_now
  )
  RETURNING id INTO v_atencion_id;

  INSERT INTO eventos_mascota_adiestramiento (
    evento_atencion_id, mascota_id, prestador_id, empleado_id, country_code
  ) VALUES (
    v_atencion_id, v_mascota_id, v_prestador_id, v_persona, v_country_code
  )
  RETURNING id INTO v_adiestramiento;

  UPDATE evento_cita_servicio
  SET estado = 'en_curso'
  WHERE id = p_cita_id AND estado = 'confirmada';

  RETURN jsonb_build_object(
    'ok', true,
    'adiestramiento_id', v_adiestramiento,
    'evento_atencion_id', v_atencion_id,
    'evento_id', v_evento_hijo_id,
    'cita_id', p_cita_id,
    'estado', 'en_curso'
  );
END;
$fn$;

-- El simulador de citas (test harness) también escribe persona: sus
-- citas firmes ocupan al titular como las productivas. V0-actor.
CREATE OR REPLACE FUNCTION public.simular_cliente_agenda_cita(p_user_id uuid, p_mascota_id uuid, p_prestador_id uuid, p_tipo_servicio text, p_fecha_hora timestamp with time zone, p_session_id uuid DEFAULT gen_random_uuid(), p_modalidad text DEFAULT 'presencial'::text, p_estado text DEFAULT 'confirmada'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_evento_id           uuid;
  v_cita_id             uuid;
  v_country_code        text;
  v_eje_jtbd            text;
  v_visibilidad_default jsonb;
  v_datos_evento        jsonb;
  v_session_prefix      text;
  v_empleado_titular    uuid;   -- V0-actor
BEGIN
  IF NOT test_guard_activo() THEN
    RETURN jsonb_build_object(
      'ok', false,
      'codigo_error', 'GUARD_NO_ACTIVO',
      'mensaje', 'simular_cliente_agenda_cita() requiere SET LOCAL app.testing_mode = on'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'ok', false, 'codigo_error', 'PET_PARENT_NO_EXISTE',
      'mensaje', 'No se encontró profile con id = ' || p_user_id::text
    );
  END IF;

  SELECT country_code INTO v_country_code
  FROM mascotas WHERE id = p_mascota_id;
  IF v_country_code IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false, 'codigo_error', 'MASCOTA_NO_EXISTE',
      'mensaje', 'No se encontró mascota con id = ' || p_mascota_id::text
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores WHERE id = p_prestador_id) THEN
    RETURN jsonb_build_object(
      'ok', false, 'codigo_error', 'PRESTADOR_NO_EXISTE',
      'mensaje', 'No se encontró prestador con id = ' || p_prestador_id::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM prestador_servicios
    WHERE prestador_id = p_prestador_id
      AND tipo_servicio = p_tipo_servicio
      AND activo = true
  ) THEN
    RETURN jsonb_build_object(
      'ok', false, 'codigo_error', 'TIPO_SERVICIO_NO_ACTIVO',
      'mensaje', 'El prestador ' || p_prestador_id::text || ' no tiene activo el servicio ' || p_tipo_servicio
    );
  END IF;

  IF p_modalidad NOT IN ('presencial', 'telemedicina', 'domicilio', 'emergencia_movil') THEN
    RETURN jsonb_build_object(
      'ok', false, 'codigo_error', 'MODALIDAD_INVALIDA',
      'mensaje', 'p_modalidad inválido. Recibido: ' || p_modalidad
    );
  END IF;

  IF p_estado NOT IN ('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_show', 'rechazada') THEN
    RETURN jsonb_build_object(
      'ok', false, 'codigo_error', 'ESTADO_INVALIDO',
      'mensaje', 'p_estado inválido. Recibido: ' || p_estado
    );
  END IF;

  SELECT eje_jtbd, visibilidad_default
  INTO v_eje_jtbd, v_visibilidad_default
  FROM cat_tipos_evento
  WHERE codigo = 'cita_servicio';

  IF v_eje_jtbd IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false, 'codigo_error', 'CATALOGO_CITA_SERVICIO_NO_ENCONTRADO',
      'mensaje', 'cat_tipos_evento no tiene fila para codigo=cita_servicio'
    );
  END IF;

  -- V0-actor: la cita simulada ocupa al titular del prestador.
  SELECT pe.id INTO v_empleado_titular
  FROM prestador_empleados pe
  WHERE pe.prestador_id = p_prestador_id AND pe.rol = 'dueño' AND pe.activo
  LIMIT 1;

  v_session_prefix := substring(p_session_id::text, 1, 8);

  v_datos_evento := jsonb_build_object(
    'test_data', true,
    'session_id', p_session_id,
    'funcion_origen', 'simular_cliente_agenda_cita',
    'tipo_servicio', p_tipo_servicio,
    'modalidad', p_modalidad,
    'tipo', 'TEST CITA ' || v_session_prefix
  );

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje_jtbd, p_fecha_hora, p_prestador_id,
    p_user_id, v_datos_evento, v_visibilidad_default, v_country_code
  )
  RETURNING id INTO v_evento_id;

  PERFORM test_registry_insert(
    'eventos_mascota', v_evento_id, p_session_id,
    'simular_cliente_agenda_cita',
    jsonb_build_object('tipo_servicio', p_tipo_servicio)
  );

  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, estado, estado_reserva, modalidad, country_code
  ) VALUES (
    v_evento_id, p_user_id, p_mascota_id, p_prestador_id, v_empleado_titular, p_tipo_servicio,
    p_fecha_hora::date, p_fecha_hora::time, p_estado, 'pagada',
    p_modalidad, v_country_code
  )
  RETURNING id INTO v_cita_id;

  PERFORM test_registry_insert(
    'evento_cita_servicio', v_cita_id, p_session_id,
    'simular_cliente_agenda_cita',
    jsonb_build_object('estado', p_estado, 'fecha_hora', p_fecha_hora)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'filas_creadas', jsonb_build_array(
      jsonb_build_object('tabla', 'eventos_mascota', 'id', v_evento_id),
      jsonb_build_object('tabla', 'evento_cita_servicio', 'id', v_cita_id)
    ),
    'principal_id', v_cita_id,
    'evento_id', v_evento_id,
    'cita_id', v_cita_id,
    'registry_session_id', p_session_id,
    'nota_log_residual', 'Trigger auto_log_atencion crea fila en prestador_atencion_log con resumen_breve TEST CITA ' || v_session_prefix || '. NO se borra en cleanup (append-only).'
  );
END;
$fn$;

-- L-140 sobre función tocada: el simulador traía EXECUTE para anon
-- PREEXISTENTE (los ACL sobreviven al CREATE OR REPLACE) — muere acá.
-- Su guard test_guard_activo() sigue siendo la puerta funcional.
REVOKE EXECUTE ON FUNCTION public.simular_cliente_agenda_cita(uuid, uuid, uuid, text, timestamptz, uuid, text, text)
  FROM PUBLIC, anon;

-- Cinturón V0: TODO caller vivo de _agenda_ocupacion quedó reescrito al
-- contrato nuevo (marca 'V0-actor' en el body). Una llamada vieja con
-- prestador_id en el primer arg sería un agujero silencioso.
DO $do$
DECLARE v_malos text;
BEGIN
  SELECT string_agg(p.proname, ', ') INTO v_malos
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosrc ~ '_agenda_ocupacion\('
    AND p.prosrc !~ 'V0-actor'
    AND p.proname <> '_agenda_ocupacion';
  IF v_malos IS NOT NULL THEN
    RAISE EXCEPTION 'V0 abort T2: callers de _agenda_ocupacion sin migrar: %', v_malos;
  END IF;
  RAISE NOTICE 'V0 T2: motor generalizado — todos los callers portan el contrato nuevo';
END;
$do$;

-- ═══════════════ TRAMO 4 — PROCEDENCIA + RESEÑAS (§13) ═════════════════

-- El conjunto clínico se DECLARA en el catálogo (el eje 'salud' no
-- alcanza: cita_servicio y emergencia_solicitada son transaccionales).
ALTER TABLE cat_tipos_evento ADD COLUMN es_clinico boolean NOT NULL DEFAULT false;

UPDATE cat_tipos_evento SET es_clinico = true
WHERE codigo IN (
  'alergia_diagnosticada', 'caso_clinico_abierto', 'caso_clinico_cerrado',
  'caso_clinico_consultor_agregado', 'caso_clinico_transferido',
  'cirugia_procedimiento', 'condicion_cronica_diagnosticada',
  'esterilizacion', 'examen_diagnostico', 'historia_clinica_registrada',
  'intervencion_permanente', 'medicacion_administrada',
  'medicacion_prescrita', 'vacuna_aplicada'
);

ALTER TABLE eventos_mascota ADD COLUMN procedencia text
  CONSTRAINT eventos_mascota_procedencia_check
  CHECK (procedencia IN ('declarado_por_familia', 'verificado_por_prestador'));

-- Backfill: TODO lo clínico existente es el carnet de la familia (§13:
-- el único escritor clínico vivo) → declarado_por_familia.
UPDATE eventos_mascota SET procedencia = 'declarado_por_familia'
WHERE procedencia IS NULL
  AND tipo IN (SELECT codigo FROM cat_tipos_evento WHERE es_clinico);

DO $do$
DECLARE v_n int; v_clin int;
BEGIN
  SELECT count(*) INTO v_clin FROM cat_tipos_evento WHERE es_clinico;
  IF v_clin <> 14 THEN
    RAISE EXCEPTION 'V0 abort T4: se esperaban 14 tipos clínicos, hay %', v_clin;
  END IF;
  SELECT count(*) INTO v_n FROM eventos_mascota WHERE procedencia = 'declarado_por_familia';
  RAISE NOTICE 'V0 T4: % eventos clínicos backfilleados a declarado_por_familia', v_n;
  IF EXISTS (
    SELECT 1 FROM eventos_mascota em
    WHERE em.procedencia IS NULL
      AND em.tipo IN (SELECT codigo FROM cat_tipos_evento WHERE es_clinico)
  ) THEN
    RAISE EXCEPTION 'V0 abort T4: quedaron eventos clínicos sin procedencia';
  END IF;
END;
$do$;

-- La puerta única EXIGE procedencia para lo clínico desde hoy.
CREATE FUNCTION public._trg_eventos_procedencia_clinica()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  IF NEW.procedencia IS NULL
     AND EXISTS (SELECT 1 FROM cat_tipos_evento c WHERE c.codigo = NEW.tipo AND c.es_clinico) THEN
    RAISE EXCEPTION 'procedencia_requerida' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public._trg_eventos_procedencia_clinica() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_eventos_procedencia_clinica
BEFORE INSERT ON eventos_mascota
FOR EACH ROW EXECUTE FUNCTION public._trg_eventos_procedencia_clinica();

-- La puerta única de los tipados clínicos estampa la procedencia:
-- HOY el único productor clínico es el carnet/registro de la familia;
-- 'verificado_por_prestador' queda TIPADO SIN PRODUCTOR hasta la
-- verificación del vet (§14.2) — cuando exista, esta puerta gana el
-- parámetro explícito (jamás un default silencioso para verificado).
CREATE OR REPLACE FUNCTION public._crear_evento_padre_auto(p_mascota_id uuid, p_tipo text, p_eje_jtbd text, p_fecha_evento timestamp with time zone, p_prestador_id uuid, p_empleado_id uuid, p_creado_por_user_id uuid, p_creado_por_sistema text, p_country_code text, p_datos jsonb)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_evento_id uuid;
BEGIN
  -- Validar al menos un origen (CHECK de eventos_mascota lo exige)
  IF p_creado_por_user_id IS NULL AND p_creado_por_sistema IS NULL THEN
    RAISE EXCEPTION '_crear_evento_padre_auto: debe pasarse creado_por_user_id O creado_por_sistema';
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento,
    prestador_id, empleado_id,
    creado_por_user_id, creado_por_sistema,
    country_code, datos, procedencia
  ) VALUES (
    p_mascota_id, p_tipo, p_eje_jtbd, p_fecha_evento,
    p_prestador_id, p_empleado_id,
    p_creado_por_user_id, p_creado_por_sistema,
    p_country_code, COALESCE(p_datos, '{}'::jsonb),
    CASE WHEN EXISTS (SELECT 1 FROM cat_tipos_evento c WHERE c.codigo = p_tipo AND c.es_clinico)
         THEN 'declarado_por_familia' ELSE NULL END
  )
  RETURNING id INTO v_evento_id;

  RETURN v_evento_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public._crear_evento_padre_auto(uuid, text, text, timestamptz, uuid, uuid, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- Reputación de dos capas (§4): la reseña gana la persona ejecutante.
ALTER TABLE prestador_resenas
  ADD COLUMN empleado_id uuid REFERENCES prestador_empleados(id) ON DELETE SET NULL;

DO $do$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM prestador_resenas;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'V0 abort T4: prestador_resenas tiene % filas (se esperaban 0 — cero backfill)', v_n;
  END IF;
  RAISE NOTICE 'V0 T4: prestador_resenas.empleado_id creada sobre 0 filas';
END;
$do$;

-- ═══════════════ TRAMO 5 — LAS CURAS Y EL CATÁLOGO ═════════════════════

-- D-414 🔴: caso_clinico_insert_vet gana la validación cuenta↔mascota —
-- el vet solo abre caso sobre mascota a la que su cuenta tiene acceso
-- vigente (mascota_acceso_prestador, la misma puerta que el resto).
DROP POLICY "caso_clinico_insert_vet" ON public.caso_clinico;
CREATE POLICY "caso_clinico_insert_vet" ON public.caso_clinico
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM cuentas_comerciales cco
    WHERE cco.id = caso_clinico.cuenta_comercial_tratante_id
      AND (cco.owner_profile_id = auth.uid()
           OR EXISTS (
             SELECT 1
             FROM prestador_empleados pe
             JOIN prestadores p ON p.id = pe.prestador_id
             WHERE p.cuenta_comercial_id = caso_clinico.cuenta_comercial_tratante_id
               AND pe.user_id = auth.uid()
               AND pe.activo = true
           ))
  ))
  AND EXISTS (
    SELECT 1
    FROM mascota_acceso_prestador map
    WHERE map.mascota_id = caso_clinico.mascota_id
      AND map.cuenta_comercial_id = caso_clinico.cuenta_comercial_tratante_id
      AND map.revocado_en IS NULL
      AND (map.expira_en IS NULL OR map.expira_en > now())
  )
);

-- D-418: requiere_resultado=false honesto en los 11 médicos (L-139 —
-- un true sin mecanismo es un verosímil-falso).
DO $do$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM tipos_servicio WHERE requiere_resultado = false;
  IF v_n <> 1 OR NOT EXISTS (SELECT 1 FROM tipos_servicio WHERE codigo = 'registro_evento' AND requiere_resultado = false) THEN
    RAISE EXCEPTION 'V0 abort T5: el estado previo de requiere_resultado no es el relevado (único false = registro_evento)';
  END IF;
  SELECT count(*) INTO v_n FROM tipos_servicio WHERE es_medico IS TRUE;
  IF v_n <> 11 THEN
    RAISE EXCEPTION 'V0 abort T5: se esperaban 11 tipos médicos, hay %', v_n;
  END IF;
END;
$do$;

UPDATE tipos_servicio SET requiere_resultado = false WHERE es_medico IS TRUE;

-- D-424: techo de especies del vet = TODAS las del catálogo (las 11,
-- decisión D7 firmada — no solo las 6 activas). Cada negocio acota con
-- especies_compatibles.
UPDATE tipos_servicio
SET especies_elegibles = (SELECT jsonb_agg(ce.codigo ORDER BY ce.orden_display) FROM cat_especies ce)
WHERE es_medico IS TRUE;

DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tipos_servicio
    WHERE es_medico IS TRUE
      AND (especies_elegibles IS NULL
           OR jsonb_array_length(especies_elegibles) <> (SELECT count(*) FROM cat_especies))
  ) THEN
    RAISE EXCEPTION 'V0 abort T5: D-424 incompleta — hay tipo médico sin el techo completo de especies';
  END IF;
  RAISE NOTICE 'V0 T5: D-418 apagada honesta y D-424 muerta (11 médicos × % especies)',
    (SELECT count(*) FROM cat_especies);
END;
$do$;

-- Vacunas EC (§12): catálogo mínimo alineado con el ÚNICO escritor
-- clínico vivo — el vocabulario CERRADO de extract-vacuna v21. Seeds
-- preliminares (§10.3: la validación veterinaria real los desmarca).
-- El texto libre del carnet SIGUE LEGAL: el catálogo es declarativo,
-- sin FK desde evento_vacuna_aplicada.
CREATE TABLE public.cat_vacunas (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  especies jsonb NOT NULL,
  es_seed_preliminar boolean NOT NULL DEFAULT true,
  activo boolean NOT NULL DEFAULT true,
  country_codes jsonb NOT NULL DEFAULT '["EC"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cat_vacunas ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_vacunas_select_publica ON public.cat_vacunas FOR SELECT USING (true);

INSERT INTO public.cat_vacunas (codigo, nombre, especies) VALUES
  ('antirrabica',      'antirrábica',          '["perro","gato"]'::jsonb),
  ('multiple',         'múltiple',             '["perro"]'::jsonb),
  ('tos_perreras',     'tos de las perreras',  '["perro"]'::jsonb),
  ('leptospirosis',    'leptospirosis',        '["perro"]'::jsonb),
  ('giardia',          'giardia',              '["perro","gato"]'::jsonb),
  ('triple_felina',    'triple felina',        '["gato"]'::jsonb),
  ('leucemia_felina',  'leucemia felina',      '["gato"]'::jsonb);

-- D-415 absorbida — parte 1: los 8 códigos fantasma dejan de mentir
-- (NULL honesto; sus tablas no existen y esta migración NO las crea).
DO $do$
DECLARE v_n int;
BEGIN
  UPDATE cat_tipos_evento SET tabla_tipada = NULL
  WHERE codigo IN ('certificado_revocado', 'incidente_hotel', 'incidente_paseo',
                   'inicio_vida', 'nota_dueno', 'nota_prestador',
                   'producto_asignacion', 'wearable_alerta');
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 8 THEN
    RAISE EXCEPTION 'V0 abort T5: se esperaban 8 códigos fantasma, se tocaron %', v_n;
  END IF;
  RAISE NOTICE 'V0 T5: 8 tabla_tipada fantasma a NULL honesto';
END;
$do$;

-- D-415 — parte 2: nacen SOLO las 3 tablas de caso que esta migración
-- escribe (forma v1 de §10: doble referencia clínica=cuenta + dr=persona).
CREATE TABLE public.evento_caso_clinico_abierto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos_mascota(id) ON DELETE RESTRICT,
  caso_id uuid NOT NULL REFERENCES public.caso_clinico(id) ON DELETE RESTRICT,
  mascota_id uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  empleado_id uuid REFERENCES public.prestador_empleados(id) ON DELETE SET NULL,
  condicion text,
  country_code text NOT NULL DEFAULT 'EC',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.evento_caso_clinico_cerrado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos_mascota(id) ON DELETE RESTRICT,
  caso_id uuid NOT NULL REFERENCES public.caso_clinico(id) ON DELETE RESTRICT,
  mascota_id uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  empleado_id uuid REFERENCES public.prestador_empleados(id) ON DELETE SET NULL,
  motivo_cierre text,
  country_code text NOT NULL DEFAULT 'EC',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.evento_caso_clinico_transferido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos_mascota(id) ON DELETE RESTRICT,
  caso_id uuid NOT NULL REFERENCES public.caso_clinico(id) ON DELETE RESTRICT,
  mascota_id uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  cuenta_comercial_origen_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  cuenta_comercial_destino_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  empleado_destino_id uuid REFERENCES public.prestador_empleados(id) ON DELETE SET NULL,
  motivo text,
  country_code text NOT NULL DEFAULT 'EC',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: lectura por acceso a la mascota + admin; SIN policies de
-- escritura — los escritores serán RPCs DEFINER de la tanda V4 (§17).
ALTER TABLE public.evento_caso_clinico_abierto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_caso_clinico_cerrado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_caso_clinico_transferido ENABLE ROW LEVEL SECURITY;
CREATE POLICY caso_abierto_select ON public.evento_caso_clinico_abierto
  FOR SELECT USING (user_tiene_acceso_a_mascota(mascota_id) OR is_admin());
CREATE POLICY caso_cerrado_select ON public.evento_caso_clinico_cerrado
  FOR SELECT USING (user_tiene_acceso_a_mascota(mascota_id) OR is_admin());
CREATE POLICY caso_transferido_select ON public.evento_caso_clinico_transferido
  FOR SELECT USING (user_tiene_acceso_a_mascota(mascota_id) OR is_admin());

UPDATE cat_tipos_evento SET tabla_tipada = 'evento_caso_clinico_abierto'      WHERE codigo = 'caso_clinico_abierto';
UPDATE cat_tipos_evento SET tabla_tipada = 'evento_caso_clinico_cerrado'      WHERE codigo = 'caso_clinico_cerrado';
UPDATE cat_tipos_evento SET tabla_tipada = 'evento_caso_clinico_transferido'  WHERE codigo = 'caso_clinico_transferido';

-- D-415 — parte 3: el guard nace y corre ACÁ MISMO como assert.
CREATE OR REPLACE FUNCTION public.verificar_coherencia_tablas_tipadas()
RETURNS TABLE(codigo text, tabla_tipada text, problema text)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $fn$
  SELECT cte.codigo, cte.tabla_tipada, 'tabla_inexistente'::text
  FROM cat_tipos_evento cte
  WHERE cte.tabla_tipada IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = cte.tabla_tipada AND c.relkind = 'r'
    )
  UNION ALL
  -- El ancla legal es evento_id O evento_atencion_id (el chasis de
  -- atención de tres capas ancla su detalle de oficio en la capa).
  SELECT cte.codigo, cte.tabla_tipada, 'sin_ancla_a_evento'::text
  FROM cat_tipos_evento cte
  WHERE cte.tabla_tipada IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = cte.tabla_tipada AND c.relkind = 'r'
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns col
      WHERE col.table_schema = 'public'
        AND col.table_name = cte.tabla_tipada
        AND col.column_name IN ('evento_id', 'evento_atencion_id')
    );
$fn$;
REVOKE ALL ON FUNCTION public.verificar_coherencia_tablas_tipadas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verificar_coherencia_tablas_tipadas() TO authenticated;

DO $do$
DECLARE r record; v_n int := 0;
BEGIN
  FOR r IN SELECT * FROM verificar_coherencia_tablas_tipadas() LOOP
    v_n := v_n + 1;
    RAISE NOTICE 'V0 T5 D-415 incoherencia: % → % (%)', r.codigo, r.tabla_tipada, r.problema;
  END LOOP;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'V0 abort T5: verificar_coherencia_tablas_tipadas() encontró % incoherencias', v_n;
  END IF;
  RAISE NOTICE 'V0 T5: coherencia tabla_tipada ↔ schema real: LIMPIA (el copy-paste murió)';
END;
$do$;

-- ═══════════════ T6.post — EL JUEZ (misma transacción, mismo now()) ════

CREATE TEMP TABLE _v0_despues_inicios (oficio text, hora time);
CREATE TEMP TABLE _v0_despues_quien  (fn text, fila jsonb);
CREATE TEMP TABLE _v0_despues_slots  (servicio text, fecha date, hora time, cupos int);

INSERT INTO _v0_despues_inicios SELECT 'paseo30', i.hora FROM obtener_inicios_paseo_disponibles('2026-07-24', 30) i;
INSERT INTO _v0_despues_inicios SELECT 'paseo60', i.hora FROM obtener_inicios_paseo_disponibles('2026-07-24', 60) i;
INSERT INTO _v0_despues_inicios SELECT 'grooming', i.hora FROM obtener_inicios_grooming_disponibles('2026-07-24', 'grooming', 'a3332037-c487-45c1-875f-83caf342f59e', 'local') i;
INSERT INTO _v0_despues_inicios SELECT 'adiestramiento', i.hora FROM obtener_inicios_adiestramiento_disponibles('2026-07-24', 'a3332037-c487-45c1-875f-83caf342f59e', NULL) i;

INSERT INTO _v0_despues_quien SELECT 'paseadores30', to_jsonb(t) FROM obtener_paseadores_disponibles('2026-07-24', '10:00', 30) t;
INSERT INTO _v0_despues_quien SELECT 'paseadores60', to_jsonb(t) FROM obtener_paseadores_disponibles('2026-07-24', '10:00', 60) t;
INSERT INTO _v0_despues_quien SELECT 'groomers', to_jsonb(t) FROM obtener_groomers_disponibles('2026-07-24', '10:00', 'grooming', 'a3332037-c487-45c1-875f-83caf342f59e', 'local') t;
INSERT INTO _v0_despues_quien SELECT 'groomers_completo', to_jsonb(t) FROM obtener_groomers_disponibles('2026-07-24', '10:00', 'grooming_completo', 'a3332037-c487-45c1-875f-83caf342f59e', 'local') t;
INSERT INTO _v0_despues_quien SELECT 'adiestradores', to_jsonb(t) FROM obtener_adiestradores_disponibles('2026-07-24', '10:00', 'a3332037-c487-45c1-875f-83caf342f59e') t;

INSERT INTO _v0_despues_slots SELECT 'paseo30', s.fecha, s.hora, s.cupos_restantes FROM obtener_slots_disponibles('de300000-0000-4000-8000-0000000000e5', 'de300000-0000-4000-8000-00000000a5e0', '2026-07-20', '2026-07-26') s;
INSERT INTO _v0_despues_slots SELECT 'grooming', s.fecha, s.hora, s.cupos_restantes FROM obtener_slots_disponibles('de300000-0000-4000-8000-0000000000e5', '388fbd60-f4e6-42f1-a265-d10ff799da7a', '2026-07-20', '2026-07-26') s;
INSERT INTO _v0_despues_slots SELECT 'adiestramiento', s.fecha, s.hora, s.cupos_restantes FROM obtener_slots_disponibles('de300000-0000-4000-8000-0000000000e5', '8fc664dd-04ee-41f4-8c47-a0606cc42680', '2026-07-20', '2026-07-26') s;

-- LA PRUEBA REINA (Opción 1 firmada): identidad con whitelist COMPUTADA.
DO $do$
DECLARE
  r record;
  v_dur int;
  v_n int;
BEGIN
  -- ── QUIÉN a las 10:00: identidad ESTRICTA (multiset, ambas puntas) ──
  SELECT count(*) INTO v_n FROM (
    (SELECT fn, fila FROM _v0_antes_quien EXCEPT ALL SELECT fn, fila FROM _v0_despues_quien)
    UNION ALL
    (SELECT fn, fila FROM _v0_despues_quien EXCEPT ALL SELECT fn, fila FROM _v0_antes_quien)
  ) d;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'V0 juez: el QUIÉN a las 10:00 NO es idéntico (% filas de diferencia)', v_n;
  END IF;

  -- ── INICIOS: jamás aparece un inicio nuevo ──────────────────────────
  IF EXISTS (
    SELECT 1 FROM _v0_despues_inicios d
    WHERE NOT EXISTS (SELECT 1 FROM _v0_antes_inicios a WHERE a.oficio = d.oficio AND a.hora = d.hora)
  ) THEN
    RAISE EXCEPTION 'V0 juez: aparecieron inicios que el motor viejo no ofertaba (prohibido)';
  END IF;

  -- ── INICIOS: todo faltante debe solapar una EXCLUSIVA FIRME (whitelist i)
  FOR r IN
    SELECT a.oficio, a.hora FROM _v0_antes_inicios a
    WHERE NOT EXISTS (SELECT 1 FROM _v0_despues_inicios d WHERE d.oficio = a.oficio AND d.hora = a.hora)
  LOOP
    v_dur := CASE r.oficio WHEN 'paseo30' THEN 30 ELSE 60 END;
    IF NOT EXISTS (
      SELECT 1
      FROM evento_cita_servicio c
      JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio
      WHERE c.prestador_id = 'de300000-0000-4000-8000-0000000000e5'
        AND c.fecha = '2026-07-24'
        AND c.estado IN ('confirmada', 'en_curso')
        AND ts.concurrencia = 'exclusiva'
        AND EXTRACT(EPOCH FROM c.hora)::int < EXTRACT(EPOCH FROM r.hora)::int + v_dur * 60
        AND EXTRACT(EPOCH FROM c.hora)::int + c.duracion_minutos * 60 > EXTRACT(EPOCH FROM r.hora)::int
    ) THEN
      RAISE EXCEPTION 'V0 juez: el inicio %/% desapareció SIN justificación de exclusiva firme', r.oficio, r.hora;
    END IF;
    RAISE NOTICE 'V0 juez whitelist(i): inicio %/% cerrado por exclusiva firme (el agujero de ayer)', r.oficio, r.hora;
  END LOOP;

  -- ── SLOTS: jamás aparece un slot nuevo ──────────────────────────────
  IF EXISTS (
    SELECT 1 FROM _v0_despues_slots d
    WHERE NOT EXISTS (SELECT 1 FROM _v0_antes_slots a
                      WHERE a.servicio = d.servicio AND a.fecha = d.fecha AND a.hora = d.hora)
  ) THEN
    RAISE EXCEPTION 'V0 juez: aparecieron slots que el motor viejo no ofertaba (prohibido)';
  END IF;

  -- ── SLOTS: faltantes justificados por exclusiva firme (whitelist i) ─
  FOR r IN
    SELECT a.servicio, a.fecha, a.hora FROM _v0_antes_slots a
    WHERE NOT EXISTS (SELECT 1 FROM _v0_despues_slots d
                      WHERE d.servicio = a.servicio AND d.fecha = a.fecha AND d.hora = a.hora)
  LOOP
    v_dur := CASE r.servicio WHEN 'paseo30' THEN 30 ELSE 60 END;
    IF NOT EXISTS (
      SELECT 1
      FROM evento_cita_servicio c
      JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio
      WHERE c.prestador_id = 'de300000-0000-4000-8000-0000000000e5'
        AND c.fecha = r.fecha
        AND c.estado IN ('confirmada', 'en_curso')
        AND ts.concurrencia = 'exclusiva'
        AND EXTRACT(EPOCH FROM c.hora)::int < EXTRACT(EPOCH FROM r.hora)::int + v_dur * 60
        AND EXTRACT(EPOCH FROM c.hora)::int + c.duracion_minutos * 60 > EXTRACT(EPOCH FROM r.hora)::int
    ) THEN
      RAISE EXCEPTION 'V0 juez: el slot %/%/% desapareció SIN justificación de exclusiva firme', r.servicio, r.fecha, r.hora;
    END IF;
    RAISE NOTICE 'V0 juez whitelist(i): slot %/%/% cerrado por exclusiva firme', r.servicio, r.fecha, r.hora;
  END LOOP;

  -- ── SLOTS comunes: paseo IDÉNTICO byte a byte; exclusivas recortadas
  --    a exactamente 1 desde un valor >= 1 (whitelist ii) ──────────────
  FOR r IN
    SELECT a.servicio, a.fecha, a.hora, a.cupos AS antes, d.cupos AS despues
    FROM _v0_antes_slots a
    JOIN _v0_despues_slots d
      ON d.servicio = a.servicio AND d.fecha = a.fecha AND d.hora = a.hora
  LOOP
    IF r.servicio = 'paseo30' THEN
      IF r.despues <> r.antes THEN
        RAISE EXCEPTION 'V0 juez: cupos del paseo divergen en %/% (antes=%, después=%) — min(franja, techo 4) debía colapsar exacto',
          r.fecha, r.hora, r.antes, r.despues;
      END IF;
    ELSE
      IF NOT (r.despues = 1 AND r.antes >= 1) THEN
        RAISE EXCEPTION 'V0 juez: cupos de exclusiva fuera de la whitelist(ii) en %/%/% (antes=%, después=%)',
          r.servicio, r.fecha, r.hora, r.antes, r.despues;
      END IF;
    END IF;
  END LOOP;

  -- ── EL FIXTURE CONSAGRADO: el agujero del 23-24/07 quedó CERRADO ────
  IF EXISTS (SELECT 1 FROM _v0_despues_inicios WHERE hora IN ('08:00', '08:30')) THEN
    RAISE EXCEPTION 'V0 juez FIXTURE: 08:00/08:30 del 24/07 siguen ofertados — el doble-booking del titular NO se cerró';
  END IF;
  IF EXISTS (
    SELECT 1 FROM _v0_despues_slots
    WHERE fecha IN ('2026-07-23', '2026-07-24') AND hora IN ('08:00', '08:30')
  ) THEN
    RAISE EXCEPTION 'V0 juez FIXTURE: hay slots 08:00/08:30 del 23-24/07 ofertados — el agujero sigue abierto';
  END IF;
  RAISE NOTICE 'V0 juez FIXTURE: las horas de las 2 citas exclusivas firmes (23-24/07 08:00-09:00) ya NO se ofertan en ningún oficio';

  -- ── min(franja, techo) gobierna la franja 3/1/4 de Andres ───────────
  IF NOT EXISTS (SELECT 1 FROM _v0_despues_slots WHERE servicio = 'paseo30' AND fecha = '2026-07-26' AND hora = '08:00' AND cupos = 4) THEN
    RAISE EXCEPTION 'V0 juez: domingo 08:00 debía dar cupos=4 (min(4, techo 4))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _v0_despues_slots WHERE servicio = 'paseo30' AND fecha = '2026-07-24' AND hora = '09:00' AND cupos = 3) THEN
    RAISE EXCEPTION 'V0 juez: viernes 09:00 debía dar cupos=3 (min(3, techo 4))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _v0_despues_slots WHERE servicio = 'paseo30' AND fecha = '2026-07-24' AND hora = '15:00' AND cupos = 1) THEN
    RAISE EXCEPTION 'V0 juez: viernes 15:00 debía dar cupos=1 (min(1, techo 4))';
  END IF;

  RAISE NOTICE 'V0 juez: PRUEBA REINA VERDE — identidad modulo ilegalidades-de-ayer, whitelist computada, paseo byte a byte';
END;
$do$;

-- ASSERTS DE COMPORTAMIENTO (sondas con ROLLBACK — residuos 0 probados).
DO $do$
DECLARE
  c_andres   constant uuid := 'de300000-0000-4000-8000-0000000000e5';
  c_paseo30  constant uuid := 'de300000-0000-4000-8000-00000000a5e0';
  c_grooming constant uuid := '388fbd60-f4e6-42f1-a265-d10ff799da7a';
  c_adiestr  constant uuid := '8fc664dd-04ee-41f4-8c47-a0606cc42680';
  c_programa constant uuid := '5e4747c2-7aa6-464f-8f63-27e64eb9c2f9';
  c_zeus     constant uuid := 'a3332037-c487-45c1-875f-83caf342f59e';
  c_thor     constant uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_titular  uuid;
  v_res      jsonb;
  v_cita1    uuid;
  v_cita_s1  uuid;
  v_cita_s2  uuid;
  v_pc       uuid;
  v_hora     time;
  v_ok       boolean;
  r          record;
  v_base_citas int; v_base_eventos int; v_base_aten int; v_base_prog int;
  v_n int;
  v_num numeric;
BEGIN
  SELECT count(*) INTO v_base_citas   FROM evento_cita_servicio;
  SELECT count(*) INTO v_base_eventos FROM eventos_mascota;
  SELECT count(*) INTO v_base_aten    FROM evento_atencion;
  SELECT count(*) INTO v_base_prog    FROM programas_contratados;

  BEGIN  -- ══ sonda: TODO lo de adentro se descarta al final ══
    SELECT pe.id INTO v_titular FROM prestador_empleados pe
    WHERE pe.prestador_id = c_andres AND pe.rol = 'dueño' AND pe.activo;
    IF v_titular IS NULL THEN
      RAISE EXCEPTION 'V0 probe: Andres sin titular';
    END IF;

    -- P1 · PASEO: el hold nace con PERSONA desde el primer segundo.
    v_res := crear_bloqueo_agenda(c_andres, c_paseo30, c_zeus, '2026-07-24', '15:00', NULL);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'V0 probe P1: crear_bloqueo_agenda falló: %', v_res;
    END IF;
    v_cita1 := (v_res->>'cita_id')::uuid;
    SELECT count(*) INTO v_n FROM evento_cita_servicio
    WHERE id = v_cita1 AND empleado_id = v_titular
      AND estado = 'pendiente' AND estado_reserva = 'pendiente_pago'
      AND precio = 6.00 AND duracion_minutos = 30;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'V0 probe P1: el hold no porta persona/snapshot esperados';
    END IF;

    -- P2 · doble-booking bloqueado (franja tarde cupo 1).
    BEGIN
      PERFORM crear_bloqueo_agenda(c_andres, c_paseo30, c_thor, '2026-07-24', '15:00', NULL);
      RAISE EXCEPTION 'V0 probe P2: el doble-booking NO fue bloqueado';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM !~ 'slot_ocupado' THEN RAISE; END IF;
    END;

    -- P3 · GRUPO del mismo servicio con cupo (D-385 legible): dos
    -- paseos comparten el 09:30 (franja mañana cupo 3, techo 4).
    v_res := crear_bloqueo_agenda(c_andres, c_paseo30, c_zeus, '2026-07-24', '09:30', NULL);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'V0 probe P3a: primer paseo del grupo falló: %', v_res;
    END IF;
    v_res := crear_bloqueo_agenda(c_andres, c_paseo30, c_thor, '2026-07-24', '09:30', NULL);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'V0 probe P3b: el cupo NO compartió con su propio servicio: %', v_res;
    END IF;
    SELECT count(*) INTO v_n FROM evento_cita_servicio
    WHERE prestador_id = c_andres AND fecha = '2026-07-24' AND hora = '09:30'
      AND empleado_id = v_titular AND tipo_servicio = 'paseo';
    IF v_n <> 2 THEN
      RAISE EXCEPTION 'V0 probe P3: la salida grupal no quedó legible (esperadas 2 citas del bloque, hay %)', v_n;
    END IF;

    -- P4 · MEZCLA IMPOSIBLE: un adiestramiento sobre el grupo de paseo.
    BEGIN
      PERFORM crear_bloqueo_agenda(c_andres, c_adiestr, c_zeus, '2026-07-24', '09:30', NULL);
      RAISE EXCEPTION 'V0 probe P4: la mezcla de servicios NO fue bloqueada';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM !~ 'slot_ocupado' THEN RAISE; END IF;
    END;

    -- P5 · EXCLUSIVA BLOQUEA TODO: sesión de adiestramiento a las 16:00…
    v_res := crear_bloqueo_agenda(c_andres, c_adiestr, c_zeus, '2026-07-24', '16:00', NULL);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'V0 probe P5a: hold de adiestramiento falló: %', v_res;
    END IF;
    -- …ni un paseo encima…
    BEGIN
      PERFORM crear_bloqueo_agenda(c_andres, c_paseo30, c_thor, '2026-07-24', '16:00', NULL);
      RAISE EXCEPTION 'V0 probe P5b: la exclusiva NO bloqueó al paseo';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM !~ 'slot_ocupado' THEN RAISE; END IF;
    END;
    -- …ni OTRO adiestramiento (exclusiva ⇒ capacidad 1 aun del mismo tipo).
    BEGIN
      PERFORM crear_bloqueo_agenda(c_andres, c_adiestr, c_thor, '2026-07-24', '16:00', NULL);
      RAISE EXCEPTION 'V0 probe P5c: la exclusiva compartió consigo misma';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM !~ 'slot_ocupado' THEN RAISE; END IF;
    END;

    -- P6 · 'pagada' ⟺ confirmar_cita_pagada, intacto sobre el hold P1.
    v_res := confirmar_cita_pagada(v_cita1);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'V0 probe P6: confirmar_cita_pagada falló: %', v_res;
    END IF;
    SELECT count(*) INTO v_n FROM evento_cita_servicio
    WHERE id = v_cita1 AND estado = 'confirmada' AND estado_reserva = 'pagada'
      AND empleado_id = v_titular;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'V0 probe P6: la cita pagada no quedó firme con su persona';
    END IF;

    -- P7 · GROOMING: reserva con duración/precio snapshot por talla
    -- (Zeus talla M, pelaje normal, local ⇒ $8.00 / 60 min).
    v_res := crear_bloqueo_agenda(c_andres, c_grooming, c_zeus, '2026-07-24', '10:30', 'local');
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'V0 probe P7: reserva de grooming falló: %', v_res;
    END IF;
    IF (v_res->>'precio')::numeric <> 8.00 OR (v_res->>'duracion_minutos')::int <> 60 THEN
      RAISE EXCEPTION 'V0 probe P7: snapshot por talla roto (precio=%, dur=%)', v_res->>'precio', v_res->>'duracion_minutos';
    END IF;

    -- P8 · ADIESTRAMIENTO: el programa entero al comprar. Hora libre
    -- común a los 6 sábados (18/07..22/08) Y al domingo 26/07 (para P9).
    v_hora := NULL;
    FOR r IN SELECT unnest(ARRAY['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00']::time[]) AS cand LOOP
      SELECT bool_and(x.ok) INTO v_ok FROM (
        SELECT EXISTS (
          SELECT 1 FROM _inicios_disponibles_prestador(c_andres, c_adiestr, d::date, 60) i
          WHERE i.hora = r.cand
        ) AS ok
        FROM generate_series('2026-07-18'::timestamp, '2026-08-22'::timestamp, interval '7 days') d
      ) x;
      IF v_ok AND EXISTS (
        SELECT 1 FROM _inicios_disponibles_prestador(c_andres, c_adiestr, '2026-07-26'::date, 60) i
        WHERE i.hora = r.cand
      ) THEN
        v_hora := r.cand;
        EXIT;
      END IF;
    END LOOP;
    IF v_hora IS NULL THEN
      RAISE EXCEPTION 'V0 probe P8: sin hora libre común para el programa — a la mesa';
    END IF;
    RAISE NOTICE 'V0 probe P8: hora del programa = %', v_hora;

    v_res := contratar_programa(c_andres, c_adiestr, c_programa, c_zeus, '2026-07-18', v_hora);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'V0 probe P8: contratar_programa falló: %', v_res;
    END IF;
    v_pc := (v_res->>'programa_contratado_id')::uuid;
    SELECT count(*), sum(precio) INTO v_n, v_num
    FROM evento_cita_servicio
    WHERE programa_contratado_id = v_pc
      AND estado = 'confirmada' AND estado_reserva = 'pagada'
      AND empleado_id = v_titular;
    IF v_n <> 6 OR v_num <> 160.00 THEN
      RAISE EXCEPTION 'V0 probe P8: el calendario del programa no cerró (citas=%, suma=%)', v_n, v_num;
    END IF;

    -- P9 · reagenda ENTRE VECINAS (sesión 2 → domingo 26/07).
    SELECT c.id INTO v_cita_s2 FROM evento_cita_servicio c
    WHERE c.programa_contratado_id = v_pc AND c.sesion_numero = 2;
    SELECT c.id INTO v_cita_s1 FROM evento_cita_servicio c
    WHERE c.programa_contratado_id = v_pc AND c.sesion_numero = 1;
    v_res := reagendar_sesion_programa(v_cita_s2, '2026-07-26', v_hora);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'V0 probe P9: reagenda entre vecinas falló: %', v_res;
    END IF;

    -- P10 · orden_programa_violado si salta a la sesión 3.
    BEGIN
      PERFORM reagendar_sesion_programa(v_cita_s2, '2026-08-05', v_hora);
      RAISE EXCEPTION 'V0 probe P10: el orden del programa NO se defendió';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM !~ 'orden_programa_violado' THEN RAISE; END IF;
    END;

    -- P11 · sesion_anterior_abierta en la FUENTE (trigger).
    BEGIN
      UPDATE evento_cita_servicio SET estado = 'completada' WHERE id = v_cita_s2;
      RAISE EXCEPTION 'V0 probe P11: el guard sesion_anterior_abierta NO disparó';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM !~ 'sesion_anterior_abierta' THEN RAISE; END IF;
    END;

    RAISE NOTICE 'V0 probes: P1..P11 VERDES — descartando la sonda (rollback)';
    RAISE EXCEPTION USING errcode = 'P0999', message = 'V0_probe_rollback';
  EXCEPTION WHEN sqlstate 'P0999' THEN
    NULL;  -- descarte deliberado de la sonda
  END;

  -- Residuos 0, probado.
  SELECT count(*) INTO v_n FROM evento_cita_servicio;
  IF v_n <> v_base_citas THEN RAISE EXCEPTION 'V0 probe: residuos en evento_cita_servicio (%→%)', v_base_citas, v_n; END IF;
  SELECT count(*) INTO v_n FROM eventos_mascota;
  IF v_n <> v_base_eventos THEN RAISE EXCEPTION 'V0 probe: residuos en eventos_mascota (%→%)', v_base_eventos, v_n; END IF;
  SELECT count(*) INTO v_n FROM evento_atencion;
  IF v_n <> v_base_aten THEN RAISE EXCEPTION 'V0 probe: residuos en evento_atencion (%→%)', v_base_aten, v_n; END IF;
  SELECT count(*) INTO v_n FROM programas_contratados;
  IF v_n <> v_base_prog THEN RAISE EXCEPTION 'V0 probe: residuos en programas_contratados (%→%)', v_base_prog, v_n; END IF;

  -- Los cierres y confirmar_cita_pagada quedaron INTACTOS (md5).
  IF EXISTS (
    SELECT 1 FROM _v0_md5_intactas m
    JOIN pg_proc p ON p.proname = m.fn
    JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
    WHERE md5(pg_get_functiondef(p.oid)) <> m.firma
  ) THEN
    RAISE EXCEPTION 'V0: un cierre o confirmar_cita_pagada fue tocado — prohibido por la orden';
  END IF;

  RAISE NOTICE 'V0 probes: residuos 0 verificados; cierres y pago intactos por firma md5';
END;
$do$;

-- ═══════════════ L-140 — SONDA PROBATORIA FINAL ════════════════════════
DO $do$
DECLARE
  r record;
  v_malos text := '';
BEGIN
  FOR r IN
    SELECT p.proname, p.proacl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        '_agenda_ocupacion', '_inicios_disponibles_prestador',
        'obtener_inicios_paseo_disponibles', 'obtener_paseadores_disponibles',
        'obtener_slots_disponibles', 'crear_bloqueo_agenda',
        '_generar_citas_programa', '_generar_citas_plan',
        'reservar_salida_paquete', 'reagendar_cita_suelta',
        'reagendar_sesion_programa', 'saltar_cita_plan',
        'iniciar_atencion_paseo', 'iniciar_atencion_grooming',
        'iniciar_atencion_adiestramiento', 'simular_cliente_agenda_cita',
        '_crear_evento_padre_auto', '_trg_eventos_procedencia_clinica',
        'verificar_coherencia_tablas_tipadas'
      )
  LOOP
    RAISE NOTICE 'V0 L-140 proacl %: %', r.proname, r.proacl;
    IF r.proacl::text LIKE '%anon=%' THEN
      v_malos := v_malos || r.proname || ' ';
    END IF;
  END LOOP;
  IF v_malos <> '' THEN
    RAISE EXCEPTION 'V0 abort L-140: anon con EXECUTE en: %', v_malos;
  END IF;
  RAISE NOTICE 'V0 L-140: ninguna función tocada quedó ejecutable por anon';
  RAISE NOTICE 'V0 — FUNDACIÓN DEL MODELO DE ACTOR: COMPLETA. Titular materializado, motor por persona, concurrencia declarada, procedencia clínica, curas D-414/D-415/D-418/D-424, catálogo de vacunas EC, tablas de caso. Juez VERDE.';
END;
$do$;

NOTIFY pgrst, 'reload schema';
