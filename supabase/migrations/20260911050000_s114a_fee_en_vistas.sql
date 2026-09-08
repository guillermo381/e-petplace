-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · D-759 · el fee se LEE de `fee_configs`, jamás se hardcodea (7.15)
--
-- 🔴 EL CENSO ENCONTRÓ LA SEGUNDA PUERTA, como suele pasar. La adenda nombró
--    `v_gmv_mensual`; buscando por CUERPO y no por nombre aparecieron DOS:
--      · `v_gmv_mensual`          →  sum(total) * 0.14  AS revenue
--      · `v_metricas_tiempo_real` →  gmv_mes_actual * 0.14  AS revenue_mes
--    Las dos alimentan el Dashboard y `/inversores` del admin legado, que corre
--    contra ESTE proyecto (medido: mismo `ref` en su .env.local).
--    CONTROL POSITIVO del censo: el mismo patrón sobre `0\.[0-9]` devuelve las
--    mismas dos vistas y ninguna otra ⇒ no está ciego a decimales.
--
-- 🔴 Y EL DIAGNÓSTICO SE DIO VUELTA AL MEDIR `fee_configs`, para mejor:
--    NO hay dos tasas contradictorias vivas. Hay una historia bien escrita:
--      · {"pct": 14.00}                            vigencia 2026-01-01 → 2026-08-11
--      · {"pct": 10, "base":"total_con_impuesto"}  vigencia 2026-08-11 → ∞
--    El sistema de vigencias funciona. **Lo que caducó hace casi un mes es el
--    número de las vistas**, que nadie fue a mirar porque un número plausible
--    no se ve viejo.
--
-- 🔴 POR ESO LA CURA NO CAMBIA EL NÚMERO: CAMBIA LA FORMA.
--    `* 0.14` aplica UNA tasa a TODO el año. Los pedidos de julio devengaron al
--    14 % y los de septiembre al 10 %; **un factor único es falso para la mitad
--    de las filas en cualquiera de los dos valores.** Poner `* 0.10` habría
--    apagado el síntoma de hoy y dejado el defecto entero — y encima habría
--    subestimado el revenue histórico, que es el error que menos se nota en un
--    deck porque va para el lado prudente.
--    ⇒ el fee se resuelve **POR LA FECHA DE CADA PEDIDO**.
--
-- LA FORMA VIEJA, para que la reversa pueda reponerla:
--    v_gmv_mensual: SELECT date_trunc('month',pagado_en)::date AS mes, count(*) AS pedidos,
--      sum(total) AS gmv, (sum(total) * 0.14) AS revenue, avg(total) AS ticket_promedio,
--      country_code FROM pedidos WHERE kushki_status='approved' AND pagado_en IS NOT NULL
--      AND pagado_en >= now() - '1 year'::interval GROUP BY 1, country_code ORDER BY 1 DESC;
--    v_metricas_tiempo_real: idéntica a la de abajo salvo que su CTE `gmv_mes`
--      no traía `revenue_mes_real` y el SELECT final decía `gmv_mes_actual * 0.14`.
--
-- ⚠️ LO QUE ESTA MIGRACIÓN **NO** ARREGLA, y se declara en vez de omitirse:
--    la fila del 10 % dice `"base": "total_con_impuesto"` y las vistas suman
--    `pedidos.total`. **Que `total` sea la base correcta NO está medido acá** —
--    es una pregunta de `MODELO_FINANCIERO` §2.2bis y de la mesa, no de una
--    vista. La cura hace que el PORCENTAJE deje de mentir; **si la BASE está
--    mal, sigue estándolo**, y ahora al menos se ve dónde preguntarlo.
--
-- VEDA 76(g): NO RIGE — dos CREATE OR REPLACE VIEW y una función; cero datos.
-- REVERSA: `docs/relevamientos/S114-A-REVERSA-20260911050000-fee-en-vistas.sql`
-- ═══════════════════════════════════════════════════════════════════════════

-- ── EL LECTOR DEL FEE, por actor · país · FECHA ────────────────────────────
CREATE OR REPLACE FUNCTION public._fee_pct_vigente(
  p_tipo_actor text, p_country_code text, p_fecha timestamptz)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
  -- La tasa que regía EN ESA FECHA. `prioridad DESC` respeta el orden que la
  -- tabla ya declara; `vigencia_desde DESC` desempata quedándose con la más
  -- reciente que ya había empezado.
  SELECT (f.parametros->>'pct')::numeric
    FROM fee_configs f
   WHERE f.activo
     AND f.tipo_actor::text   = p_tipo_actor
     AND f.tipo_calculo::text = 'porcentual'
     AND (f.country_code IS NULL OR f.country_code = p_country_code)
     AND f.cuenta_comercial_id IS NULL          -- la tasa GLOBAL, no un negociado
     AND f.vigencia_desde <= COALESCE(p_fecha, now())
     AND (f.vigencia_hasta IS NULL OR f.vigencia_hasta > COALESCE(p_fecha, now()))
   ORDER BY f.prioridad DESC, f.vigencia_desde DESC
   LIMIT 1;
$fn$;

COMMENT ON FUNCTION public._fee_pct_vigente(text, text, timestamptz) IS
  'S114 · D-759 · La tasa que regía en una FECHA dada, leída de fee_configs. '
  '🔴 Devuelve NULL si no hay fila vigente, y eso es correcto: un revenue que '
  'no se puede calcular tiene que quedar en blanco, no caer a un default. Un '
  'COALESCE acá volvería a inventar el número que esta cura vino a sacar.';

REVOKE ALL ON FUNCTION public._fee_pct_vigente(text, text, timestamptz) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._fee_pct_vigente(text, text, timestamptz) TO authenticated;

-- ── ① v_gmv_mensual ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_gmv_mensual AS
  SELECT (date_trunc('month', pagado_en))::date AS mes,
         count(*)   AS pedidos,
         sum(total) AS gmv,
         -- 🔴 EL FEE SE RESUELVE POR PEDIDO, no por mes ni por vista.
         sum(total * public._fee_pct_vigente('seller_productos', country_code, pagado_en) / 100) AS revenue,
         avg(total) AS ticket_promedio,
         country_code
    FROM pedidos
   WHERE kushki_status = 'approved' AND pagado_en IS NOT NULL
     AND pagado_en >= (now() - '1 year'::interval)
   GROUP BY (date_trunc('month', pagado_en)), country_code
   ORDER BY ((date_trunc('month', pagado_en))::date) DESC;

-- ── ② v_metricas_tiempo_real ───────────────────────────────────────────────
-- Reescrita quirúrgicamente sobre la definición que devolvió la BASE, no sobre
-- una copia a mano: sólo cambia el CTE `gmv_mes` y el factor del SELECT final.
CREATE OR REPLACE VIEW public.v_metricas_tiempo_real AS
 WITH periodo_actual AS (
         SELECT date_trunc('month'::text, now()) AS inicio_mes,
            now() AS ahora
        ), gmv_mes AS (
         SELECT COALESCE(sum(pedidos.total), (0)::numeric) AS gmv_mes_actual,
            count(*) AS pedidos_mes,
            COALESCE(sum(pedidos.total * public._fee_pct_vigente('seller_productos', pedidos.country_code, pedidos.pagado_en) / 100), (0)::numeric) AS revenue_mes_real
           FROM pedidos,
            periodo_actual
          WHERE ((pedidos.kushki_status = 'approved'::text) AND (pedidos.pagado_en >= periodo_actual.inicio_mes))
        ), gmv_mes_anterior AS (
         SELECT COALESCE(sum(pedidos.total), (0)::numeric) AS gmv_mes_ant
           FROM pedidos
          WHERE ((pedidos.kushki_status = 'approved'::text) AND (pedidos.pagado_en >= date_trunc('month'::text, (now() - '1 mon'::interval))) AND (pedidos.pagado_en < date_trunc('month'::text, now())))
        ), usuarios_activos AS (
         SELECT count(DISTINCT pedidos.user_id) AS mau
           FROM pedidos,
            periodo_actual
          WHERE ((pedidos.created_at >= (periodo_actual.ahora - '30 days'::interval)) AND (pedidos.user_id IS NOT NULL))
        ), usuarios_nuevos_mes AS (
         SELECT count(*) AS nuevos
           FROM profiles,
            periodo_actual
          WHERE (profiles.created_at >= periodo_actual.inicio_mes)
        ), mascotas_total AS (
         SELECT count(*) AS total
           FROM mascotas
        ), citas_mes AS (
         SELECT count(*) AS total
           FROM evento_cita_servicio,
            periodo_actual
          WHERE (evento_cita_servicio.created_at >= periodo_actual.inicio_mes)
        ), pedidos_hoy AS (
         SELECT count(*) AS total,
            COALESCE(sum(pedidos.total), (0)::numeric) AS gmv
           FROM pedidos
          WHERE ((pedidos.kushki_status = 'approved'::text) AND ((pedidos.pagado_en)::date = CURRENT_DATE))
        )
 SELECT gmv_mes.gmv_mes_actual AS gmv_mes,
    (gmv_mes.revenue_mes_real) AS revenue_mes,
    gmv_mes.pedidos_mes,
        CASE
            WHEN (gmv_mes_anterior.gmv_mes_ant > (0)::numeric) THEN round((((gmv_mes.gmv_mes_actual - gmv_mes_anterior.gmv_mes_ant) / gmv_mes_anterior.gmv_mes_ant) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS gmv_crecimiento_pct,
    usuarios_activos.mau,
    usuarios_nuevos_mes.nuevos AS usuarios_nuevos_mes,
        CASE
            WHEN (gmv_mes.pedidos_mes > 0) THEN round((gmv_mes.gmv_mes_actual / (gmv_mes.pedidos_mes)::numeric), 2)
            ELSE (0)::numeric
        END AS ticket_promedio,
    pedidos_hoy.total AS pedidos_hoy,
    pedidos_hoy.gmv AS gmv_hoy,
    mascotas_total.total AS mascotas_total,
    citas_mes.total AS citas_mes,
    now() AS calculado_en
   FROM gmv_mes,
    gmv_mes_anterior,
    usuarios_activos,
    usuarios_nuevos_mes,
    mascotas_total,
    citas_mes,
    pedidos_hoy;


-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v14 numeric; v10 numeric; vnull numeric; v_hard int;
BEGIN
  -- ① la función devuelve la tasa DE SU ÉPOCA, no la de hoy
  v14 := public._fee_pct_vigente('seller_productos','EC','2026-07-15'::timestamptz);
  v10 := public._fee_pct_vigente('seller_productos','EC','2026-09-01'::timestamptz);
  IF v14 IS DISTINCT FROM 14.00 THEN
    RAISE EXCEPTION 'CINTURÓN: en julio debía regir 14, devolvió %', v14;
  END IF;
  IF v10 IS DISTINCT FROM 10 THEN
    RAISE EXCEPTION 'CINTURÓN: en septiembre debía regir 10, devolvió %', v10;
  END IF;
  -- 🔴 DISCRIMINADOR: si devolviera siempre lo mismo, ① habría pasado con una
  --    constante. Que 14 <> 10 prueba que la fecha MUEVE el resultado.
  IF v14 = v10 THEN
    RAISE EXCEPTION 'CINTURÓN: la fecha no cambia la tasa — la función es constante';
  END IF;

  -- ② sin fila vigente ⇒ NULL, jamás un default
  vnull := public._fee_pct_vigente('actor_inexistente','EC', now());
  IF vnull IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURÓN: inventó un fee para un actor que no existe: %', vnull;
  END IF;

  -- ③ el número literal desapareció de las DOS vistas
  SELECT count(*) INTO v_hard FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('v','m')
     AND pg_get_viewdef(c.oid) ~ '0\.14|14\s*/\s*100';
  IF v_hard <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN: quedan % vista(s) con el 14 %% adentro', v_hard;
  END IF;

  -- ④ las vistas siguen respondiendo (una vista rota no falla hasta que se lee)
  PERFORM 1 FROM public.v_gmv_mensual LIMIT 1;
  PERFORM 1 FROM public.v_metricas_tiempo_real LIMIT 1;

  RAISE NOTICE 'CINTURÓN VERDE · jul=% sep=% (la fecha mueve la tasa) · sin fila ⇒ NULL · 0 vistas con el literal · las dos leen', v14, v10;
END $cinturon$;
