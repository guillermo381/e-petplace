-- S115-A · FIRMA DEL FOUNDER (opción 2) — EL FEE SE RESUELVE POR LA FECHA DEL SERVICIO
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912420000-fecha-servicio.sql
-- VEDA 76(g): NO RIGE.
--
-- 🔴 EL CASO QUE NO AGUANTABA, Y NO ERA NINGUNO DE LOS TRES QUE LA MESA LISTÓ.
--    Medido antes de escribir:
--      · el congelador dispara **sólo en INSERT** y hace `ON CONFLICT DO NOTHING`
--        ⇒ congela UNA vez y **nunca re-congela**;
--      · `confirmar_cita_pagada` **no lee el desglose: re-resuelve de cero**;
--      · y el desglose **ya guarda `fee_config_id`**.
--    O sea: **dos resoluciones independientes del mismo hecho.** Pasarle la fecha del
--    servicio a las dos las haría coincidir *mientras nada cambie* — y en la reagenda
--    (que la mesa votó re-resolver) el congelado queda viejo y la confirmación nuevo.
--    *Dos resoluciones no pueden «coincidir»: pueden, como mucho, no haber divergido
--    todavía.* ⇒ La cura no es que coincidan: es que **haya una sola**.
--      ① la confirmación LEE el congelado; sólo resuelve si no hay.
--      ② el congelador re-congela al reagendar **mientras la cita no esté pagada**.
--      ③ y todo lo que resuelva, resuelve con la FECHA DEL SERVICIO.
--
-- 🔴 Y UN DEFECTO QUE INTRODUJE YO CON EL MÍNIMO, cazado midiendo:
--    hay **110 citas con precio $0,00** —días consumidos de un paquete, ya pagados en el
--    bono— y `comision_efectiva(0, 18, 1.50)` devolvía **$1,50**. Hoy no muerde porque
--    esas citas no devengan (0 eventos), pero el mínimo creaba la posibilidad de **cobrar
--    la comisión dos veces**. *El mínimo es un piso sobre una transacción real, no un
--    cargo por una no-transacción.*

BEGIN;

-- ── ① BASE CERO ⇒ COMISIÓN CERO ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.comision_efectiva(p_base numeric, p_pct numeric, p_minimo numeric)
RETURNS jsonb LANGUAGE sql IMMUTABLE
AS $fn$
  SELECT CASE
    /* 🔴 Base cero = ya se cobró en otro lado (un día de guardería consumido de un
       paquete). Aplicarle el mínimo cobraría comisión sobre plata que ya la pagó. */
    WHEN COALESCE(p_base, 0) = 0 THEN
      jsonb_build_object('porcentual', 0, 'minimo', COALESCE(p_minimo,0),
                         'comision', 0, 'aplico', 'base_cero')
    ELSE
      jsonb_build_object(
        'porcentual', round(p_base * COALESCE(p_pct,0) / 100, 2),
        'minimo',     COALESCE(p_minimo, 0),
        'comision',   GREATEST(round(p_base * COALESCE(p_pct,0) / 100, 2), COALESCE(p_minimo,0)),
        'aplico',     CASE WHEN round(p_base * COALESCE(p_pct,0)/100, 2) >= COALESCE(p_minimo,0)
                           THEN 'porcentual' ELSE 'minimo' END)
  END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.comision_efectiva(numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.comision_efectiva(numeric, numeric, numeric) TO authenticated;

-- ── ② EL CONGELADOR: fecha del servicio + re-congela al reagendar (si no está pagada) ──
CREATE OR REPLACE FUNCTION public._trg_cita_congela_desglose()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_moneda text; v_fee uuid; v_cat text; v_cod_iva text; v_pct numeric;
  v_base numeric; v_iva numeric; v_ref timestamptz;
BEGIN
  IF NEW.estado_reserva IS DISTINCT FROM 'pendiente_pago' THEN RETURN NEW; END IF;
  IF NEW.precio IS NULL THEN RETURN NEW; END IF;

  SELECT cc.moneda INTO v_moneda
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = NEW.prestador_id;
  IF v_moneda IS NULL THEN RETURN NEW; END IF;

  /* 🔴 LA FECHA DEL SERVICIO, no now(). Mediodía para no rozar el borde. */
  v_ref := NEW.fecha::timestamptz + interval '12 hours';

  SELECT ts.categoria, ts.codigo_iva, ct.pct INTO v_cat, v_cod_iva, v_pct
    FROM tipos_servicio ts
    LEFT JOIN cat_tasas_impuesto ct ON ct.codigo = ts.codigo_iva AND ct.activo
     AND ct.vigencia_desde <= v_ref AND (ct.vigencia_hasta IS NULL OR ct.vigencia_hasta > v_ref)
   WHERE ts.codigo = NEW.tipo_servicio;
  IF v_cod_iva IS NULL OR v_pct IS NULL THEN RETURN NEW; END IF;

  SELECT rfa.fee_config_id INTO v_fee
    FROM prestadores pr
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    CROSS JOIN LATERAL _resolver_fee_aplicable(
      cc.id, 'prestador_servicios'::tipo_actor_enum, NEW.country_code,
      'transaccional'::revenue_stream_enum,
      CASE WHEN v_cat = 'hospedaje' THEN 'estadia' ELSE 'cita' END,
      v_cat, v_ref) rfa
   WHERE pr.id = NEW.prestador_id;

  v_base := round(NEW.precio, 2);
  v_iva  := round(v_base * v_pct / 100, 2);

  /* 🔴 RE-CONGELA AL REAGENDAR, y sólo mientras NO esté pagada (voto de la mesa: el fee
     es el de la fecha en que el servicio ocurre). Una vez pagada, el desglose es un
     hecho: *re-precificar algo que la familia ya pagó es cambiarle el precio después
     de cobrarle.* El guard es el propio `estado_reserva` de arriba. */
  INSERT INTO cita_desglose (cita_id, subtotal, impuesto, total, moneda, fee_config_id)
  VALUES (NEW.id, v_base, v_iva, v_base + v_iva, v_moneda, v_fee)
  ON CONFLICT (cita_id) DO UPDATE
    SET subtotal = EXCLUDED.subtotal, impuesto = EXCLUDED.impuesto,
        total = EXCLUDED.total, fee_config_id = EXCLUDED.fee_config_id;

  RETURN NEW;
END $fn$;
REVOKE EXECUTE ON FUNCTION public._trg_cita_congela_desglose() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_cita_congela_desglose ON public.evento_cita_servicio;
CREATE TRIGGER trg_cita_congela_desglose
  AFTER INSERT OR UPDATE OF fecha, precio, tipo_servicio, estado_reserva
  ON public.evento_cita_servicio
  FOR EACH ROW EXECUTE FUNCTION public._trg_cita_congela_desglose();

CREATE OR REPLACE FUNCTION public.confirmar_cita_pagada(p_cita_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_cita      record;
  v_cuenta    record;
  v_fee       uuid;
  v_pagado_en timestamptz;
  v_direccion jsonb;   -- D-339
  v_titular   uuid;    -- S89 D-673: destinatario del negocio
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

  /* 🔴 S115 · FIRMA DEL FOUNDER (opcion 2): PRIMERO EL CONGELADO.
     Si la cita ya tiene desglose, su `fee_config_id` ES el fee — no se re-resuelve.
     *Dos resoluciones independientes del mismo hecho no pueden "coincidir": pueden,
     como mucho, no haber divergido todavia.* Leer el congelado vuelve la divergencia
     INEXPRESABLE en vez de vigilada. */
  SELECT d.fee_config_id INTO v_fee FROM cita_desglose d WHERE d.cita_id = v_cita.id;

  /* Solo si NO hay congelado se resuelve — y con la FECHA DEL SERVICIO, jamas con
     now(). Esto pasa cuando la cita nacio en otro estado y llego a pagada sin pasar
     por `pendiente_pago` (medido: 8 citas en ese caso, 0 con desglose). */
  IF v_fee IS NULL THEN
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    p_cuenta_comercial_id => v_cuenta.id,
    p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
    p_country_code        => v_cita.country_code,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_tipo_origen         => 'cita',
    /* 🔴 S115: ANTES iba NULL, y desde que el congelador manda la categoria real
       eso producia DOS fee_config_id distintos para la MISMA cita — el congelado
       decia 12 % (vet) y la confirmacion 18 % (default de cuidado). *Dos numeros
       para el mismo hecho no discuten: gana el ultimo que escribio.* Se lee del
       MISMO lugar que el congelador: el catalogo. */
    p_categoria_origen    => (SELECT ts.categoria FROM tipos_servicio ts
                              WHERE ts.codigo = v_cita.tipo_servicio),
    /* LA FECHA DEL SERVICIO. Para una cita, la fecha en que el precio rige es la
       fecha en que el servicio OCURRE — no hoy y no la del pago. Mediodia para no
       rozar el borde de una vigencia. */
    p_fecha_referencia    => (v_cita.fecha::timestamptz + interval '12 hours')
  ) rfa;
  END IF;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- D-339: hold que nació sin dirección + checkout que la capturó = el
  -- pago la congela. Un snapshot existente NO se pisa. S61 D-392: el
  -- grooming A DOMICILIO hereda el mecanismo VERBATIM.
  IF v_cita.direccion_snapshot IS NULL AND (
    EXISTS (
      SELECT 1 FROM tipos_servicio ts
      WHERE ts.codigo = v_cita.tipo_servicio AND ts.categoria = 'paseo'
    )
    OR v_cita.modalidad = 'domicilio'
  ) THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  -- S61 D-392, EL GUARD: la cita a DOMICILIO no se paga sin dirección —
  -- la promesa "el groomer sabe a dónde ir" es del MOTOR, no de la UI.
  IF v_cita.modalidad = 'domicilio'
     AND v_cita.direccion_snapshot IS NULL
     AND v_direccion IS NULL THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;

  -- ── Transición doble en el MISMO UPDATE: cita firme + pago simulado
  --    registrado. metadata.pagado_en será fecha_cobro_kushki en el cierre.
  v_pagado_en := now();
  UPDATE evento_cita_servicio
  SET estado         = 'confirmada',
      estado_reserva = 'pagada',
      direccion_snapshot = COALESCE(direccion_snapshot, v_direccion),   -- D-339
      metadata       = COALESCE(metadata, '{}'::jsonb)
                       || jsonb_build_object('pagado_en', v_pagado_en, 'pago_simulado', true),
      updated_at     = now()
  WHERE id = p_cita_id;


  -- ── S89 · D-673 (EN SOMBRA): el hecho «la cita quedó firme» toca el timbre.
  --    DOS audiencias del MISMO instante (firma founder 6-ago-2026): el aviso
  --    al dueño y el aviso al negocio nacen de esta transacción. Los dos tipos
  --    siguen en sombra: nada llega a campana ni correo hasta la firma de su
  --    voz (vara S89). Molde: procedimiento_agendado post-D-674. fecha/hora
  --    de v_cita son válidas acá: el UPDATE de arriba no las tocó.
  SELECT pr.user_id INTO v_titular FROM prestadores pr WHERE pr.id = v_cita.prestador_id;

  PERFORM registrar_intencion_notificacion(
    p_tipo                 => 'cita_confirmada',
    p_destinatario_user_id => v_cita.user_id,
    p_mascota_id           => v_cita.mascota_id,
    p_datos                => jsonb_build_object('cita_id', v_cita.id, 'origen', 'pago',
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_cita.mascota_id),
                                             'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_cita.prestador_id),
                                             'fecha', to_char(v_cita.fecha,'DD/MM'), 'hora', to_char(v_cita.hora,'HH24:MI'))
          || public._voz_notificacion('cita_confirmada', v_cita.user_id, v_cita.mascota_id,
               jsonb_build_object(
                 'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_cita.prestador_id),
                 'fecha',   to_char(v_cita.fecha,'DD/MM'),
                 'hora',    to_char(v_cita.hora,'HH24:MI'))),
    p_clave_dedup          => 'cita-confirmada:' || v_cita.id
  );

  IF v_titular IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'cita_solicitada',
      p_destinatario_user_id => v_titular,
      p_mascota_id           => v_cita.mascota_id,
      p_evento_id            => v_cita.evento_id,   -- adjudicación mesa S89: el referente del hecho (C: sin él, el destino cae al fallback de mascota)
      p_datos                => jsonb_build_object('cita_id', v_cita.id, 'origen', 'pago',
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_cita.mascota_id),
                                             'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_cita.prestador_id),
                                             'fecha', to_char(v_cita.fecha,'DD/MM'), 'hora', to_char(v_cita.hora,'HH24:MI'))
            || public._voz_notificacion('cita_solicitada', v_titular, v_cita.mascota_id,
                 jsonb_build_object('fecha', to_char(v_cita.fecha,'DD/MM'),
                                    'hora',  to_char(v_cita.hora,'HH24:MI'))),
      p_clave_dedup          => 'cita-solicitada:' || v_cita.id
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'confirmada',
    'estado_reserva', 'pagada',
    'pagado_en', v_pagado_en
  );
END;
$function$
;
COMMIT;
