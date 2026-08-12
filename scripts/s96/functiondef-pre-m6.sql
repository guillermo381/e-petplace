-- FUNCTIONDEF pre-M6 (capturado del objeto vivo, 12-ago-2026)

CREATE OR REPLACE FUNCTION public._trg_inventario_aplicar_movimiento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_delta_disp integer := 0;
  v_delta_res  integer := 0;
BEGIN
  CASE NEW.tipo
    WHEN 'ingreso'            THEN v_delta_disp :=  NEW.cantidad;
    WHEN 'ajuste'             THEN v_delta_disp :=  NEW.cantidad;   -- con signo
    WHEN 'merma'              THEN v_delta_disp := -NEW.cantidad;
    WHEN 'reserva'            THEN v_delta_disp := -NEW.cantidad; v_delta_res :=  NEW.cantidad;
    WHEN 'liberacion_reserva' THEN v_delta_disp :=  NEW.cantidad; v_delta_res := -NEW.cantidad;
    WHEN 'consumo'            THEN v_delta_res  := -NEW.cantidad;  -- sale de lo reservado
    ELSE RAISE EXCEPTION 'tipo de movimiento no soportado: %', NEW.tipo;
  END CASE;

  UPDATE vendedor_skus
     SET stock_disponible = stock_disponible + v_delta_disp,
         stock_reservado  = stock_reservado  + v_delta_res,
         updated_at       = now()
   WHERE id = NEW.sku_id;

  -- Los CHECK `>= 0` de vendedor_skus son los que rebotan sobrerreserva y
  -- consumo de lo que no está reservado. No hace falta duplicarlos acá: el
  -- estado imposible ya es inexpresable en la tabla del saldo.
  RETURN NEW;
END $function$
;
