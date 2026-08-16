-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · LA PROMESA ANTES DE COMPRAR — MI MITAD (firma del founder 18-ago)
--
-- LA FIRMA: *«no tenemos disponibilidad para entrega mañana en la mañana,
-- te lo podríamos entregar en la tarde. ¿Querés continuar?»* — y **el
-- MOMENTO es la mitad de la firma: decirlo DESPUÉS de comprar es una
-- disculpa; decirlo ANTES es información, y la persona todavía puede
-- elegir.** Hoy la promesa se computa al CHECKOUT; esto la trae a la
-- vitrina/ficha.
--
-- CERO MOTOR NUEVO — COMPONE, no re-deriva: `calcular_promesa_despensa` ya
-- camina los cortes (consulta `cupo_reparto_del_dia`, SALTA al día con
-- capacidad, techo 14, devuelve `saltos_por_cupo` y sus errores tipados).
-- Esta función solo la llama POR VENDEDOR y junta las respuestas.
--
-- 🔴 POR VENDEDOR, JAMÁS POR PRODUCTO — y es la decisión de diseño que la
-- vuelve barata: la promesa depende de la CUENTA y el día, no del SKU. Con
-- ~400 productos en vitrina y 5 vendedores, son **5 evaluaciones**, no 400
-- (medido en la tanda anterior: ~5 ms para las cinco). El que llame pasa
-- los vendedores DISTINTOS de lo que va a pintar.
--
-- ⚠️ LO QUE NO HACE: no elige quién gana (eso es la cadena firmada, con ③
-- sin dato) y no escribe nada. Es lectura pura.
--
-- 76(g): NO RIGE — función de lectura. Reversa ANTES:
-- docs/relevamientos/2026-08-18-s99a-REVERSA-promesa-por-vendedor.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.promesa_por_vendedor(
  p_cuentas uuid[],
  p_fecha_programada date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_cuenta uuid;
  v_r      jsonb;
  v_out    jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  IF p_cuentas IS NULL OR cardinality(p_cuentas) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'promesas', '[]'::jsonb);
  END IF;
  -- Techo declarado: una vitrina puede tener muchos productos, pero pocos
  -- vendedores. 50 es holgadísimo para v1 y evita que un caller distraído
  -- convierta un lector barato en N llamadas al motor.
  IF cardinality(p_cuentas) > 50 THEN
    RAISE EXCEPTION 'demasiados_vendedores';
  END IF;

  FOREACH v_cuenta IN ARRAY p_cuentas LOOP
    -- La promesa entera del motor, TAL CUAL — incluidos sus errores
    -- tipados (`sin_turnos_de_entrega` · `sin_capacidad_de_reparto`): la
    -- superficie los DICE, jamás los traduce a un vacío (L-218).
    v_r := public.calcular_promesa_despensa(v_cuenta, now(), p_fecha_programada, 'estandar');
    v_out := v_out || jsonb_build_object(
      'cuenta_comercial_id', v_cuenta,
      'promesa', v_r
    );
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'promesas', v_out);
END $$;

REVOKE EXECUTE ON FUNCTION public.promesa_por_vendedor(uuid[], date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promesa_por_vendedor(uuid[], date) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — con los DOS caminos que la voz necesita distinguir: el que
-- promete y el que no puede prometer (y lo DICE, no calla).
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_r       jsonb;
  v_p       jsonb;
  v_err     text;
  -- Despensa de Pruebas (2 turnos, con recurso) · Clínica Aurora (0 turnos
  -- activos medidos: es el caso «no puedo prometer» y tiene que HABLAR).
  v_con  uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_sin  uuid := 'de680000-0000-4000-8000-0000000000cc';
BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.promesa_por_vendedor(ARRAY[v_con, v_sin], NULL);
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  IF (v_r ->> 'ok') IS DISTINCT FROM 'true'
     OR jsonb_array_length(v_r -> 'promesas') <> 2 THEN
    RAISE EXCEPTION 'CINTURÓN ①: esperaba 2 promesas — %', v_r;
  END IF;

  -- Brazo ② — el que SÍ puede: trae fecha, turno y saltos_por_cupo (la
  -- señal con la que la voz dice «no mañana, sino el X»).
  SELECT (e -> 'promesa') INTO v_p FROM jsonb_array_elements(v_r -> 'promesas') e
  WHERE (e ->> 'cuenta_comercial_id')::uuid = v_con;
  IF (v_p ->> 'ok') IS DISTINCT FROM 'true'
     OR (v_p ->> 'fecha') IS NULL
     OR NOT (v_p ? 'saltos_por_cupo') THEN
    RAISE EXCEPTION 'CINTURÓN ②: la promesa del vendedor con turnos no sirve para la voz — %', v_p;
  END IF;

  -- Brazo ③ — el que NO puede: responde con ERROR TIPADO, jamás con vacío
  -- (la superficie lo DICE; L-218: un vacío tendría dos significados).
  SELECT (e -> 'promesa') INTO v_p FROM jsonb_array_elements(v_r -> 'promesas') e
  WHERE (e ->> 'cuenta_comercial_id')::uuid = v_sin;
  IF (v_p ->> 'ok') IS DISTINCT FROM 'false' OR (v_p ->> 'error') IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN ③: el vendedor sin turnos no dijo su razón — %', v_p;
  END IF;

  -- Brazo ④ — el techo habla.
  BEGIN
    PERFORM set_config('request.jwt.claims',
      '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
    SET LOCAL ROLE authenticated;
    v_r := public.promesa_por_vendedor(
      (SELECT array_agg(v_con) FROM generate_series(1, 51)), NULL);
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ④: el techo NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    v_err := SQLERRM;
    IF v_err NOT LIKE 'demasiados_vendedores%' THEN
      RAISE EXCEPTION 'CINTURÓN ④: rebotó por otra razón — %', v_err;
    END IF;
  END;

  -- Brazo ⑤ — L-140.
  IF has_function_privilege('anon', 'public.promesa_por_vendedor(uuid[], date)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ⑤ (L-140): anon tiene EXECUTE';
  END IF;

  RAISE NOTICE 'CINTURÓN promesa: ①②③④⑤ verdes — el que promete trae saltos_por_cupo; el que no puede DICE su razón';
END $$;
