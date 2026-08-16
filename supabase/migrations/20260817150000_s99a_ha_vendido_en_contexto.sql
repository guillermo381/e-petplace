-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · ha_vendido ENTRA AL CONTEXTO DE ARRANQUE (letra del vacío, mesa
-- 15-ago): el discriminador «alguna vez vendió» NO existía (censo servido) y
-- la letra de las DOS VOCES lo exige. EXISTS de pedido ENTREGADO — derivado,
-- clave jsonb ADITIVA (los consumidores que no la leen no la ven).
-- 76(g): NO RIGE (CREATE OR REPLACE puro). Bundles vivos: ninguno consume la
-- RPC todavía. Reversa: 2026-08-15-s99a-REVERSA-ha-vendido.sql.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.obtener_contexto_arranque()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
    'moneda', v_moneda                           -- config entera, o null si no hay cuenta
  );
END $$;


-- CINTURÓN: la clave existe y discrimina — se compara contra la MISMA
-- pregunta hecha aparte (con el patrón de rol explícito del 140000).
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_uid uuid; v_ctx jsonb; v_esperado boolean;
BEGIN
  SELECT owner_profile_id INTO v_uid FROM public.cuentas_comerciales
  WHERE nombre_comercial ILIKE 'DESPENSA DE PRUEBAS S97%' LIMIT 1;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'CINTURÓN: sin despensa de pruebas'; END IF;
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role','authenticated')::text, true);
  v_ctx := public.obtener_contexto_arranque();
  SELECT EXISTS (SELECT 1 FROM public.pedidos p
    WHERE p.cuenta_comercial_id = (v_ctx -> 'cuenta_comercial' ->> 'id')::uuid
      AND p.estado::text = 'entregado') INTO v_esperado;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF (v_ctx ->> 'ha_vendido') IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: ha_vendido AUSENTE del contexto';
  END IF;
  IF (v_ctx ->> 'ha_vendido')::boolean IS DISTINCT FROM v_esperado THEN
    RAISE EXCEPTION 'CINTURÓN: ha_vendido=% no coincide con pedidos=%', v_ctx ->> 'ha_vendido', v_esperado;
  END IF;
  RAISE NOTICE 'CINTURÓN ha_vendido: verde (valor=%)', v_esperado;
END $$;
