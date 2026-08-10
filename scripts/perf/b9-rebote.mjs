/**
 * S94-PERF · EL REBOTE DE D-730, MEDIDO COMO FENÓMENO DE PERFORMANCE.
 *
 * **Solo medir. La cura es de la sesión propia de D-730.**
 *
 * El founder reporta, en los CUATRO oficios: al tocar «Reservar» en la ficha
 * del prestador, la app vuelve a la lista y sigue sola al pago, con **medio
 * segundo a dos segundos de parpadeo visible**. La pregunta de esta sesión no
 * es si se ve feo —eso ya está decidido— sino **cuánto trabajo se hace de más**,
 * y sobre todo **si ese trabajo REPITE consultas que la lista ya había hecho**.
 *
 * ── POR QUÉ HACE FALTA UN INSTRUMENTO NUEVO Y NO ALCANZA EL CENSO ──────────
 * `b1-censo-focos` cuenta todo lo alcanzable desde un `useFocusEffect`, y en
 * estas pantallas **eso mezcla dos cosas que hay que separar**: lo que la lista
 * RE-CARGA al recuperar el foco (trabajo repetido, que es el costo del rebote)
 * y lo que la CADENA DE RESERVA dispara (trabajo que se haría igual, porque es
 * la reserva). Sumarlas daría un número inflado y le echaría al rebote un costo
 * que no es suyo. *Un número que no distingue el costo del rebote del costo de
 * reservar no sirve para costear D-730: sirve para exagerarla.*
 *
 * Acá se separan por efecto: el que consume `tomarPedido()` es la reserva; los
 * demás son la carga.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { linea, guardarPerf, RAIZ } from './lib-perf.mjs';

const APP = join(RAIZ, 'apps/cliente/src/app');
const PANTALLAS = [
  ['ficha', 'prestador/[prestadorId].tsx'],
  ['paseo', '(tabs)/explorar/paseo/disponibles.tsx'],
  ['grooming', '(tabs)/explorar/grooming/disponibles.tsx'],
  ['adiestramiento', '(tabs)/explorar/adiestramiento/disponibles.tsx'],
  ['veterinaria', '(tabs)/explorar/veterinaria/disponibles.tsx'],
];

function bloques(src, palabra) {
  const out = [];
  let i = 0;
  while ((i = src.indexOf(palabra, i)) !== -1) {
    let prof = 0;
    let j = i + palabra.length;
    const inicio = j;
    for (; j < src.length; j++) {
      if (src[j] === '(') prof++;
      else if (src[j] === ')') {
        prof--;
        if (prof === 0) break;
      }
    }
    out.push(src.slice(inicio, j + 1));
    i = j + 1;
  }
  return out;
}

/* Firma COMPLETA hasta su `=> {`, y el `{` es el que la propia expresión
   encontró — jamás uno buscado después con `indexOf`. La primera versión de
   este archivo usaba la forma corta y **se comía el bloque de al lado**: la
   cadena de reserva aparecía dentro del efecto de carga, que es exactamente lo
   que este instrumento existe para separar. */
function funcionesLocales(src) {
  const mapa = new Map();
  const nombreDeFn = (t) => t.match(/function\s+([A-Za-z_$][\w$]*)/)?.[1] ?? null;
  for (const re of [
    /(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*(?::[^{;]*)?\{/g,
    /const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:useCallback\s*\(\s*)?(?:async\s*)?\([^)]*\)\s*(?::[^=>]+)?=>\s*\{/g,
  ]) {
    let m;
    while ((m = re.exec(src)) !== null) {
      const nom = m[1] ?? nombreDeFn(m[0]);
      if (nom === null || mapa.has(nom)) continue;
      const desde = re.lastIndex - 1;
      if (src[desde] !== '{') continue;
      let prof = 0;
      let j = desde;
      for (; j < src.length; j++) {
        if (src[j] === '{') prof++;
        else if (src[j] === '}') {
          prof--;
          if (prof === 0) break;
        }
      }
      mapa.set(nom, src.slice(desde, j + 1));
    }
  }
  return mapa;
}

function expandir(cuerpo, locales, prof = 3, vistos = new Set()) {
  let t = cuerpo;
  if (prof === 0) return t;
  for (const [n, c] of locales) {
    if (vistos.has(n)) continue;
    if (!new RegExp(`\\b${n}\\s*\\(`).test(cuerpo)) continue;
    vistos.add(n);
    t += '\n' + expandir(c, locales, prof - 1, vistos);
  }
  return t;
}

function wrappers(src) {
  const m = src.match(/import\s*\{([^}]*?)\}\s*from\s*['"]@epetplace\/api['"]/g) ?? [];
  const s = new Set();
  for (const b of m) {
    for (const p of b.slice(b.indexOf('{') + 1, b.lastIndexOf('}')).split(',')) {
      const n = p.replace(/\btype\b/, '').trim().split(/\s+as\s+/)[0].trim();
      if (n && /^[a-z]/.test(n)) s.add(n);
    }
  }
  return [...s];
}

const rep = [];
linea('\n══════════════════════════════════════════════════════════════');
linea('  D-730 · EL REBOTE, MEDIDO — solo medición, cero cura');
linea('══════════════════════════════════════════════════════════════\n');

for (const [rotulo, ruta] of PANTALLAS) {
  const src = readFileSync(join(APP, ruta), 'utf8');
  const locales = funcionesLocales(src);
  /* ⚠️ CON EL PARÉNTESIS, y no es un detalle: sin él, la **línea de `import`**
     (`import { router, useFocusEffect, useLocalSearchParams }`) cuenta como un
     efecto, y el contador de paréntesis arranca ahí y se traga medio archivo —
     metiendo la cadena de reserva adentro del efecto de carga. El síntoma
     visible era «3 efectos de foco» en pantallas que tienen DOS: *el instrumento
     decía un número que el archivo desmentía, y ese desmentido estaba a la
     vista desde la primera corrida.* `b1-censo-focos` ya buscaba con paréntesis
     y por eso sus números no se movieron al corregir esto. */
  const efectos = bloques(src, 'useFocusEffect(');
  const ws = wrappers(src);

  const detalle = efectos.map((e) => {
    const expandido = expandir(e, locales, 3, new Set());
    const llamados = ws.filter((w) => new RegExp(`\\b${w}\\s*\\(`).test(expandido));
    return { esReserva: /tomarPedido\s*\(/.test(e), llamados };
  });

  const carga = [...new Set(detalle.filter((d) => !d.esReserva).flatMap((d) => d.llamados))];
  const reserva = [...new Set(detalle.filter((d) => d.esReserva).flatMap((d) => d.llamados))];
  // Lo que la reserva pide y la carga YA tenía: trabajo estrictamente repetido.
  const repetido = reserva.filter((w) => carga.includes(w));

  rep.push({ rotulo, efectos: efectos.length, carga, reserva, repetido });

  linea(`── ${rotulo.toUpperCase()}  (${efectos.length} efectos de foco)`);
  linea(`   RE-CARGA al volver : ${carga.length ? carga.join(' · ') : '—'}`);
  linea(`   cadena de reserva  : ${reserva.length ? reserva.join(' · ') : '— (no consume la señal acá)'}`);
  if (repetido.length) linea(`   🔴 REPETIDO        : ${repetido.join(' · ')}`);
  linea('');
}

guardarPerf('b9-rebote.json', rep);
linea('   ── guardado en scripts/perf/salida/b9-rebote.json\n');
