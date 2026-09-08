-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · A6 (2/2) · F10 · DEVENGO DE GUARDERÍA Y DESPENSA
--
-- GUARDERÍA — el evento nace al ACTO `entregada` (LETRA_POSTVENTA §8), anclado
-- en la ESTADÍA (no en su cita — la enmienda ② del founder: §6 le pregunta al
-- objeto, y con el ancla ambigua la pregunta tiene dos respuestas). Tres ramas,
-- medidas contra el objeto:
--   · día suelto  → cita.precio (medido: 12.00)          ← 1 estadía entregada viva
--   · paquete     → cita.precio, el precio unitario del día (medido: 8.00)
--   · mensualidad → precio_mensual / días del período     ← 🔴 CERO estadías vivas
--
-- 🔴 LA MENSUALIDAD SE CONSTRUYE PERO NO SE PUEDE EJERCER HOY: no hay una sola
--    estadía de mensualidad en la base. La rama existe (precio_mensual /
--    días_período, «por día ejecutado» de la letra), pero **su cinturón sale
--    NO CONCLUYENTE, no verde** — no calibro un reparto de plata contra datos
--    que no existen (R5). Se declara para que E la mida cuando haya un caso.
--
-- DESPENSA — el evento nace en el CUARTO ESCALÓN (`entregado`), por trigger
-- sobre pedido_estados, anclado en el pedido. Monto = pedidos.total.
--
-- Todos idempotentes (variante b, sólo lo pagado). El chasis es crear_evento_economico.
--
-- VEDA 76(g): NO RIGE. REVERSA escrita ANTES (repone dos huecos de plata).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── DEVENGO DE ESTADÍA ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._devengar_estadia(p_estadia_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_e record; v_c record; v_cuenta record; v_monto numeric(14,2);
  v_sus record; v_dias int; v_via text; v_ev uuid;
BEGIN
  SELECT * INTO v_e FROM guarderia_estadias WHERE id = p_estadia_id;
  IF NOT FOUND OR v_e.estado <> 'entregada' THEN RETURN NULL; END IF;

  SELECT c.id, c.precio, c.estado_reserva, c.prestador_id, c.country_code,
         c.metadata, c.suscripcion_servicio_id, c.bono_id
    INTO v_c FROM evento_cita_servicio c WHERE c.id = v_e.cita_id;
  IF v_c.id IS NULL THEN RETURN NULL; END IF;
  IF v_c.estado_reserva IS DISTINCT FROM 'pagada' THEN RETURN NULL; END IF;

  -- idempotente, anclado en la ESTADÍA
  IF EXISTS (SELECT 1 FROM eventos_economicos ee
             WHERE ee.origen_tipo='estadia' AND ee.origen_id=p_estadia_id
               AND ee.tipo_evento='cita_pagada') THEN
    RETURN NULL;
  END IF;

  IF v_c.suscripcion_servicio_id IS NOT NULL THEN
    -- MENSUALIDAD · por día ejecutado: precio_mensual / días del período
    SELECT precio_mensual, periodo_desde, periodo_hasta INTO v_sus
      FROM guarderia_suscripciones WHERE id = v_c.suscripcion_servicio_id;
    IF v_sus.precio_mensual IS NULL THEN RETURN NULL; END IF;
    v_dias := GREATEST((v_sus.periodo_hasta - v_sus.periodo_desde), 1);
    v_monto := ROUND(v_sus.precio_mensual / v_dias, 2);
    v_via := 'guarderia_mensualidad_dia';
  ELSE
    -- DÍA SUELTO o PAQUETE · el precio unitario del día vive en cita.precio
    v_monto := v_c.precio;
    v_via := CASE WHEN v_c.bono_id IS NOT NULL THEN 'guarderia_paquete' ELSE 'guarderia_dia' END;
  END IF;

  IF v_monto IS NULL OR v_monto < 0 THEN
    RAISE EXCEPTION 'estadia_sin_precio' USING ERRCODE='22023';
  END IF;
  -- un día de precio 0 (cortesía) no crea evento: no hay plata que devengar.
  IF v_monto = 0 THEN RETURN NULL; END IF;

  SELECT cc.id, cc.moneda INTO v_cuenta
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = v_c.prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE='22023';
  END IF;

  v_ev := crear_evento_economico(
    p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_cuenta_comercial_id => v_cuenta.id,
    p_country_code        => v_c.country_code,
    p_moneda              => v_cuenta.moneda,
    p_monto_bruto         => v_monto,
    p_monto_kushki_fee    => 0,
    p_origen_tipo         => 'estadia',
    p_origen_id           => p_estadia_id,
    p_fecha_devengo       => now(),
    p_fecha_cobro_kushki  => (v_c.metadata ->> 'pagado_en')::timestamptz,
    p_metadata            => jsonb_build_object('pago_simulado', true, 'via', v_via));
  RETURN v_ev;
END $fn$;

COMMENT ON FUNCTION public._devengar_estadia(uuid) IS
  'S114 · A6 · devengo de guardería al ENTREGAR, anclado en la ESTADÍA (§8 '
  'enmienda ②). día/paquete → cita.precio · mensualidad → precio_mensual/días. '
  'Idempotente. La rama mensualidad no tiene caso vivo aún.';
REVOKE ALL ON FUNCTION public._devengar_estadia(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._devengar_estadia(uuid) TO authenticated;

-- ── DEVENGO DE DESPENSA (cuarto escalón) ───────────────────────────────────
CREATE OR REPLACE FUNCTION public._devengar_pedido(p_pedido_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_p record; v_cuenta record; v_ev uuid;
BEGIN
  SELECT id, total, moneda, country_code, cuenta_comercial_id, estado
    INTO v_p FROM pedidos WHERE id = p_pedido_id;
  IF NOT FOUND OR v_p.estado <> 'entregado' THEN RETURN NULL; END IF;

  IF EXISTS (SELECT 1 FROM eventos_economicos ee
             WHERE ee.origen_tipo='pedido' AND ee.origen_id=p_pedido_id
               AND ee.tipo_evento='cita_pagada') THEN
    RETURN NULL;
  END IF;
  IF v_p.total IS NULL OR v_p.total <= 0 THEN RETURN NULL; END IF;
  IF v_p.cuenta_comercial_id IS NULL THEN
    RAISE EXCEPTION 'pedido_sin_cuenta_comercial' USING ERRCODE='22023';
  END IF;
  SELECT moneda INTO v_cuenta FROM cuentas_comerciales WHERE id = v_p.cuenta_comercial_id;

  v_ev := crear_evento_economico(
    p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_cuenta_comercial_id => v_p.cuenta_comercial_id,
    p_country_code        => v_p.country_code,
    p_moneda              => COALESCE(v_cuenta.moneda, v_p.moneda),
    p_monto_bruto         => v_p.total,
    p_monto_kushki_fee    => 0,
    p_origen_tipo         => 'pedido',
    p_origen_id           => p_pedido_id,
    p_fecha_devengo       => now(),
    p_fecha_cobro_kushki  => NULL,
    p_metadata            => jsonb_build_object('pago_simulado', true, 'via', 'despensa_entregado'));
  RETURN v_ev;
END $fn$;
REVOKE ALL ON FUNCTION public._devengar_pedido(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._devengar_pedido(uuid) TO authenticated;

-- el trigger del cuarto escalón
CREATE OR REPLACE FUNCTION public._trg_pedido_devenga()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  IF NEW.estado_codigo = 'entregado' THEN
    PERFORM _devengar_pedido(NEW.pedido_id);
  END IF;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_pedido_devenga_al_entregar ON public.pedido_estados;
CREATE TRIGGER trg_pedido_devenga_al_entregar
  AFTER INSERT ON public.pedido_estados
  FOR EACH ROW EXECUTE FUNCTION public._trg_pedido_devenga();

-- ── _guarderia_aplicar_acto, con el devengo al entregar ──
CREATE OR REPLACE FUNCTION public._guarderia_aplicar_acto(p_estadia_id uuid, p_acto text, p_ocurrido_en timestamp with time zone, p_motivo text DEFAULT NULL::text, p_detalle text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE t record; v_estado text; v_prev record; v_user uuid; v_masc uuid;
BEGIN
  SELECT * INTO t FROM cat_guarderia_transiciones WHERE acto = p_acto;
  IF t IS NULL THEN RAISE EXCEPTION 'acto_invalido' USING ERRCODE='22023'; END IF;
  IF p_ocurrido_en IS NULL THEN
    RAISE EXCEPTION 'falta_hora_de_la_puerta' USING ERRCODE='22023';
  END IF;
  IF p_ocurrido_en > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'hora_de_la_puerta_en_el_futuro' USING ERRCODE='22023';
  END IF;

  SELECT estado INTO v_estado FROM guarderia_estadias WHERE id = p_estadia_id FOR UPDATE;
  IF v_estado IS NULL THEN RAISE EXCEPTION 'estadia_no_existe' USING ERRCODE='22023'; END IF;

  /* IDEMPOTENCIA POR (ESTADÍA, ACTO): devuelve el original y NO escribe nada —
     tampoco un segundo aviso. */
  SELECT * INTO v_prev FROM guarderia_estadia_actos
   WHERE estadia_id = p_estadia_id AND acto = p_acto;
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'movida', false, 'ya_estaba', true,
      'estado', v_estado, 'ocurrido_en', v_prev.ocurrido_en,
      'registrado_en', v_prev.registrado_en);
  END IF;

  IF v_estado <> t.desde THEN
    IF v_estado = 'cancelada' THEN
      RAISE EXCEPTION 'estadia_cancelada' USING ERRCODE='22023';
    END IF;
    IF EXISTS (SELECT 1 FROM cat_guarderia_estados WHERE estado = v_estado AND es_terminal) THEN
      RAISE EXCEPTION 'estadia_en_estado_final: %', v_estado USING ERRCODE='22023';
    END IF;
    RAISE EXCEPTION 'transicion_ilegal: % (esperaba %, acto %)', v_estado, t.desde, p_acto
      USING ERRCODE='22023';
  END IF;

  IF t.exige_tramo IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM guarderia_estadias e JOIN guarderia_tramos tr
        ON tr.id = CASE t.exige_tramo WHEN 'recogida' THEN e.tramo_recogida_id
                                      ELSE e.tramo_devolucion_id END
       WHERE e.id = p_estadia_id AND tr.estado = 'abierto')
    THEN
      RAISE EXCEPTION 'sin_tramo_abierto: no hay tramo de % abierto para esta estadia', t.exige_tramo
        USING ERRCODE='22023';
    END IF;
  END IF;

  IF p_acto = 'no_recogida' THEN
    EXECUTE format('UPDATE guarderia_estadias SET estado = $1, %I = $2, '
                   'no_recogida_motivo = $4, no_recogida_detalle = $5, '
                   'updated_at = now() WHERE id = $3', t.columna_ts)
      USING t.hasta, p_ocurrido_en, p_estadia_id, p_motivo, p_detalle;
  ELSE
    EXECUTE format('UPDATE guarderia_estadias SET estado = $1, %I = $2, updated_at = now() WHERE id = $3',
                   t.columna_ts) USING t.hasta, p_ocurrido_en, p_estadia_id;
  END IF;

  INSERT INTO guarderia_estadia_actos (estadia_id, acto, ocurrido_en, actor_user_id)
       VALUES (p_estadia_id, p_acto, p_ocurrido_en, auth.uid())
    RETURNING * INTO v_prev;

  /* ══ S111-A · EL AVISO — décimo hallazgo del gate ═══════════════════════
     🔴 Va DESPUÉS de la escritura y del renglón de auditoría, a propósito: si
     algo de arriba rebota, **no sale un aviso sobre un acto que no ocurrió**.
     Y va DENTRO del brazo que movió: el reintento retorna antes y **no vuelve a
     avisar**. */
  IF t.tipo_notificacion IS NOT NULL THEN
    SELECT c.user_id, c.mascota_id INTO v_user, v_masc
      FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
     WHERE g.id = p_estadia_id;
    IF v_user IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => t.tipo_notificacion,
        p_destinatario_user_id => v_user,
        p_mascota_id           => v_masc,
        p_datos                => jsonb_build_object(
                                    'estadiaId', p_estadia_id,
                                    'acto', p_acto,
                                    /* la hora de la PUERTA, que es la que se muestra */
                                    'ocurridoEn', p_ocurrido_en,
                                    /* 🔴 EL DESTINO DEL TOQUE — mi mitad. Medido: HOY NINGUNA de
                                       las dos apps escucha el toque de una push (cero
                                       `addNotificationResponseReceivedListener` en todo el repo,
                                       con control positivo y negativo). El despachador ya manda
                                       `intencion_id` y `tipo` en el `data` de FCM y **nadie los
                                       lee** — L-460 exacta: un dato aceptado e ignorado se lee
                                       como cableado. Se deja la ruta AQUI para que el dia que la
                                       app monte su listener no haya que tocar el motor. */
                                    'ruta', '/guarderia/' || p_estadia_id)
                                  || _voz_notificacion(t.tipo_notificacion, v_user, v_masc, '{}'::jsonb),
        /* La clave es (estadía, acto): el acto ya es idempotente, así que el
           aviso también. *La idempotencia sale de la clave, no de una columna.* */
        p_clave_dedup          => 'guarderia-acto:' || p_estadia_id || ':' || p_acto);
    END IF;
  END IF;

  -- S114-A6 · al ENTREGAR, la estadía devenga (día/paquete/mensualidad).
  IF t.hasta = 'entregada' THEN PERFORM _devengar_estadia(p_estadia_id); END IF;

  RETURN jsonb_build_object('ok', true, 'movida', true, 'ya_estaba', false,
    'estado', t.hasta, 'ocurrido_en', v_prev.ocurrido_en,
    'registrado_en', v_prev.registrado_en);
END $function$
;


-- ── EL FEE_CONFIG DE GUARDERÍA — clonado de servicios, NO inventado ────────
-- `crear_evento_economico` exige un fee_config que matchee (cuenta/actor/país/
-- stream/ORIGEN). Existe uno para origen=cita y otro para origen=pedido, pero
-- NINGUNO para origen=estadia ⇒ toda guardería rebotaba «No se encontró
-- fee_config aplicable».
--
-- 🔴 Guardería ES `prestador_servicios` (un servicio del prestador), así que
-- su tarifa NO es una decisión nueva: es LA MISMA de cita. No invento un
-- número (la lección de la adenda 5) — clono la historia completa de servicios
-- con su origen: 15% hasta el 25-ago, 10% desde entonces. `MODELO_FINANCIERO`
-- §3.1 lo respalda: «cualquier modelo de fee cabe en esta ecuación», y el fee
-- de servicios es uno solo por actor.
INSERT INTO fee_configs (tipo_actor, country_code, revenue_stream, tipo_origen,
    tipo_calculo, parametros, absorbe_descuento_default, prioridad, vigencia_desde, vigencia_hasta, activo, notas)
SELECT tipo_actor, country_code, revenue_stream, 'estadia',
    tipo_calculo, parametros, absorbe_descuento_default, prioridad, vigencia_desde, vigencia_hasta, activo,
    'S114-A · clon del fee de servicios (origen=cita) para guardería. Misma tarifa, distinto origen.'
FROM fee_configs
WHERE tipo_actor='prestador_servicios' AND revenue_stream='transaccional'
  AND tipo_origen='cita' AND country_code='EC'
  AND NOT EXISTS (SELECT 1 FROM fee_configs f2 WHERE f2.tipo_actor='prestador_servicios'
                  AND f2.revenue_stream='transaccional' AND f2.tipo_origen='estadia'
                  AND f2.country_code='EC' AND f2.vigencia_desde = fee_configs.vigencia_desde);

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE
  v_est uuid; v_pre numeric; v_ev uuid; v_ped uuid; v_tot numeric;
  v_mens int;
BEGIN
  -- GUARDERÍA día/paquete: una estadía ENTREGADA sin evento, con precio.
  SELECT e.id, c.precio INTO v_est, v_pre
    FROM guarderia_estadias e JOIN evento_cita_servicio c ON c.id=e.cita_id
    JOIN prestadores pr ON pr.id=c.prestador_id JOIN cuentas_comerciales cc ON cc.id=pr.cuenta_comercial_id
   WHERE e.estado='entregada' AND c.estado_reserva='pagada' AND c.precio>0
     AND c.suscripcion_servicio_id IS NULL
     AND NOT EXISTS (SELECT 1 FROM eventos_economicos ee WHERE ee.origen_tipo='estadia' AND ee.origen_id=e.id)
   LIMIT 1;
  IF v_est IS NOT NULL THEN
    v_ev := _devengar_estadia(v_est);
    IF v_ev IS NULL THEN RAISE EXCEPTION 'CINTURÓN: no devengó la estadía entregada'; END IF;
    IF (SELECT monto_bruto FROM eventos_economicos WHERE id=v_ev) <> v_pre THEN
      RAISE EXCEPTION 'CINTURÓN: monto de estadía <> precio de la cita';
    END IF;
    IF _devengar_estadia(v_est) IS NOT NULL THEN RAISE EXCEPTION 'CINTURÓN: estadía duplicó'; END IF;
    IF (SELECT origen_tipo FROM eventos_economicos WHERE id=v_ev) <> 'estadia' THEN
      RAISE EXCEPTION 'CINTURÓN: el evento de guardería NO ancló en la estadía';
    END IF;
    DELETE FROM eventos_economicos WHERE id=v_ev;
    RAISE NOTICE 'CINTURÓN · guardería día/paquete: devenga · ancla estadía · idempotente · monto=precio · residuo 0';
  ELSE
    RAISE NOTICE '⚠️ guardería día/paquete NO CONCLUYENTE · sin estadía entregada sin evento para probar';
  END IF;

  -- MENSUALIDAD: honesto — no hay caso vivo
  SELECT count(*) INTO v_mens FROM guarderia_estadias e JOIN evento_cita_servicio c ON c.id=e.cita_id
   WHERE c.suscripcion_servicio_id IS NOT NULL;
  IF v_mens = 0 THEN
    RAISE NOTICE '⚠️ mensualidad NO CONCLUYENTE · CERO estadías de mensualidad en la base — '
                 'la rama existe (precio_mensual/días) y no se calibra contra datos que no existen (R5)';
  END IF;

  -- DESPENSA: un pedido ENTREGADO sin evento
  SELECT id, total INTO v_ped, v_tot FROM pedidos
   WHERE estado='entregado' AND total>0 AND cuenta_comercial_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM eventos_economicos ee WHERE ee.origen_tipo='pedido' AND ee.origen_id=pedidos.id)
   LIMIT 1;
  IF v_ped IS NOT NULL THEN
    v_ev := _devengar_pedido(v_ped);
    IF v_ev IS NULL THEN RAISE EXCEPTION 'CINTURÓN: no devengó el pedido entregado'; END IF;
    IF (SELECT monto_bruto FROM eventos_economicos WHERE id=v_ev) <> v_tot THEN
      RAISE EXCEPTION 'CINTURÓN: monto de pedido <> total';
    END IF;
    IF _devengar_pedido(v_ped) IS NOT NULL THEN RAISE EXCEPTION 'CINTURÓN: pedido duplicó'; END IF;
    DELETE FROM eventos_economicos WHERE id=v_ev;
    RAISE NOTICE 'CINTURÓN · despensa: devenga al entregar · ancla pedido · idempotente · monto=total · residuo 0';
  ELSE
    RAISE NOTICE '⚠️ despensa NO CONCLUYENTE · sin pedido entregado sin evento para probar';
  END IF;

  RAISE NOTICE 'CINTURÓN A6(2/2) COMPLETO';
END $cinturon$;
