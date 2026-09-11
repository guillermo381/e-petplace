-- REVERSA de 20260912630000_s115a_formapago_y_esquema.sql — escrita ANTES.
-- ⚠️ QUÉ NO DESHACE: si algún documento se emitió con `forma_pago_sri` resuelto
--    desde estas filas, su canónico ya lo tiene CONGELADO adentro. Vaciar el
--    catálogo no cambia lo emitido — y está bien que no lo cambie.
DELETE FROM public.cat_forma_pago_sri
 WHERE country_code = 'EC' AND medio IN ('credito', 'debito', 'deuna');
UPDATE public.fiscal_emisor SET version_esquema = '2.1.0';
