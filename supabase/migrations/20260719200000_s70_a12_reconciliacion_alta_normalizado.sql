-- S70-A12 — RECONCILIACIÓN 140000 × A8 (D-442): el alta por '+' fabricaba
-- pendientes INHALLABLES.
--
-- SUPERSEDE a `20260719140000_s70_b3_alta_telefono_sin_plus.sql`, que NO SE
-- APLICA JAMÁS (su assert embebido codifica la semántica PRE-A8 de
-- normalizar_telefono y aborta; y su orden sanear→normalizar es justamente el
-- bug). El cuerpo funcional de B3 ya estaba VIVO en la DB (aplicado directo por
-- la Sesión B sin registrar la migración) — esta migración lo reemplaza y deja
-- el historial coherente.
--
-- LA CAUSA: B3 saneaba el '+' ANTES de normalizar, así que el
-- telefono_normalizado se computaba sobre el raw plus-less ('573005604012') y
-- A8 —que usa el '+' como señal de forma internacional— no strippeaba el '57'.
-- La BÚSQUEDA con '+' sí lo strippea ('3005604012'). Jamás matcheaban.
--
-- LA CURA: normalizar PRIMERO (con el '+' intacto como señal A8), sanear
-- DESPUÉS solo para la columna raw (el CHECK telefono_sin_plus rige), y
-- estampar el normalizado EXPLÍCITO en el INSERT.
--
-- CENSO A LA MESA (corrido antes de tocar): 2 pendientes vivos, ambos con
-- normalizado PELADO — `con_prefijo_retenido = 0`. CERO filas inhallables hoy
-- (el '+' nunca llegó a producir una). El backfill de abajo es defensivo y
-- toca 0 filas; se declara su conteo en el juez.
-- 76(g): aditiva (reemplazo de bodies, sin cambio de firma). L-140 al cierre.

-- ─────────────────────────────────────────────────────────────────────────
-- (1) el trigger deja de PISAR un normalizado provisto explícitamente
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_cpr_normaliza_telefono()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- A12: si el caller estampó el normalizado (lo calculó del input ORIGINAL,
  -- con '+'), se RESPETA. Sin valor, se computa como siempre.
  IF TG_OP = 'INSERT' THEN
    IF NEW.telefono_normalizado IS NULL THEN
      NEW.telefono_normalizado := public.normalizar_telefono(NEW.telefono, NEW.country_code);
    END IF;
  ELSE
    -- UPDATE: recomputar solo si cambió el teléfono y el normalizado NO se
    -- tocó en la misma sentencia (si se tocó, manda el valor explícito).
    IF NEW.telefono IS DISTINCT FROM OLD.telefono
       AND NEW.telefono_normalizado IS NOT DISTINCT FROM OLD.telefono_normalizado THEN
      NEW.telefono_normalizado := public.normalizar_telefono(NEW.telefono, NEW.country_code);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- (2) el alta: NORMALIZAR primero (con '+'), SANEAR después (raw plus-less)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crear_alta_asistida_pendiente(p_email text, p_nombre_cliente text, p_telefono text, p_prestador_id uuid, p_nombre_mascota text, p_especie text, p_country_code text, p_raza text DEFAULT NULL::text, p_sexo text DEFAULT NULL::text, p_fecha_nacimiento date DEFAULT NULL::date, p_microchip text DEFAULT NULL::text, p_foto_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_email_lower text := NULLIF(LOWER(trim(p_email)), '');
  -- A12: el normalizado sale del INPUT ORIGINAL — el '+' es la señal que A8
  -- (D-442) usa para strippear el prefijo de CUALQUIER país. Calcularlo sobre
  -- el raw ya saneado (B3) retenía el prefijo y hacía el pendiente inhallable.
  v_tel_norm text := public.normalizar_telefono(NULLIF(trim(p_telefono), ''), p_country_code);
  -- el raw va plus-less (CHECK telefono_sin_plus) — se sanea DESPUÉS.
  v_telefono text := NULLIF(replace(trim(p_telefono), '+', ''), '');
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

  -- A12: telefono_normalizado EXPLÍCITO (el trigger lo respeta).
  INSERT INTO cliente_pendiente_registro (
    id, email, nombre, telefono, telefono_normalizado,
    creado_por_prestador_id, creado_por_cuenta_comercial_id, creado_por_user_id,
    country_code, familia_id_placeholder
  ) VALUES (
    v_pendiente_id, v_email_lower, p_nombre_cliente, v_telefono, v_tel_norm,
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

-- ─────────────────────────────────────────────────────────────────────────
-- (3) BACKFILL DECLARADO (censo: 0 filas hoy) — pendientes vivos cuyo
--     normalizado retiene un prefijo de cat_paises Y es idéntico al raw
--     plus-less: firma exacta del bug. Se re-normaliza tratando el raw como
--     internacional. Idempotente.
-- ─────────────────────────────────────────────────────────────────────────
UPDATE cliente_pendiente_registro cpr
SET telefono_normalizado = public.normalizar_telefono('+' || cpr.telefono, cpr.country_code)
WHERE cpr.telefono IS NOT NULL
  AND cpr.telefono_normalizado IS NOT NULL
  AND cpr.telefono_normalizado = regexp_replace(cpr.telefono, '\D', '', 'g')
  AND EXISTS (
    SELECT 1 FROM cat_paises cp
    WHERE regexp_replace(cp.prefijo_telefono, '\D', '', 'g') <> ''
      AND length(cpr.telefono_normalizado) > length(regexp_replace(cp.prefijo_telefono, '\D', '', 'g'))
      AND left(cpr.telefono_normalizado, length(regexp_replace(cp.prefijo_telefono, '\D', '', 'g')))
          = regexp_replace(cp.prefijo_telefono, '\D', '', 'g')
  );

-- L-140
REVOKE EXECUTE ON FUNCTION public.crear_alta_asistida_pendiente(text, text, text, uuid, text, text, text, text, text, date, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_alta_asistida_pendiente(text, text, text, uuid, text, text, text, text, text, date, text, text) TO authenticated;
