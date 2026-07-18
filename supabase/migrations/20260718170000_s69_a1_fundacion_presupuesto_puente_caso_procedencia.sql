-- ============================================================================
-- S69-A1 — FUNDACIÓN: PRESUPUESTO CLÍNICO + PUENTE caso⇄cita + 3er NIVEL PROCEDENCIA
-- MODELO_VETERINARIA §8 (el presupuesto como primitiva) · §10 (el caso agrupa)
-- · §13 (procedencia). Decisiones founder S69/T2: (3) máquina de estados chica,
-- aprobado_via jamás miente · (4) el caso agrupa, nunca exige · (5) nace el
-- tercer nivel declarado_por_prestador.
--
-- DECLARACIÓN 76(g) (veda de escritura sobre datos vivos):
--   Esta migración es DDL puro (tablas nuevas + 2 columnas nuevas en
--   evento_cita_servicio + 1 valor nuevo en un CHECK existente) + funciones
--   nuevas + re-creación aditiva de _crear_evento_padre_auto (param nuevo con
--   DEFAULT — cero cambio para los 16 callers vivos, todos triggers que pasan
--   la lista posicional vieja). La verificación imperativa crea SUS PROPIOS
--   fixtures (auth.users throwaway + cuenta/familia/mascota) dentro de un
--   savepoint y los DESTRUYE con RAISE sentinela — CERO ancla sobre datos
--   vivos, CERO residuo. NO RIGE VEDA: el founder puede escribir datos vivos
--   durante y después de esta migración sin riesgo de colisión.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 1 — PROCEDENCIA: el tercer nivel declarado_por_prestador (§13, dec. 5)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE eventos_mascota DROP CONSTRAINT eventos_mascota_procedencia_check;
ALTER TABLE eventos_mascota ADD CONSTRAINT eventos_mascota_procedencia_check
  CHECK (procedencia IN ('declarado_por_familia', 'verificado_por_prestador', 'declarado_por_prestador'));

-- La puerta única gana p_procedencia con DEFAULT. Sólo se aplica a lo CLÍNICO;
-- lo no-clínico sigue NULL (comportamiento idéntico al vigente). verificado_por_
-- prestador sigue SIN productor (§14.2 intacta) — este param no lo produce.
-- L-119: firma nueva ⇒ DROP explícito de la vieja antes del CREATE.
DROP FUNCTION IF EXISTS public._crear_evento_padre_auto(uuid, text, text, timestamptz, uuid, uuid, uuid, text, text, jsonb);
CREATE FUNCTION public._crear_evento_padre_auto(
  p_mascota_id uuid, p_tipo text, p_eje_jtbd text, p_fecha_evento timestamptz,
  p_prestador_id uuid, p_empleado_id uuid, p_creado_por_user_id uuid,
  p_creado_por_sistema text, p_country_code text, p_datos jsonb,
  p_procedencia text DEFAULT 'declarado_por_familia'
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_evento_id uuid;
BEGIN
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
    -- clínico ⇒ usa el param (default declarado_por_familia, como antes);
    -- no-clínico ⇒ NULL (idéntico al comportamiento vigente).
    CASE WHEN EXISTS (SELECT 1 FROM cat_tipos_evento c WHERE c.codigo = p_tipo AND c.es_clinico)
         THEN p_procedencia ELSE NULL END
  )
  RETURNING id INTO v_evento_id;

  RETURN v_evento_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public._crear_evento_padre_auto(uuid, text, text, timestamptz, uuid, uuid, uuid, text, text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._crear_evento_padre_auto(uuid, text, text, timestamptz, uuid, uuid, uuid, text, text, jsonb, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 2 — PRESUPUESTO + PRESUPUESTO_ITEM (§8, dec. 3)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE presupuesto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES cuentas_comerciales(id) ON DELETE RESTRICT,
  empleado_id uuid REFERENCES prestador_empleados(id) ON DELETE SET NULL,  -- quien lo emite
  mascota_id uuid NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  familia_id uuid REFERENCES familia(id) ON DELETE SET NULL,                -- el fantasma puede no tener
  caso_clinico_id uuid REFERENCES caso_clinico(id) ON DELETE SET NULL,      -- agrupa, no exige (dec. 4)
  -- origen: de una consulta (cita) y/o del mostrador (atención)
  evento_cita_servicio_id uuid REFERENCES evento_cita_servicio(id) ON DELETE SET NULL,
  evento_atencion_id uuid REFERENCES evento_atencion(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'enviado', 'aprobado', 'rechazado', 'vencido')),
  vence_en timestamptz,                                                     -- obligatoria al enviar (guard)
  aprobado_via text CHECK (aprobado_via IN ('familia_en_app', 'presencial_registrado')),
  aprobado_por_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  aprobado_en timestamptz,
  motivo_rechazo text,
  -- total: SUMA de ítems, jamás editable suelta — mantenido POR TRIGGER (§DDL)
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0),
  country_code text NOT NULL DEFAULT 'EC'
    CHECK (country_code IN ('EC','CO','MX','PE','CL','BR','AR','US')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- GUARD vence_en: todo lo que salió de borrador tiene vencimiento
  CONSTRAINT chk_presupuesto_vence_si_no_borrador
    CHECK (estado = 'borrador' OR vence_en IS NOT NULL),
  -- GUARD coherencia aprobado_via: un aprobado JAMÁS sin vía; una vía JAMÁS sin aprobado
  CONSTRAINT chk_presupuesto_aprobado_coherente
    CHECK ((estado = 'aprobado' AND aprobado_via IS NOT NULL AND aprobado_en IS NOT NULL)
        OR (estado <> 'aprobado' AND aprobado_via IS NULL)),
  -- GUARD: familia_en_app SIEMPRE lleva el user que aprobó; presencial NUNCA
  CONSTRAINT chk_presupuesto_via_app_tiene_user
    CHECK ((aprobado_via = 'familia_en_app' AND aprobado_por_user_id IS NOT NULL)
        OR (aprobado_via = 'presencial_registrado' AND aprobado_por_user_id IS NULL)
        OR (aprobado_via IS NULL)),
  -- GUARD rechazo: motivo sólo tiene sentido en rechazado
  CONSTRAINT chk_presupuesto_motivo_rechazo
    CHECK (motivo_rechazo IS NULL OR estado = 'rechazado')
);

CREATE INDEX idx_presupuesto_mascota ON presupuesto(mascota_id);
CREATE INDEX idx_presupuesto_familia ON presupuesto(familia_id) WHERE familia_id IS NOT NULL;
CREATE INDEX idx_presupuesto_cuenta ON presupuesto(cuenta_comercial_id);
CREATE INDEX idx_presupuesto_caso ON presupuesto(caso_clinico_id) WHERE caso_clinico_id IS NOT NULL;

CREATE TABLE presupuesto_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES presupuesto(id) ON DELETE CASCADE,
  -- procedimiento del catálogo declarativo (los reservable=false de S68) XOR libre
  tipo_servicio_codigo text REFERENCES tipos_servicio(codigo) ON DELETE RESTRICT,
  descripcion_libre text,
  precio numeric NOT NULL CHECK (precio >= 0),
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_presupuesto_item_xor
    CHECK ((tipo_servicio_codigo IS NOT NULL AND descripcion_libre IS NULL)
        OR (tipo_servicio_codigo IS NULL AND descripcion_libre IS NOT NULL))
);

CREATE INDEX idx_presupuesto_item_presupuesto ON presupuesto_item(presupuesto_id);

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3 — EL PUENTE DEL TRIÁNGULO en evento_cita_servicio
-- Decisión técnica (cita→caso vía columna FK, NO tabla puente) — ver reporte.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE evento_cita_servicio
  ADD COLUMN presupuesto_id uuid REFERENCES presupuesto(id) ON DELETE SET NULL,
  ADD COLUMN caso_clinico_id uuid REFERENCES caso_clinico(id) ON DELETE SET NULL;

CREATE INDEX idx_ecs_presupuesto ON evento_cita_servicio(presupuesto_id) WHERE presupuesto_id IS NOT NULL;
CREATE INDEX idx_ecs_caso ON evento_cita_servicio(caso_clinico_id) WHERE caso_clinico_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 4 — total POR TRIGGER + guard de mutación de ítems fuera de borrador
-- ────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION public._trg_presupuesto_item_recalcula_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pid uuid := COALESCE(NEW.presupuesto_id, OLD.presupuesto_id);
BEGIN
  UPDATE presupuesto
  SET total = COALESCE((SELECT SUM(precio * cantidad) FROM presupuesto_item WHERE presupuesto_id = v_pid), 0),
      updated_at = now()
  WHERE id = v_pid;
  RETURN NULL;
END;
$function$;

-- Los ítems SÓLO se tocan en borrador — protege el snapshot del total una vez enviado/aprobado.
CREATE FUNCTION public._trg_presupuesto_item_solo_borrador()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_estado text;
  v_pid uuid := COALESCE(NEW.presupuesto_id, OLD.presupuesto_id);
BEGIN
  SELECT estado INTO v_estado FROM presupuesto WHERE id = v_pid;
  IF v_estado IS NOT NULL AND v_estado <> 'borrador' THEN
    RAISE EXCEPTION 'presupuesto_no_editable' USING ERRCODE = '22023',
      DETAIL = 'Los ítems sólo se modifican mientras el presupuesto está en borrador.';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

CREATE TRIGGER trg_presupuesto_item_solo_borrador
  BEFORE INSERT OR UPDATE OR DELETE ON presupuesto_item
  FOR EACH ROW EXECUTE FUNCTION public._trg_presupuesto_item_solo_borrador();

CREATE TRIGGER trg_presupuesto_item_recalcula_total
  AFTER INSERT OR UPDATE OR DELETE ON presupuesto_item
  FOR EACH ROW EXECUTE FUNCTION public._trg_presupuesto_item_recalcula_total();

CREATE TRIGGER trg_presupuesto_updated_at
  BEFORE UPDATE ON presupuesto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers internos: sin EXECUTE para nadie externo (corren por el motor).
REVOKE EXECUTE ON FUNCTION public._trg_presupuesto_item_recalcula_total() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._trg_presupuesto_item_solo_borrador() FROM PUBLIC, anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 5 — RLS: la familia ve lo suyo · la cuenta emisora ve lo suyo
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_item ENABLE ROW LEVEL SECURITY;

-- Helper: ¿el user opera la cuenta comercial? (owner o empleado activo)
CREATE FUNCTION public._user_opera_cuenta_comercial(p_cuenta_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM cuentas_comerciales cc WHERE cc.id = p_cuenta_id AND cc.owner_profile_id = p_uid
    UNION
    SELECT 1 FROM prestador_empleados pe
      JOIN prestadores p ON p.id = pe.prestador_id
      WHERE p.cuenta_comercial_id = p_cuenta_id AND pe.user_id = p_uid AND pe.activo = true
  );
$function$;
REVOKE EXECUTE ON FUNCTION public._user_opera_cuenta_comercial(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._user_opera_cuenta_comercial(uuid, uuid) TO authenticated;

-- SELECT: familia (codueño/autorizado de la mascota) O la cuenta emisora O admin
CREATE POLICY presupuesto_select_familia ON presupuesto FOR SELECT TO authenticated
  USING (public."_user_es_codueño_mascota"(mascota_id, auth.uid())
      OR public._user_es_familiar_autorizado_mascota(mascota_id, auth.uid()));
CREATE POLICY presupuesto_select_cuenta ON presupuesto FOR SELECT TO authenticated
  USING (public._user_opera_cuenta_comercial(cuenta_comercial_id, auth.uid()));
CREATE POLICY presupuesto_select_admin ON presupuesto FOR SELECT TO authenticated
  USING (is_admin());

-- Escritura directa: NINGUNA. Todo pasa por las RPCs SECURITY DEFINER (puerta única).
-- (Sin policies INSERT/UPDATE/DELETE ⇒ el authenticated no escribe la tabla a mano.)

-- presupuesto_item: se lee si se puede leer su presupuesto padre
CREATE POLICY presupuesto_item_select ON presupuesto_item FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM presupuesto p WHERE p.id = presupuesto_item.presupuesto_id));

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 6 — LAS RPCs (puerta única, L-140 de nacimiento)
-- ────────────────────────────────────────────────────────────────────────────

-- Helper privado: agenda la cita firme del procedimiento con precio congelado.
-- Reusado por las DOS vías de aprobación (in-app y presencial) — una sola verdad.
-- La cita nace SIN fecha/hora (la clínica coordina el día) — estado firme
-- 'confirmada', estado_reserva 'pendiente_pago' (el cobro es al ejecutar,
-- devengo variante (b)), expira_en NULL (el cron de holds la ignora).
CREATE FUNCTION public._agendar_cita_desde_presupuesto(p_presupuesto_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_p presupuesto%ROWTYPE;
  v_prestador_id uuid;
  v_tipo_servicio text;
  v_dur integer;
  v_cita_id uuid;
BEGIN
  SELECT * INTO v_p FROM presupuesto WHERE id = p_presupuesto_id;

  -- prestador de la cuenta: por el empleado emisor si lo hay, si no el primero de la cuenta
  SELECT pe.prestador_id INTO v_prestador_id
  FROM prestador_empleados pe WHERE pe.id = v_p.empleado_id;
  IF v_prestador_id IS NULL THEN
    SELECT id INTO v_prestador_id FROM prestadores
    WHERE cuenta_comercial_id = v_p.cuenta_comercial_id ORDER BY created_at LIMIT 1;
  END IF;

  -- tipo de servicio: el primer ítem con código de catálogo (procedimiento); si
  -- todo es libre, NULL honesto. duración: la del servicio o 30 (default del negocio v1).
  SELECT tipo_servicio_codigo INTO v_tipo_servicio
  FROM presupuesto_item
  WHERE presupuesto_id = p_presupuesto_id AND tipo_servicio_codigo IS NOT NULL
  ORDER BY created_at LIMIT 1;

  v_dur := COALESCE((SELECT duracion_default_minutos FROM tipos_servicio WHERE codigo = v_tipo_servicio), 30);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva,
    expira_en, country_code, modalidad, presupuesto_id, caso_clinico_id, metadata
  ) VALUES (
    (SELECT user_id FROM mascotas WHERE id = v_p.mascota_id),
    v_p.mascota_id, v_prestador_id, v_p.empleado_id, v_tipo_servicio,
    NULL, NULL, v_p.total, v_dur, 'confirmada', 'pendiente_pago',
    NULL, v_p.country_code, 'presencial', v_p.id, v_p.caso_clinico_id,
    jsonb_build_object('origen', 'presupuesto_aprobado', 'precio_congelado', true)
  ) RETURNING id INTO v_cita_id;

  RETURN v_cita_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public._agendar_cita_desde_presupuesto(uuid) FROM PUBLIC, anon, authenticated;

-- crear_presupuesto_borrador (+ítems) — gate: opera la cuenta Y tiene acceso a la mascota
CREATE FUNCTION public.crear_presupuesto_borrador(
  p_cuenta_comercial_id uuid, p_mascota_id uuid, p_items jsonb,
  p_familia_id uuid DEFAULT NULL, p_caso_clinico_id uuid DEFAULT NULL,
  p_evento_cita_servicio_id uuid DEFAULT NULL, p_evento_atencion_id uuid DEFAULT NULL,
  p_empleado_id uuid DEFAULT NULL, p_country_code text DEFAULT 'EC'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_presupuesto_id uuid;
  v_item jsonb;
  v_tipo text;
  v_desc text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = p_cuenta_comercial_id
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_country_code NOT IN ('EC','CO','MX','PE','CL','BR','AR','US') THEN
    RAISE EXCEPTION 'country_invalido' USING ERRCODE = '22023';
  END IF;

  INSERT INTO presupuesto (
    cuenta_comercial_id, empleado_id, mascota_id, familia_id, caso_clinico_id,
    evento_cita_servicio_id, evento_atencion_id, country_code, estado
  ) VALUES (
    p_cuenta_comercial_id, p_empleado_id, p_mascota_id, p_familia_id, p_caso_clinico_id,
    p_evento_cita_servicio_id, p_evento_atencion_id, p_country_code, 'borrador'
  ) RETURNING id INTO v_presupuesto_id;

  IF p_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      v_tipo := NULLIF(v_item ->> 'tipo_servicio_codigo', '');
      v_desc := NULLIF(v_item ->> 'descripcion_libre', '');
      INSERT INTO presupuesto_item (presupuesto_id, tipo_servicio_codigo, descripcion_libre, precio, cantidad)
      VALUES (
        v_presupuesto_id, v_tipo, v_desc,
        (v_item ->> 'precio')::numeric,
        COALESCE((v_item ->> 'cantidad')::integer, 1)
      );
    END LOOP;
  END IF;

  RETURN v_presupuesto_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.crear_presupuesto_borrador(uuid, uuid, jsonb, uuid, uuid, uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_presupuesto_borrador(uuid, uuid, jsonb, uuid, uuid, uuid, uuid, uuid, text) TO authenticated;

-- enviar_presupuesto — exige ≥1 ítem y vence_en futura; gate: cuenta emisora
CREATE FUNCTION public.enviar_presupuesto(p_presupuesto_id uuid, p_vence_en timestamptz)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_p presupuesto%ROWTYPE;
  v_n_items integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_p FROM presupuesto WHERE id = p_presupuesto_id;
  IF v_p.id IS NULL THEN RAISE EXCEPTION 'presupuesto_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT public._user_opera_cuenta_comercial(v_p.cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF v_p.estado <> 'borrador' THEN RAISE EXCEPTION 'presupuesto_no_es_borrador' USING ERRCODE = '22023'; END IF;
  IF p_vence_en IS NULL THEN RAISE EXCEPTION 'vence_en_requerido' USING ERRCODE = '22023'; END IF;
  IF p_vence_en <= now() THEN RAISE EXCEPTION 'vence_en_pasada' USING ERRCODE = '22023'; END IF;
  SELECT count(*) INTO v_n_items FROM presupuesto_item WHERE presupuesto_id = p_presupuesto_id;
  IF v_n_items < 1 THEN RAISE EXCEPTION 'presupuesto_sin_items' USING ERRCODE = '22023'; END IF;

  UPDATE presupuesto SET estado = 'enviado', vence_en = p_vence_en, updated_at = now()
  WHERE id = p_presupuesto_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.enviar_presupuesto(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enviar_presupuesto(uuid, timestamptz) TO authenticated;

-- aprobar_presupuesto_familia — gate: codueño/autorizado de la mascota; agenda la cita
CREATE FUNCTION public.aprobar_presupuesto_familia(p_presupuesto_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_p presupuesto%ROWTYPE;
  v_cita_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_p FROM presupuesto WHERE id = p_presupuesto_id;
  IF v_p.id IS NULL THEN RAISE EXCEPTION 'presupuesto_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT (public."_user_es_codueño_mascota"(v_p.mascota_id, v_uid)
       OR public._user_es_familiar_autorizado_mascota(v_p.mascota_id, v_uid)) THEN
    RAISE EXCEPTION 'no_es_familia' USING ERRCODE = '42501';
  END IF;
  IF v_p.estado <> 'enviado' THEN RAISE EXCEPTION 'presupuesto_no_enviado' USING ERRCODE = '22023'; END IF;
  IF v_p.vence_en <= now() THEN RAISE EXCEPTION 'presupuesto_vencido' USING ERRCODE = '22023'; END IF;

  v_cita_id := public._agendar_cita_desde_presupuesto(p_presupuesto_id);

  UPDATE presupuesto
  SET estado = 'aprobado', aprobado_via = 'familia_en_app',
      aprobado_por_user_id = v_uid, aprobado_en = now(), updated_at = now()
  WHERE id = p_presupuesto_id;

  RETURN jsonb_build_object('cita_id', v_cita_id, 'estado', 'aprobado', 'aprobado_via', 'familia_en_app');
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.aprobar_presupuesto_familia(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aprobar_presupuesto_familia(uuid) TO authenticated;

-- registrar_aprobacion_presencial — gate: cuenta emisora; estampa presencial y agenda
CREATE FUNCTION public.registrar_aprobacion_presencial(p_presupuesto_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_p presupuesto%ROWTYPE;
  v_cita_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_p FROM presupuesto WHERE id = p_presupuesto_id;
  IF v_p.id IS NULL THEN RAISE EXCEPTION 'presupuesto_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT public._user_opera_cuenta_comercial(v_p.cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF v_p.estado <> 'enviado' THEN RAISE EXCEPTION 'presupuesto_no_enviado' USING ERRCODE = '22023'; END IF;
  IF v_p.vence_en <= now() THEN RAISE EXCEPTION 'presupuesto_vencido' USING ERRCODE = '22023'; END IF;

  v_cita_id := public._agendar_cita_desde_presupuesto(p_presupuesto_id);

  UPDATE presupuesto
  SET estado = 'aprobado', aprobado_via = 'presencial_registrado',
      aprobado_por_user_id = NULL, aprobado_en = now(), updated_at = now()
  WHERE id = p_presupuesto_id;

  RETURN jsonb_build_object('cita_id', v_cita_id, 'estado', 'aprobado', 'aprobado_via', 'presencial_registrado');
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.registrar_aprobacion_presencial(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_aprobacion_presencial(uuid) TO authenticated;

-- rechazar_presupuesto — gate: la familia declina en su app
CREATE FUNCTION public.rechazar_presupuesto(p_presupuesto_id uuid, p_motivo text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_p presupuesto%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_p FROM presupuesto WHERE id = p_presupuesto_id;
  IF v_p.id IS NULL THEN RAISE EXCEPTION 'presupuesto_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT (public."_user_es_codueño_mascota"(v_p.mascota_id, v_uid)
       OR public._user_es_familiar_autorizado_mascota(v_p.mascota_id, v_uid)) THEN
    RAISE EXCEPTION 'no_es_familia' USING ERRCODE = '42501';
  END IF;
  IF v_p.estado <> 'enviado' THEN RAISE EXCEPTION 'presupuesto_no_enviado' USING ERRCODE = '22023'; END IF;

  UPDATE presupuesto SET estado = 'rechazado', motivo_rechazo = p_motivo, updated_at = now()
  WHERE id = p_presupuesto_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.rechazar_presupuesto(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rechazar_presupuesto(uuid, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 7 — VERIFICACIÓN IMPERATIVA (fixtures self-contained, ROLLBACK residuo 0)
-- ────────────────────────────────────────────────────────────────────────────
DO $verif$
DECLARE
  v_vet uuid := gen_random_uuid();
  v_fam uuid := gen_random_uuid();
  v_cuenta uuid; v_familia uuid; v_mascota uuid;
  v_pid uuid; v_pid2 uuid; v_pid3 uuid; v_pid4 uuid;
  v_res jsonb; v_cita uuid;
  v_total numeric; v_estado text; v_via text; v_aprob uuid;
  v_precio numeric; v_dur integer; v_cita_estado text;
  v_tipo_clin text;
  v_anon_bad text;
  v_ok boolean;
  v_n integer;
BEGIN
  BEGIN  -- ── savepoint: todo lo de acá se deshace por el sentinela final ──
    -- Fixtures
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_vet, 'authenticated','authenticated','s69-vet@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000'),
           (v_fam, 'authenticated','authenticated','s69-fam@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');

    INSERT INTO familia (nombre, tipo, country_code, created_by_user_id)
    VALUES ('Familia Verif S69', 'estandar', 'EC', v_fam) RETURNING id INTO v_familia;
    INSERT INTO familia_miembro (id, familia_id, user_id, rol, desde, created_at, updated_at)
    VALUES (gen_random_uuid(), v_familia, v_fam, 'adulto_titular', now(), now(), now());

    INSERT INTO cuentas_comerciales (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    VALUES (v_vet, 'persona_natural', '9999999999', 'Clínica Verif S69', 'Verif Vet', 'EC') RETURNING id INTO v_cuenta;

    INSERT INTO mascotas (nombre, origen, familia_id, user_id, especie, country_code)
    VALUES ('Verif Pet', 'desconocido', v_familia, v_fam, 'perro', 'EC') RETURNING id INTO v_mascota;
    INSERT INTO mascota_codueño (mascota_id, user_id, familia_id, desde, agregado_por_user_id)
    VALUES (v_mascota, v_fam, v_familia, now(), v_fam);
    INSERT INTO mascota_acceso_prestador (mascota_id, cuenta_comercial_id, otorgado_por_user_id, metodo_otorgamiento)
    VALUES (v_mascota, v_cuenta, v_vet, 'busqueda_app_cliente');

    -- ── CICLO FELIZ in-app ──
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_pid := crear_presupuesto_borrador(
      v_cuenta, v_mascota,
      jsonb_build_array(
        jsonb_build_object('tipo_servicio_codigo','cirugia','precio',200,'cantidad',1),
        jsonb_build_object('descripcion_libre','Gasas y material','precio',15,'cantidad',2)
      ),
      v_familia);
    SELECT total INTO v_total FROM presupuesto WHERE id = v_pid;
    IF v_total <> 230 THEN RAISE EXCEPTION 'A1 abort: total esperado 230, es % (trigger de total roto)', v_total; END IF;

    PERFORM enviar_presupuesto(v_pid, now() + interval '7 days');
    SELECT estado INTO v_estado FROM presupuesto WHERE id = v_pid;
    IF v_estado <> 'enviado' THEN RAISE EXCEPTION 'A1 abort: tras enviar, estado=% (esperado enviado)', v_estado; END IF;

    -- aprueba la familia
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_fam, 'role', 'authenticated')::text, true);
    v_res := aprobar_presupuesto_familia(v_pid);
    v_cita := (v_res ->> 'cita_id')::uuid;
    SELECT estado, aprobado_via, aprobado_por_user_id INTO v_estado, v_via, v_aprob FROM presupuesto WHERE id = v_pid;
    IF v_estado <> 'aprobado' OR v_via <> 'familia_en_app' OR v_aprob <> v_fam THEN
      RAISE EXCEPTION 'A1 abort: aprobación in-app incoherente (estado=% via=% aprob=%)', v_estado, v_via, v_aprob;
    END IF;
    SELECT precio, duracion_minutos, estado, presupuesto_id INTO v_precio, v_dur, v_cita_estado, v_pid4 FROM evento_cita_servicio WHERE id = v_cita;
    IF v_precio <> 230 THEN RAISE EXCEPTION 'A1 abort: precio congelado de la cita=% (esperado 230)', v_precio; END IF;
    IF v_dur <> 120 THEN RAISE EXCEPTION 'A1 abort: duración de la cita=% (esperado 120 de cirugía)', v_dur; END IF;
    IF v_cita_estado <> 'confirmada' THEN RAISE EXCEPTION 'A1 abort: la cita nació en % (esperado confirmada)', v_cita_estado; END IF;
    IF v_pid4 <> v_pid THEN RAISE EXCEPTION 'A1 abort: la cita no porta presupuesto_id'; END IF;

    -- re-aprobar el mismo ⇒ error (ya no está enviado)
    v_ok := false;
    BEGIN PERFORM aprobar_presupuesto_familia(v_pid);
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%no_enviado%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A1 abort: re-aprobar un aprobado no reventó'; END IF;

    -- ── APROBACIÓN PRESENCIAL ──
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_pid2 := crear_presupuesto_borrador(v_cuenta, v_mascota,
      jsonb_build_array(jsonb_build_object('tipo_servicio_codigo','ecografia','precio',40,'cantidad',1)), v_familia);
    PERFORM enviar_presupuesto(v_pid2, now() + interval '3 days');
    v_res := registrar_aprobacion_presencial(v_pid2);
    SELECT estado, aprobado_via, aprobado_por_user_id INTO v_estado, v_via, v_aprob FROM presupuesto WHERE id = v_pid2;
    IF v_estado <> 'aprobado' OR v_via <> 'presencial_registrado' OR v_aprob IS NOT NULL THEN
      RAISE EXCEPTION 'A1 abort: presencial incoherente (estado=% via=% aprob=%)', v_estado, v_via, v_aprob;
    END IF;
    IF (v_res ->> 'cita_id') IS NULL THEN RAISE EXCEPTION 'A1 abort: presencial no agendó cita'; END IF;

    -- ── RECHAZO ──
    v_pid3 := crear_presupuesto_borrador(v_cuenta, v_mascota,
      jsonb_build_array(jsonb_build_object('descripcion_libre','Consulta','precio',25,'cantidad',1)), v_familia);
    PERFORM enviar_presupuesto(v_pid3, now() + interval '5 days');
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_fam, 'role', 'authenticated')::text, true);
    PERFORM rechazar_presupuesto(v_pid3, 'Muy caro por ahora');
    SELECT estado INTO v_estado FROM presupuesto WHERE id = v_pid3;
    IF v_estado <> 'rechazado' THEN RAISE EXCEPTION 'A1 abort: tras rechazar, estado=% (esperado rechazado)', v_estado; END IF;

    -- ── VENCIDO PEREZOSO: enviado con vence_en pasada ⇒ aprobar revienta ──
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_pid4 := crear_presupuesto_borrador(v_cuenta, v_mascota,
      jsonb_build_array(jsonb_build_object('tipo_servicio_codigo','laboratorio','precio',30,'cantidad',1)), v_familia);
    PERFORM enviar_presupuesto(v_pid4, now() + interval '1 day');
    UPDATE presupuesto SET vence_en = now() - interval '1 hour' WHERE id = v_pid4;  -- fuerza el vencimiento
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_fam, 'role', 'authenticated')::text, true);
    v_ok := false;
    BEGIN PERFORM aprobar_presupuesto_familia(v_pid4);
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%vencido%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A1 abort: aprobar un vencido no reventó'; END IF;

    -- ── XOR de ítems: ambos ⇒ CHECK; ninguno ⇒ CHECK ──
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_ok := false;
    BEGIN PERFORM crear_presupuesto_borrador(v_cuenta, v_mascota,
      jsonb_build_array(jsonb_build_object('tipo_servicio_codigo','cirugia','descripcion_libre','ambos','precio',10)), v_familia);
    EXCEPTION WHEN check_violation THEN v_ok := true; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A1 abort: ítem con AMBOS (tipo+libre) no reventó el XOR'; END IF;
    v_ok := false;
    BEGIN PERFORM crear_presupuesto_borrador(v_cuenta, v_mascota,
      jsonb_build_array(jsonb_build_object('precio',10)), v_familia);
    EXCEPTION WHEN check_violation THEN v_ok := true; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A1 abort: ítem con NINGUNO (ni tipo ni libre) no reventó el XOR'; END IF;

    -- ── COHERENCIA aprobado_via: un aprobado sin vía es IMPOSIBLE (CHECK directo) ──
    v_ok := false;
    BEGIN UPDATE presupuesto SET estado = 'aprobado' WHERE id = v_pid3;  -- sin via ⇒ CHECK
    EXCEPTION WHEN check_violation THEN v_ok := true; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A1 abort: un aprobado SIN vía pasó el guard (imposible debía ser)'; END IF;

    -- ── PROCEDENCIA: 3er valor pasa; clínico sin procedencia revienta ──
    SELECT codigo INTO v_tipo_clin FROM cat_tipos_evento WHERE es_clinico = true LIMIT 1;
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, country_code, procedencia)
    VALUES (v_mascota, v_tipo_clin, 'salud', now(), v_vet, 'EC', 'declarado_por_prestador');
    v_ok := false;
    BEGIN
      INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, country_code, procedencia)
      VALUES (v_mascota, v_tipo_clin, 'salud', now(), v_vet, 'EC', NULL);
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%procedencia_requerida%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A1 abort: clínico SIN procedencia no reventó'; END IF;

    -- ── SONDA L-140: ninguna función nueva/tocada con anon en proacl ──
    SELECT string_agg(p.proname, ', ') INTO v_anon_bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('crear_presupuesto_borrador','enviar_presupuesto','aprobar_presupuesto_familia',
                        'registrar_aprobacion_presencial','rechazar_presupuesto','_agendar_cita_desde_presupuesto',
                        '_user_opera_cuenta_comercial','_crear_evento_padre_auto',
                        '_trg_presupuesto_item_recalcula_total','_trg_presupuesto_item_solo_borrador')
      AND array_to_string(COALESCE(p.proacl, ARRAY[]::aclitem[]), ',') LIKE '%anon=%';
    IF v_anon_bad IS NOT NULL THEN RAISE EXCEPTION 'A1 abort L-140: funciones con anon en proacl: %', v_anon_bad; END IF;

    -- sentinela: deshace TODOS los fixtures — residuo 0
    RAISE EXCEPTION 'S69_A1_ASSERTS_OK -> ciclo in-app + presencial + rechazo + vencido + XOR + coherencia + procedencia 3er nivel + sonda L-140: 10/10';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM NOT LIKE 'S69_A1_ASSERTS_OK%' THEN RAISE; END IF;
      RAISE NOTICE '%', SQLERRM;
  END;
END;
$verif$;

-- ============================================================================
-- FIN S69-A1. Presupuesto (máquina de estados chica) + puente caso⇄cita
-- (columnas FK en la cita) + procedencia 3er nivel. RPCs L-140 de nacimiento.
-- ============================================================================
