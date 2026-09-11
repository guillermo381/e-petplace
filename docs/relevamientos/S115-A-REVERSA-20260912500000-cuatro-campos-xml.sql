-- REVERSA de 20260912500000_s115a_cuatro_campos_xml.sql · escrita ANTES.
-- ⚠️ `pagos_intentos.medio_pago` se borra: cualquier valor que la puerta de cobro
--    haya empezado a escribir SE PIERDE, y con él la única forma de saber con qué
--    instrumento se pagó cada cobro de esa ventana. No es reconstruible.
DROP FUNCTION IF EXISTS public.fiscal_forma_pago_del_intento(uuid);
DROP TABLE IF EXISTS public.cat_forma_pago_sri;
ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS medio_pago;
ALTER TABLE public.fiscal_emisor
  DROP COLUMN IF EXISTS direccion_establecimiento,
  DROP COLUMN IF EXISTS moneda_literal;
