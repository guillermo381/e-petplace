-- ============================================================================
-- S87-A · LOTE 1 · CURA DE PRIVILEGIOS DE LA PIEZA ①
--
-- HALLAZGO PROPIO, en la verificación de la migración anterior: los catálogos
-- quedaron con `authenticated=arwdDxtm` — TODOS los privilegios. La causa es
-- exactamente la de L-140 una capa más arriba: el REVOKE de `20260804230000`
-- nombró `PUBLIC, anon` y NO nombró `authenticated`, que es quien trae el
-- default de Supabase sobre tablas nuevas del schema `public`. El GRANT SELECT
-- posterior era redundante: no quitaba nada.
--
-- HOY NO HAY AGUJERO: la RLS está encendida y solo existen policies de SELECT,
-- así que ningún INSERT/UPDATE/DELETE pasa. **Pero el grant sigue estando mal**,
-- y apoyarse solo en la RLS es la clase D-587 (lectores/escritores ambiguos:
-- lo que no se puede auditar leyendo el grant, no se puede auditar).
--
-- ⇒ LA LEY QUE ESTO DEJA: en una tabla de CATÁLOGO, el REVOKE nombra a
--    `authenticated` TAMBIÉN. `anon` no es el único que hereda de más.
--
-- VEDA 76(g): NO RIGE — solo privilegios, sin DDL de datos, sin backfill.
-- REVERSA: no se escribe archivo aparte — la reversa exacta es
--   `GRANT ALL ON <las dos tablas> TO authenticated;`
--   y está acá declarada a propósito: revertir esto REABRE el grant de más.
-- ============================================================================

BEGIN;

REVOKE ALL ON public.cat_notificacion_categorias FROM authenticated;
REVOKE ALL ON public.cat_notificacion_tipos      FROM authenticated;
GRANT SELECT ON public.cat_notificacion_categorias TO authenticated;
GRANT SELECT ON public.cat_notificacion_tipos      TO authenticated;

-- Cinturón: que el grant quede EXACTAMENTE en lectura, medido, no supuesto.
DO $$
DECLARE v_bad text;
BEGIN
  SELECT string_agg(c.relname || ' -> ' || array_to_string(c.relacl, ' | '), '; ')
    INTO v_bad
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname IN ('cat_notificacion_categorias','cat_notificacion_tipos')
     AND EXISTS (
       SELECT 1 FROM unnest(c.relacl) a
        WHERE a::text LIKE 'authenticated=%'
          AND a::text NOT LIKE 'authenticated=r/%'
     );
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'catalogo_con_grant_de_mas: %', v_bad;
  END IF;
  RAISE NOTICE 'grants OK — los dos catalogos quedan en SELECT para authenticated';
END $$;

COMMIT;
