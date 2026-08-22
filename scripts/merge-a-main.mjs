#!/usr/bin/env node
/**
 * MERGE A `main` — CON SU CINTURÓN, porque el mismo error se cobró CUATRO veces.
 *
 * ── EL DEFECTO QUE CIERRA ──────────────────────────────────────────────────
 *
 * Una cadena de shell que empieza con `cd <worktree>` **arrastra TODO el
 * comando al worktree**. Ahí `main` no está checkouteado (git lo prohíbe: una
 * rama vive en un solo árbol), así que:
 *
 *     git merge --no-ff origin/pista/s103-a   ← corre contra la PROPIA rama
 *     → "Already up to date."                 ← y eso SE LEE COMO ÉXITO
 *
 * **No falla. No avisa. Dice exactamente lo que diría un merge correcto que no
 * tenía nada que traer.** Es la clase de la sesión S103 en su forma más pura:
 * *una salida creíble sobre el objeto equivocado.*
 *
 * 🔴 **Y lo que salvó las cuatro veces fue medir el SHA DESPUÉS. Eso es
 *    RECUPERACIÓN, no defensa** — funciona sólo si alguien se acuerda de mirar.
 *    `L-365`: no alcanza con la disciplina; hay que volver imposible lo otro.
 *
 * ── QUÉ VERIFICA ANTES DE TOCAR NADA ───────────────────────────────────────
 *
 *   ① que este árbol sea el PRIMARIO y no un worktree enlazado;
 *   ② que `HEAD` sea `main` — por nombre, no por suposición;
 *   ③ que la rama que se pide exista en `origin`;
 *   ④ que tenga algo que traer  ← **la que atrapa el defecto**: si `main` ya la
 *      contiene, lo dice como HECHO («ya está adentro»), y si el merge no iba a
 *      mover nada porque se está corriendo contra el objeto equivocado, ② ya
 *      abortó antes.
 *
 * Y DESPUÉS del merge verifica **por SHA** que la rama quedó de ancestro —
 * *el mismo control que las cuatro veces se corrió a mano y tarde.*
 *
 * ── USO ────────────────────────────────────────────────────────────────────
 *   node scripts/merge-a-main.mjs pista/s103-b-jueces "mensaje del merge"
 *   node scripts/merge-a-main.mjs --autoprueba     ← el rojo, producido
 */

import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const morir = (m) => { console.error(`\n🔴 ABORTA · ${m}\n`); process.exit(1); };

/**
 * ① ¿Es el árbol PRIMARIO?
 *
 * En un worktree enlazado, `.git` es un ARCHIVO que apunta al primario; en el
 * primario es un DIRECTORIO. *Se mide la forma del objeto, no el nombre de la
 * carpeta — un worktree puede llamarse como uno quiera.*
 */
function esPrimario() {
  const dotgit = join(git('rev-parse', '--show-toplevel'), '.git');
  return existsSync(dotgit) && statSync(dotgit).isDirectory();
}

function verificarPuesto() {
  if (!esPrimario()) {
    morir(
      'este NO es el árbol primario — es un worktree enlazado.\n' +
      `   estás en: ${git('rev-parse', '--show-toplevel')}\n` +
      '   `main` no está checkouteado acá, así que el merge correría contra la\n' +
      '   PROPIA rama y diría «Already up to date» — que se lee como éxito.\n' +
      '   → corré esto desde el primario.',
    );
  }
  const rama = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (rama !== 'main') {
    morir(`HEAD es \`${rama}\`, no \`main\`. Este script solo mergea A main.`);
  }
}

function mergear(rama, mensaje) {
  verificarPuesto();

  git('fetch', 'origin', '--quiet');
  const ref = `origin/${rama}`;
  try { git('rev-parse', '--verify', ref); }
  catch { morir(`\`${ref}\` no existe. ¿Está empujada?`); }

  const sha = git('rev-parse', ref);

  // ④ ¿tiene algo que traer? Se dice como HECHO, no como fallo.
  const yaEsta = (() => {
    try { execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD']); return true; }
    catch { return false; }
  })();
  if (yaEsta) {
    console.log(`\n✓ \`${rama}\` (${sha.slice(0, 8)}) YA está adentro de main. Nada que mergear.\n`);
    process.exit(0);
  }

  if (!mensaje) morir('falta el mensaje del merge.');

  const antes = git('rev-parse', 'HEAD');
  execFileSync('git', ['merge', '--no-ff', ref, '-m', mensaje], { stdio: 'inherit' });
  const despues = git('rev-parse', 'HEAD');

  /* 🔴 EL DISCRIMINADOR, y es el que las cuatro veces faltó: que main SE HAYA
     MOVIDO y que la rama quede de ancestro. *Un merge que «anduvo» y dejó main
     en el mismo sha no mergeó nada.* */
  if (antes === despues) morir('main NO se movió — el merge no trajo nada.');
  try { execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD']); }
  catch { morir('la rama NO quedó de ancestro de main.'); }

  console.log(
    `\n✓ mergeado · main ${antes.slice(0, 8)} → ${despues.slice(0, 8)}` +
    `\n  ${rama} (${sha.slice(0, 8)}) es ancestro: VERDE` +
    '\n  falta empujar: git push origin main\n',
  );
}

/**
 * LA AUTO-PRUEBA — el rojo PRODUCIDO, no argumentado.
 *
 * Corre el guard desde un worktree enlazado real y exige que ABORTE.
 * *Sin esto, este script sería una intención bien comentada: exactamente lo
 * que `L-379` acaba de nombrar — una razón escrita que nadie va a falsar.*
 */
function autoprueba() {
  const worktrees = git('worktree', 'list', '--porcelain')
    .split('\n').filter((l) => l.startsWith('worktree ')).map((l) => l.slice(9));
  const enlazado = worktrees.slice(1).find((w) => existsSync(join(w, '.git')));
  if (!enlazado) {
    console.log('⚠️  NO CONCLUYENTE: no hay worktree enlazado para probar el rojo.');
    process.exit(2);   // ← jamás 0: no medir no es aprobar
  }

  let salida = '', code = 0;
  try {
    execFileSync(process.execPath, [new URL(import.meta.url).pathname, 'main', 'x'],
      { cwd: enlazado, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) { code = e.status; salida = (e.stderr || '') + (e.stdout || ''); }

  const abortoPorSitio = code === 1 && salida.includes('NO es el árbol primario');
  console.log(`\n── auto-prueba desde ${enlazado} ──`);
  console.log(`   exit=${code} · abortó por sitio: ${abortoPorSitio ? 'SÍ' : 'NO'}`);
  if (!abortoPorSitio) {
    console.error('\n🔴 EL GUARD NO CAZA SU PROPIO DEFECTO.\n');
    process.exit(1);
  }
  console.log('\n✓ auto-prueba VERDE: desde un worktree enlazado, aborta.\n');
}

const [a, b] = process.argv.slice(2);
if (a === '--autoprueba') autoprueba();
else if (!a) morir('uso: node scripts/merge-a-main.mjs <rama> "<mensaje>"  |  --autoprueba');
else mergear(a, b);
