-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727150000_s79_v_publicos_invoker.sql (escrita ANTES
-- de aplicar, regla de la casa S78).
--
-- Qué deshace: devuelve v_prestadores_publicos a su estado medido en
-- la Tanda 1 (2026-07-27-s79a-lecturas.md, hallazgo lateral 1):
--   · reloptions NULL (sin security_invoker → semántica DEFINER/owner)
--   · anon con ACL total (anon=arwdDxtm — el estado heredado de v2)
--
-- NOTA DE DATOS: la migración no toca ni una fila — revertir el DDL
-- restaura el comportamiento EXACTO anterior, sin pérdida posible.
-- ═════════════════════════════════════════════════════════════════════
begin;

ALTER VIEW public.v_prestadores_publicos RESET (security_invoker);
GRANT ALL ON public.v_prestadores_publicos TO anon;

commit;
