/**
 * S92-A · ¿ROMPÍ EL CAMINO LEGÍTIMO, O ES MI ASSERT?
 *
 * Dos funciones dieron 404 CON sesión de titular después de la tanda 2. Un 404
 * puede significar tres cosas MUY distintas y confundirlas es lo caro:
 *   (a) nombres de parámetro equivocados en mi llamada  → mi assert está mal
 *   (b) PostgREST oculta la función a ese rol           → le falta el GRANT
 *   (c) la función dejó de existir                       → rompí algo de verdad
 *
 * Se contesta con el catálogo: firma real + privilegio efectivo por rol.
 */
import { sql, rpc, tokenDe, linea } from './lib-s92.mjs';
import { readFileSync } from 'node:fs';

const envTxt = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = envTxt.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = envTxt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const meta = await sql(
  `SELECT p.proname, pg_get_function_arguments(p.oid) AS args,
          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_ok,
          has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_ok
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('verificar_identificacion_disponible','encontrar_prestador_emergencia')
   ORDER BY 1`,
  'diag-404',
);

linea('\n══ DIAGNÓSTICO DE LOS DOS 404 ══\n');
for (const m of meta) {
  linea(`  ${m.proname}(${m.args})`);
  linea(`     authenticated puede ejecutar: ${m.auth_ok}   ·   anon: ${m.anon_ok}`);
}

// ahora con los nombres REALES
const token = await tokenDe(DEMO_MAIL, DEMO_PW);
linea('\n  ── llamada con los nombres MEDIDOS ──');
for (const m of meta) {
  const args = {};
  for (const parte of m.args.split(',')) {
    const t = parte.trim().split(/\s+/);
    const nombre = t[0];
    const tipo = t.slice(1).join(' ').toLowerCase();
    args[nombre] = tipo.includes('double') || tipo.includes('int')
      ? (nombre.includes('lat') ? -0.18 : nombre.includes('lon') ? -78.47 : 1)
      : tipo.includes('uuid') ? '00000000-0000-0000-0000-000000000000'
      : nombre.includes('country') || nombre.includes('pais') ? 'EC'
      : '0000000000';
  }
  const conSesion = await rpc(m.proname, args, { token });
  const sinSesion = await rpc(m.proname, args);
  linea(`\n  ${m.proname}`);
  linea(`     args usados: ${JSON.stringify(args)}`);
  linea(`     CON sesión : HTTP ${conSesion.status} ${conSesion.cuerpo.slice(0, 110)}`);
  linea(`     SIN sesión : HTTP ${sinSesion.status} ${sinSesion.cuerpo.slice(0, 110)}`);
}
linea('');
