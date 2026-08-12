-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · CURA DEL JUEZ 45 — `alergia_entendimientos` nació con grants de
-- escritura HEREDADOS del default privilege (L-140 en forma de tabla: la M13
-- revocó de PUBLIC y anon, y el default de Supabase concede ALL a
-- authenticated por su lado). La RLS ya bloqueaba (cero policies de
-- escritura — probado en el cinturón de M13 con ROW_COUNT=0), así que NO
-- hubo exposición: esto quita el grant que sobra para que el append-only sea
-- por ESTRUCTURA en las dos capas, no por una sola.
--
-- Lo cazó el JUEZ (inv. 45), no una lectura — que es exactamente su trabajo.
--
-- 76(g): NO RIGE — un REVOKE. Reversa: scripts/s96/2026-08-12-s96-m18-REVERSA.sql.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

REVOKE INSERT, UPDATE, DELETE ON public.alergia_entendimientos FROM authenticated;

DO $$
DECLARE v_ok boolean;
BEGIN
  FOR v_ok IN
    SELECT has_table_privilege('authenticated', 'public.alergia_entendimientos', p)
    FROM unnest(ARRAY['INSERT','UPDATE','DELETE']) p
  LOOP
    IF v_ok THEN RAISE EXCEPTION 'cinturón: el grant de escritura sigue vivo'; END IF;
  END LOOP;
  IF NOT has_table_privilege('authenticated', 'public.alergia_entendimientos', 'SELECT') THEN
    RAISE EXCEPTION 'cinturón: el REVOKE se llevó el SELECT — el dueño dejó de ver lo suyo';
  END IF;
  RAISE NOTICE 'CINTURÓN M18 VERDE: escritura solo por la función, lectura intacta';
END $$;

COMMIT;
