-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · L2/L5b — EL LECTOR DE VIAJES POR REPARTIDOR (pedido de C, con
-- dueño por mesa 17-ago): sin él, el ⑤ de la ficha del repartidor no se
-- monta — un cero FIJO mentiría sobre alguien que sí entregó.
--
-- EL HECHO, no el vocabulario: «entregó» = `entregado_en IS NOT NULL`
-- (el timestamp es el acto; el vocabulario de `estado` puede crecer sin
-- romper este conteo). «En curso» = asignado y sin entregar.
--
-- 76(g): NO RIGE — función de lectura pura. Reversa ANTES:
-- docs/relevamientos/2026-08-17-s99a-REVERSA-viajes-y-lote.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.viajes_por_repartidor(p_cuenta_comercial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_filas jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  IF NOT public.es_vendedor_de(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor';
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'repartidor_id', r.id,
           'entregados', COALESCE(v.entregados, 0),
           'en_curso',   COALESCE(v.en_curso, 0)
         ) ORDER BY r.nombre), '[]'::jsonb)
    INTO v_filas
  FROM public.repartidores r
  LEFT JOIN LATERAL (
    SELECT count(*) FILTER (WHERE e.entregado_en IS NOT NULL) AS entregados,
           count(*) FILTER (WHERE e.entregado_en IS NULL)     AS en_curso
    FROM public.envios e
    WHERE e.repartidor_id = r.id
  ) v ON true
  WHERE r.cuenta_comercial_id = p_cuenta_comercial_id;
  RETURN jsonb_build_object('ok', true, 'viajes', v_filas);
END $$;

REVOKE EXECUTE ON FUNCTION public.viajes_por_repartidor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.viajes_por_repartidor(uuid) TO authenticated;

-- CINTURÓN — camino independiente + gate + L-140.
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_r       jsonb;
  v_fn      int;
  v_directo int;
  v_err     text;
BEGIN
  -- Brazo ① — duenodes (owner de eec12ef3) lee; el conteo en_curso del
  -- «Repartidor de Pruebas» (664e9695) coincide con un count directo.
  PERFORM set_config('request.jwt.claims',
    '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.viajes_por_repartidor('eec12ef3-2c0c-41e7-a45e-81559fdf62a8');
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  SELECT (f ->> 'en_curso')::int INTO v_fn
  FROM jsonb_array_elements(v_r -> 'viajes') f
  WHERE f ->> 'repartidor_id' = '664e9695-f6c8-424c-b50c-79765d8135c4';
  SELECT count(*) INTO v_directo FROM public.envios
  WHERE repartidor_id = '664e9695-f6c8-424c-b50c-79765d8135c4' AND entregado_en IS NULL;
  IF COALESCE(v_fn, -1) IS DISTINCT FROM v_directo THEN
    RAISE EXCEPTION 'CINTURÓN ①: en_curso fn=% vs directo=%', v_fn, v_directo;
  END IF;
  -- Y el repartidor SIN envíos aparece con ceros (no desaparece de la lista).
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_r -> 'viajes') f
    WHERE (f ->> 'entregados')::int = 0 AND (f ->> 'en_curso')::int >= 0
  ) THEN
    RAISE EXCEPTION 'CINTURÓN ①b: forma inesperada — %', v_r;
  END IF;

  -- Brazo ② — el ajeno rebota (Diego no es vendedor de duenodes).
  BEGIN
    PERFORM set_config('request.jwt.claims',
      '{"sub":"4bfafac3-e456-4de7-9484-99e76b7301b0","role":"authenticated"}', true);
    SET LOCAL ROLE authenticated;
    v_r := public.viajes_por_repartidor('eec12ef3-2c0c-41e7-a45e-81559fdf62a8');
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ②: el ajeno NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    v_err := SQLERRM;
    IF v_err NOT LIKE 'no_sos_el_vendedor%' THEN
      RAISE EXCEPTION 'CINTURÓN ②: rebotó por otra razón — %', v_err;
    END IF;
  END;

  -- Brazo ③ — L-140.
  IF has_function_privilege('anon', 'public.viajes_por_repartidor(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ③ (L-140): anon tiene EXECUTE';
  END IF;

  RAISE NOTICE 'CINTURÓN viajes: ①①b②③ verdes (en_curso=% por dos caminos)', v_directo;
END $$;
