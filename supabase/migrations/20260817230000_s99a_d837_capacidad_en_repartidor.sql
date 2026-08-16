-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · D-837 — LA CAPACIDAD DE REPARTO VIVE DENTRO DE CADA REPARTIDOR
-- (dictado del founder 18-ago ③; el disparo SONÓ: la caminata de C midió
-- que «la pantalla describe con fidelidad un modelo equivocado» — mudar la
-- superficie sin esta columna sería inventar un vínculo que la base no
-- tiene. El motor va ANTES de la pantalla.)
--
-- EL DISEÑO, contra lo medido:
--  · `recursos_reparto` gana `repartidor_id` NULL — el vínculo que faltaba.
--    NULL = recurso legacy suelto (el modelo viejo, vivo hasta que el
--    vendedor lo ate desde la ficha).
--  · BACKFILL SOLO DONDE ES INEQUÍVOCO (medido): cuentas con EXACTAMENTE
--    1 recurso activo y EXACTAMENTE 1 repartidor activo → se atan (3:
--    duenotodo · Tienda Pura · Despensa de Pruebas — S97 tiene 0
--    repartidores ACTIVOS y queda suelta).
--    Aurora (2 repartidores) queda NULL A PROPÓSITO — la ambigüedad la
--    resuelve el VENDEDOR en la pantalla, jamás una migración adivinando.
--    S97 (0 repartidores activos) queda NULL.
--  · `cupo_reparto_del_dia` NO SE TOCA: sigue sumando recursos por cuenta
--    — atar no cambia la suma, y la regla S96 sigue entera («capacidad por
--    recurso confirmado, jamás número en el código»).
--  · LA PUERTA `configurar_capacidad_repartidor` implementa la firma S96
--    «el cupo no se rompe: SE SUMA otro repartidor»: ① si el repartidor ya
--    tiene recurso → lo edita · ② si la cuenta tiene UN suelto activo → LO
--    ADOPTA (el caso Aurora: el primer repartidor que se configura hereda
--    la moto suelta, no duplica capacidad) · ③ si no → crea el suyo (un
--    repartidor más = capacidad que se suma, por acto del vendedor).
--  · «Muere agregar recurso» es de SUPERFICIE (C): la puerta lo vuelve
--    innecesario — el recurso nace/vive con el repartidor.
--
-- 76(g): NO RIGE — columna aditiva NULL + backfill de 4 filas medidas +
-- una función. Reversa ANTES (declara que revertir pierde VÍNCULOS, no
-- capacidades): docs/relevamientos/2026-08-18-s99a-REVERSA-capacidad-
-- repartidor.sql
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.recursos_reparto
  ADD COLUMN repartidor_id uuid REFERENCES public.repartidores(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.recursos_reparto.repartidor_id IS
  'S99/D-837 (dictado founder): la capacidad es DE UN REPARTIDOR. NULL = recurso legacy suelto, vivo hasta que el vendedor lo ate (configurar_capacidad_repartidor lo ADOPTA al primer uso). El cupo del día sigue sumando por cuenta — atar no cambia la suma.';

-- Backfill inequívoco (1 recurso activo × 1 repartidor activo por cuenta):
UPDATE public.recursos_reparto r
   SET repartidor_id = (
     SELECT rp.id FROM public.repartidores rp
     WHERE rp.cuenta_comercial_id = r.cuenta_comercial_id AND rp.activo
   )
 WHERE r.activo
   AND (SELECT count(*) FROM public.recursos_reparto r2
        WHERE r2.cuenta_comercial_id = r.cuenta_comercial_id AND r2.activo) = 1
   AND (SELECT count(*) FROM public.repartidores rp
        WHERE rp.cuenta_comercial_id = r.cuenta_comercial_id AND rp.activo) = 1;

CREATE OR REPLACE FUNCTION public.configurar_capacidad_repartidor(
  p_repartidor_id uuid,
  p_capacidad_por_dia integer,
  p_dias_operacion integer[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_cuenta  uuid;
  v_nombre  text;
  v_recurso uuid;
  v_via     text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  SELECT r.cuenta_comercial_id, r.nombre INTO v_cuenta, v_nombre
  FROM public.repartidores r WHERE r.id = p_repartidor_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'repartidor_no_existe';
  END IF;
  IF NOT public.es_vendedor_de(v_cuenta) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor';
  END IF;
  IF p_capacidad_por_dia IS NULL OR p_capacidad_por_dia < 0 THEN
    RAISE EXCEPTION 'capacidad_invalida';
  END IF;

  -- ① El suyo, si ya lo tiene.
  SELECT id INTO v_recurso FROM public.recursos_reparto
  WHERE repartidor_id = p_repartidor_id
  ORDER BY activo DESC, updated_at DESC LIMIT 1;
  v_via := 'propio';

  -- ② Si no: ADOPTA el suelto único de la cuenta (el caso Aurora — heredar
  --    la moto suelta, jamás duplicar capacidad).
  IF v_recurso IS NULL THEN
    SELECT id INTO v_recurso FROM public.recursos_reparto
    WHERE cuenta_comercial_id = v_cuenta AND repartidor_id IS NULL AND activo
    ORDER BY updated_at DESC LIMIT 1;
    v_via := 'adoptado';
  END IF;

  IF v_recurso IS NOT NULL THEN
    UPDATE public.recursos_reparto
       SET repartidor_id = p_repartidor_id,
           capacidad_por_dia = p_capacidad_por_dia,
           dias_operacion = COALESCE(p_dias_operacion, dias_operacion),
           activo = true,
           nombre = v_nombre
     WHERE id = v_recurso;
  ELSE
    -- ③ Un repartidor más = capacidad que SE SUMA (firma S96), por acto
    --    explícito del vendedor.
    INSERT INTO public.recursos_reparto
      (cuenta_comercial_id, repartidor_id, nombre, capacidad_por_dia, dias_operacion, activo)
    VALUES
      (v_cuenta, p_repartidor_id, v_nombre, p_capacidad_por_dia,
       COALESCE(p_dias_operacion, ARRAY[1,2,3,4,5,6]), true)
    RETURNING id INTO v_recurso;
    v_via := 'creado';
  END IF;

  RETURN jsonb_build_object('ok', true, 'recurso_id', v_recurso, 'via', v_via);
END $$;

REVOKE EXECUTE ON FUNCTION public.configurar_capacidad_repartidor(uuid, integer, integer[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.configurar_capacidad_repartidor(uuid, integer, integer[]) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el ANTES del cupo medido ADENTRO, y restauración total.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_antes   jsonb := '{}'::jsonb;
  v_desp    jsonb;
  c         record;
  v_r       jsonb;
  v_err     text;
  v_atados  int;
  v_cap_original int;
  v_rep_original uuid;
  v_recurso uuid;
  -- El día de la medición es el PRÓXIMO LUNES, no HOY: un domingo el cupo
  -- es 0 legítimamente (dow 0 no está en dias_operacion) y el assert
  -- mediría el día equivocado — el primer intento de este cinturón cayó
  -- exactamente ahí.
  v_dia date := (date_trunc('week', CURRENT_DATE + interval '7 days'))::date;
BEGIN
  -- El ANTES: cupo del LUNES por cuenta con recursos (medido pre-verificación;
  -- el backfill ya corrió pero NO toca sumas — esto lo prueba, no lo asume:
  -- la columna nueva no entra en la suma y las filas no cambiaron).
  FOR c IN SELECT DISTINCT cuenta_comercial_id AS id FROM public.recursos_reparto LOOP
    v_antes := v_antes || jsonb_build_object(c.id::text,
      public.cupo_reparto_del_dia(c.id, v_dia) -> 'capacidad');
  END LOOP;

  -- Brazo ① — el backfill: exactamente 3 atados (las cuentas 1×1); Aurora
  -- y S97 quedan NULL a propósito.
  SELECT count(*) INTO v_atados FROM public.recursos_reparto WHERE repartidor_id IS NOT NULL;
  IF v_atados <> 3 THEN
    RAISE EXCEPTION 'CINTURÓN ①: esperaba 3 atados inequívocos (1×1: duenotodo·Pura·Despensa), hay %', v_atados;
  END IF;
  IF EXISTS (SELECT 1 FROM public.recursos_reparto
             WHERE cuenta_comercial_id = 'de680000-0000-4000-8000-0000000000cc'
               AND repartidor_id IS NOT NULL) THEN
    RAISE EXCEPTION 'CINTURÓN ①b: Aurora se ató sola — la ambigüedad era del vendedor';
  END IF;

  -- Brazo ② — LA ADOPCIÓN (el caso Aurora), ejecutada y REVERTIDA: Diego
  -- configura 25 → adopta la moto suelta (no crea) → el cupo de Aurora
  -- refleja 25 (el edit intencional) → se restaura TODO.
  SELECT id, capacidad_por_dia, repartidor_id INTO v_recurso, v_cap_original, v_rep_original
  FROM public.recursos_reparto
  WHERE cuenta_comercial_id = 'de680000-0000-4000-8000-0000000000cc' AND activo LIMIT 1;

  PERFORM set_config('request.jwt.claims',
    '{"sub":"4f572081-26a5-4d3b-9d80-25ea751fdc9c","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.configurar_capacidad_repartidor('7890fc4c-4f6a-42a2-a46b-62dd36f1e5ce', 25, NULL);
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF (v_r ->> 'via') <> 'adoptado' OR (v_r ->> 'recurso_id')::uuid <> v_recurso THEN
    RAISE EXCEPTION 'CINTURÓN ②: esperaba ADOPCIÓN del suelto %, vino %', v_recurso, v_r;
  END IF;
  IF (public.cupo_reparto_del_dia('de680000-0000-4000-8000-0000000000cc', v_dia) ->> 'capacidad')::int
     <> 25 THEN
    RAISE EXCEPTION 'CINTURÓN ②b: el cupo no refleja la capacidad editada';
  END IF;
  -- RESTAURAR (residuo 0 de verdad — capacidad Y vínculo):
  UPDATE public.recursos_reparto
     SET capacidad_por_dia = v_cap_original, repartidor_id = v_rep_original
   WHERE id = v_recurso;

  -- Brazo ③ — el ajeno rebota (duenodes no es vendedor de Aurora).
  BEGIN
    PERFORM set_config('request.jwt.claims',
      '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
    SET LOCAL ROLE authenticated;
    v_r := public.configurar_capacidad_repartidor('7890fc4c-4f6a-42a2-a46b-62dd36f1e5ce', 5, NULL);
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ③: el ajeno NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    v_err := SQLERRM;
    IF v_err NOT LIKE 'no_sos_el_vendedor%' THEN
      RAISE EXCEPTION 'CINTURÓN ③: rebotó por otra razón — %', v_err;
    END IF;
  END;

  -- Brazo ④ — EL DESPUÉS == EL ANTES, cuenta por cuenta (la condición de
  -- muerte de D-837: el cupo sigue computando igual).
  FOR c IN SELECT DISTINCT cuenta_comercial_id AS id FROM public.recursos_reparto LOOP
    v_desp := public.cupo_reparto_del_dia(c.id, v_dia) -> 'capacidad';
    IF v_desp IS DISTINCT FROM (v_antes -> c.id::text) THEN
      RAISE EXCEPTION 'CINTURÓN ④: el cupo de % cambió (% → %)', c.id, v_antes -> c.id::text, v_desp;
    END IF;
  END LOOP;

  -- Brazo ⑤ — L-140.
  IF has_function_privilege('anon', 'public.configurar_capacidad_repartidor(uuid, integer, integer[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ⑤ (L-140): anon tiene EXECUTE';
  END IF;

  RAISE NOTICE 'CINTURÓN D-837: ①①b②②b③④⑤ verdes — 3 atados, Aurora NULL a propósito, cupo idéntico, residuo 0';
END $$;
