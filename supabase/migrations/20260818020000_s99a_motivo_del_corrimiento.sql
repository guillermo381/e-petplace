-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · EL CAMPO QUE PROMETÍA UNA CAUSA Y CONTABA OTRA (rojo de C, 18-ago)
--
-- EL ROJO, medido por C con sesión real: dos vendedores prometían el 17 con
-- `saltos_por_cupo: 1` **Y EL CUPO VACÍO** (capacidad 15/20, consumido 0).
-- *«La app diría "no tenemos disponibilidad para mañana" con 15 de 15
-- libres» — verosímil-pero-falso en su forma más cara, y el que queda mal
-- es el VENDEDOR, que pierde una venta por una escasez que no existe.*
--
-- 🔴 LA CAUSA, MEDIDA (y descarta la hipótesis más probable de la mesa):
-- **NO es un borde de hora UTC/local** — la hora local se computa bien
-- (`2026-08-16 11:51 sun`, dow 0). **ES QUE HOY ES DOMINGO Y NADIE REPARTE
-- LOS DOMINGOS**: `dias_operacion = [1,2,3,4,5,6]` ⇒ cupo del domingo =
-- **capacidad 0, consumido 0**. El día se salta porque `disponible = 0`…
-- y `disponible = 0` TIENE DOS CAUSAS:
--   (a) `capacidad = 0`  → el vendedor NO OPERA ese día
--   (b) `consumido >= capacidad` → SE LLENÓ
-- **`saltos_por_cupo` las cuenta juntas** — de ahí el nombre que miente.
--
-- LA CURA, sin tocar `calcular_promesa_despensa` (es de otro lote y su
-- comportamiento es correcto: saltar días sin capacidad ES lo que debe
-- hacer): **`promesa_por_vendedor` DICE LA CAUSA**, caminando los días
-- salteados y mirando el cupo de cada uno. La voz que la mesa frenó puede
-- escribirse recién con esto:
--   · `sin_operacion` → «no repartimos los domingos» — NO es escasez.
--   · `cupo_lleno`    → la frase del founder, con su pregunta.
--   · `mixto`         → los dos.
--   · `null`          → no hubo corrimiento.
--
-- 76(g): NO RIGE — lectura pura. Reversa: la de
-- `20260818010000` (misma función; su DROP alcanza) — se referencia y no
-- se duplica, para no tener dos textos de la misma reversa.
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
  v_tz     text;
  v_hoy    date;
  v_fin    date;
  v_d      date;
  v_c      jsonb;
  v_sin_op boolean;
  v_lleno  boolean;
  v_motivo text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  IF p_cuentas IS NULL OR cardinality(p_cuentas) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'promesas', '[]'::jsonb);
  END IF;
  IF cardinality(p_cuentas) > 50 THEN
    RAISE EXCEPTION 'demasiados_vendedores';
  END IF;

  FOREACH v_cuenta IN ARRAY p_cuentas LOOP
    v_r := public.calcular_promesa_despensa(v_cuenta, now(), p_fecha_programada, 'estandar');
    v_motivo := NULL;

    -- LA CAUSA DEL CORRIMIENTO — solo si hubo. Camina los días salteados
    -- (hoy → víspera de la fecha prometida) y clasifica cada `disponible=0`.
    IF (v_r ->> 'ok') = 'true' AND COALESCE((v_r ->> 'saltos_por_cupo')::int, 0) > 0 THEN
      SELECT zona_horaria INTO v_tz FROM public.entrega_turnos
       WHERE cuenta_comercial_id = v_cuenta AND activo LIMIT 1;
      v_hoy := (now() AT TIME ZONE COALESCE(v_tz, 'UTC'))::date;
      v_fin := (v_r ->> 'fecha')::date;
      v_sin_op := false;
      v_lleno := false;
      v_d := v_hoy;
      WHILE v_d < v_fin LOOP
        v_c := public.cupo_reparto_del_dia(v_cuenta, v_d);
        IF (v_c ->> 'disponible')::int <= 0 THEN
          IF (v_c ->> 'capacidad')::int <= 0 THEN
            v_sin_op := true;   -- ese día NO reparte (no es escasez)
          ELSE
            v_lleno := true;    -- ese día está LLENO (sí es escasez)
          END IF;
        END IF;
        v_d := v_d + 1;
      END LOOP;
      v_motivo := CASE
        WHEN v_sin_op AND v_lleno THEN 'mixto'
        WHEN v_lleno              THEN 'cupo_lleno'
        WHEN v_sin_op             THEN 'sin_operacion'
        ELSE NULL END;
    END IF;

    v_out := v_out || jsonb_build_object(
      'cuenta_comercial_id', v_cuenta,
      'promesa', v_r,
      'motivo_corrimiento', v_motivo
    );
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'promesas', v_out);
END $$;

REVOKE EXECUTE ON FUNCTION public.promesa_por_vendedor(uuid[], date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promesa_por_vendedor(uuid[], date) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — EL DISCRIMINADOR ES EL CASO DE HOY: domingo, cupo vacío ⇒ el
-- motivo tiene que decir `sin_operacion`, JAMÁS insinuar escasez.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_r       jsonb;
  v_e       jsonb;
  v_cta     uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_dow     int  := EXTRACT(dow FROM (now() AT TIME ZONE 'America/Guayaquil')::date)::int;
BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.promesa_por_vendedor(ARRAY[v_cta], NULL);
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  SELECT e INTO v_e FROM jsonb_array_elements(v_r -> 'promesas') e
  WHERE (e ->> 'cuenta_comercial_id')::uuid = v_cta;

  -- ① El campo existe SIEMPRE (aunque sea null) — la superficie no adivina.
  IF NOT (v_e ? 'motivo_corrimiento') THEN
    RAISE EXCEPTION 'CINTURÓN ①: falta motivo_corrimiento — %', v_e;
  END IF;

  -- ② EL CASO DE HOY: si hubo corrimiento y el cupo de hoy tiene capacidad
  --    0 (día sin operación), el motivo NO puede ser `cupo_lleno`.
  IF COALESCE((v_e -> 'promesa' ->> 'saltos_por_cupo')::int, 0) > 0
     AND (public.cupo_reparto_del_dia(v_cta, (now() AT TIME ZONE 'America/Guayaquil')::date) ->> 'capacidad')::int = 0
     AND (v_e ->> 'motivo_corrimiento') = 'cupo_lleno' THEN
    RAISE EXCEPTION 'CINTURÓN ②: día SIN OPERACIÓN reportado como cupo_lleno — la voz mentiría escasez';
  END IF;

  -- ③ Coherencia dura: sin saltos no hay motivo.
  IF COALESCE((v_e -> 'promesa' ->> 'saltos_por_cupo')::int, 0) = 0
     AND (v_e ->> 'motivo_corrimiento') IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURÓN ③: motivo sin corrimiento — %', v_e;
  END IF;

  RAISE NOTICE 'CINTURÓN motivo: ①②③ verdes — dow=% · saltos=% · motivo=%',
    v_dow, v_e -> 'promesa' ->> 'saltos_por_cupo', COALESCE(v_e ->> 'motivo_corrimiento', 'null');
END $$;
