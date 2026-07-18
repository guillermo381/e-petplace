-- ============================================================================
-- S69-A1bis — EL MOTOR DEL MOSTRADOR (walk-in) — MODELO_VETERINARIA §7
-- Hueco hallado por la B (regla 40): A1 sólo parió el presupuesto; el mostrador
-- necesita su puerta de creación firme + el cobro presencial como DATO.
-- Decisiones founder: (1) walk-in v1 REGISTRA el cobro presencial, cero fee
-- sobre lo no transaccionado (FINANCIERO §2.5). Secuenciada DESPUÉS de A2: el
-- par L-133 (AFTER INSERT) ya existe y DEDUPEA (no otorga de más).
--
-- DECLARACIÓN 76(g): DDL puro (1 tabla nueva) + 3 funciones nuevas + 1 re-crea
-- aditiva del trigger de vacunación (productor del 3er nivel de procedencia).
-- Verificación con fixtures self-contained + ROLLBACK. NO RIGE VEDA.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 1 — cobro_presencial_registrado: el cobro como DATO de primera clase
-- NO columnas en evento_cita_servicio (chasis compartido de 4 oficios), NO
-- metadata (el reporte de rentabilidad lo agrega por SQL). Cero devengo/fee.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE cobro_presencial_registrado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_cita_servicio_id uuid NOT NULL UNIQUE REFERENCES evento_cita_servicio(id) ON DELETE CASCADE,
  monto numeric NOT NULL CHECK (monto >= 0),
  medio text NOT NULL CHECK (medio IN ('efectivo', 'tarjeta', 'transferencia')),
  registrado_por_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  country_code text NOT NULL DEFAULT 'EC'
    CHECK (country_code IN ('EC','CO','MX','PE','CL','BR','AR','US')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- UNIQUE(evento_cita_servicio_id) = idempotencia v1: un cobro por cita (la corrección es soporte).

ALTER TABLE cobro_presencial_registrado ENABLE ROW LEVEL SECURITY;
-- Lo lee la cuenta emisora (reporte de rentabilidad) o admin. Escritura: sólo por RPC.
CREATE POLICY cobro_presencial_select_cuenta ON cobro_presencial_registrado FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM evento_cita_servicio ecs
    JOIN prestadores p ON p.id = ecs.prestador_id
    WHERE ecs.id = cobro_presencial_registrado.evento_cita_servicio_id
      AND public._user_opera_cuenta_comercial(p.cuenta_comercial_id, auth.uid())
  ));
CREATE POLICY cobro_presencial_select_admin ON cobro_presencial_registrado FOR SELECT TO authenticated
  USING (is_admin());

CREATE TRIGGER trg_cobro_presencial_updated_at
  BEFORE UPDATE ON cobro_presencial_registrado
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 2 — registrar_atencion_mostrador: la puerta pública del walk-in
-- Crea UNA cita FIRME (nace confirmada). El día clínico se compone por
-- es_medico=true (canon S69) — el guard exige tipo médico Y servicio activo del
-- prestador. Ocupación: entra al motor de ventana como cualquier hermana (la
-- persona estaba atendiendo — la agenda dice la verdad, sin bloqueo de slot).
-- ────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION public.registrar_atencion_mostrador(
  p_prestador_id uuid, p_mascota_id uuid, p_tipo_servicio_codigo text, p_precio numeric,
  p_empleado_id uuid DEFAULT NULL, p_hora time DEFAULT NULL, p_fecha date DEFAULT NULL,
  p_country_code text DEFAULT 'EC'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
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

  -- acceso a la mascota: las vías walkin_origen / alta_asistida ya lo otorgan.
  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = v_cuenta
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;

  -- el día clínico se compone por es_medico=true (canon S69)
  IF NOT EXISTS (SELECT 1 FROM tipos_servicio WHERE codigo = p_tipo_servicio_codigo AND es_medico = true) THEN
    RAISE EXCEPTION 'tipo_no_medico' USING ERRCODE = '22023';
  END IF;
  -- servicio activo del prestador (su menú vivo)
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

  -- empleado: N=1 resuelve al único activo si no se pasa
  IF v_empleado IS NULL THEN
    SELECT id INTO v_empleado FROM prestador_empleados
    WHERE prestador_id = p_prestador_id AND activo = true
    LIMIT 1;
    -- si hay >1, queda NULL (el mostrador debe declarar la persona); si hay 1, ese
    IF (SELECT count(*) FROM prestador_empleados WHERE prestador_id = p_prestador_id AND activo = true) > 1 THEN
      v_empleado := p_empleado_id;  -- ambiguo: sólo lo que vino explícito (NULL)
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
  -- El par L-133 (A2, AFTER INSERT) dedupea: el acceso ya existe (guard de arriba).

  RETURN v_cita_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.registrar_atencion_mostrador(uuid, uuid, text, numeric, uuid, time, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_atencion_mostrador(uuid, uuid, text, numeric, uuid, time, date, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3 — registrar_cobro_presencial: el cobro como dato (cero fee/devengo)
-- ────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION public.registrar_cobro_presencial(p_cita_id uuid, p_monto numeric, p_medio text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_cuenta uuid;
  v_country text;
  v_cobro_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  SELECT p.cuenta_comercial_id, ecs.country_code INTO v_cuenta, v_country
  FROM evento_cita_servicio ecs
  LEFT JOIN prestadores p ON p.id = ecs.prestador_id
  WHERE ecs.id = p_cita_id;
  IF v_country IS NULL THEN RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023'; END IF;
  IF v_cuenta IS NULL OR NOT public._user_opera_cuenta_comercial(v_cuenta, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF p_monto IS NULL OR p_monto < 0 THEN RAISE EXCEPTION 'monto_invalido' USING ERRCODE = '22023'; END IF;
  IF p_medio NOT IN ('efectivo','tarjeta','transferencia') THEN RAISE EXCEPTION 'medio_invalido' USING ERRCODE = '22023'; END IF;

  BEGIN
    INSERT INTO cobro_presencial_registrado (evento_cita_servicio_id, monto, medio, registrado_por_user_id, country_code)
    VALUES (p_cita_id, p_monto, p_medio, v_uid, v_country)
    RETURNING id INTO v_cobro_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'cobro_ya_registrado' USING ERRCODE = '22023';
  END;

  RETURN v_cobro_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.registrar_cobro_presencial(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_cobro_presencial(uuid, numeric, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 4 — PRODUCTOR del 3er nivel: la vacunación registrada por prestador
-- El registrable de vacunación del mostrador viaja por la tipada existente
-- (evento_vacuna_aplicada → este trigger → _crear_evento_padre_auto) SIN
-- atención rica (el Durante es V4). Con prestador ⇒ declarado_por_prestador;
-- carnet del dueño (sin prestador) ⇒ declarado_por_familia (idéntico a hoy).
-- verificado_por_prestador sigue SIN productor (§14.2 intacta).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_vacuna_crear_evento()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.evento_id IS NULL THEN
    NEW.evento_id := _crear_evento_padre_auto(
      NEW.mascota_id, 'vacuna_aplicada', 'salud',
      COALESCE(NEW.fecha_aplicada::timestamptz, now()),
      NEW.prestador_id, NEW.empleado_id,
      auth.uid(), CASE WHEN auth.uid() IS NULL THEN 'sistema' ELSE NULL END,
      NEW.country_code,
      jsonb_build_object('vacuna', NEW.nombre_vacuna, 'tipo_vacuna', NEW.tipo_vacuna),
      CASE WHEN NEW.prestador_id IS NOT NULL THEN 'declarado_por_prestador' ELSE 'declarado_por_familia' END
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 5 — VERIFICACIÓN IMPERATIVA (fixtures self-contained, ROLLBACK residuo 0)
-- ────────────────────────────────────────────────────────────────────────────
DO $verif$
DECLARE
  v_vet uuid := gen_random_uuid();
  v_cuenta uuid; v_prestador uuid; v_mascota uuid;
  v_cita uuid; v_cobro uuid;
  v_econ_antes int; v_econ_desp int;
  v_estado text; v_precio numeric; v_origen text;
  v_proc text; v_vac_evento uuid;
  v_ok boolean; v_bad text; v_n int;
BEGIN
  BEGIN  -- savepoint
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_vet, 'authenticated','authenticated','s69bis-vet@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');
    INSERT INTO cuentas_comerciales (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    VALUES (v_vet, 'persona_natural', 'BIS-9999', 'Clínica Bis Verif', 'Bis Vet', 'EC') RETURNING id INTO v_cuenta;
    INSERT INTO prestadores (user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id)
    VALUES (v_vet, 'clinica_veterinaria', 'Bis Vet', '0999000111', v_cuenta) RETURNING id INTO v_prestador;
    -- verificación §14.2 aprobada (consulta_general requiere_validacion_admin=true)
    INSERT INTO prestador_documentos (prestador_id, tipo, nombre, archivo_url, estado)
    VALUES (v_prestador, 'titulo_profesional', 'Título Verif', 'doc/verif.pdf', 'aprobado');
    -- menú vivo: consulta_general activa
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (v_prestador, 'consulta_general', 25, 30, true);

    -- mascota fantasma por la puerta walk-in (otorga walkin_origen)
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_mascota := crear_mascota_walkin(v_prestador, 'Mostrador Pet', 'perro', 'EC');

    -- ── registrar_atencion_mostrador: cita firme HOY ──
    v_cita := registrar_atencion_mostrador(v_prestador, v_mascota, 'consulta_general', 25);
    SELECT estado, precio, metadata ->> 'origen' INTO v_estado, v_precio, v_origen FROM evento_cita_servicio WHERE id = v_cita;
    IF v_estado <> 'confirmada' THEN RAISE EXCEPTION 'A1bis abort: la cita de mostrador nació en % (esperado confirmada)', v_estado; END IF;
    IF v_precio <> 25 THEN RAISE EXCEPTION 'A1bis abort: precio snapshot = % (esperado 25)', v_precio; END IF;
    IF v_origen <> 'mostrador' THEN RAISE EXCEPTION 'A1bis abort: metadata.origen = % (esperado mostrador)', v_origen; END IF;
    IF (SELECT fecha FROM evento_cita_servicio WHERE id = v_cita) <> current_date THEN
      RAISE EXCEPTION 'A1bis abort: la cita de mostrador no nació HOY';
    END IF;

    -- guard: tipo no médico revienta
    v_ok := false;
    BEGIN PERFORM registrar_atencion_mostrador(v_prestador, v_mascota, 'paseo_30', 10);
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%tipo_no_medico%' OR SQLERRM LIKE '%servicio_no_activo%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A1bis abort: mostrador aceptó tipo no médico'; END IF;

    -- ── registrar_cobro_presencial: dato, cero devengo ──
    SELECT count(*) INTO v_econ_antes FROM eventos_economicos;
    v_cobro := registrar_cobro_presencial(v_cita, 25, 'efectivo');
    SELECT count(*) INTO v_econ_desp FROM eventos_economicos;
    IF v_econ_desp <> v_econ_antes THEN
      RAISE EXCEPTION 'A1bis abort: el cobro presencial creó % eventos económicos (debía ser 0)', v_econ_desp - v_econ_antes;
    END IF;
    IF (SELECT monto FROM cobro_presencial_registrado WHERE id = v_cobro) <> 25 THEN
      RAISE EXCEPTION 'A1bis abort: el cobro no guardó el monto';
    END IF;

    -- idempotencia: segundo cobro sobre la misma cita revienta
    v_ok := false;
    BEGIN PERFORM registrar_cobro_presencial(v_cita, 25, 'tarjeta');
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%cobro_ya_registrado%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A1bis abort: se registró un segundo cobro (idempotencia rota)'; END IF;

    -- ── PRODUCTOR 3er nivel: vacunación con prestador ⇒ declarado_por_prestador ──
    INSERT INTO evento_vacuna_aplicada (mascota_id, nombre_vacuna, fecha_aplicada, prestador_id, country_code)
    VALUES (v_mascota, 'Antirrábica', current_date, v_prestador, 'EC') RETURNING evento_id INTO v_vac_evento;
    SELECT procedencia INTO v_proc FROM eventos_mascota WHERE id = v_vac_evento;
    IF v_proc <> 'declarado_por_prestador' THEN
      RAISE EXCEPTION 'A1bis abort: vacunación de prestador con procedencia % (esperado declarado_por_prestador)', v_proc;
    END IF;
    -- carnet del dueño (sin prestador) ⇒ declarado_por_familia (intacto)
    INSERT INTO evento_vacuna_aplicada (mascota_id, nombre_vacuna, fecha_aplicada, country_code)
    VALUES (v_mascota, 'Polivalente', current_date, 'EC') RETURNING evento_id INTO v_vac_evento;
    SELECT procedencia INTO v_proc FROM eventos_mascota WHERE id = v_vac_evento;
    IF v_proc <> 'declarado_por_familia' THEN
      RAISE EXCEPTION 'A1bis abort: vacunación de carnet con procedencia % (esperado declarado_por_familia)', v_proc;
    END IF;

    -- ── SONDA L-140 ──
    SELECT string_agg(p.proname, ', ') INTO v_bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('registrar_atencion_mostrador','registrar_cobro_presencial')
      AND array_to_string(COALESCE(p.proacl, ARRAY[]::aclitem[]), ',') LIKE '%anon=%';
    IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'A1bis abort L-140: funciones con anon: %', v_bad; END IF;

    RAISE EXCEPTION 'S69_A1BIS_ASSERTS_OK -> cita mostrador firme HOY + guard es_medico + cobro-dato cero-devengo + idempotencia + productor procedencia 3er nivel + sonda L-140';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM NOT LIKE 'S69_A1BIS_ASSERTS_OK%' THEN RAISE; END IF;
      RAISE NOTICE '%', SQLERRM;
  END;
END;
$verif$;

-- ============================================================================
-- FIN S69-A1bis.
-- ============================================================================
