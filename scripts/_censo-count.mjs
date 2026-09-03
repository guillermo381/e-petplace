/* Censo H1: claves cuyo texto usa {{count}} y cuyos LLAMADORES pasan otra cosa. */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const dicts = ['apps/cliente/src/i18n/es.ts','apps/prestador/src/i18n/es.ts'];
const conCount = new Set();
for (const d of dicts) {
  for (const m of readFileSync(d,'utf8').matchAll(/^\s{4}(\w+)(_one|_other)?:\s*['"`]([^'"`]*\{\{count\}\}[^'"`]*)['"`]/gm)) {
    conCount.add(m[1]);
  }
}
console.log(`claves con {{count}}: ${conCount.size}`);
const src = execSync("grep -rn \"t('\" apps/cliente/src apps/prestador/src --include=*.tsx || true",{encoding:'utf8'});
const malos = [];
for (const linea of src.split('\n')) {
  const m = linea.match(/t\(\s*[`']([\w.]+)[`'](?:\s+as\s+never)?\s*,\s*\{([^}]*)\}/);
  if (!m) continue;
  const clave = m[1].split('.').pop();
  if (!conCount.has(clave)) continue;
  /* 🔴 La forma CORTA `{ count }` no lleva dos puntos: exigir `count:` la
     marcaba como mala. *Un censo que da rojo sobre lo ya curado enseña a
     ignorarlo.* Se acepta cualquiera de las dos formas. */
  if (!/\bcount\b/.test(m[2])) malos.push(linea.trim().slice(0,150));
}
console.log(malos.length === 0 ? '✅ ninguno' : `🔴 ${malos.length} llamadas pasan otra cosa que 'count':`);
for (const l of malos.slice(0,20)) console.log('  ', l);
