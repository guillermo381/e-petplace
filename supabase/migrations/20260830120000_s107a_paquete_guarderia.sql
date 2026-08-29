/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL PAQUETE DE GUARDERÍA — el saldo deja de ser sólo del paseo
   ═══════════════════════════════════════════════════════════════════════════

   **Firma de la mesa:** se ENSANCHA `bonos`. *Un paquete de guardería y uno de
   paseos son el mismo objeto financiero: compra única, consumo por sesión,
   FIFO, desglose congelado al comprar.* Una tabla propia daría **dos verdades
   de «saldo de sesiones»**, que es 19.9 esperando.

   ═══ ① EL CENSO DE LECTORES `'paseo'` — PARTE DE LA FIRMA, no un paso previo ══
   **Siete lectores medidos, cada uno decidido CON NOMBRE:**

   | lector | veredicto |
   |---|---|
   | `comprar_paquete_salidas` | **filtra bien** — es el comprador DE PASEO; el de guardería nace acá al lado |
   | `reservar_salida_paquete` | **filtra bien** — reserva una salida con hora, slot y empleado; guardería es día |
   | `cancelar_reserva_paquete` | **filtra bien** — su pantalla es de paseo. *Guardería cancela por `P24`, que devuelve el día al saldo: función hermana, no ésta* |
   | `obtenerMisPaquetesSalidas` (repo) | **filtra bien** — alimenta el hub de paseos y su rail; guardería tiene su propio lector |
   | `obtenerSaldoPaquete` (repo) | **filtra bien** — mismo motivo |
   | `validar_origen_evento` | **no filtra y está bien**: sólo verifica que el id exista |
   | 🔴 **`vencer_paquetes_salidas`** | **SE ENSANCHA** |

   > ### 🔴 Y EL ÚNICO QUE HABÍA QUE ENSANCHAR ES EL QUE NO TIENE PANTALLA.
   >
   > `vencer_paquetes_salidas` es un **cron**. Filtrando `'paseo'`, **los
   > paquetes de guardería no vencerían NUNCA** y su breakage no se registraría
   > — *sin error, sin síntoma, y con plata de por medio.* Es exactamente el
   > defecto que la firma anticipó: **un lector que filtra `'paseo'` sigue verde
   > mientras esconde los bonos nuevos.**

   ⚠️ **PERO SÓLO SU RAMA DE VENCIMIENTO. El AVISO se queda en paseo, y es
   decisión:** su voz (`paquete_vence`) dice **«te quedan N salidas»** — palabra
   del paseo. *No avisar es un hueco; avisar con la palabra de otro oficio es una
   mentira, y esta sesión ya cazó tres de ésas.* Ficha: `D-977`.

   ═══ ② EL COMPRADOR ═══════════════════════════════════════════════════════
   Molde de `comprar_paquete_salidas`, con tres diferencias medidas:
   · el precio sale de **`guarderia_paquetes` (la TABLA)**, no de la columna
     `precio_paquete` — que está `NULL` y es del molde de otro oficio;
   · **sin `duracion_minutos` de slot**: guardería es un DÍA;
   · **el tamaño se valida contra la tabla**, no contra `IN (5,10,15)`
     hardcodeado: *los tres presets son DATO del prestador.*

   **Rollover igual que el paseo** (P16e): comprar extiende la vigencia de lo que
   quedaba. **Comprar NO es reservar:** el INSERT a `bonos` es la ÚNICA
   escritura — cero citas.

   ═══ ③ RESERVAR UN DÍA CON SÓLO `(bono, fecha)` ═══════════════════════════
   🔴 **La entrada NO lleva prestador** (firma del founder): *cuando la familia
   ya tiene saldo, el lugar está determinado por el paquete.* Pedirlo sería
   ofrecerle elegir algo que ya eligió — y abrir la puerta a que elija MAL.

   **Cero cobro:** el desglose se congeló al comprar (`_trg_bono_congela_desglose`).
   Las compuertas corren enteras igual: víspera, día operativo, cupo, requisitos.

   **76(g): NO RIGE.** El CHECK se amplía sin backfill (0 filas de guardería) y
   las funciones son nuevas o aditivas.
   **Reversa:** `S107-A-REVERSA-paquete-guarderia.sql` — declara que **revertir
   el CHECK falla si ya hay bonos de guardería, y que eso es correcto.**
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① EL VOCABULARIO SE ENSANCHA (firma de mesa) ═════════════════════════
ALTER TABLE public.bonos DROP CONSTRAINT bonos_tipo_valido;
ALTER TABLE public.bonos ADD CONSTRAINT bonos_tipo_valido
  CHECK (tipo_servicio IN ('paseo', 'guarderia_dia'));

-- ══ ② EL CRON QUE VENCE — su rama de vencimiento mira los dos ════════════
CREATE OR REPLACE FUNCTION public.vencer_paquetes_salidas()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_bono      record;
  v_restantes int;
  v_moneda    text;
  v_aviso_key text;
  v_avisados  int := 0;
  v_vencidos  int := 0;
  v_breakage  numeric(14,2) := 0;
  v_monto     numeric(14,2);
BEGIN
  -- (a) el recordatorio: UNO y sereno, cerca del cierre (P16e).
  FOR v_bono IN
    SELECT * FROM bonos
    WHERE tipo_servicio = 'paseo'   /* ⚠️ EL AVISO SE QUEDA EN PASEO — ver la migración */ AND estado = 'activo' AND estado_pago = 'pagado'
      AND unidades_usadas < unidades_total
      AND fecha_vencimiento >= v_hoy AND fecha_vencimiento <= v_hoy + 3
    FOR UPDATE
  LOOP
    v_aviso_key := 'aviso_vencimiento_' || v_bono.fecha_vencimiento::text;
    IF NOT (v_bono.pago_metadata ? v_aviso_key) THEN
      -- S87 · LOTE 1: pasa por LA PUERTA. Cambios que esto trae, declarados:
      --  · el tipo deja de ser 'sistema' (que mapeaba a seguridad_cuenta y por
      --    lo tanto SOBREVIVÍA AL MEMORIAL) y pasa a `paquete_vence` →
      --    `saldo_pagado`. Es el aviso literal de P16(e).
      --  · viaja `mascota_id` para que el gate 1 pueda evaluarlo. Si el bono no
      --    la tiene, va NULL y el gate NO aplica — y el lector lo dice; no se
      --    finge que evaluó.
      --  · la clave de dedup reusa la MISMA llave que ya gobernaba el aviso
      --    (`aviso_vencimiento_<fecha>`), así el candado de idempotencia del
      --    motor y el de esta función dicen lo mismo en vez de competir.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'paquete_vence',
        p_destinatario_user_id => v_bono.user_id,
        p_mascota_id           => v_bono.mascota_id,
        p_evento_id            => NULL,
        p_datos                => jsonb_build_object(
          'subtipo', 'paquete_vencimiento',
          'bono_id', v_bono.id,
          'salidas_restantes', v_bono.unidades_total - v_bono.unidades_usadas,
          'vence_el', v_bono.fecha_vencimiento
        )
            || public._voz_notificacion('paquete_vence', v_bono.user_id, v_bono.mascota_id, jsonb_build_object('restantes', (v_bono.unidades_total - v_bono.unidades_usadas)::text, 'vence', to_char(v_bono.vigencia_hasta,'DD/MM'))),
        p_clave_dedup          => 'bono:' || v_bono.id || ':' || v_aviso_key
      );
      UPDATE bonos SET pago_metadata = pago_metadata || jsonb_build_object(v_aviso_key, now())
      WHERE id = v_bono.id;
      v_avisados := v_avisados + 1;
    END IF;
  END LOOP;

  -- (b) el vencimiento: breakage DECLARADO (Decisión T).
  FOR v_bono IN
    SELECT * FROM bonos
    WHERE tipo_servicio IN ('paseo','guarderia_dia')   /* ✏️ EL VENCIMIENTO SÍ */ AND estado = 'activo'
      AND fecha_vencimiento < v_hoy
    FOR UPDATE
  LOOP
    v_restantes := v_bono.unidades_total - v_bono.unidades_usadas;

    UPDATE bonos SET estado = 'vencido' WHERE id = v_bono.id;
    v_vencidos := v_vencidos + 1;

    IF v_restantes > 0 AND v_bono.estado_pago = 'pagado'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'bono' AND ee.origen_id = v_bono.id
           AND ee.tipo_evento = 'bono_breakage'
       )
    THEN
      v_monto := round(v_restantes * COALESCE(v_bono.precio_por_unidad, 0), 2);
      SELECT cc.moneda INTO v_moneda
      FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_bono.prestador_id;

      PERFORM crear_evento_economico(
        p_tipo_evento         => 'bono_breakage'::tipo_evento_economico_enum,
        p_revenue_stream      => 'eventual'::revenue_stream_enum,
        p_cuenta_comercial_id => NULL,   -- revenue puro plataforma: sin payout
        p_country_code        => v_bono.country_code,
        p_moneda              => COALESCE(v_moneda, 'USD'),
        p_monto_bruto         => v_monto,
        p_monto_kushki_fee    => 0,      -- simulación honesta
        p_origen_tipo         => 'bono',
        p_origen_id           => v_bono.id,
        p_fecha_devengo       => now(),
        p_fecha_cobro_kushki  => (v_bono.pago_metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object(
          'pago_simulado', true, 'via', 'vencer_paquetes_salidas',
          'salidas_vencidas', v_restantes,
          'precio_por_unidad', v_bono.precio_por_unidad
        )
      );
      v_breakage := v_breakage + v_monto;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'vencidos', v_vencidos,
    'breakage_total', v_breakage, 'corrida_en', now()
  );
END;
$function$
;


-- ══ ③ EL COMPRADOR ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.comprar_paquete_guarderia(
  p_prestador_id uuid, p_tamano integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
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
END $fn$;

-- ══ ④ RESERVAR UN DÍA CON SÓLO (bono, fecha) ═════════════════════════════
CREATE OR REPLACE FUNCTION public.reservar_dia_de_paquete_guarderia(
  p_bono_id uuid, p_fecha date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth uuid := auth.uid(); v_familia uuid; v_b record; v_gate jsonb;
  v_cupo jsonb; v_evt uuid; v_cita uuid; v_est uuid; v_eje text;
  v_vis jsonb; v_country text; v_dir jsonb; v_saldo int; v_masc uuid;
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
  v_masc := v_b.mascota_id;
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
  v_gate := public._guarderia_puede_reservar(v_masc);
  IF COALESCE(v_gate->>'puede','false') <> 'true' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE = COALESCE(v_gate->>'motivo','requisitos_sanitarios');
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('guarderia:'||v_b.prestador_id::text||':'||p_fecha::text, 0));
  v_cupo := public.cupo_guarderia_del_dia(v_b.prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN RAISE EXCEPTION 'sin_cupo' USING ERRCODE='22023'; END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id=v_masc;
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
          v_b.precio_por_unidad, NULL, 'confirmada', 'pagada',
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
END $fn$;

REVOKE EXECUTE ON FUNCTION public.comprar_paquete_guarderia(uuid,integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reservar_dia_de_paquete_guarderia(uuid,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comprar_paquete_guarderia(uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reservar_dia_de_paquete_guarderia(uuid,date) TO authenticated;

COMMIT;
