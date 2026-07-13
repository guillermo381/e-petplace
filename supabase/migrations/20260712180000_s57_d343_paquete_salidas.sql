-- ═══════════════════════════════════════════════════════════════════
-- S57-A2a — D-343: EL PAQUETE DE SALIDAS (bono anclado al prestador)
--
-- Letra firmada que esta migración implementa (regla de piedra, releída):
--   · MODELO_PASEO.md v1.3 §6bis (comprar ≠ reservar, presets 5/10/15,
--     vigencia mensual, rollover FIFO a precio de origen, cero dark patterns)
--   · MODELO_FINANCIERO.md v2.7 Decisión T + regla 7.15 (un pago que jamás
--     toca el ledger; SOLO los dos cierres devengan; breakage declarado vía
--     crear_evento_economico, revenue de plataforma sin payout)
--   · POLITICAS_EPETPLACE.md v1.5 P16 (cancelar ≥2 h vuelve al saldo;
--     no-show consume y el paseador cobra; recordatorio UNO y sereno)
--
-- Chasis: bonos (existente, CHECK tipo_servicio='paseo' en piedra) +
-- evento_cita_servicio.bono_id (existente, hasta hoy sin escritor).
--
-- Diseño (decisiones técnicas de Code, doble check regla 67):
--   · Cada compra = UNA fila de bonos con su precio_por_unidad de ORIGEN.
--     El rollover NO mueve salidas: EXTIENDE la vigencia de los bonos
--     viejos con saldo hasta el vencimiento del nuevo — el consumo FIFO
--     (fecha_compra ASC) gasta las viejas primero y cada salida devenga
--     al precio del paquete en que NACIÓ, exactamente como manda T.
--   · Reservar contra saldo NO pasa por hold/checkout: la cita nace
--     'confirmada'/'pagada' (el pago fue el del paquete) — TERCER
--     escritor del invariante, enmienda con comentario más abajo.
--   · El breakage usa la rama "revenue puro plataforma" de
--     crear_evento_economico (cuenta NULL → monto_plataforma = bruto,
--     payout NULL, estado 'no_aplica') con tipo_evento propio
--     'bono_breakage' (línea propia en el modelo, Decisión T).
--   · marcar_no_show_cita gana el DEVENGO de Decisión T (era un flip de
--     estado sin plata) + gate temporal: solo desde la hora de recogida
--     — sin ese gate, el devengo la volvía palanca de cobro anticipado.
--
-- Edge declarado (v1): una reserva hecha antes del vencimiento y
-- cancelada en ventana DESPUÉS de que el cron de vencimiento corrió
-- devuelve la salida a un bono ya 'vencido' (queda registrada en el
-- bono pero fuera del breakage ya declarado). Ventana de horas, caso
-- raro; si aparece en datos reales se enmienda el cierre.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Tipo de evento propio del breakage (Decisión T) ──────────────
-- PG17: ADD VALUE es legal en transacción; el valor solo se USA en
-- runtime de las funciones (jamás en esta misma transacción).
ALTER TYPE public.tipo_evento_economico_enum ADD VALUE IF NOT EXISTS 'bono_breakage';

-- ── 2. Columnas nuevas del chasis ────────────────────────────────────
ALTER TABLE public.bonos
  ADD COLUMN IF NOT EXISTS prestador_servicio_id uuid REFERENCES public.prestador_servicios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pago_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.bonos.prestador_servicio_id IS
  'Ancla del paquete a la OFERTA concreta (bloque de duración) del prestador — §6bis: presets de UNA duración del menú canónico. FIFO y rollover agrupan por esta ancla.';
COMMENT ON COLUMN public.bonos.pago_metadata IS
  'Contrato de pago simulado declarado (patrón suscripciones_servicio.pago_metadata): pagado_en, pago_simulado, rollover_de/rollover_extendido_por, aviso_vencimiento_<fecha>.';
COMMENT ON COLUMN public.bonos.precio_por_unidad IS
  'Precio de ORIGEN por salida (snapshot de prestador_servicios.precio_paquete al comprar). Base del devengo FIFO: cada salida devenga al precio del paquete en que nació (Decisión T).';

ALTER TABLE public.prestador_servicios
  ADD COLUMN IF NOT EXISTS precio_paquete numeric NULL;

COMMENT ON COLUMN public.prestador_servicios.precio_paquete IS
  'Precio POR SALIDA dentro del paquete de salidas (descuento por volumen, patrón Decisión S/precio_plan). NULL = sin paquete en este bloque (la superficie de compra no aparece). Sin CHECK relacional — la comparación con el suelto es dato, no juicio (decisión S56).';

-- ── 3. Invariante 'pagada' — ENMIENDA con comentario (no bypass) ─────
-- La letra canónica (financiero §4.3, ampliada S56) tenía DOS escritores.
-- El paquete agrega el TERCERO. El gemelo MODELO_FINANCIERO.md v2.7 se
-- enmienda en el mismo commit (escritora única de docs, regla 76).
COMMENT ON COLUMN public.evento_cita_servicio.estado_reserva IS
  'Invariante canónico (S54, ampliado S56 y S57-D343): estado_reserva=''pagada'' ⟺ la cita está CUBIERTA POR UN PAGO — pasó por confirmar_cita_pagada (cita suelta), o nació de un PLAN con período cobrado (suscripcion_servicio_id + metadata.origen=''plan''), o nació RESERVADA CONTRA SALDO DE PAQUETE ya pagado (bono_id + metadata.origen=''paquete''; el pago fue el del paquete, Decisión T). Esos son los TRES únicos escritores del valor; NULL = ciclo de pago no aplica (legacy/walk-in).';

-- ── 4. comprar_paquete_salidas — la compra ES la renovación (P16e) ───
CREATE OR REPLACE FUNCTION public.comprar_paquete_salidas(
  p_prestador_id uuid,
  p_servicio_id  uuid,
  p_mascota_id   uuid,
  p_unidades     int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth        uuid := auth.uid();
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
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  -- Presets EN LETRA (§6bis.1): 5 · 10 · 15. Un preset nuevo = enmienda
  -- del doc + migración, jamás un valor suelto.
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
  -- NULL = el prestador no ofrece paquete en este bloque (contrato B).
  IF v_servicio.precio_paquete IS NULL OR v_servicio.precio_paquete <= 0 THEN
    RAISE EXCEPTION 'paquete_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón
  -- confirmar_cita_pagada/contratar_plan_paseo): un cobro que el motor
  -- rechazará al cierre es un cobro que promete mentira.
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
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum,
    (SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id),
    'transaccional'::revenue_stream_enum, 'cita', NULL, now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- Vigencia MENSUAL declarada (§6bis.2): vence al cierre del mes.
  v_vence := (v_hoy_local + interval '1 month')::date;
  v_total := round(v_servicio.precio_paquete * p_unidades, 2);

  -- ROLLOVER (P16e): los bonos viejos del MISMO ancla con saldo y
  -- vigencia viva se toman con lock y su vigencia se EXTIENDE al nuevo
  -- vencimiento. Las salidas quedan en su fila de origen: el FIFO las
  -- gasta primero y devengan a SU precio (transferencia de saldo, SIN
  -- evento económico — Decisión T).
  -- lock primero (FOR UPDATE no convive con agregados), conteo después
  PERFORM 1
  FROM bonos b
  WHERE b.user_id = v_auth AND b.mascota_id = p_mascota_id
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= v_hoy_local
  FOR UPDATE;
  SELECT count(*)::int AS bonos, COALESCE(sum(unidades_total - unidades_usadas), 0)::int AS salidas
  INTO v_rollover
  FROM bonos b
  WHERE b.user_id = v_auth AND b.mascota_id = p_mascota_id
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= v_hoy_local;

  -- UN pago simulado DECLARADO (jamás toca el ledger — variante (b)).
  INSERT INTO bonos (
    prestador_id, user_id, mascota_id, tipo_servicio, descripcion,
    unidades_total, unidades_usadas, duracion_minutos,
    precio_total, precio_por_unidad,
    fecha_compra, fecha_vencimiento, estado, estado_pago,
    country_code, prestador_servicio_id, pago_metadata
  ) VALUES (
    p_prestador_id, v_auth, p_mascota_id, 'paseo',
    'Paquete de ' || p_unidades || ' salidas de ' || v_servicio.duracion_minutos || ''' (vigencia mensual)',
    p_unidades, 0, v_servicio.duracion_minutos,
    v_total, v_servicio.precio_paquete,
    v_hoy_local, v_vence, 'activo', 'pagado',
    COALESCE((SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id), 'EC'),
    p_servicio_id,
    jsonb_build_object(
      'pagado_en', v_pagado_en, 'pago_simulado', true,
      'salidas_rollover', v_rollover.salidas
    )
  ) RETURNING id INTO v_bono_id;

  IF v_rollover.bonos > 0 THEN
    UPDATE bonos b
    SET fecha_vencimiento = v_vence,
        pago_metadata = b.pago_metadata || jsonb_build_object(
          'rollover_extendido_por', v_bono_id, 'rollover_en', now()
        )
    WHERE b.user_id = v_auth AND b.mascota_id = p_mascota_id
      AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
      AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
      AND b.unidades_usadas < b.unidades_total
      AND b.id <> v_bono_id;
  END IF;

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
$$;

-- ── 5. reservar_salida_paquete — confirma SIN pago (el pago fue el
--      del paquete); FIFO a precio de origen ────────────────────────
CREATE OR REPLACE FUNCTION public.reservar_salida_paquete(
  p_prestador_id uuid,
  p_servicio_id  uuid,
  p_mascota_id   uuid,
  p_fecha        date,
  p_hora         time without time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth        uuid := auth.uid();
  v_servicio    record;
  v_bono        record;
  v_horario     record;
  v_ocupados    int;
  v_country     text;
  v_eje         text;
  v_visibilidad jsonb;
  v_evento_id   uuid;
  v_cita_id     uuid;
  v_direccion   jsonb;
  v_saldo       int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;
  SELECT ps.id, ps.tipo_servicio INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;
  -- D-341: vacaciones del paseador — mismo rebote que el hold.
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  -- FIFO: el bono más VIEJO del ancla con saldo y vigencia que cubre la
  -- fecha de la cita. Su precio_por_unidad es el precio de ORIGEN del
  -- devengo (snapshot en cita.precio). Lock de fila contra reservas
  -- concurrentes del mismo saldo.
  SELECT b.* INTO v_bono
  FROM bonos b
  WHERE b.user_id = v_auth AND b.mascota_id = p_mascota_id
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= p_fecha
  ORDER BY b.fecha_compra, b.created_at, b.id
  LIMIT 1
  FOR UPDATE;
  IF v_bono.id IS NULL THEN
    RAISE EXCEPTION 'sin_saldo_paquete' USING ERRCODE = '22023';
  END IF;

  -- La VENTANA COMPLETA en franja activa alineada (S55-B2) con la
  -- duración del BONO (snapshot de lo comprado).
  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = p_prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32
    AND p_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_hora)::int + v_bono.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  v_ocupados := _agenda_ocupacion(p_prestador_id, p_fecha, p_hora, v_bono.duracion_minutos);
  IF v_ocupados >= v_horario.cupo THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visibilidad
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- D-339: la dirección del hogar entra al snapshot al nacer la cita.
  v_direccion := _direccion_hogar_snapshot(v_auth);

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'reservar_salida_paquete', 'bono_id', v_bono.id),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  -- La cita nace FIRME y CUBIERTA (invariante ampliado S57: tercer
  -- escritor — el pago fue el del paquete). precio = precio de ORIGEN
  -- del bono FIFO: el devengo del cierre lo usa tal cual.
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva,
    expira_en, country_code, bono_id, direccion_snapshot, metadata
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_bono.precio_por_unidad, v_bono.duracion_minutos,
    'confirmada', 'pagada',
    NULL, COALESCE(v_country, 'EC'), v_bono.id, v_direccion,
    jsonb_build_object(
      'origen', 'paquete', 'pago_simulado', true,
      'pagado_en', v_bono.pago_metadata ->> 'pagado_en'
    )
  ) RETURNING id INTO v_cita_id;

  -- La salida se descuenta al confirmarse la cita (§6bis.3).
  UPDATE bonos
  SET unidades_usadas = unidades_usadas + 1,
      estado = CASE WHEN unidades_usadas + 1 >= unidades_total THEN 'agotado' ELSE estado END,
      agotado_en = CASE WHEN unidades_usadas + 1 >= unidades_total THEN now() ELSE agotado_en END
  WHERE id = v_bono.id;

  SELECT COALESCE(sum(b.unidades_total - b.unidades_usadas), 0)::int INTO v_saldo
  FROM bonos b
  WHERE b.user_id = v_auth AND b.mascota_id = p_mascota_id
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.fecha_vencimiento >= (now() AT TIME ZONE 'America/Guayaquil')::date;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'bono_id', v_bono.id,
    'fecha', p_fecha,
    'hora', p_hora,
    'precio_origen', v_bono.precio_por_unidad,
    'saldo_restante', v_saldo
  );
END;
$$;

-- ── 6. cancelar_reserva_paquete — ≥2 h vuelve al saldo (P16b) ────────
CREATE OR REPLACE FUNCTION public.cancelar_reserva_paquete(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth   uuid := auth.uid();
  v_cita   record;
  v_bono   record;
  v_ahora  timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_saldo  int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.bono_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_paquete' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: %', v_cita.estado USING ERRCODE = '22023';
  END IF;
  -- P16(b): con <2 h rige el no-show — la salida se pierde y el
  -- paseador cobra. Sin excepciones automáticas.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '2 hours' THEN
    RAISE EXCEPTION 'ventana_vencida' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_bono FROM bonos WHERE id = v_cita.bono_id FOR UPDATE;

  -- La franja se libera SOLA: _agenda_ocupacion no cuenta canceladas.
  UPDATE evento_cita_servicio
  SET estado = 'cancelada',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'motivo', 'cancelacion_en_ventana_paquete', 'cancelada_en', now()
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  -- La salida VUELVE al saldo de su bono de origen. Si el bono se había
  -- agotado, revive; si ya venció (edge declarado arriba), la vuelta se
  -- registra igual — la fila dice la verdad aunque el breakage ya corrió.
  UPDATE bonos
  SET unidades_usadas = unidades_usadas - 1,
      estado = CASE WHEN estado = 'agotado' THEN 'activo' ELSE estado END,
      agotado_en = CASE WHEN estado = 'agotado' THEN NULL ELSE agotado_en END,
      pago_metadata = CASE WHEN estado = 'vencido'
        THEN pago_metadata || jsonb_build_object('devolucion_post_vencimiento', now())
        ELSE pago_metadata END
  WHERE id = v_bono.id;

  SELECT COALESCE(sum(b.unidades_total - b.unidades_usadas), 0)::int INTO v_saldo
  FROM bonos b
  WHERE b.user_id = v_auth AND b.mascota_id = v_cita.mascota_id
    AND b.prestador_id = v_cita.prestador_id AND b.prestador_servicio_id = v_bono.prestador_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.fecha_vencimiento >= v_ahora::date;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'bono_id', v_bono.id,
    'saldo', v_saldo
  );
END;
$$;

-- ── 7. vencer_paquetes_salidas — aviso sereno + breakage declarado ───
-- Patrón cerrar_y_renovar_planes: corrida idempotente (cron de higiene
-- o disparo manual). (a) UN recordatorio sereno ≤3 días antes del
-- vencimiento (P16e: jamás countdown). (b) Al vencer: estado='vencido'
-- y las salidas nunca usadas son BREAKAGE — evento de plataforma vía
-- crear_evento_economico, tipo propio, cuenta NULL (revenue puro
-- plataforma: monto_plataforma = bruto, payout NULL — sin payout).
CREATE OR REPLACE FUNCTION public.vencer_paquetes_salidas()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_bono      record;
  v_restantes int;
  v_moneda    text;
  v_aviso_key text;
  v_avisados  int := 0;
  v_vencidos  int := 0;
  v_breakage  numeric(14,2) := 0;
  v_monto     numeric(14,2);
BEGIN
  -- (a) el recordatorio: UNO y sereno, cerca del cierre (P16e).
  FOR v_bono IN
    SELECT * FROM bonos
    WHERE tipo_servicio = 'paseo' AND estado = 'activo' AND estado_pago = 'pagado'
      AND unidades_usadas < unidades_total
      AND fecha_vencimiento >= v_hoy AND fecha_vencimiento <= v_hoy + 3
    FOR UPDATE
  LOOP
    v_aviso_key := 'aviso_vencimiento_' || v_bono.fecha_vencimiento::text;
    IF NOT (v_bono.pago_metadata ? v_aviso_key) THEN
      INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
      VALUES (
        v_bono.user_id, v_bono.country_code, 'sistema', 'in_app',
        'Tu paquete de salidas vence pronto',
        'Te quedan ' || (v_bono.unidades_total - v_bono.unidades_usadas) ||
          ' salidas y el paquete vence el ' || to_char(v_bono.fecha_vencimiento, 'DD/MM') ||
          '. Si compras otro antes de esa fecha, se suman al nuevo.',
        jsonb_build_object('subtipo', 'paquete_vencimiento', 'bono_id', v_bono.id),
        'pet_parent'
      );
      UPDATE bonos SET pago_metadata = pago_metadata || jsonb_build_object(v_aviso_key, now())
      WHERE id = v_bono.id;
      v_avisados := v_avisados + 1;
    END IF;
  END LOOP;

  -- (b) el vencimiento: breakage DECLARADO (Decisión T).
  FOR v_bono IN
    SELECT * FROM bonos
    WHERE tipo_servicio = 'paseo' AND estado = 'activo'
      AND fecha_vencimiento < v_hoy
    FOR UPDATE
  LOOP
    v_restantes := v_bono.unidades_total - v_bono.unidades_usadas;

    UPDATE bonos SET estado = 'vencido' WHERE id = v_bono.id;
    v_vencidos := v_vencidos + 1;

    IF v_restantes > 0 AND v_bono.estado_pago = 'pagado'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'bono' AND ee.origen_id = v_bono.id
           AND ee.tipo_evento = 'bono_breakage'
       )
    THEN
      v_monto := round(v_restantes * COALESCE(v_bono.precio_por_unidad, 0), 2);
      SELECT cc.moneda INTO v_moneda
      FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_bono.prestador_id;

      PERFORM crear_evento_economico(
        p_tipo_evento         => 'bono_breakage'::tipo_evento_economico_enum,
        p_revenue_stream      => 'eventual'::revenue_stream_enum,
        p_cuenta_comercial_id => NULL,   -- revenue puro plataforma: sin payout
        p_country_code        => v_bono.country_code,
        p_moneda              => COALESCE(v_moneda, 'USD'),
        p_monto_bruto         => v_monto,
        p_monto_kushki_fee    => 0,      -- simulación honesta
        p_origen_tipo         => 'bono',
        p_origen_id           => v_bono.id,
        p_fecha_devengo       => now(),
        p_fecha_cobro_kushki  => (v_bono.pago_metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object(
          'pago_simulado', true, 'via', 'vencer_paquetes_salidas',
          'salidas_vencidas', v_restantes,
          'precio_por_unidad', v_bono.precio_por_unidad
        )
      );
      v_breakage := v_breakage + v_monto;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'vencidos', v_vencidos,
    'breakage_total', v_breakage, 'corrida_en', now()
  );
END;
$$;

-- ── 8. marcar_no_show_cita — el cierre DEVENGA (Decisión T conectada) ─
-- Enmiendas sobre la función existente (misma firma, REPLACE):
--   (1) gate temporal: solo desde la hora de recogida — con el devengo
--       nuevo, marcar no_show anticipado sería cobrar sin bloquear agenda.
--   (2) DEVENGO: si la cita está cubierta ('pagada' — suelto, plan o
--       paquete), el paseador devenga al precio SNAPSHOTEADO de la cita
--       (para el paquete: el precio FIFO de origen que reservar escribió).
--       Patrón cerrar_paseo_con_calidad, mismo guard anti-duplicado.
CREATE OR REPLACE FUNCTION public.marcar_no_show_cita(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_cita     record;
  v_cuenta   record;
  v_now      timestamptz := now();
  v_evento_econ uuid;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN
    RAISE EXCEPTION 'cita_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_cita.prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_prestador' USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(v_cita.prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF v_cita.estado IS DISTINCT FROM 'confirmada' THEN
    RAISE EXCEPTION 'cita_estado_invalido_para_no_show: %', v_cita.estado
      USING ERRCODE = '22023';
  END IF;
  -- S57: el no-show solo existe desde la hora de recogida (P16c/P18c) —
  -- antes de esa hora la agenda aún no se bloqueó en vano.
  IF (v_cita.fecha + v_cita.hora) > (now() AT TIME ZONE 'America/Guayaquil') THEN
    RAISE EXCEPTION 'cita_aun_no_ocurre' USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
  SET estado = 'no_show',
      updated_at = v_now
  WHERE id = p_cita_id;

  -- DEVENGO DEL CIERRE no_show [Decisión T: no hay tercera vía — este
  -- cierre devenga IGUAL que cerrar_paseo_con_calidad]. Solo citas
  -- CUBIERTAS (invariante 'pagada'); legacy (NULL) pasa de largo.
  IF v_cita.estado_reserva = 'pagada'
     AND NOT EXISTS (
       SELECT 1 FROM eventos_economicos ee
       WHERE ee.origen_tipo = 'cita'
         AND ee.origen_id = p_cita_id
         AND ee.tipo_evento = 'cita_pagada'
     )
  THEN
    IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
      RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
    END IF;
    SELECT cc.id, cc.moneda INTO v_cuenta
    FROM prestadores pr
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    WHERE pr.id = v_cita.prestador_id;
    IF v_cuenta.id IS NULL THEN
      RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
    END IF;

    v_evento_econ := crear_evento_economico(
      p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
      p_revenue_stream      => 'transaccional'::revenue_stream_enum,
      p_cuenta_comercial_id => v_cuenta.id,
      p_country_code        => v_cita.country_code,
      p_moneda              => v_cuenta.moneda,
      p_monto_bruto         => v_cita.precio,
      p_monto_kushki_fee    => 0,   -- simulación honesta
      p_origen_tipo         => 'cita',
      p_origen_id           => p_cita_id,
      p_fecha_devengo       => v_now,
      p_fecha_cobro_kushki  => (v_cita.metadata ->> 'pagado_en')::timestamptz,
      p_metadata            => jsonb_build_object(
        'pago_simulado', true, 'via', 'marcar_no_show_cita', 'cierre', 'no_show'
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok',            true,
    'cita_id',       p_cita_id,
    'estado',        'no_show',
    'user_id',       v_cita.user_id,
    'fecha',         v_cita.fecha,
    'hora',          v_cita.hora,
    'tipo_servicio', v_cita.tipo_servicio,
    'country_code',  v_cita.country_code,
    'evento_economico_id', v_evento_econ
  );
END;
$$;

-- ── 9. L-140: grants explícitos, jamás heredados ─────────────────────
REVOKE ALL ON FUNCTION public.comprar_paquete_salidas(uuid, uuid, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comprar_paquete_salidas(uuid, uuid, uuid, int) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.reservar_salida_paquete(uuid, uuid, uuid, date, time without time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reservar_salida_paquete(uuid, uuid, uuid, date, time without time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancelar_reserva_paquete(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_reserva_paquete(uuid) TO authenticated, service_role;

-- corrida de motor: jamás desde el cliente (patrón cerrar_y_renovar_planes)
REVOKE ALL ON FUNCTION public.vencer_paquetes_salidas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vencer_paquetes_salidas() TO service_role;

REVOKE ALL ON FUNCTION public.marcar_no_show_cita(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_no_show_cita(uuid) TO authenticated, service_role;

-- ── 10. CURA de crear_evento_economico — la rama "revenue puro
--       plataforma" estaba MUERTA de nacimiento ─────────────────────
-- Hallazgo S57 (destapado por el assert T12 del breakage): con
-- p_cuenta_comercial_id NULL el INSERT referenciaba
-- v_fee_resuelto.fee_config_id con el record SIN ASIGNAR → error 55000.
-- Nadie había pisado esa rama antes (el breakage del paquete es su
-- primer caller real). Cura mínima: scalar v_fee_config_id asignado en
-- la rama con fee; la rama sin cuenta lo deja NULL (fee_config_id NULL
-- en el evento, correcto para revenue puro plataforma). Cero cambios de
-- contrato; proacl intacto (CREATE OR REPLACE preserva grants).

CREATE OR REPLACE FUNCTION public.crear_evento_economico(p_tipo_evento tipo_evento_economico_enum, p_revenue_stream revenue_stream_enum, p_cuenta_comercial_id uuid, p_country_code text, p_moneda text, p_monto_bruto numeric, p_monto_kushki_fee numeric, p_origen_tipo text, p_origen_id uuid, p_kushki_charge_id text DEFAULT NULL::text, p_fecha_devengo timestamp with time zone DEFAULT now(), p_fecha_cobro_kushki timestamp with time zone DEFAULT NULL::timestamp with time zone, p_categoria_origen text DEFAULT NULL::text, p_descuento_aplicado numeric DEFAULT 0, p_quien_absorbe_descuento quien_absorbe_descuento_enum DEFAULT NULL::quien_absorbe_descuento_enum, p_metadata jsonb DEFAULT '{}'::jsonb, p_parent_evento_id uuid DEFAULT NULL::uuid, p_cohorte_periodo text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_evento_id              uuid;
  v_tipo_actor_requerido   tipo_actor_enum;
  v_tipo_actor_validado    tipo_actor_enum;
  v_rol_activo             boolean;
  v_fee_resuelto           record;
  v_fee_config_id          uuid;   -- S57: la rama sin cuenta dejaba v_fee_resuelto sin asignar y el INSERT moría
  v_monto_plataforma       numeric(14,2) := 0;
  v_monto_payout           numeric(14,2);
  v_estado                 estado_evento_economico_enum;
  v_fee_calculo_detalle    jsonb;
  v_quien_absorbe          quien_absorbe_descuento_enum;
  v_base_calculo           numeric(14,2);
  v_kushki_pct             numeric;
  v_kushki_fijo            numeric;
  v_metadata_final         jsonb;
BEGIN
  -- ---------- Validaciones de entrada ----------
  IF p_monto_bruto < 0 THEN
    RAISE EXCEPTION 'monto_bruto no puede ser negativo: %', p_monto_bruto;
  END IF;
  
  IF p_monto_kushki_fee < 0 THEN
    RAISE EXCEPTION 'monto_kushki_fee no puede ser negativo: %', p_monto_kushki_fee;
  END IF;
  
  -- ---------- Derivar tipo_actor_requerido del origen del evento ----------
  -- Mapping origen_tipo → tipo_actor que la cuenta DEBE tener activo
  v_tipo_actor_requerido := CASE p_origen_tipo
    WHEN 'pedido'             THEN 'seller_productos'::tipo_actor_enum
    WHEN 'cita'               THEN 'prestador_servicios'::tipo_actor_enum
    WHEN 'donacion'           THEN 'refugio'::tipo_actor_enum
    WHEN 'bono'               THEN 'prestador_servicios'::tipo_actor_enum
    WHEN 'estadia'            THEN 'prestador_servicios'::tipo_actor_enum
    -- Tipos sin validación de rol (revenue puro plataforma o casos especiales)
    WHEN 'suscripcion'        THEN NULL
    WHEN 'producto_comercial' THEN NULL
    WHEN 'ajuste_manual'      THEN NULL
    WHEN 'evento_diferido'    THEN NULL  -- hereda contexto del parent
    ELSE NULL
  END;
  
  -- ---------- Si hay cuenta_comercial Y hay rol requerido: validar ----------
  IF p_cuenta_comercial_id IS NOT NULL AND v_tipo_actor_requerido IS NOT NULL THEN
    -- Validar que la cuenta existe
    IF NOT EXISTS (
      SELECT 1 FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id
    ) THEN
      RAISE EXCEPTION 'cuenta_comercial_id % no existe', p_cuenta_comercial_id;
    END IF;
    
    -- Validar rol activo en cuenta_roles
    SELECT EXISTS (
      SELECT 1 FROM cuenta_roles cr
      WHERE cr.cuenta_comercial_id = p_cuenta_comercial_id
        AND cr.tipo_actor = v_tipo_actor_requerido
        AND cr.estado = 'activo'
    ) INTO v_rol_activo;
    
    IF NOT v_rol_activo THEN
      RAISE EXCEPTION 'La cuenta_comercial % no tiene rol activo de %. Activar el rol en cuenta_roles antes de crear eventos de origen %.',
        p_cuenta_comercial_id, v_tipo_actor_requerido, p_origen_tipo;
    END IF;
    
    v_tipo_actor_validado := v_tipo_actor_requerido;
    
  ELSIF p_cuenta_comercial_id IS NOT NULL AND v_tipo_actor_requerido IS NULL THEN
    -- Caso especial: hay cuenta pero el origen no requiere validación de rol
    -- (ej. ajuste_manual, evento_diferido). Pasamos NULL como tipo_actor a resolver_fee.
    v_tipo_actor_validado := NULL;
  END IF;
  
  -- ---------- Resolver fee aplicable ----------
  IF p_cuenta_comercial_id IS NOT NULL AND v_tipo_actor_validado IS NOT NULL THEN
    SELECT * INTO v_fee_resuelto
    FROM _resolver_fee_aplicable(
      p_cuenta_comercial_id => p_cuenta_comercial_id,
      p_tipo_actor          => v_tipo_actor_validado,
      p_country_code        => p_country_code,
      p_revenue_stream      => p_revenue_stream,
      p_tipo_origen         => p_origen_tipo,
      p_categoria_origen    => p_categoria_origen,
      p_fecha_referencia    => p_fecha_devengo
    );
    
    IF v_fee_resuelto.fee_config_id IS NULL THEN
      RAISE EXCEPTION 'No se encontró fee_config aplicable para cuenta=%, tipo_actor=%, country=%, stream=%, origen=%, categoria=%',
        p_cuenta_comercial_id, v_tipo_actor_validado, p_country_code, 
        p_revenue_stream, p_origen_tipo, p_categoria_origen;
    END IF;
    
    v_fee_config_id := v_fee_resuelto.fee_config_id;

    -- Determinar quién absorbe descuento
    v_quien_absorbe := COALESCE(p_quien_absorbe_descuento, v_fee_resuelto.absorbe_descuento_default);
    
    -- ---------- Calcular monto_plataforma según tipo_calculo ----------
    IF v_quien_absorbe = 'plataforma' AND p_descuento_aplicado > 0 THEN
      v_base_calculo := p_monto_bruto + p_descuento_aplicado;
    ELSE
      v_base_calculo := p_monto_bruto;
    END IF;
    
    CASE v_fee_resuelto.tipo_calculo
      
      WHEN 'porcentual' THEN
        v_monto_plataforma := ROUND(
          v_base_calculo * (v_fee_resuelto.parametros->>'pct')::numeric / 100, 
          2
        );
      
      WHEN 'fijo' THEN
        v_monto_plataforma := (v_fee_resuelto.parametros->>'monto')::numeric;
      
      WHEN 'escalonado' THEN
        v_monto_plataforma := ROUND(
          v_base_calculo * (
            SELECT (tramo->>'pct')::numeric
            FROM jsonb_array_elements(v_fee_resuelto.parametros->'tramos') AS tramo
            WHERE tramo->>'hasta' IS NULL 
               OR v_base_calculo <= (tramo->>'hasta')::numeric
            ORDER BY 
              CASE WHEN tramo->>'hasta' IS NULL 
                   THEN 999999999 
                   ELSE (tramo->>'hasta')::numeric 
              END ASC
            LIMIT 1
          ) / 100,
          2
        );
      
      WHEN 'passthrough_kushki' THEN
        v_kushki_pct := COALESCE((v_fee_resuelto.parametros->>'kushki_pct')::numeric, 0);
        v_kushki_fijo := COALESCE((v_fee_resuelto.parametros->>'kushki_fijo')::numeric, 0);
        v_monto_plataforma := 0;
      
      WHEN 'personalizado' THEN
        RAISE EXCEPTION 'tipo_calculo=personalizado requiere implementación específica';
      
      ELSE
        RAISE EXCEPTION 'tipo_calculo % no soportado', v_fee_resuelto.tipo_calculo;
    END CASE;
    
    -- Ajuste por descuento si plataforma absorbe
    IF v_quien_absorbe = 'plataforma' AND p_descuento_aplicado > 0 THEN
      v_monto_plataforma := v_monto_plataforma - p_descuento_aplicado;
    END IF;
    
    -- Calcular monto_payout
    v_monto_payout := p_monto_bruto - p_monto_kushki_fee - v_monto_plataforma;
    v_estado := 'pendiente_liquidar';
    
    -- Snapshot del cálculo (incluye tipo_actor_resuelto para desglose en liquidaciones)
    v_fee_calculo_detalle := jsonb_build_object(
      'fee_config_id', v_fee_resuelto.fee_config_id,
      'tipo_calculo', v_fee_resuelto.tipo_calculo,
      'parametros_aplicados', v_fee_resuelto.parametros,
      'absorbe_descuento', v_quien_absorbe,
      'descuento_aplicado', p_descuento_aplicado,
      'precio_lista_referencia', v_base_calculo,
      'es_default', v_fee_resuelto.es_default,
      'tipo_actor_resuelto', v_tipo_actor_validado::text,
      'calculado_en', now()
    );
    
  ELSE
    -- Sin cuenta_comercial: revenue puro plataforma
    -- (suscripciones Prime, productos comerciales, publicidad, etc.)
    v_monto_plataforma := p_monto_bruto - p_monto_kushki_fee;
    v_monto_payout := NULL;
    v_estado := 'no_aplica';
    v_fee_calculo_detalle := jsonb_build_object(
      'tipo', 'revenue_puro_plataforma',
      'sin_fee_config', true,
      'tipo_actor_resuelto', NULL,
      'calculado_en', now()
    );
  END IF;
  
  -- ---------- Construir metadata final ----------
  v_metadata_final := p_metadata 
    || jsonb_build_object('categoria_origen', p_categoria_origen);
  
  IF v_tipo_actor_validado IS NOT NULL THEN
    v_metadata_final := v_metadata_final 
      || jsonb_build_object('tipo_actor_resuelto', v_tipo_actor_validado::text);
  END IF;
  
  IF p_descuento_aplicado > 0 THEN
    v_metadata_final := v_metadata_final 
      || jsonb_build_object(
           'descuento_aplicado', p_descuento_aplicado,
           'quien_absorbe_descuento', v_quien_absorbe
         );
  END IF;
  
  -- ---------- INSERT ----------
  INSERT INTO eventos_economicos (
    tipo_evento, revenue_stream, cuenta_comercial_id,
    country_code, moneda,
    monto_bruto, monto_kushki_fee, monto_plataforma, monto_payout,
    fee_config_id, fee_calculo_detalle,
    origen_tipo, origen_id,
    kushki_charge_id,
    parent_evento_id, cohorte_periodo,
    fecha_devengo, fecha_cobro_kushki,
    estado, metadata
  ) VALUES (
    p_tipo_evento, p_revenue_stream, p_cuenta_comercial_id,
    p_country_code, p_moneda,
    p_monto_bruto, p_monto_kushki_fee, v_monto_plataforma, v_monto_payout,
    v_fee_config_id, v_fee_calculo_detalle,
    p_origen_tipo, p_origen_id,
    p_kushki_charge_id,
    p_parent_evento_id, p_cohorte_periodo,
    p_fecha_devengo, p_fecha_cobro_kushki,
    v_estado, v_metadata_final
  ) RETURNING id INTO v_evento_id;
  
  RETURN v_evento_id;
END;
$function$
;
