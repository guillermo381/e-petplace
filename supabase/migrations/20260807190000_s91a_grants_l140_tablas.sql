-- ============================================================================
-- S91-A · L-140 EN SU VERSIÓN DE TABLA — las tres nuevas cierran su puerta
-- ============================================================================
-- MEDIDO tras aplicar 170000/173000/180000: las tres tablas nuevas nacieron
-- con ALL (SELECT+INSERT+UPDATE+DELETE+TRUNCATE+REFERENCES+TRIGGER) para
-- `anon` Y `authenticated` — los default privileges de Supabase, exactamente
-- el mismo mecanismo que L-140 documentó para FUNCIONES. Hoy solo la RLS las
-- salva (no hay policy de INSERT/UPDATE ⇒ rebota), pero un grant que nadie
-- decidió es un grant que nadie puede auditar: la defensa queda en UNA capa.
--
-- La casa tiene dos posturas medidas: las tablas legacy con el default flojo
-- (cat_especies, evento_cambio_nombre, evento_bitacora_familia…) y el
-- precedente NUEVO de S90 — `cat_documentos_mascota`, que tiene SOLO
-- `SELECT` para `authenticated` y NADA para `anon`. Estas tres siguen ese
-- precedente, que es el más nuevo y el más angosto.
--
-- Por qué authenticated y no anon: las tres se leen DESPUÉS del login (el
-- alta exige sesión — crear_familia_con_primera_mascota rebota
-- `no_autenticado`; el hito vive en el expediente). Si alguna superficie
-- pre-login necesitara razas algún día, el GRANT se agrega con su letra.
-- El barrido de las tablas LEGACY no se hace acá (sería una tanda propia con
-- su censo de lectores anon reales) — se declara como deuda, no se toca a
-- ciegas.
--
-- Veda 76(g): NO RIGE — solo privilegios, cero datos, cero DDL de forma.
-- D-662: ningún bundle vivo lee estas tablas (nacieron hoy).
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-07-s91a-REVERSA-grants-tablas-nuevas.sql
-- ============================================================================

BEGIN;

REVOKE ALL ON TABLE public.cat_razas             FROM anon, authenticated;
REVOKE ALL ON TABLE public.cat_hitos_narrativos  FROM anon, authenticated;
REVOKE ALL ON TABLE public.evento_hito_narrativo FROM anon, authenticated;

GRANT SELECT ON TABLE public.cat_razas             TO authenticated;
GRANT SELECT ON TABLE public.cat_hitos_narrativos  TO authenticated;
GRANT SELECT ON TABLE public.evento_hito_narrativo TO authenticated;

-- ── Cinturón: la sonda mide el RESULTADO, no la intención ───────────────────
DO $$
DECLARE
  v_flojo int;
  v_lee   int;
BEGIN
  -- El cinturón declara CONTRA QUÉ mide: SOLO los dos roles del cliente.
  -- (postgres/service_role/supabase_admin conservan ALL por diseño de la
  -- plataforma — su primera versión no los excluía y se disparó con 36:
  -- rojo producido contra el predicado, no contra el estado.)
  SELECT count(*) INTO v_flojo
    FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND table_name IN ('cat_razas','cat_hitos_narrativos','evento_hito_narrativo')
     AND grantee IN ('anon', 'authenticated')
     AND (grantee = 'anon' OR privilege_type <> 'SELECT');
  IF v_flojo <> 0 THEN
    RAISE EXCEPTION 'cinturon_grants: quedan % grants fuera de (authenticated, SELECT)', v_flojo;
  END IF;

  SELECT count(*) INTO v_lee
    FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND table_name IN ('cat_razas','cat_hitos_narrativos','evento_hito_narrativo')
     AND grantee = 'authenticated' AND privilege_type = 'SELECT';
  IF v_lee <> 3 THEN
    RAISE EXCEPTION 'cinturon_grants: % de 3 tablas leen como authenticated — el REVOKE se llevo la lectura', v_lee;
  END IF;
END $$;

COMMIT;
