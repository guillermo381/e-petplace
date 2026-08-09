/**
 * S92-A · B6 — LOS TRES PENDIENTES DE LA MESA, medidos antes de escribirlos.
 *
 * (a) el 37 → 29 de las policies: EXPLICADO, no absorbido
 * (b) las 3 tablas sin RLS: nombradas, con razón
 * (c) las DEFINER que siguen abiertas a anon: nombradas con su decisión
 *
 * *Una diferencia de números que no se explica se convierte, dos actas después,
 * en un número que nadie puede reconstruir.*
 */
import { sql, guardar, linea } from './lib-s92.mjs';

// ── (a) EL DESGLOSE DEL 37 ─────────────────────────────────────────────────
const pol = await sql(
  `SELECT tablename, policyname,
          (COALESCE(qual,'') || ' ' || COALESCE(with_check,'')) AS expr
   FROM pg_policies
   WHERE qual ILIKE '%prestadores%' OR with_check ILIKE '%prestadores%'
   ORDER BY tablename, policyname`,
  'b6-desglose',
);

const clasificar = (e) => {
  const cruda = /from\s+prestadores/i.test(e);
  const helper = /(es_mi_prestador|prestador_activo|user_gestiona_prestador|_user_opera_cuenta_comercial|empleado_tiene_rol)/i.test(e);
  if (cruda && helper) return 'MIXTA (helper + tabla cruda)';
  if (cruda) return 'TABLA CRUDA';
  if (helper) return 'solo HELPER';
  return 'menciona sin FROM (otra tabla con «prestador» en el nombre)';
};
const grupos = {};
for (const p of pol) (grupos[clasificar(p.expr)] ??= []).push(`${p.tablename}.${p.policyname}`);

linea('\n══ (a) EL 37 → 29, DESGLOSADO ══\n');
linea(`  TOTAL de policies que mencionan «prestadores»: ${pol.length}\n`);
let suma = 0;
for (const [g, lista] of Object.entries(grupos)) {
  linea(`  ${String(lista.length).padStart(3)} · ${g}`);
  suma += lista.length;
  if (!g.startsWith('TABLA CRUDA')) for (const x of lista) linea(`         · ${x}`);
}
linea(`\n  suma de las clases: ${suma} (debe dar ${pol.length})`);

// ── (b) LAS TABLAS SIN RLS ─────────────────────────────────────────────────
const sinRls = await sql(
  `SELECT c.relname AS tabla,
          (SELECT count(*) FROM information_schema.role_table_grants g
            WHERE g.table_schema='public' AND g.table_name=c.relname
              AND g.grantee IN ('anon','authenticated','PUBLIC')
              AND g.privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE'))::int AS grants_escritura,
          (SELECT count(*) FROM information_schema.role_table_grants g
            WHERE g.table_schema='public' AND g.table_name=c.relname
              AND g.grantee='anon' AND g.privilege_type='SELECT')::int AS lectura_anon
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
   ORDER BY 1`,
  'b6-sinrls',
);
linea('\n══ (b) LAS TABLAS DE public SIN RLS ══\n');
for (const t of sinRls) {
  linea(`  · ${t.tabla.padEnd(32)} escritura-cliente=${t.grants_escritura}  lectura-anon=${t.lectura_anon}`);
}

// ── (c) LAS DEFINER QUE SIGUEN ABIERTAS ────────────────────────────────────
const abiertas = await sql(
  `SELECT p.oid::regprocedure::text AS firma, p.proname,
          (p.proconfig IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%')) AS sp_mutable,
          (SELECT count(*) FROM pg_policies pp
            WHERE pp.qual ILIKE '%'||p.proname||'%' OR pp.with_check ILIKE '%'||p.proname||'%')::int AS policies
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prosecdef AND has_function_privilege('anon', p.oid,'EXECUTE')
   ORDER BY 1`,
  'b6-abiertas',
);
linea('\n══ (c) LAS DEFINER QUE SIGUEN ALCANZABLES POR anon ══\n');
for (const f of abiertas) {
  linea(`  · ${f.firma.padEnd(30)} policies=${String(f.policies).padStart(3)}  search_path_mutable=${f.sp_mutable}`);
}

guardar('b6-pendientes-mesa.json', { desglose: grupos, total: pol.length, sinRls, abiertas });
linea('');
