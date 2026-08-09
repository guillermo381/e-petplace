/**
 * S92-A · B6 — ¿QUÉ LEGACY CONSUME `email_exists`? (orden del founder)
 *
 * El founder firmó el REVOKE y pidió dejar escrito, ANTES de ejecutarlo, qué
 * página legacy lo consumía — para que el costo quede aceptado con nombre y
 * línea, no como un «algo se puede romper» genérico.
 *
 * Se busca la INVOCACIÓN real (`rpc('email_exists')`) en los cuatro repos que
 * comparten esta DB (regla 69), separándola de las menciones en documentación y
 * tipos generados, que no son consumo.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { guardar, linea } from './lib-s92.mjs';

const ejecutar = promisify(execFile);
const REPOS = [
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-prestadores',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-admin',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-v2',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-sistema-pruebas',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace',
];

const hallazgos = [];
for (const repo of REPOS) {
  if (!existsSync(repo)) continue;
  const corto = repo.split('/').pop();
  let lineas = [];
  try {
    const { stdout } = await ejecutar('git', ['grep', '-n', '--', 'email_exists'], {
      cwd: repo,
      maxBuffer: 32 * 1024 * 1024,
    });
    lineas = stdout.split('\n').filter(Boolean);
  } catch {
    /* sin coincidencias */
  }
  for (const l of lineas) {
    const archivo = l.split(':')[0];
    const esDoc = /\.(md|txt)$/i.test(archivo);
    const esTipo = /database\.types|supabase\.types|\.d\.ts$/i.test(archivo);
    const esSql = /\.sql$/i.test(archivo);
    const invoca = /rpc\(\s*['"`]email_exists/.test(l);
    hallazgos.push({
      repo: corto,
      archivo,
      clase: invoca ? 'INVOCACIÓN' : esDoc ? 'doc' : esTipo ? 'tipo generado' : esSql ? 'definición SQL' : 'otra mención',
      linea: l.slice(0, 190),
    });
  }
}

guardar('b6-email-exists-legacy.json', hallazgos);

linea('\n══ ¿QUIÉN CONSUME `email_exists`? — los 5 repos de la casa ══\n');
const inv = hallazgos.filter((h) => h.clase === 'INVOCACIÓN');
linea(`  INVOCACIONES REALES: ${inv.length}\n`);
for (const h of inv) linea(`   🔶 ${h.repo} · ${h.linea}`);

linea('\n  otras menciones (no son consumo):');
for (const h of hallazgos.filter((x) => x.clase !== 'INVOCACIÓN')) {
  linea(`      [${h.clase}] ${h.repo} · ${h.archivo}`);
}
linea('');
