create or replace function pg_temp._sonda_origen(p_valor text) returns text
language plpgsql as $f$
DECLARE v_id uuid;
BEGIN
  BEGIN
    INSERT INTO public.eventos_economicos (
      tipo_evento, revenue_stream, country_code, moneda, monto_bruto,
      monto_kushki_fee, monto_plataforma, origen_tipo, origen_id,
      fecha_devengo, estado)
    VALUES ('cita_pagada','transaccional','EC','USD',1.00,0,0.10, p_valor,
            gen_random_uuid(), now(), 'no_aplica')
    RETURNING id INTO v_id;
    -- deshacer SIEMPRE: la sonda no deja plata inventada en el ledger
    RAISE EXCEPTION 'SONDA_ENTRO';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'SONDA_ENTRO' THEN RETURN '🔴 ENTRÓ';
    END IF;
    RETURN '✅ rebotó · '||SQLSTATE||' · '||left(SQLERRM,60);
  END;
END $f$;

select v as caso, pg_temp._sonda_origen(v) as veredicto from (values
  ('guarderia_estadia'),('estadia'),('pedido'),('cualquier_cosa_xyz'),('cita')
) t(v);
