#!/usr/bin/env node
/**
 * `verify:reversion-no-vuelve` — QUE LO REVERTIDO NO VUELVA SOLO.
 *
 * 🔴 UNA REVERSIÓN DE OTA NO REVIERTE EL CÓDIGO. `eas update:republish` sirve
 *    un bundle viejo desde el canal; el repo queda igual. El siguiente publish
 *    sale de `main` y **deshace la reversión sin que nadie lo note.**
 *    *Una reversión que vive en un solo lado no es una reversión: es una pausa
 *    que nadie apuntó* (founder, 12-sep-2026).
 *
 * 🔴 POR QUÉ ES UN GATE Y NO UNA NOTA: el día que pasó, quien publicó tenía el
 *    comando de ancestría a mano y había escrito la ficha de `D-662` el día
 *    anterior. **Recordarlo no alcanzó**, y el olvido costó cuatro procesos
 *    muertos por OOM.
 *
 * 🔴 POR QUÉ MIDE CONTENIDO Y NO ANCESTRÍA — lo cazó su propia primera
 *    corrida: **`git revert` deja el commit original como ancestro PARA
 *    SIEMPRE.** Un gate por ancestría quedaría rojo eternamente después de
 *    revertir, *y un gate permanentemente rojo se apaga* — con lo cual el
 *    defecto que vino a vigilar se queda sin vigilancia. Lo que no puede
 *    volver es el CÓDIGO, así que se vigila su marca.
 *
 * Exit: 0 sano · 1 rojo · 2 no concluyente (L-533).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const LISTA = '.commits-revertidos';
const sal = (c, m) => { console.log(m); process.exit(c); };

if (!existsSync(LISTA)) sal(2, `\n  ⚠️  NO CONCLUYENTE — no existe ${LISTA}\n`);

/* Cada línea: sha | marca (regex) | rutas | porqué */
const filas = readFileSync(LISTA, 'utf8').split('\n')
  .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const p = l.split('::').map((x) => x.trim());
    return { sha: p[0], marca: p[1], rutas: p[2], porque: p.slice(3).join(' | ') };
  })
  .filter((f) => f.sha && f.marca && f.rutas);

if (filas.length === 0) {
  sal(0, '\n  ✅ verify:reversion-no-vuelve — VERDE · lista vacía, nada que vigilar\n');
}

/* 🔴 SE DESPEGAN LOS COMENTARIOS DE VERDAD, no por prefijo de línea — `L-170`.
   La primera versión filtraba líneas que empezaran con `*`, `//` o `/*`, y **se
   marcó a sí misma**: la LÁPIDA de esta misma reversión tiene una línea de
   continuación que empieza con un backtick. *Un censo por patrón lee los
   comentarios como código, y adivinar cuál es comentario por su primer
   carácter es el mismo error un piso más arriba.*
   La lápida TIENE que poder nombrar lo que enterró — si no, la única forma de
   pasar el gate sería no explicar qué se retiró. */
function sinComentarios(txt) {
  return txt
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))  // bloques, conservando líneas
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + '');                // de línea
}

function archivosDe(rutas) {
  const out = execFileSync('bash', ['-c',
    `find ${rutas} -type f \\( -name '*.ts' -o -name '*.tsx' \\) 2>/dev/null`],
    { encoding: 'utf8' }).trim();
  return out ? out.split('\n') : [];
}

const vueltos = [];
for (const f of filas) {
  const re = new RegExp(f.marca);
  const donde = [];
  for (const archivo of archivosDe(f.rutas)) {
    const limpio = sinComentarios(readFileSync(archivo, 'utf8'));
    limpio.split('\n').forEach((linea, n) => {
      if (re.test(linea)) donde.push(`${archivo}:${n + 1}: ${linea.trim().slice(0, 90)}`);
    });
  }
  if (donde.length > 0) vueltos.push({ ...f, donde });
}

console.log('\n═══ verify:reversion-no-vuelve ═══\n');
console.log(`  reversiones vigiladas : ${filas.length}`);
console.log(`  de vuelta en el árbol : ${vueltos.length}`);

if (vueltos.length > 0) {
  for (const v of vueltos) {
    console.log(`\n  🔴 ${v.sha} VOLVIÓ — la marca /${v.marca}/ aparece en:`);
    for (const d of v.donde) console.log(`       ${d}`);
    console.log(`     ${v.porque}`);
  }
  sal(1, '\n  El publish NO sale así. Sacalo del código, o pedile al founder que firme\n'
    + '  que el defecto se entendió y retirá su línea de .commits-revertidos.\n');
}
sal(0, '  ✅ VERDE — ninguna reversión volvió sola.\n'
  + '     Su verde dice «las marcas vigiladas no están en el árbol».\n'
  + '     JAMÁS dice «no hay regresiones»: sólo vigila lo que alguien anotó.\n');
