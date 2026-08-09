/**
 * S92-BIS · ARRANQUE — L-217 EN SU PRIMERA APLICACIÓN.
 *
 * S92 cerró con una lección nueva: **«todo en origin» y «todo en el canon» son
 * dos afirmaciones distintas**, después de descubrir que cuatro artefactos de
 * S90-B —incluida la letra del propio loop de seguridad— nunca se mergearon a
 * `main`. La cura propuesta era una línea: `git branch -a --no-merged main`.
 *
 * Se corrió al abrir esta sesión y devolvió **SIETE ramas de pista**. Este
 * script mide QUÉ hay en cada una: un conteo no alcanza para saber si es
 * trabajo perdido o ruido de merges viejos. Lo que decide es **qué archivos
 * tocan esos commits**.
 *
 * NO cura: mide y sirve la lista.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { guardarSeg2, linea } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);
const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';

const git = async (args) => {
  try {
    const { stdout } = await ejecutar('git', args, { cwd: RAIZ, maxBuffer: 32 * 1024 * 1024 });
    return stdout;
  } catch (e) {
    return e.stdout ?? '';
  }
};

const ramas = (await git(['branch', '--no-merged', 'main', '--format=%(refname:short)']))
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

const informe = [];
for (const rama of ramas) {
  const commits = (await git(['log', '--oneline', `main..${rama}`])).split('\n').filter(Boolean);
  // los archivos que esos commits tocan, sin contar merges
  const archivos = [
    ...new Set(
      (await git(['log', '--name-only', '--pretty=', '--no-merges', `main..${rama}`]))
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  // ¿alguno de esos archivos NO existe hoy en main? eso es lo que se perdería
  const faltantes = [];
  for (const a of archivos) {
    const existe = await git(['cat-file', '-e', `main:${a}`]);
    // cat-file -e no imprime nada; se usa el exit por vía indirecta
    const chk = await ejecutar('git', ['cat-file', '-e', `main:${a}`], { cwd: RAIZ }).then(
      () => true,
      () => false,
    );
    if (!chk) faltantes.push(a);
  }
  informe.push({
    rama,
    commits: commits.length,
    asuntos: commits.slice(0, 4).map((c) => c.slice(0, 110)),
    archivos: archivos.length,
    faltantes_en_main: faltantes,
  });
}

guardarSeg2('b0-ramas-sin-mergear.json', informe);

linea('\n══ L-217 · RAMAS CON COMMITS QUE `main` NO TIENE ══\n');
linea('  (la cura de una línea que S92 propuso, corrida por primera vez)\n');
for (const r of informe) {
  const alarma = r.faltantes_en_main.length > 0 ? '🔴' : '  ';
  linea(`  ${alarma} ${r.rama.padEnd(16)} ${String(r.commits).padStart(3)} commits · ${String(r.archivos).padStart(3)} archivos · ${r.faltantes_en_main.length} NO están en main`);
  for (const f of r.faltantes_en_main.slice(0, 8)) linea(`        · ${f}`);
  if (r.faltantes_en_main.length > 8) linea(`        … y ${r.faltantes_en_main.length - 8} más`);
}

const conFaltantes = informe.filter((r) => r.faltantes_en_main.length > 0);
linea(
  conFaltantes.length === 0
    ? '\n  ✅ NINGUNA rama tiene archivos que falten en `main`.\n     Los commits son de trabajo que ya llegó por otra vía (merges, cherry-picks)\n     o de archivos que después se movieron. NO hay trabajo perdido.\n'
    : `\n  🔴 ${conFaltantes.length} rama(s) con archivos que NO existen en main — hay que mirarlas una por una.\n`,
);
