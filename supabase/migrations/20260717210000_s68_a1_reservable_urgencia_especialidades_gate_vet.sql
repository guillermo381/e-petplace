-- ═════════════════════════════════════════════════════════════════════
-- S68-A1 — la capa vet del catálogo y las puertas honestas del motor
--
--   1. `reservable` en DOS niveles (tipos_servicio + prestador_servicios)
--      con semilla honesta: telemedicina (switch país, camino (c)) y
--      emergencia (la promesa 24/7 que no hacemos) nacen NO reservables.
--   2. Tipos nuevos `urgencia_local` (30') y `urgencia_domicilio` (45') —
--      urgencia ≠ emergencia: SOLO se reserva para HOY (tz Guayaquil,
--      espejo del gate temporal S57/S60), dentro del horario declarado.
--      El mecanismo del guard es declarativo (regla 21 — catálogo antes
--      que hardcode): `tipos_servicio.reserva_solo_hoy`.
--   3. Catálogo `cat_especialidades_vet` (6 seeds, bilingüe de nacimiento,
--      es_seed_preliminar=true) + puente `prestador_especialidades`
--      ("Otra" es fila con nombre_libre — JAMÁS inserta al catálogo; la
--      promoción es del admin). D-388: nombre_libre es DATO, no vocabulario.
--   4. PRIMER LECTOR de `requiere_validacion_admin` (§14.2): guard en la
--      activación de ofertas — sin documento profesional APROBADO en
--      prestador_documentos, la oferta de un tipo que lo exige rebota
--      `verificacion_profesional_pendiente`.
--   5. Los 11 lectores de vitrina/slots/hold ganan el filtro
--      `ts.reservable AND ps.reservable` — FIRMAS PÚBLICAS INTACTAS
--      (patrón V0). Hold/slots rebotan tipado `servicio_no_reservable`.
--   6. Lectores V2 del mundo vet del dueño (espejo del patrón grooming,
--      sin talla): `_vet_ofertas_cobrables`, `obtener_oferta_vet`,
--      `obtener_inicios_vet_disponibles`, `obtener_veterinarios_disponibles`
--      — nacen con el filtro reservable y el cinturón solo_hoy.
--
-- 76(g) — declaración de veda: migración ADITIVA sin backfill anclado a
-- datos vivos (columnas nuevas con DEFAULT constante; UPDATEs de semilla
-- a filas de CATÁLOGO con valor constante). La veda rige solo en la
-- ventana de verificación externa (snapshot antes/después de la oferta
-- viva de los oficios), no en este DDL.
--
-- Ley S67 al cierre: verificar_coherencia_tablas_tipadas() en 0 +
-- sonda probatoria L-140 de toda función tocada.
-- ═════════════════════════════════════════════════════════════════════

-- ─── 1 · reservable en DOS niveles + reserva_solo_hoy declarativa ────

ALTER TABLE public.tipos_servicio
  ADD COLUMN reservable boolean NOT NULL DEFAULT true;
ALTER TABLE public.tipos_servicio
  ADD COLUMN reserva_solo_hoy boolean NOT NULL DEFAULT false;
ALTER TABLE public.prestador_servicios
  ADD COLUMN reservable boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.tipos_servicio.reservable IS
  'S68: switch de PLATAFORMA — false = el tipo existe en catálogo/config pero el motor no lo vitrinea ni acepta hold (telemedicina camino (c), emergencia honesta). Se cruza AND con prestador_servicios.reservable.';
COMMENT ON COLUMN public.tipos_servicio.reserva_solo_hoy IS
  'S68: guard same-day declarativo (regla 21) — true = el tipo solo acepta hold/cita con fecha = HOY tz America/Guayaquil (urgencia_*). Error tipado urgencia_solo_hoy en las puertas, jamás en UI sola.';
COMMENT ON COLUMN public.prestador_servicios.reservable IS
  'S68: switch del PRESTADOR — false = la fila es catálogo informativo (nombre+precio en la ficha) sin agenda: fuera de vitrina/slots/hold. Se cruza AND con tipos_servicio.reservable.';

-- Semilla honesta (filas de catálogo, valor constante — sin ancla):
UPDATE public.tipos_servicio SET reservable = false
WHERE codigo IN ('telemedicina', 'emergencia');

-- ─── 2 · tipos urgencia_local / urgencia_domicilio ───────────────────
-- El tipo `emergencia` existente NO se toca ni se reusa.

INSERT INTO public.tipos_servicio
  (codigo, nombre, descripcion, icono, categoria, duracion_default_minutos,
   requiere_historia_clinica, requiere_resultado, es_medico, activo,
   orden_display, country_codes, requiere_validacion_admin,
   especies_elegibles, concurrencia, cupo_techo, reservable, reserva_solo_hoy)
VALUES
  ('urgencia_local', 'Urgencia en clínica',
   'Atención de urgencia el mismo día en el local del veterinario, dentro de su horario declarado. No es emergencia 24/7.',
   '🐾', 'veterinario', 30,
   true, false, true, true,
   6, '["EC"]'::jsonb, true,
   '["perro","gato","conejo","ave","roedor","reptil","pez","huron","cobaya","otro","equino"]'::jsonb,
   'exclusiva', NULL, true, true),
  ('urgencia_domicilio', 'Urgencia a domicilio',
   'Atención de urgencia el mismo día en el hogar de la mascota, dentro del horario declarado del veterinario. No es emergencia 24/7.',
   '🐾', 'veterinario', 45,
   true, false, true, true,
   7, '["EC"]'::jsonb, true,
   '["perro","gato","conejo","ave","roedor","reptil","pez","huron","cobaya","otro","equino"]'::jsonb,
   'exclusiva', NULL, true, true)
ON CONFLICT (codigo) DO NOTHING;

-- El CHECK de prestador_servicios.tipo_servicio gana los dos códigos
-- (lista literal relevada de pg_get_constraintdef, L-109):
ALTER TABLE public.prestador_servicios
  DROP CONSTRAINT prestador_servicios_tipo_servicio_check;
ALTER TABLE public.prestador_servicios
  ADD CONSTRAINT prestador_servicios_tipo_servicio_check
  CHECK (tipo_servicio = ANY (ARRAY[
    'consulta_general'::text, 'vacunacion'::text, 'cirugia'::text,
    'telemedicina'::text, 'emergencia'::text, 'grooming'::text,
    'grooming_completo'::text, 'adiestramiento'::text, 'laboratorio'::text,
    'radiografia'::text, 'ecografia'::text, 'certificado_viaje'::text,
    'certificado_apoyo'::text, 'servicio_exequial'::text,
    'registro_evento'::text, 'vacunacion_internacional'::text,
    'hotel'::text, 'guarderia_mensual'::text, 'guarderia_dia'::text,
    'paseo'::text, 'paseo_paquete'::text, 'paseo_mensual'::text,
    'urgencia_local'::text, 'urgencia_domicilio'::text, 'otro'::text
  ]));

-- ─── 3 · cat_especialidades_vet + prestador_especialidades ───────────

CREATE TABLE public.cat_especialidades_vet (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo             text NOT NULL UNIQUE,
  -- bilingüe de nacimiento (lección D-387/D-388); acá no hay par
  -- voz-de-oficio/voz-de-familia: la especialidad se nombra igual.
  nombre             text NOT NULL,
  nombre_en          text NOT NULL,
  orden_display      integer NOT NULL DEFAULT 0,
  activo             boolean NOT NULL DEFAULT true,
  pais_codigo        text,
  es_seed_preliminar boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.cat_especialidades_vet IS
  'S68: catálogo de especialidades veterinarias. es_seed_preliminar=true hasta validación con veterinario real (§10.3 espejo). La promoción de un nombre_libre del puente al catálogo es del ADMIN, jamás automática.';

ALTER TABLE public.cat_especialidades_vet ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_especialidades_vet_select_authenticated
  ON public.cat_especialidades_vet
  FOR SELECT TO authenticated USING (activo = true OR is_admin());
CREATE POLICY cat_especialidades_vet_admin
  ON public.cat_especialidades_vet
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON public.cat_especialidades_vet TO authenticated;
GRANT ALL ON public.cat_especialidades_vet TO service_role;

INSERT INTO public.cat_especialidades_vet (codigo, nombre, nombre_en, orden_display)
VALUES
  ('dermatologia',            'Dermatología',               'Dermatology',                 1),
  ('traumatologia_ortopedia', 'Traumatología y ortopedia',  'Orthopedics and traumatology', 2),
  ('cardiologia',             'Cardiología',                'Cardiology',                  3),
  ('oftalmologia',            'Oftalmología',               'Ophthalmology',               4),
  ('odontologia',             'Odontología',                'Dentistry',                   5),
  ('medicina_interna',        'Medicina interna',           'Internal medicine',           6)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE public.prestador_especialidades (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id    uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  especialidad_id uuid REFERENCES public.cat_especialidades_vet(id),
  -- "Otra": fila con nombre_libre. Es DATO del prestador (D-388), no
  -- vocabulario — no se traduce ni se promociona sola al catálogo.
  nombre_libre    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_pe_exactamente_una CHECK (
    (especialidad_id IS NOT NULL) <> (nombre_libre IS NOT NULL)
  ),
  CONSTRAINT chk_pe_nombre_libre_no_vacio CHECK (
    nombre_libre IS NULL OR btrim(nombre_libre) <> ''
  ),
  CONSTRAINT prestador_especialidades_unica
    UNIQUE NULLS NOT DISTINCT (prestador_id, especialidad_id, nombre_libre)
);
COMMENT ON TABLE public.prestador_especialidades IS
  'S68: especialidades declaradas del prestador vet. O una fila del catálogo (especialidad_id) O una libre (nombre_libre) — jamás ambas.';

ALTER TABLE public.prestador_especialidades ENABLE ROW LEVEL SECURITY;
-- espejo de la casa (prestador_zonas): el prestador escribe LAS SUYAS,
-- lectura pública de las de prestadores activos.
CREATE POLICY prestador_especialidades_own
  ON public.prestador_especialidades
  FOR ALL TO authenticated
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()) OR is_admin())
  WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY prestador_especialidades_public
  ON public.prestador_especialidades
  FOR SELECT TO authenticated
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE estado = 'activo') OR is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prestador_especialidades TO authenticated;
GRANT ALL ON public.prestador_especialidades TO service_role;

-- ─── 4 · primer lector de requiere_validacion_admin (§14.2) ──────────
-- Guard en la activación de ofertas: activo=true sobre un tipo que exige
-- validación rebota salvo documento profesional APROBADO. El ciclo de
-- aprobación admin YA existe (prestador_documentos + PrestadorDetalle).

CREATE OR REPLACE FUNCTION public._trg_ps_verificacion_profesional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  IF NEW.activo
     AND EXISTS (
       SELECT 1 FROM tipos_servicio ts
       WHERE ts.codigo = NEW.tipo_servicio
         AND ts.requiere_validacion_admin
     )
     AND NOT EXISTS (
       SELECT 1 FROM prestador_documentos d
       WHERE d.prestador_id = NEW.prestador_id
         AND d.tipo IN ('titulo_profesional', 'registro_senescyt')
         AND d.estado = 'aprobado'
     )
  THEN
    RAISE EXCEPTION 'verificacion_profesional_pendiente' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_ps_verificacion_profesional ON public.prestador_servicios;
CREATE TRIGGER trg_ps_verificacion_profesional
  BEFORE INSERT OR UPDATE OF activo, tipo_servicio
  ON public.prestador_servicios
  FOR EACH ROW
  EXECUTE FUNCTION public._trg_ps_verificacion_profesional();

-- ─── 5 · el filtro reservable en los 11 lectores (firmas INTACTAS) ───

-- 5.1 helper único de inicios por prestador
CREATE OR REPLACE FUNCTION public._inicios_disponibles_prestador(p_prestador_id uuid, p_servicio_id uuid, p_fecha date, p_duracion_minutos integer)
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
$function$;

-- 5.2 inicios del paseo
CREATE OR REPLACE FUNCTION public.obtener_inicios_paseo_disponibles(p_fecha date, p_duracion_minutos integer)
 RETURNS TABLE(hora time without time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo AND ts.reservable  -- S68
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
      AND ps.reservable  -- S68
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
$function$;

-- 5.3 el QUIÉN del paseo
CREATE OR REPLACE FUNCTION public.obtener_paseadores_disponibles(p_fecha date, p_hora time without time zone, p_duracion_minutos integer)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, precio_plan numeric, duracion_minutos integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo AND ts.reservable  -- S68
  WHERE ps.activo
    AND ps.reservable  -- S68
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
$function$;

-- 5.4 slots del prestador (agenda/booking) — rebote tipado
CREATE OR REPLACE FUNCTION public.obtener_slots_disponibles(p_prestador_id uuid, p_servicio_id uuid, p_desde date, p_hasta date)
 RETURNS TABLE(fecha date, hora time without time zone, duracion_minutos integer, cupos_restantes integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_dur int;
  v_tipo text;
  v_cupo_techo int;
  -- S68
  v_ps_reservable boolean;
  v_ts_reservable boolean;
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
  SELECT ps.duracion_minutos, ps.tipo_servicio, ps.reservable INTO v_dur, v_tipo, v_ps_reservable
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_dur IS NULL OR v_dur <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  SELECT ts.cupo_techo, ts.reservable INTO v_cupo_techo, v_ts_reservable
  FROM tipos_servicio ts WHERE ts.codigo = v_tipo;

  -- S68: lo no reservable no tiene agenda — rebote tipado, no silencio.
  IF NOT v_ps_reservable OR NOT COALESCE(v_ts_reservable, true) THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;

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
$function$;

-- 5.5 el HOLD — reservable + guard same-day de urgencia
CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone, p_modalidad text DEFAULT NULL::text)
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
$function$;

-- 5.6 reserva contra paquete — reservable + solo_hoy (cinturón coherente)
CREATE OR REPLACE FUNCTION public.reservar_salida_paquete(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  -- S68
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
  SELECT ps.id, ps.tipo_servicio, ps.reservable INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- S68: mismas puertas que el hold — reservable en dos niveles + solo_hoy.
  SELECT ts.reservable, ts.reserva_solo_hoy INTO v_ts_reservable, v_ts_solo_hoy
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;
  IF NOT v_servicio.reservable OR NOT COALESCE(v_ts_reservable, true) THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(v_ts_solo_hoy, false)
     AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN  -- D-320
    RAISE EXCEPTION 'urgencia_solo_hoy' USING ERRCODE = '22023';
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
$function$;

-- 5.7 el QUIÉN de paquetes (comprar no es reservar, v1.4 §6bis.2bis)
CREATE OR REPLACE FUNCTION public.obtener_paseadores_con_paquete(p_duracion_minutos integer DEFAULT NULL::integer, p_servicio_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, duracion_minutos integer, precio numeric, precio_paquete numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Comprar no es reservar (v1.4 §6bis.2bis): acá NO hay fecha/hora —
  -- solo quién ofrece paquete para esa duración. Regla founder S54
  -- intacta: no se oferta quien no puede cobrar (7.13, server-side).
  RETURN QUERY
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.duracion_minutos,
    ps.precio,
    ps.precio_paquete
  FROM prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo AND ts.reservable  -- S68
  WHERE ps.activo
    AND ps.reservable  -- S68
    AND ps.precio_paquete IS NOT NULL AND ps.precio_paquete > 0
    AND (p_duracion_minutos IS NULL OR ps.duracion_minutos = p_duracion_minutos)
    AND (p_servicio_id IS NULL OR ps.id = p_servicio_id)
    AND EXISTS (
      SELECT 1 FROM cuenta_roles cr
      WHERE cr.cuenta_comercial_id = cc.id
        AND cr.tipo_actor = 'prestador_servicios' AND cr.estado = 'activo'
    )
  ORDER BY 7, 3;
END;
$function$;

-- 5.8 la oferta agregada del paseo (vitrina del QUÉ)
CREATE OR REPLACE FUNCTION public.obtener_oferta_paseo()
 RETURNS TABLE(prestador_servicio_id uuid, prestador_id uuid, prestador_nombre text, servicio_nombre text, descripcion text, duracion_minutos integer, precio numeric, especies_compatibles jsonb)
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
    ps.id,
    pr.id,
    pr.nombre_comercial,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.descripcion,
    COALESCE(ps.duracion_minutos, ts.duracion_default_minutos, 30),
    ps.precio,
    ps.especies_compatibles
  FROM prestador_servicios ps
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo AND ts.reservable  -- S68
  WHERE ps.activo
    AND ps.reservable  -- S68
  ORDER BY 3, 4;
END;
$function$;

-- 5.9 helper cobrable del grooming (cubre inicios + QUIÉN + oferta)
CREATE OR REPLACE FUNCTION public._grooming_ofertas_cobrables(p_mascota_id uuid, p_modalidad text DEFAULT 'local'::text)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    ps.tipo_servicio,
    COALESCE(ps.nombre_custom, ts.nombre),
    pst.precio
      + CASE WHEN m.pelaje = 'largo'
             THEN COALESCE(pr.grooming_extra_pelaje_largo, 0)
             ELSE 0 END
      -- S61 D-392: el recargo por domicilio, MISMO camino que el extra
      + CASE WHEN p_modalidad = 'domicilio'
             THEN COALESCE(pr.grooming_recargo_domicilio, 0)
             ELSE 0 END,
    pst.duracion_minutos,
    pr.direccion,
    pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio
                              AND ts.categoria = 'grooming' AND ts.activo
                              AND ts.reservable  -- S68
  JOIN prestador_servicio_tallas pst ON pst.prestador_servicio_id = ps.id
                                    AND pst.talla = m.talla
  WHERE m.id = p_mascota_id
    AND ps.activo
    AND ps.reservable  -- S68
    -- el groomer ACOTA (§5): NULL = sin acote, rige el techo del tipo
    AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
    -- S61 D-392: la MODALIDAD elegida filtra la oferta
    AND CASE WHEN p_modalidad = 'domicilio' THEN ps.atiende_domicilio ELSE ps.atiende_local END
$function$;

-- 5.10 la oferta agregada del grooming (vitrina del QUÉ)
CREATE OR REPLACE FUNCTION public.obtener_oferta_grooming(p_mascota_id uuid, p_modalidad text DEFAULT 'local'::text)
 RETURNS TABLE(tipo_servicio text, servicio_nombre text, desde_precio numeric, varia boolean, atiende_local boolean, atiende_domicilio boolean, recargo_domicilio_desde numeric, recargo_domicilio_varia boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_modalidad NOT IN ('local', 'domicilio') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  -- techo de plataforma perro+gato (§5): la UI filtra, la DB manda
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'grooming') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  SELECT m.talla INTO v_talla FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_talla IS NULL THEN
    RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  -- las modalidades del AGREGADO se computan SIN el filtro de modalidad
  -- (el selector del QUÉ necesita saber si existen ambas aunque la
  -- elegida sea una); recargo_domicilio_desde = MIN entre los groomers
  -- que atienden domicilio (v1: agregado declarado, no por groomer).
  WITH mods AS (
    SELECT ps.tipo_servicio AS tipo,
           bool_or(ps.atiende_local)      AS m_local,
           bool_or(ps.atiende_domicilio)  AS m_domicilio,
           MIN(COALESCE(pr.grooming_recargo_domicilio, 0))
             FILTER (WHERE ps.atiende_domicilio) AS m_recargo_desde,
           -- S61-A13 (escalera del precio honesto): el chip del QUÉ
           -- dice "desde" cuando el recargo VARÍA entre groomers
           MIN(COALESCE(pr.grooming_recargo_domicilio, 0)) FILTER (WHERE ps.atiende_domicilio)
             IS DISTINCT FROM
           MAX(COALESCE(pr.grooming_recargo_domicilio, 0)) FILTER (WHERE ps.atiende_domicilio)
             AS m_recargo_varia
    FROM mascotas m
    CROSS JOIN prestador_servicios ps
    JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts2      ON ts2.codigo = ps.tipo_servicio
                                AND ts2.categoria = 'grooming' AND ts2.activo
                                AND ts2.reservable  -- S68
    JOIN prestador_servicio_tallas pst ON pst.prestador_servicio_id = ps.id
                                      AND pst.talla = m.talla
    WHERE m.id = p_mascota_id
      AND ps.activo
      AND ps.reservable  -- S68
      AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
    GROUP BY ps.tipo_servicio
  )
  SELECT
    o.tipo_servicio,
    ts.nombre,               -- voz canónica del selector (no la custom por groomer)
    MIN(o.precio),
    MIN(o.precio) <> MAX(o.precio),
    mods.m_local,
    mods.m_domicilio,
    mods.m_recargo_desde,
    mods.m_recargo_varia
  FROM _grooming_ofertas_cobrables(p_mascota_id, p_modalidad) o
  JOIN tipos_servicio ts ON ts.codigo = o.tipo_servicio
  JOIN mods ON mods.tipo = o.tipo_servicio
  GROUP BY o.tipo_servicio, ts.nombre, mods.m_local, mods.m_domicilio, mods.m_recargo_desde, mods.m_recargo_varia
  ORDER BY MIN(o.precio);
END;
$function$;

-- 5.11 helper cobrable del adiestramiento (cubre inicios + QUIÉN)
CREATE OR REPLACE FUNCTION public._adiestramiento_ofertas_cobrables(p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, comprable text, programa_id uuid, nombre text, nivel text, n_sesiones integer, vigencia_dias integer, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  -- la SESIÓN SUELTA (precio único del adiestrador, §4 — sin matriz)
  SELECT
    pr.id, ps.id, pr.nombre_comercial, ps.tipo_servicio,
    'sesion', NULL::uuid,
    COALESCE(ps.nombre_custom, ts.nombre),
    NULL::text, NULL::integer, NULL::integer,
    ps.precio, ps.duracion_minutos,
    pr.direccion, pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_servicios ps
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria = 'adiestramiento' AND ts.activo
                             AND ts.reservable  -- S68
  WHERE m.id = p_mascota_id
    AND ps.activo
    AND ps.reservable  -- S68
    AND ps.precio IS NOT NULL AND ps.precio >= 0
    AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
    -- el adiestrador ACOTA (patrón §5 grooming): NULL = rige el techo del tipo
    AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)

  UNION ALL

  -- el PROGRAMA (precio propio, jamás N×sesión — §4)
  SELECT
    pr.id, ps.id, pr.nombre_comercial, ps.tipo_servicio,
    'programa', pp.id,
    pp.nombre,
    pp.nivel, pp.n_sesiones, pp.vigencia_dias,
    pp.precio_programa, pp.duracion_minutos_sesion,
    pr.direccion, pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_programas pp
  JOIN prestador_servicios ps ON ps.id = pp.prestador_servicio_id AND ps.activo AND ps.reservable  -- S68
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria = 'adiestramiento' AND ts.activo
                             AND ts.reservable  -- S68
  WHERE m.id = p_mascota_id
    AND pp.activo
    AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
$function$;

-- 5.12 reagenda de la suelta — la urgencia no viaja a otro día
CREATE OR REPLACE FUNCTION public.reagendar_cita_suelta(p_cita_id uuid, p_nueva_fecha date, p_nueva_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  -- S68: la cita de un tipo solo-hoy (urgencia_*) jamás viaja a otro día
  -- — el guard es de la puerta, no de la UI.
  IF COALESCE((SELECT ts.reserva_solo_hoy FROM tipos_servicio ts
               WHERE ts.codigo = v_cita.tipo_servicio), false)
     AND p_nueva_fecha <> v_ahora::date THEN
    RAISE EXCEPTION 'urgencia_solo_hoy' USING ERRCODE = '22023';
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
$function$;

-- ─── 6 · lectores V2 del mundo vet del dueño (espejo grooming, sin talla) ──

-- 6.1 helper cobrable del mundo vet
CREATE OR REPLACE FUNCTION public._vet_ofertas_cobrables(p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  -- S68: el mundo vet del dueño — consulta/vacunación (V2) + urgencia_*.
  -- telemedicina y emergencia existen en el mundo pero nacen
  -- reservable=false: el filtro las deja fuera SOLAS (honestidad, no lista).
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    ps.tipo_servicio,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.precio,
    ps.duracion_minutos,
    pr.direccion,
    pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_servicios ps
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria IN ('veterinario', 'telemedicina', 'emergencia')
                             AND ts.activo
                             AND ts.reservable
  WHERE m.id = p_mascota_id
    AND ps.activo
    AND ps.reservable
    AND ps.precio IS NOT NULL AND ps.precio >= 0
    -- coherencia vitrina↔hold: sin duración real no hay inicio que
    -- prometer (crear_bloqueo_agenda rebotaría servicio_no_disponible)
    AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
    -- el techo de especie del TIPO manda por fila (§1bis; multi-tipo)
    AND (ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie)
    -- el vet ACOTA (patrón §5): NULL o [] = sin acote, rige el techo del
    -- tipo ('[]' es el DEFAULT de la columna — el wizard vet aún no
    -- curó especies; tratarlo como acote vaciaría la vitrina entera)
    AND (ps.especies_compatibles IS NULL
         OR ps.especies_compatibles = '[]'::jsonb
         OR ps.especies_compatibles ? m.especie)
$function$;

-- 6.2 la oferta agregada del mundo vet (los chips del QUÉ)
CREATE OR REPLACE FUNCTION public.obtener_oferta_vet(p_mascota_id uuid)
 RETURNS TABLE(tipo_servicio text, servicio_nombre text, desde_precio numeric, varia boolean, reserva_solo_hoy boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    o.tipo_servicio,
    ts.nombre,               -- voz canónica del selector (no la custom por vet)
    MIN(o.precio),
    MIN(o.precio) <> MAX(o.precio),
    ts.reserva_solo_hoy      -- la UI sabe que urgencia es solo-HOY
  FROM _vet_ofertas_cobrables(p_mascota_id) o
  JOIN tipos_servicio ts ON ts.codigo = o.tipo_servicio
  GROUP BY o.tipo_servicio, ts.nombre, ts.reserva_solo_hoy, ts.orden_display
  ORDER BY ts.orden_display;
END;
$function$;

-- 6.3 inicios del mundo vet
CREATE OR REPLACE FUNCTION public.obtener_inicios_vet_disponibles(p_fecha date, p_tipo_servicio text, p_mascota_id uuid)
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
    o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
  ) i
  WHERE o.tipo_servicio = p_tipo_servicio
    AND (p_fecha + i.hora) > (now() AT TIME ZONE 'America/Guayaquil')
  ORDER BY 1;
END;
$function$;

-- 6.4 el QUIÉN del mundo vet
CREATE OR REPLACE FUNCTION public.obtener_veterinarios_disponibles(p_fecha date, p_hora time without time zone, p_tipo_servicio text, p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text)
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
  IF p_fecha IS NULL OR p_hora IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
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
  -- Ventana en el pasado: resultado VACÍO sin error (cinturón, espejo
  -- del QUIÉN del paseo/grooming — la UI ya filtra las horas de hoy).
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;
  -- S68: urgencia solo-HOY (cinturón; la ley dura en el hold)
  IF v_solo_hoy AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id,
    o.prestador_servicio_id,
    o.prestador_nombre,
    o.servicio_nombre,
    o.precio,
    o.duracion_minutos,
    o.direccion,
    o.ciudad
  FROM _vet_ofertas_cobrables(p_mascota_id) o
  WHERE o.tipo_servicio = p_tipo_servicio
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.precio, o.prestador_nombre;
END;
$function$;

-- ─── 7 · L-140 — REVOKE/GRANT explícitos de TODA firma tocada ────────

-- helpers internos: nadie los ejecuta directo
REVOKE ALL ON FUNCTION public._inicios_disponibles_prestador(uuid, uuid, date, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._grooming_ofertas_cobrables(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._adiestramiento_ofertas_cobrables(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vet_ofertas_cobrables(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._trg_ps_verificacion_profesional() FROM PUBLIC, anon, authenticated;

-- lectores públicos del dueño (recreados y nuevos)
REVOKE EXECUTE ON FUNCTION public.obtener_inicios_paseo_disponibles(date, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_inicios_paseo_disponibles(date, integer) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_slots_disponibles(uuid, uuid, date, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_slots_disponibles(uuid, uuid, date, date) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.reservar_salida_paquete(uuid, uuid, uuid, date, time without time zone) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reservar_salida_paquete(uuid, uuid, uuid, date, time without time zone) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_paseadores_con_paquete(integer, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_paseadores_con_paquete(integer, uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_oferta_paseo() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_oferta_paseo() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_oferta_grooming(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_oferta_grooming(uuid, text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.reagendar_cita_suelta(uuid, date, time without time zone) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reagendar_cita_suelta(uuid, date, time without time zone) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_oferta_vet(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_oferta_vet(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_inicios_vet_disponibles(date, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_inicios_vet_disponibles(date, text, uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.obtener_veterinarios_disponibles(date, time without time zone, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_veterinarios_disponibles(date, time without time zone, text, uuid) TO authenticated, service_role;

-- ─── 8 · CIERRE — ley S67 + sonda L-140 ──────────────────────────────

-- Ley S67: coherencia tabla_tipada ↔ schema real en 0 (esta migración no
-- toca cat_tipos_evento, pero la ley corre en toda migración que toque
-- el catálogo — y tipos_servicio ES catálogo).
DO $do$
DECLARE r record; v_n int := 0;
BEGIN
  FOR r IN SELECT * FROM verificar_coherencia_tablas_tipadas() LOOP
    v_n := v_n + 1;
    RAISE NOTICE 'S68-A1 D-415 incoherencia: % → % (%)', r.codigo, r.tabla_tipada, r.problema;
  END LOOP;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'S68-A1 abort: verificar_coherencia_tablas_tipadas() encontró % incoherencias', v_n;
  END IF;
  RAISE NOTICE 'S68-A1: coherencia tabla_tipada ↔ schema real: LIMPIA';
END;
$do$;

-- Verificación imperativa de la semilla del catálogo:
DO $do$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM tipos_servicio
  WHERE codigo IN ('urgencia_local', 'urgencia_domicilio')
    AND es_medico AND requiere_historia_clinica AND requiere_validacion_admin
    AND NOT requiere_resultado AND concurrencia = 'exclusiva' AND cupo_techo IS NULL
    AND reservable AND reserva_solo_hoy
    AND especies_elegibles IS NOT NULL;
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'S68-A1 abort: tipos urgencia_* mal sembrados (esperaba 2, hay %)', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM tipos_servicio
  WHERE codigo IN ('telemedicina', 'emergencia') AND reservable = false;
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'S68-A1 abort: semilla reservable=false incompleta (esperaba 2, hay %)', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM cat_especialidades_vet WHERE es_seed_preliminar;
  IF v_n < 6 THEN
    RAISE EXCEPTION 'S68-A1 abort: cat_especialidades_vet incompleto (esperaba 6, hay %)', v_n;
  END IF;
  RAISE NOTICE 'S68-A1: semillas verificadas (2 urgencia_* + 2 no-reservables + 6 especialidades)';
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
        '_inicios_disponibles_prestador',
        'obtener_inicios_paseo_disponibles',
        'obtener_paseadores_disponibles',
        'obtener_slots_disponibles',
        'crear_bloqueo_agenda',
        'reservar_salida_paquete',
        'obtener_paseadores_con_paquete',
        'obtener_oferta_paseo',
        'obtener_oferta_grooming',
        '_grooming_ofertas_cobrables',
        '_adiestramiento_ofertas_cobrables',
        'reagendar_cita_suelta',
        '_trg_ps_verificacion_profesional',
        '_vet_ofertas_cobrables',
        'obtener_oferta_vet',
        'obtener_inicios_vet_disponibles',
        'obtener_veterinarios_disponibles'
      )
  LOOP
    RAISE NOTICE 'S68-A1 L-140 proacl %: %', r.proname, r.proacl;
    IF r.proacl::text LIKE '%anon=%' THEN
      v_malos := v_malos || r.proname || ' ';
    END IF;
  END LOOP;
  IF v_malos <> '' THEN
    RAISE EXCEPTION 'S68-A1 abort L-140: anon con EXECUTE en: %', v_malos;
  END IF;
  RAISE NOTICE 'S68-A1 L-140: ninguna función tocada quedó ejecutable por anon';
END;
$do$;

NOTIFY pgrst, 'reload schema';
