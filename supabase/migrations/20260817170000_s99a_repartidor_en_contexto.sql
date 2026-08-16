-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · L2 (Gate 2, hallazgo ④) — EL LECTOR DE IDENTIDAD DEL REPARTIDOR
-- `repartidor_de` entra a obtener_contexto_arranque(): las casas donde el
-- usuario ES repartidor con vínculo SELLADO (user_id = auth.uid() +
-- vinculo_aceptado_en NOT NULL + activo).
--
-- POR QUÉ ESTE LECTOR Y NO DERIVAR DE misEntregasAsignadas (medición de C,
-- Gate 2 ④): ese lector devuelve vacío tanto para «no es repartidor» como
-- para «hoy no tiene entregas» — decidir identidad con él sería L-218 otra
-- vez (tres significados en un []). Este campo dice QUIÉN ES, no qué tiene.
--
-- EL ROJO QUE CURA (cuarta muestra de «motor sin puerta», un piso más
-- arriba): Diego aceptó su vínculo (sellado en la base, envío 7597 nacido)
-- y el resolvedor del guard raíz siguió diciendo «sin rol prestador» — el
-- callejón quedó MUDO porque ya no hay pendiente que la tarjeta dibuje. La
-- pantalla del repartidor existe desde S96 y nadie puede alcanzarla. La
-- rama del resolvedor que consume este campo es de D (contrato en el Loop).
--
-- DISTINCIÓN CONTRA mis_vinculos_repartidor_pendientes: aquel lista lo NO
-- aceptado (para el reclamo); éste lo SELLADO (para entrar). Un repartidor
-- con user_id y sin aceptar NO aparece acá (brazo ③ del cinturón).
--
-- 76(g): NO RIGE — CREATE OR REPLACE de función de lectura, cero DDL de
-- tablas, cero backfill, cero anclas. Reversa escrita ANTES en
-- docs/relevamientos/2026-08-17-s99a-REVERSA-repartidor-en-contexto.sql
-- (con su nota: revertir motor sin revertir bundle DEGRADA a callejón mudo,
-- no rompe — el wrapper lee undefined → []).
-- Bundles vivos (D-662): el bundle publicado llama la MISMA firma y IGNORA
-- el campo nuevo (jsonb aditivo) — compatible hacia atrás por construcción.
-- ═══════════════════════════════════════════════════════════════════════════

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
  v_repartidor_de    jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;

  -- ① EL PRESTADOR — por la MISMA puerta de siempre (titularidad o vínculo).
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
    -- La mitad «oficios con local» de capacidad-atender, con su MISMO cruce:
    -- oferta activa con atiende_local × modalidad que admite atención local.
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

  -- ② LA CUENTA — owner primero; si no, la del prestador que gestiono
  --    (el espejo D-660, con la misma semántica que el wrapper: el
  --    prestador YA vino filtrado por la puerta de ①).
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
    -- EL VEREDICTO, SIEMPRE FRESCO (D-821: lo que otorga un tercero no se
    -- cachea — acá ni siquiera se puede: se lee en el mismo viaje).
    v_es_vendedora := EXISTS (
      SELECT 1 FROM public.cuenta_roles r
      WHERE r.cuenta_comercial_id = v_cta_id
        AND r.tipo_actor::text = 'seller_productos'
        AND r.estado::text = 'activo'
    );
    -- EL DISCRIMINADOR DEL VACÍO (letra de mesa 15-ago): ¿alguna vez vendió?
    -- ENTREGADO y solo entregado — el que llegó al expediente. Derivado, no
    -- columna: quien nunca vendió necesita arranque; quien hoy no vendió
    -- necesita serenidad. Viaja GRATIS en el mismo viaje.
    v_ha_vendido := EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.cuenta_comercial_id = v_cta_id
        AND p.estado::text = 'entregado'
    );
    -- La config de moneda ENTERA (D-448: `monto()` exige la config, no el código).
    SELECT to_jsonb(cc) INTO v_moneda
    FROM (
      SELECT currency_code, currency_symbol, currency_decimals
      FROM public.country_config
      WHERE country_code = v_cta_pais
    ) cc;
  END IF;

  -- ③ LA IDENTIDAD DE REPARTIDOR (S99 Gate 2 ④) — solo vínculos SELLADOS.
  --    El pendiente NO entra: para él existe mis_vinculos_repartidor_pendientes
  --    y el reclamo. Acá vive el que ACEPTÓ y tiene que poder ENTRAR.
  --    Auto-alcance por auth.uid(): el DEFINER no abre nada ajeno — solo
  --    nombres de negocios que registraron A ESTE usuario (los mismos que
  --    el lector de pendientes ya le mostraba antes de aceptar).
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'repartidor_id', r.id,
           'cuenta_comercial_id', r.cuenta_comercial_id,
           'negocio', cc2.nombre_comercial
         ) ORDER BY r.vinculo_aceptado_en), '[]'::jsonb)
    INTO v_repartidor_de
  FROM public.repartidores r
  JOIN public.cuentas_comerciales cc2 ON cc2.id = r.cuenta_comercial_id
  WHERE r.user_id = v_uid
    AND r.vinculo_aceptado_en IS NOT NULL
    AND r.activo;

  RETURN jsonb_build_object(
    'ok', true,
    'prestador', v_prestador,                    -- la fila entera de obtener_mi_prestador, o null
    'es_gestor', v_es_gestor,
    'posicion', v_posicion,                      -- el jsonb de obtener_mi_posicion_en_prestador, o null
    'hay_oficio_local', v_hay_oficio_local,
    'cuenta_comercial', CASE WHEN v_cta_id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_cta_id,
      'estado', v_cta_estado,
      'nombre_comercial', v_cta_nombre,
      'country_code', v_cta_pais
    ) END,
    'es_vendedora', v_es_vendedora,
    'ha_vendido', v_ha_vendido,
    'moneda', v_moneda,                          -- config entera, o null si no hay cuenta
    'repartidor_de', v_repartidor_de             -- [] = no es repartidor sellado en ninguna casa
  );
END $function$;

-- L-140: re-asertar la audiencia (CREATE OR REPLACE conserva ACL, pero la
-- decisión se ESCRIBE, jamás se hereda en silencio).
REVOKE EXECUTE ON FUNCTION public.obtener_contexto_arranque() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_contexto_arranque() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — por BRAZO, con el patrón RESET-ROLE de la casa (skill epetplace-db)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_ctx     jsonb;
  v_rep     jsonb;
BEGIN
  -- Brazo ① — Diego (vínculo SELLADO): aparece con Clínica Aurora.
  PERFORM set_config('request.jwt.claims',
    '{"sub":"4bfafac3-e456-4de7-9484-99e76b7301b0","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_ctx := public.obtener_contexto_arranque();
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  v_rep := v_ctx -> 'repartidor_de';
  IF jsonb_array_length(v_rep) <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN ①: Diego (aceptado) debía traer 1 vínculo, trajo % — %',
      jsonb_array_length(v_rep), v_rep;
  END IF;
  IF (v_rep -> 0 ->> 'negocio') <> 'Clínica Aurora' THEN
    RAISE EXCEPTION 'CINTURÓN ①b: el negocio debía ser Clínica Aurora, vino %',
      v_rep -> 0 ->> 'negocio';
  END IF;
  IF (v_rep -> 0 ->> 'repartidor_id') <> '7890fc4c-4f6a-42a2-a46b-62dd36f1e5ce' THEN
    RAISE EXCEPTION 'CINTURÓN ①c: repartidor_id inesperado — %', v_rep -> 0;
  END IF;

  -- Brazo ② — el DISCRIMINADOR contra el lector de pendientes: un repartidor
  -- con user_id y SIN aceptar (Repartidor Puro, eaad8d8d) NO aparece acá.
  PERFORM set_config('request.jwt.claims',
    '{"sub":"eaad8d8d-18dc-4295-a65a-323e467b8f84","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_ctx := public.obtener_contexto_arranque();
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF jsonb_array_length(v_ctx -> 'repartidor_de') <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ②: el pendiente-sin-aceptar debía traer [], trajo %',
      v_ctx -> 'repartidor_de';
  END IF;

  -- Brazo ③ — regresión sobre el MISMO ctx del brazo ② (eaad8d8d): el
  -- contexto entero sigue respondiendo ok=true y con sus claves de siempre
  -- (el campo nuevo es aditivo, no desplazó nada).
  IF (v_ctx ->> 'ok') IS DISTINCT FROM 'true'
     OR NOT (v_ctx ? 'es_vendedora') OR NOT (v_ctx ? 'ha_vendido') THEN
    RAISE EXCEPTION 'CINTURÓN ③: contexto degradado tras el campo nuevo — %', v_ctx;
  END IF;

  -- Brazo ④ — L-140: anon NO ejecuta.
  IF has_function_privilege('anon', 'public.obtener_contexto_arranque()', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ④ (L-140): anon tiene EXECUTE sobre obtener_contexto_arranque';
  END IF;

  RAISE NOTICE 'CINTURÓN repartidor_de: 4/4 verdes';
END $$;
