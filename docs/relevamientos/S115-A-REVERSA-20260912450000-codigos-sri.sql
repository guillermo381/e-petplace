-- REVERSA de 20260912450000_s115a_codigos_sri.sql · escrita ANTES de aplicar.
-- ⚠️ QUÉ NO DESHACE: la fila EC_IVA_5 se BORRA acá, pero si alguna línea de
--    desglose ya la usa, el DELETE va a rebotar por FK — y está bien que rebote:
--    una tarifa en uso no se retira, se despublica con `activo=false`.
DROP TABLE IF EXISTS public.cat_identificacion_sri;
ALTER TABLE public.cat_tasas_impuesto
  DROP COLUMN IF EXISTS codigo_sri,
  DROP COLUMN IF EXISTS codigo_porcentaje_sri,
  DROP COLUMN IF EXISTS fuente_codigo;
DELETE FROM public.cat_tasas_impuesto WHERE codigo = 'EC_IVA_5';
