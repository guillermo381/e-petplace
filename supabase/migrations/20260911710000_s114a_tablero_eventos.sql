-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · ① · EL TABLERO DE INVERSORES lee el ledger, no el motor muerto
--
-- CABLEADO, NO FIRMA (adenda 5, medido por A): `MODELO_FINANCIERO` §3.1 define
-- GMV = `eventos_economicos.monto_bruto`, y §3.2 congela el fee por evento
-- (`monto_plataforma`). ⇒ las dos vistas apuntan a ese sujeto.
--
-- LO QUE ESTABA MAL, medido: `v_gmv_mensual` y `v_metricas_tiempo_real`
-- filtraban por `pedidos.kushki_status='approved'` y `pagado_en` — columnas del
-- motor muerto, 0 de 96 filas, sin una función que las escriba. El tablero
-- mostraba CERO y estaba ciego a los eventos reales.
--
-- 🔴 EL REVENUE NO SE MULTIPLICA, SE SUMA. En D-759 curé el factor por fila
-- (_fee_pct_vigente) porque las vistas leían el bruto del pedido. Con A6 el
-- evento YA trae su `monto_plataforma` congelado (§3.2) ⇒ el revenue es
-- `sum(monto_plataforma)`, sin factor. *Un factor plano volvería a mentir; un
-- factor por fila ahora sería recalcular lo que ya está congelado.*
--
-- EL MATIZ, ESCRITO EN LA SUPERFICIE (adenda): el evento nace al DEVENGAR (al
-- entregar/completar), así que el tablero cuenta lo ejecutado, no lo cobrado.
-- Eso NO es ceguera — es la verdad: lo cobrado y no ejecutado todavía es plata
-- que aún no es ingreso. `v_metricas_tiempo_real` lo dice con dos campos nuevos,
-- `cobrado_sin_devengar` y `objetos_sin_ejecutar`, para que la pantalla muestre
-- «X devengado · Y esperando ejecución» en vez de esconder la mitad.
--
-- CADA NÚMERO NOMBRA SU COMANDO: los COMMENT de las vistas dicen de qué tabla
-- sale cada cifra.
--
-- VEDA 76(g): NO RIGE — dos CREATE OR REPLACE VIEW; cero datos.
-- REVERSA: escrita ANTES (repone el motor muerto).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① v_gmv_mensual ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_gmv_mensual AS
  SELECT date_trunc('month', e.fecha_devengo)::date AS mes,
         count(*)                          AS pedidos,     -- nombre histórico; hoy = eventos devengados
         sum(e.monto_bruto)                AS gmv,
         -- revenue congelado por evento (§3.2), sumado — jamás gmv × factor
         sum(e.monto_plataforma)           AS revenue,
         avg(e.monto_bruto)                AS ticket_promedio,
         e.country_code
    FROM eventos_economicos e
   WHERE e.tipo_evento <> 'reembolso'
     AND e.fecha_devengo >= (now() - '1 year'::interval)
   GROUP BY date_trunc('month', e.fecha_devengo), e.country_code
   ORDER BY date_trunc('month', e.fecha_devengo)::date DESC;

COMMENT ON VIEW public.v_gmv_mensual IS
  'S114 · Tablero de inversores · GMV mensual = sum(eventos_economicos.monto_bruto) '
  'DEVENGADO (MODELO_FINANCIERO §3.1). revenue = sum(monto_plataforma), el fee '
  'congelado por evento (§3.2) — NO gmv × factor. Cuenta lo ejecutado, no lo '
  'cobrado: lo cobrado sin ejecutar aún no es ingreso (ver cobrado_sin_devengar '
  'en v_metricas_tiempo_real). Antes leía pedidos.kushki_status (motor muerto).';

-- ── ② v_metricas_tiempo_real ──
CREATE OR REPLACE VIEW public.v_metricas_tiempo_real AS
 WITH periodo_actual AS (
         SELECT date_trunc('month'::text, now()) AS inicio_mes,
            now() AS ahora
        ), gmv_mes AS (
         SELECT COALESCE(sum(e.monto_bruto), (0)::numeric) AS gmv_mes_actual,
            count(*) AS pedidos_mes,
            COALESCE(sum(e.monto_plataforma), (0)::numeric) AS revenue_mes_real
           FROM eventos_economicos e, periodo_actual
          WHERE e.tipo_evento <> 'reembolso'::tipo_evento_economico_enum
            AND e.fecha_devengo >= periodo_actual.inicio_mes
        ), gmv_mes_anterior AS (
         SELECT COALESCE(sum(e.monto_bruto), (0)::numeric) AS gmv_mes_ant
           FROM eventos_economicos e
          WHERE e.tipo_evento <> 'reembolso'::tipo_evento_economico_enum
            AND e.fecha_devengo >= date_trunc('month'::text, (now() - '1 mon'::interval))
            AND e.fecha_devengo <  date_trunc('month'::text, now())
        ), cobrado_sin_devengar AS (
         SELECT
           COALESCE((SELECT sum(c.precio) FROM evento_cita_servicio c
                      WHERE c.estado_reserva='pagada'
                        AND c.estado NOT IN ('completada','no_show','cancelada','rechazada','no_realizable')),0)
         + COALESCE((SELECT sum(p.total) FROM pedidos p WHERE p.estado='pago_capturado'),0) AS monto,
           (SELECT count(*) FROM evento_cita_servicio c WHERE c.estado_reserva='pagada'
             AND c.estado NOT IN ('completada','no_show','cancelada','rechazada','no_realizable'))
         + (SELECT count(*) FROM pedidos p WHERE p.estado='pago_capturado') AS objetos
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
            COALESCE(sum(e.monto_bruto), (0)::numeric) AS gmv
           FROM eventos_economicos e
          WHERE e.tipo_evento <> 'reembolso'::tipo_evento_economico_enum
            AND (e.fecha_devengo)::date = CURRENT_DATE
        )
 SELECT gmv_mes.gmv_mes_actual AS gmv_mes,
    gmv_mes.revenue_mes_real AS revenue_mes,
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
    now() AS calculado_en,
    cobrado_sin_devengar.monto AS cobrado_sin_devengar,
    cobrado_sin_devengar.objetos AS objetos_sin_ejecutar
   FROM gmv_mes,
    gmv_mes_anterior,
    usuarios_activos,
    usuarios_nuevos_mes,
    mascotas_total,
    citas_mes,
    pedidos_hoy,
    cobrado_sin_devengar;;

COMMENT ON VIEW public.v_metricas_tiempo_real IS
  'S114 · Tablero de inversores en vivo. gmv_mes/revenue_mes de eventos '
  'económicos devengados (§3.1/§3.2). cobrado_sin_devengar y objetos_sin_ejecutar '
  'dicen la plata cobrada cuyo objeto aún no se ejecutó — la verdad, no ceguera. '
  'Antes leía pedidos.kushki_status (motor muerto, 0 filas).';

REVOKE ALL ON public.v_gmv_mensual, public.v_metricas_tiempo_real FROM anon;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_gmv numeric; v_rev numeric; v_ledger_gmv numeric; v_ledger_rev numeric; v_sin numeric;
BEGIN
  -- el gmv de la vista == la suma del ledger (mismo sujeto)
  SELECT sum(gmv), sum(revenue) INTO v_gmv, v_rev FROM v_gmv_mensual;
  SELECT sum(monto_bruto), sum(monto_plataforma) INTO v_ledger_gmv, v_ledger_rev
    FROM eventos_economicos
   WHERE tipo_evento<>'reembolso' AND fecha_devengo >= (now()-'1 year'::interval);
  IF v_gmv IS DISTINCT FROM v_ledger_gmv THEN
    RAISE EXCEPTION 'CINTURÓN: gmv de la vista (%) <> ledger (%)', v_gmv, v_ledger_gmv;
  END IF;
  IF v_rev IS DISTINCT FROM v_ledger_rev THEN
    RAISE EXCEPTION 'CINTURÓN: revenue de la vista (%) <> ledger (%)', v_rev, v_ledger_rev;
  END IF;

  -- 🔴 EL CONTROL QUE IMPORTA: la vista YA NO muestra cero (el defecto que se cura)
  IF COALESCE(v_gmv,0) = 0 THEN
    RAISE EXCEPTION 'CINTURÓN: la vista sigue mostrando GMV cero — no se reconectó';
  END IF;

  -- ninguna vista lee el motor muerto
  IF pg_get_viewdef('public.v_gmv_mensual'::regclass) ~ 'kushki_status'
     OR (pg_get_viewdef('public.v_metricas_tiempo_real'::regclass) ~ 'kushki_status = ') THEN
    RAISE EXCEPTION 'CINTURÓN: una vista sigue leyendo kushki_status vivo';
  END IF;

  -- el matiz existe y es un número
  SELECT cobrado_sin_devengar INTO v_sin FROM v_metricas_tiempo_real;
  RAISE NOTICE 'CINTURÓN VERDE · gmv vista=ledger=% · revenue=% · cobrado_sin_devengar=% · sin motor muerto',
    v_gmv, v_rev, v_sin;
END $cinturon$;
