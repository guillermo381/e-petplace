/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA MENSUALIDAD: cupo comprometido, cobro y cancelación
   ═══════════════════════════════════════════════════════════════════════════

   ═══ 🟢 LA FIRMA QUE LO ORDENA (founder, 29-ago-2026) ═══════════════════
   > ### **EL MENSUAL ES DE LUNES A VIERNES, SIEMPRE.**
   > **Aunque el lugar abra sábados y domingos, el plan no los cubre.** Una
   > familia que quiera llevar al animal un sábado **paga día suelto o usa un
   > paquete.**

   ── 🔴 POR QUÉ NO HAY COLUMNA DE DÍAS, Y NO ES UN OLVIDO ────────────────
   `guarderia_suscripciones` **no gana `dias_cubiertos`, y es deliberado:**

   > **L-V es CONSTANTE DEL PRODUCTO, no configuración del prestador.**
   >
   > *Una columna la volvería negociable lugar por lugar — y entonces «el plan
   > mensual» dejaría de significar lo mismo en dos guarderías, que es
   > exactamente lo que un plan no puede permitirse.*

   **Se escribe acá con esa razón para que nadie la agregue después creyendo que
   faltaba.** ☠️ Si algún día la mesa firma que el prestador elige sus días, la
   columna nace **con esa firma citada**, no porque parezca un hueco.

   ── LAS TRES PIEZAS ──────────────────────────────────────────────────────
   ① **El cupo comprometido** = las estadías de **los días hábiles del período**,
     en ESA guardería. *El cupo de esta casa se consume por estadías* (medido en
     `cupo_guarderia_del_dia`), así que comprometerlo **es crearlas**.
   ② **El cobro** corre sobre el mandato que ya existe (`D-886` no se repite).
   ③ **La cancelación** corre hasta el fin del período pagado — `P24` ya declara
     que la mensualidad **no se cancela por sus tres ventanas**.

   🔴 **EL COBRO FRENA SI NO PUEDE COMPROMETER TODOS LOS DÍAS**, y dice cuál
   falló. *Cobrar un mes y no poder dar todos sus días es vender lo que no se
   tiene* — y el que se entera después es el dueño, en la puerta.

   ⚠️ **Los días hábiles que el lugar NO opera no se comprometen y se DECLARAN**
   (`habiles` vs `comprometidos` en el retorno). *No se inventa una política de
   descuento: se dice el número y la mesa decide si alguna vez importa.*

   ── ⏸️ EL RELOJ QUEDA INERTE ─────────────────────────────────────────────
   **No se agenda ningún cron.** Las tres claves de `app_config` son del founder
   y van últimas. *Un cable que se tiende bajo presión se tiende mal* — el motor
   queda completo y esperando su llave.

   **76(g): NO RIGE.** **Reversa:** `S107-A-REVERSA-mensualidad-motor.sql`, que
   declara que **NO deshace las estadías de un período ya cobrado**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① LOS DÍAS DEL PERÍODO — L-V, y el helper es la única fuente ═════════
CREATE OR REPLACE FUNCTION public._mensualidad_dias_habiles(
  p_prestador_id uuid, p_desde date)
RETURNS TABLE(fecha date, opera boolean)
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_temp'
AS $fn$
  /* El período: del día de inicio a la VÍSPERA del mismo número del mes
     siguiente. `EXTRACT(dow) BETWEEN 1 AND 5` **es la firma L-V**, y vive acá
     UNA vez: las tres piezas de abajo la leen de este helper. */
  SELECT d::date,
         public._guarderia_dia_operativo(p_prestador_id, d::date)
    FROM generate_series(p_desde,
                         (p_desde + interval '1 month' - interval '1 day')::date,
                         '1 day') d
   WHERE EXTRACT(dow FROM d)::int BETWEEN 1 AND 5;
$fn$;

-- ══ ② EL COBRO DEL PERÍODO ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.cobrar_periodo_mensualidad_guarderia(
  p_suscripcion_id uuid, p_periodo_desde date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_s record; v_desde date; v_hasta date; v_d record;
  v_habiles int := 0; v_comprometidos int := 0; v_masc uuid;
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

  v_desde := COALESCE(p_periodo_desde,
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
            jsonb_build_object('origen','mensualidad','suscripcion_id',v_s.id,
                               'pago_simulado', true, 'periodo_desde', v_desde))
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
    'precio_mensual', v_s.precio_mensual, 'pago_simulado', true);
END $fn$;

-- ══ ③ LA CANCELACIÓN — corre hasta el fin del período pagado ═════════════
CREATE OR REPLACE FUNCTION public.cancelar_mensualidad_guarderia(p_suscripcion_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v_s record; v_auth uuid := auth.uid(); v_quedan int;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_s FROM guarderia_suscripciones WHERE id=p_suscripcion_id FOR UPDATE;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'suscripcion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM familia_miembro fm
                  WHERE fm.familia_id=v_s.familia_id AND fm.user_id=v_auth AND fm.hasta IS NULL) THEN
    RAISE EXCEPTION 'no_sos_de_esta_familia' USING ERRCODE='42501';
  END IF;
  IF v_s.estado = 'cancelada' THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'corre_hasta', v_s.periodo_hasta);
  END IF;

  UPDATE guarderia_suscripciones
     SET estado='cancelada', cancelada_en=now(), updated_at=now()
   WHERE id=v_s.id;

  /* 🔴 LAS ESTADÍAS DEL PERÍODO PAGADO **NO SE TOCAN** (`P24`): *corre hasta el
     fin del período pagado, sin reintegro.* Cancelarlas sería quitarle a la
     familia días que ya pagó. **Lo que muere es la SERIE: no habrá próximo
     cobro, y por lo tanto no habrá cupo comprometido más allá de este período.* */
  SELECT count(*) INTO v_quedan
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id=g.cita_id
   WHERE c.prestador_id=v_s.prestador_id
     AND c.metadata->>'suscripcion_id' = v_s.id::text
     AND c.fecha >= public.hoy_local() AND g.estado NOT IN ('cancelada');

  RETURN jsonb_build_object('ok', true, 'ya_estaba', false,
    'corre_hasta', v_s.periodo_hasta, 'dias_que_conserva', v_quedan,
    'reintegro', false);
END $fn$;

REVOKE EXECUTE ON FUNCTION public._mensualidad_dias_habiles(uuid,date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cobrar_periodo_mensualidad_guarderia(uuid,date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancelar_mensualidad_guarderia(uuid) FROM PUBLIC, anon;
/* 🔴 El COBRO no lo llama una app: lo llama el reloj. `authenticated` fuera. */
GRANT EXECUTE ON FUNCTION public.cobrar_periodo_mensualidad_guarderia(uuid,date) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_mensualidad_guarderia(uuid) TO authenticated;

DO $cint$
DECLARE v_n int; v_acl text;
BEGIN
  /* 🔴 EL DISCRIMINADOR DE LA FIRMA: el helper devuelve SÓLO L-V. Un período de
     un mes tiene 20-23 hábiles y ~30 días: si devolviera fines de semana, el
     conteo se iría a 30 y el cupo comprometido sería el doble de lo vendido. */
  SELECT count(*) INTO v_n FROM public._mensualidad_dias_habiles(
    (SELECT prestador_id FROM prestador_servicios WHERE tipo_servicio='guarderia_dia' LIMIT 1),
    date '2026-09-01');
  IF v_n < 20 OR v_n > 23 THEN
    RAISE EXCEPTION 'CINTURON: el periodo devolvio % dias — no son los habiles de un mes', v_n;
  END IF;
  IF EXISTS (SELECT 1 FROM public._mensualidad_dias_habiles(
              (SELECT prestador_id FROM prestador_servicios WHERE tipo_servicio='guarderia_dia' LIMIT 1),
              date '2026-09-01') d
             WHERE EXTRACT(dow FROM d.fecha)::int IN (0,6)) THEN
    RAISE EXCEPTION 'CINTURON: el periodo trajo un sabado o domingo — la firma L-V no se respeta';
  END IF;

  SELECT array_to_string(proacl,' ') INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='cobrar_periodo_mensualidad_guarderia';
  IF v_acl ILIKE '%authenticated=%' THEN
    RAISE EXCEPTION 'CINTURON: el COBRO quedo alcanzable por una app (proacl=%)', v_acl;
  END IF;

  RAISE NOTICE 'CINTURON VERDE · % habiles, cero fines de semana · el cobro NO es alcanzable por authenticated · reloj INERTE (sin cron)', v_n;
END
$cint$;

COMMIT;
