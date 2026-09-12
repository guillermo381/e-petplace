-- REVERSA de 20260912760000_s115a_tax_profile_setof.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ QUÉ NO DESHACE: nada de datos — es sólo la forma del retorno.
--    Revertir REINTRODUCE el defecto: sin perfil, PostgREST devuelve UNA fila
--    de NULLs en vez de cero filas, y todo `if (!data)` la deja pasar.
DROP FUNCTION IF EXISTS public.fiscal_tax_profile_mio();
CREATE OR REPLACE FUNCTION public.fiscal_tax_profile_mio()
RETURNS public.tax_profiles LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT * FROM public.tax_profiles
   WHERE user_id = auth.uid() AND es_predeterminado LIMIT 1;
$fn$;
REVOKE EXECUTE ON FUNCTION public.fiscal_tax_profile_mio() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_tax_profile_mio() TO authenticated;
