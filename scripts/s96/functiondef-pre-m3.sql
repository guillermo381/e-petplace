-- FUNCTIONDEF pre-M3 (capturado del objeto vivo, 12-ago-2026)

CREATE OR REPLACE FUNCTION public.calcular_promesa_entrega(p_bodega_id uuid, p_horas_transito integer DEFAULT 24, p_desde timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_b     record;
  v_base  timestamptz;
  v_local timestamp;
BEGIN
  SELECT * INTO v_b FROM vendedor_bodegas WHERE id = p_bodega_id AND activo;
  IF v_b.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bodega_no_encontrada');
  END IF;

  v_local := p_desde AT TIME ZONE v_b.zona_horaria;

  -- 🔴 EL CORTE. Un pedido a las 6 de la tarde NO sale hoy — causa número uno
  --    de promesas incumplidas. Si la bodega no declaró corte, NO se inventa:
  --    se usa el momento del pedido y la respuesta lo DICE.
  IF v_b.hora_corte IS NOT NULL AND v_local::time > v_b.hora_corte THEN
    v_base := ((v_local::date + 1) + v_b.hora_corte) AT TIME ZONE v_b.zona_horaria;
  ELSE
    v_base := p_desde;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'desde', v_base + (v_b.horas_preparacion || ' hours')::interval
                    + (p_horas_transito || ' hours')::interval,
    'hasta', v_base + (v_b.horas_preparacion || ' hours')::interval
                    + ((p_horas_transito + 24) || ' hours')::interval,
    'hora_corte_declarada', v_b.hora_corte IS NOT NULL,
    'paso_el_corte', v_b.hora_corte IS NOT NULL AND v_local::time > v_b.hora_corte,
    'horas_preparacion', v_b.horas_preparacion,
    'horas_transito', p_horas_transito);
END $function$
;
