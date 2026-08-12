-- ═══════════════════════════════════════════════════════════════════════════
-- S95-G3 · `otorgar_rol_vendedor` ACTIVA LA CUENTA EN EL MISMO ACTO
--
-- ── EL CALLEJÓN QUE ESTO CIERRA, medido por la Pista H ────────────────────
--   ① la cuenta nace en `pendiente_validacion`
--   ② `otorgar_rol_vendedor` rechaza si no está `activa`
--   ③ **lo único que activa una cuenta comercial es `activar_prestador`**, que
--      exige título profesional y registro SENESCYT aprobados
--
-- ⇒ Para activar la cuenta de un vendedor de alimento habría que darle un
--   título profesional, o crearle una fila en `prestadores`. Las dos cosas
--   **cruzan el cinturón que `MODELO_DESPENSA` §7.4 existe para sostener.**
--
-- 🔴 EL CALLEJÓN LO ABRIÓ LA CUARTA PUERTA DE S95-G2, Y LA CUARTA PUERTA SE
--    QUEDA. Su razón sigue medida y sigue siendo buena: diecisiete funciones
--    del motor exigen cuenta activa, entre ellas `generar_liquidacion` —la que
--    paga—, y sin ese filtro un pedido tomado por una cuenta suspendida se
--    cobra y después no se puede liquidar. **Lo que faltaba no era relajarla:
--    era el otro lado.** El eje de servicios ya tenía su camino de activación
--    y por eso el hueco no se veía mirando desde ahí.
--
-- ── LA FIRMA DEL FOUNDER ──────────────────────────────────────────────────
-- `otorgar_rol_vendedor` activa la cuenta cuando está en
-- `pendiente_validacion`. Ya es admin-only, y **el precedente literal es
-- `activar_prestador`**: el admin que decide que alguien puede vender es el
-- mismo que está validando la cuenta.
--
-- ── EL MOLDE, LEÍDO Y SEGUIDO ─────────────────────────────────────────────
-- De `activar_prestador`, verbatim en lo que importa:
--   · `auth_required` sin sesión · `solo_admin` sin admin
--   · `FOR UPDATE` sobre la cuenta antes de tocarla
--   · **activa SOLO desde `pendiente_validacion`**; `suspendida` y `cerrada`
--     rebotan con `cuenta_no_activable`. *Reactivar una cuenta suspendida es
--     otra decisión, con otro dueño, y no se cuela por acá.*
--   · deja escrito QUIÉN y CUÁNDO.
--
-- 🔴 EL RASTRO EXIGÍA UNA COLUMNA, Y NO EXISTÍA. `activar_prestador` anota el
--    responsable en `prestadores.aprobado_por` — una columna que **un vendedor
--    puro no tiene**, porque no tiene fila de prestador. `cuentas_comerciales`
--    tenía `activado_en` pero **no `activado_por`** (medido). *Un vendedor
--    activado sin rastro de quién lo activó es peor que uno que no se puede
--    activar*, así que nace la columna.
--
--    Y se llena EN LOS DOS CAMINOS: `activar_prestador` también la escribe.
--    **Una columna que solo la mitad de sus escritores completa es una columna
--    en la que no se puede confiar** — y la primera pregunta que alguien le va
--    a hacer («¿quién activó esta cuenta?») tendría respuesta la mitad de las
--    veces, sin forma de saber cuál mitad.
--
-- Reversa (escrita, verificada en disco y LEÍDA antes de aplicar):
--   scripts/s95/2026-08-12-s95g3-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón corre el alta COMPLETA de un vendedor
-- —cuenta, rol, regla, bodega— sobre datos reales y la deshace por id,
-- exigiendo que las cuatro tablas vuelvan a su conteo inicial.
--
-- ⚠️ **BACKFILL: NINGUNO, Y ES DELIBERADO.** Las cuentas ya activas quedan con
-- `activado_por` en NULL. **No se rellena**: no hay forma de saber quién las
-- activó, e inventar un responsable en una columna de auditoría es peor que
-- dejarla vacía. NULL acá significa «se activó antes de que existiera este
-- rastro», y eso es la verdad.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① LA COLUMNA DEL RASTRO
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.cuentas_comerciales
  ADD COLUMN IF NOT EXISTS activado_por uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.cuentas_comerciales.activado_por IS
  'S95-G3 · QUIÉN activó la cuenta. Espejo de `prestadores.aprobado_por`, que '
  'un vendedor puro no tiene porque no tiene fila de prestador. NULL = se '
  'activó antes de que existiera este rastro; NO se rellenó por backfill '
  'porque inventar un responsable en una columna de auditoría es peor que '
  'dejarla vacía.';

-- ═══════════════════════════════════════════════════════════════════════════
-- ② OTORGAR EL ROL — ahora activa en el mismo acto
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.otorgar_rol_vendedor(
  p_cuenta_comercial_id uuid,
  p_motivo              text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_cc   record;
  v_ya   boolean;
  v_activada boolean := false;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Sigue siendo acto de ADMIN. Si el titular pudiera dárselo, cualquiera con
  -- una cuenta comercial se auto-habilitaría a vender sin que nadie revise —
  -- y §4.2 dice lo contrario: el vendedor PROPONE, e-PetPlace PUBLICA.
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin_otorga_rol_vendedor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cc FROM cuentas_comerciales
   WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_cc.id IS NULL THEN
    RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 🔴 SOLO SE ACTIVA DESDE `pendiente_validacion`, igual que
  --    `activar_prestador`. Una cuenta SUSPENDIDA o CERRADA no se reactiva por
  --    acá: es otra decisión, con otro dueño y otras razones (una suspensión
  --    suele tener motivo escrito), y colarla adentro del alta de un vendedor
  --    sería exactamente el `ELSE` mal puesto que S95-G ya encontró una vez.
  IF v_cc.estado IN ('suspendida', 'cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_activable: la cuenta está «%» y reactivarla no es parte del alta de un vendedor', v_cc.estado
      USING ERRCODE = '22023';
  END IF;

  IF v_cc.estado = 'pendiente_validacion' THEN
    UPDATE cuentas_comerciales
       SET estado = 'activa',
           activado_en = COALESCE(activado_en, now()),
           activado_por = v_auth,
           updated_at = now()
     WHERE id = p_cuenta_comercial_id;
    v_activada := true;
  END IF;

  SELECT EXISTS (SELECT 1 FROM cuenta_roles
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND tipo_actor = 'seller_productos' AND estado = 'activo')
    INTO v_ya;

  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  VALUES (p_cuenta_comercial_id, 'seller_productos', 'activo', now(),
          jsonb_build_object('otorgado_por', v_auth, 'motivo', p_motivo))
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO UPDATE
    SET estado = 'activo', activado_en = COALESCE(cuenta_roles.activado_en, now());

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'ya_lo_tenia', v_ya,
                            'cuenta_activada_ahora', v_activada,
                            'estado_cuenta', 'activa');
END $$;

COMMENT ON FUNCTION public.otorgar_rol_vendedor(uuid, text) IS
  'S95-G3 · Otorga el rol `seller_productos` Y activa la cuenta si estaba '
  'pendiente, en el mismo acto — molde de `activar_prestador`. Admin-only. '
  'Suspendida y cerrada REBOTAN: reactivar no es parte del alta.';

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ `activar_prestador` TAMBIÉN ANOTA QUIÉN
--    Una columna que solo la mitad de sus escritores completa no se puede
--    consultar: la respuesta sería NULL la mitad de las veces y no habría
--    forma de saber cuál mitad.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.activar_prestador(
  p_prestador_id uuid, p_veredicto text, p_motivo text DEFAULT NULL::text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
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
           activado_en = now(),
           -- S95-G3: el mismo rastro que deja el otro camino de activación.
           activado_por = v_auth
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

-- ═══════════════════════════════════════════════════════════════════════════
-- ④ GRANTS · L-140
-- ═══════════════════════════════════════════════════════════════════════════
REVOKE ALL ON FUNCTION public.otorgar_rol_vendedor(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.otorgar_rol_vendedor(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.activar_prestador(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activar_prestador(uuid, text, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · EL ALTA COMPLETA, LOS CUATRO PASOS, DE PUNTA A PUNTA
--
-- 🔴 No verifica que la función exista: **da de alta un vendedor entero** —
--    cuenta → rol → regla de envío → bodega— y después lo borra por id. Si
--    alguno de los cuatro pasos sigue frenando, aborta y dice cuál.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_admin uuid; v_otro uuid; v_cc uuid; v_r jsonb; v_estado text; v_n int;
  v_cc_antes int; v_roles_antes int; v_reglas_antes int; v_bod_antes int;
  v_ok boolean; v_msg text; v_por uuid;
BEGIN
  SELECT count(*) INTO v_cc_antes     FROM cuentas_comerciales;
  SELECT count(*) INTO v_roles_antes  FROM cuenta_roles;
  SELECT count(*) INTO v_reglas_antes FROM reglas_envio;
  SELECT count(*) INTO v_bod_antes    FROM vendedor_bodegas;

  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  SELECT p.id INTO v_otro FROM profiles p
   WHERE NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id AND a.activo)
   ORDER BY p.created_at LIMIT 1;
  IF v_admin IS NULL OR v_otro IS NULL THEN
    RAISE EXCEPTION 'ABORTA: hacen falta un admin y un no-admin para probar los gates.';
  END IF;

  -- ── PASO 1 · la cuenta nace, y nace PENDIENTE ────────────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_otro, 'role','authenticated')::text, true);
  -- Devuelve TABLE(success, cuenta_comercial_id, mensaje) — MEDIDO, no
  -- supuesto: la primera versión la trató como jsonb y rebotó 22P02.
  SELECT c.cuenta_comercial_id INTO v_cc
  FROM crear_cuenta_comercial_inicial('EC', 'persona_juridica'::tipo_fiscal_enum,
         '9999999999999', '__CINT_S95G3 — NO ES UN COMERCIO REAL', '__cint_s95g3') c;
  IF v_cc IS NULL THEN
    RAISE EXCEPTION 'ABORTA: no se pudo crear la cuenta de prueba.';
  END IF;
  SELECT estado INTO v_estado FROM cuentas_comerciales WHERE id = v_cc;
  IF v_estado <> 'pendiente_validacion' THEN
    RAISE EXCEPTION 'ABORTA: la cuenta no nació pendiente sino «%» — la premisa del callejón cambió.', v_estado;
  END IF;

  -- ── EL DISCRIMINADOR: ANTES de otorgar, NO es vendedor ───────────────────
  IF es_vendedor_de(v_cc) THEN
    RAISE EXCEPTION 'ABORTA: es vendedor sin que nadie le haya dado el rol.';
  END IF;

  -- ── El titular NO se puede auto-otorgar ──────────────────────────────────
  v_ok := true;
  BEGIN PERFORM otorgar_rol_vendedor(v_cc, 'me lo doy yo');
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok THEN RAISE EXCEPTION 'ABORTA: el titular se auto-otorgó el rol.'; END IF;
  IF v_msg NOT LIKE 'solo_admin%' THEN
    RAISE EXCEPTION 'ABORTA: rebotó por otra razón (%): no es el gate que se prueba.', v_msg;
  END IF;

  -- ── PASO 2 · el admin otorga, y LA CUENTA SE ACTIVA EN EL MISMO ACTO ─────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role','authenticated')::text, true);
  v_r := otorgar_rol_vendedor(v_cc, '__cint_s95g3');
  IF (v_r->>'cuenta_activada_ahora')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: el rol se otorgó pero la cuenta NO se activó — el callejón sigue.';
  END IF;
  SELECT estado, activado_por INTO v_estado, v_por FROM cuentas_comerciales WHERE id = v_cc;
  IF v_estado <> 'activa' THEN
    RAISE EXCEPTION 'ABORTA: la cuenta quedó en «%».', v_estado;
  END IF;
  -- 🔴 EL RASTRO. Sin esto la activación es anónima.
  IF v_por IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la cuenta se activó sin dejar rastro de quién la activó.';
  END IF;
  IF v_por <> v_admin THEN
    RAISE EXCEPTION 'ABORTA: el rastro dice % y activó %.', v_por, v_admin;
  END IF;

  -- ── Y AHORA SÍ es vendedor. El par del discriminador. ────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_otro, 'role','authenticated')::text, true);
  IF NOT es_vendedor_de(v_cc) THEN
    RAISE EXCEPTION 'ABORTA: con cuenta activa y rol otorgado, el titular NO es vendedor.';
  END IF;

  -- ── PASO 3 · la regla de envío, con cobertura ────────────────────────────
  v_r := definir_regla_envio_vendedor(v_cc, 'flota_propia',
           jsonb_build_object('monto', 0), 'vendedor',
           ARRAY['Quito','Cumbayá','Sangolquí']);
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: el paso 3 (regla de envío) frenó: %', v_r;
  END IF;

  -- ── PASO 4 · la bodega ───────────────────────────────────────────────────
  v_r := crear_bodega_vendedor(v_cc, '__cint_s95g3', 'Quito', NULL, '15:00', 24);
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: el paso 4 (bodega) frenó: %', v_r;
  END IF;

  -- ── Y EL CIERRE DEL ARCO: el cotizador responde para este vendedor ───────
  v_r := cotizar_envio_despensa(v_cc, 50, 2, 1, 'EC', 'Quito');
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: el vendedor quedó dado de alta y el cotizador no responde: %', v_r->>'error';
  END IF;
  v_r := cotizar_envio_despensa(v_cc, 50, 2, 1, 'EC', 'Guayaquil');
  IF v_r->>'error' <> 'fuera_de_cobertura' THEN
    RAISE EXCEPTION 'ABORTA: un destino fuera de cobertura no rebotó tipado.';
  END IF;

  -- ── CONTRA-CASO: una cuenta SUSPENDIDA no se reactiva por esta puerta ────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role','authenticated')::text, true);
  UPDATE cuentas_comerciales SET estado='suspendida', suspendido_en=now() WHERE id = v_cc;
  v_ok := true;
  BEGIN PERFORM otorgar_rol_vendedor(v_cc, 'reactivame');
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok THEN
    RAISE EXCEPTION 'ABORTA: el alta de vendedor reactivó una cuenta SUSPENDIDA — eso es otra decisión y no se cuela por acá.';
  END IF;
  IF v_msg NOT LIKE 'cuenta_no_activable%' THEN
    RAISE EXCEPTION 'ABORTA: la suspendida rebotó por otra razón: %', v_msg;
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  DELETE FROM vendedor_bodegas WHERE cuenta_comercial_id = v_cc;
  DELETE FROM reglas_envio     WHERE cuenta_comercial_id = v_cc;
  DELETE FROM cuenta_roles     WHERE cuenta_comercial_id = v_cc;
  DELETE FROM cuentas_comerciales WHERE id = v_cc;

  SELECT count(*) INTO v_n FROM cuentas_comerciales;
  IF v_n <> v_cc_antes THEN RAISE EXCEPTION 'ABORTA 76(g): cuentas % vs %', v_n, v_cc_antes; END IF;
  SELECT count(*) INTO v_n FROM cuenta_roles;
  IF v_n <> v_roles_antes THEN RAISE EXCEPTION 'ABORTA 76(g): cuenta_roles % vs %', v_n, v_roles_antes; END IF;
  SELECT count(*) INTO v_n FROM reglas_envio;
  IF v_n <> v_reglas_antes THEN RAISE EXCEPTION 'ABORTA 76(g): reglas_envio % vs %', v_n, v_reglas_antes; END IF;
  SELECT count(*) INTO v_n FROM vendedor_bodegas;
  IF v_n <> v_bod_antes THEN RAISE EXCEPTION 'ABORTA 76(g): bodegas % vs %', v_n, v_bod_antes; END IF;

  RAISE NOTICE 'CINTURÓN S95-G3: los CUATRO pasos del alta corren de punta a punta, la cuenta se activa con rastro, y la suspendida no se cuela. Residuo 0.';
END $$;

COMMIT;
