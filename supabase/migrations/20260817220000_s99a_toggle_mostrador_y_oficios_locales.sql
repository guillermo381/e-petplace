-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · EL TOGGLE DE VENTA EN LOCAL + LA LISTA DE OFICIOS LOCALES
-- (dictado del founder 18-ago, ④ — mi mitad del reparto: el toggle y su
-- lector; la composición de ATENDER es de C)
--
-- LA LETRA QUE IMPLEMENTA (verbatim del founder en PLAN_S99):
--  «en configuración lo único que digo es "atiendo en mi local" con un
--  toggle. Si está prendido, se me prende en atender…; si está apagado,
--  no me sale.» — Los TRES ESCALONES: CERO capacidades → NO HAY TAB ·
--  UNA → pantalla directa · DOS+ → baldosas. **Un menú de una opción no
--  es un menú: es un peaje (L-251).**
--
-- LO MEDIDO ANTES DE ESCRIBIR: para SERVICIOS el toggle POR SERVICIO ya
-- existe (`prestador_servicios.atiende_local` — el cruce de
-- `hay_oficio_local` desde el lote #0); para VENTA DE PRODUCTOS no existía
-- NINGUNA perilla (cero columnas local/mostrador en `cuentas_comerciales`,
-- 0 reglas de envío `retiro`) — `registrar_venta_mostrador` era un motor
-- que nada componía. Nace la perilla de la CUENTA.
--
-- BACKFILL HONESTO (por qué NO nace todo-false a secas): 2 cuentas vivas
-- YA vendieron por mostrador (`pedidos.metodo_entrega='retiro'`, medido:
-- Despensa de Pruebas · Tienda Pura). Una migración no les quita la
-- pantalla que ya usan (la clase D-662/L-179: motor y bundle son dos
-- verdades) — nacen `true`; todo el resto `false` (configurarse es del
-- vendedor, la letra lo pide).
--
-- 76(g): NO RIGE — columna aditiva con default + backfill de 2 filas
-- medidas + una función + CREATE OR REPLACE del contexto (campo aditivo,
-- bundles viejos lo ignoran). Reversa ANTES:
-- docs/relevamientos/2026-08-18-s99a-REVERSA-toggle-mostrador.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ① LA PERILLA
ALTER TABLE public.cuentas_comerciales
  ADD COLUMN venta_mostrador_activa boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.cuentas_comerciales.venta_mostrador_activa IS
  'S99 (dictado founder 18-ago ④): «atiendo en mi local» para VENTA DE PRODUCTOS. Compone la baldosa de mostrador en ATENDER; apagada, la baldosa no existe. La escribe configurar_venta_mostrador. Para SERVICIOS el toggle es POR SERVICIO (prestador_servicios.atiende_local), jamás éste.';

UPDATE public.cuentas_comerciales cc
   SET venta_mostrador_activa = true
 WHERE EXISTS (
   SELECT 1 FROM public.pedidos p
   WHERE p.cuenta_comercial_id = cc.id AND p.metodo_entrega = 'retiro'
 );

-- ② LA PUERTA
CREATE OR REPLACE FUNCTION public.configurar_venta_mostrador(
  p_cuenta_comercial_id uuid,
  p_activa boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  IF NOT public.es_vendedor_de(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor';
  END IF;
  UPDATE public.cuentas_comerciales
     SET venta_mostrador_activa = p_activa
   WHERE id = p_cuenta_comercial_id;
  RETURN jsonb_build_object('ok', true, 'venta_mostrador_activa', p_activa);
END $$;

REVOKE EXECUTE ON FUNCTION public.configurar_venta_mostrador(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.configurar_venta_mostrador(uuid, boolean) TO authenticated;

-- ③ EL LECTOR — el contexto gana la LISTA de oficios locales (los tres
--    escalones necesitan CONTAR y NOMBRAR, no un booleano) + la perilla
--    fresca. `hay_oficio_local` SE CONSERVA y pasa a DERIVARSE de la lista
--    (una fuente — jamás dos cómputos que diverjan).
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
  v_oficios_locales  text[] := '{}';
  v_es_vendedora     boolean := false;
  v_moneda           jsonb;
  v_ha_vendido       boolean := false;
  v_repartidor_de    jsonb := '[]'::jsonb;
  v_mostrador        boolean := false;
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
    -- LA LISTA de oficios con local (dictado ④): el MISMO cruce de siempre
    -- —oferta activa con atiende_local × modalidad que admite local—, ahora
    -- devolviendo QUÉ oficios (los tres escalones cuentan y nombran).
    SELECT COALESCE(array_agg(DISTINCT ps.tipo_servicio), '{}')
      INTO v_oficios_locales
    FROM public.prestador_servicios ps
    JOIN public.obtener_modalidades_por_oficio() m
      ON m.tipo_servicio = ps.tipo_servicio
    WHERE ps.prestador_id = v_prestador_id
      AND ps.activo
      AND ps.atiende_local
      AND m.admite_atencion_local;
  END IF;

  -- ② LA CUENTA — owner primero; si no, la del prestador que gestiono
  --    (el espejo D-660, con la misma semántica que el wrapper: el
  --    prestador YA vino filtrado por la puerta de ①).
  SELECT c.id, c.estado, c.nombre_comercial, c.country_code, c.venta_mostrador_activa
    INTO v_cta_id, v_cta_estado, v_cta_nombre, v_cta_pais, v_mostrador
  FROM public.cuentas_comerciales c
  WHERE c.owner_profile_id = v_uid
  LIMIT 1;

  IF v_cta_id IS NULL AND (v_prestador ->> 'cuenta_comercial_id') IS NOT NULL THEN
    SELECT c.id, c.estado, c.nombre_comercial, c.country_code, c.venta_mostrador_activa
      INTO v_cta_id, v_cta_estado, v_cta_nombre, v_cta_pais, v_mostrador
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
    'prestador', v_prestador,
    'es_gestor', v_es_gestor,
    'posicion', v_posicion,
    'hay_oficio_local', cardinality(v_oficios_locales) > 0,  -- DERIVADO de la lista (una fuente)
    'oficios_locales', to_jsonb(v_oficios_locales),
    'cuenta_comercial', CASE WHEN v_cta_id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_cta_id,
      'estado', v_cta_estado,
      'nombre_comercial', v_cta_nombre,
      'country_code', v_cta_pais
    ) END,
    'es_vendedora', v_es_vendedora,
    'ha_vendido', v_ha_vendido,
    'venta_mostrador_activa', v_mostrador,
    'moneda', v_moneda,
    'repartidor_de', v_repartidor_de
  );
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_contexto_arranque() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_contexto_arranque() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — por brazo, RESET-ROLE de la casa; restaura lo que muta.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_ctx     jsonb;
  v_r       jsonb;
  v_err     text;
  v_directo text[];
BEGIN
  -- Brazo ① — el backfill: EXACTAMENTE las cuentas con retiro quedaron true.
  IF (SELECT count(*) FROM public.cuentas_comerciales WHERE venta_mostrador_activa) <> 2 THEN
    RAISE EXCEPTION 'CINTURÓN ①: el backfill esperaba 2 cuentas true, hay %',
      (SELECT count(*) FROM public.cuentas_comerciales WHERE venta_mostrador_activa);
  END IF;

  -- Brazo ② — el toggle por camino de rol: duenodes APAGA la suya y se lee
  -- FRESCO en el contexto; después la vuelve a PRENDER (restauración).
  PERFORM set_config('request.jwt.claims',
    '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.configurar_venta_mostrador('eec12ef3-2c0c-41e7-a45e-81559fdf62a8', false);
  v_ctx := public.obtener_contexto_arranque();
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF (v_ctx ->> 'venta_mostrador_activa') IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'CINTURÓN ②: el contexto no leyó el apagado fresco — %',
      v_ctx ->> 'venta_mostrador_activa';
  END IF;
  PERFORM set_config('request.jwt.claims',
    '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.configurar_venta_mostrador('eec12ef3-2c0c-41e7-a45e-81559fdf62a8', true);
  v_ctx := public.obtener_contexto_arranque();
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF (v_ctx ->> 'venta_mostrador_activa') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CINTURÓN ②b: el prendido no se leyó fresco';
  END IF;

  -- Brazo ③ — el ajeno rebota.
  BEGIN
    PERFORM set_config('request.jwt.claims',
      '{"sub":"4bfafac3-e456-4de7-9484-99e76b7301b0","role":"authenticated"}', true);
    SET LOCAL ROLE authenticated;
    v_r := public.configurar_venta_mostrador('eec12ef3-2c0c-41e7-a45e-81559fdf62a8', false);
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ③: el ajeno NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    v_err := SQLERRM;
    IF v_err NOT LIKE 'no_sos_el_vendedor%' THEN
      RAISE EXCEPTION 'CINTURÓN ③: rebotó por otra razón — %', v_err;
    END IF;
  END;

  -- Brazo ④ — la LISTA por camino independiente: los oficios locales de
  -- Aurora según la función == join directo escrito distinto (demovet).
  PERFORM set_config('request.jwt.claims',
    '{"sub":"4f572081-26a5-4d3b-9d80-25ea751fdc9c","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_ctx := public.obtener_contexto_arranque();
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  SELECT COALESCE(array_agg(DISTINCT ps.tipo_servicio), '{}') INTO v_directo
  FROM public.prestador_servicios ps
  WHERE ps.prestador_id = ((v_ctx -> 'prestador') ->> 'id')::uuid
    AND ps.activo AND ps.atiende_local
    AND ps.tipo_servicio IN (
      SELECT m.tipo_servicio FROM public.obtener_modalidades_por_oficio() m
      WHERE m.admite_atencion_local
    );
  IF (SELECT COALESCE(array_agg(x ORDER BY x), '{}')
        FROM jsonb_array_elements_text(v_ctx -> 'oficios_locales') x)
     IS DISTINCT FROM
     (SELECT COALESCE(array_agg(x ORDER BY x), '{}') FROM unnest(v_directo) x) THEN
    RAISE EXCEPTION 'CINTURÓN ④: oficios_locales fn=% vs directo=%',
      v_ctx -> 'oficios_locales', v_directo;
  END IF;
  -- Y el derivado coincide con la lista (una fuente):
  IF ((v_ctx ->> 'hay_oficio_local')::boolean)
     IS DISTINCT FROM (jsonb_array_length(v_ctx -> 'oficios_locales') > 0) THEN
    RAISE EXCEPTION 'CINTURÓN ④b: hay_oficio_local no deriva de la lista';
  END IF;

  -- Brazo ⑤ — L-140 en las dos.
  IF has_function_privilege('anon', 'public.configurar_venta_mostrador(uuid, boolean)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.obtener_contexto_arranque()', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ⑤ (L-140): anon tiene EXECUTE';
  END IF;

  RAISE NOTICE 'CINTURÓN toggle+oficios: ①②②b③④④b⑤ verdes (Aurora: % oficios locales)',
    jsonb_array_length(v_ctx -> 'oficios_locales');
END $$;
