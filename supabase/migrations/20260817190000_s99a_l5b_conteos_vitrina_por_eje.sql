-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · L5b (N20) — LOS CONTEOS POR EJE, SOBRE LO COMPRABLE
--
-- La adjudicación (a) de mesa (17-ago, en PLAN_S99): N20 y el buscador
-- corren sobre LO COMPRABLE — oferta publicada × variante activa × producto
-- activo — jamás sobre el canónico. Este lector existe para la Ley 23: el
-- segundo toque de la navegación NO ofrece lo que va a rechazar — un eje
-- (especie · especie×momento) con cero productos comprables no se pinta.
--
-- Devuelve DOS granularidades en un viaje (el total por especie NO es la
-- suma de los pares — un producto multi-momento cuenta una vez por par y
-- una vez en el total):
--   por_especie:          [{especie, productos}]
--   por_especie_momento:  [{especie, momento, productos}] — momento NULL =
--     productos comprables SIN momento declarado (el bucket «todas las
--     edades» cuya forma decide la receta de B; el dato viaja para que la
--     decisión sea con número, no a ciegas).
--
-- 76(g): NO RIGE — una función de LECTURA, cero DDL de tablas, cero datos.
-- Reversa ANTES: docs/relevamientos/2026-08-17-s99a-REVERSA-conteos-vitrina.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.conteos_vitrina_por_eje()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  WITH comprables AS (
    SELECT DISTINCT p.id, p.especies_aplicables, p.momentos_aplicables
    FROM public.ofertas o
    JOIN public.producto_variantes pv ON pv.id = o.variante_id AND pv.activo
    JOIN public.productos p ON p.id = pv.producto_id AND p.estado = 'activo'
    WHERE o.estado = 'publicada'
  ),
  por_especie AS (
    SELECT e AS especie, count(DISTINCT c.id) AS productos
    FROM comprables c, unnest(c.especies_aplicables) e
    GROUP BY 1
  ),
  por_par AS (
    SELECT e AS especie,
           m.momento,
           count(DISTINCT c.id) AS productos
    FROM comprables c
    CROSS JOIN LATERAL unnest(c.especies_aplicables) e
    LEFT JOIN LATERAL unnest(
      CASE WHEN cardinality(c.momentos_aplicables) = 0
           THEN ARRAY[NULL::text]
           ELSE c.momentos_aplicables END
    ) m(momento) ON true
    GROUP BY 1, 2
  )
  SELECT jsonb_build_object(
    'ok', true,
    'por_especie',
      COALESCE((SELECT jsonb_agg(jsonb_build_object('especie', especie, 'productos', productos) ORDER BY productos DESC, especie) FROM por_especie), '[]'::jsonb),
    'por_especie_momento',
      COALESCE((SELECT jsonb_agg(jsonb_build_object('especie', especie, 'momento', momento, 'productos', productos) ORDER BY especie, momento NULLS LAST) FROM por_par), '[]'::jsonb)
  );
$$;

-- L-140:
REVOKE EXECUTE ON FUNCTION public.conteos_vitrina_por_eje() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.conteos_vitrina_por_eje() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el discriminador es un CAMINO INDEPENDIENTE: el conteo de
-- 'perro' de la función debe coincidir con un join directo escrito distinto.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_r        jsonb;
  v_fn_perro int;
  v_directo  int;
  v_total    int;
BEGIN
  v_r := public.conteos_vitrina_por_eje();
  IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CINTURÓN: ok no es true — %', v_r;
  END IF;

  SELECT (e ->> 'productos')::int INTO v_fn_perro
  FROM jsonb_array_elements(v_r -> 'por_especie') e
  WHERE e ->> 'especie' = 'perro';

  SELECT count(DISTINCT p.id) INTO v_directo
  FROM public.productos p
  WHERE p.estado = 'activo'
    AND 'perro' = ANY (p.especies_aplicables)
    AND EXISTS (
      SELECT 1 FROM public.producto_variantes pv
      JOIN public.ofertas o ON o.variante_id = pv.id AND o.estado = 'publicada'
      WHERE pv.producto_id = p.id AND pv.activo
    );

  IF COALESCE(v_fn_perro, -1) IS DISTINCT FROM v_directo THEN
    RAISE EXCEPTION 'CINTURÓN: perro por función=% vs camino directo=%', v_fn_perro, v_directo;
  END IF;

  -- El techo estructural: ninguna especie puede contar más que los
  -- comprables totales (si pasa, el DISTINCT se rompió).
  SELECT count(DISTINCT p.id) INTO v_total
  FROM public.productos p
  WHERE p.estado = 'activo'
    AND EXISTS (
      SELECT 1 FROM public.producto_variantes pv
      JOIN public.ofertas o ON o.variante_id = pv.id AND o.estado = 'publicada'
      WHERE pv.producto_id = p.id AND pv.activo
    );
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_r -> 'por_especie') e
    WHERE (e ->> 'productos')::int > v_total
  ) THEN
    RAISE EXCEPTION 'CINTURÓN: una especie cuenta más que el total comprable (%)', v_total;
  END IF;

  -- L-140:
  IF has_function_privilege('anon', 'public.conteos_vitrina_por_eje()', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN (L-140): anon tiene EXECUTE';
  END IF;

  RAISE NOTICE 'CINTURÓN conteos: perro=% (dos caminos coinciden) · total comprable=%', v_directo, v_total;
END $$;
