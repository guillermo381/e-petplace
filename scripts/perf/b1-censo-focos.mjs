/**
 * S94-PERF · D-728 RE-INSTRUMENTADA — EL CENSO DE LO QUE CUESTA UN FOCO.
 *
 * ── POR QUÉ ESTE INSTRUMENTO Y NO EL CONTADOR DE LA VEZ PASADA ──────────────
 * La sonda de S92-BIS contaba **cuántas veces** una pantalla se recargaba, y se
 * retiró sin que nadie la leyera. Este censo contesta la otra mitad, que es la
 * que convierte el ciclo en tiempo: **cuánto cuesta UN foco**. Con las dos, la
 * multiplicación es aritmética; con solo la primera, no.
 *
 * Y contesta esa mitad **sin depender del aparato del founder**, que hoy no
 * está. Lo hace leyendo el objeto: por cada pantalla, extrae el cuerpo de su
 * `useFocusEffect` y cuenta **qué wrappers de `@epetplace/api` llama ahí
 * adentro**. Ese número es el que se multiplica por el piso de red de B0.
 *
 * ── LO QUE ESTE CENSO **NO** PRUEBA, declarado antes de sus números ─────────
 * No prueba que el ciclo dispare. Eso es comportamiento del aparato: `Hoja`
 * monta un `<Modal>` nativo (verificado: `Hoja.tsx:265`), React Navigation lee
 * la toma de foco de esa ventana como blur del screen, y al cerrarla vuelve el
 * foco. **En RN-web no hay ventana aparte**, así que una repro en el navegador
 * daría verde midiendo otra cosa — R4 en su forma más cara. Lo que este censo
 * establece es **la EXPOSICIÓN y el COSTO**: qué pantallas están montadas sobre
 * el mecanismo, y cuánto paga cada una cada vez que el mecanismo dispara.
 *
 * *Una pantalla con 1 wrapper en su foco puede recargarse tres veces sin que
 * nadie lo note; una con 9 no.*
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { linea, guardarPerf, RAIZ } from './lib-perf.mjs';

/** Recorre un árbol y devuelve los `.tsx`. */
function tsx(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) tsx(p, acc);
    else if (e.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

/**
 * Extrae el cuerpo de cada `useFocusEffect(` por conteo de llaves/paréntesis.
 * Un regex no sirve: los cuerpos tienen closures anidados y strings con llaves.
 */
function cuerposDeFoco(src) {
  const out = [];
  let i = 0;
  while ((i = src.indexOf('useFocusEffect(', i)) !== -1) {
    let prof = 0;
    let j = i + 'useFocusEffect'.length;
    const inicio = j;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === '(') prof++;
      else if (c === ')') {
        prof--;
        if (prof === 0) break;
      }
    }
    out.push(src.slice(inicio, j + 1));
    i = j + 1;
  }
  return out;
}

/**
 * Los identificadores importados desde `@epetplace/api` — los wrappers reales.
 *
 * ⚠️ La primera versión usaba `\{([\s\S]*?)\}` y **contaba `useCallback` como
 * wrapper**: el no-greedy arranca en el PRIMER `import {` del archivo y estira
 * hasta el `} from '@epetplace/api'`, tragándose los imports de React en el
 * medio. Daba 11 peticiones donde había 9. *Un instrumento que infla el número
 * que vino a medir es peor que no medir* — la clase de verde falso que L-192
 * nombra. La cura es prohibir la llave de cierre adentro: `[^}]`.
 */
function wrappersImportados(src) {
  const m = src.match(/import\s*\{([^}]*?)\}\s*from\s*['"]@epetplace\/api['"]/g) ?? [];
  const nombres = new Set();
  for (const bloque of m) {
    const dentro = bloque.slice(bloque.indexOf('{') + 1, bloque.lastIndexOf('}'));
    for (const parte of dentro.split(',')) {
      const n = parte.replace(/\btype\b/, '').trim().split(/\s+as\s+/)[0].trim();
      if (n && /^[a-z]/.test(n)) nombres.add(n);
    }
  }
  return [...nombres];
}

/**
 * Cuerpo de cada función local del archivo, por nombre.
 *
 * ⚠️ SEGUNDA CORRECCIÓN DEL INSTRUMENTO, y la más cara de las dos: la versión
 * anterior contaba SOLO los wrappers escritos dentro del `useFocusEffect`, y el
 * patrón dominante de la casa es `useFocusEffect(useCallback(() => { cargar() }))`
 * — o sea que **las pantallas mejor escritas daban 0**. `hogar/paseos` marcaba
 * cero peticiones por foco teniendo un `cargar()` entero adentro. *Un censo que
 * premia con un cero al que ordenó su código no está midiendo el código: está
 * midiendo el estilo.* Por eso se siguen las llamadas locales, no solo el texto
 * literal del efecto.
 */
function funcionesLocales(src) {
  const mapa = new Map();
  const patrones = [
    /(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*useCallback\s*\(/g,
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/g,
  ];
  for (const re of patrones) {
    let m;
    while ((m = re.exec(src)) !== null) {
      const nombre = m[1];
      if (mapa.has(nombre)) continue;
      // Del `{` que sigue a la firma hasta su cierre, por conteo de llaves.
      const desde = src.indexOf('{', re.lastIndex - 1);
      if (desde === -1) continue;
      let prof = 0;
      let j = desde;
      for (; j < src.length; j++) {
        if (src[j] === '{') prof++;
        else if (src[j] === '}') {
          prof--;
          if (prof === 0) break;
        }
      }
      mapa.set(nombre, src.slice(desde, j + 1));
    }
  }
  return mapa;
}

/** Expande las llamadas locales hasta `profundidad`, sin repetir. */
function expandir(cuerpo, locales, profundidad = 3, vistos = new Set()) {
  let texto = cuerpo;
  if (profundidad === 0) return texto;
  for (const [nombre, cuerpoLocal] of locales) {
    if (vistos.has(nombre)) continue;
    if (!new RegExp(`\\b${nombre}\\s*\\(`).test(cuerpo)) continue;
    vistos.add(nombre);
    texto += '\n' + expandir(cuerpoLocal, locales, profundidad - 1, vistos);
  }
  return texto;
}

const apps = [
  ['cliente', join(RAIZ, 'apps/cliente/src/app')],
  ['prestador', join(RAIZ, 'apps/prestador/src/app')],
];

const filas = [];
for (const [app, dir] of apps) {
  for (const archivo of tsx(dir)) {
    const src = readFileSync(archivo, 'utf8');
    if (!src.includes('useFocusEffect')) continue;
    const wrappers = wrappersImportados(src);
    const locales = funcionesLocales(src);
    const cuerpos = cuerposDeFoco(src).map((c) => expandir(c, locales));
    const llamadas = [];
    for (const cuerpo of cuerpos) {
      for (const w of wrappers) {
        const veces = (cuerpo.match(new RegExp(`\\b${w}\\s*\\(`, 'g')) ?? []).length;
        for (let k = 0; k < veces; k++) llamadas.push(w);
      }
    }
    // Peticiones directas que no pasan por wrapper (Storage, RPC sueltas).
    const sueltas =
      (cuerpos.join('\n').match(/supabase\s*\.\s*(from|rpc|storage)/g) ?? []).length;

    /* ── LAS OLAS: EL NÚMERO QUE MULTIPLICA EL PISO DE RED ────────────────
       Veintiocho peticiones en UN `Promise.all` cuestan **una** ida y vuelta;
       cinco peticiones encadenadas cuestan **cinco**. El conteo de peticiones
       describe el trabajo del servidor; el de OLAS describe lo que el usuario
       espera. Son números distintos y el segundo es el que se siente.
       Método: se borran los cuerpos de `Promise.all([...])` (todo lo de
       adentro viaja junto) y se cuentan los `await` que quedan, +1 por cada
       `Promise.all`. Es una COTA SUPERIOR —los `await` dentro de un `if` no
       siempre corren— y se reporta como tal, jamás como el número exacto. */
    const olas = cuerpos.reduce((acc, cuerpo) => {
      let t = cuerpo;
      let n = 0;
      let i;
      while ((i = t.indexOf('Promise.all')) !== -1) {
        const abre = t.indexOf('[', i);
        if (abre === -1) break;
        let prof = 0;
        let j = abre;
        for (; j < t.length; j++) {
          if (t[j] === '[') prof++;
          else if (t[j] === ']') {
            prof--;
            if (prof === 0) break;
          }
        }
        t = t.slice(0, i) + '«ola»' + t.slice(j + 1);
        n++;
      }
      return acc + n + (t.match(/\bawait\s/g) ?? []).length;
    }, 0);

    filas.push({
      app,
      pantalla: relative(dir, archivo).replace(/\.tsx$/, ''),
      montaHoja: /<Hoja\b|<HojaScroll\b/.test(src),
      focos: cuerpos.length,
      porFoco: llamadas.length + sueltas,
      olas,
      wrappers: llamadas,
      sueltas,
    });
  }
}

filas.sort((a, b) => b.porFoco - a.porFoco);

linea('\n══════════════════════════════════════════════════════════════');
linea('  D-728 RE-INSTRUMENTADA · CUÁNTO CUESTA UN FOCO');
linea('══════════════════════════════════════════════════════════════\n');

const expuestas = filas.filter((f) => f.montaHoja && f.porFoco > 0);
const resto = filas.filter((f) => !(f.montaHoja && f.porFoco > 0));

linea(`EXPUESTAS AL MECANISMO (useFocusEffect + Hoja en la misma pantalla): ${expuestas.length}\n`);
const PISO = 153.2; // p50 medido en B0, desde esta máquina. En móvil es peor.
linea('  app  peticiones  olas   espera≈   pantalla');
for (const f of expuestas) {
  linea(
    `  ${f.app.slice(0, 3)}  ${String(f.porFoco).padStart(10)}  ${String(f.olas).padStart(4)}  ${String(Math.round(f.olas * PISO)).padStart(6)} ms  ${f.pantalla}`,
  );
}

linea(`\nCON useFocusEffect PERO SIN Hoja propia (pagan el ciclo solo si un hijo abre una): ${resto.length}`);
const top = [...resto].sort((a, b) => b.olas - a.olas).slice(0, 12);
for (const f of top) {
  linea(
    `  ${f.app.slice(0, 3)}  ${String(f.porFoco).padStart(10)}  ${String(f.olas).padStart(4)}  ${String(Math.round(f.olas * PISO)).padStart(6)} ms  ${f.pantalla}`,
  );
}

const totalExp = expuestas.reduce((a, f) => a + f.porFoco, 0);
linea(`\n  ── peticiones por foco, sumadas sobre las expuestas: ${totalExp}`);
linea(`  ── la peor por PETICIONES: ${expuestas[0]?.pantalla} (${expuestas[0]?.porFoco})`);
const peorOla = [...filas].sort((a, b) => b.olas - a.olas)[0];
linea(`  ── la peor por OLAS (lo que se espera): ${peorOla.pantalla} — ${peorOla.olas} idas y vueltas ENCADENADAS ≈ ${Math.round(peorOla.olas * PISO)} ms de pura red`);
linea('\n  ⚠️ «olas» es COTA SUPERIOR: los await dentro de un if no siempre corren.');

guardarPerf('b1-censo-focos.json', filas);
linea(`\n  ── censo guardado en scripts/perf/salida/b1-censo-focos.json\n`);
