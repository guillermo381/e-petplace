-- REVERSA de 20260817170000_s99a_repartidor_en_contexto.sql (escrita ANTES de aplicar)
-- Restaura obtener_contexto_arranque() a su versión previa (la de 20260817160000,
-- con ha_vendido y sin repartidor_de). Cuerpo tomado de la definición VIVA
-- leída con pg_get_functiondef ANTES de la migración (no de memoria).
--
-- ⚠️ Qué NO deshace: nada de datos (la migración es solo CREATE OR REPLACE de
-- una función de lectura — cero DDL de tablas, cero backfill). Revertir el
-- motor sin revertir el bundle deja al guard raíz sin el campo repartidor_de:
-- el wrapper lo leería undefined → [] (fail-closed: el repartidor vuelve al
-- callejón mudo, que es exactamente el estado pre-migración — degrada, no rompe).

CREATE OR REPLACE FUNCTION public.obtener_contexto_arranque()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid              uuid := auth.uid();
  v_prestador        jsonb;
  v_prestador_id     uuid;
  v_cta_id           uuid;
  v_cta_estado       text;
  v_cta_nombre       text;
  v_cta_pais         text;
  v_es_gestor        boolean := false;
  v_posicion         jsonb;
  v_hay_oficio_local boolean := false;
  v_es_vendedora     boolean := false;
  v_moneda           jsonb;
  v_ha_vendido       boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;

  SELECT to_jsonb(t) INTO v_prestador
  FROM public.obtener_mi_prestador() t
  LIMIT 1;
  v_prestador_id := (v_prestador ->> 'id')::uuid;

  IF v_prestador_id IS NOT NULL THEN
    v_es_gestor := COALESCE(
      public.empleado_tiene_rol(v_prestador_id, ARRAY['dueño','administrador']),
      false
    );
    v_posicion := public.obtener_mi_posicion_en_prestador(v_prestador_id);
    SELECT EXISTS (
      SELECT 1
      FROM public.prestador_servicios ps
      JOIN public.obtener_modalidades_por_oficio() m
        ON m.tipo_servicio = ps.tipo_servicio
      WHERE ps.prestador_id = v_prestador_id
        AND ps.activo
        AND ps.atiende_local
        AND m.admite_atencion_local
    ) INTO v_hay_oficio_local;
  END IF;

  SELECT c.id, c.estado, c.nombre_comercial, c.country_code
    INTO v_cta_id, v_cta_estado, v_cta_nombre, v_cta_pais
  FROM public.cuentas_comerciales c
  WHERE c.owner_profile_id = v_uid
  LIMIT 1;

  IF v_cta_id IS NULL AND (v_prestador ->> 'cuenta_comercial_id') IS NOT NULL THEN
    SELECT c.id, c.estado, c.nombre_comercial, c.country_code
      INTO v_cta_id, v_cta_estado, v_cta_nombre, v_cta_pais
    FROM public.cuentas_comerciales c
    WHERE c.id = (v_prestador ->> 'cuenta_comercial_id')::uuid;
  END IF;

  IF v_cta_id IS NOT NULL THEN
    v_es_vendedora := EXISTS (
      SELECT 1 FROM public.cuenta_roles r
      WHERE r.cuenta_comercial_id = v_cta_id
        AND r.tipo_actor::text = 'seller_productos'
        AND r.estado::text = 'activo'
    );
    v_ha_vendido := EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.cuenta_comercial_id = v_cta_id
        AND p.estado::text = 'entregado'
    );
    SELECT to_jsonb(cc) INTO v_moneda
    FROM (
      SELECT currency_code, currency_symbol, currency_decimals
      FROM public.country_config
      WHERE country_code = v_cta_pais
    ) cc;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'prestador', v_prestador,
    'es_gestor', v_es_gestor,
    'posicion', v_posicion,
    'hay_oficio_local', v_hay_oficio_local,
    'cuenta_comercial', CASE WHEN v_cta_id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_cta_id,
      'estado', v_cta_estado,
      'nombre_comercial', v_cta_nombre,
      'country_code', v_cta_pais
    ) END,
    'es_vendedora', v_es_vendedora,
    'ha_vendido', v_ha_vendido,
    'moneda', v_moneda
  );
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_contexto_arranque() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_contexto_arranque() TO authenticated;
