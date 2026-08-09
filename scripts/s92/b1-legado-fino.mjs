/**
 * S92-A · B1 — ¿EL LEGADO LAS LLAMA, O SOLO LAS CREÓ?
 *
 * La medición gruesa dijo «57 de 59 aparecen en e-petplace-prestadores» y con
 * ese número solo no se puede decidir nada: el legado es el repo donde NACIERON
 * casi todas estas funciones, así que aparecer en un `.sql` de migración es lo
 * ESPERABLE y no prueba consumo. Lo que prohíbe un REVOKE es otra cosa: que el
 * legado las INVOQUE desde código vivo (`.rpc('nombre')`).
 *
 * Confundir las dos lecturas es el error de L-211 en su forma más cara acá:
 * un «57 de 59» leído como consumo frenaría la sesión entera sobre una premisa
 * falsa; leído como «nacieron ahí» no frena nada. Se separa por TIPO DE ARCHIVO
 * y por FORMA DE LA LLAMADA.
 *
 * Corre: node scripts/s92/b1-legado-fino.mjs
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { guardar, SALIDA, linea } from './lib-s92.mjs';

const ejecutar = promisify(execFile);
const filas = JSON.parse(readFileSync(join(SALIDA, 'b1-clasificacion.json'), 'utf8'));
const nombres = [...new Set(filas.map((f) => f.nombre))];

const REPOS = [
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-prestadores',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-admin',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-v2',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-sistema-pruebas',
];

async function grep(repo, patron) {
  if (!existsSync(repo)) return [];
  try {
    const { stdout } = await ejecutar('git', ['grep', '-n', '-E', '--', patron], {
      cwd: repo,
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const informe = [];
for (const n of nombres) {
  const invocaciones = [];
  const soloSql = [];
  for (const repo of REPOS) {
    const corto = repo.split('/').pop();
    // LA INVOCACIÓN: rpc('nombre') / rpc("nombre") — la forma real de llamarla
    for (const l of await grep(repo, `rpc\\(['"\`]${n}['"\`]`)) invocaciones.push(`${corto}: ${l.slice(0, 160)}`);
    // el resto, por tipo de archivo
    for (const l of await grep(repo, n)) {
      const archivo = l.split(':')[0];
      const esSql = /\.(sql)$/i.test(archivo);
      const esDoc = /\.(md|txt)$/i.test(archivo);
      const esTipos = /database\.types|supabase\.types|\.d\.ts$/i.test(archivo);
      if (esSql || esDoc || esTipos) soloSql.push(`${corto}:${archivo}`);
    }
  }
  informe.push({
    nombre: n,
    invocaciones: [...new Set(invocaciones)],
    nInvocaciones: new Set(invocaciones).size,
    nSoloDefinicionOdoc: new Set(soloSql).size,
  });
}

guardar('b1-legado-fino.json', informe);

const conLlamada = informe.filter((i) => i.nInvocaciones > 0);
const sinLlamada = informe.filter((i) => i.nInvocaciones === 0);

linea('\n══ B1 · EL LEGADO: ¿LAS LLAMA O SOLO LAS CREÓ? ══\n');
linea(`  INVOCADAS de verdad por un repo vecino (rpc('nombre')): ${conLlamada.length} de ${nombres.length}`);
for (const i of conLlamada) {
  linea(`\n   🔶 ${i.nombre}  (${i.nInvocaciones} invocación/es)`);
  for (const l of i.invocaciones.slice(0, 6)) linea(`        ${l}`);
}
linea(`\n  SIN invocación hallada (solo aparecen en .sql/.md/tipos): ${sinLlamada.length}`);
linea('      ↳ aparecer en una migración del legado es donde NACIERON — no es consumo.');
linea('');
