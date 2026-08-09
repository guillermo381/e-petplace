/**
 * S92-A · B0 — LA FOTO INICIAL. Los tres censos del §5 del arranque.
 *
 * Es la LÍNEA BASE del burn-down (regla 81): lo que este script imprime hoy es
 * contra lo que se mide todo lo que la sesión cierre. No cura nada, no escribe
 * en la DB: lee el catálogo.
 *
 * Corre: node scripts/s92/b0-censos.mjs
 */

import { sql, guardar, linea } from './lib-s92.mjs';

// ─── §5.1 · D-701 — DEFINER alcanzables por anon/PUBLIC ──────────────────────
// `proacl IS NULL` = privilegios por default = PUBLIC tiene EXECUTE. Una
// función sin ACL explícita ES parte del conjunto aunque nadie le concedió nada
// a mano — el matiz que infla o esconde el número.
const CENSO_DEFINER = `
SELECT p.oid::regprocedure::text AS funcion,
       (p.proacl IS NULL) AS acl_default_public,
       COALESCE((SELECT bool_or(a.grantee = 0) FROM aclexplode(p.proacl) a
                 WHERE a.privilege_type = 'EXECUTE'), false) AS tiene_public,
       COALESCE((SELECT bool_or(a.grantee = 'anon'::regrole) FROM aclexplode(p.proacl) a
                 WHERE a.privilege_type = 'EXECUTE'), false) AS tiene_anon,
       (p.proconfig IS NULL
        OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c
                       WHERE c LIKE 'search_path=%')) AS search_path_mutable
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
  AND (p.proacl IS NULL
       OR EXISTS (SELECT 1 FROM aclexplode(p.proacl) a
                  WHERE a.privilege_type = 'EXECUTE'
                    AND (a.grantee = 0 OR a.grantee = 'anon'::regrole)))
ORDER BY 1`;

// ─── §5.2 · D-700 — policies con referencia cruda a `prestadores` ────────────
const CENSO_POLICIES = `
SELECT schemaname, tablename, policyname, cmd, roles::text AS roles,
       COALESCE(qual,'') AS qual, COALESCE(with_check,'') AS with_check
FROM pg_policies
WHERE qual ILIKE '%prestadores%' OR with_check ILIKE '%prestadores%'
ORDER BY tablename, policyname`;

// ─── §5.3 · D-686 — grants de tabla y de columna a anon/PUBLIC ───────────────
const CENSO_GRANTS_TABLA = `
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('anon','PUBLIC') AND table_schema = 'public'
ORDER BY table_name, privilege_type`;

const CENSO_GRANTS_COLUMNA = `
SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.column_privileges
WHERE grantee IN ('anon','PUBLIC') AND table_schema = 'public'
ORDER BY table_name, column_name`;

// ── total de DEFINER, para dar denominador al número de arriba ───────────────
const TOTAL_DEFINER = `
SELECT count(*)::int AS n FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef`;

const definer = await sql(CENSO_DEFINER, 'censo-definer');
const policies = await sql(CENSO_POLICIES, 'censo-policies');
const grantsT = await sql(CENSO_GRANTS_TABLA, 'censo-grants-tabla');
const grantsC = await sql(CENSO_GRANTS_COLUMNA, 'censo-grants-columna');
const [{ n: totalDefiner }] = await sql(TOTAL_DEFINER, 'total-definer');

guardar('b0-definer.json', definer);
guardar('b0-policies.json', policies);
guardar('b0-grants-tabla.json', grantsT);
guardar('b0-grants-columna.json', grantsC);

linea('\n══ B0 · SNAPSHOT DE ARRANQUE S92 — línea base del burn-down ══\n');

linea(`§5.1 · DEFINER de public alcanzables por anon/PUBLIC: ${definer.length}   (de ${totalDefiner} DEFINER totales)`);
linea(`        acl NULL (default ⇒ PUBLIC):  ${definer.filter((r) => r.acl_default_public).length}`);
linea(`        PUBLIC explícito:             ${definer.filter((r) => r.tiene_public).length}`);
linea(`        anon explícito:               ${definer.filter((r) => r.tiene_anon).length}`);
linea(`        search_path MUTABLE:          ${definer.filter((r) => r.search_path_mutable).length}`);
linea(`        ↳ el acta S91 declaró 59. DIFERENCIA: ${definer.length - 59} (se explica, no se absorbe)`);

const tablasPol = [...new Set(policies.map((p) => p.tablename))];
linea(`\n§5.2 · policies con 'prestadores' crudo en qual/with_check: ${policies.length}   sobre ${tablasPol.length} tablas`);
linea(`        ↳ el acta S91 declaró 37. DIFERENCIA: ${policies.length - 37}`);

const tablasConGrant = [...new Set(grantsT.map((g) => g.table_name))];
linea(`\n§5.3 · grants de TABLA a anon/PUBLIC: ${grantsT.length} filas sobre ${tablasConGrant.length} tablas`);
const escritura = grantsT.filter((g) => ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'].includes(g.privilege_type));
const tablasEscribibles = [...new Set(escritura.map((g) => g.table_name))];
linea(`        de ellos ESCRITURA (INSERT/UPDATE/DELETE/TRUNCATE): ${escritura.length} sobre ${tablasEscribibles.length} tablas`);
linea(`        grants de COLUMNA a anon/PUBLIC: ${grantsC.length} filas`);

linea('\n  (detalle completo en scripts/s92/salida/b0-*.json)\n');
