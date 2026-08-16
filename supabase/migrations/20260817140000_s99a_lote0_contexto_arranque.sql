-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · LOTE #0 — LA RPC DE CONTEXTO DE ARRANQUE (D-738, la cura reina)
--
-- LA LEY QUE EJECUTA (§2.0 + adjudicación de mesa 15-ago): el HOY se compone
-- POR CAPACIDAD con la MISMA fuente que la barra — una fuente, N consumidores.
-- Hoy resolver «quién soy y qué puedo» cuesta 3 olas de identidad + la sonda
-- `contextoVentas` (4 esperas ≈ 620 ms medidos por d0). Esta función lo
-- devuelve TODO en UN viaje.
--
-- 🔴 DISEÑO: es un EMPAQUETADOR de gates existentes — llama ADENTRO a
--   `obtener_mi_prestador()` (titularidad o vínculo, S75),
--   `empleado_tiene_rol()` y `obtener_mi_posicion_en_prestador()`, y replica
--   la semántica del wrapper `obtenerMiCuentaComercial` (owner → gestión,
--   D-660) usando el `cuenta_comercial_id` que el propio prestador ya trae.
--   CERO predicado de permiso nuevo: si un gate cambia, esta función cambia
--   con él porque LO LLAMA, no lo copia.
--
-- Contrato pedido por D (su §12.5, verbatim): cuenta_comercial_id · moneda
-- (la config entera, no el código — D-448) · es_vendedora · estado_cuenta ·
-- prestador_id · es_gestor · monta_atender. `monta_atender` se sirve en sus
-- DOS mitades (posición + hay capacidad) para que la lib componga como hoy.
--
-- 76(g): NO RIGE — aditiva pura, cero datos, cero backfill, cero policy.
-- BUNDLES VIVOS (D-662): NINGUNO la consulta (nace hoy) — compatible por
--   definición; los caminos viejos siguen vivos hasta que el OTA los migre.
-- Reversa escrita ANTES: docs/relevamientos/2026-08-15-s99a-REVERSA-contexto-arranque.sql
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
    'moneda', v_moneda                           -- config entera, o null si no hay cuenta
  );
END $$;

-- L-140: la función nace con EXECUTE para anon por default privileges — se
-- cierra EXPLÍCITO y se verifica abajo.
REVOKE EXECUTE ON FUNCTION public.obtener_contexto_arranque() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_contexto_arranque() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN + FIXTURE IN-TXN (residuo 0 por construcción: la función es de
-- SOLO LECTURA — el fixture no muta una fila).
-- Discriminador por BRAZO: ① titular con negocio Y ventas (Aurora/demovet):
-- prestador≠null · es_gestor · es_vendedora coincide con cuenta_roles leído
-- APARTE · moneda con config ② vendedor puro (owner de la despensa de
-- pruebas): prestador=null · cuenta≠null ③ sin sesión: rebota 42501
-- ④ L-140: anon sin EXECUTE.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  -- ⚠️ RESET ROLE acá NO vuelve al rol de la migración: bajo db push la
  -- sesión entra por un rol de login y el tool hace SET ROLE — RESET
  -- restaura al LOGIN, que no puede ni registrar la migración (medido:
  -- «permission denied for schema supabase_migrations»). Se captura el rol
  -- REAL y se restaura EXPLÍCITO.
  v_rol_mig   text := current_user;
  v_uid_vet   uuid;
  v_uid_puro  uuid;
  v_ctx1      jsonb;
  v_ctx2      jsonb;
  v_rebote_ok boolean := false;
  v_esperado  boolean;
BEGIN
  SELECT id INTO v_uid_vet FROM auth.users WHERE email = 'guillo381+demovet@gmail.com';
  IF v_uid_vet IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: no existe guillo381+demovet@gmail.com — el fixture no puede discriminar';
  END IF;
  SELECT owner_profile_id INTO v_uid_puro
  FROM public.cuentas_comerciales
  WHERE nombre_comercial ILIKE 'DESPENSA DE PRUEBAS S97%'
  LIMIT 1;
  IF v_uid_puro IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: no existe la despensa de pruebas S97 — falta el brazo vendedor puro';
  END IF;

  -- FASE 1 · CAPTURA bajo rol authenticated (los tres contextos primero,
  -- las aserciones después — el orden de roles no puede romper un assert).
  SET LOCAL ROLE authenticated;
  RAISE NOTICE 'CINTURÓN checkpoint: rol puesto';
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid_vet, 'role', 'authenticated')::text, true);
  v_ctx1 := public.obtener_contexto_arranque();
  -- El ESPERADO se lee ACÁ, bajo el MISMO rol y claims que usa la app
  -- (rolesActivosDeMiCuenta lee cuenta_roles por RLS): comparar la función
  -- contra el camino real del wrapper es mejor discriminador que leer como
  -- superusuario — y de paso: el rol de migración de db push NO tiene
  -- SELECT directo sobre cuenta_roles (medido: FASE 2 rebotaba 42501).
  SELECT EXISTS (
    SELECT 1 FROM public.cuenta_roles r
    WHERE r.cuenta_comercial_id = (v_ctx1 -> 'cuenta_comercial' ->> 'id')::uuid
      AND r.tipo_actor::text = 'seller_productos' AND r.estado::text = 'activo'
  ) INTO v_esperado;
  RAISE NOTICE 'CINTURÓN checkpoint: brazo ① capturado';
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid_puro, 'role', 'authenticated')::text, true);
  v_ctx2 := public.obtener_contexto_arranque();
  RAISE NOTICE 'CINTURÓN checkpoint: brazo ② capturado';
  PERFORM set_config('request.jwt.claims', NULL, true);
  BEGIN
    PERFORM public.obtener_contexto_arranque();
  EXCEPTION WHEN insufficient_privilege THEN
    v_rebote_ok := true; -- el 42501 esperado de brazo ③
  END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  RAISE NOTICE 'CINTURÓN checkpoint: rol restaurado a %', v_rol_mig;

  -- FASE 2 · ASERCIONES como rol de migración.
  IF (v_ctx1 ->> 'prestador') IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN ①: demovet sin prestador en el contexto';
  END IF;
  IF NOT (v_ctx1 ->> 'es_gestor')::boolean THEN
    RAISE EXCEPTION 'CINTURÓN ①: el titular no salió gestor';
  END IF;
  IF (v_ctx1 ->> 'es_vendedora')::boolean IS DISTINCT FROM v_esperado THEN
    RAISE EXCEPTION 'CINTURÓN ①: es_vendedora=% no coincide con cuenta_roles=%',
      v_ctx1 ->> 'es_vendedora', v_esperado;
  END IF;
  IF (v_ctx1 -> 'moneda' ->> 'currency_code') IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN ①: la moneda salió sin config';
  END IF;
  IF (v_ctx2 ->> 'prestador') IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURÓN ②: el vendedor puro salió con prestador';
  END IF;
  IF (v_ctx2 -> 'cuenta_comercial' ->> 'id') IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN ②: el vendedor puro salió sin cuenta';
  END IF;
  IF NOT v_rebote_ok THEN
    RAISE EXCEPTION 'CINTURÓN ③: sin sesión NO rebotó 42501';
  END IF;
  IF has_function_privilege('anon', 'public.obtener_contexto_arranque()', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ④ (L-140): anon puede ejecutar la función nueva';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.obtener_contexto_arranque()', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ④: authenticated NO puede ejecutar — la función nació muerta';
  END IF;

  RAISE NOTICE 'CINTURÓN contexto_arranque: 4/4 brazos verdes';
END $$;
