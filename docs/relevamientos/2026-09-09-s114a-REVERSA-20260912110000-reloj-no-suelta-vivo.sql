-- REVERSA de 20260912110000_s114a_reloj_no_suelta_intento_vivo.sql
-- Restaura liberar_reservas_saldo_vencidas SIN la condición de intento vivo
-- (suelta por tiempo puro). NOTA: revertir NO deshace datos.
CREATE OR REPLACE FUNCTION public.liberar_reservas_saldo_vencidas()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_n int;
BEGIN
  WITH sueltas AS (
    UPDATE compras
       SET saldo_aplicado = 0, saldo_reservado_hasta = NULL, updated_at = now()
     WHERE estado = 'esperando_pago'
       AND saldo_aplicado > 0
       AND saldo_reservado_hasta IS NOT NULL
       AND saldo_reservado_hasta < now()
     RETURNING 1)
  SELECT count(*) INTO v_n FROM sueltas;
  RETURN v_n;
END $function$;
