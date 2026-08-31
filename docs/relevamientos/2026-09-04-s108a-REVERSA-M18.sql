-- REVERSA de 20260904200000_s108a_desglose_lo_garantiza_la_tabla.sql — ANTES.
-- ⚠️ Revertir REABRE los tres huecos: un bono puede volver a nacer sin desglose
--    y la edge lo rechaza despues con `desglose_incompleto`, que no dice esto.
BEGIN;
CREATE OR REPLACE FUNCTION public._trg_bono_congela_desglose()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_moneda text; v_fee uuid;
BEGIN
  IF NEW.estado_pago IS DISTINCT FROM 'pendiente' THEN RETURN NEW; END IF;
  IF NEW.precio_total IS NULL THEN RETURN NEW; END IF;

  SELECT cc.moneda INTO v_moneda
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = NEW.prestador_id;
  IF v_moneda IS NULL THEN RETURN NEW; END IF;

  SELECT rfa.fee_config_id INTO v_fee
    FROM prestadores pr
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    CROSS JOIN LATERAL _resolver_fee_aplicable(
      p_cuenta_comercial_id => cc.id,
      p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
      p_country_code        => NEW.country_code,
      p_revenue_stream      => 'transaccional'::revenue_stream_enum,
      p_tipo_origen         => 'cita',
      p_categoria_origen    => NULL,
      p_fecha_referencia    => now()
    ) rfa
   WHERE pr.id = NEW.prestador_id;

  INSERT INTO bono_desglose (bono_id, subtotal, impuesto, total, moneda, fee_config_id)
  VALUES (NEW.id, NEW.precio_total, 0, NEW.precio_total, v_moneda, v_fee)
  ON CONFLICT (bono_id) DO NOTHING;   -- se congela UNA vez
  RETURN NEW;
END $function$

;
COMMIT;
