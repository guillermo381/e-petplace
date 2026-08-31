-- REVERSA de 20260901120000_s108a_bono_nace_pendiente.sql
-- Escrita ANTES de aplicar.
--
-- ⚠️ QUÉ NO DESHACE — y es lo más importante de este archivo:
--   Los bonos que hayan nacido `pendiente` mientras la migración estuvo viva
--   **NO se convierten en `pagado` al revertir.** Quedan sin saldo y sin puerta
--   que los confirme, porque `confirmar_pago_paquete_guarderia` desaparece acá.
--   ⇒ ANTES de correr esto: censar `bonos WHERE estado_pago='pendiente'` y
--   decidir uno por uno. Si hay plata cobrada contra alguno, revertir SIN
--   resolverlos deja cobros sin sujeto.
--
--   Tampoco deshace el rollover: los vencimientos que `confirmar_pago_...`
--   haya extendido quedan extendidos. Es dato, no código.
--
-- El cron se retira; los bonos `pendiente` vencidos dejan de cancelarse solos.

BEGIN;

SELECT cron.unschedule('expirar-bonos-sin-pago')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='expirar-bonos-sin-pago');

DROP FUNCTION IF EXISTS public.confirmar_pago_paquete_guarderia(uuid);
DROP FUNCTION IF EXISTS public.expirar_bonos_sin_pago();

-- Los dos cuerpos ORIGINALES, tal como estaban antes de la tanda.
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
  v_total numeric(14,2); v_bono uuid; v_roll record; v_doc jsonb;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_familia FROM familia_miembro fm
   WHERE fm.user_id = v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_familia IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  /* ═══ LA COMPUERTA, ANTES DE TODO LO DEMAS ═══════════════════════════════
     🔴 Este chequeo **no estaba**, y es la peor forma del defecto: la puerta
     de la RESERVA si gateaba, la de la COMPRA no ⇒ le cobrabamos el paquete
     entero a una familia que no acepto las condiciones, y recien al ir a usar
     su primer dia la frenabamos, con la plata ya tomada. *Cobrar primero y
     rechazar despues.*

     ⚠️ Se llama a `evaluar_documentos_guarderia` (la mitad de FAMILIA) y **no**
     a `_guarderia_puede_reservar` (que ademas exige mascota): el paquete es
     DEL HOGAR y nace sin mascota —se elige al reservar—, asi que no hay animal
     contra el cual evaluar lo sanitario. Forzar uno seria evaluar los
     requisitos de una mascota arbitraria, y le impediria a una familia con dos
     perros comprar por el que si esta al dia. **Lo sanitario se queda donde el
     sujeto existe: en la puerta del DIA.**

     Va antes del lock de rollover a proposito: se rebota sin haber tocado
     ninguna fila. */
  v_doc := public.evaluar_documentos_guarderia(v_familia);
  IF v_doc->>'estado' <> 'al_dia' THEN
    RAISE EXCEPTION USING ERRCODE='22023',
      MESSAGE = CASE v_doc->>'estado'
                  WHEN 'faltan' THEN 'documentos_sin_aceptar'
                  ELSE v_doc->>'estado' END;
  END IF;

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
CREATE OR REPLACE FUNCTION public.reservar_dia_de_paquete_guarderia(p_bono_id uuid, p_fecha date, p_mascota_id uuid DEFAULT NULL::uuid, p_direccion_id uuid DEFAULT NULL::uuid)
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
COMMIT;
