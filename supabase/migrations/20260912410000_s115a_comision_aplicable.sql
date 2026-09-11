-- S115-A · ③ + LA FIRMA DEL FOUNDER (opción 3) — LA COMISIÓN SE PIDE POR FECHA
-- Reversa: DROP FUNCTION public.comision_aplicable(uuid, text, date);
-- VEDA 76(g): NO RIGE.
--
-- 🔴 LA REGLA FIRMADA: *«la pantalla pide al motor la comisión aplicable a la FECHA EN
--    QUE EL PRECIO VA A REGIR, no la de hoy, y el motor resuelve de `fee_configs` por
--    vigencia. Nada de "1-oct" escrito en ninguna capa.»*
--
--    Por qué importa, medido: hoy el resolver devuelve **10 %** y desde el 1-oct **18 %**.
--    Un prestador que configura su precio hoy para operar en octubre vería «recibís el
--    90 %» y cobraría el 82 %. *La pantalla no puede preguntar «cuánto es hoy»: tiene que
--    preguntar «cuánto va a ser cuando esto rija».*
--    Y la fecha la pone QUIEN PREGUNTA — acá no hay ninguna fecha escrita.

BEGIN;

CREATE OR REPLACE FUNCTION public.comision_aplicable(
  p_prestador_id uuid, p_tipo_servicio text, p_fecha date DEFAULT current_date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE r record; v_cat text; v_cod text; v_pct numeric; v_cc uuid; v_ts timestamptz;
BEGIN
  v_ts := (p_fecha::timestamptz + interval '12 hours');   -- mediodía: no roza el borde

  SELECT pr.cuenta_comercial_id INTO v_cc FROM prestadores pr WHERE pr.id = p_prestador_id;
  IF v_cc IS NULL THEN
    RETURN jsonb_build_object('conocida', false, 'motivo', 'prestador_sin_cuenta_comercial');
  END IF;

  SELECT ts.categoria, ts.codigo_iva, ct.pct INTO v_cat, v_cod, v_pct
    FROM tipos_servicio ts
    LEFT JOIN cat_tasas_impuesto ct ON ct.codigo = ts.codigo_iva AND ct.activo
     AND ct.vigencia_desde <= v_ts AND (ct.vigencia_hasta IS NULL OR ct.vigencia_hasta > v_ts)
   WHERE ts.codigo = p_tipo_servicio;
  IF v_cat IS NULL THEN
    RETURN jsonb_build_object('conocida', false, 'motivo', 'tipo_servicio_no_existe');
  END IF;

  SELECT * INTO r FROM _resolver_fee_aplicable(
    v_cc, 'prestador_servicios'::tipo_actor_enum, 'EC',
    'transaccional'::revenue_stream_enum,
    CASE WHEN v_cat = 'hospedaje' THEN 'estadia' ELSE 'cita' END,
    v_cat, v_ts);

  /* Fail-closed: sin fee resuelto NO se devuelve 0 % — decir «te queda el 100 %» es
     la mentira más cara que esta pantalla puede decir. */
  IF r.fee_config_id IS NULL THEN
    RETURN jsonb_build_object('conocida', false, 'motivo', 'sin_fee_vigente_para_esa_fecha',
                              'fecha_consultada', p_fecha);
  END IF;

  RETURN jsonb_build_object(
    'conocida', true,
    'fecha_consultada', p_fecha,          -- ⬅ se devuelve para que la pantalla la muestre
    'pct',    (r.parametros->>'pct')::numeric,
    'minimo', r.minimo_por_transaccion,
    'base',   COALESCE(r.parametros->>'base','subtotal'),
    'comision_lleva_iva', COALESCE((r.parametros->>'comision_lleva_iva')::boolean, false),
    'codigo_iva', v_cod, 'tarifa_iva_pct', v_pct,
    'categoria', v_cat, 'fee_config_id', r.fee_config_id);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.comision_aplicable(uuid, text, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.comision_aplicable(uuid, text, date) TO authenticated;

COMMENT ON FUNCTION public.comision_aplicable(uuid, text, date) IS
  'Lo que el prestador va a recibir, para la FECHA en que su precio vaya a regir. La fecha la pone quien pregunta: acá no hay ninguna fecha escrita, y el 1-oct no aparece en ninguna capa — vive en fee_configs.vigencia_desde.';

/* Discriminador en la propia migración: la misma pregunta a dos fechas tiene que dar
   DOS respuestas. Si diera la misma, la vigencia no estaría haciendo nada y toda la
   firma sería decorativa. */
DO $$
DECLARE v_hoy jsonb; v_oct jsonb; v_pr uuid;
BEGIN
  SELECT ps.prestador_id INTO v_pr FROM prestador_servicios ps
    JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
   WHERE ts.categoria = 'paseo' LIMIT 1;
  IF v_pr IS NULL THEN RAISE EXCEPTION 'cinturon_sin_datos: no hay oferta de paseo'; END IF;

  v_hoy := public.comision_aplicable(v_pr, 'paseo', current_date);
  v_oct := public.comision_aplicable(v_pr, 'paseo', '2026-10-15'::date);

  IF NOT (v_hoy->>'conocida')::boolean OR NOT (v_oct->>'conocida')::boolean THEN
    RAISE EXCEPTION 'cinturon_no_resuelve: hoy=% oct=%', v_hoy, v_oct;
  END IF;
  IF (v_hoy->>'pct')::numeric = (v_oct->>'pct')::numeric THEN
    RAISE EXCEPTION 'cinturon_vigencia_muda: las dos fechas dan % — la vigencia no discrimina',
      v_hoy->>'pct';
  END IF;
  RAISE NOTICE 'comision_aplicable: hoy=%%% · 15-oct=%%%', v_hoy->>'pct', v_oct->>'pct';
END $$;

COMMIT;
