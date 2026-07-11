-- ═════════════════════════════════════════════════════════════════════
-- S54 — TANDA CORRECTIVA (pedidos de la Sesión B, aprobados por founder,
-- + extensión (a) de la Sesión A). Tres partes:
--   1. Las 4 vistas del motor (§4.4 MODELO_FINANCIERO) endurecidas:
--      security_invoker + sin anon + solo SELECT.
--   2. REVOKE anon/PUBLIC en las 7 firmas de ESCRITURA que aún nacían
--      ejecutables por anon (incluye otorgar_puntos — pata anon de D-314).
--   3. confirmar_cita_pagada pre-valida cuenta estado='activa'
--      (error tipado cuenta_no_activa).
-- NOTA: el backfill del pedido 1 de la B NO va acá — literal pendiente
-- (no reconstruible del repo/DB; frenado por regla 73/75).
--
-- Relevamiento (S54, 11-Jul):
--  · Las 4 vistas tenían reloptions NULL (sin security_invoker → como
--    owner postgres BYPASSEABAN la RLS de eventos_economicos /
--    liquidaciones / cuentas_comerciales: cualquier authenticated —y
--    anon— leía el ledger completo de todos) y ACL 'arwdDxtm' (¡hasta
--    INSERT/UPDATE/DELETE!) para anon y authenticated.
--  · Dependientes verificados (regla 69): CERO referencias en admin /
--    apps / packages / prestadores / v2 (solo database.types) y CERO
--    funciones DB que las lean. El endurecimiento no rompe nada.
--  · Con security_invoker, el owner ve lo suyo por RLS
--    (owner_select_own_eventos / owner_select_own_cuentas) y admin ve
--    todo — exactamente el contrato §4.5 del doc.
-- ═════════════════════════════════════════════════════════════════════

-- ── 1 · Vistas del motor: la RLS vuelve a ser la puerta ─────────────────

ALTER VIEW public.v_eventos_con_origen          SET (security_invoker = true);
ALTER VIEW public.v_eventos_resumen_cuenta      SET (security_invoker = true);
ALTER VIEW public.v_revenue_plataforma_periodo  SET (security_invoker = true);
ALTER VIEW public.v_liquidaciones_pendientes_pago SET (security_invoker = true);

REVOKE ALL ON public.v_eventos_con_origen           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_eventos_resumen_cuenta       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_revenue_plataforma_periodo   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_liquidaciones_pendientes_pago FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.v_eventos_con_origen           TO authenticated, service_role;
GRANT SELECT ON public.v_eventos_resumen_cuenta       TO authenticated, service_role;
GRANT SELECT ON public.v_revenue_plataforma_periodo   TO authenticated, service_role;
GRANT SELECT ON public.v_liquidaciones_pendientes_pago TO authenticated, service_role;

-- ── 2 · Las 7 firmas de escritura sin anon/PUBLIC (L-140) ───────────────
-- authenticated se CONSERVA: el wizard y los wrappers S54-B corren con
-- sesión y las RPCs tienen gate de identidad interno. validar_/verificar_
-- identificacion (lecturas de validación pre-registro) NO se tocan.

REVOKE EXECUTE ON FUNCTION public.actualizar_datos_bancarios(uuid, text, text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.actualizar_datos_fiscales_cuenta(uuid, text, tipo_fiscal_enum, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.crear_cuenta_comercial_inicial(text, tipo_fiscal_enum, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.crear_prestador_inicial(uuid, text, text, text, text, text, text, text, text, text, text, double precision, double precision, boolean, boolean, integer, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.insertar_documentos_batch(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.otorgar_puntos(uuid, integer, text, text, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wizard_crear_cuenta_y_rol(text, tipo_fiscal_enum, text, text, text, text, text, text, text, text, text, text, text, text, text, double precision, double precision, boolean, boolean, integer, text, jsonb) FROM PUBLIC, anon;

-- ── 3 · confirmar_cita_pagada: pre-validación de cuenta ACTIVA ──────────
-- Extensión (a) del founder: pagar contra una cuenta no-activa promete
-- una liquidación que generar_liquidacion va a rechazar (§7.11). MISMA
-- firma → CREATE OR REPLACE sin sobrecarga (L-119 no aplica).

CREATE OR REPLACE FUNCTION public.confirmar_cita_pagada(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth      uuid := auth.uid();
  v_cita      record;
  v_cuenta    record;
  v_fee       uuid;
  v_pagado_en timestamptz;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'no_es_tu_cita' USING ERRCODE = '42501';
  END IF;
  IF v_cita.estado = 'confirmada' AND v_cita.estado_reserva = 'pagada' THEN
    RAISE EXCEPTION 'cita_ya_confirmada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'pendiente' OR v_cita.estado_reserva <> 'pendiente_pago' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, v_cita.estado_reserva
      USING ERRCODE = '22023';
  END IF;

  -- Expiración perezosa: un hold vencido se trata como inexistente.
  IF v_cita.expira_en IS NOT NULL AND v_cita.expira_en <= now() THEN
    RAISE EXCEPTION 'hold_expirado' USING ERRCODE = '22023';
  END IF;

  IF v_cita.prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_prestador' USING ERRCODE = '22023';
  END IF;
  -- Snapshot de §5; cita_sin_precio queda para holds legacy malformados.
  IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
    RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
  END IF;

  -- ── PRE-VALIDACIÓN del motor financiero (SIN insertar) ─────────────
  SELECT cc.id, cc.moneda, cc.estado
  INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = v_cita.prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
  END IF;

  -- Tanda S54-B (a): la cuenta debe estar ACTIVA — pagar contra una
  -- cuenta pendiente/suspendida/cerrada promete una liquidación que
  -- generar_liquidacion rechaza (§7.11).
  IF v_cuenta.estado <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM cuenta_roles cr
    WHERE cr.cuenta_comercial_id = v_cuenta.id
      AND cr.tipo_actor = 'prestador_servicios'
      AND cr.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE = '22023';
  END IF;

  SELECT rfa.fee_config_id INTO v_fee
  FROM resolver_fee_aplicable(
    p_cuenta_comercial_id => v_cuenta.id,
    p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
    p_country_code        => v_cita.country_code,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_tipo_origen         => 'cita',
    p_categoria_origen    => NULL,
    p_fecha_referencia    => now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- ── Transición doble en el MISMO UPDATE: cita firme + pago simulado
  --    registrado. metadata.pagado_en será fecha_cobro_kushki en el cierre.
  v_pagado_en := now();
  UPDATE evento_cita_servicio
  SET estado         = 'confirmada',
      estado_reserva = 'pagada',
      metadata       = COALESCE(metadata, '{}'::jsonb)
                       || jsonb_build_object('pagado_en', v_pagado_en, 'pago_simulado', true),
      updated_at     = now()
  WHERE id = p_cita_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'confirmada',
    'estado_reserva', 'pagada',
    'pagado_en', v_pagado_en
  );
END;
$$;
