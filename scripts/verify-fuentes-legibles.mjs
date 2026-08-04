#!/usr/bin/env node
/**
 * UN FUENTE QUE `grep` NO PUEDE LEER SALE ROJO, JAMÁS INVISIBLE (S86,
 * firma de mesa).
 *
 * QUÉ LO PARIÓ, con su forense: `apps/prestador/src/app/(tabs)/index.tsx`
 * —el HOY, 1955 líneas, LA PANTALLA MÁS GRANDE DEL PRESTADOR— tenía UN
 * byte NUL en el offset 59967 (línea 1171). Consecuencia medida:
 *
 *   $ rg   -c Tarjeta '(tabs)/index.tsx'   →  13
 *   $ grep -c Tarjeta '(tabs)/index.tsx'   →  (vacío)
 *
 * `grep` clasifica como BINARIO todo archivo con un NUL y lo saltea SIN
 * DECIRLO. `rg` no. ⇒ todo censo hecho con `grep` estuvo omitiendo la
 * pantalla más grande del prestador **en silencio, y saliendo verde**.
 *
 * ES LA FAMILIA S85 (L-194 → L-199) EN SU FORMA MÁS BARATA DE PRODUCIR Y
 * MÁS CARA DE ENCONTRAR: no rompe nada. El archivo compila, corre, se
 * ve bien; el typecheck lo lee (tsc no usa grep) y el lint también si
 * lee con `fs`. Lo único que falla es LA MEDICIÓN — y su modo de falla
 * es un número más chico, que nadie sospecha (L-192).
 *
 * ⚠️ Y LA TRAMPA DE LA CURA, que es por qué esto no es "borrar un
 * carácter": el NUL vivía DENTRO de un literal — `claveBloque(c) ?? '\0'`,
 * un CENTINELA elegido para no colisionar jamás con una clave real.
 * Borrarlo lo convertiría en `''`, que SÍ puede colisionar: cambio de
 * comportamiento silencioso. La cura correcta fue escribirlo como
 * ESCAPE (`'\0'`): valor idéntico en runtime, fuente ASCII legible.
 *
 * Exit 0 = todo fuente es legible por herramientas de texto.
 * Exit 1 = hay al menos uno que `grep` saltearía.
 * Exit 2 = no pudo medir (L-197: sin dato no se opina).
 *
 * Uso:
 *   node scripts/verify-fuentes-legibles.mjs
 *   node scripts/verify-fuentes-legibles.mjs --raiz apps/cliente/src
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const arg = (n, def = null) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def;
};

// Por defecto, TODO lo que una pista escribe a mano.
const RAICES = arg('raiz')
  ? [arg('raiz')]
  : ['apps/prestador/src', 'apps/cliente/src', 'packages/ui/src', 'packages/api/src', 'packages/domain/src', 'packages/i18n/src', 'scripts'];

const EXT = /\.(ts|tsx|js|jsx|mjs|sql|md|json)$/;

function* fuentes(dir) {
  let entradas;
  try {
    entradas = readdirSync(dir);
  } catch {
    return; // raíz inexistente: se reporta abajo, no se inventa
  }
  for (const e of entradas) {
    if (e === 'node_modules' || e === '.git' || e === 'dist') continue;
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* fuentes(p);
    else if (EXT.test(e)) yield p;
  }
}

const sucios = [];
let leidos = 0;

for (const raiz of RAICES) {
  const abs = isAbsolute(raiz) ? raiz : join(RAIZ, raiz);
  let hubo = false;
  for (const p of fuentes(abs)) {
    hubo = true;
    leidos++;
    let b;
    try {
      b = readFileSync(p);
    } catch (e) {
      console.error(`✗ NO PUDE LEER ${p} (${e.message}). No es verde: es que no sé.`);
      process.exit(2);
    }
    const i = b.indexOf(0);
    if (i !== -1) {
      const linea = b.subarray(0, i).toString('utf8').split('\n').length;
      sucios.push({
        path: p.slice(RAIZ.length + 1),
        linea,
        offset: i,
        cuantos: b.filter((x) => x === 0).length,
        lineas: b.toString('utf8').split('\n').length,
      });
    }
  }
  // L-197 EN CARNE, y lo cobró el fixture de este mismo guard: la primera
  // versión AVISABA y seguía a verde sobre CERO archivos. Una raíz vacía no
  // es "todo limpio": es NO PUDE MEDIR — y un guard que ante la ausencia de
  // datos dice verde es el guard que no hubiera encontrado el NUL del HOY.
  if (!hubo) {
    console.error(`✗ ${raiz}: CERO archivos leídos (¿ruta movida o mal escrita?).`);
    console.error('  No es verde: es que no sé. Corregí la raíz o pasá --raiz.');
    process.exit(2);
  }
}

console.log(`── verify-fuentes-legibles · ${leidos} archivos leídos en ${RAICES.length} raíces`);

if (sucios.length) {
  console.error('');
  console.error(`✗ EN ROJO (${sucios.length}) — fuentes que \`grep\` saltea SIN DECIRLO:`);
  for (const s of sucios) {
    console.error(`   · ${s.path}`);
    console.error(`     ${s.cuantos} byte(s) NUL · primero en la línea ${s.linea} (offset ${s.offset}) · el archivo tiene ${s.lineas} líneas`);
    console.error(`     Todo censo por grep sobre este archivo devuelve VACÍO y sale verde.`);
  }
  console.error('');
  console.error('   CURA: si el NUL es un CENTINELA dentro de un literal, se escribe como');
  console.error("   ESCAPE (`'\\0'`) — mismo valor, fuente legible. BORRARLO lo convierte en");
  console.error("   `''`, que puede colisionar: eso es un cambio de comportamiento, no una cura.");
  process.exit(1);
}

console.log('✓ VERDE — todo fuente es legible por herramientas de texto.');
