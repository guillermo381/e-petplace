-- ═════════════════════════════════════════════════════════════════════
-- S79-A · LA CURA DEL DIAGNÓSTICO vet2 (OK founder a las TRES) — EL
-- ESPEJO DEL TITULAR.
--
-- Causa (diagnóstico 2026-07-27-s79a-diagnostico-vet2.md): invitar_
-- prestador creaba el prestador SIN los eslabones que TODO titular
-- tiene. LA ESPECIFICACIÓN se leyó de la HISTORIA ENTERA, no del
-- síntoma (orden del founder): el backfill de V0 (20260717170000:113)
-- materializó por titular la fila prestador_empleados COMPLETA
-- (rol='dueño', nombre desde profiles con fallback a nombre_comercial,
-- activo, modelo_pago='manual', datos_bancarios '{}', activado_en,
-- created_by) — y el motor de equipo S73 (20260721210000:147) sumó la
-- SEGUNDA pieza: empleado_roles rol='dueño' (asignado_por = el propio
-- titular). Verificado en datos: TODOS los titulares vivos tienen las
-- dos. El espejo copia LAS DOS — espejar solo la que dolió habría
-- dejado la otra esperando a un vet reclutado.
--
-- Piezas:
--   ① invitar_prestador v3: el espejo adentro (misma firma ⇒ CREATE OR
--     REPLACE, L-119 no aplica). El gobierno D-526 no lo frena: DEFINER
--     corre como postgres (la llave de la casa).
--   ② BACKFILL determinista de los DOS vivos (Paseos Shyris 8026077e-
--     f96f-…, Clínica Los Shyris/vet2 5e53c898-…): por NOT EXISTS, ids
--     verificados contra DB antes de fijarse.
--   ③ activar_prestador v3: la guarda con PREDICADO PRECISO (fila con
--     prestador_id = X AND rol='dueño' AND activo — no "alguna fila"),
--     rebote hablado fila_dueno_faltante. El que habría atrapado esto
--     antes del dispositivo.
--
-- DECLARADO EN LETRA (LETRA_ALTA §2bis): crear_prestador_inicial tiene
-- el MISMO agujero (inserta prestadores + cuenta_roles, jamás
-- prestador_empleados); hoy no muerde (cero callers) pero vive en la
-- DB. Y el invariante "todo prestador tiene exactamente UNA fila dueño
-- activa" como constraint/trigger es DEUDA con disparo (D-561), no de
-- esta migración.
--
-- 76(g), DECLARADA: la pieza ② ES un backfill sobre datos vivos —
-- acotado (2 filas por NOT EXISTS, ids medidos), determinista, sin
-- anclas computadas, y sin ventana de escritura concurrente (nada
-- escribe prestador_empleados de esos negocios: son los únicos dos sin
-- fila y sin superficie de equipo abierta). Veda NO necesaria,
-- declarada. ①/③ son DDL de función.
-- REVERSA escrita ANTES de aplicar (con su nota regla-41 a futuro):
--   docs/relevamientos/2026-07-27-s79a-REVERSA-espejo-titular.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

-- ── ① invitar_prestador v3 — el espejo del titular adentro ───────────
CREATE OR REPLACE FUNCTION public.invitar_prestador(
  p_email text,
  p_tipo_fiscal tipo_fiscal_enum,
  p_identificacion_fiscal text,
  p_razon_social text,
  p_nombre_comercial text,
  p_tipo_prestador text,
  p_country_code text DEFAULT 'EC',
  p_proposito text DEFAULT NULL,
  p_direccion_envio text DEFAULT NULL
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

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', v_cuenta,
                            'prestador_id', v_prestador,
                            'empleado_id', v_empleado);
END;
$function$;

-- ── ② el BACKFILL de los DOS vivos (determinista, ids medidos) ───────
WITH sin_dueno AS (
  SELECT pr.id, pr.user_id, pr.nombre_comercial
  FROM public.prestadores pr
  WHERE pr.id IN ('8026077e-f96f-4127-9597-8f4b2646a1b2',   -- Paseos Shyris
                  '5e53c898-2c6d-4061-a1a6-84b58dcdd524')   -- Clínica Los Shyris (vet2)
    AND NOT EXISTS (SELECT 1 FROM public.prestador_empleados pe
                    WHERE pe.prestador_id = pr.id AND pe.rol = 'dueño')
),
nuevos AS (
  INSERT INTO public.prestador_empleados
    (prestador_id, user_id, rol, nombre, activo, modelo_pago,
     datos_bancarios, activado_en, created_by)
  SELECT sd.id, sd.user_id, 'dueño',
         COALESCE(p.nombre, sd.nombre_comercial),
         true, 'manual', '{}'::jsonb, now(), sd.user_id
  FROM sin_dueno sd
  LEFT JOIN public.profiles p ON p.id = sd.user_id
  RETURNING id, user_id
)
INSERT INTO public.empleado_roles (empleado_id, rol, asignado_por)
SELECT n.id, 'dueño', n.user_id FROM nuevos n;

-- ── ③ activar_prestador v3 — la guarda del checklist ─────────────────
CREATE OR REPLACE FUNCTION public.activar_prestador(
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
  v_cuenta_estado estado_cuenta_comercial_enum;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;
  IF p_veredicto IS NULL OR p_veredicto NOT IN ('activo', 'rechazado') THEN
    RAISE EXCEPTION 'veredicto_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT pr.id, pr.tipo, pr.direccion, pr.lat, pr.lon, pr.radio_cobertura_km,
         pr.cuenta_comercial_id
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

  -- EL CHECKLIST §3 — ítem 0 (cura del diagnóstico vet2): la fila dueño
  -- ACTIVA, con predicado PRECISO — no "alguna fila". Sin ella el motor
  -- entero no opera (la ocupación es de la PERSONA, §2).
  IF NOT EXISTS (
    SELECT 1 FROM public.prestador_empleados pe
    WHERE pe.prestador_id = p_prestador_id
      AND pe.rol = 'dueño'
      AND pe.activo
  ) THEN
    RAISE EXCEPTION 'fila_dueno_faltante' USING ERRCODE = '22023';
  END IF;

  IF v_fila.direccion IS NULL OR trim(v_fila.direccion) = ''
     OR v_fila.lat IS NULL OR v_fila.lon IS NULL THEN
    RAISE EXCEPTION 'direccion_sin_coordenadas' USING ERRCODE = '22023';
  END IF;
  IF v_fila.radio_cobertura_km IS NULL THEN
    RAISE EXCEPTION 'radio_no_declarado' USING ERRCODE = '22023';
  END IF;
  IF v_fila.tipo IN ('clinica_veterinaria', 'veterinario_independiente')
     AND NOT EXISTS (
       SELECT 1 FROM public.prestador_documentos d
       WHERE d.prestador_id = p_prestador_id
         AND d.tipo IN ('titulo_profesional', 'registro_senescyt')
         AND d.estado = 'aprobado'
     ) THEN
    RAISE EXCEPTION 'verificacion_profesional_pendiente' USING ERRCODE = '23514';
  END IF;

  SELECT cc.estado INTO v_cuenta_estado
  FROM public.cuentas_comerciales cc
  WHERE cc.id = v_fila.cuenta_comercial_id
  FOR UPDATE;

  IF v_cuenta_estado IN ('suspendida', 'cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_activable' USING ERRCODE = '22023';
  END IF;

  IF v_cuenta_estado = 'pendiente_validacion' THEN
    UPDATE public.cuentas_comerciales
       SET estado = 'activa',
           activado_en = now()
     WHERE id = v_fila.cuenta_comercial_id;
  END IF;

  UPDATE public.prestadores
     SET estado = 'activo',
         aprobado_por = v_auth,
         aprobado_en = now(),
         motivo_rechazo = NULL
   WHERE id = p_prestador_id;

  RETURN jsonb_build_object('ok', true, 'prestador_id', p_prestador_id,
                            'estado', 'activo', 'cuenta_estado', 'activa');
END;
$function$;

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE v_sin int; v_roles int; v_n int;
BEGIN
  -- el invariante en datos: CERO prestadores sin fila dueño activa
  SELECT count(*) INTO v_sin FROM public.prestadores pr
  WHERE NOT EXISTS (SELECT 1 FROM public.prestador_empleados pe
                    WHERE pe.prestador_id = pr.id AND pe.rol='dueño' AND pe.activo);
  IF v_sin <> 0 THEN
    RAISE EXCEPTION 'verificacion: quedan % prestadores sin fila dueño activa', v_sin;
  END IF;

  -- las dos piezas del espejo: cada fila dueño tiene su empleado_roles
  SELECT count(*) INTO v_roles FROM public.prestador_empleados pe
  WHERE pe.rol='dueño'
    AND NOT EXISTS (SELECT 1 FROM public.empleado_roles er
                    WHERE er.empleado_id = pe.id AND er.rol='dueño');
  IF v_roles <> 0 THEN
    RAISE EXCEPTION 'verificacion: % filas dueño sin su empleado_roles', v_roles;
  END IF;

  -- L-119: una sola versión de cada función
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
  WHERE ns.nspname='public' AND p.proname IN ('invitar_prestador','activar_prestador');
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'verificacion L-119: % funciones (se esperaban 2)', v_n;
  END IF;
END $$;

commit;
