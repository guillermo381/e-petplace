-- ═══════════════════════════════════════════════════════════════════════════
-- S95-G2 · LAS PUERTAS QUE FALTABAN PARA DAR DE ALTA UN VENDEDOR
--
-- La Pista H salió a crear el vendedor de pruebas y **frenó**: tres de las
-- cuatro piezas no tenían función que las creara. Podría haberlo hecho con
-- tres INSERT por CLI y no lo hizo — que es exactamente lo que D-762 (las 104
-- escrituras directas del portal admin) enseña a no repetir. *Una pieza que
-- solo se puede crear a mano es una pieza que ninguna automatización futura va
-- a poder crear, y el alta de un vendedor no es un acto de una sola vez.*
--
-- ── EL MOLDE, LEÍDO Y SEGUIDO ─────────────────────────────────────────────
-- `crear_prestador_inicial` es la que ya otorga un rol de cuenta:
--   `INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
--    VALUES (…, 'prestador_servicios', 'activo')
--    ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;`
-- Idempotente por conflicto, estado explícito. Se copia tal cual.
--
-- ── 🔴 G2.2 · LA PREGUNTA DE H, MEDIDA Y CONTESTADA ───────────────────────
-- H midió que `_cuenta_es_vendedora` y `es_vendedor_de` **no miran el estado
-- de la cuenta** y no pudo verificar si el motor lo exige en otro lado.
--
-- **LO EXIGE EN DIECISIETE FUNCIONES.** Medido: `comprar_paquete_salidas`,
-- `confirmar_cita_pagada`, `contratar_plan_paseo`, `contratar_programa`,
-- `crear_solicitud_autorizacion`, `activar_prestador`, las tres
-- `_*_ofertas_cobrables`, las cuatro `obtener_oferta_*`… y sobre todo
-- **`generar_liquidacion`, que es la función que PAGA.**
--
-- ⇒ **FALTA una cuarta puerta; no sobra una validación.** Y la razón no es de
-- simetría: si la despensa deja vender a una cuenta suspendida, el pedido se
-- toma, se cobra, y después `generar_liquidacion` no lo puede liquidar porque
-- exige que la cuenta esté activa. **La plata queda atrapada entre dos reglas
-- que no dicen lo mismo.** El estado incoherente se evita antes, no después.
--
-- Reversa (escrita ANTES): scripts/s95/2026-08-12-s95g2-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón otorga un rol de vendedor real, define una
-- regla y crea una bodega, y después los borra por id exigiendo que las tres
-- tablas vuelvan a su conteo inicial.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① LA CUARTA PUERTA — la cuenta tiene que estar ACTIVA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._cuenta_es_vendedora(p_cuenta_comercial_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cuentas_comerciales cc
    JOIN cuenta_roles cr ON cr.cuenta_comercial_id = cc.id
    WHERE cc.id = p_cuenta_comercial_id
      -- 🔴 LA CUARTA PUERTA. Sin esto una cuenta suspendida sigue vendiendo, y
      --    `generar_liquidacion` después no le puede pagar.
      AND cc.estado = 'activa'
      AND cr.tipo_actor = 'seller_productos'
      AND cr.estado = 'activo'
  );
$$;

CREATE OR REPLACE FUNCTION public.es_vendedor_de(p_cuenta_comercial_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cuentas_comerciales cc
    JOIN cuenta_roles cr ON cr.cuenta_comercial_id = cc.id
    WHERE cc.id = p_cuenta_comercial_id
      AND cc.owner_profile_id = auth.uid()
      AND cc.estado = 'activa'
      AND cr.tipo_actor = 'seller_productos'
      AND cr.estado = 'activo'
  );
$$;

COMMENT ON FUNCTION public.es_vendedor_de(uuid) IS
  'ALCANCE v1: resuelve por el TITULAR de la cuenta comercial. §7.4: jamás '
  'aparece en una policy del expediente. S95-G2: exige `cuentas_comerciales.'
  'estado = ''activa''` — el motor de servicios ya lo exigía en 17 funciones, '
  'entre ellas `generar_liquidacion`; la despensa era la que no lo miraba.';

-- ═══════════════════════════════════════════════════════════════════════════
-- ② OTORGAR EL ROL DE VENDEDOR
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.otorgar_rol_vendedor(
  p_cuenta_comercial_id uuid,
  p_motivo              text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_cc record; v_ya boolean;
BEGIN
  -- 🔴 ES UN ACTO DE ADMINISTRACIÓN, NO DEL VENDEDOR. Si el propio titular
  --    pudiera dárselo, cualquiera con una cuenta comercial se auto-habilitaría
  --    a vender productos sin que nadie revise nada — y §4.2 dice justo lo
  --    contrario: **el vendedor PROPONE, e-PetPlace PUBLICA.**
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin_otorga_rol_vendedor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cc FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id;
  IF v_cc.id IS NULL THEN
    RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_cc.estado <> 'activa' THEN
    -- Coherente con la cuarta puerta: otorgar el rol a una cuenta que no está
    -- activa crearía un vendedor que no puede vender y nadie sabría por qué.
    RAISE EXCEPTION 'cuenta_no_activa: la cuenta está en «%»', v_cc.estado
      USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (SELECT 1 FROM cuenta_roles
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND tipo_actor = 'seller_productos' AND estado = 'activo')
    INTO v_ya;

  -- Molde de `crear_prestador_inicial`, tal cual.
  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  VALUES (p_cuenta_comercial_id, 'seller_productos', 'activo', now(),
          jsonb_build_object('otorgado_por', auth.uid(), 'motivo', p_motivo))
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO UPDATE
    SET estado = 'activo', activado_en = COALESCE(cuenta_roles.activado_en, now());

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'ya_lo_tenia', v_ya);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ LA REGLA DE ENVÍO DEL VENDEDOR
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.definir_regla_envio_vendedor(
  p_cuenta_comercial_id uuid,
  p_tipo                text,
  p_parametros          jsonb,
  p_pagado_por          text DEFAULT 'vendedor',
  -- 🔴 LA COBERTURA COMO FRONTERA, NO COMO TARIFARIO (G2.3). Las ciudades
  --    donde SÍ se entrega. Es `text[]` y no una tabla porque hoy es UNA fila
  --    de datos; el día que sea un mapa, la tabla nace y esta función la lee.
  p_ciudades_cubiertas  text[] DEFAULT NULL,
  p_prioridad           integer DEFAULT 100
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_tipo record; v_id uuid; v_params jsonb;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_tipo FROM cat_tipos_regla_envio WHERE codigo = p_tipo;
  IF v_tipo.codigo IS NULL THEN
    RAISE EXCEPTION 'tipo_regla_no_existe: %', p_tipo USING ERRCODE = '22023';
  END IF;
  IF NOT v_tipo.activo THEN
    RAISE EXCEPTION 'tipo_regla_envio_inactivo: «%» está modelado y apagado. Motivo: %',
      p_tipo, COALESCE(v_tipo.motivo_inactivo,'(sin declarar)') USING ERRCODE = '22023';
  END IF;

  IF p_pagado_por NOT IN ('vendedor','cliente','plataforma') THEN
    RAISE EXCEPTION 'pagado_por_invalido: %', p_pagado_por USING ERRCODE = '22023';
  END IF;

  -- 🔴 «GRATIS» NO ES «NADIE PAGA». `pagado_por` viaja DENTRO de los
  --    parámetros, y de ahí lo copia `cotizar_envio_despensa` a
  --    `parametros_aplicados`, que `crear_pedido_despensa` congela en
  --    `pedidos.envio_cotizacion`. ⇒ **quién pagó el envío queda escrito en la
  --    fila del pedido**, no en una tabla de configuración que puede cambiar.
  v_params := COALESCE(p_parametros, '{}'::jsonb)
              || jsonb_build_object('pagado_por', p_pagado_por);
  IF p_ciudades_cubiertas IS NOT NULL THEN
    v_params := v_params || jsonb_build_object('ciudades_cubiertas',
                              to_jsonb(p_ciudades_cubiertas));
  END IF;

  -- Idempotente por vendedor+país+tipo: redefinir NO apila reglas.
  UPDATE reglas_envio SET activo = false, vigencia_hasta = now(), updated_at = now()
   WHERE cuenta_comercial_id = p_cuenta_comercial_id
     AND country_code = 'EC' AND activo;

  INSERT INTO reglas_envio (cuenta_comercial_id, country_code, tipo, parametros,
                            moneda, prioridad, vigencia_desde, activo, notas)
  VALUES (p_cuenta_comercial_id, 'EC', p_tipo, v_params, 'USD',
          p_prioridad, now(), true,
          'S95-G2 · definida por función, no por INSERT directo (D-762).')
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'regla_id', v_id, 'tipo', p_tipo,
                            'parametros', v_params);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ④ LA BODEGA DEL VENDEDOR — el origen del despacho
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.crear_bodega_vendedor(
  p_cuenta_comercial_id uuid,
  p_nombre              text,
  p_ciudad              text,
  p_direccion           text DEFAULT NULL,
  p_hora_corte          time DEFAULT NULL,
  p_horas_preparacion   integer DEFAULT 24,
  p_zona_horaria        text DEFAULT 'America/Guayaquil'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_nombre IS NULL OR length(trim(p_nombre)) = 0 THEN
    RAISE EXCEPTION 'nombre_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_ciudad IS NULL OR length(trim(p_ciudad)) = 0 THEN
    -- La ciudad no es adorno: `calcular_promesa_entrega` la necesita para el
    -- corte, y sin origen declarado la promesa sería inventada.
    RAISE EXCEPTION 'ciudad_requerida' USING ERRCODE = '22023';
  END IF;

  -- Idempotente por (cuenta, nombre): re-crear la misma bodega la ACTUALIZA.
  SELECT id INTO v_id FROM vendedor_bodegas
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND nombre = trim(p_nombre);

  IF v_id IS NOT NULL THEN
    UPDATE vendedor_bodegas
       SET ciudad = trim(p_ciudad), direccion = NULLIF(trim(p_direccion),''),
           hora_corte = p_hora_corte, horas_preparacion = p_horas_preparacion,
           zona_horaria = p_zona_horaria, activo = true, updated_at = now()
     WHERE id = v_id;
    RETURN jsonb_build_object('ok', true, 'bodega_id', v_id, 'ya_existia', true);
  END IF;

  INSERT INTO vendedor_bodegas (cuenta_comercial_id, nombre, ciudad, direccion,
                                hora_corte, horas_preparacion, zona_horaria, activo)
  VALUES (p_cuenta_comercial_id, trim(p_nombre), trim(p_ciudad),
          NULLIF(trim(p_direccion),''), p_hora_corte, p_horas_preparacion,
          p_zona_horaria, true)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'bodega_id', v_id, 'ya_existia', false);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑤ GRANTS · L-140
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_f text;
BEGIN
  FOREACH v_f IN ARRAY ARRAY[
    'otorgar_rol_vendedor(uuid, text)',
    'definir_regla_envio_vendedor(uuid, text, jsonb, text, text[], integer)',
    'crear_bodega_vendedor(uuid, text, text, text, time, integer, text)']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', v_f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', v_f);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · con discriminador y contra-caso
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_dueno uuid; v_otro uuid; v_admin uuid;
  v_roles_antes int; v_reglas_antes int; v_bod_antes int; v_n int;
  v_ok boolean; v_msg text; v_r jsonb;
BEGIN
  SELECT count(*) INTO v_roles_antes  FROM cuenta_roles;
  SELECT count(*) INTO v_reglas_antes FROM reglas_envio;
  SELECT count(*) INTO v_bod_antes    FROM vendedor_bodegas;

  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_dueno
  FROM cuentas_comerciales cc
  WHERE cc.estado = 'activa' AND cc.owner_profile_id IS NOT NULL LIMIT 1;
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  SELECT p.id INTO v_otro FROM profiles p
   WHERE p.id <> v_dueno
     AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id AND a.activo)
   ORDER BY p.created_at LIMIT 1;
  IF v_cc IS NULL OR v_admin IS NULL OR v_otro IS NULL THEN
    RAISE EXCEPTION 'ABORTA: sin cuenta activa, admin y un tercero el cinturón no prueba nada.';
  END IF;

  -- ── A · el titular NO se puede auto-otorgar el rol ───────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno, 'role','authenticated')::text, true);
  v_ok := true;
  BEGIN PERFORM otorgar_rol_vendedor(v_cc, 'me lo doy yo');
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: el titular se auto-otorgó el rol de vendedor.'; END IF;
  IF v_msg NOT LIKE 'solo_admin%' THEN
    RAISE EXCEPTION 'ABORTA: rebotó por otra razón (%), no por el gate que se prueba.', v_msg;
  END IF;

  -- ── B · el admin SÍ puede (contra-caso: sin esto nadie podría dar de alta) ─
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role','authenticated')::text, true);
  v_r := otorgar_rol_vendedor(v_cc, '__cint_s95g2');
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'ABORTA: el admin no pudo otorgar el rol.'; END IF;

  -- ── C · LA CUARTA PUERTA, con su discriminador ───────────────────────────
  -- Con la cuenta ACTIVA el titular es vendedor…
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno, 'role','authenticated')::text, true);
  IF NOT es_vendedor_de(v_cc) THEN
    RAISE EXCEPTION 'ABORTA: con cuenta activa y rol otorgado, el titular NO es vendedor.';
  END IF;
  -- …y con la cuenta NO activa, deja de serlo. El mismo dato, el mismo rol:
  -- lo único que cambia es el estado de la cuenta.
  --
  -- Se usa `pendiente_validacion` y no `suspendida` porque el CHECK
  -- `chk_estado_consistente` exige `suspendido_en` para suspender —una guarda
  -- correcta que el cinturón encontró abortando— y porque además es el caso
  -- REALISTA: una cuenta que todavía no fue aprobada no puede vender.
  UPDATE cuentas_comerciales SET estado = 'pendiente_validacion' WHERE id = v_cc;
  IF es_vendedor_de(v_cc) THEN
    RAISE EXCEPTION 'ABORTA: con la cuenta NO activa el titular sigue siendo vendedor — la cuarta puerta no cerró.';
  END IF;
  UPDATE cuentas_comerciales SET estado = 'activa' WHERE id = v_cc;

  -- ── D · un tercero no define la regla de envío de un vendedor ajeno ──────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_otro, 'role','authenticated')::text, true);
  v_ok := true;
  BEGIN PERFORM definir_regla_envio_vendedor(v_cc, 'plana', '{"monto":3}'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_ok := false; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: un tercero definió la regla de envío de otro.'; END IF;

  -- ── E · el vendedor SÍ, y un tipo APAGADO rebota hablado ─────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno, 'role','authenticated')::text, true);
  v_ok := true;
  BEGIN PERFORM definir_regla_envio_vendedor(v_cc, 'por_zona_peso', '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: se definió una regla de un tipo APAGADO.'; END IF;
  IF v_msg NOT LIKE 'tipo_regla_envio_inactivo%' THEN
    RAISE EXCEPTION 'ABORTA: el tipo apagado rebotó por otra razón: %', v_msg;
  END IF;

  v_r := definir_regla_envio_vendedor(v_cc, 'gratis_sobre_umbral',
           '{"umbral":0,"monto_bajo_umbral":0}'::jsonb, 'vendedor', ARRAY['Quito']);
  IF v_r->'parametros'->>'pagado_por' <> 'vendedor' THEN
    RAISE EXCEPTION 'ABORTA: la regla no dejó escrito quién paga el envío.';
  END IF;
  IF v_r->'parametros'->'ciudades_cubiertas' IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la cobertura no quedó declarada en la regla.';
  END IF;

  -- Redefinir NO apila: la anterior queda inactiva.
  PERFORM definir_regla_envio_vendedor(v_cc, 'plana', '{"monto":2.50}'::jsonb,
            'vendedor', ARRAY['Quito']);
  SELECT count(*) INTO v_n FROM reglas_envio
   WHERE cuenta_comercial_id = v_cc AND activo;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ABORTA: quedaron % reglas activas para el mismo vendedor; redefinir apila.', v_n;
  END IF;

  -- ── F · la bodega, con su gate y su idempotencia ─────────────────────────
  v_r := crear_bodega_vendedor(v_cc, '__cint_s95g2', 'Quito', 'Av Test 1', '15:00', 24);
  IF (v_r->>'ya_existia')::boolean THEN RAISE EXCEPTION 'ABORTA: la bodega nueva dijo que ya existía.'; END IF;
  v_r := crear_bodega_vendedor(v_cc, '__cint_s95g2', 'Quito', 'Av Test 2', '16:00', 12);
  IF NOT (v_r->>'ya_existia')::boolean THEN RAISE EXCEPTION 'ABORTA: crear la misma bodega dos veces la duplicó.'; END IF;
  v_ok := true;
  BEGIN PERFORM crear_bodega_vendedor(v_cc, '  ', 'Quito');
  EXCEPTION WHEN OTHERS THEN v_ok := false; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: se creó una bodega sin nombre.'; END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  DELETE FROM vendedor_bodegas WHERE nombre = '__cint_s95g2';
  DELETE FROM reglas_envio WHERE cuenta_comercial_id = v_cc
    AND notas LIKE 'S95-G2%';
  DELETE FROM cuenta_roles WHERE cuenta_comercial_id = v_cc
    AND tipo_actor = 'seller_productos' AND metadata->>'motivo' = '__cint_s95g2';

  SELECT count(*) INTO v_n FROM cuenta_roles;
  IF v_n <> v_roles_antes THEN RAISE EXCEPTION 'ABORTA 76(g): cuenta_roles % vs %', v_n, v_roles_antes; END IF;
  SELECT count(*) INTO v_n FROM reglas_envio;
  IF v_n <> v_reglas_antes THEN RAISE EXCEPTION 'ABORTA 76(g): reglas_envio % vs %', v_n, v_reglas_antes; END IF;
  SELECT count(*) INTO v_n FROM vendedor_bodegas;
  IF v_n <> v_bod_antes THEN RAISE EXCEPTION 'ABORTA 76(g): vendedor_bodegas % vs %', v_n, v_bod_antes; END IF;

  RAISE NOTICE 'CINTURÓN S95-G2: tres puertas con gate, la cuarta puerta cierra con la cuenta suspendida, y el camino legítimo intacto. Residuo 0.';
END $$;

COMMIT;
