-- ============================================================================
-- S69-A2 — CURAS DEL CHASIS (Fase G / P13) + normalizador + match dual + par L-133
-- Bloque 0 S69 halló: 6 funciones de Fase G con anon en proacl (L-140), el
-- cleanup notifica CADA noche (no marca terminal), falta el par AFTER INSERT del
-- otorgamiento de acceso (L-133), el teléfono vive en dos regímenes sin
-- normalizador. Decisiones founder: (2) la invitación expira, el dato clínico
-- JAMÁS · (6) reclamo por teléfono ADEMÁS de email con normalizador único.
-- Addendum de mesa: el alta de mostrador acepta email O teléfono (contacto-flex).
--
-- DECLARACIÓN 76(g): esta migración NO cambia FIRMAS de las funciones de Fase G
-- que la B envuelve (buscar_cliente_por_email, crear_mascota_walkin,
-- crear_alta_asistida_pendiente/_existente): las que sólo re-otorgo quedan
-- byte-idénticas (assert por md5 de pg_get_functiondef antes/después); las que
-- reescribo conservan su identity-args exacta (assert). El contacto-flex de
-- crear_alta_asistida_pendiente NO agrega ni saca parámetros. La verificación
-- usa fixtures self-contained con ROLLBACK — cero ancla sobre datos vivos.
-- NO RIGE VEDA.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 1 — SNAPSHOT de firmas Fase G (para el assert de estabilidad)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TEMP TABLE _fase_g_snapshot ON COMMIT DROP AS
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS identity_args,
       md5(pg_get_functiondef(p.oid)) AS def_md5
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('crear_alta_asistida_pendiente','crear_alta_asistida_existente',
                    'buscar_cliente_por_email','_trg_completar_pendiente_registro',
                    'cleanup_pendientes_vencidos','crear_mascota_walkin');

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 2 — normalizar_telefono: UN normalizador (dec. 6)
-- Reglas (reportadas): 1) sólo dígitos · 2) si empieza con el prefijo de país
-- (cat_paises.prefijo_telefono sin '+') y es más largo, se le saca el prefijo ·
-- 3) se sacan los ceros troncales a la izquierda · 4) '' ⇒ NULL. STABLE (lee
-- cat_paises) — se usa en trigger de normalización y en la búsqueda por teléfono.
-- ────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION public.normalizar_telefono(p_texto text, p_country_code text)
RETURNS text
LANGUAGE plpgsql STABLE SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_d text;
  v_pref text;
BEGIN
  IF p_texto IS NULL THEN RETURN NULL; END IF;
  v_d := regexp_replace(p_texto, '\D', '', 'g');
  IF v_d = '' THEN RETURN NULL; END IF;
  SELECT regexp_replace(prefijo_telefono, '\D', '', 'g') INTO v_pref
  FROM cat_paises WHERE codigo_iso2 = p_country_code;
  IF v_pref IS NOT NULL AND length(v_d) > length(v_pref) AND left(v_d, length(v_pref)) = v_pref THEN
    v_d := substr(v_d, length(v_pref) + 1);
  END IF;
  v_d := ltrim(v_d, '0');
  RETURN NULLIF(v_d, '');
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.normalizar_telefono(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.normalizar_telefono(text, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3 — CHASIS contacto-flexible (addendum) + columnas de estado
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE cliente_pendiente_registro ADD COLUMN telefono_normalizado text;
ALTER TABLE cliente_pendiente_registro ADD COLUMN notificado_soporte_en timestamptz;

-- email pasa a opcional; al menos uno de {email, telefono} (contacto_requerido)
ALTER TABLE cliente_pendiente_registro ALTER COLUMN email DROP NOT NULL;
ALTER TABLE cliente_pendiente_registro DROP CONSTRAINT chk_pendiente_email_no_vacio;
ALTER TABLE cliente_pendiente_registro ADD CONSTRAINT chk_pendiente_email_no_vacio
  CHECK (email IS NULL OR length(trim(email)) > 0);
ALTER TABLE cliente_pendiente_registro ADD CONSTRAINT chk_pendiente_contacto_requerido
  CHECK (email IS NOT NULL OR telefono IS NOT NULL);

-- normalización en la escritura (trigger BEFORE) — mantiene telefono_normalizado
CREATE FUNCTION public._trg_cpr_normaliza_telefono()
RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.telefono_normalizado := public.normalizar_telefono(NEW.telefono, NEW.country_code);
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public._trg_cpr_normaliza_telefono() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_cpr_normaliza_telefono
  BEFORE INSERT OR UPDATE ON cliente_pendiente_registro
  FOR EACH ROW EXECUTE FUNCTION public._trg_cpr_normaliza_telefono();

-- Unicidad: email parcial (permite tel-only con email NULL) + gemelo por teléfono
-- normalizado. Decisión técnica: el índice del teléfono usa telefono_normalizado
-- (columna real mantenida por trigger — prefijo-aware), no una expresión inline
-- (normalizar_telefono es STABLE, no indexable directo).
DROP INDEX idx_pendiente_email_lower;
CREATE UNIQUE INDEX idx_pendiente_email_lower
  ON cliente_pendiente_registro (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_pendiente_tel_norm
  ON cliente_pendiente_registro (country_code, telefono_normalizado) WHERE telefono_normalizado IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 4 — crear_alta_asistida_pendiente: email O teléfono (firma IDÉNTICA)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crear_alta_asistida_pendiente(
  p_email text, p_nombre_cliente text, p_telefono text, p_prestador_id uuid,
  p_nombre_mascota text, p_especie text, p_country_code text,
  p_raza text DEFAULT NULL::text, p_sexo text DEFAULT NULL::text,
  p_fecha_nacimiento date DEFAULT NULL::date, p_microchip text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_email_lower text := NULLIF(LOWER(trim(p_email)), '');
  v_telefono text := NULLIF(trim(p_telefono), '');
  v_tel_norm text;
  v_cuenta_comercial_id uuid;
  v_familia_id uuid := gen_random_uuid();
  v_pendiente_id uuid := gen_random_uuid();
  v_mascota_id uuid := gen_random_uuid();
  v_evento_id uuid := gen_random_uuid();
BEGIN
  IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;

  -- Contacto-flexible: al menos email O teléfono (addendum S69)
  IF v_email_lower IS NULL AND v_telefono IS NULL THEN
    RAISE EXCEPTION 'contacto_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_nombre_cliente IS NULL OR length(trim(p_nombre_cliente)) = 0 THEN
    RAISE EXCEPTION 'nombre_cliente_required' USING ERRCODE = '22023';
  END IF;
  IF p_nombre_mascota IS NULL OR length(trim(p_nombre_mascota)) = 0 THEN
    RAISE EXCEPTION 'nombre_mascota_required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_especies WHERE codigo = p_especie AND acepta_nuevos_registros = true) THEN
    RAISE EXCEPTION 'especie_invalida_o_inactiva' USING ERRCODE = '22023';
  END IF;
  IF p_country_code NOT IN ('EC','CO','MX','PE','CL','BR','AR','US') THEN
    RAISE EXCEPTION 'country_code_invalido' USING ERRCODE = '22023';
  END IF;

  v_tel_norm := public.normalizar_telefono(v_telefono, p_country_code);

  -- ¿Ya registrado? — por email O por teléfono normalizado
  IF v_email_lower IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE LOWER(email) = v_email_lower) THEN
    RAISE EXCEPTION 'cliente_ya_registrado' USING ERRCODE = '22023';
  END IF;
  IF v_tel_norm IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles WHERE public.normalizar_telefono(telefono, p_country_code) = v_tel_norm
  ) THEN
    RAISE EXCEPTION 'cliente_ya_registrado' USING ERRCODE = '22023';
  END IF;

  -- ¿Pendiente activo con el mismo contacto?
  IF v_email_lower IS NOT NULL AND EXISTS (
    SELECT 1 FROM cliente_pendiente_registro
    WHERE LOWER(email) = v_email_lower AND completado_en IS NULL AND soporte_resuelto_en IS NULL
  ) THEN
    RAISE EXCEPTION 'pendiente_ya_existe' USING ERRCODE = '22023';
  END IF;
  IF v_tel_norm IS NOT NULL AND EXISTS (
    SELECT 1 FROM cliente_pendiente_registro
    WHERE country_code = p_country_code AND telefono_normalizado = v_tel_norm
      AND completado_en IS NULL AND soporte_resuelto_en IS NULL
  ) THEN
    RAISE EXCEPTION 'pendiente_ya_existe' USING ERRCODE = '22023';
  END IF;

  SELECT cuenta_comercial_id INTO v_cuenta_comercial_id FROM prestadores WHERE id = p_prestador_id;

  INSERT INTO familia (id, nombre, tipo, country_code, cuenta_comercial_id, created_by_user_id, created_by_sistema)
  VALUES (v_familia_id, 'Familia de ' || p_nombre_cliente, 'pendiente_completar', p_country_code, v_cuenta_comercial_id, v_auth_uid, NULL);

  INSERT INTO cliente_pendiente_registro (
    id, email, nombre, telefono,
    creado_por_prestador_id, creado_por_cuenta_comercial_id, creado_por_user_id,
    country_code, familia_id_placeholder
  ) VALUES (
    v_pendiente_id, v_email_lower, p_nombre_cliente, v_telefono,
    p_prestador_id, v_cuenta_comercial_id, v_auth_uid,
    p_country_code, v_familia_id
  );

  INSERT INTO mascotas (
    id, nombre, especie, raza, sexo, fecha_nacimiento, microchip,
    foto_url, country_code, familia_id, user_id, origen,
    estado_vida, estado_vida_desde, fecha_alta
  ) VALUES (
    v_mascota_id, p_nombre_mascota, p_especie, p_raza, p_sexo, p_fecha_nacimiento, p_microchip,
    p_foto_url, p_country_code, v_familia_id, NULL, 'alta_asistida',
    'activa', now(), now()
  );

  INSERT INTO mascota_acceso_prestador (
    mascota_id, cuenta_comercial_id, metodo_otorgamiento, otorgado_en, otorgado_por_user_id
  ) VALUES (
    v_mascota_id, v_cuenta_comercial_id, 'alta_asistida_creada_por_prestador', now(), v_auth_uid
  );

  INSERT INTO eventos_mascota (
    id, mascota_id, tipo, eje_jtbd, fecha_evento,
    cuenta_comercial_id, prestador_id, creado_por_user_id, datos, country_code
  ) VALUES (
    v_evento_id, v_mascota_id, 'alta_asistida_pendiente_creada', 'administrativo', now(),
    v_cuenta_comercial_id, p_prestador_id, v_auth_uid,
    jsonb_build_object('caso', 'cliente_no_registrado', 'pendiente_id', v_pendiente_id,
                       'email_cliente', p_email, 'telefono_cliente', v_telefono),
    p_country_code
  );

  RETURN jsonb_build_object(
    'pendiente_id', v_pendiente_id, 'familia_id', v_familia_id, 'mascota_id', v_mascota_id,
    'expira_en', (now() + interval '30 days'), 'estado', 'pendiente'
  );
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 5 — _trg_completar_pendiente_registro: MATCH DUAL (email O teléfono)
-- Se dispara también en UPDATE de email/teléfono: el cliente que completa su
-- registro y AGREGA su teléfono más tarde reclama igual (el reclamo por teléfono
-- se vuelve real, no sólo si el teléfono está al momento del alta).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_completar_pendiente_registro()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pendiente cliente_pendiente_registro%ROWTYPE;
  v_mascota_id uuid;
  v_evento_id uuid;
  v_prestador_dueno_user_id uuid;
BEGIN
  -- Match dual: por email O por teléfono normalizado (con el país del pendiente).
  SELECT * INTO v_pendiente
  FROM cliente_pendiente_registro cpr
  WHERE cpr.completado_en IS NULL
    AND cpr.soporte_resuelto_en IS NULL
    AND (
      (cpr.email IS NOT NULL AND NEW.email IS NOT NULL AND LOWER(cpr.email) = LOWER(NEW.email))
      OR (cpr.telefono_normalizado IS NOT NULL AND NEW.telefono IS NOT NULL
          AND cpr.telefono_normalizado = public.normalizar_telefono(NEW.telefono, cpr.country_code))
    )
  LIMIT 1;

  IF v_pendiente.id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE cliente_pendiente_registro
  SET completado_en = now(), completado_por_user_id = NEW.id
  WHERE id = v_pendiente.id;

  UPDATE familia
  SET tipo = 'estandar', cuenta_comercial_id = NULL, updated_at = now()
  WHERE id = v_pendiente.familia_id_placeholder;

  INSERT INTO familia_miembro (familia_id, user_id, rol, desde)
  VALUES (v_pendiente.familia_id_placeholder, NEW.id, 'adulto_titular', now());

  FOR v_mascota_id IN
    SELECT id FROM mascotas WHERE familia_id = v_pendiente.familia_id_placeholder
  LOOP
    INSERT INTO mascota_codueño (mascota_id, user_id, familia_id, desde, agregado_por_user_id)
    VALUES (v_mascota_id, NEW.id, v_pendiente.familia_id_placeholder, now(), NEW.id);

    UPDATE mascotas SET user_id = NEW.id WHERE id = v_mascota_id;

    v_evento_id := gen_random_uuid();
    INSERT INTO eventos_mascota (
      id, mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, datos, country_code
    ) VALUES (
      v_evento_id, v_mascota_id, 'alta_asistida_completada_por_cliente', 'administrativo', now(),
      NEW.id,
      jsonb_build_object('pendiente_id', v_pendiente.id, 'prestador_origen', v_pendiente.creado_por_prestador_id),
      v_pendiente.country_code
    );
  END LOOP;

  SELECT user_id INTO v_prestador_dueno_user_id
  FROM prestadores WHERE id = v_pendiente.creado_por_prestador_id;

  IF v_prestador_dueno_user_id IS NOT NULL THEN
    INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
    VALUES (v_prestador_dueno_user_id, v_pendiente.country_code,
      'alta_asistida_completada_por_cliente', 'in_app', 'Cliente completó su registro',
      'El cliente ' || v_pendiente.nombre || ' completó su registro y reclamó sus mascotas.',
      jsonb_build_object('pendiente_id', v_pendiente.id, 'cliente_user_id', NEW.id, 'rol_audiencia', 'dueno_prestador'),
      'prestador');
  END IF;

  IF v_pendiente.creado_por_user_id IS NOT NULL
     AND v_pendiente.creado_por_user_id <> v_prestador_dueno_user_id THEN
    INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
    VALUES (v_pendiente.creado_por_user_id, v_pendiente.country_code,
      'alta_asistida_completada_por_cliente', 'in_app', 'Tu cliente completó su registro',
      'El cliente ' || v_pendiente.nombre || ' que diste de alta completó su registro y reclamó sus mascotas.',
      jsonb_build_object('pendiente_id', v_pendiente.id, 'cliente_user_id', NEW.id, 'rol_audiencia', 'empleado_origen'),
      'prestador');
  END IF;

  RETURN NEW;
END;
$function$;

-- El trigger se re-crea para disparar también en UPDATE de email/teléfono
DROP TRIGGER trg_completar_pendiente_registro ON profiles;
CREATE TRIGGER trg_completar_pendiente_registro
  AFTER INSERT OR UPDATE OF email, telefono ON profiles
  FOR EACH ROW EXECUTE FUNCTION public._trg_completar_pendiente_registro();

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 6 — cleanup: UNA notificación terminal por vencido (dec. 2)
-- El dato clínico JAMÁS se borra (la letra P13 se enmienda en A4: el cleanup
-- nunca borró; ahora se firma como principio). Sólo avisa a soporte, UNA vez.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_pendientes_vencidos()
RETURNS TABLE(pendiente_id uuid, accion text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pendiente cliente_pendiente_registro%ROWTYPE;
BEGIN
  FOR v_pendiente IN
    SELECT * FROM cliente_pendiente_registro
    WHERE expira_en < now()
      AND completado_en IS NULL
      AND soporte_resuelto_en IS NULL
      AND notificado_soporte_en IS NULL   -- terminal: no re-notificar cada noche
  LOOP
    INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
    SELECT au.id, v_pendiente.country_code, 'alta_asistida_vencida_soporte', 'in_app',
      'Alta asistida vencida sin completar',
      'El cliente ' || v_pendiente.nombre || ' no completó su registro en 30 días. La invitación expiró; el expediente NO se borra (queda esperando reclamo).',
      jsonb_build_object('pendiente_id', v_pendiente.id), 'admin'
    FROM admin_users au WHERE au.activo = true LIMIT 1;

    UPDATE cliente_pendiente_registro
    SET notificado_soporte_en = now()
    WHERE id = v_pendiente.id;

    pendiente_id := v_pendiente.id;
    accion := 'notificado_soporte';
    RETURN NEXT;
  END LOOP;
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 7 — buscar_cliente_por_telefono: la HERMANA (contrato para la B / M2)
-- Espeja el shape de buscar_cliente_por_email (existe: registrado|pendiente|no_registrado)
-- ────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION public.buscar_cliente_por_telefono(p_telefono text, p_country_code text DEFAULT 'EC')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_norm text;
  v_user_id uuid;
  v_nombre text;
  v_pendiente_id uuid;
  v_pendiente_prestador_id uuid;
  v_pendiente_expira timestamptz;
  v_familias jsonb;
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
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'familia_id', f.id, 'familia_nombre', f.nombre,
      'mascotas_count', (SELECT count(*) FROM mascotas m WHERE m.familia_id = f.id AND m.estado_vida = 'activa')
    )), '[]'::jsonb) INTO v_familias
    FROM familia_miembro fm JOIN familia f ON f.id = fm.familia_id
    WHERE fm.user_id = v_user_id AND fm.rol = 'adulto_titular' AND fm.hasta IS NULL AND f.tipo = 'estandar';

    RETURN jsonb_build_object('existe', 'registrado', 'user_id', v_user_id, 'nombre', v_nombre, 'familias', v_familias);
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
REVOKE EXECUTE ON FUNCTION public.buscar_cliente_por_telefono(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_cliente_por_telefono(text, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 8 — EL PAR L-133: AFTER INSERT (cita que NACE confirmada — el mostrador)
-- Cuerpo espejo del AFTER UPDATE. La rama del fantasma (mascota sin user):
-- NO se omite en silencio — el fantasma YA tiene acceso por 'walkin_origen'
-- (crear_mascota_walkin), y el dedupe de abajo lo cubre exacto (el trigger no
-- duplica). El RETURN sin otorgar sólo se alcanza si un fantasma llegara SIN
-- acceso previo y sin user: es el par idéntico del AFTER UPDATE, documentado.
-- ────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION public._trg_otorgar_acceso_por_cita_insert_confirmada()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_cuenta_comercial_id uuid;
  v_otorgado_por uuid;
BEGIN
  IF NEW.estado IS DISTINCT FROM 'confirmada' THEN RETURN NEW; END IF;
  IF NEW.mascota_id IS NULL OR NEW.prestador_id IS NULL THEN RETURN NEW; END IF;

  SELECT p.cuenta_comercial_id INTO v_cuenta_comercial_id FROM prestadores p WHERE p.id = NEW.prestador_id;
  IF v_cuenta_comercial_id IS NULL THEN RETURN NEW; END IF;

  -- dedupe: acceso vigente ya existe ⇒ no duplicar (cubre al FANTASMA: walkin_origen)
  IF EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = NEW.mascota_id AND map.cuenta_comercial_id = v_cuenta_comercial_id AND map.revocado_en IS NULL
  ) THEN
    RETURN NEW;
  END IF;

  SELECT m.user_id INTO v_otorgado_por FROM mascotas m WHERE m.id = NEW.mascota_id;
  IF v_otorgado_por IS NULL THEN v_otorgado_por := NEW.user_id; END IF;
  IF v_otorgado_por IS NULL THEN RETURN NEW; END IF;  -- fantasma sin acceso previo: par exacto del AFTER UPDATE

  INSERT INTO mascota_acceso_prestador (
    mascota_id, cuenta_comercial_id, otorgado_en, otorgado_por_user_id, metodo_otorgamiento, expira_en, audit_log
  ) VALUES (
    NEW.mascota_id, v_cuenta_comercial_id, now(), v_otorgado_por, 'cita_automatica', NULL,
    jsonb_build_array(jsonb_build_object('evento', 'otorgado_por_cita_nacida_confirmada', 'cita_id', NEW.id, 'en', now()))
  );

  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public._trg_otorgar_acceso_por_cita_insert_confirmada() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_otorgar_acceso_cita_insert_confirmada
  AFTER INSERT ON evento_cita_servicio
  FOR EACH ROW EXECUTE FUNCTION public._trg_otorgar_acceso_por_cita_insert_confirmada();

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 9 — L-140: REVOKE anon/PUBLIC en las 6 de Fase G (sin tocar cuerpos)
-- ────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.crear_alta_asistida_pendiente(text, text, text, uuid, text, text, text, text, text, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_alta_asistida_pendiente(text, text, text, uuid, text, text, text, text, text, date, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.crear_alta_asistida_existente(uuid, uuid, uuid, text, text, text, text, text, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_alta_asistida_existente(uuid, uuid, uuid, text, text, text, text, text, date, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.buscar_cliente_por_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_cliente_por_email(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.crear_mascota_walkin(uuid, text, text, text, text, text, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_mascota_walkin(uuid, text, text, text, text, text, date, text, text) TO authenticated;
-- trigger fn + cron fn: sin EXECUTE para nadie externo
REVOKE EXECUTE ON FUNCTION public._trg_completar_pendiente_registro() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_pendientes_vencidos() FROM PUBLIC, anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 10 — VERIFICACIÓN IMPERATIVA (fixtures self-contained, ROLLBACK residuo 0)
-- ────────────────────────────────────────────────────────────────────────────
DO $verif$
DECLARE
  v_vet uuid := gen_random_uuid();
  v_cli_email uuid := gen_random_uuid();
  v_cli_tel uuid := gen_random_uuid();
  v_cuenta uuid; v_prestador uuid; v_mascota_walkin uuid;
  v_res jsonb; v_n integer; v_ok boolean; v_bad text;
  v_estado_pend text; v_acc_antes int; v_acc_desp int;
  v_norm text;
BEGIN
  -- ── ASSERT 1: firmas Fase G estables ──
  SELECT string_agg(s.proname, ', ') INTO v_bad
  FROM _fase_g_snapshot s
  JOIN pg_proc p ON p.proname = s.proname
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  WHERE pg_get_function_identity_arguments(p.oid) <> s.identity_args;
  IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'A2 abort: identity-args cambió en %', v_bad; END IF;

  SELECT string_agg(s.proname, ', ') INTO v_bad
  FROM _fase_g_snapshot s
  JOIN pg_proc p ON p.proname = s.proname
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  WHERE s.proname IN ('crear_alta_asistida_existente','buscar_cliente_por_email','crear_mascota_walkin')
    AND md5(pg_get_functiondef(p.oid)) <> s.def_md5;
  IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'A2 abort: cuerpo cambió (debía ser sólo re-grant) en %', v_bad; END IF;

  -- ── ASSERT 2: normalizar_telefono — las tres formas convergen ──
  IF public.normalizar_telefono('0987654321','EC') <> '987654321'
     OR public.normalizar_telefono('+593987654321','EC') <> '987654321'
     OR public.normalizar_telefono('593 98 765 4321','EC') <> '987654321' THEN
    RAISE EXCEPTION 'A2 abort: normalizar_telefono no converge (% / % / %)',
      public.normalizar_telefono('0987654321','EC'),
      public.normalizar_telefono('+593987654321','EC'),
      public.normalizar_telefono('593 98 765 4321','EC');
  END IF;

  BEGIN  -- ── savepoint de fixtures ──
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_vet, 'authenticated','authenticated','s69a2-vet@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');

    INSERT INTO cuentas_comerciales (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    VALUES (v_vet, 'persona_natural', 'A2-9999', 'Clínica A2 Verif', 'A2 Vet', 'EC') RETURNING id INTO v_cuenta;
    INSERT INTO prestadores (user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id)
    VALUES (v_vet, 'clinica_veterinaria', 'A2 Vet', '0999999999', v_cuenta) RETURNING id INTO v_prestador;

    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);

    -- ── crear pendiente TEL-ONLY (contacto-flex): email NULL ──
    v_res := crear_alta_asistida_pendiente(NULL, 'Cliente TelOnly', '0987111222', v_prestador,
                                           'PetTel', 'perro', 'EC');
    IF (v_res ->> 'pendiente_id') IS NULL THEN RAISE EXCEPTION 'A2 abort: pendiente tel-only no nació'; END IF;
    SELECT telefono_normalizado INTO v_norm FROM cliente_pendiente_registro WHERE id = (v_res ->> 'pendiente_id')::uuid;
    IF v_norm <> '987111222' THEN RAISE EXCEPTION 'A2 abort: telefono_normalizado del pendiente = % (esperado 987111222)', v_norm; END IF;

    -- contacto_requerido: ni email ni tel ⇒ revienta
    v_ok := false;
    BEGIN PERFORM crear_alta_asistida_pendiente(NULL, 'SinContacto', NULL, v_prestador, 'X', 'perro', 'EC');
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%contacto_requerido%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A2 abort: alta sin contacto no reventó'; END IF;

    -- ── MATCH DUAL por TELÉFONO (UPDATE): el cliente se registra y agrega su teléfono ──
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_cli_tel, 'authenticated','authenticated','otro-email-distinto@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');
    -- el profile nació con email que NO matchea; agrega el teléfono ⇒ dispara el match dual
    UPDATE profiles SET telefono = '+593987111222' WHERE id = v_cli_tel;
    SELECT completado_en INTO v_estado_pend FROM cliente_pendiente_registro WHERE id = (v_res ->> 'pendiente_id')::uuid;
    IF v_estado_pend IS NULL THEN RAISE EXCEPTION 'A2 abort: match dual por teléfono no completó el pendiente'; END IF;
    SELECT count(*) INTO v_n FROM mascota_codueño WHERE user_id = v_cli_tel;
    IF v_n < 1 THEN RAISE EXCEPTION 'A2 abort: la mascota no se transfirió al reclamar por teléfono'; END IF;

    -- ── MATCH por EMAIL (INSERT) ──
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_res := crear_alta_asistida_pendiente('claim-email@verif.local', 'Cliente Email', NULL, v_prestador,
                                           'PetMail', 'perro', 'EC');
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_cli_email, 'authenticated','authenticated','claim-email@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');
    SELECT completado_en INTO v_estado_pend FROM cliente_pendiente_registro WHERE id = (v_res ->> 'pendiente_id')::uuid;
    IF v_estado_pend IS NULL THEN RAISE EXCEPTION 'A2 abort: match por email no completó el pendiente'; END IF;

    -- ── buscar_cliente_por_telefono (contrato B) ──
    v_res := buscar_cliente_por_telefono('0987111222', 'EC');
    IF v_res ->> 'existe' <> 'registrado' THEN
      RAISE EXCEPTION 'A2 abort: buscar_por_telefono no halló al registrado (existe=%)', v_res ->> 'existe';
    END IF;

    -- ── PAR L-133 vía A (familia con user, SIN acceso previo): cita nace confirmada ⇒ OTORGA ──
    DECLARE v_fam_cli uuid; v_pet_fresca uuid;
    BEGIN
      SELECT familia_id INTO v_fam_cli FROM mascotas WHERE user_id = v_cli_email LIMIT 1;
      INSERT INTO mascotas (nombre, origen, familia_id, user_id, especie, country_code)
      VALUES ('PetFresca', 'desconocido', v_fam_cli, v_cli_email, 'perro', 'EC') RETURNING id INTO v_pet_fresca;
      SELECT count(*) INTO v_acc_antes FROM mascota_acceso_prestador
      WHERE mascota_id = v_pet_fresca AND cuenta_comercial_id = v_cuenta AND revocado_en IS NULL;
      IF v_acc_antes <> 0 THEN RAISE EXCEPTION 'A2 abort L-133 vía A: la mascota fresca ya tenía acceso (%)', v_acc_antes; END IF;
      INSERT INTO evento_cita_servicio (user_id, mascota_id, prestador_id, tipo_servicio, precio, duracion_minutos, estado, estado_reserva, country_code)
      VALUES (v_cli_email, v_pet_fresca, v_prestador, 'consulta_general', 20, 30, 'confirmada', 'pendiente_pago', 'EC');
      SELECT count(*) INTO v_acc_desp FROM mascota_acceso_prestador
      WHERE mascota_id = v_pet_fresca AND cuenta_comercial_id = v_cuenta AND revocado_en IS NULL AND metodo_otorgamiento = 'cita_automatica';
      IF v_acc_desp <> 1 THEN RAISE EXCEPTION 'A2 abort L-133 vía A: cita nacida confirmada NO otorgó cita_automatica (desp=%)', v_acc_desp; END IF;
    END;

    -- ── PAR L-133 vía B (fantasma walk-in): crear_mascota_walkin + cita ⇒ dedupe, no duplica ──
    v_mascota_walkin := crear_mascota_walkin(v_prestador, 'Fantasma', 'perro', 'EC');
    SELECT count(*) INTO v_acc_antes FROM mascota_acceso_prestador WHERE mascota_id = v_mascota_walkin AND revocado_en IS NULL;
    IF v_acc_antes <> 1 THEN RAISE EXCEPTION 'A2 abort L-133 vía B: walkin no dejó exactamente 1 acceso (%)', v_acc_antes; END IF;
    INSERT INTO evento_cita_servicio (mascota_id, prestador_id, tipo_servicio, precio, duracion_minutos, estado, estado_reserva, country_code)
    VALUES (v_mascota_walkin, v_prestador, 'consulta_general', 20, 30, 'confirmada', 'pendiente_pago', 'EC');
    SELECT count(*) INTO v_acc_desp FROM mascota_acceso_prestador WHERE mascota_id = v_mascota_walkin AND revocado_en IS NULL;
    IF v_acc_desp <> 1 THEN RAISE EXCEPTION 'A2 abort L-133 vía B: el fantasma ganó acceso duplicado (antes=% desp=%)', v_acc_antes, v_acc_desp; END IF;

    -- ── GOTEO: cleanup marca terminal — segunda corrida = 0 ──
    UPDATE cliente_pendiente_registro
    SET expira_en = now() - interval '1 day'
    WHERE creado_por_prestador_id = v_prestador AND completado_en IS NULL;  -- fuerza vencimiento del que quede
    -- creamos uno fresco vencido garantizado
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_res := crear_alta_asistida_pendiente(NULL, 'Vencido', '0985000111', v_prestador, 'PetVenc', 'perro', 'EC');
    UPDATE cliente_pendiente_registro SET expira_en = now() - interval '1 day' WHERE id = (v_res ->> 'pendiente_id')::uuid;
    SELECT count(*) INTO v_n FROM cleanup_pendientes_vencidos();
    IF v_n < 1 THEN RAISE EXCEPTION 'A2 abort: cleanup no notificó ningún vencido (1ra corrida)'; END IF;
    SELECT count(*) INTO v_n FROM cleanup_pendientes_vencidos();
    IF v_n <> 0 THEN RAISE EXCEPTION 'A2 abort: cleanup RE-notificó en la 2da corrida (% filas) — el goteo sigue vivo', v_n; END IF;

    -- ── SONDA L-140: cero anon en Fase G + funciones nuevas ──
    SELECT string_agg(p.proname, ', ') INTO v_bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('crear_alta_asistida_pendiente','crear_alta_asistida_existente','buscar_cliente_por_email',
                        '_trg_completar_pendiente_registro','cleanup_pendientes_vencidos','crear_mascota_walkin',
                        'normalizar_telefono','buscar_cliente_por_telefono','_trg_cpr_normaliza_telefono',
                        '_trg_otorgar_acceso_por_cita_insert_confirmada')
      AND array_to_string(COALESCE(p.proacl, ARRAY[]::aclitem[]), ',') LIKE '%anon=%';
    IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'A2 abort L-140: funciones con anon: %', v_bad; END IF;

    RAISE EXCEPTION 'S69_A2_ASSERTS_OK -> firmas estables + normalizar + contacto-flex + match dual(email/tel) + buscar_por_tel + par L-133 (2 vías) + goteo terminal + sonda L-140';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM NOT LIKE 'S69_A2_ASSERTS_OK%' THEN RAISE; END IF;
      RAISE NOTICE '%', SQLERRM;
  END;
END;
$verif$;

-- ============================================================================
-- FIN S69-A2.
-- ============================================================================
