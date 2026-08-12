-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813004000_s96_expansion_con_voz.sql
--
-- Deshace: la firma de `expandir_alergenos_a_vigilar` vuelve a TRES columnas
-- (sin las voces). El cuerpo viejo se re-crea acá porque el DROP lo pierde
-- (fuente: M16, sección ④).
--
-- ⚠️ QUÉ NO DESHACE: nada de datos. Pero revertir devuelve a las pantallas
--    la degradación guiones→espacios como única voz de alérgeno.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.expandir_alergenos_a_vigilar(text[]);

CREATE FUNCTION public.expandir_alergenos_a_vigilar(p_alergenos text[])
RETURNS TABLE (declarado text, origen text, exacta boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp
AS $$
  SELECT lower(trim(a)) AS declarado, lower(trim(a)) AS origen, true AS exacta
    FROM unnest(p_alergenos) a
   WHERE trim(a) <> ''
  UNION
  SELECT r.alergeno_codigo, lower(trim(a)), (r.tipo = 'es_un')
    FROM unnest(p_alergenos) a
    JOIN cat_alergeno_relaciones r ON r.relacionado_codigo = lower(trim(a))
$$;
REVOKE ALL ON FUNCTION public.expandir_alergenos_a_vigilar(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expandir_alergenos_a_vigilar(text[]) TO authenticated;

COMMIT;
