/**
 * 🔴 EL CENSO COMPLETO DE `.env*` — porque el anterior fue PARCIAL.
 *
 * La comparación de los cuatro archivos dio «ninguno vacío», y eso no cierra:
 * mi lista de raíces estaba escrita a mano y **dejaba afuera ocho worktrees**.
 * Decir «no se explica» sobre una búsqueda incompleta es peor que no decir
 * nada — es afirmar sobre lo que no se miró.
 *
 * Acá se recorre TODO `~/proyectos/ePetPlace`, hasta 4 niveles, sin lista a
 * mano. Ningún valor se transcribe (R6).
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { linea, guardarSeg2 } from './lib-seg2.mjs';

const BASE = '/Users/guillo381gmail.com/proyectos/ePetPlace';
const SALTAR = new Set(['node_modules', '.git', 'ios', 'android', '.expo', 'dist', 'build', '.next']);

const encontrados = [];
function recorrer(dir, nivel) {
  if (nivel > 4) return;
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entradas) {
    if (e.isDirectory()) {
      if (SALTAR.has(e.name)) continue;
      recorrer(join(dir, e.name), nivel + 1);
    } else if (e.isFile() && e.name.startsWith('.env')) {
      encontrados.push(join(dir, e.name));
    }
  }
}
recorrer(BASE, 0);

linea('\n══ CENSO COMPLETO DE `.env*` EN ~/proyectos/ePetPlace ══\n');
linea(`  archivos hallados: ${encontrados.length}\n`);

const filas = [];
for (const p of encontrados) {
  const bruto = readFileSync(p);
  const txt = bruto.toString('utf8');
  const m = txt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.*)$/m);
  const corto = p.replace(BASE + '/', '');
  const st = statSync(p);
  if (!m) {
    filas.push({ path: corto, tiene: false });
    continue;
  }
  const v = m[1];
  filas.push({
    path: corto,
    tiene: true,
    largo: v.length,
    fin: v.length >= 4 ? v.slice(-4) : '(corto)',
    md5: createHash('md5').update(bruto).digest('hex').slice(0, 10),
    mtime: st.mtime.toISOString().slice(0, 19),
  });
}

const conVar = filas.filter((f) => f.tiene);
const vacias = conVar.filter((f) => f.largo === 0);

linea('  ── los que TIENEN EXPO_PUBLIC_DEMO_PASSWORD ──\n');
for (const f of conVar) {
  const estado = f.largo === 0 ? '🔴 VACÍA' : `${String(f.largo).padStart(3)} chars · …${f.fin}`;
  linea(`  ${estado}   ${f.path}`);
  linea(`             md5 ${f.md5}…  mtime ${f.mtime}`);
}
linea(`\n  ── sin esa variable: ${filas.length - conVar.length} archivo(s) ──`);
for (const f of filas.filter((x) => !x.tiene)) linea(`     ${f.path}`);

linea('\n── VEREDICTO ──\n');
linea(`  archivos con la variable: ${conVar.length}   ·   con el valor VACÍO: ${vacias.length}`);
if (vacias.length > 0) {
  linea('\n  🔴 ACÁ ESTÁ: hay archivo(s) con la variable vacía.');
  for (const v of vacias) linea(`     · ${v.path}`);
  linea('\n  ⇒ la contradicción se explica por el ARCHIVO, no por la lectura.');
} else {
  const largos = [...new Set(conVar.map((f) => f.largo))];
  linea(`\n  Ninguno vacío. Largos distintos hallados: ${largos.join(', ')}`);
  linea('  ⇒ si el founder ve la línea vacía, el archivo que abrió NO está bajo');
  linea(`     ${BASE} — o su editor le está mostrando una copia cacheada.`);
  linea('     La ruta absoluta que él vea en su editor cierra el caso.');
}
guardarSeg2('p0b-todos-los-env.json', filas);
linea('');
