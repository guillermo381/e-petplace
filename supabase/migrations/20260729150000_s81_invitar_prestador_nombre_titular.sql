-- S81 · EL NOMBRE REAL LO DECLARA QUIEN DA DE ALTA (orden founder).
-- El dato existe en la carta física y nadie lo guardaba: los 6 activos
-- tienen profiles.nombre = local-part del email (el fallback de
-- handle_new_user cuando la cuenta nace por Studio sin metadata).
--
-- 76(g): NO RIGE — DDL de función, cero backfill, cero anclas sobre
-- datos vivos al aplicar (el UPDATE condicional corre en el runtime de
-- cada alta futura, no en este apply).
-- Regla 78, MEDIDA EN EL MOMENTO (29-jul): CERO wrappers/bundles llaman
-- invitar_prestador (grep packages/api + apps = 0 fuera de types); el
-- único caller es el founder por SQL — el cambio de firma no rompe
-- ningún bundle vivo. RETURNS: agrega una clave (aditivo).
-- Reversa escrita ANTES: docs/relevamientos/
--   2026-07-29-s81-REVERSA-invitar-prestador-nombre.sql

-- L-119: la firma cambia — DROP explícito de la vieja (sin él quedaría
-- sobrecarga zombi).
DROP FUNCTION public.invitar_prestador(text, tipo_fiscal_enum, text, text, text, text, text, text, text);

CREATE FUNCTION public.invitar_prestador(
  p_email text,
  p_nombre_titular text,
  p_tipo_fiscal tipo_fiscal_enum,
  p_identificacion_fiscal text,
  p_razon_social text,
  p_nombre_comercial text,
  p_tipo_prestador text,
  p_country_code text DEFAULT 'EC'::text,
  p_proposito text DEFAULT NULL::text,
  p_direccion_envio text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_invitado uuid;
  v_email text := lower(trim(p_email));
  v_country text := upper(trim(p_country_code));
  v_tipos_validos text[] := ARRAY[
    'clinica_veterinaria','veterinario_independiente','grooming','paseador',
    'hotel_mascotas','adiestramiento','laboratorio','otro'
  ];
  v_cuenta uuid;
  v_prestador uuid;
  v_empleado uuid;
  v_nombre_escrito boolean := false;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email_requerido' USING ERRCODE = '22023';
  END IF;
  -- S81: OBLIGATORIO, cero derivación, cero default (L-180) — quien da
  -- de alta tiene la carta física con el nombre escrito.
  IF p_nombre_titular IS NULL OR trim(p_nombre_titular) = '' THEN
    RAISE EXCEPTION 'nombre_titular_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_tipo_prestador IS NULL OR NOT (p_tipo_prestador = ANY (v_tipos_validos)) THEN
    RAISE EXCEPTION 'tipo_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_identificacion_fiscal IS NULL OR trim(p_identificacion_fiscal) = ''
     OR p_razon_social IS NULL OR trim(p_razon_social) = ''
     OR p_nombre_comercial IS NULL OR trim(p_nombre_comercial) = '' THEN
    RAISE EXCEPTION 'datos_fiscales_incompletos' USING ERRCODE = '22023';
  END IF;

  SELECT u.id INTO v_invitado FROM auth.users u WHERE lower(u.email) = v_email;
  IF v_invitado IS NULL THEN
    RAISE EXCEPTION 'usuario_no_registrado' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.prestadores pr WHERE pr.user_id = v_invitado) THEN
    RAISE EXCEPTION 'ya_es_prestador' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.cuentas_comerciales cc WHERE cc.owner_profile_id = v_invitado) THEN
    RAISE EXCEPTION 'ya_tiene_cuenta' USING ERRCODE = '22023';
  END IF;

  -- S81: EL UPDATE ES CONDICIONAL, no incondicional (letra founder) —
  -- escribe SOLO si el actual está ausente o es el SEMBRADO por
  -- handle_new_user (split_part(email,'@',1)); si la persona lo declaró
  -- en el registro, SU nombre GANA. Corre ANTES del espejo del titular:
  -- prestador_empleados.nombre (COALESCE de profiles.nombre) hereda el
  -- nombre real en el mismo acto.
  UPDATE public.profiles pf
     SET nombre = trim(p_nombre_titular)
   WHERE pf.id = v_invitado
     AND (pf.nombre IS NULL OR trim(pf.nombre) = ''
          OR pf.nombre = split_part(pf.email, '@', 1));
  v_nombre_escrito := FOUND;

  BEGIN
    INSERT INTO public.cuentas_comerciales
      (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social,
       nombre_comercial, country_code)
    VALUES
      (v_invitado, p_tipo_fiscal, trim(p_identificacion_fiscal),
       trim(p_razon_social), trim(p_nombre_comercial), v_country)
    RETURNING id INTO v_cuenta;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'identificacion_en_uso' USING ERRCODE = '22023';
  END;

  INSERT INTO public.prestadores
    (user_id, cuenta_comercial_id, country_code, tipo, nombre_comercial,
     whatsapp, estado, radio_cobertura_km, proposito, direccion_envio, metadata)
  VALUES
    (v_invitado, v_cuenta, v_country, p_tipo_prestador,
     trim(p_nombre_comercial),
     '',
     'pendiente',
     NULL,
     NULLIF(trim(p_proposito), ''),
     NULLIF(trim(p_direccion_envio), ''),
     jsonb_build_object('created_via', 'invitar_prestador_s79'))
  RETURNING id INTO v_prestador;

  -- EL ESPEJO DEL TITULAR (la especificación es el backfill de V0 +
  -- S73, leída entera — no el síntoma):
  -- pieza 1: la fila prestador_empleados que TODO titular tiene (V0
  -- 20260717170000:113, shape verbatim).
  INSERT INTO public.prestador_empleados
    (prestador_id, user_id, rol, nombre, activo, modelo_pago,
     datos_bancarios, activado_en, created_by)
  SELECT v_prestador, v_invitado, 'dueño',
         COALESCE(p.nombre, trim(p_nombre_comercial)),
         true, 'manual', '{}'::jsonb, now(), v_invitado
  FROM (SELECT 1) unidad
  LEFT JOIN public.profiles p ON p.id = v_invitado
  RETURNING id INTO v_empleado;

  -- pieza 2: empleado_roles 'dueño' (S73 20260721210000:147, shape
  -- verbatim: asignado_por = el propio titular).
  INSERT INTO public.empleado_roles (empleado_id, rol, asignado_por)
  VALUES (v_empleado, 'dueño', v_invitado)
  ON CONFLICT (empleado_id, rol) DO NOTHING;

  INSERT INTO public.cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
  VALUES (v_cuenta, 'prestador_servicios', 'activo')
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role, country_code, is_active)
  VALUES (v_invitado, 'prestador', v_country, true)
  ON CONFLICT (user_id, role, country_code) DO UPDATE SET is_active = true;

  -- S81 (L-192): el resultado del UPDATE condicional SE DICE — un
  -- UPDATE que no escribe y no lo dice es la falla muda.
  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', v_cuenta,
                            'prestador_id', v_prestador,
                            'empleado_id', v_empleado,
                            'nombre_titular',
                            CASE WHEN v_nombre_escrito THEN 'escrito'
                                 ELSE 'respetado_declarado' END);
END;
$function$;

-- L-140: la función nace con EXECUTE para anon por default privileges —
-- se revoca EXPLÍCITO y se concede el mínimo (el gate real es is_admin()
-- adentro; authenticated puede llamar y rebotar hablado).
REVOKE EXECUTE ON FUNCTION public.invitar_prestador(text, text, tipo_fiscal_enum, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invitar_prestador(text, text, tipo_fiscal_enum, text, text, text, text, text, text, text) TO authenticated;

-- CINTURÓN in-migración (L-119 + L-140): una sola sobrecarga y proacl
-- sin anon — si falla, la migración ABORTA.
DO $verificacion$
DECLARE
  v_n int;
  v_acl text;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace AND proname = 'invitar_prestador';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon: sobrecargas de invitar_prestador = % (esperaba 1)', v_n;
  END IF;
  SELECT proacl::text INTO v_acl FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace AND proname = 'invitar_prestador';
  IF v_acl LIKE '%anon%' THEN
    RAISE EXCEPTION 'cinturon: proacl con anon — L-140 rota: %', v_acl;
  END IF;
END;
$verificacion$;
