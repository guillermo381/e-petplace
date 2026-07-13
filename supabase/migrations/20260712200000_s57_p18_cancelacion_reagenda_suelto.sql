-- ═══════════════════════════════════════════════════════════════════
-- S57-A3 — P18: CANCELACIÓN Y REAGENDA DEL PASEO SUELTO
--
-- Letra firmada que esta migración implementa:
--   · POLITICAS_EPETPLACE.md v1.5 P18 (las tres ventanas: ≥24 h
--     reagendar o cancelar · 24-2 h solo reagendar · <2 h/no-show el
--     paseo se pierde y el paseador cobra)
--   · MODELO_PASEO.md v1.3 §3bis (reagendar = franja REAL del MISMO
--     paseador; la franja vieja se libera y se re-oferta sola)
--   · MODELO_FINANCIERO.md v2.7 regla 7.16 (la cancelación se DECLARA
--     sobre el pago — cero eventos, aplicar_reembolso() intacta; el
--     no-show usa el cierre de Decisión T, ya conectado en 20260712180000)
--
-- Además CIERRA D-349 (edge del auto-solape): _agenda_ocupacion gana el
-- parámetro de exclusión de la propia cita (DROP + CREATE con firma
-- nueva, L-119 — los 7 callers con 4 args siguen resolviendo por el
-- DEFAULT) y saltar_cita_plan lo usa (la cura llega también al plan).
--
-- La pantalla de ELECCIÓN DE DESTINO del reembolso NO existe en v1
-- (decisión founder S57): el reembolso es simulado y declarado en la
-- cita; el saldo e-PetPlace sigue APAGADO (disparo: Kushki fase 1).
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. D-349: _agenda_ocupacion con exclusión de la propia cita ──────
-- Firma nueva ⇒ DROP explícito de la vieja (L-119: REPLACE con firma
-- distinta fabrica una sobrecarga zombi y la llamada de 4 args queda
-- ambigua). Callers relevados contra pg_proc (L-120): crear_bloqueo_agenda,
-- obtener_paseadores_disponibles, _generar_citas_plan,
-- obtener_inicios_paseo_disponibles, saltar_cita_plan,
-- obtener_slots_disponibles, reservar_salida_paquete — todos llaman con
-- 4 args y el DEFAULT NULL los deja intactos.
DROP FUNCTION public._agenda_ocupacion(uuid, date, time without time zone, integer);

CREATE FUNCTION public._agenda_ocupacion(
  p_prestador_id     uuid,
  p_fecha            date,
  p_hora             time without time zone,
  p_duracion_minutos integer,
  p_excluir_cita     uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  WITH ocupantes AS (
    SELECT EXTRACT(EPOCH FROM c.hora)::bigint                                    AS ini,
           EXTRACT(EPOCH FROM c.hora)::bigint + c.duracion_minutos * 60          AS fin
    FROM evento_cita_servicio c
    WHERE c.prestador_id = p_prestador_id
      AND c.fecha = p_fecha
      AND c.id IS DISTINCT FROM p_excluir_cita   -- D-349: la cita que se
      -- está moviendo no se cuenta a sí misma como ocupante
      AND (
        c.estado IN ('confirmada', 'en_curso')                                   -- firmes
        OR (c.estado = 'pendiente'                                               -- holds vigentes
            AND c.estado_reserva = 'pendiente_pago'
            AND c.expira_en > now())                                             -- expiración perezosa
      )
      -- solapa la ventana pedida: ini < fin_ventana AND fin > ini_ventana
      AND EXTRACT(EPOCH FROM c.hora)::bigint
          < EXTRACT(EPOCH FROM p_hora)::bigint + p_duracion_minutos * 60
      AND EXTRACT(EPOCH FROM c.hora)::bigint + c.duracion_minutos * 60
          > EXTRACT(EPOCH FROM p_hora)::bigint
  ),
  instantes AS (
    SELECT EXTRACT(EPOCH FROM p_hora)::bigint AS t
    UNION
    SELECT o.ini FROM ocupantes o
    WHERE o.ini > EXTRACT(EPOCH FROM p_hora)::bigint
  )
  SELECT COALESCE(MAX(n), 0)::int
  FROM (
    SELECT (SELECT count(*) FROM ocupantes o WHERE o.ini <= i.t AND o.fin > i.t) AS n
    FROM instantes i
  ) conteos;
$$;

-- ── 2. saltar_cita_plan hereda la cura (D-349 cerrada también acá) ───
-- Único cambio contra el body vigente: el conteo de ocupación excluye
-- la propia cita que se mueve.
CREATE OR REPLACE FUNCTION public.saltar_cita_plan(p_cita_id uuid, p_nueva_fecha date, p_nueva_hora time without time zone)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_susc     record;
  v_horario  record;
  v_ocupados int;
  v_ahora    timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_nueva_fecha IS NULL OR p_nueva_hora IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.suscripcion_servicio_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: %', v_cita.estado USING ERRCODE = '22023';
  END IF;

  -- P14(c): con <24 h la cita se pierde — no hay reagenda automática.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '24 hours' THEN
    RAISE EXCEPTION 'aviso_tarde' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = v_cita.suscripcion_servicio_id;
  -- dentro del MISMO período y jamás al pasado
  IF p_nueva_fecha < v_susc.periodo_inicio OR p_nueva_fecha >= v_susc.periodo_fin THEN
    RAISE EXCEPTION 'fuera_del_periodo' USING ERRCODE = '22023';
  END IF;
  IF (p_nueva_fecha + p_nueva_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: mover una salida a un día bloqueado del paseador rebota.
  IF _prestador_bloqueado(v_cita.prestador_id, p_nueva_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_cita.prestador_id::text || ':' || p_nueva_fecha::text, 0)
  );

  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = v_cita.prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = v_susc.prestador_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- D-349: la propia cita no se cuenta como ocupante de su ventana vieja.
  v_ocupados := _agenda_ocupacion(v_cita.prestador_id, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos, p_cita_id);
  IF v_ocupados >= v_horario.cupo THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
  SET fecha = p_nueva_fecha,
      hora = p_nueva_hora,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'reagendada_de', jsonb_build_object('fecha', v_cita.fecha, 'hora', v_cita.hora),
        'reagendada_en', now()
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  UPDATE eventos_mascota
  SET fecha_evento = (p_nueva_fecha + p_nueva_hora)
  WHERE id = v_cita.evento_id;

  RETURN jsonb_build_object(
    'ok', true, 'cita_id', p_cita_id,
    'fecha', p_nueva_fecha, 'hora', p_nueva_hora
  );
END;
$$;

-- ── 3. reagendar_cita_suelta — ventanas (a)/(b) de P18: ≥2 h ─────────
-- Franja REAL del MISMO paseador (motor de ventana de siempre), re-snapshot
-- de fecha/hora, la franja vieja se libera sola. El pago viaja con la cita.
CREATE OR REPLACE FUNCTION public.reagendar_cita_suelta(
  p_cita_id     uuid,
  p_nueva_fecha date,
  p_nueva_hora  time without time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_horario  record;
  v_ocupados int;
  v_servicio_id uuid;
  v_ahora    timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_nueva_fecha IS NULL OR p_nueva_hora IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  -- SUELTO = ni plan ni paquete (esos tienen P14 y P16 con sus RPCs).
  IF v_cita.suscripcion_servicio_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.bono_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_paquete' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' OR v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, COALESCE(v_cita.estado_reserva, 'NULL')
      USING ERRCODE = '22023';
  END IF;

  -- P18(c): con <2 h el paseo se pierde — ya no se mueve.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '2 hours' THEN
    RAISE EXCEPTION 'ventana_vencida' USING ERRCODE = '22023';
  END IF;
  IF (p_nueva_fecha + p_nueva_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: mover a un día bloqueado del paseador rebota.
  IF _prestador_bloqueado(v_cita.prestador_id, p_nueva_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_cita.prestador_id::text || ':' || p_nueva_fecha::text, 0)
  );

  -- La oferta del tipo de la cita (para franjas atadas a servicio); la
  -- duración que manda es la SNAPSHOTEADA en la cita (S55-B2).
  SELECT ps.id INTO v_servicio_id
  FROM prestador_servicios ps
  WHERE ps.prestador_id = v_cita.prestador_id
    AND ps.tipo_servicio = v_cita.tipo_servicio
    AND ps.duracion_minutos = v_cita.duracion_minutos
    AND ps.activo
  LIMIT 1;

  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = v_cita.prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = v_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- D-349 curada de nacimiento: la propia cita no ocupa su ventana vieja.
  v_ocupados := _agenda_ocupacion(v_cita.prestador_id, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos, p_cita_id);
  IF v_ocupados >= v_horario.cupo THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- Re-snapshot de fecha/hora; el pago viaja con la cita (P18a). La
  -- franja vieja queda libre sola: la ocupación lee fecha/hora nuevas.
  UPDATE evento_cita_servicio
  SET fecha = p_nueva_fecha,
      hora = p_nueva_hora,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'reagendada_de', jsonb_build_object('fecha', v_cita.fecha, 'hora', v_cita.hora),
        'reagendada_en', now()
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  UPDATE eventos_mascota
  SET fecha_evento = (p_nueva_fecha + p_nueva_hora)
  WHERE id = v_cita.evento_id;

  RETURN jsonb_build_object(
    'ok', true, 'cita_id', p_cita_id,
    'fecha', p_nueva_fecha, 'hora', p_nueva_hora
  );
END;
$$;

-- ── 4. cancelar_cita_suelta — ventana (a) de P18: ≥24 h ─────────────
-- Reembolso SIMULADO Y DECLARADO sobre el pago (regla 7.16, patrón 7.14
-- enmendada): estado/metadata de la cita. CERO eventos económicos;
-- aplicar_reembolso() NO se toca. Sin pantalla de destino (founder S57).
CREATE OR REPLACE FUNCTION public.cancelar_cita_suelta(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth  uuid := auth.uid();
  v_cita  record;
  v_ahora timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.suscripcion_servicio_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.bono_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_paquete' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' OR v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, COALESCE(v_cita.estado_reserva, 'NULL')
      USING ERRCODE = '22023';
  END IF;

  -- P18(b): entre 24 y 2 h solo se reagenda — la plata no se mueve.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '24 hours' THEN
    RAISE EXCEPTION 'ventana_cancelacion_vencida' USING ERRCODE = '22023';
  END IF;

  -- La cancelación se DECLARA sobre el pago (7.16). La cita deja de
  -- estar cubierta: estado_reserva sale de 'pagada' (invariante intacto).
  UPDATE evento_cita_servicio
  SET estado = 'cancelada',
      estado_reserva = 'cancelada',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'motivo', 'p18_cancelacion_en_ventana',
        'cancelada_en', now(),
        'reembolso_simulado', jsonb_build_object(
          'monto', v_cita.precio,
          'simulado', true,
          'motivo', 'p18_cancelacion_en_ventana',
          'aplicado_en', now()
        )
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'cancelada',
    'reembolso_monto', v_cita.precio,
    'reembolso_simulado', true
  );
END;
$$;

-- ── 5. L-140: grants explícitos ──────────────────────────────────────
-- _agenda_ocupacion renació con el DROP: espejo del ACL previo relevado
-- ({postgres, service_role} — la llaman solo funciones DEFINER).
REVOKE ALL ON FUNCTION public._agenda_ocupacion(uuid, date, time without time zone, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._agenda_ocupacion(uuid, date, time without time zone, integer, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.reagendar_cita_suelta(uuid, date, time without time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reagendar_cita_suelta(uuid, date, time without time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancelar_cita_suelta(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_cita_suelta(uuid) TO authenticated, service_role;

-- saltar_cita_plan conserva su firma y grants (REPLACE no los toca).
