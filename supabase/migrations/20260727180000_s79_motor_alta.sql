-- ═════════════════════════════════════════════════════════════════════
-- S79-A · T4.4 — EL MOTOR DEL ALTA (LETRA_ALTA_S79 §1-§3, decisiones
-- founder T4; mediciones T4.2 en el acta de la tanda).
--
-- Dos RPCs con gate is_admin() — EL PORTAL ADMIN NO NACE (§6: disparo
-- verbatim del founder = la TERCERA operación admin, o el día que las
-- opere alguien que no sea el founder):
--
--   · invitar_prestador — fase 1: crea cuenta comercial + prestador
--     'pendiente' atados al mail invitado. Patrón MINADO de
--     aceptar_invitacion_pendiente_login (T4.2c): resolución por email
--     contra auth.users + concesiones idempotentes (cuenta_roles /
--     user_roles con ON CONFLICT, espejo de crear_prestador_inicial y
--     del wizard legado). El invitado debe EXISTIR en auth
--     (usuario_no_registrado si no — se registra primero, se invita
--     después). radio_cobertura_km se inserta NULL EXPLÍCITO: pisa el
--     DEFAULT 5 todavía vivo (cae con el CONTRATO gated) — nadie
--     declaró radio en una invitación (L-139/LETRA_PERFIL §2.1).
--
--   · activar_prestador — fase 3: el checklist §3 MECÁNICO ("la DB
--     manda"): sin dirección+coordenadas, sin radio, o sin credencial
--     aprobada para oficio médico ⇒ rebote TIPADO. "Un prestador
--     activo pero no ofertable por geografía" pasa a ser imposible de
--     fabricar por esta puerta. Es el PRIMER escritor de transiciones
--     de estado del monorepo (medido T4.2a: ninguna función viva las
--     escribía — eran del portal legado). El trigger D-389
--     (_prestadores_protege_columnas) no la frena: DEFINER corre como
--     postgres (la llave de la casa, S75/S76).
--
-- Estados legales (CHECK medido T4.2a): pendiente · en_revision ·
-- activo · suspendido · rechazado.
--
-- 76(g), DECLARADA: NO RIGE — DDL de funciones nuevas; cero backfill,
-- cero anclas sobre datos vivos, cero filas tocadas al aplicar.
-- REVERSA escrita ANTES de aplicar:
--   docs/relevamientos/2026-07-27-s79a-REVERSA-motor-alta.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

-- ── 1) invitar_prestador (fase 1) ────────────────────────────────────
CREATE FUNCTION public.invitar_prestador(
  p_email text,
  p_tipo_fiscal tipo_fiscal_enum,
  p_identificacion_fiscal text,
  p_razon_social text,
  p_nombre_comercial text,
  p_tipo_prestador text,
  p_country_code text DEFAULT 'EC'
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
  IF p_tipo_prestador IS NULL OR NOT (p_tipo_prestador = ANY (v_tipos_validos)) THEN
    RAISE EXCEPTION 'tipo_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_identificacion_fiscal IS NULL OR trim(p_identificacion_fiscal) = ''
     OR p_razon_social IS NULL OR trim(p_razon_social) = ''
     OR p_nombre_comercial IS NULL OR trim(p_nombre_comercial) = '' THEN
    RAISE EXCEPTION 'datos_fiscales_incompletos' USING ERRCODE = '22023';
  END IF;

  -- El patrón minado (T4.2c): la identidad se resuelve por EMAIL contra
  -- auth.users — el invitado ya se registró (§1: se registra primero,
  -- se invita después).
  SELECT u.id INTO v_invitado FROM auth.users u WHERE lower(u.email) = v_email;
  IF v_invitado IS NULL THEN
    RAISE EXCEPTION 'usuario_no_registrado' USING ERRCODE = '22023';
  END IF;

  -- Espejos de los índices únicos (rebote hablado antes que constraint crudo).
  IF EXISTS (SELECT 1 FROM public.prestadores pr WHERE pr.user_id = v_invitado) THEN
    RAISE EXCEPTION 'ya_es_prestador' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.cuentas_comerciales cc WHERE cc.owner_profile_id = v_invitado) THEN
    RAISE EXCEPTION 'ya_tiene_cuenta' USING ERRCODE = '22023';
  END IF;

  BEGIN
    INSERT INTO public.cuentas_comerciales
      (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social,
       nombre_comercial, country_code)
    VALUES
      (v_invitado, p_tipo_fiscal, trim(p_identificacion_fiscal),
       trim(p_razon_social), trim(p_nombre_comercial), v_country)
    RETURNING id INTO v_cuenta;
  EXCEPTION WHEN unique_violation THEN
    -- uq_cuenta_identificacion_pais: el RUC/cédula ya tiene cuenta.
    RAISE EXCEPTION 'identificacion_en_uso' USING ERRCODE = '22023';
  END;

  INSERT INTO public.prestadores
    (user_id, cuenta_comercial_id, country_code, tipo, nombre_comercial,
     whatsapp, estado, radio_cobertura_km, metadata)
  VALUES
    (v_invitado, v_cuenta, v_country, p_tipo_prestador,
     trim(p_nombre_comercial),
     '',                     -- whatsapp NOT NULL legacy: el "sin dato" es '' (relevado)
     'pendiente',
     NULL,                   -- EXPLÍCITO: pisa el DEFAULT 5 vivo — nadie declaró radio
     jsonb_build_object('created_via', 'invitar_prestador_s79'))
  RETURNING id INTO v_prestador;

  -- El rol financiero nace con la sede (§7.5, espejo crear_prestador_inicial).
  INSERT INTO public.cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
  VALUES (v_cuenta, 'prestador_servicios', 'activo')
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;

  -- El rol de acceso (Decisión P, espejo del wizard legado).
  INSERT INTO public.user_roles (user_id, role, country_code, is_active)
  VALUES (v_invitado, 'prestador', v_country, true)
  ON CONFLICT (user_id, role, country_code) DO UPDATE SET is_active = true;

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', v_cuenta,
                            'prestador_id', v_prestador);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.invitar_prestador(text, tipo_fiscal_enum, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invitar_prestador(text, tipo_fiscal_enum, text, text, text, text, text) TO authenticated;

-- ── 2) activar_prestador (fase 3 — el checklist mecánico) ────────────
CREATE FUNCTION public.activar_prestador(
  p_prestador_id uuid,
  p_veredicto text,
  p_motivo text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_fila record;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;
  IF p_veredicto IS NULL OR p_veredicto NOT IN ('activo', 'rechazado') THEN
    -- suspendido/en_revision no son veredictos de esta puerta.
    RAISE EXCEPTION 'veredicto_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT pr.id, pr.tipo, pr.direccion, pr.lat, pr.lon, pr.radio_cobertura_km
  INTO v_fila
  FROM public.prestadores pr
  WHERE pr.id = p_prestador_id
  FOR UPDATE;
  IF v_fila.id IS NULL THEN
    RAISE EXCEPTION 'prestador_no_encontrado' USING ERRCODE = '22023';
  END IF;

  IF p_veredicto = 'rechazado' THEN
    IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
      RAISE EXCEPTION 'motivo_requerido' USING ERRCODE = '22023';
    END IF;
    UPDATE public.prestadores
       SET estado = 'rechazado',
           motivo_rechazo = trim(p_motivo)
     WHERE id = p_prestador_id;
    RETURN jsonb_build_object('ok', true, 'prestador_id', p_prestador_id,
                              'estado', 'rechazado');
  END IF;

  -- EL CHECKLIST §3 — mecánico, tipado, en orden:
  -- 1) dirección CON coordenadas (la firma §2.2: sin datos, sin oferta
  --    geográfica — y activar sin datos fabricaría un invisible).
  IF v_fila.direccion IS NULL OR trim(v_fila.direccion) = ''
     OR v_fila.lat IS NULL OR v_fila.lon IS NULL THEN
    RAISE EXCEPTION 'direccion_sin_coordenadas' USING ERRCODE = '22023';
  END IF;
  -- 2) radio declarado (jamás un default — LETRA_PERFIL §2.1).
  IF v_fila.radio_cobertura_km IS NULL THEN
    RAISE EXCEPTION 'radio_no_declarado' USING ERRCODE = '22023';
  END IF;
  -- 3) cuenta comercial: garantizada por construcción (FK NOT NULL).
  -- 4) credencial de la PERSONA si el negocio es de oficio médico
  --    (LETRA_PERFIL §6: el permiso del establecimiento se recolecta,
  --    no bloquea). Mismo nombre del trigger vivo S68 — este check es
  --    la copia del gate en el checklist, no su reemplazo: el trigger
  --    sigue siendo la autoridad al activar cada oferta.
  IF v_fila.tipo IN ('clinica_veterinaria', 'veterinario_independiente')
     AND NOT EXISTS (
       SELECT 1 FROM public.prestador_documentos d
       WHERE d.prestador_id = p_prestador_id
         AND d.tipo IN ('titulo_profesional', 'registro_senescyt')
         AND d.estado = 'aprobado'
     ) THEN
    RAISE EXCEPTION 'verificacion_profesional_pendiente' USING ERRCODE = '23514';
  END IF;

  UPDATE public.prestadores
     SET estado = 'activo',
         aprobado_por = v_auth,
         aprobado_en = now(),
         motivo_rechazo = NULL
   WHERE id = p_prestador_id;

  RETURN jsonb_build_object('ok', true, 'prestador_id', p_prestador_id,
                            'estado', 'activo');
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.activar_prestador(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activar_prestador(uuid, text, text) TO authenticated;

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE v_anon int; v_n int;
BEGIN
  SELECT count(*) INTO v_n
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('invitar_prestador','activar_prestador');
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'verificacion T4.4: se esperaban 2 funciones, hay %', v_n;
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace,
       LATERAL aclexplode(p.proacl) a JOIN pg_roles r ON r.oid = a.grantee
  WHERE n.nspname='public'
    AND p.proname IN ('invitar_prestador','activar_prestador')
    AND r.rolname='anon';
  IF v_anon > 0 THEN
    RAISE EXCEPTION 'verificacion L-140: anon con % grants en el motor del alta', v_anon;
  END IF;
END $$;

commit;
