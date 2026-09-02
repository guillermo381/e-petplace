-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · LA ESPECIE EN LA PUERTA QUE CREA LAS ESTADÍAS DE LA MENSUALIDAD
--
-- Orden del founder. `D-1001` nombraba UNA puerta; el censo por causa encontró
-- que la mensualidad tiene DOS momentos y el guard sólo estaba en el primero.
-- 76(g) — NO RIGE: sin backfill, sin anclas. El cuerpo entero se re-crea.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cobrar_periodo_mensualidad_guarderia(p_suscripcion_id uuid, p_periodo_desde date DEFAULT NULL::date, p_intento_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_s record; v_desde date; v_hasta date; v_d record; v_dia smallint; v_cong jsonb;
  v_habiles int := 0; v_comprometidos int := 0; v_masc uuid; v_pagado_el date;
  v_cupo jsonb; v_evt uuid; v_cita uuid; v_eje text; v_vis jsonb;
  v_country text; v_dir jsonb; v_jornada int; v_serv uuid;
BEGIN
  SELECT * INTO v_s FROM guarderia_suscripciones WHERE id = p_suscripcion_id FOR UPDATE;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'suscripcion_no_existe' USING ERRCODE='22023'; END IF;
  IF v_s.estado <> 'activa' THEN RAISE EXCEPTION 'suscripcion_no_activa' USING ERRCODE='22023'; END IF;

  
  IF v_s.tarjeta_id IS NULL OR v_s.autorizada_por IS NULL THEN
    RAISE EXCEPTION 'sin_medio_autorizado' USING ERRCODE='22023';
  END IF;

  
  IF p_intento_id IS NOT NULL THEN
    SELECT (COALESCE(i.cerrado_en, i.actualizado_en) AT TIME ZONE 'America/Guayaquil')::date
      INTO v_pagado_el
      FROM pagos_intentos i
     WHERE i.id = p_intento_id AND i.estado = 'aprobado';
    
    IF v_pagado_el IS NULL THEN
      RAISE EXCEPTION 'intento_no_aprobado' USING ERRCODE='22023';
    END IF;
  END IF;

  
  v_desde := COALESCE(p_periodo_desde, v_pagado_el,
                      CASE
                        WHEN v_s.periodo_desde IS NULL OR v_s.dia_de_cobro IS NULL
                          THEN public.hoy_local()
                        ELSE public.proximo_cobro_mensual(v_s.dia_de_cobro, v_s.periodo_desde)
                      END);

  
  v_dia := COALESCE(v_s.dia_de_cobro, EXTRACT(day FROM v_desde)::smallint);

  
  v_hasta := public.proximo_cobro_mensual(v_dia, v_desde) - 1;

  
  
  v_cong := public.congelar_desglose_mensualidad_guarderia(v_s.id, v_desde);
  IF COALESCE((v_cong->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'desglose_no_congelado: %', COALESCE(v_cong->>'codigo','?')
      USING ERRCODE='22023';
  END IF;

  SELECT ps.id, ps.duracion_minutos INTO v_serv, v_jornada
    FROM prestador_servicios ps WHERE ps.id = v_s.prestador_servicio_id;

  v_masc := v_s.mascota_id;

  /* ═══ LA ESPECIE, EN LA PUERTA QUE CREA LAS ESTADÍAS ════════════════════
     🔴 `D-1001` describía **una** puerta y el censo por causa encontró que la
     mensualidad tiene **DOS momentos**: `contratar_*` (firma el mandato, y ahí
     el guard SÍ estaba) y **ésta, que es la que CREA las estadías cuando corre
     el reloj**. *Un mandato firmado antes de que el guard existiera sigue vivo
     y el reloj lo honra sin preguntar nada* — así hay un ave con plan de un
     servicio de perros y gatos, y su fila sigue `activa` hoy.

     ⚠️ **Va acá y no en el reloj**: el reloj llama a esta función y **nadie
     está presente**. *Si el freno viviera en quien llama, cada llamador nuevo
     tendría que acordarse* — y el que no se acuerde crea las estadías igual.

     Se usa **`_mascota_elegible_servicio`, la misma pieza que las otras
     puertas**, jamás una segunda lectura de `especies_elegibles`: *dos
     implementaciones de la misma regla se desincronizan el día que alguien
     agregue una especie.*

     Nota de alcance MEDIDA: `comprar_paquete_guarderia(prestador, tamaño)`
     **no recibe mascota y por eso NO lleva este guard** — el saldo es del
     HOGAR (firma del founder, S109: *lo que es por mascota es el USO, no el
     SALDO*). Su compuerta de uso, `reservar_dia_de_paquete_guarderia`, sí
     valida. *Meterle un parámetro de mascota a la compra para poder validar
     ahí sería cambiar el modelo del bono para satisfacer a un guard.* */
  IF v_masc IS NOT NULL
     AND NOT public._mascota_elegible_servicio(v_masc, 'guarderia_mensual') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE='22023';
  END IF;

  

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id=v_masc;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_vis
    FROM cat_tipos_evento cte WHERE cte.codigo='cita_servicio';
  v_dir := public._direccion_hogar_snapshot(v_s.autorizada_por);

  PERFORM pg_advisory_xact_lock(
    hashtextextended('guarderia:mensual:'||v_s.prestador_id::text||':'||v_desde::text, 0));

  FOR v_d IN SELECT * FROM public._mensualidad_dias_habiles(v_s.prestador_id, v_desde) LOOP
    v_habiles := v_habiles + 1;
    
    CONTINUE WHEN NOT v_d.opera;

    v_cupo := public.cupo_guarderia_del_dia(v_s.prestador_id, v_d.fecha);
    IF (v_cupo->>'disponible')::int <= 0 THEN
      
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
            
            0, v_jornada, 'confirmada','pagada', COALESCE(v_country,'EC'), v_dir,
            
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
    
    'habiles_sin_operacion', v_habiles - v_comprometidos,
    'precio_mensual', v_s.precio_mensual, 'intento_id', p_intento_id,
    'anclado_en', CASE WHEN v_pagado_el IS NOT NULL THEN 'pago_confirmado' ELSE 'periodo_previo' END);
END $function$

;

REVOKE ALL ON FUNCTION public.cobrar_periodo_mensualidad_guarderia(uuid, date, uuid) FROM anon, PUBLIC;

-- ═══ CINTURÓN — el ROJO primero, sobre los dos casos REALES ═══
-- L-459: la primera prueba de un guard nuevo no es que dé verde, es que dé
-- ROJO sobre el primer caso real. Acá hay dos vivos y tienen que dar DISTINTO.
DO $c$
DECLARE v_ave uuid; v_perro uuid; v_ok boolean;
BEGIN
  /* El ave con plan activo — el caso que motivó la orden. */
  SELECT s.id INTO v_ave
    FROM guarderia_suscripciones s JOIN mascotas m ON m.id = s.mascota_id
   WHERE m.especie NOT IN ('perro','gato') AND s.estado = 'activa' LIMIT 1;

  /* Y un perro con plan, de cualquier estado — el control positivo. */
  SELECT s.id INTO v_perro
    FROM guarderia_suscripciones s JOIN mascotas m ON m.id = s.mascota_id
   WHERE m.especie = 'perro' LIMIT 1;

  IF v_ave IS NULL THEN
    /* No se inventa un ave para que el cinturón pase: se DICE que el brazo
       no se pudo ejercer. Un verde que no midió nada es peor que un hueco. */
    RAISE NOTICE 'CINTURON: no hay plan de especie no elegible — el ROJO no se pudo ejercer';
  ELSE
    SELECT public._mascota_elegible_servicio(s.mascota_id,'guarderia_mensual')
      INTO v_ok FROM guarderia_suscripciones s WHERE s.id = v_ave;
    IF v_ok THEN
      RAISE EXCEPTION 'CINTURON: el guard deja pasar al plan % que NO es de especie elegible', v_ave;
    END IF;
    RAISE NOTICE 'CINTURON ROJO OK: el plan % (especie no elegible) NO puede crear estadias', v_ave;
  END IF;

  IF v_perro IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin un plan de perro no hay control positivo — el rojo no prueba nada';
  END IF;
  SELECT public._mascota_elegible_servicio(s.mascota_id,'guarderia_mensual')
    INTO v_ok FROM guarderia_suscripciones s WHERE s.id = v_perro;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'CINTURON: el guard TAMBIEN frena a un perro — no discrimina, rompe el servicio';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: el plan de perro % SI puede crear estadias', v_perro;

  /* Y que el guard esté REALMENTE en el cuerpo nuevo, no sólo en esta prueba. */
  IF (SELECT regexp_replace(prosrc,'/\*.*?\*/','','gs') FROM pg_proc p
        JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='cobrar_periodo_mensualidad_guarderia')
     NOT ILIKE '%_mascota_elegible_servicio%' THEN
    RAISE EXCEPTION 'CINTURON: el guard no quedo en el cuerpo (se perdio al re-crear, L-119)';
  END IF;
END $c$;
