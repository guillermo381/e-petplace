-- ═════════════════════════════════════════════════════════════════════
-- S63-A — PROGRAMA DE ADIESTRAMIENTO: la estructura aprobada post-L-144
-- (MODELO_ADIESTRAMIENTO v1.0 §1/§4/§8/§12.2; decisiones firmadas
-- founder+arquitecto S63: guard duro de cierre en orden · vigencia
-- vencida = reembolso proporcional declarado + motivo capturado SIN
-- triage v1 · tabla propia, jamás extensión de bonos/suscripciones).
--
-- El contrato de la plata (releído, regla de piedra):
--   · UN cobro SIMULADO Y DECLARADO por el programa entero — JAMÁS un
--     evento económico al cobrar (variante b intacta).
--   · Cada sesión nace con su precio (unitario efectivo; la ÚLTIMA
--     absorbe el residuo de redondeo para que la suma == precio del
--     programa) → el cierre de cada sesión devenga EXACTO sin tocarse.
--     N devengos secuenciales = Decisión U (el financiero se enmienda
--     en este mismo commit, patrón S57 del tercer escritor).
--   · El reembolso al vencer la vigencia es SIMULADO Y DECLARADO en la
--     matrícula (patrón P14a del plan) — jamás toca el ledger: las
--     sesiones no ejecutadas no tienen devengos que reversar (7.14).
--
-- Consumo SECUENCIAL, jamás FIFO (§1): el orden se resuelve en el
-- NACIMIENTO (todas las sesiones se agendan al comprar, §12.2, con
-- sesion_numero k/N en la fila) y se protege en las DOS vías que
-- podrían romperlo: reagenda (guard de vecinas) y cierre (trigger EN
-- LA FUENTE, patrón D-386 — la mezcla no puede existir).
--
-- Relevado contra DB viva antes de escribir (L-084/regla 22):
--   · evento_cita_servicio.estado: pendiente/confirmada/en_curso/
--     completada/cancelada/no_show/rechazada — cierres = completada|no_show.
--   · modalidad default 'presencial' (las modalidades finas del oficio
--     §3 llegan con su tanda D-392-adiestramiento, fuera de este pedido).
--   · _agenda_ocupacion(prestador, fecha, hora, duracion, excluir_cita).
--   · tipos_servicio.'adiestramiento' existe activo, especies NULL.
--   · patrón satélite: prestador_servicio_tallas (pst_own/pst_public).
-- ═════════════════════════════════════════════════════════════════════

-- ── 0. §2 del modelo: solo perros — el techo entra a la DB ────────────
UPDATE public.tipos_servicio
SET especies_elegibles = '["perro"]'::jsonb
WHERE codigo = 'adiestramiento' AND especies_elegibles IS NULL;

-- ── 1. EL CATÁLOGO: prestador_programas (satélite de la oferta) ───────
CREATE TABLE public.prestador_programas (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_servicio_id   uuid NOT NULL REFERENCES public.prestador_servicios(id) ON DELETE CASCADE,
  nivel                   text NOT NULL,
  nombre                  text NOT NULL,
  descripcion             text,
  n_sesiones              integer NOT NULL,
  precio_programa         numeric(14,2) NOT NULL,
  vigencia_dias           integer NOT NULL,
  duracion_minutos_sesion integer NOT NULL DEFAULT 60,
  activo                  boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_programa_nivel CHECK (nivel IN ('basico','medio','experto','especialidad')),
  CONSTRAINT chk_programa_nombre CHECK (btrim(nombre) <> ''),
  -- rangos por nivel son SUGERIDOS (§12.4: el adiestrador declara) —
  -- acá solo cordura: un programa de 1 sesión es una sesión suelta.
  CONSTRAINT chk_programa_n_sesiones CHECK (n_sesiones BETWEEN 2 AND 30),
  CONSTRAINT chk_programa_precio CHECK (precio_programa > 0),
  CONSTRAINT chk_programa_vigencia CHECK (vigencia_dias > 0),
  -- la cadencia semanal de N sesiones necesita al menos (N-1) semanas
  -- de vigencia — una config que no se puede cumplir no puede nacer.
  CONSTRAINT chk_programa_vigencia_cubre_cadencia CHECK (vigencia_dias >= (n_sesiones - 1) * 7),
  -- §12.5: pasos de 15', default 60'.
  CONSTRAINT chk_programa_duracion CHECK (duracion_minutos_sesion > 0 AND duracion_minutos_sesion % 15 = 0)
);

COMMENT ON TABLE public.prestador_programas IS
  'Catálogo de programas del adiestrador (MODELO_ADIESTRAMIENTO §1/§5): N sesiones ORDENADAS de contenido progresivo, precio propio (NO N×sesión, §4), vigencia. Satélite de la oferta de adiestramiento, patrón prestador_servicio_tallas.';
COMMENT ON COLUMN public.prestador_programas.n_sesiones IS
  'Declarada por el adiestrador dentro del rango sugerido por nivel (básico 6-8 · medio 8-10 · experto 10-12, §12.4 — sugerido, no CHECK).';
COMMENT ON COLUMN public.prestador_programas.vigencia_dias IS
  'Plazo de validez del programa desde la compra (decisión founder S63). La matrícula lo congela como vigencia_hasta.';

CREATE TRIGGER trg_prestador_programas_updated_at
  BEFORE UPDATE ON public.prestador_programas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Integridad de oficio: el programa solo cuelga de una oferta de
-- ADIESTRAMIENTO (un CHECK no puede subconsultar; trigger en la fuente).
CREATE OR REPLACE FUNCTION public._trg_programa_es_de_adiestramiento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM prestador_servicios ps
    JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
    WHERE ps.id = NEW.prestador_servicio_id AND ts.categoria = 'adiestramiento'
  ) THEN
    RAISE EXCEPTION 'programa_fuera_de_oficio' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_programa_es_de_adiestramiento
  BEFORE INSERT OR UPDATE OF prestador_servicio_id ON public.prestador_programas
  FOR EACH ROW EXECUTE FUNCTION public._trg_programa_es_de_adiestramiento();

-- RLS patrón pst_own / pst_public
ALTER TABLE public.prestador_programas ENABLE ROW LEVEL SECURITY;

CREATE POLICY pp_own ON public.prestador_programas
  FOR ALL TO authenticated
  USING (
    prestador_servicio_id IN (
      SELECT ps.id FROM prestador_servicios ps
      JOIN prestadores pr ON pr.id = ps.prestador_id
      WHERE pr.user_id = auth.uid()
    ) OR is_admin()
  )
  WITH CHECK (
    prestador_servicio_id IN (
      SELECT ps.id FROM prestador_servicios ps
      JOIN prestadores pr ON pr.id = ps.prestador_id
      WHERE pr.user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY pp_public ON public.prestador_programas
  FOR SELECT TO authenticated
  USING (
    activo AND prestador_servicio_id IN (
      SELECT ps.id FROM prestador_servicios ps
      JOIN prestadores pr ON pr.id = ps.prestador_id
      WHERE ps.activo AND pr.estado = 'activo'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prestador_programas TO authenticated;
GRANT ALL ON public.prestador_programas TO service_role;

-- ── 2. LA MATRÍCULA: programas_contratados ────────────────────────────
CREATE TABLE public.programas_contratados (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id              uuid NOT NULL REFERENCES public.prestador_programas(id) ON DELETE RESTRICT,
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  -- mascota FIJA (decisión firmada): la progresión conductual es de UN
  -- sujeto — no familia_id, a diferencia del paquete de salidas.
  mascota_id               uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  prestador_id             uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE RESTRICT,
  prestador_servicio_id    uuid REFERENCES public.prestador_servicios(id) ON DELETE SET NULL,
  -- snapshot CONGELADO al comprar (patrón S54/S55: checkout jamás re-resuelve)
  n_sesiones               integer NOT NULL,
  precio_total             numeric(14,2) NOT NULL,
  precio_unitario_efectivo numeric(14,2) NOT NULL,
  duracion_minutos         integer NOT NULL,
  vigencia_hasta           date NOT NULL,
  estado                   text NOT NULL DEFAULT 'activo',
  estado_pago              text NOT NULL DEFAULT 'pendiente',
  -- motivo del cierre por vencimiento (decisión founder S63: catálogo
  -- chico, capturado SIN triage en v1 — el triage es diferido v2 §9).
  motivo_vencimiento       text,
  pago_metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  country_code             text NOT NULL DEFAULT 'EC',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_pc_estado CHECK (estado IN ('activo','completado','vencido','cancelado')),
  CONSTRAINT chk_pc_estado_pago CHECK (estado_pago IN ('pendiente','pagado','reembolsado')),
  CONSTRAINT chk_pc_n_sesiones CHECK (n_sesiones >= 2),
  CONSTRAINT chk_pc_precios CHECK (precio_total >= 0 AND precio_unitario_efectivo >= 0),
  CONSTRAINT chk_pc_duracion CHECK (duracion_minutos > 0),
  CONSTRAINT chk_pc_motivo_vencimiento CHECK (
    motivo_vencimiento IS NULL OR
    motivo_vencimiento IN ('sin_uso','conflicto_horario','problema_adiestrador','fuerza_mayor','otro')
  ),
  -- el motivo solo existe si el programa venció (v1: lo escribe el cron)
  CONSTRAINT chk_pc_motivo_solo_vencido CHECK (motivo_vencimiento IS NULL OR estado = 'vencido')
);

COMMENT ON TABLE public.programas_contratados IS
  'La matrícula: instancia comprada de un programa de adiestramiento. UN pago simulado declarado (pago_metadata), N sesiones agendadas AL COMPRAR (§12.2), consumo SECUENCIAL (§1). Nace SOLO por contratar_programa (verdad firme, lección S56).';
COMMENT ON COLUMN public.programas_contratados.precio_unitario_efectivo IS
  'precio_total ÷ N redondeado — base del devengo por sesión (Decisión S aplicada al programa; Decisión U). La ÚLTIMA sesión absorbe el residuo de redondeo en su precio snapshoteado.';
COMMENT ON COLUMN public.programas_contratados.motivo_vencimiento IS
  'S63: catálogo chico del porqué al vencer con sesiones sin ejecutar (sin_uso/conflicto_horario/problema_adiestrador/fuerza_mayor/otro). v1 SOLO lo registra (el cron escribe sin_uso); el triage pre-reembolso es diferido v2 (§9).';

CREATE TRIGGER trg_programas_contratados_updated_at
  BEFORE UPDATE ON public.programas_contratados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pc_user ON public.programas_contratados (user_id);
CREATE INDEX idx_pc_prestador ON public.programas_contratados (prestador_id);
CREATE INDEX idx_pc_mascota ON public.programas_contratados (mascota_id);
CREATE INDEX idx_pc_vigencia_activos ON public.programas_contratados (vigencia_hasta) WHERE estado = 'activo';

-- RLS: verdad firme — CERO policy de INSERT/UPDATE del dueño (la
-- matrícula nace y muta SOLO por el motor DEFINER, lección S56).
ALTER TABLE public.programas_contratados ENABLE ROW LEVEL SECURITY;

CREATE POLICY pc_pet_parent_own ON public.programas_contratados
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY pc_prestador_own ON public.programas_contratados
  FOR SELECT TO authenticated
  USING (prestador_id IN (SELECT id FROM prestadores WHERE user_id = auth.uid()));

CREATE POLICY pc_admin ON public.programas_contratados
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

GRANT SELECT ON public.programas_contratados TO authenticated;
GRANT ALL ON public.programas_contratados TO service_role;

-- ── 3. LA CITA GANA IDENTIDAD k/N ─────────────────────────────────────
ALTER TABLE public.evento_cita_servicio
  ADD COLUMN IF NOT EXISTS programa_contratado_id uuid REFERENCES public.programas_contratados(id),
  ADD COLUMN IF NOT EXISTS sesion_numero integer;

ALTER TABLE public.evento_cita_servicio
  ADD CONSTRAINT chk_cita_sesion_programa CHECK (
    (programa_contratado_id IS NULL AND sesion_numero IS NULL)
    OR (programa_contratado_id IS NOT NULL AND sesion_numero >= 1)
  );

-- una sesión k por programa — el orden es identidad, no metadata
CREATE UNIQUE INDEX uq_cita_programa_sesion
  ON public.evento_cita_servicio (programa_contratado_id, sesion_numero)
  WHERE programa_contratado_id IS NOT NULL;

CREATE INDEX idx_cita_programa ON public.evento_cita_servicio (programa_contratado_id)
  WHERE programa_contratado_id IS NOT NULL;

COMMENT ON COLUMN public.evento_cita_servicio.sesion_numero IS
  'Orden k de la sesión dentro del programa (1..N). Columna, no metadata: la leen el guard de orden (reagenda/cierre) y el "Sesión k de N" del parte (MODELO_ADIESTRAMIENTO §5).';

-- El invariante canónico gana su CUARTO escritor (precedente S57).
COMMENT ON COLUMN public.evento_cita_servicio.estado_reserva IS
  'Invariante canónico (S54, ampliado S56, S57-D343 y S63-programa): estado_reserva=''pagada'' ⟺ la cita está CUBIERTA POR UN PAGO — pasó por confirmar_cita_pagada (cita suelta), o nació de un PLAN con período cobrado (suscripcion_servicio_id + metadata.origen=''plan''), o nació RESERVADA CONTRA SALDO DE PAQUETE ya pagado (bono_id + metadata.origen=''paquete''), o nació de un PROGRAMA DE ADIESTRAMIENTO pagado entero al comprar (programa_contratado_id + metadata.origen=''programa''; consumo SECUENCIAL, Decisión U). Esos son los CUATRO únicos escritores del valor; NULL = ciclo de pago no aplica (legacy/walk-in).';

-- ── 4. GUARD DURO: el cierre respeta el orden (decisión founder S63) ──
-- EN LA FUENTE (patrón D-386): ninguna función de cierre presente o
-- futura puede cerrar la sesión k con la k−1 abierta.
CREATE OR REPLACE FUNCTION public._trg_programa_cierre_en_orden()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.programa_contratado_id IS NOT NULL
     AND NEW.estado IN ('completada','no_show')
     AND NEW.estado IS DISTINCT FROM OLD.estado
     AND EXISTS (
       SELECT 1 FROM evento_cita_servicio c
       WHERE c.programa_contratado_id = NEW.programa_contratado_id
         AND c.sesion_numero < NEW.sesion_numero
         AND c.estado NOT IN ('completada','no_show','cancelada')
     )
  THEN
    RAISE EXCEPTION 'sesion_anterior_abierta' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_programa_cierre_en_orden
  BEFORE UPDATE OF estado ON public.evento_cita_servicio
  FOR EACH ROW EXECUTE FUNCTION public._trg_programa_cierre_en_orden();

-- Completitud: cerrada la última sesión, la matrícula se declara sola.
CREATE OR REPLACE FUNCTION public._trg_programa_completa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.programa_contratado_id IS NOT NULL
     AND NEW.estado IN ('completada','no_show')
     AND NEW.estado IS DISTINCT FROM OLD.estado
     AND NOT EXISTS (
       SELECT 1 FROM evento_cita_servicio c
       WHERE c.programa_contratado_id = NEW.programa_contratado_id
         AND c.estado NOT IN ('completada','no_show','cancelada')
     )
  THEN
    UPDATE programas_contratados
    SET estado = 'completado', updated_at = now()
    WHERE id = NEW.programa_contratado_id AND estado = 'activo';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_programa_completa
  AFTER UPDATE OF estado ON public.evento_cita_servicio
  FOR EACH ROW EXECUTE FUNCTION public._trg_programa_completa();

-- ── 5. Helper interno: genera las N sesiones FIRMES, en orden ─────────
-- Clon de _generar_citas_plan vigente (post D-341) con TRES diferencias:
-- (1) derivador de fechas propio — N fechas a cadencia semanal desde la
-- fecha de inicio, no _fechas_periodo_plan; (2) escribe sesion_numero k
-- y programa_contratado_id; (3) SIN filtro de pasado (contratar valida
-- inicio > hoy; toda fecha posterior es futura) y CON guard de vigencia.
-- Atomicidad idéntica: si UNA sesión no cabe, TODO el programa rebota
-- tipado con la fecha y el cobro no nace.
CREATE OR REPLACE FUNCTION public._generar_citas_programa(
  p_programa_contratado_id uuid,
  p_fecha_inicio date,
  p_hora time without time zone,
  p_pagado_en timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_prog      record;
  v_tipo_srv  text;
  v_k         int;
  v_fecha     date;
  v_horario   record;
  v_ocupados  int;
  v_country   text;
  v_eje       text;
  v_visib     jsonb;
  v_evento_id uuid;
  v_direccion jsonb;
  v_precio    numeric(14,2);
BEGIN
  SELECT * INTO v_prog FROM programas_contratados WHERE id = p_programa_contratado_id;
  IF v_prog.id IS NULL THEN
    RAISE EXCEPTION 'programa_no_encontrado' USING ERRCODE = '22023';
  END IF;

  SELECT ps.tipo_servicio INTO v_tipo_srv
  FROM prestador_servicios ps WHERE ps.id = v_prog.prestador_servicio_id;

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

    -- La ventana completa cabe en una franja activa, alineada (S55-B2).
    SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
    INTO v_horario
    FROM prestador_horarios h
    WHERE h.prestador_id = v_prog.prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = v_prog.prestador_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM v_fecha)::int          -- regla 32
      AND p_hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM p_hora)::int + v_prog.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    LIMIT 1;
    IF v_horario.dur IS NULL THEN
      RAISE EXCEPTION 'fuera_de_horario: %', v_fecha USING ERRCODE = '22023';
    END IF;

    v_ocupados := _agenda_ocupacion(v_prog.prestador_id, v_fecha, p_hora, v_prog.duracion_minutos, NULL);
    IF v_ocupados >= v_horario.cupo THEN
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
      evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
      fecha, hora, precio, duracion_minutos, estado, estado_reserva,
      expira_en, country_code, programa_contratado_id, sesion_numero,
      direccion_snapshot, metadata
    ) VALUES (
      v_evento_id, v_prog.user_id, v_prog.mascota_id, v_prog.prestador_id, v_tipo_srv,
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
$function$;

-- ── 6. La puerta del dueño: contratar el programa ─────────────────────
-- Clon de contratar_plan_paseo vigente (pre-validación financiera +
-- generación atómica todas-al-comprar). Sin P19/L-V (letra del paseo).
CREATE OR REPLACE FUNCTION public.contratar_programa(
  p_prestador_id uuid,
  p_servicio_id uuid,
  p_programa_id uuid,
  p_mascota_id uuid,
  p_fecha_inicio date,
  p_hora time without time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_servicio  record;
  v_programa  record;
  v_cuenta    record;
  v_fee       uuid;
  v_hoy_local date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_pagado_en timestamptz := now();
  v_vigencia  date;
  v_unitario  numeric(14,2);
  v_pc_id     uuid;
  v_generadas int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_hora IS NULL OR p_fecha_inicio IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  -- §12.2: todas al comprar — el arranque jamás en el pasado ni hoy
  -- (el gate temporal del cierre exige aire entre compra y sesión 1).
  IF p_fecha_inicio <= v_hoy_local THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
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
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'adiestramiento' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- §1bis heredado (F3 S57): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  SELECT pp.* INTO v_programa
  FROM prestador_programas pp
  WHERE pp.id = p_programa_id AND pp.prestador_servicio_id = p_servicio_id AND pp.activo;
  IF v_programa.id IS NULL THEN
    RAISE EXCEPTION 'programa_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- una matrícula ACTIVA del mismo programa por mascota
  IF EXISTS (
    SELECT 1 FROM programas_contratados pc
    WHERE pc.programa_id = p_programa_id AND pc.mascota_id = p_mascota_id
      AND pc.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'programa_duplicado' USING ERRCODE = '22023';
  END IF;

  -- ── PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón
  --    confirmar_cita_pagada): un cobro que el motor rechazará al
  --    cierre es un cobro que promete mentira.
  SELECT cc.id, cc.estado INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = p_prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
  END IF;
  IF v_cuenta.estado <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cuenta_roles cr
    WHERE cr.cuenta_comercial_id = v_cuenta.id
      AND cr.tipo_actor = 'prestador_servicios' AND cr.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE = '22023';
  END IF;
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum,
    (SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id),
    'transaccional'::revenue_stream_enum, 'cita', NULL, now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- vigencia congelada A LA FECHA DE COMPRA (decisión founder S63)
  v_vigencia := v_hoy_local + v_programa.vigencia_dias;
  v_unitario := round(v_programa.precio_programa / v_programa.n_sesiones, 2);

  -- UN cobro simulado DECLARADO por el programa entero (jamás el ledger).
  INSERT INTO programas_contratados (
    programa_id, user_id, mascota_id, prestador_id, prestador_servicio_id,
    n_sesiones, precio_total, precio_unitario_efectivo, duracion_minutos,
    vigencia_hasta, estado, estado_pago, country_code, pago_metadata
  ) VALUES (
    p_programa_id, v_auth, p_mascota_id, p_prestador_id, p_servicio_id,
    v_programa.n_sesiones, v_programa.precio_programa, v_unitario,
    v_programa.duracion_minutos_sesion,
    v_vigencia, 'activo', 'pagado',
    COALESCE((SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id), 'EC'),
    jsonb_build_object('cobros', jsonb_build_array(jsonb_build_object(
      'total', v_programa.precio_programa,
      'n_sesiones', v_programa.n_sesiones,
      'pagado_en', v_pagado_en, 'pago_simulado', true
    )))
  ) RETURNING id INTO v_pc_id;

  -- las N sesiones, firmes y EN ORDEN, con el motor de ventana
  -- (atómico: si una no cabe, TODO el programa rebota y el cobro no nace)
  v_generadas := _generar_citas_programa(v_pc_id, p_fecha_inicio, p_hora, v_pagado_en);
  IF v_generadas <> v_programa.n_sesiones THEN
    RAISE EXCEPTION 'programa_incompleto' USING ERRCODE = '22023';  -- defensivo: no debería ocurrir
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'programa_contratado_id', v_pc_id,
    'n_sesiones', v_programa.n_sesiones,
    'primera_sesion', p_fecha_inicio,
    'ultima_sesion', p_fecha_inicio + ((v_programa.n_sesiones - 1) * 7),
    'vigencia_hasta', v_vigencia,
    'precio_total', v_programa.precio_programa,
    'precio_unitario_efectivo', v_unitario,
    'pagado_en', v_pagado_en
  );
END;
$function$;

-- ── 7. Reagendar UNA sesión (P14 por sesión, §12.2) ───────────────────
-- Clon de saltar_cita_plan con los dos cambios firmados: ventana =
-- VIGENCIA del programa (no período mensual) y GUARD DE ORDEN — la
-- sesión k reagendada queda estrictamente entre la k−1 y la k+1.
CREATE OR REPLACE FUNCTION public.reagendar_sesion_programa(
  p_cita_id uuid,
  p_nueva_fecha date,
  p_nueva_hora time without time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_prog     record;
  v_horario  record;
  v_ocupados int;
  v_prev     timestamp;
  v_next     timestamp;
  v_ahora    timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
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

  -- GUARD DE ORDEN (§1: la sesión 3 no es intercambiable con la 7) —
  -- la fecha nueva de la sesión k queda ESTRICTAMENTE entre la fecha
  -- vigente de k−1 y la de k+1 (las canceladas no acotan).
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

  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = v_cita.prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = v_prog.prestador_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- D-349: la propia cita se excluye del conteo de ocupación.
  v_ocupados := _agenda_ocupacion(v_cita.prestador_id, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos, p_cita_id);
  IF v_ocupados >= v_horario.cupo THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
  SET fecha = p_nueva_fecha,
      hora = p_nueva_hora,
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
$function$;

-- ── 8. El ciclo de la vigencia: aviso sereno + vencimiento ────────────
-- Patrón vencer_paquetes_salidas. Al vencer con sesiones sin ejecutar:
-- reembolso proporcional AUTOMÁTICO, SIMULADO Y DECLARADO en la
-- matrícula (patrón P14a — jamás toca el ledger: no hay devengos que
-- reversar, 7.14) + motivo capturado (v1: 'sin_uso', sin triage — el
-- triage de causa es diferido v2, §9 del modelo).
CREATE OR REPLACE FUNCTION public.vencer_programas_adiestramiento()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_prog      record;
  v_restantes int;
  v_reembolso numeric(14,2);
  v_aviso_key text;
  v_avisados  int := 0;
  v_vencidos  int := 0;
  v_errores   int := 0;
BEGIN
  -- (a) el recordatorio: UNO y sereno, cerca del cierre (patrón P16e).
  FOR v_prog IN
    SELECT pc.* FROM programas_contratados pc
    WHERE pc.estado = 'activo'
      AND pc.vigencia_hasta >= v_hoy AND pc.vigencia_hasta <= v_hoy + 3
      AND EXISTS (
        SELECT 1 FROM evento_cita_servicio c
        WHERE c.programa_contratado_id = pc.id AND c.estado = 'confirmada'
      )
    FOR UPDATE
  LOOP
    v_aviso_key := 'aviso_vigencia_' || v_prog.vigencia_hasta::text;
    IF NOT (v_prog.pago_metadata ? v_aviso_key) THEN
      INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
      VALUES (
        v_prog.user_id, v_prog.country_code, 'sistema', 'in_app',
        'Tu programa de adiestramiento vence pronto',
        'El programa vence el ' || to_char(v_prog.vigencia_hasta, 'DD/MM') ||
          ' y aún quedan sesiones agendadas. Si alguna fecha no te sirve, puedes moverla desde el detalle.',
        jsonb_build_object('subtipo', 'programa_vigencia', 'programa_contratado_id', v_prog.id),
        'pet_parent'
      );
      UPDATE programas_contratados
      SET pago_metadata = pago_metadata || jsonb_build_object(v_aviso_key, now())
      WHERE id = v_prog.id;
      v_avisados := v_avisados + 1;
    END IF;
  END LOOP;

  -- (b) el vencimiento: sesiones restantes canceladas (la agenda se
  -- libera sola: _agenda_ocupacion no cuenta canceladas), reembolso
  -- proporcional declarado, motivo capturado.
  FOR v_prog IN
    SELECT pc.* FROM programas_contratados pc
    WHERE pc.estado = 'activo' AND pc.vigencia_hasta < v_hoy
    FOR UPDATE
  LOOP
    BEGIN
      -- el reembolso es la SUMA de los precios snapshoteados de las
      -- sesiones canceladas (exacto aunque la última porte el residuo).
      SELECT count(*), COALESCE(sum(c.precio), 0)
      INTO v_restantes, v_reembolso
      FROM evento_cita_servicio c
      WHERE c.programa_contratado_id = v_prog.id AND c.estado = 'confirmada';

      UPDATE evento_cita_servicio
      SET estado = 'cancelada',
          metadata = COALESCE(metadata, '{}'::jsonb)
                     || jsonb_build_object('motivo', 'vigencia_programa_vencida', 'cancelada_en', now()),
          updated_at = now()
      WHERE programa_contratado_id = v_prog.id AND estado = 'confirmada';

      UPDATE programas_contratados
      SET estado = 'vencido',
          motivo_vencimiento = 'sin_uso',   -- v1: registro sin triage (§9 diferido)
          estado_pago = CASE WHEN v_reembolso > 0 THEN 'reembolsado' ELSE estado_pago END,
          pago_metadata = pago_metadata || CASE WHEN v_reembolso > 0 THEN jsonb_build_object(
            'reembolsos', COALESCE(pago_metadata->'reembolsos', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
              'monto', v_reembolso, 'sesiones', v_restantes,
              'motivo', 'sin_uso',
              'via', 'vencer_programas_adiestramiento',
              'simulado', true, 'aplicado_en', now()
            ))
          ) ELSE '{}'::jsonb END,
          updated_at = now()
      WHERE id = v_prog.id;

      IF v_reembolso > 0 THEN
        INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
        VALUES (
          v_prog.user_id, v_prog.country_code, 'sistema', 'in_app',
          'Tu programa de adiestramiento terminó',
          'Quedaron ' || v_restantes || ' sesiones sin realizar: te corresponde un reembolso de $' || v_reembolso || '. (Pago simulado — fase de pruebas.)',
          jsonb_build_object('subtipo', 'programa_vencido_reembolso', 'programa_contratado_id', v_prog.id),
          'pet_parent'
        );
      END IF;
      v_vencidos := v_vencidos + 1;
    EXCEPTION WHEN OTHERS THEN
      -- un programa imposible NO puede matar la corrida (patrón
      -- cerrar_y_renovar_planes).
      v_errores := v_errores + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'vencidos', v_vencidos,
    'errores', v_errores, 'corrida_en', now()
  );
END;
$function$;

-- cron diario 08:00 UTC (03:00 Guayaquil) — higiene; la correctitud no
-- depende del cron (los estados se leen por vigencia, patrón perezoso).
SELECT cron.schedule('vencer-programas-adiestramiento', '0 8 * * *', 'SELECT vencer_programas_adiestramiento()');

-- ── 9. L-140: ley en dos partes por CADA función nueva ────────────────
REVOKE ALL ON FUNCTION public._trg_programa_es_de_adiestramiento() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._trg_programa_cierre_en_orden() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._trg_programa_completa() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public._generar_citas_programa(uuid, date, time without time zone, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._generar_citas_programa(uuid, date, time without time zone, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.contratar_programa(uuid, uuid, uuid, uuid, date, time without time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contratar_programa(uuid, uuid, uuid, uuid, date, time without time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.reagendar_sesion_programa(uuid, date, time without time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reagendar_sesion_programa(uuid, date, time without time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.vencer_programas_adiestramiento() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vencer_programas_adiestramiento() TO service_role;
