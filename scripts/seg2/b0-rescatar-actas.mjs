/**
 * S92-BIS · RESCATE DE LOS SIETE ARCHIVOS QUE NUNCA LLEGARON AL CANON.
 *
 * ── POR QUÉ CHECKOUT SELECTIVO Y NO MERGE DE RAMA ────────────────────────────
 * Cada una de las siete ramas toca 1-4 archivos, y de esos **solo uno falta en
 * `main`**; los demás ya están, con contenido MÁS NUEVO. Un `git merge` de una
 * rama vieja podría **revertir** ese trabajo posterior. El checkout selectivo
 * trae exactamente lo perdido y nada más.
 *
 * *(S92 sí mergeó `pista/s90-b` con `--no-ff`, y estuvo bien: ahí el diff contra
 * main eran cuatro archivos, los cuatro añadidos. Acá el diff no es limpio, así
 * que el instrumento cambia.)*
 *
 * NO borra ramas ni reescribe historia (regla 86).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { guardarSeg2, linea } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);
const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';

const RESCATE = [
  ['pista/s86-b', 'scripts/verify-rutas.mjs'],
  ['pista/s87-b', 'docs/relevamientos/2026-08-06-s89b-acta-cierre.md'],
  ['pista/s87-c', 'docs/relevamientos/2026-08-07-s89c-ESTADO-cierre.md'],
  ['pista/s87-d', 'docs/relevamientos/2026-08-07-s89d-estado-de-cierre.md'],
  ['pista/s90-d', 'docs/relevamientos/2026-08-07-s90-D-CIERRE.md'],
  ['pista/s91-b', 'docs/relevamientos/2026-08-08-s91b-CIERRE.md'],
  ['pista/s91-d', 'docs/relevamientos/2026-08-08-s91d-CIERRE.md'],
];

const hecho = [];
for (const [rama, archivo] of RESCATE) {
  // ¿de verdad falta en main? se re-verifica acá y no se confía en el paso previo
  const enMain = await ejecutar('git', ['cat-file', '-e', `main:${archivo}`], { cwd: RAIZ }).then(
    () => true,
    () => false,
  );
  if (enMain) {
    hecho.push({ rama, archivo, accion: 'ya estaba en main — no se toca', bytes: null });
    continue;
  }
  await ejecutar('git', ['checkout', rama, '--', archivo], { cwd: RAIZ });
  const { stdout } = await ejecutar('git', ['show', `${rama}:${archivo}`], { cwd: RAIZ, maxBuffer: 16 * 1024 * 1024 });
  hecho.push({ rama, archivo, accion: 'RESCATADO', bytes: stdout.length, lineas: stdout.split('\n').length });
}

guardarSeg2('b0-rescate.json', hecho);

linea('\n══ RESCATE DE LOS SIETE ══\n');
for (const h of hecho) {
  linea(`  ${h.accion === 'RESCATADO' ? '✅' : '  '} ${h.rama.padEnd(15)} ${h.archivo}`);
  if (h.bytes) linea(`       ${h.lineas} líneas · ${h.bytes} bytes`);
}
const n = hecho.filter((h) => h.accion === 'RESCATADO').length;
linea(`\n  ${n} archivo(s) traídos al canon. Las ramas NO se borran ni se reescriben.\n`);
