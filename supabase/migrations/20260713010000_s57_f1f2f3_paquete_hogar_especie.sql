-- ═══════════════════════════════════════════════════════════════════
-- S57-A — TANDA DE FALLAS DEL GATE DEL PAQUETE (enmienda FIRMADA
-- MODELO_PASEO v1.4, integrada en b7610ff ANTES de este código).
--
--   F1 · Comprar ≠ reservar también en la UI: nace
--        obtener_paseadores_con_paquete (elegir paseador SIN ventana —
--        la lista de compra no exige fecha/hora). El relevamiento (a)
--        probó que comprar_paquete_salidas jamás creó citas (INSERT
--        solo a bonos): la cura de F1 es de FLUJO, no de datos; el
--        assert de "comprar deja CERO citas" queda igual como red.
--   F2 · EL PAQUETE ES DEL HOGAR: bonos gana familia_id; comprar deja
--        de exigir mascota (firma nueva — DROP L-119); la mascota se
--        elige EN CADA RESERVA; FIFO/rollover/saldo pasan de
--        (user+mascota) a (familia) — el saldo es de la casa.
--   F3 · ESPECIE POR SERVICIO: tipos_servicio.especies_elegibles
--        (jsonb, NULL = todas las especies) como FUENTE DE VERDAD —
--        decisión técnica declarada: catálogo tipos_servicio y no
--        country_config (la elegibilidad es del SERVICIO, no del país;
--        regla 21). Seed: categoría paseo = ["perro"]. Helper
--        _mascota_elegible_servicio + guard tipado mascota_no_elegible
--        en las TRES puertas de reserva de paseo (paquete, suelto,
--        plan): la UI filtra, la DB manda. Nota: el campo por-oferta
--        prestador_servicios.especies_compatibles (S44) sigue
--        existiendo SIN guard — es refinamiento del prestador, no la
--        elegibilidad canónica; se declara, no se toca.
-- ═══════════════════════════════════════════════════════════════════

-- ── F2.1 · bonos.familia_id — el paquete es del hogar ────────────────
ALTER TABLE public.bonos
  ADD COLUMN IF NOT EXISTS familia_id uuid REFERENCES public.familia(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.bonos.familia_id IS
  'El HOGAR dueño del saldo (enmienda v1.4 §6bis.1: el paquete se ancla a paseador+duración, jamás a una mascota — la mascota se elige en cada reserva). FIFO, rollover y saldo agrupan por esta columna.';
COMMENT ON COLUMN public.bonos.mascota_id IS
  'LEGACY para bonos de paseo desde S57 (enmienda v1.4): el paquete es del hogar (familia_id) y la mascota se elige por reserva. Se conserva por los bonos históricos de otros flujos.';

-- backfill defensivo (hoy no hay bonos vivos — verificado; la fila que
-- existiera hereda la familia vigente de su comprador)
UPDATE public.bonos b
SET familia_id = (
  SELECT fm.familia_id FROM familia_miembro fm
  WHERE fm.user_id = b.user_id AND fm.hasta IS NULL
  LIMIT 1
)
WHERE b.familia_id IS NULL;

-- ── F2.2 · RLS: el saldo lo VE el hogar entero ───────────────────────
DROP POLICY IF EXISTS bonos_pet_parent_own ON public.bonos;
CREATE POLICY bonos_pet_parent_own ON public.bonos
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR familia_id IN (
      SELECT fm.familia_id FROM familia_miembro fm
      WHERE fm.user_id = auth.uid() AND fm.hasta IS NULL
    )
  );

-- ── F3.1 · la elegibilidad por especie vive en el catálogo ───────────
ALTER TABLE public.tipos_servicio
  ADD COLUMN IF NOT EXISTS especies_elegibles jsonb NULL;

COMMENT ON COLUMN public.tipos_servicio.especies_elegibles IS
  'MODELO_PASEO v1.4 §1bis: especies que pueden recibir este tipo de servicio (array jsonb de códigos de cat_especies). NULL = todas las especies (multi-especie de nacimiento). La UI filtra, la DB manda: las RPCs de reserva rebotan mascota_no_elegible.';

UPDATE public.tipos_servicio
SET especies_elegibles = '["perro"]'::jsonb
WHERE categoria = 'paseo';

-- ── F3.2 · el helper único del guard ─────────────────────────────────
CREATE OR REPLACE FUNCTION public._mascota_elegible_servicio(
  p_mascota_id    uuid,
  p_tipo_servicio text
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT COALESCE(
    (SELECT ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie
       FROM mascotas m
       LEFT JOIN tipos_servicio ts ON ts.codigo = p_tipo_servicio
      WHERE m.id = p_mascota_id),
    false  -- mascota inexistente: jamás elegible
  );
$$;

-- ── F2.3 · comprar_paquete_salidas SIN mascota (firma nueva) ─────────
-- L-119: firma distinta = DROP explícito de la vieja (jamás sobrecarga
-- zombi). Caller único relevado: wrapper comprarPaqueteSalidas (se
-- enmienda en el mismo commit de tanda).
DROP FUNCTION public.comprar_paquete_salidas(uuid, uuid, uuid, int);

CREATE FUNCTION public.comprar_paquete_salidas(
  p_prestador_id uuid,
  p_servicio_id  uuid,
  p_unidades     int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
    country_code, prestador_servicio_id, pago_metadata
  ) VALUES (
    p_prestador_id, v_auth, v_familia, NULL, 'paseo',
    'Paquete de ' || p_unidades || ' salidas de ' || v_servicio.duracion_minutos || ''' (vigencia mensual, del hogar)',
    p_unidades, 0, v_servicio.duracion_minutos,
    v_total, v_servicio.precio_paquete,
    v_hoy_local, v_vence, 'activo', 'pagado',
    v_country, p_servicio_id,
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
    WHERE b.familia_id = v_familia
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

-- ── F2.4/F3.3 · reservar: la mascota se elige ACÁ (elegible), el
--    saldo es del hogar ────────────────────────────────────────────────
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
  v_familia     uuid;
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
  SELECT fm.familia_id INTO v_familia
  FROM familia_miembro fm
  WHERE fm.user_id = v_auth AND fm.hasta IS NULL
  LIMIT 1;
  IF v_familia IS NULL THEN
    RAISE EXCEPTION 'sin_familia' USING ERRCODE = '22023';
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
  -- F3 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  -- FIFO DEL HOGAR (v1.4): el bono más viejo de la familia con saldo y
  -- vigencia que cubre la fecha; su precio_por_unidad = precio de ORIGEN.
  SELECT b.* INTO v_bono
  FROM bonos b
  WHERE b.familia_id = v_familia
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

  v_direccion := _direccion_hogar_snapshot(v_auth);   -- D-339

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'reservar_salida_paquete', 'bono_id', v_bono.id),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  -- Cita firme y CUBIERTA (tercer escritor del invariante, S57).
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

  UPDATE bonos
  SET unidades_usadas = unidades_usadas + 1,
      estado = CASE WHEN unidades_usadas + 1 >= unidades_total THEN 'agotado' ELSE estado END,
      agotado_en = CASE WHEN unidades_usadas + 1 >= unidades_total THEN now() ELSE agotado_en END
  WHERE id = v_bono.id;

  SELECT COALESCE(sum(b.unidades_total - b.unidades_usadas), 0)::int INTO v_saldo
  FROM bonos b
  WHERE b.familia_id = v_familia
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

-- ── F2.5 · cancelar: el saldo devuelto se informa POR HOGAR ──────────
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
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '2 hours' THEN
    RAISE EXCEPTION 'ventana_vencida' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_bono FROM bonos WHERE id = v_cita.bono_id FOR UPDATE;

  UPDATE evento_cita_servicio
  SET estado = 'cancelada',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'motivo', 'cancelacion_en_ventana_paquete', 'cancelada_en', now()
      ),
      updated_at = now()
  WHERE id = p_cita_id;

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
  WHERE b.familia_id = v_bono.familia_id
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

-- ── F3.4 · el guard también en el SUELTO (hold) y el PLAN ────────────
-- Cuerpos vigentes relevados por pg_get_functiondef; único cambio: el
-- guard mascota_no_elegible tras resolver la oferta.
CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth        uuid := auth.uid();
  v_servicio    record;
  v_horario     record;
  v_ocupados    int;
  v_country     text;
  v_eje         text;
  v_visibilidad jsonb;
  v_evento_id   uuid;
  v_cita_id     uuid;
  v_expira      timestamptz;
  v_direccion   jsonb;   -- D-339
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

  -- S55-B2: la duración de la oferta entra al snapshot junto al precio.
  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.duracion_minutos
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- F3 S57 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: prestador con bloqueo vigente en la fecha (vacaciones) no
  -- recibe holds nuevos.
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = p_prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32: 0=Domingo
    AND p_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_hora)::int + v_servicio.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  v_ocupados := _agenda_ocupacion(p_prestador_id, p_fecha, p_hora, v_servicio.duracion_minutos);
  IF v_ocupados >= v_horario.cupo THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;

  SELECT cte.eje_jtbd, cte.visibilidad_default
  INTO v_eje, v_visibilidad
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- D-339: dirección del hogar al snapshot del hold (NULL honesto).
  IF EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
  ) THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'crear_bloqueo_agenda', 'tipo_servicio', v_servicio.tipo_servicio),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  v_expira := now() + interval '15 minutes';
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva, expira_en, country_code,
    direccion_snapshot
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_servicio.precio, v_servicio.duracion_minutos,
    'pendiente', 'pendiente_pago', v_expira,
    COALESCE(v_country, 'EC'),
    v_direccion
  ) RETURNING id INTO v_cita_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'expira_en', v_expira,
    'precio', v_servicio.precio,
    'duracion_minutos', v_servicio.duracion_minutos,
    'fecha', p_fecha,
    'hora', p_hora
  );
END;
$$;

-- contratar_plan_paseo: mismo guard, cuerpo vigente intacto en el resto.
DO $do$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'contratar_plan_paseo';
  IF v_def NOT LIKE '%_mascota_elegible_servicio%' THEN
    v_def := replace(
      v_def,
      $anchor$  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;$anchor$,
      $anchor$  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- F3 S57 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;$anchor$
    );
    IF v_def NOT LIKE '%_mascota_elegible_servicio%' THEN
      RAISE EXCEPTION 'anclaje del guard en contratar_plan_paseo NO encontró el texto esperado — revisar body';
    END IF;
    EXECUTE v_def;
  END IF;
END
$do$;

-- ── F1 · elegir paseador SIN ventana: la lista de compra ─────────────
CREATE OR REPLACE FUNCTION public.obtener_paseadores_con_paquete(
  p_duracion_minutos int DEFAULT NULL,
  p_servicio_id      uuid DEFAULT NULL
)
RETURNS TABLE(
  prestador_id uuid,
  prestador_servicio_id uuid,
  prestador_nombre text,
  servicio_nombre text,
  duracion_minutos int,
  precio numeric,
  precio_paquete numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Comprar no es reservar (v1.4 §6bis.2bis): acá NO hay fecha/hora —
  -- solo quién ofrece paquete para esa duración. Regla founder S54
  -- intacta: no se oferta quien no puede cobrar (7.13, server-side).
  RETURN QUERY
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.duracion_minutos,
    ps.precio,
    ps.precio_paquete
  FROM prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  WHERE ps.activo
    AND ps.precio_paquete IS NOT NULL AND ps.precio_paquete > 0
    AND (p_duracion_minutos IS NULL OR ps.duracion_minutos = p_duracion_minutos)
    AND (p_servicio_id IS NULL OR ps.id = p_servicio_id)
    AND EXISTS (
      SELECT 1 FROM cuenta_roles cr
      WHERE cr.cuenta_comercial_id = cc.id
        AND cr.tipo_actor = 'prestador_servicios' AND cr.estado = 'activo'
    )
  ORDER BY 7, 3;
END;
$$;

-- ── L-140: grants explícitos, jamás heredados ────────────────────────
REVOKE ALL ON FUNCTION public.comprar_paquete_salidas(uuid, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comprar_paquete_salidas(uuid, uuid, int) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.obtener_paseadores_con_paquete(int, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_paseadores_con_paquete(int, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public._mascota_elegible_servicio(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._mascota_elegible_servicio(uuid, text) TO service_role;

-- reservar/cancelar/crear_bloqueo/contratar conservan firma y grants
-- (CREATE OR REPLACE no toca proacl) — verificación post-migración igual.
