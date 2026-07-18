-- ============================================================================
-- S69-A7 — LA SEGUNDA CABEZA DE A6: el gate de aprobar/rechazar sin familia_miembro
-- Hallazgo de gate (founder): el dueño titular por familia_miembro VE su
-- presupuesto (A6 curó la policy) pero aprobar_presupuesto_familia le rebota
-- 'no_es_familia' — el gate de la RPC quedó con el check viejo (codueño/autorizado
-- inline) sin la pata familia_miembro. Barrido (L-144): el patrón está INLINE en
-- aprobar_presupuesto_familia y rechazar_presupuesto (3ª aparición del bug tras la
-- policy SELECT de A6). Anti-recurrencia: se extrae UN helper compartido
-- _user_es_familia_de_mascota (espejo exacto de la cura de policy A6) y las dos
-- funciones lo usan — una sola verdad, no hay cuarta cabeza posible.
--
-- (Reportado, NO curado acá: user_puede_ver_dimension usa el mismo patrón pero es
--  otro subsistema — fast-path del expediente + level-gating; su gap es de
--  privacidad del BIO_EXPEDIENTE, decisión de mesa = D-441. No se toca en silencio.)
--
-- DECLARACIÓN 76(g): 1 helper nuevo + CREATE OR REPLACE de 2 funciones (firma y
-- ACL intactas) + verificación con fixtures self-contained y ROLLBACK. La prueba
-- con el actor real (dd024680 sobre Thor vivo) se corre APARTE, rolled back.
-- NO RIGE VEDA.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 1 — el helper compartido (familia_miembro + codueño + autorizado)
-- ────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION public._user_es_familia_de_mascota(p_mascota_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM mascotas m
      JOIN familia_miembro fm ON fm.familia_id = m.familia_id
      WHERE m.id = p_mascota_id
        AND fm.user_id = p_user_id AND fm.hasta IS NULL
        AND fm.rol IN ('adulto_titular', 'adulto_autorizado')
    )
    OR public."_user_es_codueño_mascota"(p_mascota_id, p_user_id)
    OR public._user_es_familiar_autorizado_mascota(p_mascota_id, p_user_id);
$function$;
REVOKE EXECUTE ON FUNCTION public._user_es_familia_de_mascota(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._user_es_familia_de_mascota(uuid, uuid) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 2 — las dos RPCs usan el helper (firma y ACL intactas)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.aprobar_presupuesto_familia(p_presupuesto_id uuid)
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
  IF NOT public._user_es_familia_de_mascota(v_p.mascota_id, v_uid) THEN
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

CREATE OR REPLACE FUNCTION public.rechazar_presupuesto(p_presupuesto_id uuid, p_motivo text DEFAULT NULL::text)
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
  IF NOT public._user_es_familia_de_mascota(v_p.mascota_id, v_uid) THEN
    RAISE EXCEPTION 'no_es_familia' USING ERRCODE = '42501';
  END IF;
  IF v_p.estado <> 'enviado' THEN RAISE EXCEPTION 'presupuesto_no_enviado' USING ERRCODE = '22023'; END IF;

  UPDATE presupuesto SET estado = 'rechazado', motivo_rechazo = p_motivo, updated_at = now()
  WHERE id = p_presupuesto_id;
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3 — VERIFICACIÓN: un titular por familia_miembro (SIN codueño) aprueba Y rechaza
-- ────────────────────────────────────────────────────────────────────────────
DO $verif$
DECLARE
  v_vet uuid := gen_random_uuid();
  v_dueno uuid := gen_random_uuid();
  v_cuenta uuid; v_prestador uuid; v_familia uuid; v_mascota uuid;
  v_pid1 uuid; v_pid2 uuid; v_res jsonb; v_estado text; v_bad text;
BEGIN
  BEGIN
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_vet, 'authenticated','authenticated','a7-vet@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000'),
           (v_dueno, 'authenticated','authenticated','a7-dueno@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');
    -- dueño titular por familia_miembro, SIN mascota_codueño (el caso exacto de Thor)
    INSERT INTO familia (nombre, tipo, country_code, created_by_user_id)
    VALUES ('Familia A7', 'estandar', 'EC', v_dueno) RETURNING id INTO v_familia;
    INSERT INTO familia_miembro (id, familia_id, user_id, rol, desde, created_at, updated_at)
    VALUES (gen_random_uuid(), v_familia, v_dueno, 'adulto_titular', now(), now(), now());
    INSERT INTO cuentas_comerciales (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    VALUES (v_vet, 'persona_natural', 'A7-9999', 'Clínica A7', 'A7 Vet', 'EC') RETURNING id INTO v_cuenta;
    INSERT INTO prestadores (user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id)
    VALUES (v_vet, 'clinica_veterinaria', 'A7 Vet', '0999333444', v_cuenta) RETURNING id INTO v_prestador;
    INSERT INTO mascotas (nombre, origen, familia_id, user_id, especie, country_code)
    VALUES ('A7 Pet', 'desconocido', v_familia, v_dueno, 'perro', 'EC') RETURNING id INTO v_mascota;
    INSERT INTO mascota_acceso_prestador (mascota_id, cuenta_comercial_id, otorgado_por_user_id, metodo_otorgamiento)
    VALUES (v_mascota, v_cuenta, v_vet, 'busqueda_app_cliente');

    -- el vet arma y envía dos presupuestos
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_pid1 := crear_presupuesto_borrador(v_cuenta, v_mascota, jsonb_build_array(jsonb_build_object('descripcion_libre','Cirugía','precio',200)));
    v_pid2 := crear_presupuesto_borrador(v_cuenta, v_mascota, jsonb_build_array(jsonb_build_object('descripcion_libre','Estudio','precio',50)));
    PERFORM enviar_presupuesto(v_pid1, now() + interval '7 days');
    PERFORM enviar_presupuesto(v_pid2, now() + interval '7 days');

    -- el DUEÑO (titular por familia_miembro, SIN codueño) APRUEBA
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_dueno, 'role', 'authenticated')::text, true);
    v_res := aprobar_presupuesto_familia(v_pid1);
    IF (v_res ->> 'cita_id') IS NULL THEN RAISE EXCEPTION 'A7 abort: el titular por familia_miembro NO pudo aprobar'; END IF;
    SELECT estado INTO v_estado FROM presupuesto WHERE id = v_pid1;
    IF v_estado <> 'aprobado' THEN RAISE EXCEPTION 'A7 abort: tras aprobar, estado=%', v_estado; END IF;

    -- y RECHAZA el otro
    PERFORM rechazar_presupuesto(v_pid2, 'ahora no');
    SELECT estado INTO v_estado FROM presupuesto WHERE id = v_pid2;
    IF v_estado <> 'rechazado' THEN RAISE EXCEPTION 'A7 abort: tras rechazar, estado=%', v_estado; END IF;

    -- sonda L-140 del helper nuevo
    SELECT string_agg(p.proname, ', ') INTO v_bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = '_user_es_familia_de_mascota'
      AND array_to_string(COALESCE(p.proacl, ARRAY[]::aclitem[]), ',') LIKE '%anon=%';
    IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'A7 abort L-140: % con anon', v_bad; END IF;

    RAISE EXCEPTION 'S69_A7_ASSERTS_OK -> titular por familia_miembro (sin codueño) APRUEBA y RECHAZA; helper compartido; sonda L-140';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM NOT LIKE 'S69_A7_ASSERTS_OK%' THEN RAISE; END IF;
      RAISE NOTICE '%', SQLERRM;
  END;
END;
$verif$;

-- ============================================================================
-- FIN S69-A7.
-- ============================================================================
