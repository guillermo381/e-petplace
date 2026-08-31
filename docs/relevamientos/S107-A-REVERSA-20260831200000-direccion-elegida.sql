/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260831200000_s107a_direccion_elegida.sql` — escrita ANTES.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 QUÉ NO DESHACE:

   1. **Revertir vuelve a fijar la dirección en «la principal»** — la familia
      pierde la elección y **las reservas ya creadas conservan la dirección que
      eligieron**: quedan citas apuntando a una dirección que la puerta nueva ya
      no sabría producir.

   2. **`guarderia_suscripciones.direccion_id` NO se borra acá** a propósito.
      Es el dato con el que el reloj sabe a dónde pasan a buscar; borrarlo
      dejaría mandatos vivos sin destino. Si de verdad hay que sacarlo, se
      decide aparte y con los mandatos a la vista.

   ⚠️ Las tres firmas CAMBIAN (ganan `p_direccion_id`) ⇒ esta reversa hace
   `DROP` explícito de las nuevas antes de recrear las viejas (L-119).
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DROP FUNCTION IF EXISTS public.reservar_dia_guarderia(uuid, uuid, date, uuid);
DROP FUNCTION IF EXISTS public.reservar_dia_de_paquete_guarderia(uuid, date, uuid, uuid);
DROP FUNCTION IF EXISTS public.contratar_mensualidad_guarderia(uuid, uuid, uuid, numeric, uuid);
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


  /* ═══ EL MISMO ANIMAL, EL MISMO DIA, UNA SOLA VEZ ════════════════════════
     🔴 Medido antes de curar: llamar dos veces con (bono, fecha, mascota)
     identicos devolvia `ok:true` LAS DOS, consumia DOS estadias del paquete y
     dejaba **dos reservas del mismo perro el mismo dia**. La pantalla cubre el
     doble-toque; **no cubre volver atras y tocar el mismo dia otra vez** — que
     es justo lo que hace quien no esta seguro de si entro.

     ⚠️ Y el censo lo agrando: el DIA SUELTO tambien pasaba sobre un dia ya
     tomado por paquete — y ese cobra aparte ⇒ *la familia pagaba dos veces por
     un dia que su perro solo puede vivir una vez.*

     🔴 POR (MASCOTA, FECHA), **JAMAS por (bono, fecha)**: el bono es DEL HOGAR
     y dos perros distintos el mismo dia es legitimo. Y sin prestador en la
     llave a proposito: un animal no puede estar en dos guarderias a la vez.

     El piso real es el indice unico parcial `uq_guarderia_una_por_mascota_dia`
     — este guard existe para que el rebote HABLE, porque *un guard que vive en
     un indice solo puede negarse* (L-424). Los dos juntos: el indice no se
     puede saltear, el guard explica. */
  IF EXISTS (
    SELECT 1 FROM evento_cita_servicio c
     WHERE c.mascota_id = p_mascota_id AND c.fecha = p_fecha
       AND c.tipo_servicio = 'guarderia_dia'
       AND c.estado NOT IN ('cancelada','rechazada','no_realizable')
  ) THEN
    RAISE EXCEPTION 'mascota_ya_reservada_ese_dia' USING ERRCODE='22023';
  END IF;

  v_gate := public._guarderia_puede_reservar(p_mascota_id);
  IF (v_gate->>'puede')::boolean IS NOT TRUE THEN
    /* El motivo YA viene normalizado por el gate — esta puerta lo levanta tal
       cual. *La traduccion que vivia aca era correcta y la de la puerta del
       paquete no: por eso la traduccion se mudo a la fuente.* */
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = v_gate->>'motivo';
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

CREATE OR REPLACE FUNCTION public.reservar_dia_de_paquete_guarderia(p_bono_id uuid, p_fecha date, p_mascota_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_familia uuid; v_b record; v_gate jsonb;
  v_cupo jsonb; v_evt uuid; v_cita uuid; v_est uuid; v_eje text;
  v_vis jsonb; v_country text; v_dir jsonb; v_saldo int; v_masc uuid; v_jornada int;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_familia FROM familia_miembro fm
   WHERE fm.user_id=v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_familia IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  /* 🔴 EL LUGAR SALE DEL BONO — la entrada no lo lleva. *Cuando la familia ya
     tiene saldo, el lugar está determinado por el paquete: pedirlo sería
     ofrecerle elegir algo que ya eligió, y abrir la puerta a que elija mal.* */
  SELECT b.* INTO v_b FROM bonos b
   WHERE b.id=p_bono_id AND b.familia_id=v_familia
     AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
   FOR UPDATE;
  IF v_b.id IS NULL THEN RAISE EXCEPTION 'sin_saldo_paquete' USING ERRCODE='22023'; END IF;
  IF v_b.unidades_usadas >= v_b.unidades_total THEN
    RAISE EXCEPTION 'sin_saldo_paquete' USING ERRCODE='22023';
  END IF;
  IF v_b.fecha_vencimiento IS NOT NULL AND v_b.fecha_vencimiento < p_fecha THEN
    RAISE EXCEPTION 'paquete_vencido' USING ERRCODE='22023';
  END IF;

  IF p_fecha < public.hoy_local() THEN RAISE EXCEPTION 'fecha_pasada' USING ERRCODE='22023'; END IF;
  IF p_fecha = public.hoy_local() THEN RAISE EXCEPTION 'reserva_mismo_dia' USING ERRCODE='22023'; END IF;

  /* La mascota: la que el bono tenga, o la única del hogar. Si hay varias y el
     bono no la fija, se rebota — **la casa no elige por la familia.** */
  /* ✏️ La mascota: la que pidan > la que el bono fije > la única elegible.
     **`p_prestador_id` sigue sin existir**: el lugar lo pone el bono. */
  v_masc := COALESCE(p_mascota_id, v_b.mascota_id);
  IF p_mascota_id IS NOT NULL THEN
    IF NOT public.user_tiene_acceso_a_mascota(p_mascota_id) THEN
      RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
    END IF;
    IF NOT public._mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
      RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE='22023';
    END IF;
  END IF;
  IF v_masc IS NULL THEN
    SELECT m.id INTO v_masc FROM mascotas m
     WHERE m.familia_id = v_familia AND m.estado_vida = 'activa'
       AND public._mascota_elegible_servicio(m.id, 'guarderia_dia')
     LIMIT 2;
    IF (SELECT count(*) FROM mascotas m WHERE m.familia_id=v_familia AND m.estado_vida='activa'
         AND public._mascota_elegible_servicio(m.id,'guarderia_dia')) <> 1 THEN
      RAISE EXCEPTION 'mascota_no_determinada' USING ERRCODE='22023';
    END IF;
  END IF;

  IF NOT public._guarderia_dia_operativo(v_b.prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'dia_no_operativo' USING ERRCODE='22023';
  END IF;

  -- las compuertas corren ENTERAS: tener saldo no saltea los requisitos.

  /* ═══ EL MISMO ANIMAL, EL MISMO DIA, UNA SOLA VEZ ════════════════════════
     🔴 Medido antes de curar: llamar dos veces con (bono, fecha, mascota)
     identicos devolvia `ok:true` LAS DOS, consumia DOS estadias del paquete y
     dejaba **dos reservas del mismo perro el mismo dia**. La pantalla cubre el
     doble-toque; **no cubre volver atras y tocar el mismo dia otra vez** — que
     es justo lo que hace quien no esta seguro de si entro.

     ⚠️ Y el censo lo agrando: el DIA SUELTO tambien pasaba sobre un dia ya
     tomado por paquete — y ese cobra aparte ⇒ *la familia pagaba dos veces por
     un dia que su perro solo puede vivir una vez.*

     🔴 POR (MASCOTA, FECHA), **JAMAS por (bono, fecha)**: el bono es DEL HOGAR
     y dos perros distintos el mismo dia es legitimo. Y sin prestador en la
     llave a proposito: un animal no puede estar en dos guarderias a la vez.

     El piso real es el indice unico parcial `uq_guarderia_una_por_mascota_dia`
     — este guard existe para que el rebote HABLE, porque *un guard que vive en
     un indice solo puede negarse* (L-424). Los dos juntos: el indice no se
     puede saltear, el guard explica. */
  IF EXISTS (
    SELECT 1 FROM evento_cita_servicio c
     WHERE c.mascota_id = v_masc AND c.fecha = p_fecha
       AND c.tipo_servicio = 'guarderia_dia'
       AND c.estado NOT IN ('cancelada','rechazada','no_realizable')
  ) THEN
    RAISE EXCEPTION 'mascota_ya_reservada_ese_dia' USING ERRCODE='22023';
  END IF;

  v_gate := public._guarderia_puede_reservar(v_masc);
  IF COALESCE(v_gate->>'puede','false') <> 'true' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE = COALESCE(v_gate->>'motivo','requisitos_sanitarios');
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('guarderia:'||v_b.prestador_id::text||':'||p_fecha::text, 0));
  v_cupo := public.cupo_guarderia_del_dia(v_b.prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN RAISE EXCEPTION 'sin_cupo' USING ERRCODE='22023'; END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id=v_masc;
  /* ✏️ LA JORNADA — `duracion_minutos` es NOT NULL en la cita (medido por el
     arnés, con un 23502). Se toma del servicio, igual que `reservar_dia_guarderia`. */
  SELECT ps.duracion_minutos INTO v_jornada
    FROM prestador_servicios ps
   WHERE ps.prestador_id = v_b.prestador_id AND ps.tipo_servicio = 'guarderia_dia' AND ps.activo;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_vis
    FROM cat_tipos_evento cte WHERE cte.codigo='cita_servicio';
  v_dir := public._direccion_hogar_snapshot(v_auth);   -- D-963

  INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
                               creado_por_user_id, datos, visibilidad, country_code)
  VALUES (v_masc, 'cita_servicio', v_eje, p_fecha::timestamptz, v_b.prestador_id, v_auth,
          jsonb_build_object('origen','reservar_dia_de_paquete_guarderia','bono_id',v_b.id),
          v_vis, COALESCE(v_country,'EC'))
  RETURNING id INTO v_evt;

  /* Cita FIRME y CUBIERTA — cuarto escritor del invariante 'pagada'.
     🔴 CERO COBRO: el desglose se congeló al comprar el paquete. */
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, country_code, bono_id,
    direccion_snapshot, metadata)
  VALUES (v_evt, v_auth, v_masc, v_b.prestador_id, 'guarderia_dia', p_fecha,
          v_b.precio_por_unidad, v_jornada, 'confirmada', 'pagada',
          COALESCE(v_country,'EC'), v_b.id, v_dir,
          jsonb_build_object('origen','paquete','pago_simulado',true,
                             'pagado_en', v_b.pago_metadata->>'pagado_en'))
  RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, estado) VALUES (v_cita,'reservada') RETURNING id INTO v_est;

  UPDATE bonos SET unidades_usadas = unidades_usadas + 1,
    estado = CASE WHEN unidades_usadas + 1 >= unidades_total THEN 'agotado' ELSE estado END,
    agotado_en = CASE WHEN unidades_usadas + 1 >= unidades_total THEN now() ELSE agotado_en END
   WHERE id = v_b.id;

  SELECT COALESCE(sum(b.unidades_total-b.unidades_usadas),0)::int INTO v_saldo
    FROM bonos b WHERE b.familia_id=v_familia AND b.prestador_id=v_b.prestador_id
     AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
     AND b.fecha_vencimiento >= public.hoy_local();

  RETURN jsonb_build_object('ok',true,'cita_id',v_cita,'estadia_id',v_est,
    'bono_id',v_b.id,'fecha',p_fecha,'saldo_restante',v_saldo);
END $function$
;

CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid; v_doc jsonb;
  v_tarj_estado text; v_exp_mes smallint; v_exp_anio smallint;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id=v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  /* ═══ LA MISMA COMPUERTA — y C no llego a ver esta puerta ════════════════
     La ficha llego por el comprador de paquete; el censo mostro que
     **son DOS las puertas sin gate**, y esta es la mas cara: no toma un pago,
     toma un MANDATO RECURRENTE. Hoy no cobra (`cobrada:false`), pero el dia
     que las tres claves de `app_config` enciendan el reloj, cobra sola todos
     los meses. *Un mandato que se firma sin condiciones aceptadas es peor que
     un cobro suelto: se repite.* */
  v_doc := public.evaluar_documentos_guarderia(v_fam);
  IF v_doc->>'estado' <> 'al_dia' THEN
    RAISE EXCEPTION USING ERRCODE='22023',
      MESSAGE = CASE v_doc->>'estado'
                  WHEN 'faltan' THEN 'documentos_sin_aceptar'
                  ELSE v_doc->>'estado' END;
  END IF;

  /* 🔴 LA TARJETA TIENE QUE SER DE QUIEN AUTORIZA. *Autorizar un cobro
     recurrente sobre la tarjeta de otro es exactamente lo que la raíz de
     autorización existe para impedir.* */
  SELECT t.user_id, t.estado, t.expira_mes, t.expira_anio
    INTO v_dueno, v_tarj_estado, v_exp_mes, v_exp_anio
    FROM tarjetas_guardadas t WHERE t.id = p_tarjeta_id;
  IF v_dueno IS NULL THEN RAISE EXCEPTION 'tarjeta_no_existe' USING ERRCODE='22023'; END IF;
  IF v_dueno <> v_auth THEN RAISE EXCEPTION 'tarjeta_de_otra_persona' USING ERRCODE='42501'; END IF;

  /* ═══ LAS DOS DISTINCIONES QUE NO NECESITAN AL PROVEEDOR ═════════════════
     🟢 Firma de mesa (31-ago): *«no inventes distinciones que el proveedor no
     te da»*. Medido — de las tres que la pantalla quería, **dos son NUESTRAS y
     una no existe**:

     · **VENCIDA** → `expira_mes`/`expira_anio` viven en NUESTRA tabla y están
       poblados. **No hace falta preguntarle a nadie.** Era hueco propio.
     · **NO GUARDADA** → el `estado` es `guardada|rechazada|abandonada`, y esta
       puerta **no lo miraba**: se podía firmar un mandato recurrente sobre una
       tarjeta `rechazada`. *Hueco propio también.*
     · «no verificada» **NO EXISTE** — no es un estado de la tabla ni del
       proveedor: una `guardada` ya pasó el alta 3DS. **Se dice que no existe
       en vez de inventarla.**

     🔒 Y la que SÍ es del proveedor —**por qué** rechazó— sigue bloqueada por
     `D-867`: la causa viaja en el crudo (`err.type`, `status_detail`) y se
     aplana a prosa en `motivo_rechazo`. **Tiparla exige la tabla de códigos de
     Erick; mapear `31` por parecido sería el defecto que ese censo vino a
     medir.** */
  IF v_tarj_estado <> 'guardada' THEN
    RAISE EXCEPTION 'tarjeta_no_guardada: %', v_tarj_estado USING ERRCODE='22023';
  END IF;
  IF v_exp_anio IS NOT NULL AND v_exp_mes IS NOT NULL
     AND make_date(v_exp_anio, v_exp_mes, 1) + interval '1 month' <= date_trunc('day', now())
  THEN
    RAISE EXCEPTION 'tarjeta_vencida' USING ERRCODE='22023';
  END IF;

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
