-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA SALUD FISCAL VE A LOS TRABADOS
--
-- 🔴 `fiscal_salud_emision()` contestaba `puede_emitir: true` con dos facturas
--    detenidas. Miraba cupo y certificado —lo que impide emitir hacia
--    ADELANTE— y no lo que ya quedó del otro lado de la puerta.
--
--    *El pedido del founder fue «que un documento esperando receptor sea
--    visible en operaciones, no solo en la base», y su intuición de que era una
--    línea era correcta — sólo que no va en la bandeja: la bandeja NO EXISTE
--    como pantalla (`fiscal_admin_listar` tiene lector y wrapper y CERO
--    superficies que lo monten). Va acá, donde ya hay una señal con canal.*
--
-- EDGES A DESPLEGAR (`L-536`): ninguna. Veda 76(g): NO RIGE.
-- Reversa: S115-A-REVERSA-20260912700000-salud-trabados.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fiscal_salud_emision()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_cupo int; v_periodo text; v_umbrales text; v_desde date;
  v_usados int; v_pct numeric; v_alerta text; v_u70 int; v_u90 int;
  v_vence date; v_dias int; v_alerta_cert text; v_hoy date := public.fiscal_hoy();
BEGIN
  SELECT COALESCE(valor::int, 0) INTO v_cupo FROM app_config WHERE clave='fiscal_cupo_documentos';
  SELECT valor INTO v_periodo  FROM app_config WHERE clave='fiscal_cupo_periodo';
  SELECT valor INTO v_umbrales FROM app_config WHERE clave='fiscal_cupo_alerta_pcts';
  v_periodo := COALESCE(v_periodo, 'mensual');
  v_u70 := COALESCE(split_part(COALESCE(v_umbrales,'70,90'), ',', 1)::int, 70);
  v_u90 := COALESCE(split_part(COALESCE(v_umbrales,'70,90'), ',', 2)::int, 90);

  v_desde := CASE WHEN v_periodo = 'anual' THEN date_trunc('year', v_hoy)::date
                  ELSE date_trunc('month', v_hoy)::date END;

  /* Consume cupo lo que SALIÓ, no lo que se autorizó: un documento rechazado
     por el SRI también gastó su envío. Se cuenta por tener secuencial —que es
     el momento en que el documento se volvió un envío— y no por su estado. */
  SELECT count(*) INTO v_usados FROM documentos_fiscales
   WHERE sentido = 'emitido' AND secuencial IS NOT NULL AND fecha_emision >= v_desde;

  IF v_cupo > 0 THEN
    v_pct := round(v_usados * 100.0 / v_cupo, 1);
    v_alerta := CASE WHEN v_usados >= v_cupo THEN 'agotado'
                     WHEN v_pct >= v_u90 THEN 'critico'
                     WHEN v_pct >= v_u70 THEN 'aviso'
                     ELSE NULL END;
  ELSE
    v_pct := NULL;
    /* 🔴 Sin cupo declarado NO se dice «todo bien»: se dice que no se puede
       vigilar. *Un vigilante que no sabe contra qué mide y calla es
       indistinguible de uno que mide y todo está bien.* */
    v_alerta := 'sin_cupo_declarado';
  END IF;

  SELECT certificado_vence_en INTO v_vence FROM fiscal_emisor LIMIT 1;
  v_dias := CASE WHEN v_vence IS NULL THEN NULL ELSE (v_vence - v_hoy) END;
  v_alerta_cert := CASE WHEN v_vence IS NULL THEN 'sin_fecha_declarada'
                        WHEN v_dias <= 0  THEN 'vencido'
                        WHEN v_dias <= 15 THEN 'critico'
                        WHEN v_dias <= 45 THEN 'aviso'
                        ELSE NULL END;

  RETURN jsonb_build_object(
    'medido_en', now(),
    'cupo', jsonb_build_object(
      'declarado', v_cupo, 'periodo', v_periodo, 'desde', v_desde,
      'usados', v_usados, 'restantes', GREATEST(v_cupo - v_usados, 0),
      'pct', v_pct, 'umbrales', jsonb_build_array(v_u70, v_u90), 'alerta', v_alerta),
    'certificado', jsonb_build_object(
      'vence_en', v_vence, 'dias', v_dias, 'alerta', v_alerta_cert),
    /* Las dos cosas que detienen el 100 % de la facturación, en un booleano. */
    'puede_emitir', (v_alerta IS DISTINCT FROM 'agotado')
                    AND (v_alerta_cert IS DISTINCT FROM 'vencido'),
    /* ── LOS DOCUMENTOS QUE NO VAN A SALIR SOLOS ──────────────────────────────
     🔴 ESTA SEÑAL DECIA `puede_emitir: true` CON FACTURAS TRABADAS. Miraba el
     cupo y el certificado —las dos cosas que impiden emitir HACIA ADELANTE— y
     no miraba lo que YA esta detenido. *Una salud que solo mira si la puerta
     abre no ve a los que quedaron del otro lado.*

     Medido el 11-sep: dos documentos de compras reales del founder, uno
     `esperando_receptor` por superar el tope sin identificacion y otro
     `pendiente_manual` por agencia. Los dos correctos, los dos invisibles.

     Van SEPARADOS por motivo y no en un total, porque piden cosas distintas:
     `esperando_receptor` lo destraba la FAMILIA dando sus datos —y hoy no se
     entera—; `pendiente_manual` lo destraba OPERACIONES. Un solo numero
     mezclaria dos colas con dos duenos. */
  'trabados', (
    SELECT jsonb_object_agg(t.estado, t.n) FROM (
      SELECT d.estado::text AS estado, count(*) AS n
        FROM public.documentos_fiscales d
       WHERE d.estado IN ('esperando_receptor','pendiente_manual','no_autorizada')
       GROUP BY 1
    ) t
  ),
  'el_mas_viejo_trabado', (
    SELECT to_char(min(d.created_at), 'YYYY-MM-DD HH24:MI')
      FROM public.documentos_fiscales d
     WHERE d.estado IN ('esperando_receptor','pendiente_manual','no_autorizada')
  ),
  'canal_de_la_alerta', 'D-1054 — la audiencia casa no existe todavia');
END $function$;


DO $cint$
DECLARE v jsonb;
BEGIN
  v := public.fiscal_salud_emision();
  IF NOT (v ? 'trabados') THEN
    RAISE EXCEPTION 'cinturon: la salud no reporta trabados';
  END IF;
  /* 🔴 EL ROJO: hoy HAY trabados, asi que el bloque NO puede venir vacio. Un
     cinturon que solo verifique que la clave existe da verde sobre un contador
     que siempre cuenta cero. */
  IF v->'trabados' IS NULL OR v->'trabados' = 'null'::jsonb THEN
    RAISE EXCEPTION 'cinturon ROJO: hay documentos trabados y el contador vino vacio';
  END IF;
  IF (v->>'el_mas_viejo_trabado') IS NULL THEN
    RAISE EXCEPTION 'cinturon: sin fecha del mas viejo';
  END IF;
  RAISE NOTICE 'cinturon salud: trabados=% · mas viejo=%',
    v->'trabados', v->>'el_mas_viejo_trabado';
END $cint$;
