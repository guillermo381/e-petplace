-- Asserts D-338 EL PLAN (S56-A Tarea 2) — TODO corre en una transacción
-- con ROLLBACK final (0 residuos por construcción). Correr:
--   npx supabase --experimental db query --linked -f supabase/dev/test_d338_plan_s56.sql
-- Éxito = 14 filas OK (L-081: último output). Usa el seed demo.
-- Nota L-122a: now() es constante en la transacción — el cierre/renovación
-- se prueban moviendo periodo_fin del plan, no esperando tiempo.

BEGIN;
SET LOCAL request.jwt.claims = '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}';

CREATE TEMP TABLE _res (orden serial, test text, ok boolean, detalle text);
GRANT ALL ON _res TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE _res_orden_seq TO authenticated;
SET LOCAL ROLE authenticated;

DO $probar$
DECLARE
  c_prest constant uuid := 'de300000-0000-4000-8000-0000000000e5';
  c_srv30 constant uuid := 'de300000-0000-4000-8000-00000000a5e0';
  c_masc  constant uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_demo  constant uuid := 'c5d54e3a-cf1a-45c6-8605-dfd826b022ee';
  v_sab   date;
  r       jsonb;
  v_plan  uuid;
  v_cita  record;
  v_susc  record;
  n       int;
  v_dow   smallint;
  v_precio_bloque numeric;
  v_total numeric;
  v_cita_mover uuid;
  v_nueva date;
BEGIN
  -- el paseador demo atiende SÁBADO (seed): plan semanal de sábados.
  v_sab := current_date + (((6 - EXTRACT(DOW FROM current_date)::int) % 7 + 7) % 7);
  IF v_sab <= current_date THEN v_sab := v_sab + 7; END IF;
  v_dow := 6;
  SELECT precio INTO v_precio_bloque FROM prestador_servicios WHERE id = c_srv30;

  -- T0: ATOMICIDAD — un hold suelto vigente en el PRIMER sábado 08:00
  -- hace chocar UNA fecha del plan → el plan ENTERO rebota tipado y no
  -- queda ni suscripción ni cita (el cobro nace exacto o no nace).
  r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_sab, '08:00');
  BEGIN
    r := contratar_plan_paseo(c_prest, c_srv30, c_masc, ARRAY[v_dow]::smallint[], '08:00', 'semanal', true, v_sab);
    INSERT INTO _res(test, ok, detalle) VALUES ('T0 una fecha sin cupo → plan entero rebota', false, 'PUDO — doble booking');
  EXCEPTION WHEN OTHERS THEN
    SELECT count(*) INTO n FROM suscripciones_servicio WHERE user_id = c_demo AND tipo_servicio = 'paseo_mensual';
    INSERT INTO _res(test, ok, detalle)
    VALUES ('T0 una fecha sin cupo → plan entero rebota',
            SQLERRM LIKE 'fecha_sin_cupo%' AND n = 0, SQLERRM || ' · susc=' || n);
  END;

  -- T1: contratar plan semanal (sábados 08:30, 30') — nace activo+pagado
  r := contratar_plan_paseo(c_prest, c_srv30, c_masc, ARRAY[v_dow]::smallint[], '08:30', 'semanal', true, v_sab);
  v_plan := (r->>'suscripcion_id')::uuid;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T1 contratar: ok con citas generadas', (r->>'ok')::boolean AND (r->>'citas_generadas')::int BETWEEN 4 AND 5, r::text);

  -- T2: UN cobro por período — total = bloque × N, unitario = total ÷ N
  n := (r->>'citas_generadas')::int;
  v_total := (r->>'total_periodo')::numeric;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T2 plata exacta: total=bloque×N y unitario=total÷N',
          v_total = round(v_precio_bloque * n, 2)
          AND (r->>'precio_unitario_efectivo')::numeric = round(v_total / n, 2),
          'bloque='||v_precio_bloque||' n='||n||' total='||v_total);

  -- T3: cada cita del plan nace confirmada+pagada con precio = UNITARIO
  --     (la base del devengo — cerrar_paseo_con_calidad la usa tal cual),
  --     metadata declara el pago simulado del período, y lleva
  --     suscripcion_servicio_id + duracion snapshot.
  SELECT count(*) INTO n FROM evento_cita_servicio c
  WHERE c.suscripcion_servicio_id = v_plan
    AND c.estado = 'confirmada' AND c.estado_reserva = 'pagada'
    AND c.precio = (r->>'precio_unitario_efectivo')::numeric
    AND c.duracion_minutos = 30
    AND (c.metadata->>'pago_simulado')::boolean
    AND c.metadata ? 'pagado_en';
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T3 citas firmes con unitario+pago declarado', n = (r->>'citas_generadas')::int, n::text);

  -- T4: JAMÁS evento económico al cobrar (variante b intacta)
  SELECT count(*) INTO n FROM eventos_economicos ee
  WHERE ee.created_at >= now() - interval '1 minute';
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T4 cero eventos económicos al contratar', n = 0, n::text);

  -- T5: el plan OCUPA la agenda (la primera cita bloquea su slot)
  SELECT count(*) INTO n
  FROM obtener_slots_disponibles(c_prest, c_srv30, v_sab, v_sab) s WHERE s.hora = '08:30';
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T5 la cita del plan ocupa el motor de ventana', n = 0, n::text);

  -- T6: plan duplicado rebota tipado
  BEGIN
    r := contratar_plan_paseo(c_prest, c_srv30, c_masc, ARRAY[v_dow]::smallint[], '09:00', 'semanal', true, v_sab);
    INSERT INTO _res(test, ok, detalle) VALUES ('T6 plan duplicado rebota', false, 'PUDO');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(test, ok, detalle) VALUES ('T6 plan duplicado rebota', SQLERRM LIKE 'plan_duplicado%', SQLERRM);
  END;

  -- T8: P14(a) saltar con ≥24 h — reagenda dentro del período, mismo paseador
  SELECT id, fecha INTO v_cita_mover, v_nueva FROM evento_cita_servicio
  WHERE suscripcion_servicio_id = v_plan AND estado = 'confirmada'
  ORDER BY fecha DESC LIMIT 1;  -- la última del período (lejana: ≥24 h seguro)
  r := saltar_cita_plan(v_cita_mover, v_nueva, '09:00');
  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = v_cita_mover;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T8 saltar ≥24h reagenda (hora nueva + rastro en metadata)',
          (r->>'ok')::boolean AND v_cita.hora = '09:00' AND v_cita.metadata ? 'reagendada_de',
          r::text);

  -- T9: P14(a) reagendar FUERA del período rebota
  BEGIN
    r := saltar_cita_plan(v_cita_mover, (SELECT periodo_fin FROM suscripciones_servicio WHERE id = v_plan), '09:00');
    INSERT INTO _res(test, ok, detalle) VALUES ('T9 fuera del período rebota', false, 'PUDO');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(test, ok, detalle) VALUES ('T9 fuera del período rebota', SQLERRM LIKE 'fuera_del_periodo%', SQLERRM);
  END;

  -- T10: pausa de un toque = no renovar (P14d)
  r := configurar_renovacion_plan(v_plan, false);
  SELECT auto_renovar INTO v_susc FROM suscripciones_servicio WHERE id = v_plan;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T10 pausa de un toque (auto_renovar=false)', (r->>'ok')::boolean AND v_susc.auto_renovar = false, r::text);
END
$probar$;

-- ── El ciclo del período corre como el CRON (postgres, sin claims) ────
RESET ROLE;
SET LOCAL request.jwt.claims TO '';

DO $ciclo$
DECLARE
  v_plan uuid;
  v_unit numeric;
  r jsonb;
  n int;
  v_susc record;
BEGIN
  SELECT id, precio_unitario_efectivo INTO v_plan, v_unit
  FROM suscripciones_servicio WHERE tipo_servicio = 'paseo_mensual' AND estado = 'activa'
  ORDER BY created_at DESC LIMIT 1;

  -- T11: aviso 72 h — plan a 2 días de renovar (auto_renovar=true de nuevo)
  UPDATE suscripciones_servicio SET auto_renovar = true,
    periodo_inicio = (now() AT TIME ZONE 'America/Guayaquil')::date - 28,
    periodo_fin    = (now() AT TIME ZONE 'America/Guayaquil')::date + 2
  WHERE id = v_plan;
  r := cerrar_y_renovar_planes();
  SELECT count(*) INTO n FROM notificaciones
  WHERE datos->>'suscripcion_servicio_id' = v_plan::text AND datos->>'subtipo' = 'plan_renovacion_72h';
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T11 aviso 72h: UNA noticia serena', n = 1 AND (r->>'avisados')::int >= 1, r::text);

  -- T11b: correr de nuevo NO duplica el aviso (flag en pago_metadata)
  r := cerrar_y_renovar_planes();
  SELECT count(*) INTO n FROM notificaciones
  WHERE datos->>'suscripcion_servicio_id' = v_plan::text AND datos->>'subtipo' = 'plan_renovacion_72h';
  INSERT INTO _res(test, ok, detalle) VALUES ('T11b el aviso no se repite', n = 1, n::text);

  -- T12: RENOVACIÓN con crédito P14a — período vencido con citas sin usar
  UPDATE suscripciones_servicio SET
    periodo_inicio = (now() AT TIME ZONE 'America/Guayaquil')::date - 30,
    periodo_fin    = (now() AT TIME ZONE 'America/Guayaquil')::date
  WHERE id = v_plan;
  -- se simula el período TRANSCURRIDO: todas las citas quedan ADENTRO
  -- del período viejo (en producción ninguna cita vive más allá de su
  -- periodo_fin — la generación y saltar_cita_plan lo garantizan);
  -- 3 ejecutadas + 2 sin usar = 2 sobrantes reales
  UPDATE evento_cita_servicio SET estado = 'completada', fecha = (now() AT TIME ZONE 'America/Guayaquil')::date - 14
  WHERE suscripcion_servicio_id = v_plan AND estado = 'confirmada';
  UPDATE evento_cita_servicio SET estado = 'confirmada', fecha = (now() AT TIME ZONE 'America/Guayaquil')::date - 7
  WHERE id IN (SELECT id FROM evento_cita_servicio WHERE suscripcion_servicio_id = v_plan AND estado='completada' LIMIT 2);
  r := cerrar_y_renovar_planes();
  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = v_plan;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T12 renovación: período nuevo + crédito de 2 sobrantes declarado',
          (r->>'renovados')::int >= 1
          AND v_susc.periodo_fin > (now() AT TIME ZONE 'America/Guayaquil')::date
          AND (((v_susc.pago_metadata->'cobros') -> -1)->>'credito_aplicado')::numeric = round(v_unit * 2, 2)
          AND (((v_susc.pago_metadata->'cobros') -> -1)->>'cobrado')::numeric
              = greatest((((v_susc.pago_metadata->'cobros') -> -1)->>'total')::numeric - round(v_unit * 2, 2), 0),
          coalesce(((v_susc.pago_metadata->'cobros') -> -1)::text, r::text));

  -- T13: cero eventos económicos en TODO el ciclo (cobro/renovación/crédito)
  SELECT count(*) INTO n FROM eventos_economicos WHERE created_at >= now() - interval '1 minute';
  INSERT INTO _res(test, ok, detalle) VALUES ('T13 el ciclo jamás toca el ledger', n = 0, n::text);

  -- T14: SIN renovar → vencida + reembolso proporcional SIMULADO declarado
  UPDATE suscripciones_servicio SET auto_renovar = false, estado = 'activa',
    periodo_inicio = (now() AT TIME ZONE 'America/Guayaquil')::date - 30,
    periodo_fin    = (now() AT TIME ZONE 'America/Guayaquil')::date
  WHERE id = v_plan;
  UPDATE evento_cita_servicio SET fecha = (now() AT TIME ZONE 'America/Guayaquil')::date - 3
  WHERE suscripcion_servicio_id = v_plan AND estado = 'confirmada';
  r := cerrar_y_renovar_planes();
  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = v_plan;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T14 sin renovar: vencida + reembolso simulado declarado',
          v_susc.estado = 'vencida' AND v_susc.estado_pago = 'reembolsado'
          AND jsonb_array_length(v_susc.pago_metadata->'reembolsos') = 1,
          v_susc.estado || '/' || v_susc.estado_pago || ' ' || coalesce((v_susc.pago_metadata->'reembolsos')::text,'-'));
END
$ciclo$;

SELECT orden, test, CASE WHEN ok THEN 'OK' ELSE 'FALLO' END AS resultado, detalle
FROM _res ORDER BY orden;

ROLLBACK;
