-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A-6 · ② EL PAQUETE DE PASEO DEJA DE NACER PAGADO
--
-- 76(g) VEDA: **NO RIGE.** Reemplazo de una función. **Cero backfill** — los 3
--   bonos de paseo vivos quedan `pagado` donde están; la letra rige hacia
--   adelante. Ninguno rompe constraint: `pago_expira_en` nace NULL y el CHECK
--   sólo la exige ausente cuando `estado_pago <> 'pendiente'`.
-- REVERSA: `docs/relevamientos/2026-09-04-s108a-REVERSA-M16.sql`.
--
-- ═══ CERO PIEZAS NUEVAS, Y ESO SE MIDIÓ ════════════════════════════════════
-- El paquete de paseo vive en el **MISMO `bonos`** que el de guardería
-- (`bonos_tipo_valido` admite `'paseo'`), así que `bono_id` ya está en el XOR.
-- Y se censó si algo del camino de cobro discrimina por `tipo_servicio` —que es
-- la clase que el rollover ya nos cobró una vez—:
--   · la edge `pagos-cobro` lee `bonos` por id, **sin filtro de tipo** ✅
--   · `_trg_bono_congela_desglose` **no filtra tipo** ⇒ congela también el de paseo ✅
--   · `expirar_bonos_sin_pago` **no filtra tipo** ⇒ lo vence ✅
--   · `mover_sujeto_por_reverso` **no filtra tipo** ⇒ lo reversa ✅
--   · `confirmar_pago_bono` resuelve **POR TIPO**, fail-closed (curado en `…100000`)
-- ⇒ **El paquete de paseo hereda el arco completo.** Lo único suyo era el
--   rollover, y ya se mudó.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
CREATE OR REPLACE FUNCTION public.comprar_paquete_salidas(p_prestador_id uuid, p_servicio_id uuid, p_unidades integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth        uuid := auth.uid();
  v_familia     uuid;
  v_country     text;
  v_servicio    record;
  v_cuenta      record;
  v_fee         uuid;
  v_hoy_local   date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_vence       date;
  v_pagado_en   timestamptz := now();
  v_total       numeric(14,2);
  v_bono_id     uuid;
  v_rollover    record;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- El paquete es DEL HOGAR (v1.4): la familia vigente del comprador.
  SELECT fm.familia_id INTO v_familia
  FROM familia_miembro fm
  WHERE fm.user_id = v_auth AND fm.hasta IS NULL
  LIMIT 1;
  IF v_familia IS NULL THEN
    RAISE EXCEPTION 'sin_familia' USING ERRCODE = '22023';
  END IF;
  -- Presets EN LETRA (§6bis.1): 5 · 10 · 15.
  IF p_unidades IS NULL OR p_unidades NOT IN (5, 10, 15) THEN
    RAISE EXCEPTION 'preset_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio, ps.precio_paquete, ps.duracion_minutos
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL OR v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.precio_paquete IS NULL OR v_servicio.precio_paquete <= 0 THEN
    RAISE EXCEPTION 'paquete_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón S54).
  SELECT cc.id, cc.estado INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = p_prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
  END IF;
  IF v_cuenta.estado <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cuenta_roles cr
    WHERE cr.cuenta_comercial_id = v_cuenta.id
      AND cr.tipo_actor = 'prestador_servicios' AND cr.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE = '22023';
  END IF;
  -- el país del cobro: el del hogar (fallback prestador — jamás inventado)
  SELECT COALESCE(f.country_code, pr.country_code, 'EC') INTO v_country
  FROM familia f, prestadores pr
  WHERE f.id = v_familia AND pr.id = p_prestador_id;
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum,
    v_country, 'transaccional'::revenue_stream_enum, 'cita', NULL, now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  v_vence := (v_hoy_local + interval '1 month')::date;
  v_total := round(v_servicio.precio_paquete * p_unidades, 2);

  -- ROLLOVER (P16e) — ahora POR HOGAR: lock primero (FOR UPDATE no
  -- convive con agregados), conteo después.
  PERFORM 1
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= v_hoy_local
  FOR UPDATE;
  SELECT count(*)::int AS bonos, COALESCE(sum(unidades_total - unidades_usadas), 0)::int AS salidas
  INTO v_rollover
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= v_hoy_local;

  -- UN pago simulado DECLARADO (jamás toca el ledger). COMPRAR NO ES
  -- RESERVAR: este INSERT a bonos es la ÚNICA escritura — cero citas.
  INSERT INTO bonos (
    prestador_id, user_id, familia_id, mascota_id, tipo_servicio, descripcion,
    unidades_total, unidades_usadas, duracion_minutos,
    precio_total, precio_por_unidad,
    fecha_compra, fecha_vencimiento, estado, estado_pago,
    country_code, prestador_servicio_id, pago_metadata,
    pago_expira_en
  ) VALUES (
    p_prestador_id, v_auth, v_familia, NULL, 'paseo',
    'Paquete de ' || p_unidades || ' salidas de ' || v_servicio.duracion_minutos || ''' (vigencia mensual, del hogar)',
    p_unidades, 0, v_servicio.duracion_minutos,
    v_total, v_servicio.precio_paquete,
    v_hoy_local, v_vence, 'activo', 'pendiente',
    v_country, p_servicio_id,
    jsonb_build_object('salidas_rollover_proyectadas', v_rollover.salidas),
    /* La misma ventana de 15 minutos que el paquete de guardería y que la
       cita: es la que la familia ya conoce del checkout. */
    now() + interval '15 minutes'
  ) RETURNING id INTO v_bono_id;

  /* ═══ EL ROLLOVER SE MUDÓ A `confirmar_pago_bono` ══════════════════════
     🔴 Vivía acá, en el ACTO DE COMPRAR. Con el bono naciendo `pendiente` eso
     REGALA vigencia por plata que todavía no llegó — y si el pago nunca llega,
     la extensión queda igual. Es el mismo defecto que ya se curó en guardería.
     Su nueva casa lo resuelve POR TIPO: el de paseo filtra además por
     `prestador_servicio_id`, que es la diferencia real entre las dos reglas.
     *Se mudó ANTES de tocar este estado inicial, a propósito: al revés se
     perdía en silencio.* */

  RETURN jsonb_build_object(
    'ok', true,
    'bono_id', v_bono_id,
    'unidades', p_unidades,
    'precio_por_unidad', v_servicio.precio_paquete,
    'total', v_total,
    'vence_el', v_vence,
    'salidas_rollover', v_rollover.salidas,
    'saldo_total', p_unidades + v_rollover.salidas,
    'pagado_en', v_pagado_en
  );
END;
$function$

;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_user uuid; v_prest uuid; v_serv uuid; v_r jsonb; v_b record; v_rol uuid;
        v_venc_antes date; v_venc_despues date;
BEGIN
  SELECT b.user_id, b.prestador_id, b.prestador_servicio_id INTO v_user, v_prest, v_serv
    FROM bonos b WHERE b.tipo_servicio='paseo' LIMIT 1;
  IF v_user IS NULL THEN RAISE EXCEPTION 'cinturon: sin bono de paseo con que DISCRIMINAR'; END IF;

  -- un paquete viejo pagado, con saldo, para ver si el rollover lo alcanza ANTES de tiempo
  INSERT INTO bonos (prestador_id, user_id, familia_id, tipo_servicio, prestador_servicio_id,
    unidades_total, unidades_usadas, precio_total, precio_por_unidad,
    fecha_compra, fecha_vencimiento, estado, estado_pago, country_code)
  SELECT v_prest, v_user, b.familia_id, 'paseo', v_serv, 4, 1, 40, 10,
         public.hoy_local(), (public.hoy_local() + 3)::date, 'activo','pagado','EC'
    FROM bonos b WHERE b.user_id=v_user LIMIT 1
  RETURNING id, fecha_vencimiento INTO v_rol, v_venc_antes;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user::text, 'role','authenticated')::text, true);
  v_r := public.comprar_paquete_salidas(v_prest, v_serv, 5);
  PERFORM set_config('request.jwt.claims','',true);

  SELECT * INTO v_b FROM bonos WHERE id = (v_r->>'bono_id')::uuid;

  -- (a) nace PENDIENTE y con su reloj
  IF v_b.estado_pago <> 'pendiente' THEN
    RAISE EXCEPTION 'cinturon: el paquete de paseo nacio % y no pendiente', v_b.estado_pago;
  END IF;
  IF v_b.pago_expira_en IS NULL THEN
    RAISE EXCEPTION 'cinturon: nacio sin ventana de pago';
  END IF;

  -- (b) 🔴 EL DISCRIMINADOR: comprar NO extiende. Antes extendia aca mismo.
  SELECT fecha_vencimiento INTO v_venc_despues FROM bonos WHERE id=v_rol;
  IF v_venc_despues <> v_venc_antes THEN
    RAISE EXCEPTION 'cinturon: COMPRAR extendio el rollover (% -> %) — deberia esperar al pago',
                    v_venc_antes, v_venc_despues;
  END IF;

  -- (c) el trigger de desglose SI congelo (sirve a los dos tipos)
  IF NOT EXISTS (SELECT 1 FROM bono_desglose WHERE bono_id = v_b.id) THEN
    RAISE EXCEPTION 'cinturon: el paquete de paseo nacio SIN desglose congelado';
  END IF;

  -- (d) y al CONFIRMAR, recien ahi extiende
  PERFORM public.confirmar_pago_bono(v_b.id);
  SELECT fecha_vencimiento INTO v_venc_despues FROM bonos WHERE id=v_rol;
  IF v_venc_despues <= v_venc_antes THEN
    RAISE EXCEPTION 'cinturon: el rollover NO ocurrio al confirmar (% -> %)', v_venc_antes, v_venc_despues;
  END IF;

  -- (e) y sin pago_simulado en ningun lado
  IF v_b.pago_metadata ? 'pago_simulado' THEN
    RAISE EXCEPTION 'cinturon: todavia escribe pago_simulado';
  END IF;

  RAISE NOTICE 'cinturon M16: 5/5 OK (nace pendiente con reloj · COMPRAR no extiende · el desglose se congela · CONFIRMAR extiende · sin pago_simulado)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claims','',true);
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M16: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
