-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — EL CUPO DEVUELVE SU MOTIVO: CUATRO CASOS, NO DOS
--
-- Firma de C adoptada por la mesa (29-ago): **capacidad 0 NO es «lleno».**
--
-- > ### 🔴 Si el motor no distingue «ese día no abren» de «se llenó», **la
-- > pantalla no lo puede inferir sin mentir** — las dos cosas llegan como
-- > `disponible = 0` y la única salida honesta sería no decir nada.
--
-- Los cuatro casos, y cada uno es una frase distinta para la familia:
--   `pasado`        — ese día ya pasó
--   `mismo_dia`     — las reservas entran **desde mañana** (compuerta de la víspera)
--   `no_opera`      — ese día **no abren** (su patrón de franjas, o una excepción suya)
--   `sin_lugar`     — abren, **pero se llenó**
--   `elegible`      — hay lugar
--
-- ⚠️ El orden importa y está escrito: `pasado` y `mismo_dia` ganan a todo —
-- *un día que ya pasó no «se llenó», simplemente pasó.*
--
-- 🔴 Y el número sigue viajando **para que la pieza decida, jamás para
-- pintarse**: `MODELO_LOYALTY` §7.5 prohíbe el «quedan 2».
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260829060000-cuatro-casos.sql
-- 76(g): NO RIGE — el cinturón sólo LEE.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION public.cupo_guarderia_del_rango(uuid, date, date);

CREATE FUNCTION public.cupo_guarderia_del_rango(
  p_prestador_id uuid, p_desde date, p_hasta date
) RETURNS TABLE(fecha date, capacidad int, consumido int, disponible int,
                sobrevendido boolean, estado text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_dias int := (p_hasta - p_desde) + 1;
BEGIN
  IF p_hasta < p_desde THEN RAISE EXCEPTION 'rango_invertido' USING ERRCODE = '22023'; END IF;
  IF v_dias > 62 THEN RAISE EXCEPTION 'rango_demasiado_largo' USING ERRCODE = '22023'; END IF;

  RETURN QUERY
  SELECT d::date,
         (c->>'capacidad')::int,
         (c->>'consumido')::int,
         (c->>'disponible')::int,
         (c->>'sobrevendido')::boolean,
         CASE
           WHEN d::date <  public.hoy_local()             THEN 'pasado'
           WHEN d::date =  public.hoy_local()             THEN 'mismo_dia'
           /* 🔴 «No opera» se mide del PATRÓN, no del cupo: un lugar que abre y
              está lleno tiene capacidad > 0; uno que no abre tiene capacidad 0
              porque no hay espacio confirmado ese día. Son dos ceros distintos
              y ésta es la línea que los separa. */
           WHEN (c->>'capacidad')::int = 0                THEN 'no_opera'
           WHEN (c->>'disponible')::int = 0               THEN 'sin_lugar'
           ELSE 'elegible'
         END
    FROM generate_series(p_desde, p_hasta, interval '1 day') d
    CROSS JOIN LATERAL public.cupo_guarderia_del_dia(p_prestador_id, d::date) c;
END $$;

REVOKE EXECUTE ON FUNCTION public.cupo_guarderia_del_rango(uuid, date, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cupo_guarderia_del_rango(uuid, date, date) TO authenticated;

DO $c$
DECLARE v_prest uuid; v_hoy text; v_ayer text; v_n int;
BEGIN
  SELECT prestador_id INTO v_prest FROM guarderia_espacios WHERE activo LIMIT 1;
  IF v_prest IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no hay ningun lugar con capacidad configurada contra el cual medir los cuatro casos.';
  END IF;

  SELECT estado INTO v_ayer FROM public.cupo_guarderia_del_rango(v_prest, public.hoy_local()-1, public.hoy_local()-1);
  SELECT estado INTO v_hoy  FROM public.cupo_guarderia_del_rango(v_prest, public.hoy_local(),   public.hoy_local());
  IF v_ayer <> 'pasado'    THEN RAISE EXCEPTION 'ROJO: ayer deberia ser `pasado`, dio %.', v_ayer; END IF;
  IF v_hoy  <> 'mismo_dia' THEN RAISE EXCEPTION 'ROJO: hoy deberia ser `mismo_dia`, dio %.', v_hoy; END IF;

  /* 🔴 EL DISCRIMINADOR: `no_opera` y `sin_lugar` NO pueden salir del mismo
     número. Se verifica que ningún día con capacidad > 0 se rotule `no_opera`
     y que ninguno con capacidad = 0 se rotule `sin_lugar`. */
  SELECT count(*) INTO v_n FROM public.cupo_guarderia_del_rango(v_prest, public.hoy_local()+1, public.hoy_local()+45)
   WHERE (estado = 'no_opera'  AND capacidad > 0)
      OR (estado = 'sin_lugar' AND capacidad = 0);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ROJO: % dia(s) con el motivo cruzado — no_opera y sin_lugar salieron del mismo cero.', v_n;
  END IF;

  RAISE NOTICE '✅ CINTURON CUATRO CASOS: ayer=pasado · hoy=mismo_dia · 0 motivos cruzados en 45 dias';
END $c$;

COMMIT;
