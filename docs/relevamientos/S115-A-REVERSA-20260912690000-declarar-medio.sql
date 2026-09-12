-- REVERSA de 20260912690000_s115a_declarar_medio.sql — escrita ANTES.
-- ⚠️ QUÉ NO DESHACE: los medios ya declarados a mano QUEDAN escritos en
--    `pagos_intentos.medio_pago`. Borrarlos dejaría documentos ya emitidos sin
--    la forma de pago que viajó en su XML. Se pierde la HUELLA (quién y
--    cuándo), que es justo lo que la puerta existe para dejar.
DROP FUNCTION IF EXISTS public.fiscal_declarar_medio_de_pago(uuid, text, text);
ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS medio_pago_declarado_por;
ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS medio_pago_declarado_en;
