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
DO $cinturon$
DECLARE v_s uuid; v_r jsonb; v_antes int; v_despues int; v_libre date;
BEGIN
  SELECT id INTO v_s FROM guarderia_suscripciones WHERE estado='activa' LIMIT 1;
  IF v_s IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin suscripción activa con que DISCRIMINAR';
  END IF;

  SELECT count(*) INTO v_antes FROM evento_cita_servicio;

  -- (a) 🔴 EL ROJO REAL, reproducido: hoy el mes choca con un día ya reservado.
  v_r := verificar_compuertas_mensualidad_guarderia(v_s, public.hoy_local());
  IF (v_r->>'ok')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON: aprobó un mes que el acto NO puede comprometer · %', v_r;
  END IF;
  IF v_r->>'causa' IS NULL THEN
    RAISE EXCEPTION 'CINTURON: rebotó SIN causa — es el defecto que vino a curar';
  END IF;

  -- (b) 🔴 CONTROL POSITIVO: un mes lejano, que sí se puede comprometer.
  --     Sin esto, una compuerta que rechaza TODO también pasaría (a).
  v_libre := (public.hoy_local() + 400);
  v_r := verificar_compuertas_mensualidad_guarderia(v_s, v_libre);
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON: rechazó un mes libre (%) · % — una compuerta que '
      'siempre dice que no también rebota', v_libre, v_r;
  END IF;

  -- (c) 🔴 EL ENSAYO NO DEJA NADA HECHO. Es la mitad que lo vuelve un ensayo.
  SELECT count(*) INTO v_despues FROM evento_cita_servicio;
  IF v_despues <> v_antes THEN
    RAISE EXCEPTION 'CINTURON: el ensayo COMPROMETIÓ % citas — no se deshizo',
      v_despues - v_antes;
  END IF;

  -- (d) permisos
  IF has_function_privilege('authenticated',
        'public.verificar_compuertas_mensualidad_guarderia(uuid,date)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: la compuerta es ejecutable desde el bundle';
  END IF;

  RAISE NOTICE 'CINTURON S108B2-M3 OK · rojo real con causa · positivo sobre mes libre · ensayo sin residuo · permisos';
END $cinturon$;
