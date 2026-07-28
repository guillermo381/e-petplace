-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727233000_s79_lapida_precio_plan.sql (escrita ANTES
-- de aplicar).
-- NOTA DE DATOS: los DOS valores nulleados eran RESIDUO de una columna
-- jubilada con CERO lectores (el 60 pre-reforma sin traducción posible;
-- el 11.25 = 45÷4, escrito por el taller del BUNDLE pre-reforma la
-- noche del 27-jul). Restaurarlos es documental, no funcional — nada
-- los lee. Se restauran igual, por fidelidad de reversa.
-- ═════════════════════════════════════════════════════════════════════
begin;

DROP TRIGGER IF EXISTS trg_ps_lapida_precio_plan ON public.prestador_servicios;
DROP FUNCTION IF EXISTS public._trg_ps_lapida_precio_plan();

UPDATE public.prestador_servicios SET precio_plan = 60
 WHERE id = 'bbbe70a2-bb76-452d-95b4-77573b555f92';  -- id completo medido
UPDATE public.prestador_servicios SET precio_plan = 11.25
 WHERE id = '8c45ab59-e4c4-4960-b992-4bbd6ee5df48';

commit;
