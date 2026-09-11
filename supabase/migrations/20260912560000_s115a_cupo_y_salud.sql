-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL CONTADOR DE CUPO — y la salud de la emisión en UN lector
--
-- El proveedor elegido **no renueva solo**: avisa antes y reactiva al instante,
-- pero con el cupo agotado la emisión se detiene. *Un cupo agotado detiene el
-- 100 % de la facturación, exactamente igual que un certificado vencido* — y
-- por eso los dos se miran en el mismo lugar y no en dos.
--
-- 🔴 EL CAMINO DE LA ALERTA QUE SE PIDIÓ REUSAR **NO EXISTE**, y se dice en vez
--    de fingirlo. Medido: `fiscal_emisor.certificado_vence_en` es una columna
--    **sin productor y sin lector** (cero funciones la nombran, y su valor es
--    NULL), y `cat_notificacion_tipos.audiencia` sólo admite
--    `ambas | cliente | prestador` — **no hay audiencia CASA**.
--    ⇒ Acá va lo que sí es nuestro: el LECTOR y sus umbrales, como dato.
--       El CANAL es `D-1054` (la audiencia casa y su superficie, dueño F), que
--       ya existe como ficha con dueño. *Inventar acá una audiencia nueva sería
--       decidir por otra pista una cosa que ya tiene quien la decida.*
--
-- 76(g) — VEDA: NO RIGE (config + un lector).
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.app_config (clave, valor, tipo, categoria, es_publico, descripcion) VALUES
  ('fiscal_cupo_documentos', '0', 'numero', 'integraciones', false,
   'Cupo de documentos del plan del proveedor en el periodo. NACE EN 0 = «sin cupo '
   'declarado»: el lector lo dice y NO finge vigilar. Se carga con el numero del contrato.'),
  ('fiscal_cupo_periodo', 'mensual', 'texto', 'integraciones', false,
   'Periodo del cupo: mensual | anual. Define contra que ventana se cuenta.'),
  ('fiscal_cupo_alerta_pcts', '70,90', 'texto', 'integraciones', false,
   'Umbrales de alerta del cupo, en porcentaje y como DATO. Mover un umbral es '
   'una fila, no un deploy.'),
  ('fiscal_simular_cupo_agotado', 'false', 'texto', 'integraciones', false,
   'Palanca del ENSAYO: con true el simulador rechaza por cupo y el documento vuelve '
   'a la cola con su secuencial. Un rechazo que solo se puede ensayar editando el '
   'simulador es un rechazo que nadie va a ensayar.')
ON CONFLICT (clave) DO NOTHING;

CREATE OR REPLACE FUNCTION public.fiscal_salud_emision()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
    'canal_de_la_alerta', 'D-1054 — la audiencia casa no existe todavia');
END $$;

COMMENT ON FUNCTION public.fiscal_salud_emision() IS
  'Las DOS cosas que detienen el 100 % de la facturacion —cupo del proveedor y '
  'certificado— en un solo lector. Umbrales como dato. El CANAL de la alerta es D-1054.';

REVOKE EXECUTE ON FUNCTION public.fiscal_salud_emision() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fiscal_salud_emision() TO authenticated, service_role;

DO $c$
DECLARE v jsonb;
BEGIN
  v := public.fiscal_salud_emision();
  IF v->'cupo'->>'alerta' <> 'sin_cupo_declarado' THEN
    RAISE EXCEPTION 'cinturon: sin cupo cargado el lector deberia DECIR que no puede vigilar, y dijo %',
                    v->'cupo'->>'alerta';
  END IF;
  IF v->'certificado'->>'alerta' <> 'sin_fecha_declarada' THEN
    RAISE EXCEPTION 'cinturon: el certificado no tiene fecha y el lector dijo %',
                    v->'certificado'->>'alerta';
  END IF;
  IF NOT (v->>'puede_emitir')::boolean THEN
    RAISE EXCEPTION 'cinturon: con todo sin declarar, puede_emitir deberia ser true';
  END IF;
  RAISE NOTICE 'cinturon VERDE: el lector DICE que no puede vigilar (cupo=% · cert=%), y no lo disfraza de salud',
               v->'cupo'->>'alerta', v->'certificado'->>'alerta';
END $c$;
