-- ═══════════════════════════════════════════════════════════════════════════
-- S108-B2 · LA COMPUERTA PRE-COBRO DE LA MENSUALIDAD
--
-- 🔴 EL HALLAZGO, medido con un cobro REAL contra la edge desplegada
--    (`DF-2107864`, $100, 31-ago): el débito salió, el webhook llegó, autenticó
--    y resolvió el sujeto — y el **acto 2 se cayó**. `duplicate key` sobre el
--    índice `(mascota_id, fecha)`: la mascota ya tenía un día de guardería
--    dentro del mes que el plan iba a comprometer.
--    Resultado: **plata tomada, plan sin arrancar, cero días, cero desglose,
--    cero comprobante.**
--
-- 🔴 Y LA IRONÍA ES QUE EL FRENO YA ESTABA ESCRITO, del lado equivocado del
--    cobro. `cobrar_periodo_mensualidad_guarderia` dice, textual, sobre el
--    cupo: *«FRENA ENTERO. Cobrar un mes y no poder dar todos sus días es
--    vender lo que no se tiene.»* **Correcto — y corre DESPUÉS del débito.**
--    *Un freno que sólo puede actuar cuando la plata ya se movió no evita
--    vender lo que no se tiene: obliga a devolverlo.*
--
-- 🔴 CÓMO SE EVITA LA SEGUNDA VERDAD, que es lo único delicado de esta pieza:
--    la compuerta **no reimplementa** las condiciones del acto. **CORRE EL
--    ACTO** dentro de una subtransacción y la deshace. *Una compuerta que
--    enumera las razones por las que el acto podría fallar es una segunda lista
--    que hay que mantener en sincronía — y el día que el acto gane una razón
--    nueva, la compuerta la aprueba.* Acá no puede divergir: **la compuerta ES
--    el acto**.
--    Se lo llama con `p_intento_id => NULL` a propósito: en este punto el
--    intento todavía no está aprobado —justamente por eso estamos preguntando
--    antes— y el acto sólo exige intento cuando se le pasa uno.
--
-- 🔴 VEDA 76(g): NO RIGE. Función nueva. Cero DDL sobre tablas, cero backfill.
--    Su ensayo interno escribe y **deshace** dentro de su propia subtransacción.
--
-- REVERSA: docs/relevamientos/2026-09-03-s108b2-REVERSA-M3.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.verificar_compuertas_mensualidad_guarderia(
  p_suscripcion_id uuid,
  p_periodo_desde  date
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_causa text; v_sqlstate text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  IF p_suscripcion_id IS NULL OR p_periodo_desde IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'datos_invalidos');
  END IF;

  BEGIN
    /* El acto de verdad, sobre datos de verdad. Si puede, puede. */
    PERFORM cobrar_periodo_mensualidad_guarderia(p_suscripcion_id, p_periodo_desde, NULL);
    /* 🔴 EL ÉXITO SE SEÑALIZA CON UNA EXCEPCIÓN, y no es un truco: es la única
       forma de que **la subtransacción se deshaga también cuando salió bien**.
       *Un ensayo que deja hechas las cosas que ensayó no es un ensayo: es el
       acto, corrido dos veces.* */
    RAISE EXCEPTION '__ENSAYO_OK__';
  EXCEPTION WHEN OTHERS THEN
    v_causa := SQLERRM; v_sqlstate := SQLSTATE;
  END;

  IF v_causa = '__ENSAYO_OK__' THEN
    RETURN jsonb_build_object('ok', true, 'periodo', p_periodo_desde);
  END IF;

  /* 🔴 LA CAUSA VIAJA. El actuador hoy escribe `acto2_fallo` **sin ella** —la
     captura en `v_acto->>'causa'` y sólo publica el `motivo`—, y por eso este
     mismo defecto hubo que reproducirlo a mano para saber qué era. *Un fallo
     que no dice por qué obliga a re-ejecutar el caso, y en pagos re-ejecutar
     es volver a mover plata.* */
  RETURN jsonb_build_object(
    'ok', false,
    'codigo', CASE
      WHEN v_sqlstate = '23505' THEN 'dia_ya_reservado'
      WHEN v_causa LIKE 'sin_cupo_en_el_periodo%' THEN 'sin_cupo_en_el_periodo'
      WHEN v_causa LIKE 'mascota_no_determinada%' THEN 'mascota_no_determinada'
      WHEN v_causa LIKE 'suscripcion_no_activa%' THEN 'mensualidad_no_activa'
      WHEN v_causa LIKE 'sin_medio_autorizado%' THEN 'sin_medio_autorizado'
      ELSE 'mes_no_comprometible' END,
    'causa', left(v_causa, 300), 'sqlstate', v_sqlstate);
END $fn$;

REVOKE ALL ON FUNCTION public.verificar_compuertas_mensualidad_guarderia(uuid, date)
  FROM anon, authenticated, PUBLIC;

COMMENT ON FUNCTION public.verificar_compuertas_mensualidad_guarderia(uuid, date) IS
  'S108-B2 · pregunta si el mes se puede comprometer ANTES de mover plata, '
  'ENSAYANDO el acto real en una subtransacción que se deshace. No enumera '
  'las razones del acto: las hereda, porque es el acto.';

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
/* 🔴 EL ROJO SE FABRICA, NO SE BUSCA — y esta versión existe porque la primera
   lo buscaba. El brazo (a) pedía un mes que la compuerta RECHAZARA y lo tomaba
   del estado de la base: `LIMIT 1` sobre los mandatos activos, confiando en que
   ese mandato tuviera un día ocupado.

   Se cayó por DOS razones a la vez, y ninguna era del motor:
   ① otra pista curó el índice para que las reservas expiradas dejaran de
      bloquear ⇒ los días que producían el rojo quedaron libres;
   ② el `LIMIT 1` pasó a devolver OTRO mandato —uno limpio— porque nacieron
      mandatos nuevos.
   ⇒ **El cinturón reventó como si el motor estuviera mal, y el motor estaba
   bien.** *Un fixture que busca su rojo en el ESTADO de la base deja de
   discriminar el día que alguien cura ese estado — y no avisa: acusa.*

   Ahora ocupa el día ÉL MISMO, dentro de una subtransacción que lo deshace.
   Así el rojo no depende de que la base tenga la forma que a este arnés le
   conviene. */
DO $cinturon$
DECLARE
  v_s record; v_masc uuid; v_dia date; v_evt uuid; v_r jsonb;
  v_antes int; v_despues int; v_libre date;
BEGIN
  SELECT * INTO v_s FROM guarderia_suscripciones WHERE estado='activa' LIMIT 1;
  IF v_s.id IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin suscripción activa con que DISCRIMINAR';
  END IF;

  /* La mascota del mandato, resuelta como la resuelve el acto. */
  v_masc := v_s.mascota_id;
  IF v_masc IS NULL THEN
    SELECT m.id INTO v_masc FROM mascotas m
     WHERE m.familia_id = v_s.familia_id AND m.estado_vida='activa'
       AND public._mascota_elegible_servicio(m.id,'guarderia_dia') LIMIT 1;
  END IF;
  IF v_masc IS NULL THEN
    RAISE EXCEPTION 'CINTURON: el mandato no resuelve mascota — sin ella no hay caso';
  END IF;

  /* Un mes lejano y LIBRE: es el terreno donde se van a correr los dos brazos,
     así el positivo y el negativo miran exactamente el mismo mes. */
  v_libre := (public.hoy_local() + 400);
  SELECT d.fecha INTO v_dia
    FROM public._mensualidad_dias_habiles(v_s.prestador_id, v_libre) d
   WHERE d.opera LIMIT 1;
  IF v_dia IS NULL THEN
    RAISE EXCEPTION 'CINTURON: el prestador no opera ningún día del mes de prueba';
  END IF;

  SELECT count(*) INTO v_antes FROM evento_cita_servicio;

  -- ── (a) CONTROL POSITIVO: el mes libre se puede comprometer ──────────────
  /* Va PRIMERO: si esto no pasa, el rojo de (b) no probaría nada — una
     compuerta que rechaza todo también rechaza un mes ocupado. */
  v_r := verificar_compuertas_mensualidad_guarderia(v_s.id, v_libre);
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON: rechazó un mes LIBRE (%) · %', v_libre, v_r;
  END IF;

  -- ── (b) ROJO FABRICADO: se ocupa UN día de ese mismo mes ─────────────────
  BEGIN
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento,
                                 prestador_id, creado_por_user_id, datos,
                                 visibilidad, country_code)
    SELECT v_masc, 'cita_servicio', cte.eje_jtbd, v_dia::timestamptz,
           v_s.prestador_id, v_s.autorizada_por,
           jsonb_build_object('origen','cinturon_s108b2'),
           cte.visibilidad_default, 'EC'
      FROM cat_tipos_evento cte WHERE cte.codigo='cita_servicio'
    RETURNING id INTO v_evt;

    INSERT INTO evento_cita_servicio (evento_id, user_id, mascota_id, prestador_id,
      tipo_servicio, fecha, precio, estado, estado_reserva, country_code, metadata)
    VALUES (v_evt, v_s.autorizada_por, v_masc, v_s.prestador_id,
            'guarderia_dia', v_dia, 0, 'confirmada', 'pagada', 'EC',
            jsonb_build_object('origen','cinturon_s108b2'));

    v_r := verificar_compuertas_mensualidad_guarderia(v_s.id, v_libre);
    IF (v_r->>'ok')::boolean IS NOT FALSE THEN
      RAISE EXCEPTION 'CINTURON: aprobó un mes con el día % YA OCUPADO · %', v_dia, v_r;
    END IF;
    IF v_r->>'causa' IS NULL THEN
      RAISE EXCEPTION 'CINTURON: rebotó SIN causa — es el defecto que vino a curar';
    END IF;
    RAISE EXCEPTION '__DESHACER_B__';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'CINTURON:%' THEN RAISE; END IF;
    IF SQLERRM <> '__DESHACER_B__' THEN RAISE; END IF;
  END;

  -- ── (c) EL ENSAYO NO DEJA NADA HECHO — ni el suyo ni el del día fabricado ─
  SELECT count(*) INTO v_despues FROM evento_cita_servicio;
  IF v_despues <> v_antes THEN
    RAISE EXCEPTION 'CINTURON: quedaron % citas — el ensayo no se deshizo',
      v_despues - v_antes;
  END IF;

  -- ── (d) permisos ────────────────────────────────────────────────────────
  IF has_function_privilege('authenticated',
        'public.verificar_compuertas_mensualidad_guarderia(uuid,date)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: la compuerta es ejecutable desde el bundle';
  END IF;

  RAISE NOTICE 'CINTURON S108B2-M3 OK · positivo sobre mes libre · rojo FABRICADO con su causa · ensayo sin residuo · permisos';
END $cinturon$;
