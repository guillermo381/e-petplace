-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · M4 · LA MENSUALIDAD: PAGAR ES ARRANCAR
--
-- 76(g) VEDA: **NO RIGE.** Reemplazo de dos funciones. Cero backfill — la única
--   suscripción viva tiene `periodo_desde` NULL y no se toca.
-- REVERSA: `docs/relevamientos/2026-09-01-s108a-REVERSA-M4.sql`.
-- L-119: la firma cambia de (uuid,date) a (uuid,date,uuid) ⇒ **DROP explícito
--   de la vieja**, o queda sobrecarga zombi. Callers censados ANTES: **CERO**
--   en DB, cero en repo, cero en cron.
--
-- ═══ LA ANCLA, FIRMADA POR EL FOUNDER EL 31-AGO ════════════════════════════
-- 🟢 **Opción A: la mensualidad cobra al contratar; la renovación ancla en la
--    fecha de contratación. El día de inicio elegible queda DEROGADO.**
--
-- 🔴 ESTO DEROGA LA FIRMA ③ DEL PLAN S108, que decía lo contrario («cobra el
--    día que arranca el plan, no al firmar»). Se anota acá porque **dos letras
--    firmadas que se contradicen son peores que una equivocada**: cualquiera
--    cita la que le conviene y está en regla. Gana la ANCLA, que es posterior.
--
-- ⚠️ Y ARRASTRA UNA DEUDA QUE NO ES DE CÓDIGO: la pantalla ya publicó lo
--    contrario. Medido, y se renderiza:
--      · es.ts:2905 / en.ts:2129 `mensualMandato` → checkout.tsx:275
--        «Hoy no se cobra nada: el primer cobro sale el día que empieza el plan»
--      · es.ts:3115 / en.ts:2303 `mensualExitoDetalle` → checkout.tsx:192
--    **Esas dos líneas pasan a ser falsas el minuto que el cobro se encienda.**
--    Sin consumidor y ahora derogado: `contratarMensualDesde` (el día elegible)
--    y la RPC `primer_dia_reservable_guarderia`.
--    ⇒ Este motor y esas dos líneas son UN SOLO ACTO (misma regla que D-662).
--
-- ═══ EL CAMPO DE INICIO: SE REPORTÓ ANTES DE TOCARLO ═══════════════════════
-- `guarderia_suscripciones.periodo_desde` existe, pero **NO es un día elegible
-- por el cliente**: es nullable, sin default, la fila viva lo tiene NULL, y
-- `contratar_mensualidad_guarderia` nunca lo escribe. Lo escribe el cobro.
-- ⇒ **Se conserva tal cual.** Es exactamente el campo que opción A necesita;
--   lo único que cambia es de dónde sale su valor. Nada que derogar en el esquema.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.cobrar_periodo_mensualidad_guarderia(uuid,date);

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

CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric, p_direccion_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid; v_doc jsonb;
  v_tarj_estado text; v_exp_mes smallint; v_exp_anio smallint; v_dir_id uuid; v_ya uuid;
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

  /* ═══ YA TIENE UN PLAN CON ESTE LUGAR ═══════════════════════════════════
     🔴 Hasta hoy esto lo frenaba **sólo el índice `uq_susc_viva_por_lugar`**,
     y **un guard que vive en un índice sólo sabe negarse** (`L-424`): el
     wrapper hacía `fallo(error.message)` y **al founder le llegó el mensaje
     crudo de Postgres sobre una duplicate key.**

     ⚠️ Y el efecto real era peor que un mensaje feo: **su primer toque SÍ había
     firmado el mandato.** El segundo rebotó ⇒ *no era «no me deja pagar»: era
     «ya lo tenés y no supe explicártelo».*

     Devuelve el **id del plan que ya existe** para que la pantalla LLEVE ahí en
     vez de mostrar un error. *Un rebote que sólo dice que no obliga a la
     familia a adivinar dónde está lo que ya tiene.* */
  SELECT s.id INTO v_ya FROM guarderia_suscripciones s
   WHERE s.familia_id = v_fam AND s.prestador_id = p_prestador_id
     AND s.estado = 'activa' LIMIT 1;
  IF v_ya IS NOT NULL THEN
    RAISE EXCEPTION 'ya_tienes_plan_activo: %', v_ya USING ERRCODE='22023';
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

  /* ═══ EL MANDATO QUEDA FIRMADO, Y EL COBRO SIGUE AHORA ══════════════════
     ✏️ La nota vieja decía *«el cobro espera la firma de los días del plan»* —
     **esa firma llegó** (ANCLA del founder, 31-ago: *pagar es arrancar*).
     Dejarla diría que falta algo que ya se decidió.

     🔴 Esta función NO cobra, y eso es correcto: el cobro sale por la edge con
     la sesión de la familia, igual que la compra y la cita. Lo que devuelve es
     el sujeto para que la puerta lo cobre.

     **Cómo se lee `periodo_desde IS NULL`:** *«autorizado y todavía sin
     cobrar»*. No se inventó un estado — `guarderia_suscripciones_estado_check`
     es vocabulario cerrado (activa|pausada|cancelada|vencida) y ensancharlo
     para esto sería decisión de letra, no un valor más que se agrega. El dato
     que ya existe lo dice. */
  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_id,
    'precio_mensual', v_serv.precio_mensual_plan,
    'monto_esperado', COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
    'cobrada', false,
    'cobro_pendiente', true,
    'nota', 'mandato firmado — el cobro del primer periodo sale ahora, por la puerta de pago');
END $function$

;

REVOKE EXECUTE ON FUNCTION public.cobrar_periodo_mensualidad_guarderia(uuid,date,uuid) FROM PUBLIC, anon, authenticated;
/* No la llama una sesión: la llama el actuador, que corre como owner. */

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_susc uuid; v_int uuid; v_user uuid; v_r jsonb; v_ayer date; v_n int;
BEGIN
  -- (a) sobrecarga: la firma vieja NO puede seguir viva (L-119)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='cobrar_periodo_mensualidad_guarderia';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: quedaron % sobrecargas, esperaba 1', v_n; END IF;

  UPDATE guarderia_suscripciones SET estado='cancelada', cancelada_en=now() WHERE estado='activa';
  INSERT INTO guarderia_suscripciones (familia_id, prestador_id, prestador_servicio_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual, estado)
  SELECT g.familia_id, g.prestador_id, g.prestador_servicio_id, g.tarjeta_id,
         g.autorizada_por, g.monto_esperado, g.precio_mensual, 'activa'
    FROM guarderia_suscripciones g LIMIT 1
  RETURNING id, autorizada_por INTO v_susc, v_user;

  /* (b) 🔴 EL DISCRIMINADOR DEL ANCLA.
     El intento declara haberse cerrado en una fecha que **no es hoy**: si la
     función anclara en el reloj daría `hoy_local()`, y si ancla en el pago da
     esa fecha. *Dos fuentes que casi siempre coinciden — por eso el arnés las
     separa a propósito: un discriminador que no distingue no mide nada.*

     ⚠️ Se elige una ventana LEJANA (+60 días) y no «ayer» por una razón medida:
     con ayer, la generación del mes choca contra
     `uq_guarderia_una_por_mascota_dia` —hay días ya reservados— y el arnés
     moriría por el CUPO, no por el ancla. *Un rojo del instrumento se lee
     igual que un rojo del motor.* */
  v_ayer := public.hoy_local() + 60;
  INSERT INTO pagos_intentos (guarderia_suscripcion_id, guarderia_suscripcion_periodo,
    proveedor, monto, moneda, forma, estado, clave_idempotencia, payload_crudo,
    pagador_user_id, pagador_origen, cerrado_en)
  VALUES (v_susc, v_ayer, 'nuvei', 100, 'USD', 'tokenizacion', 'aprobado',
          'cinturon:m4:'||v_susc::text, '{}'::jsonb, v_user, 'sesion',
          (v_ayer::timestamp + interval '15 hours') AT TIME ZONE 'America/Guayaquil')
  RETURNING id INTO v_int;

  BEGIN
    v_r := public.cobrar_periodo_mensualidad_guarderia(v_susc, NULL, v_int);
    IF (v_r->>'periodo_desde')::date <> v_ayer THEN
      RAISE EXCEPTION 'cinturon: el ancla salio del reloj y no del pago (% vs %)',
                      v_r->>'periodo_desde', v_ayer;
    END IF;
    IF v_r->>'anclado_en' <> 'pago_confirmado' THEN
      RAISE EXCEPTION 'cinturon: no declaro de donde salio el ancla: %', v_r::text;
    END IF;
    IF v_r ? 'pago_simulado' THEN
      RAISE EXCEPTION 'cinturon: todavia declara pago_simulado';
    END IF;
  EXCEPTION WHEN sqlstate '22023' OR sqlstate '23505' THEN
    /* 🔴 SI ESTO CORRE, EL BRAZO (b) NO MIDIÓ. El lugar puede no operar esos
       días o el cupo puede estar tomado — y en ese caso el ancla queda SIN
       PROBAR. Se dice con todas las letras en vez de dejar pasar el bloque
       como si hubiera sido verde. */
    RAISE NOTICE 'cinturon M4: ⚠️ BRAZO (b) NO EJERCIDO — el periodo no se pudo comprometer (%). El ancla queda SIN PROBAR.', SQLERRM;
  END;

  -- (c) 🔴 SIN INTENTO APROBADO NO SE INVENTA FECHA
  UPDATE pagos_intentos SET estado='rechazado' WHERE id=v_int;
  BEGIN
    PERFORM public.cobrar_periodo_mensualidad_guarderia(v_susc, NULL, v_int);
    RAISE EXCEPTION 'cinturon: anclo un periodo con un intento NO aprobado';
  EXCEPTION WHEN sqlstate '22023' THEN
    IF SQLERRM NOT LIKE 'intento_no_aprobado%' AND SQLERRM NOT LIKE 'suscripcion%' THEN
      RAISE EXCEPTION 'cinturon: reboto con la voz equivocada: %', SQLERRM;
    END IF;
  END;

  RAISE NOTICE 'cinturon M4: OK (una sola firma · ancla del pago y no del reloj · sin intento aprobado no hay fecha · sin pago_simulado)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M4: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
