/**
 * 🔴 LA CAUSA DE LA CONTRADICCIÓN — hay CUATRO `.env.local` con la misma
 * variable, y no todos dicen lo mismo.
 *
 * El founder ve la línea vacía; yo medí 32 caracteres. Los dos podemos tener
 * razón **sobre archivos distintos**: el censo encontró cuatro archivos con
 * `EXPO_PUBLIC_DEMO_PASSWORD` —dos en el monorepo y dos en el worktree
 * `e-petplace-s91-D`— con TAMAÑOS DISTINTOS.
 *
 * Acá se compara la línea de cada uno, sin transcribir ningún valor (R6).
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { linea, guardarSeg2 } from './lib-seg2.mjs';

const ARCHIVOS = [
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/prestador/.env.local',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s91-D/apps/cliente/.env.local',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s91-D/apps/prestador/.env.local',
];

linea('\n══ LOS CUATRO ARCHIVOS CON `EXPO_PUBLIC_DEMO_PASSWORD` ══\n');
const filas = [];
for (const p of ARCHIVOS) {
  if (!existsSync(p)) {
    linea(`  (no existe) ${p}`);
    continue;
  }
  const bruto = readFileSync(p);
  const txt = bruto.toString('utf8');
  const md5 = createHash('md5').update(bruto).digest('hex');
  const m = txt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.*)$/m);
  const valor = m ? m[1] : null;
  const mail = txt.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.*)$/m)?.[1] ?? '(sin email)';
  const corto = p.replace('/Users/guillo381gmail.com/proyectos/ePetPlace/', '');

  filas.push({ path: corto, md5, bytes: bruto.length, valorLargo: valor === null ? null : valor.length, mail });

  const estado =
    valor === null ? '🔴 la variable NO está' : valor.length === 0 ? '🔴 VACÍA' : `✅ ${valor.length} chars · …${valor.slice(-4)}`;
  linea(`  ${corto}`);
  linea(`     md5 ${md5.slice(0, 12)}…  ·  ${bruto.length} bytes  ·  mtime ${statSync(p).mtime.toISOString().slice(0, 19)}`);
  linea(`     DEMO_EMAIL ....... ${mail}`);
  linea(`     DEMO_PASSWORD .... ${estado}`);
  linea('');
}

const conValor = filas.filter((f) => f.valorLargo > 0);
const vacios = filas.filter((f) => f.valorLargo === 0);

linea('── VEREDICTO ──\n');
linea(`  con valor: ${conValor.length}   ·   VACÍOS: ${vacios.length}`);
if (vacios.length > 0) {
  linea('\n  🔴 LA CONTRADICCIÓN SE EXPLICA: hay archivos donde la variable está vacía.');
  for (const v of vacios) linea(`     · ${v.path}`);
  linea('\n  Los dos estábamos leyendo bien — archivos distintos.');
} else {
  linea('\n  ⚠️ TODOS tienen valor ⇒ la contradicción NO se explica por el archivo.');
  linea('     Entonces el founder está mirando otra copia (editor con caché, otra máquina,');
  linea('     o un archivo fuera de estas cuatro rutas). Hace falta que él diga la ruta que abrió.');
}
guardarSeg2('p0b-los-cuatro-env.json', filas);
linea('');
