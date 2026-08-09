/**
 * S92-A · EL INSTRUMENTO DE L-215 — CENSO DE IMPACTO ANTES DE TOCAR UN PERMISO.
 *
 * ── POR QUÉ EXISTE ───────────────────────────────────────────────────────────
 * S91 probó dos veces en un día que **nada avisa cuándo un permiso rompe algo
 * que no lo menciona**: la policy nombra la columna por dentro, el wrapper la
 * pide entre otros tres campos. No hay typecheck, no hay gate, no hay guard —
 * solo un 42501 en producción, horas después, en otra pantalla (L-192 en su
 * forma más cara).
 *
 * Las dos consultas ya existían y corrieron en S91. **Lo que faltaba era que
 * fueran un paso obligatorio y no un hallazgo.** Esto es ese paso.
 *
 * ── USO ──────────────────────────────────────────────────────────────────────
 *   node scripts/s92/censo-impacto.mjs tabla     prestadores
 *   node scripts/s92/censo-impacto.mjs columna   prestadores.direccion
 *   node scripts/s92/censo-impacto.mjs funcion   obtener_mi_prestador
 *
 * La salida está pensada para pegarse en el reporte tal cual.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sql, RAIZ, linea } from './lib-s92.mjs';

const ejecutar = promisify(execFile);

/** Consumidores en el ÁRBOL VERSIONADO. `git grep` y no `rg`: rg mutila la
 *  línea cuando el término aparece en ella (nota medida en S90-B), y git grep
 *  además acota a lo versionado, que es lo que este censo pregunta. */
async function enCodigo(termino) {
  try {
    const { stdout } = await ejecutar(
      'git',
      ['grep', '-n', '--', termino, 'packages/api', 'packages/domain', 'apps', 'supabase/functions'],
      { cwd: RAIZ, maxBuffer: 32 * 1024 * 1024 },
    );
    return stdout.split('\n').filter(Boolean);
  } catch {
    return []; // git grep sale 1 cuando no hay coincidencias
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function censarTabla(tabla) {
  const policies = await sql(
    `SELECT tablename, policyname, cmd, roles::text AS roles
     FROM pg_policies
     WHERE qual ILIKE '%${tabla}%' OR with_check ILIKE '%${tabla}%'
     ORDER BY tablename, policyname`,
    'ci-policies',
  );
  const vistas = await sql(
    `SELECT DISTINCT v.table_name AS vista
     FROM information_schema.view_table_usage v
     WHERE v.table_schema='public' AND v.table_name IS NOT NULL
       AND v.table_name <> '${tabla}'
       AND EXISTS (SELECT 1 FROM information_schema.view_table_usage x
                   WHERE x.view_name=v.view_name AND x.table_name='${tabla}')
     ORDER BY 1`,
    'ci-vistas',
  ).catch(() => []);
  const vistasDirectas = await sql(
    `SELECT DISTINCT view_name FROM information_schema.view_table_usage
     WHERE table_schema='public' AND table_name='${tabla}' ORDER BY 1`,
    'ci-vistas-directas',
  );
  const funciones = await sql(
    `SELECT p.oid::regprocedure::text AS funcion, p.prosecdef AS definer
     FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.prosrc ILIKE '%${tabla}%'
     ORDER BY 1`,
    'ci-funciones',
  );
  const grants = await sql(
    `SELECT grantee, privilege_type FROM information_schema.role_table_grants
     WHERE table_schema='public' AND table_name='${tabla}'
     ORDER BY grantee, privilege_type`,
    'ci-grants',
  );
  const codigo = await enCodigo(tabla);
  return { policies, vistas: vistasDirectas, funciones, grants, codigo };
}

export async function censarColumna(tabla, columna) {
  // una policy que NOMBRA la columna por dentro — el caso `cuenta_comercial_id`
  const policies = await sql(
    `SELECT tablename, policyname, cmd, roles::text AS roles
     FROM pg_policies
     WHERE (qual ILIKE '%${columna}%' OR with_check ILIKE '%${columna}%')
     ORDER BY tablename, policyname`,
    'ci-col-policies',
  );
  const grants = await sql(
    `SELECT grantee, privilege_type FROM information_schema.column_privileges
     WHERE table_schema='public' AND table_name='${tabla}' AND column_name='${columna}'
     ORDER BY grantee, privilege_type`,
    'ci-col-grants',
  );
  const funciones = await sql(
    `SELECT p.oid::regprocedure::text AS funcion FROM pg_proc p
     JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.prosrc ILIKE '%${columna}%' ORDER BY 1`,
    'ci-col-funciones',
  );
  const vistas = await sql(
    `SELECT DISTINCT view_name FROM information_schema.view_column_usage
     WHERE table_schema='public' AND table_name='${tabla}' AND column_name='${columna}'
     ORDER BY 1`,
    'ci-col-vistas',
  );
  // el wrapper que la pide en un select de cuatro campos
  const codigo = await enCodigo(columna);
  return { policies, grants, funciones, vistas, codigo };
}

export async function censarFuncion(nombre) {
  const acl = await sql(
    `SELECT p.oid::regprocedure::text AS firma, p.proacl::text AS acl, p.prosecdef AS definer,
            COALESCE(array_to_string(p.proconfig,','),'(sin config)') AS config
     FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='${nombre}'`,
    'ci-fn-acl',
  );
  // ¿la llama una POLICY? (si sí, revocarle EXECUTE al rol rompe la policy)
  const policies = await sql(
    `SELECT tablename, policyname, cmd, roles::text AS roles FROM pg_policies
     WHERE qual ILIKE '%${nombre}%' OR with_check ILIKE '%${nombre}%'
     ORDER BY tablename, policyname`,
    'ci-fn-policies',
  );
  // ¿la llama otra función, o un trigger?
  const llamadores = await sql(
    `SELECT p.oid::regprocedure::text AS funcion FROM pg_proc p
     JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname <> '${nombre}' AND p.prosrc ILIKE '%${nombre}%'
     ORDER BY 1`,
    'ci-fn-llamadores',
  );
  const triggers = await sql(
    `SELECT c.relname AS tabla, t.tgname AS trigger FROM pg_trigger t
     JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_class c ON c.oid=t.tgrelid
     WHERE p.proname='${nombre}' AND NOT t.tgisinternal ORDER BY 1,2`,
    'ci-fn-triggers',
  );
  const codigo = await enCodigo(nombre);
  return { acl, policies, llamadores, triggers, codigo };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const [, , clase, objetivo] = process.argv;

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!clase || !objetivo) {
    linea('uso: node scripts/s92/censo-impacto.mjs <tabla|columna|funcion> <objetivo>');
    process.exit(1);
  }
  linea(`\n══ CENSO DE IMPACTO · ${clase} «${objetivo}» ══`);
  linea('   (L-215: antes de todo REVOKE/GRANT. Lo que no aparece acá, igual puede romperse:');
  linea('    este censo lee catálogo y árbol versionado, no el portal legado — regla 69.)\n');

  if (clase === 'tabla') {
    const r = await censarTabla(objetivo);
    linea(`POLICIES que la nombran: ${r.policies.length}`);
    for (const p of r.policies) linea(`   · ${p.tablename}.${p.policyname} [${p.cmd}] ${p.roles}`);
    linea(`\nVISTAS que la usan: ${r.vistas.length}`);
    for (const v of r.vistas) linea(`   · ${v.view_name}`);
    linea(`\nFUNCIONES que la mencionan: ${r.funciones.length}`);
    for (const f of r.funciones.slice(0, 40)) linea(`   · ${f.funcion}${f.definer ? ' [DEFINER]' : ''}`);
    if (r.funciones.length > 40) linea(`   … y ${r.funciones.length - 40} más`);
    linea(`\nGRANTS vigentes: ${r.grants.length}`);
    const porRol = {};
    for (const g of r.grants) (porRol[g.grantee] ??= []).push(g.privilege_type);
    for (const [rol, privs] of Object.entries(porRol)) linea(`   · ${rol}: ${privs.join(', ')}`);
    linea(`\nCONSUMIDORES EN CÓDIGO: ${r.codigo.length}`);
    for (const c of r.codigo.slice(0, 25)) linea(`   · ${c.slice(0, 150)}`);
    if (r.codigo.length > 25) linea(`   … y ${r.codigo.length - 25} más`);
  } else if (clase === 'columna') {
    const [tabla, columna] = objetivo.split('.');
    const r = await censarColumna(tabla, columna);
    linea(`⚠️  POLICIES que nombran la columna: ${r.policies.length}  ← las que rompen en silencio`);
    for (const p of r.policies) linea(`   · ${p.tablename}.${p.policyname} [${p.cmd}] ${p.roles}`);
    linea(`\nGRANTS de columna vigentes: ${r.grants.length}`);
    for (const g of r.grants) linea(`   · ${g.grantee}: ${g.privilege_type}`);
    linea(`\nVISTAS que la exponen: ${r.vistas.length}`);
    for (const v of r.vistas) linea(`   · ${v.view_name}`);
    linea(`\nFUNCIONES que la mencionan: ${r.funciones.length}`);
    for (const f of r.funciones.slice(0, 30)) linea(`   · ${f.funcion}`);
    linea(`\n⚠️  CONSUMIDORES EN CÓDIGO: ${r.codigo.length}  ← los select que la piden entre otros campos`);
    for (const c of r.codigo.slice(0, 30)) linea(`   · ${c.slice(0, 150)}`);
  } else if (clase === 'funcion') {
    const r = await censarFuncion(objetivo);
    linea(`FIRMAS: ${r.acl.length}`);
    for (const a of r.acl) {
      linea(`   · ${a.firma}${a.definer ? ' [SECURITY DEFINER]' : ''}`);
      linea(`     acl: ${a.acl ?? '(NULL ⇒ PUBLIC por default)'}`);
      linea(`     config: ${a.config}`);
    }
    linea(`\n⚠️  POLICIES que la llaman: ${r.policies.length}  ← revocarle EXECUTE al rol ROMPE la policy`);
    for (const p of r.policies) linea(`   · ${p.tablename}.${p.policyname} [${p.cmd}] ${p.roles}`);
    linea(`\nTRIGGERS que la usan: ${r.triggers.length}`);
    for (const t of r.triggers) linea(`   · ${t.tabla} → ${t.trigger}`);
    linea(`\nOTRAS FUNCIONES que la llaman: ${r.llamadores.length}`);
    for (const f of r.llamadores.slice(0, 30)) linea(`   · ${f.funcion}`);
    if (r.llamadores.length > 30) linea(`   … y ${r.llamadores.length - 30} más`);
    linea(`\nCONSUMIDORES EN CÓDIGO: ${r.codigo.length}`);
    for (const c of r.codigo.slice(0, 25)) linea(`   · ${c.slice(0, 150)}`);
  } else {
    linea(`clase desconocida: ${clase}`);
    process.exit(1);
  }
  linea('');
}
