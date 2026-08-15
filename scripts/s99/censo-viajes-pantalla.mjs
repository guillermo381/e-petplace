#!/usr/bin/env node
/**
 * CENSO DE VIAJES AL ABRIR UNA PANTALLA — S99-C · L0 · C4 (complemento estático).
 *
 * QUÉ MIDE, y qué NO:
 *  · MIDE, del OBJETO (el .tsx): al ABRIR la pantalla, cuántas llamadas a
 *    lectores hay y en cuántas OLAS caen. Una ola = un `Promise.all([…])`
 *    (sus llamadas viajan JUNTAS) · cada lector esperado por su cuenta = su
 *    propia ola. **Las olas son esperas ENCADENADAS: es lo que se siente.**
 *  · NO mide TIEMPO — eso es del aparato (Carril R). Mide el DRIVER que
 *    S94-PERF dejó medido: *«no hay consultas que optimizar, hay viajes que
 *    eliminar»*, peaje ~150 ms por petición, y el peaje NO baja trayendo
 *    menos datos: baja juntando viajes.
 *  · NO cuenta los manejadores de evento (guardar, tocar): solo ABRIR.
 *
 * MÉTODO (declarado para que el después sea comparable con el antes):
 *  ① QUÉ ES UN LECTOR — no se adivina: es un identificador IMPORTADO de
 *    `@epetplace/api` o de `@/lib`. Un helper local no cuenta como viaje.
 *  ② DE DÓNDE SE PARTE — del cuerpo de cada `useFocusEffect`/`useEffect`,
 *    recortado por conteo de llaves.
 *  ③ SE SIGUE LA CADENA — si el efecto llama a una función local del archivo
 *    (el patrón `void cargar()`), su cuerpo se analiza también, hasta
 *    `PROFUNDIDAD` niveles. **Sin esto el censo miente en las pantallas que
 *    extraen su carga a una función, que son justo las más grandes.**
 *  ④ CÓMO SE CUENTA UNA LLAMADA — cualquier `lector(` dentro de un
 *    `Promise.all([…])` cuenta como llamada de ESA ola, esté o no
 *    precedida de `await` (adentro del array no lo está: el `await` es del
 *    `Promise.all`). Fuera de todo array, un `lector(` esperado cuenta como
 *    llamada y como ola propia. El orden de olas es el textual.
 *
 * LÍMITES HONESTOS, declarados en vez de omitidos:
 *  · Es ESTÁTICO: un lector que adentro hace dos viajes cuenta como UNO
 *    (`contextoVentas` es ese caso, y además cachea), y una rama condicional
 *    cuenta aunque no siempre corra ⇒ sirve para ORDENAR pantallas por
 *    costo, jamás para prometer milisegundos.
 *  · Un lector llamado dentro de un `.map()` cuenta UNA vez, no N: el N sale
 *    del dato, no del texto. Las pantallas con N+1 quedan SUBESTIMADAS y se
 *    marcan con ⚠ para que nadie las lea como baratas.
 *
 * Uso:  node scripts/s99/censo-viajes-pantalla.mjs [ruta.tsx ...]
 *       sin argumentos, corre sobre las diez del censo C4.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROFUNDIDAD = 3;

/** Las diez del censo — criterio declarado en el parte S99-C §C4. */
const DIEZ = [
  'apps/prestador/src/app/(tabs)/index.tsx',
  'apps/prestador/src/app/(tabs)/atender.tsx',
  'apps/prestador/src/app/(tabs)/mascotas.tsx',
  'apps/prestador/src/app/(tabs)/negocio.tsx',
  'apps/prestador/src/app/(tabs)/cuenta/index.tsx',
  'apps/prestador/src/app/ventas/index.tsx',
  'apps/prestador/src/app/ventas/pedido/[pedidoId].tsx',
  'apps/prestador/src/app/ventas/configuracion.tsx',
  'apps/prestador/src/app/ventas/stock.tsx',
  'apps/prestador/src/app/mostrador/index.tsx',
];

/** Recorta el bloque delimitado que empieza en la primera `abre` tras `desde`. */
function bloque(src, desde, abre = '{', cierra = '}') {
  const i0 = src.indexOf(abre, desde);
  if (i0 === -1) return null;
  let nivel = 0;
  for (let i = i0; i < src.length; i++) {
    if (src[i] === abre) nivel++;
    else if (src[i] === cierra) {
      nivel--;
      if (nivel === 0) return { ini: i0, fin: i, texto: src.slice(i0, i + 1) };
    }
  }
  return null;
}

/**
 * ① Los LECTORES del archivo. **Un viaje ⟺ una llamada que sale del proceso.**
 * La casa lo define sola: los apps jamás llaman `supabase` directo — todo pasa
 * por `@epetplace/api` (puerta única). Así que:
 *  · todo lo importado de `@epetplace/api` cuenta;
 *  · lo importado de `@/lib` cuenta SOLO si en su archivo está declarado
 *    `async` — un helper síncrono (`hoyLocalISO`, `vozErrorVet`) NO viaja, y
 *    contarlo infla el censo con formato puro. Se decide LEYENDO el archivo
 *    del lib, no por el nombre.
 */
function lectoresDe(src, rutaTsx) {
  const set = new Set();
  const re = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const origen = m[2];
    const esApi = origen === '@epetplace/api';
    if (!esApi && !origen.startsWith('@/lib')) continue;

    let fuenteLib = null;
    if (!esApi) {
      const base = rutaTsx.slice(0, rutaTsx.indexOf('/src/') + 5);
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        try {
          fuenteLib = readFileSync(resolve(base + origen.slice(2) + ext), 'utf8');
          break;
        } catch {
          /* siguiente extensión */
        }
      }
      if (fuenteLib === null) continue; // no se pudo leer ⇒ no se afirma nada
    }

    for (const bruto of m[1].split(',')) {
      const nombre = bruto.replace(/\/\/.*$/gm, '').trim().split(/\s+as\s+/).pop()?.trim();
      if (nombre === undefined || nombre.length === 0) continue;
      if (nombre.startsWith('type ')) continue; // los tipos no viajan
      if (!/^[a-z_$][\w$]*$/.test(nombre)) continue;
      if (esApi) {
        set.add(nombre);
        continue;
      }
      const declara = new RegExp(
        `export\\s+async\\s+function\\s+${nombre}\\b|export\\s+const\\s+${nombre}\\s*[:=][^=]*async`,
      );
      if (declara.test(fuenteLib)) set.add(nombre);
    }
  }
  return set;
}

/**
 * Los cuerpos de las funciones locales, por nombre (③ seguir la cadena).
 * Cubre las tres formas vivas en esta casa: `function f`, `const f = () =>`
 * y **`const f = useCallback(async (…) => {…})`**, que es la del patrón
 * `cargar()` — sin ella el censo devuelve CERO en las pantallas que extraen
 * su carga, que son justo las más grandes (medido: `ventas/configuracion`).
 */
function funcionesLocales(src) {
  const mapa = new Map();
  const re = /(?:async\s+function\s+([A-Za-z_$][\w$]*)|function\s+([A-Za-z_$][\w$]*)|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const nombre = m[1] ?? m[2] ?? m[3];
    if (nombre === undefined || mapa.has(nombre)) continue;
    let desde = m.index + m[0].length;
    if (m[3] !== undefined) {
      // `const f = …` — el cuerpo empieza tras la flecha, no en la primera
      // `{`: el tipo del parámetro (`(ref?: { actual: boolean })`) también
      // trae llaves y se la robaría.
      const flecha = src.indexOf('=>', desde);
      if (flecha === -1 || flecha - desde > 400) continue;
      desde = flecha + 2;
    }
    const b = bloque(src, desde);
    if (b !== null) mapa.set(nombre, b.texto);
  }
  return mapa;
}

/** Rangos [ini,fin] de cada `Promise.all([ … ])` del texto. */
function rangosPromiseAll(texto) {
  const rangos = [];
  const re = /Promise\.all\s*\(/g;
  let m;
  while ((m = re.exec(texto)) !== null) {
    const b = bloque(texto, m.index, '[', ']');
    if (b !== null) rangos.push([b.ini, b.fin]);
  }
  return rangos;
}

/** ④ Las olas de un texto, con la cadena de funciones locales seguida. */
function olasDe(texto, lectores, locales, nivel, vistas) {
  const rangos = rangosPromiseAll(texto);
  const marcas = [];
  let enMap = false;

  const re = /([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  const porRango = rangos.map(() => []);
  while ((m = re.exec(texto)) !== null) {
    const nombre = m[1];
    if (lectores.has(nombre)) {
      const anterior = texto.slice(Math.max(0, m.index - 260), m.index);
      if (/\.map\s*\(\s*(?:async\s*)?\(?[^)]*\)?\s*=>[^;]*$/.test(anterior)) enMap = true;
      const i = rangos.findIndex(([ini, fin]) => m.index > ini && m.index < fin);
      if (i === -1) marcas.push({ pos: m.index, ola: [nombre] });
      else porRango[i].push(nombre);
      continue;
    }
    // ③ la cadena: una función local del archivo que el efecto invoca
    if (nivel < PROFUNDIDAD && locales.has(nombre) && !vistas.has(nombre)) {
      vistas.add(nombre);
      const hijas = olasDe(locales.get(nombre), lectores, locales, nivel + 1, vistas);
      for (const h of hijas.olas) marcas.push({ pos: m.index, ola: h });
      enMap = enMap || hijas.enMap;
    }
  }
  rangos.forEach(([ini], i) => {
    if (porRango[i].length > 0) marcas.push({ pos: ini, ola: porRango[i] });
  });
  marcas.sort((a, b) => a.pos - b.pos);
  return { olas: marcas.map((x) => x.ola), enMap };
}

function censar(ruta) {
  const src = readFileSync(resolve(ruta), 'utf8');
  const lectores = lectoresDe(src, ruta);
  const locales = funcionesLocales(src);

  const olas = [];
  let enMap = false;
  /* 🔴 `vistas` es UNA para todo el archivo, no una por efecto. Con una por
     efecto, un cargador compartido por dos efectos (el patrón vivo del HOY:
     un efecto de foco y otro de arranque llamando al mismo `cargar`) se
     expande DOS veces y el censo reporta el doble de olas de las que el
     aparato hace. Medido: el HOY daba 27 olas / 61 llamadas así, contra las
     **12 olas / 28 peticiones que S94-PERF midió en el aparato**. Con esta
     línea el número aterriza en ese orden. *Un instrumento se calibra contra
     un caso ya medido, o es una opinión con formato de tabla.* */
  const vistas = new Set();
  const re = /use(?:Focus)?Effect\s*\(/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const b = bloque(src, m.index);
    if (b === null) continue;
    const r = olasDe(b.texto, lectores, locales, 0, vistas);
    olas.push(...r.olas);
    enMap = enMap || r.enMap;
  }
  return { ruta, olas, enMap, lectores: lectores.size };
}

/**
 * 🔴 DOS NÚMEROS, Y LA DIFERENCIA SE DECLARA EN VEZ DE ELEGIRSE.
 *
 * Una ola con el MISMO conjunto de lectores que otra de la misma pantalla es
 * una de estas dos cosas, y **este instrumento no puede distinguirlas**:
 *  · el análisis expandió dos veces el mismo cargador (defecto del censo), o
 *  · la pantalla de verdad pide lo mismo dos veces (defecto de la pantalla).
 * ⇒ se reportan las BRUTAS y las ÚNICAS. **Para ordenar pantallas por costo
 * manda ÚNICAS** (es el piso seguro); la diferencia queda marcada con ⚠ para
 * que alguien la mire en el aparato. *Elegir un número sin decir que había
 * dos es exactamente el verde flojo que esta casa lleva un mes cazando.*
 *
 * CALIBRACIÓN CONTRA UN CASO YA MEDIDO (corrida del 15-ago, no de memoria):
 * el HOY del prestador da **15 olas únicas / 32 llamadas**, contra las **12
 * olas / 28 peticiones que S94-PERF midió EN EL APARATO**. Mismo orden de
 * magnitud ⇒ el instrumento sirve para ORDENAR. En BRUTAS daba **26/60** —
 * más del doble, y habría mentido con cara de tabla.
 */
function unicas(olas) {
  const vistas = new Set();
  const salida = [];
  for (const o of olas) {
    const llave = [...o].sort().join('|');
    if (vistas.has(llave)) continue;
    vistas.add(llave);
    salida.push(o);
  }
  return salida;
}

const objetivos = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DIEZ;
const filas = objetivos
  .map(censar)
  .map((f) => ({ ...f, unicas: unicas(f.olas) }))
  .sort((a, b) => b.unicas.length - a.unicas.length);

console.log('CENSO DE VIAJES AL ABRIR — olas encadenadas por pantalla (ESTÁTICO)');
console.log('='.repeat(78));
for (const f of filas) {
  const llamadas = f.unicas.reduce((n, o) => n + o.length, 0);
  const dup = f.olas.length - f.unicas.length;
  console.log(`\n${f.ruta}`);
  console.log(
    `  OLAS: ${f.unicas.length}   ·   llamadas: ${llamadas}` +
      (dup > 0 ? `   ⚠ ${dup} ola(s) repetida(s) — o el censo expandió dos veces, o la pantalla pide dos veces` : '') +
      (f.enMap ? `   ⚠ lector dentro de un .map(): el real es N, no 1` : ''),
  );
  f.unicas.forEach((o, i) => console.log(`   ${String(i + 1).padStart(2)}. ${o.join('  ‖  ')}`));
}
console.log('\n' + '='.repeat(78));
console.log('Una OLA es una espera encadenada. El peaje de S94-PERF es ~150 ms por');
console.log('petición y no baja trayendo menos datos: baja JUNTANDO viajes.');
