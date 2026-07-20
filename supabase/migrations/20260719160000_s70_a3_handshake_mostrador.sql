-- S70-A3 + A3bis — HANDSHAKE MOSTRADOR (letra founder S70).
-- Un paso, por mascota, historia recién al autorizar. 76(g): aditiva
-- (tabla + funciones nuevas; enmienda de 2 lectores sin cambio de firma).
-- L-140 al cierre.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. BÚSQUEDA ENMENDADA — la rama 'registrado' devuelve SOLO mascotas activas
--    [{mascota_id, nombre, foto_url}]; muere familias[]+counts. Las dos llaves.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.buscar_cliente_por_telefono(p_telefono text, p_country_code text DEFAULT 'EC'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_norm text;
  v_user_id uuid;
  v_nombre text;
  v_pendiente_id uuid;
  v_pendiente_prestador_id uuid;
  v_pendiente_expira timestamptz;
  v_mascotas jsonb;
BEGIN
  IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe WHERE pe.user_id = v_auth_uid AND pe.activo = true
    UNION SELECT 1 FROM prestadores p WHERE p.user_id = v_auth_uid
  ) THEN
    RAISE EXCEPTION 'invocador_no_es_prestador' USING ERRCODE = '42501';
  END IF;

  v_norm := public.normalizar_telefono(p_telefono, p_country_code);
  IF v_norm IS NULL THEN RAISE EXCEPTION 'telefono_required' USING ERRCODE = '22023'; END IF;

  SELECT id, nombre INTO v_user_id, v_nombre
  FROM profiles WHERE public.normalizar_telefono(telefono, p_country_code) = v_norm LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- ENMIENDA S70-A3: mascotas activas de las familias estandar donde el
    -- user es adulto_titular — nada más (ni especie, ni edad, ni counts).
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'mascota_id', m.id, 'nombre', m.nombre, 'foto_url', m.foto_url
    ) ORDER BY m.nombre), '[]'::jsonb) INTO v_mascotas
    FROM familia_miembro fm
    JOIN familia f ON f.id = fm.familia_id
    JOIN mascotas m ON m.familia_id = f.id AND m.estado_vida = 'activa'
    WHERE fm.user_id = v_user_id AND fm.rol = 'adulto_titular' AND fm.hasta IS NULL AND f.tipo = 'estandar';

    RETURN jsonb_build_object('existe', 'registrado', 'user_id', v_user_id, 'nombre', v_nombre, 'mascotas', v_mascotas);
  END IF;

  SELECT id, creado_por_prestador_id, expira_en
  INTO v_pendiente_id, v_pendiente_prestador_id, v_pendiente_expira
  FROM cliente_pendiente_registro
  WHERE country_code = p_country_code AND telefono_normalizado = v_norm
    AND completado_en IS NULL AND soporte_resuelto_en IS NULL
  LIMIT 1;

  IF v_pendiente_id IS NOT NULL THEN
    RETURN jsonb_build_object('existe', 'pendiente', 'pendiente_id', v_pendiente_id,
      'creado_por_prestador_id', v_pendiente_prestador_id, 'expira_en', v_pendiente_expira);
  END IF;

  RETURN jsonb_build_object('existe', 'no_registrado', 'telefono', p_telefono);
END;
$function$;

-- gemelo email (hallazgo B0-2: body no versionado) — versionado + MISMA enmienda
CREATE OR REPLACE FUNCTION public.buscar_cliente_por_email(p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_email_lower text := LOWER(trim(p_email));
  v_user_id uuid;
  v_nombre text;
  v_pendiente_id uuid;
  v_pendiente_prestador_id uuid;
  v_pendiente_expira timestamptz;
  v_mascotas jsonb;
BEGIN
  IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF v_email_lower IS NULL OR length(v_email_lower) = 0 THEN
    RAISE EXCEPTION 'email_required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe WHERE pe.user_id = v_auth_uid AND pe.activo = true
    UNION SELECT 1 FROM prestadores p WHERE p.user_id = v_auth_uid
  ) THEN
    RAISE EXCEPTION 'invocador_no_es_prestador' USING ERRCODE = '42501';
  END IF;

  SELECT id, nombre INTO v_user_id, v_nombre
  FROM profiles WHERE LOWER(email) = v_email_lower LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'mascota_id', m.id, 'nombre', m.nombre, 'foto_url', m.foto_url
    ) ORDER BY m.nombre), '[]'::jsonb) INTO v_mascotas
    FROM familia_miembro fm
    JOIN familia f ON f.id = fm.familia_id
    JOIN mascotas m ON m.familia_id = f.id AND m.estado_vida = 'activa'
    WHERE fm.user_id = v_user_id AND fm.rol = 'adulto_titular' AND fm.hasta IS NULL AND f.tipo = 'estandar';

    RETURN jsonb_build_object('existe', 'registrado', 'user_id', v_user_id, 'nombre', v_nombre, 'mascotas', v_mascotas);
  END IF;

  SELECT id, creado_por_prestador_id, expira_en
  INTO v_pendiente_id, v_pendiente_prestador_id, v_pendiente_expira
  FROM cliente_pendiente_registro
  WHERE LOWER(email) = v_email_lower AND completado_en IS NULL AND soporte_resuelto_en IS NULL
  LIMIT 1;

  IF v_pendiente_id IS NOT NULL THEN
    RETURN jsonb_build_object('existe', 'pendiente', 'pendiente_id', v_pendiente_id,
      'creado_por_prestador_id', v_pendiente_prestador_id, 'expira_en', v_pendiente_expira);
  END IF;

  RETURN jsonb_build_object('existe', 'no_registrado', 'email', p_email);
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. metodo_otorgamiento gana 'solicitud_mostrador_autorizada'
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mascota_acceso_prestador DROP CONSTRAINT chk_metodo_otorgamiento_valido;
ALTER TABLE public.mascota_acceso_prestador ADD CONSTRAINT chk_metodo_otorgamiento_valido
  CHECK (metodo_otorgamiento = ANY (ARRAY[
    'qr_scan','busqueda_app_cliente','cita_automatica','familiar_delegacion',
    'invitacion_prestador_aceptada','walkin_origen','alta_asistida_creada_por_prestador',
    'solicitud_mostrador_autorizada']));

-- ─────────────────────────────────────────────────────────────────────────
-- 3. PRIMITIVA solicitud_autorizacion_mostrador (tipo + payload_alta)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.solicitud_autorizacion_mostrador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('atencion','alta_mascota')),
  -- 'atencion': mascota existente. 'alta_mascota': mascota_id NULL hasta autorizar.
  mascota_id uuid REFERENCES public.mascotas(id) ON DELETE CASCADE,
  -- 'alta_mascota': el cliente registrado hallado por la búsqueda (destino).
  destino_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'alta_mascota': {nombre, especie, sexo?, fecha_nacimiento?, precision?, foto_url?}.
  payload_alta jsonb,
  familia_id uuid REFERENCES public.familia(id) ON DELETE SET NULL,
  mascota_creada_id uuid REFERENCES public.mascotas(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','autorizada','rechazada','expirada')),
  solicitada_por_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  respondida_por_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  respondida_en timestamptz,
  country_code text NOT NULL DEFAULT 'EC',
  expira_en timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),  -- PEREZOSA (patrón hold, cero cron)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_solicitud_tipo_coherente CHECK (
    (tipo = 'atencion'     AND mascota_id IS NOT NULL AND payload_alta IS NULL) OR
    (tipo = 'alta_mascota' AND destino_user_id IS NOT NULL AND payload_alta IS NOT NULL)
  )
);
CREATE INDEX idx_solicitud_mostrador_cuenta ON public.solicitud_autorizacion_mostrador (cuenta_comercial_id, estado);
CREATE INDEX idx_solicitud_mostrador_mascota ON public.solicitud_autorizacion_mostrador (mascota_id) WHERE mascota_id IS NOT NULL;
CREATE INDEX idx_solicitud_mostrador_destino ON public.solicitud_autorizacion_mostrador (destino_user_id) WHERE destino_user_id IS NOT NULL;

CREATE TRIGGER trg_solicitud_mostrador_updated_at BEFORE UPDATE ON public.solicitud_autorizacion_mostrador
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.solicitud_autorizacion_mostrador ENABLE ROW LEVEL SECURITY;

-- Lectura: la cuenta que la emitió · la familia (atención) · el destino (alta) · admin.
-- Escritura: SOLO por RPC (SECURITY DEFINER) — sin policy de INSERT/UPDATE.
CREATE POLICY solicitud_select_cuenta ON public.solicitud_autorizacion_mostrador
  FOR SELECT TO authenticated
  USING (public._user_opera_cuenta_comercial(cuenta_comercial_id, auth.uid()));
CREATE POLICY solicitud_select_familia ON public.solicitud_autorizacion_mostrador
  FOR SELECT TO authenticated
  USING (tipo = 'atencion' AND mascota_id IS NOT NULL
         AND public._user_es_familia_de_mascota(mascota_id, auth.uid()));
CREATE POLICY solicitud_select_destino ON public.solicitud_autorizacion_mostrador
  FOR SELECT TO authenticated
  USING (tipo = 'alta_mascota' AND destino_user_id = auth.uid());
CREATE POLICY solicitud_select_admin ON public.solicitud_autorizacion_mostrador
  FOR SELECT TO authenticated USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 4. RPCs
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crear_solicitud_autorizacion(
  p_cuenta_comercial_id uuid,
  p_tipo text,
  p_mascota_id uuid DEFAULT NULL,
  p_destino_user_id uuid DEFAULT NULL,
  p_payload_alta jsonb DEFAULT NULL,
  p_country_code text DEFAULT 'EC'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id AND estado = 'activa') THEN
    RAISE EXCEPTION 'cuenta_no_activa' USING ERRCODE = '22023';
  END IF;
  IF p_tipo NOT IN ('atencion','alta_mascota') THEN
    RAISE EXCEPTION 'tipo_invalido' USING ERRCODE = '22023';
  END IF;

  IF p_tipo = 'atencion' THEN
    IF p_mascota_id IS NULL THEN RAISE EXCEPTION 'mascota_requerida' USING ERRCODE = '22023'; END IF;
    IF NOT EXISTS (SELECT 1 FROM mascotas WHERE id = p_mascota_id) THEN
      RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM solicitud_autorizacion_mostrador
      WHERE cuenta_comercial_id = p_cuenta_comercial_id AND tipo = 'atencion'
        AND mascota_id = p_mascota_id AND estado = 'pendiente' AND expira_en > now()
    ) THEN RAISE EXCEPTION 'solicitud_duplicada' USING ERRCODE = '22023'; END IF;

    INSERT INTO solicitud_autorizacion_mostrador (cuenta_comercial_id, tipo, mascota_id, solicitada_por_user_id, country_code)
    VALUES (p_cuenta_comercial_id, 'atencion', p_mascota_id, v_uid, p_country_code)
    RETURNING id INTO v_id;
  ELSE  -- alta_mascota
    IF p_destino_user_id IS NULL THEN RAISE EXCEPTION 'destino_requerido' USING ERRCODE = '22023'; END IF;
    IF p_payload_alta IS NULL OR NULLIF(trim(COALESCE(p_payload_alta->>'nombre','')),'') IS NULL
       OR NULLIF(trim(COALESCE(p_payload_alta->>'especie','')),'') IS NULL THEN
      RAISE EXCEPTION 'payload_alta_invalido' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM solicitud_autorizacion_mostrador
      WHERE cuenta_comercial_id = p_cuenta_comercial_id AND tipo = 'alta_mascota'
        AND destino_user_id = p_destino_user_id AND estado = 'pendiente' AND expira_en > now()
    ) THEN RAISE EXCEPTION 'solicitud_duplicada' USING ERRCODE = '22023'; END IF;

    INSERT INTO solicitud_autorizacion_mostrador (cuenta_comercial_id, tipo, destino_user_id, payload_alta, solicitada_por_user_id, country_code)
    VALUES (p_cuenta_comercial_id, 'alta_mascota', p_destino_user_id, p_payload_alta, v_uid, p_country_code)
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.responder_solicitud_autorizacion(
  p_solicitud_id uuid,
  p_accion text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_s record;
  v_fam uuid;
  v_n_fam int;
  v_masc uuid;
  v_especie text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF p_accion NOT IN ('autorizar','rechazar') THEN RAISE EXCEPTION 'accion_invalida' USING ERRCODE = '22023'; END IF;

  SELECT * INTO v_s FROM solicitud_autorizacion_mostrador WHERE id = p_solicitud_id FOR UPDATE;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'solicitud_no_existe' USING ERRCODE = '22023'; END IF;

  -- EXPIRACIÓN PEREZOSA (patrón hold, cero cron): vencida por tiempo REBOTA
  -- sin persistir el flag — el rechazo revertiría cualquier UPDATE en la misma
  -- txn (igual que el hold, la expiración se evalúa por expira_en en lectura y
  -- en el gate de duplicados). Un barrido puede materializar 'expirada' aparte.
  IF v_s.estado = 'pendiente' AND v_s.expira_en <= now() THEN
    RAISE EXCEPTION 'solicitud_expirada' USING ERRCODE = '22023';
  END IF;
  IF v_s.estado <> 'pendiente' THEN RAISE EXCEPTION 'solicitud_no_pendiente: %', v_s.estado USING ERRCODE = '22023'; END IF;

  -- GUARD: SOLO la familia (atención) o el destino (alta) — L-150
  IF v_s.tipo = 'atencion' THEN
    IF NOT public._user_es_familia_de_mascota(v_s.mascota_id, v_uid) THEN
      RAISE EXCEPTION 'no_es_familia' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF v_s.destino_user_id <> v_uid THEN RAISE EXCEPTION 'no_es_familia' USING ERRCODE = '42501'; END IF;
  END IF;

  IF p_accion = 'rechazar' THEN
    UPDATE solicitud_autorizacion_mostrador
    SET estado = 'rechazada', respondida_por_user_id = v_uid, respondida_en = now()
    WHERE id = p_solicitud_id;
    RETURN jsonb_build_object('ok', true, 'estado', 'rechazada', 'tipo', v_s.tipo);
  END IF;

  -- AUTORIZAR
  IF v_s.tipo = 'atencion' THEN
    v_masc := v_s.mascota_id;
  ELSE
    -- alta_mascota: familia_id derivada SERVER-SIDE; N>1 => familia_ambigua (v1 honesto)
    SELECT count(*), (array_agg(fm.familia_id))[1] INTO v_n_fam, v_fam
    FROM familia_miembro fm JOIN familia f ON f.id = fm.familia_id
    WHERE fm.user_id = v_uid AND fm.rol = 'adulto_titular' AND fm.hasta IS NULL AND f.tipo = 'estandar';
    IF v_n_fam = 0 THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE = '22023'; END IF;
    IF v_n_fam > 1 THEN RAISE EXCEPTION 'familia_ambigua' USING ERRCODE = '22023'; END IF;

    v_especie := v_s.payload_alta->>'especie';
    IF NOT EXISTS (SELECT 1 FROM cat_especies WHERE codigo = v_especie AND acepta_nuevos_registros = true) THEN
      RAISE EXCEPTION 'especie_invalida' USING ERRCODE = '22023';
    END IF;

    -- nace la mascota EN la familia real (jamás fantasma); pet_hash GENERATED
    INSERT INTO mascotas (nombre, especie, origen, familia_id, user_id, sexo, fecha_nacimiento, fecha_nacimiento_precision, foto_url, country_code)
    VALUES (
      btrim(v_s.payload_alta->>'nombre'), v_especie, 'desconocido', v_fam, v_uid,
      NULLIF(v_s.payload_alta->>'sexo',''),
      NULLIF(v_s.payload_alta->>'fecha_nacimiento','')::date,
      NULLIF(v_s.payload_alta->>'precision',''),
      NULLIF(v_s.payload_alta->>'foto_url',''),
      COALESCE(v_s.country_code, 'EC')
    ) RETURNING id INTO v_masc;
  END IF;

  -- acceso de atención para la cuenta solicitante (una autorización, una txn).
  -- Idempotente contra el UNIQUE parcial (mascota,cuenta) WHERE revocado_en IS
  -- NULL: re-autorizar una mascota ya accesible es no-op, jamás un error.
  INSERT INTO mascota_acceso_prestador (mascota_id, cuenta_comercial_id, otorgado_por_user_id, metodo_otorgamiento)
  VALUES (v_masc, v_s.cuenta_comercial_id, v_uid, 'solicitud_mostrador_autorizada')
  ON CONFLICT (mascota_id, cuenta_comercial_id) WHERE revocado_en IS NULL DO NOTHING;

  UPDATE solicitud_autorizacion_mostrador
  SET estado = 'autorizada', respondida_por_user_id = v_uid, respondida_en = now(),
      mascota_id = v_masc, mascota_creada_id = CASE WHEN v_s.tipo = 'alta_mascota' THEN v_masc ELSE mascota_creada_id END,
      familia_id = v_fam
  WHERE id = p_solicitud_id;

  RETURN jsonb_build_object('ok', true, 'estado', 'autorizada', 'tipo', v_s.tipo, 'mascota_id', v_masc);
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- L-140
-- ─────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.crear_solicitud_autorizacion(uuid, text, uuid, uuid, jsonb, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_solicitud_autorizacion(uuid, text, uuid, uuid, jsonb, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.responder_solicitud_autorizacion(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.responder_solicitud_autorizacion(uuid, text) TO authenticated;
-- los dos lectores enmendados conservan su grant vigente (authenticated); reafirmamos sin anon
REVOKE EXECUTE ON FUNCTION public.buscar_cliente_por_telefono(text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.buscar_cliente_por_telefono(text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.buscar_cliente_por_email(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.buscar_cliente_por_email(text) TO authenticated;
