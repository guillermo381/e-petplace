-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · M6 · EL PERÍODO CONGELA SU DESGLOSE ANTES DE COMPROMETER DÍAS
--
-- 76(g) VEDA: **NO RIGE.** Reemplazo de una función. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-02-s108a-REVERSA-M6.sql`.
-- 🤝 CRUCE CON S108-B: consume `congelar_desglose_mensualidad_guarderia(uuid,date)`,
--    que B entregó en `20260902100000` **como función y no como trigger**, a
--    propósito, para que A decidiera el momento. Acá se decide.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
CREATE OR REPLACE FUNCTION public.cobrar_periodo_mensualidad_guarderia(p_suscripcion_id uuid, p_periodo_desde date DEFAULT NULL::date, p_intento_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_s record; v_desde date; v_hasta date; v_d record;
  v_habiles int := 0; v_comprometidos int := 0; v_masc uuid; v_pagado_el date;
  v_cupo jsonb; v_evt uuid; v_cita uuid; v_eje text; v_vis jsonb;
  v_country text; v_dir jsonb; v_jornada int; v_serv uuid;
BEGIN
  SELECT * INTO v_s FROM guarderia_suscripciones WHERE id = p_suscripcion_id FOR UPDATE;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'suscripcion_no_existe' USING ERRCODE='22023'; END IF;
  IF v_s.estado <> 'activa' THEN RAISE EXCEPTION 'suscripcion_no_activa' USING ERRCODE='22023'; END IF;

  /* 🔴 LA COMPUERTA DEL MANDATO — `D-886`. Las cuatro columnas son NOT NULL, así
     que esto **no puede fallar por diseño**; se verifica igual porque un guard
     que sólo existe en el esquema no se ve al leer la función. */
  IF v_s.tarjeta_id IS NULL OR v_s.autorizada_por IS NULL THEN
    RAISE EXCEPTION 'sin_medio_autorizado' USING ERRCODE='22023';
  END IF;

  /* ═══ PAGAR ES ARRANCAR — ANCLA firmada por el founder (31-ago) ══════════
     🟢 **Opción A: la mensualidad cobra al contratar y el período arranca el día
     que la plata entró.** Queda DEROGADO el día de inicio elegible.

     🔴 Y el ancla sale del INTENTO DE PAGO CONFIRMADO, jamás del reloj. Parece
     lo mismo —el actuador corre el día del cobro— y no lo es: un webhook que
     llega a las 00:05 de Guayaquil por un cobro de las 23:50 anclaría el plan
     UN DÍA DESPUÉS del día que la familia pagó, y todos los meses siguientes
     heredarían ese corrimiento. *El reloj dice cuándo corro yo; el intento dice
     cuándo pagó ella, y lo que se le prometió es lo segundo.*

     Renovación: `periodo_hasta + 1`, sin hueco ni solape. Es la misma cadena
     que ancló el primer período, así que el día del mes se conserva solo. */
  IF p_intento_id IS NOT NULL THEN
    SELECT (COALESCE(i.cerrado_en, i.actualizado_en) AT TIME ZONE 'America/Guayaquil')::date
      INTO v_pagado_el
      FROM pagos_intentos i
     WHERE i.id = p_intento_id AND i.estado = 'aprobado';
    /* 🔴 Sin intento APROBADO no se inventa una fecha: se rebota. *Anclar un
       plan en `hoy` porque no encontré el pago es exactamente cómo un cobro que
       no ocurrió termina generando días.* */
    IF v_pagado_el IS NULL THEN
      RAISE EXCEPTION 'intento_no_aprobado' USING ERRCODE='22023';
    END IF;
  END IF;

  v_desde := COALESCE(p_periodo_desde, v_pagado_el,
                      CASE WHEN v_s.periodo_hasta IS NULL THEN public.hoy_local()
                           ELSE v_s.periodo_hasta + 1 END);
  v_hasta := (v_desde + interval '1 month' - interval '1 day')::date;

  /* ═══ EL DESGLOSE DEL PERÍODO SE CONGELA ACÁ ════════════════════════════
     🤝 Contrato de **S108-B**, que entregó `congelar_desglose_mensualidad_guarderia`
     como función idempotente y no como trigger, con su razón escrita: *«quién
     abre el período es de la pista A … un congelador cableado a una decisión de
     diseño que todavía se está tomando es un congelador que un día no
     congela»*. Tenía razón, y acá se ve por qué: bajo **pagar es arrancar** el
     período NO existe hasta que la plata entra, así que ningún trigger sobre
     `periodo_desde` podía saber cuál congelar.

     Se llama **después de resolver `v_desde` y ANTES de comprometer un solo
     día**: si el mes no se puede dar, la transacción entera se deshace y el
     desglose tampoco queda. *Un desglose congelado de un período que no se
     entregó sería un comprobante de algo que no pasó.*

     🔴 CONSECUENCIA QUE VIAJA A B, declarada y no escondida: para el PRIMER
     cobro la puerta de pago **no puede leer este desglose** —todavía no existe,
     porque su período depende del pago que está por hacerse—. El monto del
     primer cobro sale del MANDATO (`precio_mensual` / `monto_esperado`), que es
     lo que la familia autorizó. Este congelado es el registro de lo cobrado, y
     desde el segundo período sí antecede al cobro. */
  PERFORM public.congelar_desglose_mensualidad_guarderia(v_s.id, v_desde);

  SELECT ps.id, ps.duracion_minutos INTO v_serv, v_jornada
    FROM prestador_servicios ps WHERE ps.id = v_s.prestador_servicio_id;

  v_masc := v_s.mascota_id;
  IF v_masc IS NULL THEN
    SELECT m.id INTO v_masc FROM mascotas m
     WHERE m.familia_id = v_s.familia_id AND m.estado_vida='activa'
       AND public._mascota_elegible_servicio(m.id,'guarderia_dia') LIMIT 1;
    IF v_masc IS NULL THEN RAISE EXCEPTION 'mascota_no_determinada' USING ERRCODE='22023'; END IF;
  END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id=v_masc;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_vis
    FROM cat_tipos_evento cte WHERE cte.codigo='cita_servicio';
  v_dir := public._direccion_hogar_snapshot(v_s.autorizada_por);

  PERFORM pg_advisory_xact_lock(
    hashtextextended('guarderia:mensual:'||v_s.prestador_id::text||':'||v_desde::text, 0));

  FOR v_d IN SELECT * FROM public._mensualidad_dias_habiles(v_s.prestador_id, v_desde) LOOP
    v_habiles := v_habiles + 1;
    /* Un día hábil que el lugar no opera NO se compromete y se declara. */
    CONTINUE WHEN NOT v_d.opera;

    v_cupo := public.cupo_guarderia_del_dia(v_s.prestador_id, v_d.fecha);
    IF (v_cupo->>'disponible')::int <= 0 THEN
      /* 🔴 FRENA ENTERO. *Cobrar un mes y no poder dar todos sus días es vender
         lo que no se tiene*, y el que se entera después es el dueño en la
         puerta. La transacción se deshace: no queda medio mes comprometido. */
      RAISE EXCEPTION 'sin_cupo_en_el_periodo: %', v_d.fecha USING ERRCODE='22023';
    END IF;

    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
                                 creado_por_user_id, datos, visibilidad, country_code)
    VALUES (v_masc,'cita_servicio',v_eje, v_d.fecha::timestamptz, v_s.prestador_id,
            v_s.autorizada_por,
            jsonb_build_object('origen','mensualidad_guarderia','suscripcion_id',v_s.id),
            v_vis, COALESCE(v_country,'EC'))
    RETURNING id INTO v_evt;

    INSERT INTO evento_cita_servicio (
      evento_id, user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
      duracion_minutos, estado, estado_reserva, country_code, direccion_snapshot, metadata)
    VALUES (v_evt, v_s.autorizada_por, v_masc, v_s.prestador_id, 'guarderia_dia',
            v_d.fecha,
            /* El día de un mensual **no tiene precio propio**: se pagó el mes.
               Cero, y el metadata dice de dónde viene. */
            0, v_jornada, 'confirmada','pagada', COALESCE(v_country,'EC'), v_dir,
            /* ☠️ MUERE `pago_simulado`: el mes se cobró de verdad. Y viaja el
               INTENTO que lo pagó — *un día del plan tiene que poder decir con
               qué plata se cubrió, o la conciliación se hace a ojo.* */
            jsonb_build_object('origen','mensualidad','suscripcion_id',v_s.id,
                               'periodo_desde', v_desde, 'intento_id', p_intento_id))
    RETURNING id INTO v_cita;

    INSERT INTO guarderia_estadias (cita_id, estado) VALUES (v_cita,'reservada');
    v_comprometidos := v_comprometidos + 1;
  END LOOP;

  UPDATE guarderia_suscripciones
     SET periodo_desde = v_desde, periodo_hasta = v_hasta, updated_at = now()
   WHERE id = v_s.id;

  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_s.id,
    'periodo_desde', v_desde, 'periodo_hasta', v_hasta,
    'habiles', v_habiles, 'comprometidos', v_comprometidos,
    /* Se DECLARA la diferencia en vez de esconderla: son días hábiles en los
       que el lugar no opera. La mesa decide si alguna vez importa. */
    'habiles_sin_operacion', v_habiles - v_comprometidos,
    'precio_mensual', v_s.precio_mensual, 'intento_id', p_intento_id,
    'anclado_en', CASE WHEN v_pagado_el IS NOT NULL THEN 'pago_confirmado' ELSE 'periodo_previo' END);
END $function$

;

DO $c$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='cobrar_periodo_mensualidad_guarderia'
     AND pg_get_functiondef(p.oid) LIKE '%congelar_desglose_mensualidad_guarderia(v_s.id, v_desde)%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon M6: el congelado no quedo cableado'; END IF;
  /* Y que siga siendo UNA sola firma (L-119). */
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='cobrar_periodo_mensualidad_guarderia';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon M6: % sobrecargas', v_n; END IF;
  RAISE NOTICE 'cinturon M6: 2/2 OK (congelado cableado antes de comprometer · una sola firma)';
END $c$;

COMMIT;
