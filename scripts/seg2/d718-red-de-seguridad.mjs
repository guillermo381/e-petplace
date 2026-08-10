/**
 * 🔴 D-718 · LA RED DE SEGURIDAD, ANTES DE BORRAR NADA.
 *
 * La ficha lo pone como paso 2 y el founder lo ordenó explícito: *si aparece
 * algo sin rescatar, se frena.* **Borrar un worktree no borra su rama**, pero
 * un árbol que nadie mira es donde las cosas se pierden — y esta sesión ya
 * rescató SIETE archivos que nunca llegaron al canon (L-217).
 *
 * Distingue dos cosas que no son lo mismo:
 *   · **ARCHIVOS QUE NO EXISTEN EN MAIN** → material posiblemente perdido.
 *     Es lo único que puede frenar la poda.
 *   · archivos que existen pero difieren → main tiene OTRA versión, casi
 *     siempre más nueva. *Mergear eso REVERTIRÍA trabajo* — por eso el rescate
 *     se hace por checkout selectivo y jamás por merge (L-217).
 */
import { execFileSync } from 'node:child_process';
import { linea, guardarSeg2 } from './lib-seg2.mjs';

const g = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();

const ramas = g('branch', '--no-merged', 'main', '--format=%(refname:short)')
  .split('\n')
  .filter(Boolean);

linea('\n══ D-718 · ¿qué tienen las ramas que main no tenga? ══\n');
const informe = [];
let faltantesTotales = 0;

for (const rama of ramas) {
  const archivos = [
    ...new Set(g('log', '--name-only', '--pretty=', `main..${rama}`).split('\n').filter(Boolean)),
  ];
  const faltan = archivos.filter((f) => {
    try {
      g('cat-file', '-e', `main:${f}`);
      return false; // existe en main
    } catch {
      return true; // NO existe en main
    }
  });
  const commits = g('rev-list', '--count', `main..${rama}`);
  faltantesTotales += faltan.length;
  informe.push({ rama, commits: Number(commits), tocados: archivos.length, faltan });

  linea(`  ${faltan.length === 0 ? '✅' : '🔴'} ${rama.padEnd(16)} ${String(commits).padStart(3)} commit(s) · ${String(archivos.length).padStart(3)} archivo(s) tocados · ${faltan.length} SIN estar en main`);
  for (const f of faltan) linea(`        · ${f}`);
}

linea('');
linea(
  faltantesTotales === 0
    ? '  ⇒ NINGÚN archivo de estas ramas falta en main. **Nada que rescatar: la poda es segura.**\n    (Lo que difiere existe en main con otra versión — mergear eso revertiría trabajo, L-217.)'
    : `  🔴 ${faltantesTotales} archivo(s) NO están en main — SE FRENA la poda hasta rescatarlos.`,
);
guardarSeg2('d718-red-de-seguridad.json', informe);
linea('');
