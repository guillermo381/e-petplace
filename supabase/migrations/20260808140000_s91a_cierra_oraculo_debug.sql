-- ════════════════════════════════════════════════════════════════════════════
-- S91-A · 🔴 SE CIERRA UN ORÁCULO DE ENUMERACIÓN DE USUARIOS ABIERTO A `anon`
--
-- ── EL HALLAZGO ────────────────────────────────────────────────────────────
-- Apareció censando OTRA cosa (el residuo de las sondas de D). Dos funciones
-- `SECURITY DEFINER` viven en `public`, **no nacen de ninguna migración
-- versionada** y tienen EXECUTE para `anon` **y para PUBLIC**:
--   · `debug_estado_user(text)` — recibe un EMAIL
--   · `debug_session()`
--
-- **ROJO REPRODUCIDO como `anon`** (8-ago-2026): con solo un email devuelve
-- `auth.users.id`, `email_confirmed_at`, `created_at`, el estado de onboarding
-- del perfil, y las filas de `cuentas_comerciales`, `prestadores` y
-- `user_roles`. **La clave anon VIAJA EN EL BUNDLE de las dos apps**, así que
-- esto es un oráculo de enumeración de cuentas para cualquiera que tenga la
-- app instalada: probar emails y saber cuáles existen, desde cuándo, y si son
-- prestadores.
--
-- *No es una fuga de las que se descubren leyendo el modelo: es una herramienta
-- de diagnóstico del legado que nadie volvió a mirar. Por eso apareció barriendo
-- residuos y no auditando features — y por eso L-140 exige mirar `proacl`, no
-- confiar en que «una función de debug no la llama nadie».*
--
-- ── LA CURA ────────────────────────────────────────────────────────────────
-- REVOKE, no DROP. Dos razones: el DROP es irreversible y estas funciones
-- pueden estar en uso por el portal legado que comparte esta DB (regla 69), y
-- **el REVOKE ya elimina el 100% del riesgo** — nadie con clave pública las
-- ejecuta. Su DROP se decide en S92 con el censo del legado delante.
--
-- Se revoca también a `authenticated`: ningún usuario logueado tiene por qué
-- enumerar cuentas ajenas por email. **Cero callers en el monorepo** (medido:
-- solo aparecen en `database.types.ts`, que es generado).
--
-- ── VEDA 76(g): NO RIGE ── un REVOKE. Sin DDL de datos, sin backfill.
-- Servidor puro: no necesita publish.
-- ── REVERSA: `docs/relevamientos/2026-08-08-s91a-REVERSA-debug-anon.sql`,
--    con su nota: revertir REABRE el oráculo.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

REVOKE EXECUTE ON FUNCTION public.debug_estado_user(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_session()        FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.debug_estado_user(text) IS
  'HERRAMIENTA DE DIAGNÓSTICO DEL LEGADO — NO ejecutable por anon/authenticated (S91: era un oráculo de enumeración de cuentas por email, con la clave anon que viaja en el bundle). Si alguna vez vuelve a necesitarse, se llama desde una sesión de servicio, jamás desde el cliente.';
COMMENT ON FUNCTION public.debug_session() IS
  'HERRAMIENTA DE DIAGNÓSTICO DEL LEGADO — EXECUTE revocado en S91 junto con debug_estado_user (misma familia: SECURITY DEFINER sin migración y con anon en proacl).';

-- ⚠️ EL CINTURÓN SE ESCRIBE POR ENTRADA DE ACL, NO POR LIKE SOBRE EL TEXTO
-- ENTERO: el primer intento usó `LIKE '%=X/%'` para cazar a PUBLIC y también
-- matcheaba `postgres=X/postgres`. Abortó la migración con las funciones aún
-- abiertas — el guard dio un rojo VERDADERO por una razón FALSA, que es
-- justo el modo de falla que L-192 persigue. PUBLIC en un aclitem es el
-- grantee VACÍO: la entrada empieza con '='.
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n
    FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace,
         LATERAL unnest(coalesce(p.proacl, '{}'::aclitem[])) AS a(entrada)
   WHERE ns.nspname = 'public'
     AND p.proname IN ('debug_estado_user','debug_session')
     AND (a.entrada::text LIKE 'anon=%'
       OR a.entrada::text LIKE 'authenticated=%'
       OR a.entrada::text LIKE '=%');
  IF n <> 0 THEN
    RAISE EXCEPTION 'CINTURON L-140: % concesión(es) a anon/authenticated/PUBLIC siguen vivas', n;
  END IF;
END $$;

COMMIT;
