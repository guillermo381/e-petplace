/**
 * S115-E · CORRIDA COMPLETA — los doce instrumentos, con sus tres códigos.
 *
 * Imprime la tabla que va al acta. No juzga: cada instrumento se juzga solo, y
 * este script sólo reúne sus veredictos y su procedencia.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const DIR = new URL('.', import.meta.url).pathname;
const CODIGO = { 0: '🟢 SANO', 1: '🔴 ROJO', 2: '⚪ NO CONCLUYENTE' };

const sha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: DIR }).stdout.trim();
const rama = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', cwd: DIR }).stdout.trim();

const instrumentos = readdirSync(DIR).filter((f) => /^i\d\d-.*\.mjs$/.test(f)).sort();
console.log(`━━ S115-E · CORRIDA COMPLETA · ${new Date().toISOString()}`);
console.log(`   rama ${rama} · sha ${sha.slice(0, 8)} · ${instrumentos.length} instrumentos\n`);

const filas = [];
for (const f of instrumentos) {
  const t0 = Date.now();
  const r = spawnSync('node', [f], { encoding: 'utf8', cwd: DIR, timeout: 300000 });
  const ms = Date.now() - t0;
  // Un instrumento que muere sin código conocido NO se cuenta como sano.
  const code = r.status === null ? 2 : r.status;
  filas.push({ f, code, ms, salida: r.stdout });
  console.log(`${CODIGO[code] ?? `⚠️ exit ${code}`}  ${f.padEnd(34)} ${String(ms).padStart(6)} ms`);
}

console.log('\n── RESUMEN');
for (const c of [0, 1, 2])
  console.log(`   ${CODIGO[c]}: ${filas.filter((x) => x.code === c).length}`);

const rojos = filas.filter((x) => x.code === 1);
if (rojos.length) {
  console.log('\n── ROJOS');
  for (const r of rojos) {
    const linea = r.salida.split('\n').find((l) => l.includes('🔴 ROJO'));
    const detalle = r.salida.split('\n').slice(r.salida.split('\n').indexOf(linea) + 1).join(' ').trim();
    console.log(`   ${r.f}\n      ${detalle.slice(0, 300)}`);
  }
}
const noConc = filas.filter((x) => x.code === 2);
if (noConc.length) {
  console.log('\n── NO CONCLUYENTES (declarados, no omitidos)');
  for (const r of noConc) {
    const i = r.salida.split('\n').findIndex((l) => l.includes('NO CONCLUYENTE'));
    console.log(`   ${r.f}\n      ${(r.salida.split('\n')[i + 1] ?? '').trim().slice(0, 240)}`);
  }
}
process.exit(rojos.length ? 1 : 0);
