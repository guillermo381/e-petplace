/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260831020000_s107a_gate_en_las_cuatro_puertas.sql`
   Escrita ANTES de aplicar. Restaura los CUATRO cuerpos tal como estaban.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:

   Revertir vuelve a dejar **el comprador de paquete y el contratador de
   mensualidad SIN COMPUERTA DE DOCUMENTOS** — o sea, vuelve a habilitar
   cobrarle el paquete entero a una familia que no aceptó las condiciones,
   para frenarla después, con la plata ya tomada.

   Y **no devuelve la plata**: los bonos y las suscripciones que se hayan
   creado entre la migración y su reversa quedan donde están. Al cierre de
   S107-A eso es CERO —medido: `bonos(guarderia_dia)=0`,
   `guarderia_suscripciones=0`— pero el día que no lo sea, revertir es una
   decisión de plata, no de código.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;

/* ── _guarderia_puede_reservar ── */
CREATE OR REPLACE FUNCTION public._guarderia_puede_reservar(p_mascota_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_san jsonb; v_doc jsonb; v_familia uuid; v_duro boolean;
BEGIN
  SELECT COALESCE((SELECT valor::boolean FROM app_config
                    WHERE clave = 'guarderia_gate_sanitario_duro'), false)
    INTO v_duro;

  v_san := public.evaluar_requisitos_guarderia(p_mascota_id);
  /* 🔴 SÓLO FRENA SI EL FLAG ESTÁ ENCENDIDO. Con el flag apagado el resultado
     **igual viaja** —en `sanitario`— para que el semáforo diga la verdad
     completa: *informar no es lo mismo que callar.* */
  IF v_duro AND v_san->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'requisitos_sanitarios',
                              'faltantes', v_san->'faltantes');
  END IF;

  SELECT m.familia_id INTO v_familia FROM mascotas m WHERE m.id = p_mascota_id;
  v_doc := public.evaluar_documentos_guarderia(v_familia);
  IF v_doc->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', v_doc->>'estado',
                              'faltantes', v_doc->'faltantes', 'sanitario', v_san);
  END IF;

  RETURN jsonb_build_object('puede', true, 'sanitario', v_san,
                            'gate_sanitario_duro', v_duro);
END $function$
;

/* ── reservar_dia_guarderia ── */
CREATE OR REPLACE FUNCTION public.reservar_dia_guarderia(p_prestador_id uuid, p_mascota_id uuid, p_fecha date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ps record; v_gate jsonb; v_cupo jsonb;
  v_cita uuid; v_estadia uuid; v_espacio uuid;
  v_user uuid := auth.uid(); v_direccion jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF p_fecha < public.hoy_local() THEN RAISE EXCEPTION 'fecha_pasada' USING ERRCODE = '22023'; END IF;
  IF p_fecha = public.hoy_local() THEN RAISE EXCEPTION 'reserva_mismo_dia' USING ERRCODE = '22023'; END IF;
  IF NOT public._guarderia_dia_operativo(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'dia_no_operativo' USING ERRCODE = '22023';
  END IF;

  v_gate := public._guarderia_puede_reservar(p_mascota_id);
  IF (v_gate->>'puede')::boolean IS NOT TRUE THEN
    /* El motivo viaja tal cual: `requisitos_sanitarios` · `faltan`
       (documentos sin aceptar) · `documentos_no_disponibles`. */
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = CASE v_gate->>'motivo'
                  WHEN 'requisitos_sanitarios' THEN 'requisitos_sanitarios'
                  WHEN 'documentos_no_disponibles' THEN 'documentos_no_disponibles'
                  ELSE 'documentos_sin_aceptar' END;
  END IF;

  SELECT ps.id, ps.precio, ps.duracion_minutos, pr.country_code INTO v_ps
    FROM prestador_servicios ps JOIN prestadores pr ON pr.id = ps.prestador_id
   WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable;
  IF v_ps.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE = '22023'; END IF;
  IF v_ps.precio IS NULL THEN
    -- el día suelto puede no ofrecerse (firma 29-ago): entonces no se reserva por día
    RAISE EXCEPTION 'no_ofrece_dia_suelto' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_prestador_id::text || p_fecha::text));
  v_cupo := public.cupo_guarderia_del_dia(p_prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN RAISE EXCEPTION 'sin_cupo' USING ERRCODE = '22023'; END IF;

  SELECT e.id INTO v_espacio FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo ORDER BY e.created_at LIMIT 1;
  v_direccion := _direccion_hogar_snapshot(v_user);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, expira_en, modalidad,
    direccion_snapshot, country_code
  ) VALUES (
    v_user, p_mascota_id, p_prestador_id, 'guarderia_dia', p_fecha, v_ps.precio,
    v_ps.duracion_minutos, 'pendiente', 'pendiente_pago',
    now() + interval '15 minutes', 'presencial', v_direccion,
    COALESCE(v_ps.country_code, 'EC')
  ) RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, espacio_id)
    VALUES (v_cita, v_espacio) RETURNING id INTO v_estadia;

  RETURN jsonb_build_object('ok', true, 'cita_id', v_cita, 'estadia_id', v_estadia,
                            'precio', v_ps.precio, 'expira_en', now() + interval '15 minutes');
END $function$
;

/* ── comprar_paquete_guarderia ── */
CREATE OR REPLACE FUNCTION public.comprar_paquete_guarderia(p_prestador_id uuid, p_tamano integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_familia uuid; v_country text;
  v_serv record; v_paq record; v_cuenta record; v_fee uuid;
  v_hoy date := public.hoy_local(); v_vence date;
  v_total numeric(14,2); v_bono uuid; v_roll record;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_familia FROM familia_miembro fm
   WHERE fm.user_id = v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_familia IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id=p_prestador_id AND pr.estado='activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE='22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio INTO v_serv
    FROM prestador_servicios ps
   WHERE ps.prestador_id=p_prestador_id AND ps.tipo_servicio='guarderia_dia' AND ps.activo;
  IF v_serv.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE='22023'; END IF;

  /* 🔴 EL TAMAÑO SE VALIDA CONTRA LA TABLA, no contra un `IN (5,10,15)`: los
     presets son DATO del prestador. Un hardcode acá le impediría ofrecer 20 el
     día que la mesa lo firme, y nadie sabría por qué. */
  SELECT gp.tamano, gp.precio INTO v_paq
    FROM guarderia_paquetes gp
   WHERE gp.prestador_id=p_prestador_id AND gp.tamano=p_tamano AND gp.activo;
  IF v_paq.tamano IS NULL THEN RAISE EXCEPTION 'paquete_no_disponible' USING ERRCODE='22023'; END IF;
  IF v_paq.precio IS NULL OR v_paq.precio <= 0 THEN
    RAISE EXCEPTION 'paquete_no_disponible' USING ERRCODE='22023';
  END IF;

  -- PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón S54).
  SELECT cc.id, cc.estado INTO v_cuenta
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id=pr.cuenta_comercial_id
   WHERE pr.id=p_prestador_id;
  IF v_cuenta.id IS NULL THEN RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE='22023'; END IF;
  IF v_cuenta.estado <> 'activa' THEN RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cuenta_roles cr
                  WHERE cr.cuenta_comercial_id=v_cuenta.id
                    AND cr.tipo_actor='prestador_servicios' AND cr.estado='activo') THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE='22023';
  END IF;
  SELECT COALESCE(f.country_code, pr.country_code, 'EC') INTO v_country
    FROM familia f, prestadores pr WHERE f.id=v_familia AND pr.id=p_prestador_id;
  SELECT rfa.fee_config_id INTO v_fee FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum, v_country,
    'transaccional'::revenue_stream_enum, 'cita', NULL, now()) rfa;
  IF v_fee IS NULL THEN RAISE EXCEPTION 'sin_fee_config' USING ERRCODE='22023'; END IF;

  v_vence := (v_hoy + interval '1 month')::date;
  v_total := round(v_paq.precio, 2);   -- el precio del paquete es TOTAL, no unitario

  -- ROLLOVER (P16e), por HOGAR: lock primero, conteo después.
  PERFORM 1 FROM bonos b
   WHERE b.familia_id=v_familia AND b.prestador_id=p_prestador_id
     AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
     AND b.unidades_usadas < b.unidades_total AND b.fecha_vencimiento >= v_hoy
   FOR UPDATE;
  SELECT count(*)::int AS bonos, COALESCE(sum(unidades_total-unidades_usadas),0)::int AS dias
    INTO v_roll FROM bonos b
   WHERE b.familia_id=v_familia AND b.prestador_id=p_prestador_id
     AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
     AND b.unidades_usadas < b.unidades_total AND b.fecha_vencimiento >= v_hoy;

  INSERT INTO bonos (
    prestador_id, user_id, familia_id, mascota_id, tipo_servicio, descripcion,
    unidades_total, unidades_usadas, duracion_minutos,
    precio_total, precio_por_unidad, fecha_compra, fecha_vencimiento,
    estado, estado_pago, country_code, prestador_servicio_id, pago_metadata
  ) VALUES (
    p_prestador_id, v_auth, v_familia, NULL, 'guarderia_dia',
    'Paquete de ' || p_tamano || ' días de guardería (vigencia mensual, del hogar)',
    p_tamano, 0,
    /* 🔴 `duracion_minutos` NULL a propósito: **una estadía no dura minutos, dura
       un DÍA.** Poner la jornada acá lo haría parecer un slot de agenda. */
    NULL,
    v_total, round(v_paq.precio / p_tamano, 2),
    v_hoy, v_vence, 'activo', 'pagado',
    v_country, v_serv.id,
    jsonb_build_object('pagado_en', now(), 'pago_simulado', true,
                       'dias_rollover', v_roll.dias)
  ) RETURNING id INTO v_bono;

  IF v_roll.bonos > 0 THEN
    UPDATE bonos b SET fecha_vencimiento = v_vence,
      pago_metadata = b.pago_metadata || jsonb_build_object('rollover_extendido_por', v_bono, 'rollover_en', now())
     WHERE b.familia_id=v_familia AND b.prestador_id=p_prestador_id
       AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
       AND b.unidades_usadas < b.unidades_total AND b.id <> v_bono;
  END IF;

  RETURN jsonb_build_object('ok', true, 'bono_id', v_bono, 'dias', p_tamano,
    'total', v_total, 'por_dia', round(v_paq.precio / p_tamano, 2),
    'vence_el', v_vence, 'dias_rollover', v_roll.dias,
    'saldo_total', p_tamano + v_roll.dias, 'pagado_en', now());
END $function$
;

/* ── contratar_mensualidad_guarderia ── */
CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id=v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  /* 🔴 LA TARJETA TIENE QUE SER DE QUIEN AUTORIZA. *Autorizar un cobro
     recurrente sobre la tarjeta de otro es exactamente lo que la raíz de
     autorización existe para impedir.* */
  SELECT t.user_id INTO v_dueno FROM tarjetas_guardadas t WHERE t.id = p_tarjeta_id;
  IF v_dueno IS NULL THEN RAISE EXCEPTION 'tarjeta_no_existe' USING ERRCODE='22023'; END IF;
  IF v_dueno <> v_auth THEN RAISE EXCEPTION 'tarjeta_de_otra_persona' USING ERRCODE='42501'; END IF;

  SELECT ps.id, ps.precio_mensual_plan INTO v_serv
    FROM prestador_servicios ps
   WHERE ps.prestador_id=p_prestador_id AND ps.tipo_servicio='guarderia_dia' AND ps.activo;
  IF v_serv.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE='22023'; END IF;
  IF v_serv.precio_mensual_plan IS NULL OR v_serv.precio_mensual_plan <= 0 THEN
    RAISE EXCEPTION 'no_ofrece_mensualidad' USING ERRCODE='22023';
  END IF;

  INSERT INTO guarderia_suscripciones (
    familia_id, prestador_id, prestador_servicio_id, mascota_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual)
  VALUES (v_fam, p_prestador_id, v_serv.id, p_mascota_id,
          p_tarjeta_id, v_auth,
          /* El techo del mandato: lo que se pida, o el precio de hoy. */
          COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
          v_serv.precio_mensual_plan)
  RETURNING id INTO v_id;

  /* ⚠️ CERO COBRO Y CERO CUPO: el motor de cobro y los días del plan **no
     existen todavía** (decisión de mesa abierta). Esto registra el MANDATO. */
  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_id,
    'precio_mensual', v_serv.precio_mensual_plan,
    'monto_esperado', COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
    'cobrada', false,
    'nota', 'mandato registrado — el cobro espera la firma de los dias del plan');
END $function$
;

COMMIT;
