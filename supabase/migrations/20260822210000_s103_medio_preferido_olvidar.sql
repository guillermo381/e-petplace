-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · «OLVIDAR LA PREFERENCIA» PASA A SER EXPRESABLE
--
-- 🔴 LO ENCONTRÓ EL TYPECHECK DEL WRAPPER, no una relectura de la migración —
--    y es la segunda vez en esta sesión que escribir el consumidor destapa un
--    hueco del motor.
--
-- **El defecto, medido en el tipo generado:**
--     Args: { p_medio: string; p_tarjeta_id?: string }
--                      ^^^^^^ obligatorio y NO nullable
--
-- El cuerpo de la función **ya trataba `p_medio IS NULL` como «olvidar»** —su
-- rama existe y funciona—, pero **su FIRMA no lo permitía**: sin `DEFAULT`, el
-- parámetro es obligatorio, y el cliente tipado no acepta `null`.
--
-- > **Una rama del cuerpo que la firma no deja alcanzar es código muerto con
-- > cara de función.**
--
-- *La salida barata era un cast en el wrapper. Se descartó: un cast no habría
-- arreglado la firma — habría escondido que la firma estaba mal, y el próximo
-- consumidor volvería a chocar.* **Se corrige donde está el defecto.**
--
-- 📌 DECLARACIÓN 76(g) — LA VEDA: **NO RIGE.** `CREATE OR REPLACE` sobre la
--    misma firma agregando un DEFAULT. Cero DDL sobre datos, cero backfill.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- Volver a declarar la función SIN el `DEFAULT NULL` en `p_medio`. **Y su
-- costo, declarado: eso vuelve a dejar «olvidar» inalcanzable desde el cliente
-- tipado**, aunque el cuerpo lo siga soportando.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $guard$
BEGIN
  IF to_regprocedure('public.guardar_medio_pago_preferido(text, uuid)') IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la función no existe. Esta migración la ENMIENDA, no la crea.';
  END IF;
END $guard$;

-- Mismo cuerpo, misma firma de tipos, **con `DEFAULT NULL` en `p_medio`**.
CREATE OR REPLACE FUNCTION public.guardar_medio_pago_preferido(
  p_medio text DEFAULT NULL,
  p_tarjeta_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE='42501'; END IF;

  IF p_medio IS NOT NULL AND p_medio NOT IN ('deuna','tarjeta') THEN
    RAISE EXCEPTION 'medio_invalido' USING ERRCODE='22023';
  END IF;

  IF p_medio = 'tarjeta' THEN
    IF p_tarjeta_id IS NULL THEN
      RAISE EXCEPTION 'tarjeta_requerida' USING ERRCODE='22023';
    END IF;
    PERFORM 1 FROM public.tarjetas_guardadas
      WHERE id = p_tarjeta_id AND user_id = v_uid AND estado = 'guardada';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'tarjeta_no_disponible' USING ERRCODE='42501';
    END IF;
  ELSIF p_medio = 'deuna' AND p_tarjeta_id IS NOT NULL THEN
    RAISE EXCEPTION 'deuna_no_lleva_tarjeta' USING ERRCODE='22023';
  ELSIF p_medio IS NULL AND p_tarjeta_id IS NOT NULL THEN
    /* «Olvidar» con una tarjeta adentro es una contradicción: se rechaza en vez
       de ignorarse, por el mismo criterio que el resto de la puerta. */
    RAISE EXCEPTION 'medio_invalido' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.user_preferencias (user_id, medio_pago_preferido, tarjeta_preferida_id, updated_at)
       VALUES (v_uid, p_medio, CASE WHEN p_medio='tarjeta' THEN p_tarjeta_id ELSE NULL END, now())
  ON CONFLICT (user_id) DO UPDATE
     SET medio_pago_preferido = EXCLUDED.medio_pago_preferido,
         tarjeta_preferida_id = EXCLUDED.tarjeta_preferida_id,
         updated_at = now();

  RETURN jsonb_build_object('ok', true, 'medio', p_medio, 'tarjeta_id',
                            CASE WHEN p_medio='tarjeta' THEN p_tarjeta_id ELSE NULL END);
END $function$;

REVOKE ALL ON FUNCTION public.guardar_medio_pago_preferido(text, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.guardar_medio_pago_preferido(text, uuid) TO authenticated;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_defaults int; v_sobrecargas int;
BEGIN
  -- (a) La firma AHORA declara dos defaults — que es lo que vuelve alcanzable
  --     la rama de «olvidar» desde el cliente tipado.
  SELECT pronargdefaults INTO v_defaults FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='guardar_medio_pago_preferido';
  IF v_defaults <> 2 THEN
    RAISE EXCEPTION 'ABORTA: la firma declara % defaults y se esperaban 2. «Olvidar» sigue inalcanzable.', v_defaults;
  END IF;

  -- (b) UNA sola versión (L-119): dos puertas es peor que ninguna.
  SELECT count(*) INTO v_sobrecargas FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='guardar_medio_pago_preferido';
  IF v_sobrecargas <> 1 THEN
    RAISE EXCEPTION 'ABORTA: hay % versiones de la puerta.', v_sobrecargas;
  END IF;

  RAISE NOTICE 'CINTURON VERDE — 2 defaults · 1 sola puerta · «olvidar» alcanzable';
END $cinturon$;

COMMIT;
