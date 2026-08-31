-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · M2 · EL BONO NACE SIN PAGAR — y su ciclo completo
--
-- 76(g) VEDA DE ESCRITURA: **NO RIGE.** Reemplazo de funciones + dos funciones
--   nuevas + un cron. **Cero backfill**: los 7 bonos vivos (4 guardería,
--   3 paseo) están `pagado` y no se tocan — la letra rige hacia adelante.
-- REVERSA: `docs/relevamientos/2026-09-01-s108a-REVERSA-M2.sql`, con los dos
--   cuerpos originales embebidos (son su única fuente).
--
-- ═══ EL VOCABULARIO NO SE ENSANCHÓ, Y ESO CORRIGE AL PLAN ══════════════════
-- 🔴 El plan pedía `pendiente_pago` tres veces. Medido:
--      bonos_estado_pago_valido → CHECK (estado_pago IN ('pendiente','pagado','reembolsado'))
--    **`pendiente` YA EXISTE y significa exactamente esto.** `pendiente_pago`
--    habría sido un valor nuevo en un vocabulario cerrado, agregado para que
--    una migración pasara. Se usa el que hay. **Cero DDL de vocabulario.**
--
-- ═══ LA FIRMA ① NO SE CONSTRUYE: YA ERA INEXPRESABLE ═══════════════════════
-- `reservar_dia_de_paquete_guarderia` exige `estado_pago='pagado'` DENTRO de su
-- `SELECT … FOR UPDATE`. Un bono `pendiente` no otorga saldo porque **la fila no
-- se puede ni tomar**, no porque una lectura la descarte después. Lo que esta
-- migración le agrega es la VOZ (`paquete_no_pagado`), no la defensa.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

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
    estado, estado_pago, country_code, prestador_servicio_id, pago_metadata,
    pago_expira_en
  ) VALUES (
    p_prestador_id, v_auth, v_familia, NULL, 'guarderia_dia',
    'Paquete de ' || p_tamano || ' días de guardería (vigencia mensual, del hogar)',
    p_tamano, 0,
    /* 🔴 `duracion_minutos` NULL a propósito: **una estadía no dura minutos, dura
       un DÍA.** Poner la jornada acá lo haría parecer un slot de agenda. */
    NULL,
    v_total, round(v_paq.precio / p_tamano, 2),
    v_hoy, v_vence, 'activo', 'pendiente',
    v_country, v_serv.id,
    /* ☠️ MUERE `pago_simulado`. Firma del founder: el paquete cobra por el riel
       de verdad, para que pasar a producción sea encender y no reescribir. */
    jsonb_build_object('dias_rollover_proyectados', v_roll.dias),
    /* 🔴 LA VENTANA DE 15 MINUTOS — firma ② del plan. El bono **no toma cupo**
       (es saldo, no un día), así que esto no libera nada: evita un `pendiente`
       eterno que sólo se limpia a mano. *Y la limpieza manual es la clase de
       cosa que nadie corre.* Misma ventana que la cita, porque es la que la
       familia ya conoce del checkout. */
    now() + interval '15 minutes'
  ) RETURNING id INTO v_bono;

  /* ═══ EL ROLLOVER SE MUDÓ A LA CONFIRMACIÓN ══════════════════════════════
     🔴 HALLAZGO DE ESTA TANDA, y no estaba en el plan. Hasta hoy el rollover
     extendía la vigencia de los paquetes viejos **en el mismo acto de comprar**.
     Con el bono naciendo `pendiente`, eso REGALA vigencia por plata que todavía
     no llegó — y si el pago nunca llega, la extensión queda igual.

     *Un beneficio otorgado por un cobro que no ocurrió es la misma clase de
     palanca que la firma ① cierra del lado del saldo.* Vive ahora en
     `confirmar_pago_paquete_guarderia`, que corre cuando la plata entró. */

  /* 🔴 EL RETORNO NO AFIRMA SALDO. Antes devolvía `saldo_total` y `pagado_en`
     sobre un bono recién nacido: hoy ese bono está `pendiente` y **no otorga un
     solo día**. *Decir «saldo_total: 10» cuando la puerta del día va a rebotar
     es exactamente el verosímil-falso que este motor no puede permitirse.*
     Lo que se devuelve es lo que hay: un bono esperando cobro y hasta cuándo. */
  RETURN jsonb_build_object('ok', true, 'bono_id', v_bono, 'dias', p_tamano,
    'total', v_total, 'por_dia', round(v_paq.precio / p_tamano, 2),
    'vence_el', v_vence, 'dias_rollover_proyectados', v_roll.dias,
    'estado_pago', 'pendiente', 'pago_expira_en', now() + interval '15 minutes');
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
  /* ═══ EL REBOTE SE NOMBRA, Y POR ESO SON DOS CÓDIGOS ════════════════════
     🔴 El `SELECT` de arriba sigue exigiendo `estado_pago='pagado'` **en su
     propio predicado, con `FOR UPDATE`** — ahí es donde la firma ① es
     INEXPRESABLE: un paquete sin cobrar no otorga saldo porque la fila no se
     puede ni tomar, no porque una lectura la filtre después.

     Lo que faltaba es la VOZ. Hasta hoy un paquete recién comprado y todavía
     sin confirmar rebotaba `sin_saldo_paquete` — *«no te quedan días»* sobre un
     paquete de diez días comprado hace treinta segundos. **Un guard que sólo
     sabe negarse manda a la familia a buscar un problema que no tiene**
     (`L-424`): el saldo está, lo que falta es el cobro.

     El diagnóstico corre SÓLO cuando el camino bueno ya rebotó, y no toca
     nada: es para decidir qué decir, jamás para dejar pasar. */
  IF v_b.id IS NULL THEN
    IF EXISTS (SELECT 1 FROM bonos b
                WHERE b.id=p_bono_id AND b.familia_id=v_familia
                  AND b.tipo_servicio='guarderia_dia' AND b.estado_pago='pendiente') THEN
      RAISE EXCEPTION 'paquete_no_pagado' USING ERRCODE='22023';
    END IF;
    RAISE EXCEPTION 'sin_saldo_paquete' USING ERRCODE='22023';
  END IF;
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

-- ═══ LA PUERTA DE LA CONFIRMACIÓN ═════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.confirmar_pago_paquete_guarderia(p_bono_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $fn$
DECLARE v_b record; v_ext int := 0;
BEGIN
  /* 🔴 SOLO SERVIDOR — mismo molde que `mover_sujeto_por_reverso`. Esta función
     convierte plata en saldo: si la pudiera llamar una sesión, la familia se
     confirmaría sus propios paquetes. */
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_b FROM bonos WHERE id = p_bono_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo','bono_no_existe'); END IF;

  /* Idempotente: el webhook y la consulta activa pueden llegar los dos. */
  IF v_b.estado_pago = 'pagado' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true, 'bono_id', p_bono_id);
  END IF;

  IF v_b.estado_pago <> 'pendiente' THEN
    RETURN jsonb_build_object('ok', false, 'codigo','estado_pago_inesperado',
                              'estado_pago', v_b.estado_pago);
  END IF;

  /* 🔴 PLATA QUE LLEGÓ TARDE — se NOMBRA, no se aplica ni se ignora.
     Si la ventana venció y el barrido ya canceló el bono, confirmarlo acá
     resucitaría un paquete que la familia vio morir; ignorarlo dejaría un cobro
     sin sujeto. *Las dos son mentiras distintas.* Se devuelve `ok:false` con
     nombre propio para que el actuador lo marque y alguien lo mire — es
     exactamente la misma forma que `reverso_sin_intento`. */
  IF v_b.estado = 'cancelado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo','pago_tardio_bono_cancelado',
                              'bono_id', p_bono_id, 'vencio_en', v_b.pago_expira_en);
  END IF;

  UPDATE bonos
     SET estado_pago = 'pagado',
         /* El reloj del hold se apaga: cumplió. El CHECK
            `chk_bono_hold_solo_si_no_pagado` lo EXIGE — con la ventana viva y
            `pagado`, este UPDATE rebota. El invariante se defiende solo. */
         pago_expira_en = NULL,
         pago_metadata = COALESCE(pago_metadata,'{}'::jsonb)
                         || jsonb_build_object('pagado_en', now())
   WHERE id = p_bono_id;

  /* ═══ EL ROLLOVER, ACÁ Y NO EN LA COMPRA ════════════════════════════════
     Llegó la plata ⇒ ahora sí se extiende la vigencia de los paquetes viejos
     del mismo hogar en el mismo lugar (P16e). Mismo predicado que tenía la
     compra, movido entero. */
  UPDATE bonos b
     SET fecha_vencimiento = v_b.fecha_vencimiento,
         pago_metadata = COALESCE(b.pago_metadata,'{}'::jsonb)
                         || jsonb_build_object('rollover_extendido_por', p_bono_id,
                                               'rollover_en', now())
   WHERE b.familia_id = v_b.familia_id AND b.prestador_id = v_b.prestador_id
     AND b.tipo_servicio = 'guarderia_dia' AND b.estado = 'activo'
     AND b.estado_pago = 'pagado'
     AND b.unidades_usadas < b.unidades_total AND b.id <> p_bono_id;
  GET DIAGNOSTICS v_ext = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'bono_id', p_bono_id,
    'dias', v_b.unidades_total, 'vence_el', v_b.fecha_vencimiento,
    'bonos_extendidos', v_ext);
END $fn$;

-- ═══ EL BARRIDO DEL HOLD ══════════════════════════════════════════════════
/* 🔴 NO SE REUSA `expirar_citas_pendientes()`: está atada a
   `evento_cita_servicio` y compara SU columna `expira_en`. No toma parámetro.
   Y sobre todo — **`bonos.fecha_vencimiento` NO es este reloj**: es la vigencia
   del saldo, la que el rollover mueve. Colgar el hold de ahí haría que extender
   un paquete moviera la ventana de pago de otro. Dos relojes, dos columnas. */
CREATE OR REPLACE FUNCTION public.expirar_bonos_sin_pago()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $fn$
DECLARE v_n int;
BEGIN
  UPDATE bonos
     SET estado = 'cancelado',
         /* `estado_pago` queda en `pendiente` A PROPÓSITO: nunca se pagó, y
            escribir otra cosa borraría por qué murió. La ventana tampoco se
            limpia — es la evidencia de cuándo venció. */
         pago_metadata = COALESCE(pago_metadata,'{}'::jsonb)
                         || jsonb_build_object('cancelado_por_hold_en', now())
   WHERE estado_pago = 'pendiente'
     AND estado = 'activo'
     AND pago_expira_en IS NOT NULL
     AND pago_expira_en < now();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END $fn$;

-- L-140: toda función nueva nace con EXECUTE para anon. Se cierra explícito.
REVOKE EXECUTE ON FUNCTION public.confirmar_pago_paquete_guarderia(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.expirar_bonos_sin_pago() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_pago_paquete_guarderia(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.expirar_bonos_sin_pago() FROM authenticated;
/* Ninguna de las dos la llama una sesión: la confirmación es del actuador
   (DEFINER, corre como owner) y el barrido es del cron. */

SELECT cron.schedule('expirar-bonos-sin-pago', '* * * * *',
                     'SELECT public.expirar_bonos_sin_pago();')
 WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='expirar-bonos-sin-pago');

-- ═══ CINTURÓN — con DISCRIMINADOR, y con la sesión que el camino real tiene ══
/* 🔴 EL ARNÉS TIENE QUE ENTRAR POR LA MISMA PUERTA QUE LA FAMILIA.
   `reservar_dia_de_paquete_guarderia` abre con `auth.uid()`; en una migración
   eso es NULL y la función rebota `auth_required` — **con 22023 y todo**, o sea
   que un cinturón descuidado vería «rebotó» y lo contaría como verde sobre una
   defensa que nunca se ejerció. Por eso se siembra el claim, y por eso el brazo
   exige el CÓDIGO EXACTO y no «rebotó» (`L-437`).
   Y al revés para la confirmación: es SOLO SERVIDOR, así que el claim se apaga
   antes de llamarla — si no, la rechaza con razón. */
DO $c$
DECLARE v_fam uuid; v_prest uuid; v_user uuid; v_bono uuid;
        v_r jsonb; v_n int; v_estado text;
BEGIN
  SELECT b.familia_id, b.prestador_id INTO v_fam, v_prest
    FROM bonos b WHERE b.tipo_servicio='guarderia_dia' LIMIT 1;
  SELECT fm.user_id INTO v_user FROM familia_miembro fm
   WHERE fm.familia_id = v_fam AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL OR v_user IS NULL THEN
    RAISE EXCEPTION 'cinturon: sin datos para discriminar (fam=% user=%)', v_fam, v_user;
  END IF;

  -- (a) el bono nace con ventana y sin pagar
  INSERT INTO bonos (prestador_id, user_id, familia_id, tipo_servicio,
    unidades_total, unidades_usadas, precio_total, precio_por_unidad,
    fecha_compra, fecha_vencimiento, estado, estado_pago, country_code, pago_expira_en)
  VALUES (v_prest, v_user, v_fam, 'guarderia_dia', 3, 0, 30, 10,
          public.hoy_local(), (public.hoy_local() + interval '1 month')::date,
          'activo', 'pendiente', 'EC', now() + interval '15 minutes')
  RETURNING id INTO v_bono;

  -- (b) 🔴 EL DISCRIMINADOR: con sesión REAL, un paquete pendiente no da saldo
  --     y lo dice con SU nombre. Exige el código exacto: «rebotó» no es medir.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user::text, 'role','authenticated')::text, true);
  BEGIN
    PERFORM public.reservar_dia_de_paquete_guarderia(
      v_bono, (public.hoy_local() + 3)::date, NULL, NULL);
    RAISE EXCEPTION 'cinturon: un paquete PENDIENTE otorgó un día';
  EXCEPTION
    WHEN sqlstate '22023' THEN
      IF SQLERRM NOT LIKE 'paquete_no_pagado%' THEN
        RAISE EXCEPTION 'cinturon: rebotó con la voz equivocada: %', SQLERRM;
      END IF;
  END;
  PERFORM set_config('request.jwt.claims', '', true);

  -- (c) la confirmación lo pone pagado y APAGA el reloj
  v_r := public.confirmar_pago_paquete_guarderia(v_bono);
  IF COALESCE((v_r->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: la confirmación falló: %', v_r::text;
  END IF;
  SELECT estado_pago INTO v_estado FROM bonos WHERE id=v_bono;
  IF v_estado <> 'pagado' THEN RAISE EXCEPTION 'cinturon: no quedó pagado: %', v_estado; END IF;
  IF EXISTS (SELECT 1 FROM bonos WHERE id=v_bono AND pago_expira_en IS NOT NULL) THEN
    RAISE EXCEPTION 'cinturon: la ventana quedó viva sobre un bono pagado';
  END IF;

  -- (d) idempotente: webhook y consulta activa pueden llegar los dos
  v_r := public.confirmar_pago_paquete_guarderia(v_bono);
  IF COALESCE((v_r->>'duplicado')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: la segunda confirmación no se declaró duplicada';
  END IF;

  -- (e) el barrido cancela lo vencido — y NO toca ningún pagado
  UPDATE bonos SET estado_pago='pendiente', pago_expira_en = now() - interval '1 minute',
                   pago_metadata = pago_metadata - 'pagado_en'
   WHERE id=v_bono;
  v_n := public.expirar_bonos_sin_pago();
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: el barrido tocó % filas, esperaba 1', v_n; END IF;
  SELECT estado INTO v_estado FROM bonos WHERE id=v_bono;
  IF v_estado <> 'cancelado' THEN RAISE EXCEPTION 'cinturon: no quedó cancelado: %', v_estado; END IF;

  -- (f) plata que llega tarde sobre un bono ya cancelado: se NOMBRA
  v_r := public.confirmar_pago_paquete_guarderia(v_bono);
  IF v_r->>'codigo' <> 'pago_tardio_bono_cancelado' THEN
    RAISE EXCEPTION 'cinturon: el pago tardío no se nombró: %', v_r::text;
  END IF;

  RAISE NOTICE 'cinturon M2: 6/6 OK (nace pendiente · no da saldo con voz propia · confirma · idempotente · barre 1 exacta · pago tardio nombrado)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claims', '', true);
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M2: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
