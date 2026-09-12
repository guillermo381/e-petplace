-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA AUSENCIA DE PERFIL DEJA DE PARECERSE A UN PERFIL VACÍO
--
-- 🔴 LA CAUSA, MEDIDA CON DISCRIMINADOR (11-sep-2026, hallazgo de C):
--    `fiscal_tax_profile_mio` declaraba `RETURNS public.tax_profiles` —un
--    compuesto, no un conjunto—. Cuando el SELECT no encuentra fila, Postgres
--    devuelve un compuesto NULL, y PostgREST resuelve la función como
--    `SELECT * FROM fn()`: **eso expande el NULL a UNA FILA con todas sus
--    columnas en NULL.** Medido en el motor, las dos formas lado a lado:
--
--      RETURNS tax_profiles        →  1 fila,  todo_null = true
--      RETURNS SETOF tax_profiles  →  0 filas
--
--    *El objeto de nulls es `truthy`.* Todo `if (!data) return null` lo deja
--    pasar entero, la pantalla cree que hay perfil y el selector nunca se
--    monta: de ahí salieron los tres síntomas del founder —no le preguntó a
--    quién facturar, facturó a consumidor final, y la etiqueta salió rota—.
--
-- 🔴 POR QUÉ `SETOF` Y NO UN GUARD EN EL WRAPPER. Eran dos curas posibles y
--    la diferencia no es de estilo:
--      · Cortar en el wrapper por un campo (`if (!f.tipo_identificacion)`)
--        **arregla ESTE consumidor y deja la trampa armada** para el
--        siguiente — y para el portal de operaciones, que no pasa por él.
--      · `SETOF` hace la fila fantasma **INEXPRESABLE en la fuente**: cero
--        filas es cero filas para todo el mundo, hoy y siempre.
--    Es la ley de la casa —*el estado malo no se detecta: se vuelve imposible*
--    (L-222)— y además la única que protege a quien todavía no escribió su
--    lector.
--
-- ⚠️ EL CONTRATO NO CAMBIA PARA EL WRAPPER QUE YA EXISTE: `.rpc()` con SETOF
--    devuelve un array; `obtenerTaxProfile` hace `if (!data)`, y `[]` **también
--    es truthy**. Por eso la migración sola NO alcanza y el wrapper se ajusta
--    en el mismo acto (L-537: si una capa aprende la regla y la otra no,
--    decide la que no aprendió).
--
-- VEDA 76(g): NO RIGE — cambia la forma del retorno, cero DDL sobre datos,
-- cero backfill. Reversa: `docs/relevamientos/S115-A-REVERSA-20260912760000.sql`.
-- ═══════════════════════════════════════════════════════════════════════════

-- L-119: firma distinta ⇒ DROP explícito. `CREATE OR REPLACE` no puede cambiar
-- el tipo de retorno y fallaría; sin el DROP, esta migración muere entera.
DROP FUNCTION IF EXISTS public.fiscal_tax_profile_mio();

CREATE FUNCTION public.fiscal_tax_profile_mio()
RETURNS SETOF public.tax_profiles LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT * FROM public.tax_profiles
   WHERE user_id = auth.uid() AND es_predeterminado LIMIT 1;
$fn$;

-- L-140: toda función nace con EXECUTE para `anon`. Se revoca explícito.
REVOKE EXECUTE ON FUNCTION public.fiscal_tax_profile_mio() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_tax_profile_mio() TO authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_filas int; v_acl text;
BEGIN
  -- ① La forma: cero filas cuando no hay perfil. `auth.uid()` es NULL acá, así
  --    que el WHERE no matchea: es exactamente el caso que producía el fantasma.
  SELECT count(*) INTO v_filas FROM public.fiscal_tax_profile_mio();
  IF v_filas <> 0 THEN
    RAISE EXCEPTION 'cinturon: sin perfil devolvió % filas, esperaba 0 — el fantasma sigue vivo', v_filas;
  END IF;

  -- ② La audiencia, por `proacl` y no por la intención de la línea de arriba.
  SELECT coalesce(array_to_string(proacl, ','), '') INTO v_acl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'fiscal_tax_profile_mio';
  IF v_acl LIKE '%anon=X%' THEN
    RAISE EXCEPTION 'cinturon: anon conserva EXECUTE (%)', v_acl;
  END IF;

  -- ③ Una sola firma viva (L-119: el DROP de arriba tiene que haber servido).
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname='public' AND p.proname='fiscal_tax_profile_mio') <> 1 THEN
    RAISE EXCEPTION 'cinturon: quedó más de una sobrecarga de fiscal_tax_profile_mio';
  END IF;

  RAISE NOTICE 'cinturon OK · 0 filas sin perfil · anon sin EXECUTE · 1 sola firma';
END $cint$;
