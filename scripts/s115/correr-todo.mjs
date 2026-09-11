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
  /* 🔴 TIMEOUT PROPIO DEL ORQUESTADOR, y 300 s eran demasiados: con el canal
     colisionando, `i02` colgó la suite ENTERA más de cinco minutos y las otras doce
     mediciones no llegaron a correr. *Es el mismo defecto que curé DENTRO de i02, un
     piso más arriba: sin techo, un instrumento colgado se lleva puesta la corrida.*
     120 s alcanzan de sobra — el más lento medido tarda ~32 s. */
  const r = spawnSync('node', [f], { encoding: 'utf8', cwd: DIR, timeout: 120000 });
  const ms = Date.now() - t0;
  /* Un instrumento que muere sin código conocido NO se cuenta como sano — y un
     timeout del orquestador es NO CONCLUYENTE, jamás rojo: que la suite se canse de
     esperar no dice nada del producto. */
  const code = (r.status === null || r.signal) ? 2 : r.status;
  if (r.signal) console.log(`   ⚪ ${f} superó los 120 s y lo cortó el orquestador (${r.signal}) — no es un rojo del producto.`);
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
    /* 🔴 EL MOTIVO PUEDE SER MULTILÍNEA. Tomar sólo la línea siguiente dejaba el
       resumen EN BLANCO justo para los mensajes más informativos —los que explican
       la causa en varias líneas—, y un resumen que no dice el motivo convierte un
       "no pude medir" en un "no sé por qué". Se toman todas las líneas hasta el
       final del bloque. */
    const lineas = r.salida.split('\n');
    const i = lineas.findIndex((l) => l.includes('NO CONCLUYENTE'));
    const motivo = lineas.slice(i + 1).map((l) => l.trim()).filter(Boolean).join(' ');
    console.log(`   ${r.f}\n      ${motivo.slice(0, 300) || '(el instrumento no dijo el motivo — revisar su salida completa)'}`);
  }
}
process.exit(rojos.length ? 1 : 0);
