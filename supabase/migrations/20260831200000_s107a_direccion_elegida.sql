/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA DIRECCIÓN DE RECOGIDA LA ELIGE LA FAMILIA
   ═══════════════════════════════════════════════════════════════════════════
   Hallazgo de C, con la firma medida: **las dos puertas de reserva NO recibían
   dirección.** Llamaban a `_direccion_hogar_snapshot(user)` por su cuenta —una
   función que toma el USUARIO, no una dirección elegida— y escribían siempre
   **la principal**.

   🟢 Firma del founder (31-ago): la familia elige a qué dirección pasan a
   buscar a su animal. Las tres puertas **reciben** `p_direccion_id` y **la
   validan** contra las de quien reserva.

   🔴 **JAMÁS se confía en lo que manda la pantalla.** Se recibe un ID y el
   snapshot se arma **del lado del server**. *Aceptar el snapshot ya armado por
   el cliente sería dejar que la pantalla escriba a dónde va el animal.*

   ⚠️ **EL CRITERIO DE «DE QUIÉN SON» SALE DE LA RLS VIVA, no de una decisión
   mía:** `dir_own` dice `user_id = auth.uid()`. Y de ahí sale una nota que hay
   que declarar en vez de resolver: **las direcciones son de la PERSONA, no del
   hogar** — el modelo no tiene direcciones de familia. Validar contra las de
   todos los miembros **ENSANCHARÍA** la audiencia (le mostraría a uno la
   dirección que guardó otro) y **es decisión de producto, no de motor**.

   ── ③ EL MANDATO, y su porqué ─────────────────────────────────────────────
   🟢 Firma del founder: **las citas del plan las crea el RELOJ, sin nadie
   presente** ⇒ la dirección va en el MANDATO, igual que el medio de pago.
   *El reloj no puede preguntarle a nadie a dónde pasar a buscar.*

   🔴 **Se resuelve AL FIRMAR, jamás al cobrar.** Si viene NULL se guarda la
   principal **de ese momento** — no se deja NULL para que el reloj resuelva
   después: *eso volvería la dirección un dato de la sesión del reloj, y la
   familia habría autorizado una dirección que puede haber cambiado.*
   ⇒ Cambiarla después afecta **las citas futuras del plan, no las ya creadas**,
   y eso sale solo de este diseño.

   ⚖️ VEDA 76(g): **NO RIGE** — una columna nueva sobre una tabla de 0 filas.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831200000-direccion-elegida.sql`

   ⚠️ Las tres firmas cambian ⇒ **DROP explícito antes** (L-119: un
   `CREATE OR REPLACE` con firma distinta deja una sobrecarga zombi y el
   llamador se queda con la vieja).
   ═══════════════════════════════════════════════════════════════════════════ */
ALTER TABLE public.guarderia_suscripciones
  ADD COLUMN IF NOT EXISTS direccion_id uuid REFERENCES public.direcciones_guardadas(id);

COMMENT ON COLUMN public.guarderia_suscripciones.direccion_id IS
  'A donde pasan a buscar. Se resuelve AL FIRMAR el mandato, jamas al cobrar: el '
  'reloj crea las citas sin nadie presente y no puede preguntar. Cambiarla afecta '
  'las citas futuras del plan, no las ya creadas.';

DROP FUNCTION IF EXISTS public.reservar_dia_guarderia(uuid, uuid, date);
DROP FUNCTION IF EXISTS public.reservar_dia_de_paquete_guarderia(uuid, date, uuid);
DROP FUNCTION IF EXISTS public.contratar_mensualidad_guarderia(uuid, uuid, uuid, numeric);

CREATE OR REPLACE FUNCTION public.reservar_dia_guarderia(p_prestador_id uuid, p_mascota_id uuid, p_fecha date, p_direccion_id uuid DEFAULT NULL)
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
  /* ═══ LA DIRECCIÓN LA ELIGE LA FAMILIA — y el server la VALIDA ═══════════
     🟢 Firma del founder (31-ago): *«la familia elige a qué dirección pasan a
     buscar a su animal»*. Antes esta puerta llamaba a
     `_direccion_hogar_snapshot(user)` por su cuenta ⇒ **siempre la principal**,
     sin forma de elegir.

     🔴 **Y jamás se confía en lo que manda la pantalla:** se recibe un ID y se
     resuelve el snapshot **del lado del server**, contra las direcciones de
     quien reserva. *Aceptar el snapshot armado por el cliente sería dejar que
     la pantalla escriba a dónde va el animal.*

     ⚠️ **El criterio de «de quién son» sale de la RLS viva** (`dir_own`:
     `user_id = auth.uid()`), **no de una decisión mía**. Nota declarada: las
     direcciones son **de la PERSONA, no del hogar** — el modelo no tiene
     direcciones de familia. Validar contra las de todos los miembros
     **ensancharía** la audiencia y es decisión de producto, no de motor.

     NULL = la principal, como siempre ⇒ compatible hacia atrás. */
  IF p_direccion_id IS NULL THEN
    v_direccion := _direccion_hogar_snapshot(v_user);
  ELSE
    SELECT jsonb_build_object('direccion_id', d.id, 'direccion', d.direccion,
             'ciudad', d.ciudad, 'sector', d.sector, 'referencias', d.referencias,
             'lat', d.lat, 'lon', d.lon)
      INTO v_direccion
      FROM direcciones_guardadas d
     WHERE d.id = p_direccion_id AND d.user_id = v_user;
    IF v_direccion IS NULL THEN
      RAISE EXCEPTION 'direccion_no_valida' USING ERRCODE='22023';
    END IF;
  END IF;

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

CREATE OR REPLACE FUNCTION public.reservar_dia_de_paquete_guarderia(p_bono_id uuid, p_fecha date, p_mascota_id uuid DEFAULT NULL::uuid, p_direccion_id uuid DEFAULT NULL)
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
  /* ═══ LA DIRECCIÓN LA ELIGE LA FAMILIA — y el server la VALIDA ═══════════
     🟢 Firma del founder (31-ago): *«la familia elige a qué dirección pasan a
     buscar a su animal»*. Antes esta puerta llamaba a
     `_direccion_hogar_snapshot(user)` por su cuenta ⇒ **siempre la principal**,
     sin forma de elegir.

     🔴 **Y jamás se confía en lo que manda la pantalla:** se recibe un ID y se
     resuelve el snapshot **del lado del server**, contra las direcciones de
     quien reserva. *Aceptar el snapshot armado por el cliente sería dejar que
     la pantalla escriba a dónde va el animal.*

     ⚠️ **El criterio de «de quién son» sale de la RLS viva** (`dir_own`:
     `user_id = auth.uid()`), **no de una decisión mía**. Nota declarada: las
     direcciones son **de la PERSONA, no del hogar** — el modelo no tiene
     direcciones de familia. Validar contra las de todos los miembros
     **ensancharía** la audiencia y es decisión de producto, no de motor.

     NULL = la principal, como siempre ⇒ compatible hacia atrás. */
  IF p_direccion_id IS NULL THEN
    v_dir := public._direccion_hogar_snapshot(v_auth);   -- D-963
  ELSE
    SELECT jsonb_build_object('direccion_id', d.id, 'direccion', d.direccion,
             'ciudad', d.ciudad, 'sector', d.sector, 'referencias', d.referencias,
             'lat', d.lat, 'lon', d.lon)
      INTO v_dir
      FROM direcciones_guardadas d
     WHERE d.id = p_direccion_id AND d.user_id = v_auth;
    IF v_dir IS NULL THEN
      RAISE EXCEPTION 'direccion_no_valida' USING ERRCODE='22023';
    END IF;
  END IF;

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

CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric, p_direccion_id uuid DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid; v_doc jsonb;
  v_tarj_estado text; v_exp_mes smallint; v_exp_anio smallint; v_dir_id uuid;
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

  /* ═══ LA DIRECCIÓN ES UN DATO DEL MANDATO, NO DE LA SESIÓN ══════════════
     🟢 Firma del founder (31-ago): **las citas del plan las crea el RELOJ, sin
     nadie presente** ⇒ la dirección tiene que quedar acá, igual que el medio de
     pago. *El reloj no puede preguntarle a nadie a dónde pasar a buscar.*

     🔴 **Se resuelve AL FIRMAR, jamás al cobrar.** Si viene NULL se guarda la
     principal **de este momento** — no se deja NULL para que el reloj la
     resuelva después: *eso volvería la dirección un dato de la sesión del reloj
     y la familia habría autorizado una dirección que puede haber cambiado.*

     ⚠️ Cambiarla después cambia **las citas futuras del plan, no las creadas** —
     y eso sale solo de este diseño: el reloj lee el mandato de hoy. */
  IF p_direccion_id IS NULL THEN
    SELECT d.id INTO v_dir_id FROM direcciones_guardadas d
     WHERE d.user_id = v_auth AND d.es_principal LIMIT 1;
  ELSE
    SELECT d.id INTO v_dir_id FROM direcciones_guardadas d
     WHERE d.id = p_direccion_id AND d.user_id = v_auth;
    IF v_dir_id IS NULL THEN
      RAISE EXCEPTION 'direccion_no_valida' USING ERRCODE='22023';
    END IF;
  END IF;

  INSERT INTO guarderia_suscripciones (
    familia_id, prestador_id, prestador_servicio_id, mascota_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual, direccion_id)
  VALUES (v_fam, p_prestador_id, v_serv.id, p_mascota_id,
          p_tarjeta_id, v_auth,
          /* El techo del mandato: lo que se pida, o el precio de hoy. */
          COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
          v_serv.precio_mensual_plan, v_dir_id)
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

REVOKE EXECUTE ON FUNCTION public.reservar_dia_guarderia(uuid, uuid, date, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reservar_dia_guarderia(uuid, uuid, date, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reservar_dia_de_paquete_guarderia(uuid, date, uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reservar_dia_de_paquete_guarderia(uuid, date, uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.contratar_mensualidad_guarderia(uuid, uuid, uuid, numeric, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.contratar_mensualidad_guarderia(uuid, uuid, uuid, numeric, uuid) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR
   ───────────────────────────────────────────────────────────────────────────
   «Acepta una dirección» no mide nada: una puerta que ignorara el parámetro y
   siguiera usando la principal también «aceptaría». Los brazos que discriminan:
     ① 🔑 con una dirección **NO principal**, la cita guarda **ÉSA** — no la
        principal. *Sin este brazo, ignorar el parámetro daría verde.*
     ② una dirección **de otra persona** rebota `direccion_no_valida` — el
        server no confía en el id que le mandan.
     ③ NULL sigue dando la principal (compatible hacia atrás).
     ④ el mandato guarda `direccion_id` **al firmar**.
   Escribe en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406).
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user; v_user uuid; v_fam uuid; v_masc uuid; v_prest uuid;
  v_tarj uuid; v_prin uuid; v_otra uuid; v_ajena uuid; v_otro_user uuid;
  v_d1 date; v_d2 date; v_d3 date; v_cita uuid; v_snap jsonb; v_sus uuid; v_dir_m uuid;
  v_r text; v_out text := ''; v_ok int := 0; v_c0 int; v_c1 int;
BEGIN
  SELECT count(*) INTO v_c0 FROM evento_cita_servicio WHERE tipo_servicio='guarderia_dia';
  SELECT c.user_id, c.mascota_id INTO v_user, v_masc FROM evento_cita_servicio c
    JOIN mascotas m ON m.id=c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm WHERE fm.user_id=v_user AND fm.hasta IS NULL LIMIT 1;
  SELECT ps.prestador_id INTO v_prest FROM prestador_servicios ps
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo AND ps.precio_mensual_plan > 0 LIMIT 1;
  SELECT t.id INTO v_tarj FROM tarjetas_guardadas t WHERE t.user_id=v_user AND t.estado='guardada' LIMIT 1;
  SELECT d.id INTO v_prin FROM direcciones_guardadas d WHERE d.user_id=v_user AND d.es_principal LIMIT 1;
  SELECT d.user_id, d.id INTO v_otro_user, v_ajena FROM direcciones_guardadas d WHERE d.user_id <> v_user LIMIT 1;
  IF v_prin IS NULL OR v_tarj IS NULL OR v_prest IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta fixture (principal=% tarjeta=% prest=%) — el arnes NO midio nada', v_prin, v_tarj, v_prest;
  END IF;

  BEGIN
    /* Una SEGUNDA dirección, no principal — es el discriminador. */
    /* ⚠️ CON PUNTO: `chk_direccion_con_punto` exige lat/lon. **El fixture
       cumple el CHECK, no se amplía el CHECK para que el fixture pase** — una
       dirección sin punto es justamente lo que esa restricción existe para
       impedir (Places falla en Quito más de lo que uno espera). */
    INSERT INTO direcciones_guardadas (user_id, country_code, alias, direccion, ciudad, es_principal, lat, lon)
    VALUES (v_user, 'EC', 'ARNES-SEGUNDA', 'Calle del arnes 123', 'Quito', false, -0.1807, -78.4678)
    RETURNING id INTO v_otra;
    IF v_ajena IS NULL THEN
      INSERT INTO direcciones_guardadas (user_id, country_code, alias, direccion, ciudad, es_principal, lat, lon)
      SELECT p.id, 'EC', 'ARNES-AJENA', 'Calle ajena 1', 'Quito', false, -0.1900, -78.4800
        FROM auth.users p WHERE p.id <> v_user LIMIT 1
      RETURNING id INTO v_ajena;
    END IF;

    SELECT min(d)::date INTO v_d1 FROM generate_series(public.hoy_local()+1, public.hoy_local()+30,'1 day') d
     WHERE public._guarderia_dia_operativo(v_prest, d::date)
       AND NOT EXISTS (SELECT 1 FROM evento_cita_servicio c WHERE c.mascota_id=v_masc AND c.fecha=d::date
                        AND c.tipo_servicio='guarderia_dia' AND c.estado NOT IN ('cancelada','rechazada','no_realizable'));
    SELECT min(d)::date INTO v_d2 FROM generate_series(v_d1+1, public.hoy_local()+30,'1 day') d
     WHERE public._guarderia_dia_operativo(v_prest, d::date)
       AND NOT EXISTS (SELECT 1 FROM evento_cita_servicio c WHERE c.mascota_id=v_masc AND c.fecha=d::date
                        AND c.tipo_servicio='guarderia_dia' AND c.estado NOT IN ('cancelada','rechazada','no_realizable'));

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.aceptar_documentos_guarderia(v_fam, NULL);

    /* ① 🔑 la elegida gana */
    v_cita := (public.reservar_dia_guarderia(v_prest, v_masc, v_d1, v_otra)->>'cita_id')::uuid;
    SELECT c.direccion_snapshot INTO v_snap FROM evento_cita_servicio c WHERE c.id = v_cita;
    v_out := v_out || format(E'\n  🔑 con la SEGUNDA -> guarda %s (principal es %s)',
                             v_snap->>'direccion_id', v_prin);
    IF (v_snap->>'direccion_id')::uuid = v_otra THEN v_ok := v_ok + 1; END IF;

    /* ② la ajena rebota */
    BEGIN PERFORM public.reservar_dia_guarderia(v_prest, v_masc, v_d2, v_ajena); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    v_out := v_out || format(E'\n  una direccion AJENA -> %s', v_r);
    IF v_r = 'direccion_no_valida' THEN v_ok := v_ok + 1; END IF;

    /* ③ NULL = la principal */
    v_cita := (public.reservar_dia_guarderia(v_prest, v_masc, v_d2, NULL)->>'cita_id')::uuid;
    SELECT c.direccion_snapshot INTO v_snap FROM evento_cita_servicio c WHERE c.id = v_cita;
    v_out := v_out || format(E'\n  NULL -> guarda %s', v_snap->>'direccion_id');
    IF (v_snap->>'direccion_id')::uuid = v_prin THEN v_ok := v_ok + 1; END IF;

    /* ④ el mandato la guarda */
    v_sus := (public.contratar_mensualidad_guarderia(v_prest, v_tarj, NULL, NULL, v_otra)->>'suscripcion_id')::uuid;
    SELECT s.direccion_id INTO v_dir_m FROM guarderia_suscripciones s WHERE s.id = v_sus;
    v_out := v_out || format(E'\n  el MANDATO guarda %s', v_dir_m);
    IF v_dir_m = v_otra THEN v_ok := v_ok + 1; END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_c1 FROM evento_cita_servicio WHERE tipo_servicio='guarderia_dia';
  RAISE NOTICE E'\n═══ CINTURON · la direccion elegida ═══%\n\n  %/4 · residuo citas %→%', v_out, v_ok, v_c0, v_c1;
  IF v_ok <> 4 THEN RAISE EXCEPTION 'CINTURON ROJO: %/4. %', v_ok, v_out; END IF;
  IF v_c1 <> v_c0 THEN RAISE EXCEPTION 'CINTURON ROJO: residuo'; END IF;
END $cinturon$;
