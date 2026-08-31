-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · LA REGLA DEL ANCLA DEJA DE LLAMARSE «GUARDERÍA», Y LA LLAVE NACE
--          EXPLÍCITAMENTE EN FALSO
--
-- 76(g) VEDA: **NO RIGE.** Renombre + 4 reemplazos + una fila de config.
--   **Cero backfill de datos de negocio.**
-- REVERSA: `docs/relevamientos/2026-09-06-s109a-REVERSA-M22.sql`.
-- L-119/L-120: renombre = DROP + CREATE con los callers censados ANTES.
--   **CUATRO en la base, cero en el repo**, y los cuatro se mueven acá.
--
-- ═══ ① EL NOMBRE ═══════════════════════════════════════════════════════════
-- 🔴 Firma del founder: *la regla del día vale para TODOS los servicios
--    recurrentes.* Desde ese momento `guarderia_proximo_cobro` **miente**: la va
--    a usar el plan de paseo, y una función `…_guarderia` aplicada a otro oficio
--    es cómo el próximo la lee como si fuera de uno solo.
--    Es la misma cura que ya se hizo con `confirmar_pago_paquete_guarderia` →
--    `confirmar_pago_bono`, por la misma razón y el mismo día.
--    ⇒ **`proximo_cobro_mensual`.** Su cuerpo ya era puro y genérico —medido, no
--    nombra guardería adentro—: lo único que había que arreglar era el nombre.
--
-- ═══ ② LA LLAVE, Y POR QUÉ UNA FILA AUSENTE NO ES UNA LLAVE APAGADA ════════
-- 🔴 Orden del founder: *la fila HOY NO EXISTE y el cron asume apagado por
--    ausencia — no se puede probar que está apagada.*
--    **Un default no es una decisión: es lo que pasa cuando nadie decidió.** Una
--    fila ausente y una fila en `false` se comportan igual hoy y significan cosas
--    distintas: la primera no distingue *«está apagado»* de *«nadie lo configuró
--    todavía»*, y el día que alguien cambie el default, el sistema cambia de
--    comportamiento sin que ninguna migración lo diga.
--    ⇒ Nace en `false`, **explícita**, y el cinturón falla si no está o si está
--    en verdadero.
--
-- ⚠️ Y la llave ahora gobierna **TRES actos** y no dos (firma del founder):
--    cobro por tarjeta · emisión del link de DeUna · aviso de 3 días.
--    *Apagada, nada recurrente ocurre en ningún riel, en ninguna dirección.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.guarderia_proximo_cobro(smallint, date);

CREATE OR REPLACE FUNCTION public.proximo_cobro_mensual(p_dia_cobro smallint, p_periodo_desde date)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  /* El mes siguiente, en el día original — o el último del mes si ese día no
     existe. **La cuenta parte SIEMPRE del día original y jamás del período
     anterior**, que es lo único que hace posible recuperarlo: si arrancara del
     28 de febrero, marzo daría 28 y el día se habría perdido. */
  SELECT (date_trunc('month', p_periodo_desde::timestamp) + interval '1 month')::date
       + (LEAST(
            p_dia_cobro::int,
            EXTRACT(day FROM (date_trunc('month', p_periodo_desde::timestamp)
                              + interval '2 month' - interval '1 day'))::int
          ) - 1);
$function$
;

REVOKE EXECUTE ON FUNCTION public.proximo_cobro_mensual(smallint, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proximo_cobro_mensual(smallint, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.avisar_renovaciones_guarderia()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_n int := 0; v_prox date;
BEGIN
  /* ═══ LA LLAVE ÚNICA — aviso y cobro se encienden JUNTOS ════════════════
     🟢 Firma del founder (31-ago). **`guarderia_recurrente_vivo()` es el ÚNICO
     lector de la clave**; acá NO se lee `app_config` por cuenta propia —
     `verificar_llave_unica_guarderia()` (S108-B) revienta si alguien lo hace,
     y con razón: *dos lectores es exactamente cómo se llega a «una encendida y
     la otra apagada».*

     🔴 Por qué es estructural y no una nota: **un aviso de cobro que no ocurre
     entrena a la familia a ignorar el próximo, que sí va a ser verdad.** Y el
     caso inverso —cobrar sin haber avisado— queda igualmente inexpresable,
     porque el mismo interruptor gobierna el cron que cobra. */
  IF NOT public.guarderia_recurrente_vivo() THEN
    RETURN jsonb_build_object('ok', true, 'avisado', false,
                              'motivo', 'guarderia_recurrente_apagado');
  END IF;
  FOR v_r IN
    SELECT s.*, cc.moneda
      FROM guarderia_suscripciones s
      JOIN prestadores pr ON pr.id = s.prestador_id
      LEFT JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
     /* 🔴 SOLO PLANES VIVOS. *Avisar de un cobro que no va a ocurrir es peor
        que no avisar*: la familia cancela algo que ya canceló, o vuelve a la app
        a arreglar un problema que no tiene. */
     WHERE s.estado = 'activa'
       /* 🔴 SOLO RENOVACIONES. `periodo_desde IS NULL` es *«autorizado y todavía
          sin cobrar»* ⇒ su primer cobro sale al contratar y **no hay tres días
          que avisar**. Este brazo es lo que impide avisarle a alguien que
          todavía no pagó su primer mes. */
       AND s.periodo_desde IS NOT NULL
       AND s.dia_de_cobro IS NOT NULL
  LOOP
    v_prox := public.proximo_cobro_mensual(v_r.dia_de_cobro, v_r.periodo_desde);
    CONTINUE WHEN v_prox <> public.hoy_local() + 3;

    PERFORM registrar_intencion_notificacion(
      p_tipo => 'guarderia_renovacion_proxima',
      p_destinatario_user_id => v_r.autorizada_por,
      p_mascota_id => v_r.mascota_id, p_evento_id => NULL,
      p_datos => _voz_notificacion('guarderia_renovacion_proxima', v_r.autorizada_por, v_r.mascota_id,
                   jsonb_build_object('fecha', v_prox,
                                      'monto', to_char(v_r.precio_mensual,'FM999999990.00'),
                                      'moneda', COALESCE(v_r.moneda,'USD')))
                 || jsonb_build_object('suscripcion_id', v_r.id, 'fecha', v_prox,
                                       'monto', v_r.precio_mensual,
                                       'moneda', COALESCE(v_r.moneda,'USD'),
                                       'puede','cancelar'),
      /* La clave lleva el PERÍODO ⇒ un aviso por período, jamás dos. El índice
         único de `notificacion_intencion` es el piso; esto es su llave. */
      p_clave_dedup => 'guarderia_renovacion:' || v_r.id::text || ':' || v_prox::text);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'avisadas', v_n);
END $function$
;

CREATE OR REPLACE FUNCTION public.obtener_mis_planes_guarderia()
 RETURNS TABLE(suscripcion_id uuid, prestador_id uuid, prestador_nombre text, mascota_id uuid, precio_mensual numeric, estado text, periodo_desde date, periodo_hasta date, direccion_id uuid, proximo_cobro date)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_fam uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = auth.uid() AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT s.id, s.prestador_id, pr.nombre_comercial, s.mascota_id,
         s.precio_mensual, s.estado, s.periodo_desde, s.periodo_hasta, s.direccion_id,
         /* La regla vive en UN solo lugar y se aplica acá. Un plan cancelado no
            tiene próximo cobro: decirle una fecha a alguien que canceló sería
            avisarle de una plata que no le vamos a sacar. */
         CASE WHEN s.estado = 'activa'
                   AND s.periodo_desde IS NOT NULL
                   AND s.dia_de_cobro IS NOT NULL
              THEN public.proximo_cobro_mensual(s.dia_de_cobro, s.periodo_desde)
              ELSE NULL END
    FROM guarderia_suscripciones s
    JOIN prestadores pr ON pr.id = s.prestador_id
   WHERE s.familia_id = v_fam
   ORDER BY (s.estado = 'activa') DESC, s.created_at DESC;
END $function$
;

CREATE OR REPLACE FUNCTION public.cobrar_periodo_mensualidad_guarderia(p_suscripcion_id uuid, p_periodo_desde date DEFAULT NULL::date, p_intento_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_s record; v_desde date; v_hasta date; v_d record; v_dia smallint;
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

  /* ═══ 🔴 EL ANCLA ES EL DÍA DE CONTRATACIÓN ════════════════════════════
     Firma del founder (31-ago): contrato el 15 ⇒ me cobra el 15 de cada mes.
     Y si el mes no tiene ese día, cobra el último **y RECUPERA el original al
     siguiente**: 31-ene → 28-feb → 31-mar.

     🔴 LO QUE ESTABA MAL Y NADIE HABÍA FIRMADO: `periodo_hasta + 1` **baja el
     día y no vuelve.** Un solo febrero arrastra el cobro al 28 y se queda en 28
     para siempre. *No es una regresión de forma: es la fecha en la que le sale
     plata a una familia todos los meses, corrida sin que nadie lo decidiera.*

     La cuenta parte SIEMPRE del día original guardado, jamás del período
     anterior — eso es lo único que hace posible recuperarlo. La pieza es de
     S108-A (`proximo_cobro_mensual`, IMMUTABLE) y acá se CONSUME. */
  v_desde := COALESCE(p_periodo_desde, v_pagado_el,
                      CASE
                        WHEN v_s.periodo_desde IS NULL OR v_s.dia_de_cobro IS NULL
                          THEN public.hoy_local()
                        ELSE public.proximo_cobro_mensual(v_s.dia_de_cobro, v_s.periodo_desde)
                      END);

  /* El día original se fija en el PRIMER cobro y NO se vuelve a tocar. */
  v_dia := COALESCE(v_s.dia_de_cobro, EXTRACT(day FROM v_desde)::smallint);

  /* `periodo_hasta` deriva del PRÓXIMO ancla, no de «+1 mes −1 día»: en fin de
     mes los dos dan distinto y sólo éste deja los períodos pegados sin hueco. */
  v_hasta := public.proximo_cobro_mensual(v_dia, v_desde) - 1;

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
     SET periodo_desde = v_desde, periodo_hasta = v_hasta,
         dia_de_cobro = v_dia, updated_at = now()
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

CREATE OR REPLACE FUNCTION public.mensualidades_vencidas_pendientes()
 RETURNS TABLE(suscripcion_id uuid, familia_id uuid, prestador_id uuid, tarjeta_id uuid, pagador_user_id uuid, proximo_periodo date, precio_mensual numeric, monto_esperado numeric, dia_de_cobro smallint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT s.id, s.familia_id, s.prestador_id, s.tarjeta_id, s.autorizada_por,
         public.proximo_cobro_mensual(s.dia_de_cobro, s.periodo_desde),
         s.precio_mensual, s.monto_esperado, s.dia_de_cobro
    FROM guarderia_suscripciones s
   WHERE s.estado = 'activa'
     /* Sólo RENUEVA: un mandato que nunca cobró arranca por el checkout
        —«pagar es arrancar»—, no por el reloj. *Dejar que el reloj arranque un
        plan sería cobrarle a una familia el día que el reloj corre y no el día
        que ella contrató.* */
     AND s.periodo_desde IS NOT NULL
     AND s.periodo_hasta IS NOT NULL
     AND s.dia_de_cobro  IS NOT NULL
     /* El período vigente se terminó. */
     AND s.periodo_hasta < public.hoy_local()
     /* 🔴 NO SE RE-COBRA UN PERÍODO YA COBRADO. Se pregunta por el intento del
        próximo período, que es la misma llave que usa el XOR. */
     AND NOT EXISTS (
       SELECT 1 FROM pagos_intentos i
        WHERE i.guarderia_suscripcion_id = s.id
          AND i.guarderia_suscripcion_periodo =
              public.proximo_cobro_mensual(s.dia_de_cobro, s.periodo_desde)
          AND i.estado IN ('iniciado','pendiente','aprobado'))
   ORDER BY s.periodo_hasta;
$function$
;

-- ── LA LLAVE, EXPLÍCITA ───────────────────────────────────────────────────
INSERT INTO app_config (clave, valor)
SELECT 'guarderia_recurrente_vivo', 'false'
 WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE clave='guarderia_recurrente_vivo');

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_n int; v_val text; v_d date;
BEGIN
  -- (a) el nombre viejo MURIÓ (renombre real, no alias)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='guarderia_proximo_cobro';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon: el nombre viejo sigue vivo'; END IF;

  -- (b) NINGÚN llamador quedó apuntando al nombre muerto — se censan los
  --     LLAMADORES, no sólo los consumidores, y sobre el CUERPO SIN COMENTARIOS
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND regexp_replace(regexp_replace(p.prosrc,'/\*.*?\*/','','gs'),'--[^\n]*','','g')
         LIKE '%guarderia_proximo_cobro%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'cinturon: % funcion(es) siguen llamando al nombre muerto', v_n;
  END IF;

  -- (c) la regla SIGUE recuperando el día (el renombre no la tocó)
  v_d := public.proximo_cobro_mensual(31::smallint, DATE '2026-02-28');
  IF v_d <> DATE '2026-03-31' THEN
    RAISE EXCEPTION 'cinturon: el renombre rompio la recuperacion del dia: %', v_d;
  END IF;

  -- (d) 🔴 LA LLAVE EXISTE Y ESTÁ EN FALSO. Falla si no está — que es el estado
  --     que no se podía distinguir de «apagada» — y falla si está encendida.
  SELECT valor INTO v_val FROM app_config WHERE clave='guarderia_recurrente_vivo';
  IF v_val IS NULL THEN
    RAISE EXCEPTION 'cinturon: la llave NO EXISTE — apagado por ausencia no es apagado';
  END IF;
  IF v_val <> 'false' THEN
    RAISE EXCEPTION 'cinturon: la llave nacio ENCENDIDA (%) — la pone el founder', v_val;
  END IF;

  -- (e) y el accesor sigue leyéndola apagada
  IF public.guarderia_recurrente_vivo() IS NOT FALSE THEN
    RAISE EXCEPTION 'cinturon: el accesor no la lee apagada';
  END IF;

  RAISE NOTICE 'cinturon M22: 5/5 OK (nombre viejo muerto · cero llamadores huerfanos · la regla sigue recuperando · la llave EXISTE en falso · el accesor la lee)';
END $c$;

COMMIT;
