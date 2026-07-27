-- ═════════════════════════════════════════════════════════════════════
-- S79-A · T4.6 (paso 4 y 5) — LAS TRES LECTORAS HERMANAS ganan el AND
-- geográfico EN LA MISMA TANDA que el paseo (sin ventana en que un
-- oficio filtre y los otros no) + invitar_prestador gana
-- proposito/direccion_envio (LETRA_ALTA §5, declarado en Tanda 4).
--
-- L-141 CUMPLIDA: los tres bodies se leyeron ENTEROS con
-- pg_get_functiondef ANTES de tocarse (archivados en la reversa, que
-- los restaura verbatim). El AND es EL MISMO de LETRA_PERFIL §2.2
-- (firma founder): SIN COALESCE — un prestador sin coordenadas o sin
-- radio declarado NO se oferta por geografía; un cliente sin
-- coordenadas ve lo de siempre (§2.3, transición declarada).
-- Cambio de FIRMA en las cuatro ⇒ DROP explícito (L-119) + ACL
-- re-establecida (L-140).
--
-- 76(g), DECLARADA: NO RIGE — DDL de funciones, cero backfill, cero
-- anclas sobre datos vivos.
-- REVERSA escrita ANTES de aplicar:
--   docs/relevamientos/2026-07-27-s79a-REVERSA-hermanas-geo.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

-- ── 1) adiestramiento ────────────────────────────────────────────────
DROP FUNCTION public.obtener_adiestradores_disponibles(date, time without time zone, uuid);

CREATE FUNCTION public.obtener_adiestradores_disponibles(
  p_fecha date, p_hora time without time zone, p_mascota_id uuid,
  p_lat double precision DEFAULT NULL, p_lon double precision DEFAULT NULL)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, comprable text, programa_id uuid, nombre text, nivel text, n_sesiones integer, vigencia_dias integer, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'adiestramiento') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id, o.prestador_servicio_id, o.prestador_nombre,
    o.tipo_servicio, o.comprable, o.programa_id, o.nombre,
    o.nivel, o.n_sesiones, o.vigencia_dias,
    o.precio, o.duracion_minutos, o.direccion, o.ciudad
  FROM _adiestramiento_ofertas_cobrables(p_mascota_id) o
  WHERE _mascota_elegible_servicio(p_mascota_id, o.tipo_servicio)
    -- LETRA_PERFIL §2.2 (firma): SIN COALESCE. §2.3: cliente sin
    -- coordenadas = sin filtro (lo de hoy).
    AND (
      p_lat IS NULL OR p_lon IS NULL
      OR EXISTS (
        SELECT 1 FROM prestadores geo
        WHERE geo.id = o.prestador_id
          AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
          AND geo.radio_cobertura_km IS NOT NULL
          AND 2 * 6371 * asin(sqrt(
                power(sin(radians((geo.lat - p_lat) / 2)), 2)
                + cos(radians(p_lat)) * cos(radians(geo.lat))
                  * power(sin(radians((geo.lon - p_lon) / 2)), 2)
              )) <= geo.radio_cobertura_km
      )
    )
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.comprable, o.precio, o.nombre;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_adiestradores_disponibles(date, time without time zone, uuid, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_adiestradores_disponibles(date, time without time zone, uuid, double precision, double precision) TO authenticated;

-- ── 2) grooming ──────────────────────────────────────────────────────
DROP FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid, text);

CREATE FUNCTION public.obtener_groomers_disponibles(
  p_fecha date, p_hora time without time zone, p_tipo_servicio text,
  p_mascota_id uuid, p_modalidad text DEFAULT 'local',
  p_lat double precision DEFAULT NULL, p_lon double precision DEFAULT NULL)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text, precio_base numeric, extra_pelaje numeric, recargo_domicilio numeric)
 LANGUAGE plpgsql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_modalidad NOT IN ('local', 'domicilio') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = p_tipo_servicio AND ts.categoria = 'grooming' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, p_tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  SELECT m.talla INTO v_talla FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_talla IS NULL THEN
    RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id,
    o.prestador_servicio_id,
    o.prestador_nombre,
    o.servicio_nombre,
    o.precio,
    o.duracion_minutos,
    o.direccion,
    o.ciudad,
    (SELECT pst.precio FROM prestador_servicio_tallas pst
      WHERE pst.prestador_servicio_id = o.prestador_servicio_id
        AND pst.talla = v_talla),
    CASE WHEN (SELECT m.pelaje FROM mascotas m WHERE m.id = p_mascota_id) = 'largo'
         THEN COALESCE((SELECT pr.grooming_extra_pelaje_largo FROM prestadores pr WHERE pr.id = o.prestador_id), 0)
         ELSE 0 END,
    CASE WHEN p_modalidad = 'domicilio'
         THEN COALESCE((SELECT pr.grooming_recargo_domicilio FROM prestadores pr WHERE pr.id = o.prestador_id), 0)
         ELSE 0 END
  FROM _grooming_ofertas_cobrables(p_mascota_id, p_modalidad) o
  WHERE o.tipo_servicio = p_tipo_servicio
    -- LETRA_PERFIL §2.2 (firma): SIN COALESCE. §2.3: transición.
    AND (
      p_lat IS NULL OR p_lon IS NULL
      OR EXISTS (
        SELECT 1 FROM prestadores geo
        WHERE geo.id = o.prestador_id
          AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
          AND geo.radio_cobertura_km IS NOT NULL
          AND 2 * 6371 * asin(sqrt(
                power(sin(radians((geo.lat - p_lat) / 2)), 2)
                + cos(radians(p_lat)) * cos(radians(geo.lat))
                  * power(sin(radians((geo.lon - p_lon) / 2)), 2)
              )) <= geo.radio_cobertura_km
      )
    )
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.precio, o.prestador_nombre;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid, text, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid, text, double precision, double precision) TO authenticated;

-- ── 3) veterinaria ───────────────────────────────────────────────────
DROP FUNCTION public.obtener_veterinarios_disponibles(date, time without time zone, text, uuid);

CREATE FUNCTION public.obtener_veterinarios_disponibles(
  p_fecha date, p_hora time without time zone, p_tipo_servicio text,
  p_mascota_id uuid,
  p_lat double precision DEFAULT NULL, p_lon double precision DEFAULT NULL)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_solo_hoy boolean;
  v_reservable boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  SELECT ts.reserva_solo_hoy, ts.reservable INTO v_solo_hoy, v_reservable
  FROM tipos_servicio ts
  WHERE ts.codigo = p_tipo_servicio
    AND ts.categoria IN ('veterinario', 'telemedicina', 'emergencia')
    AND ts.activo;
  IF v_reservable IS NULL THEN
    RAISE EXCEPTION 'servicio_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT v_reservable THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, p_tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;
  IF v_solo_hoy AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id,
    o.prestador_servicio_id,
    o.prestador_nombre,
    o.servicio_nombre,
    o.precio,
    o.duracion_minutos,
    o.direccion,
    o.ciudad
  FROM _vet_ofertas_cobrables(p_mascota_id) o
  WHERE o.tipo_servicio = p_tipo_servicio
    -- LETRA_PERFIL §2.2 (firma): SIN COALESCE. §2.3: transición.
    AND (
      p_lat IS NULL OR p_lon IS NULL
      OR EXISTS (
        SELECT 1 FROM prestadores geo
        WHERE geo.id = o.prestador_id
          AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
          AND geo.radio_cobertura_km IS NOT NULL
          AND 2 * 6371 * asin(sqrt(
                power(sin(radians((geo.lat - p_lat) / 2)), 2)
                + cos(radians(p_lat)) * cos(radians(geo.lat))
                  * power(sin(radians((geo.lon - p_lon) / 2)), 2)
              )) <= geo.radio_cobertura_km
      )
    )
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.precio, o.prestador_nombre;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_veterinarios_disponibles(date, time without time zone, text, uuid, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_veterinarios_disponibles(date, time without time zone, text, uuid, double precision, double precision) TO authenticated;

-- ── 4) invitar_prestador gana proposito/direccion_envio (LETRA_ALTA §5) ──
DROP FUNCTION public.invitar_prestador(text, tipo_fiscal_enum, text, text, text, text, text);

CREATE FUNCTION public.invitar_prestador(
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
     -- LETRA_ALTA §5: la APLICACIÓN captura el propósito (VERBATIM, es
     -- SU voz) y la dirección del kit. NULL honesto si no llegaron.
     NULLIF(trim(p_proposito), ''),
     NULLIF(trim(p_direccion_envio), ''),
     jsonb_build_object('created_via', 'invitar_prestador_s79'))
  RETURNING id INTO v_prestador;

  INSERT INTO public.cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
  VALUES (v_cuenta, 'prestador_servicios', 'activo')
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role, country_code, is_active)
  VALUES (v_invitado, 'prestador', v_country, true)
  ON CONFLICT (user_id, role, country_code) DO UPDATE SET is_active = true;

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', v_cuenta,
                            'prestador_id', v_prestador);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.invitar_prestador(text, tipo_fiscal_enum, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invitar_prestador(text, tipo_fiscal_enum, text, text, text, text, text, text, text) TO authenticated;

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE v_n int; v_anon int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
  WHERE ns.nspname='public'
    AND p.proname IN ('obtener_adiestradores_disponibles','obtener_groomers_disponibles',
                      'obtener_veterinarios_disponibles','invitar_prestador');
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'verificacion L-119: se esperaban 4 funciones sin sobrecargas, hay %', v_n;
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace,
       LATERAL aclexplode(p.proacl) a JOIN pg_roles r ON r.oid=a.grantee
  WHERE ns.nspname='public'
    AND p.proname IN ('obtener_adiestradores_disponibles','obtener_groomers_disponibles',
                      'obtener_veterinarios_disponibles','invitar_prestador')
    AND r.rolname='anon';
  IF v_anon > 0 THEN
    RAISE EXCEPTION 'verificacion L-140: anon con % grants', v_anon;
  END IF;
END $$;

commit;
