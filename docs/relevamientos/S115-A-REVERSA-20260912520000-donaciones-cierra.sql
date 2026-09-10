-- REVERSA de 20260912520000 · escrita ANTES.
-- ⚠️ REVERTIR ESTO REABRE LA PUERTA: vuelve a dejar que cualquiera con la anon
--    key —que viaja en el bundle— escriba y lea filas de `donaciones` sin cuenta.
DROP POLICY IF EXISTS donaciones_insert ON public.donaciones;
DROP POLICY IF EXISTS donaciones_select ON public.donaciones;
CREATE POLICY donaciones_insert ON public.donaciones FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));
CREATE POLICY donaciones_select ON public.donaciones FOR SELECT TO public
  USING ((auth.uid() = user_id) OR (user_id IS NULL));
