-- REVERSA de 20260906200000_s109a_link_mensual_y_riel.sql — escrita ANTES.
-- ⚠️ NO deshace: los pedidos de pago ya emitidos se pierden con la tabla. Si
--    alguno esta `emitido` y sin pagar, revertir borra la unica traza de que se
--    le pidio plata a una familia. Censar antes.
BEGIN;
DROP FUNCTION IF EXISTS public.marcar_link_mensual_pagado(uuid);
DROP FUNCTION IF EXISTS public.vencer_links_mensuales();
DROP FUNCTION IF EXISTS public.emitir_link_mensual(text, uuid, date);
DROP FUNCTION IF EXISTS public.obtener_mis_planes_paseo();
DROP TABLE IF EXISTS public.cobro_link_mensual;
COMMIT;
