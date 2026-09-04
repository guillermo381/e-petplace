#!/usr/bin/env node
/**
 * verify:hooks-bajo-return — D-1017 · UN HOOK DEBAJO DE UN RETURN NO FALLA HOY:
 * FALLA EL DÍA QUE LA RAMA CAMBIA.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EL ROJO QUE LO PARIÓ (reproducido en web con sesión real de prestador)
 * ═══════════════════════════════════════════════════════════════════════════
 *   Error: Rendered more hooks than during the previous render.
 *     at Object.useState … at TabsLayout(./(tabs)/_layout.tsx)
 *   The above error occurred in the <TabsLayout(./(tabs)/_layout.tsx)> component.
 *
 * `(tabs)/_layout.tsx` del prestador tenía SEIS returns tempranos y, debajo,
 * `useSafeAreaInsets` + `useState` + `useEffect`. **El primer render es
 * siempre `'verificando'`**, así que salía por el primer return con N hooks;
 * cuando la sesión resolvía llegaba al fondo y llamaba tres más. El árbol
 * entero caía en la frontera y **el prestador no abría**.
 *
 * ⚠️ **Por qué ningún gate lo veía:** compila perfecto, el lint de hooks no
 * está cableado en esta casa, y **en el 99 % de los renders no pasa nada** —
 * hace falta la transición. *Un defecto que necesita un cambio de rama para
 * existir no se descubre leyendo: se descubre en el teléfono de alguien.*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ MIDE
 * ═══════════════════════════════════════════════════════════════════════════
 * Por cada componente exportado de una app: la línea del PRIMER `return`
 * dentro de una guarda (`if (…) { return … }` o `if (…) return …`) y, después
 * de ella, cualquier llamada a un hook en el nivel del componente.
 *
 * 🔴 **NO cuenta hooks adentro de otra función** (callbacks, `useCallback`,
 * componentes anidados): se descarta todo lo que esté más indentado que el
 * cuerpo del componente. *Un censo que cuenta el `useState` de un callback
 * grita sobre código sano y enseña a ignorarlo.*
 *
 * Salidas: 0 verde · 1 hay hooks bajo un return · 2 no pude medir.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const di = (s) => process.stdout.write(s + '\n');

const RAICES = ['apps/cliente/src', 'apps/prestador/src'];
/**
 * 🔴 **EL HOOK TIENE QUE SER LA SENTENCIA, no aparecer en la línea** — y esto
 * lo corrigió la auto-prueba antes de que el censo dijera un número.
 *
 * La primera versión buscaba `use[A-Z](` en cualquier parte de una línea del
 * cuerpo, y **gritaba sobre código sano**: `const f = () => { const c =
 * useState(2); }` vive en el cuerpo del componente y el hook es de OTRA
 * función. *Un censo que grita sobre lo sano enseña a ignorarlo*, que es peor
 * que no tenerlo.
 *
 * Ahora sólo cuenta cuando el hook es lo que la sentencia HACE: `const x =
 * useAlgo(` o `useAlgo(` al principio. Un `=> {` de por medio lo descarta
 * solo, porque después del `=` viene la flecha y no el hook.
 */
const HOOK = /^\s*(?:(?:const|let|var)\s+[^=]+=\s*)?(use[A-Z][A-Za-z]*)\s*\(/;

function archivos(dir, salida = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) archivos(p, salida);
    else if (p.endsWith('.tsx')) salida.push(p);
  }
  return salida;
}

/**
 * Los ÁMBITOS de un archivo: componentes, hooks propios **y cualquier otra
 * función de primer nivel**, porque lo que hace falta no es la lista de
 * componentes sino saber **dónde termina cada uno**.
 *
 * 🔴 **LA PRIMERA VERSIÓN SÓLO VEÍA `function X(` con mayúscula, y por eso
 * dio CUATRO FALSOS POSITIVOS** — los mismos dos, duplicados en las dos apps:
 * decía que `VideoPropioEnLlamada()` tenía un `useRef` en :205, y esa línea
 * es de `useCamara()`, un hook propio que empieza en :203. Como el censo
 * medía «hasta el próximo componente», **se tragaba todo lo que hubiera en el
 * medio y se lo atribuía al anterior.**
 *
 * *El instrumento acusaba a la función equivocada con una línea real: la clase
 * de rojo que manda a curar código sano.* Se cazó mirando el archivo, no
 * confiando en la salida.
 *
 * Se censan los ámbitos cuyo nombre obedece las reglas de hooks —Componente o
 * `useAlgo`—; los demás sólo sirven de FRONTERA.
 */
function ambitos(lineas) {
  const salida = [];
  lineas.forEach((l, i) => {
    const m =
      /^(\s*)(?:export\s+(?:default\s+)?)?function\s+([A-Za-z0-9_]+)\s*\(/.exec(l) ??
      /^(\s*)(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*(?::[^=]+)?=>/.exec(l);
    if (m !== null) salida.push({ nombre: m[2], desde: i, sangria: m[1].length });
  });
  return salida;
}

/** ¿Este ámbito obedece las reglas de hooks? Componente o hook propio. */
const obedeceHooks = (nombre) => /^[A-Z]/.test(nombre) || /^use[A-Z]/.test(nombre);

const ofensores = [];
let componentesVistos = 0;
let conReturnGuarda = 0;

for (const raiz of RAICES) {
  for (const path of archivos(raiz)) {
    const lineas = readFileSync(path, 'utf8').split('\n');
    const comps = ambitos(lineas);
    comps.forEach((c, k) => {
      if (!obedeceHooks(c.nombre)) return;
      componentesVistos += 1;
      const hasta = k + 1 < comps.length ? comps[k + 1].desde : lineas.length;
      /* El cuerpo del componente vive a `sangria + 2`. Todo lo más indentado es
         de otra función y no cuenta. */
      const nivel = c.sangria + 2;
      const esCuerpo = (l) => l.search(/\S/) === nivel;

      let primerReturn = -1;
      for (let i = c.desde + 1; i < hasta; i++) {
        const l = lineas[i];
        if (!esCuerpo(l)) continue;
        /* `if (…) return …` en una línea, o la guarda que abre bloque. */
        if (/^\s*if\s*\(.*\)\s*return\b/.test(l)) { primerReturn = i; break; }
        if (/^\s*if\s*\(/.test(l)) {
          for (let j = i + 1; j < Math.min(i + 40, hasta); j++) {
            if (lineas[j].search(/\S/) < nivel) break;
            if (/^\s*return\b/.test(lineas[j])) { primerReturn = j; break; }
          }
          if (primerReturn >= 0) break;
        }
      }
      if (primerReturn < 0) return;
      conReturnGuarda += 1;

      for (let i = primerReturn + 1; i < hasta; i++) {
        const l = lineas[i];
        if (!esCuerpo(l)) continue;
        if (/^\s*(\/\/|\/?\*)/.test(l)) continue;
        const m = HOOK.exec(l);
        if (m !== null) {
          ofensores.push(`${path}:${i + 1}  ${c.nombre}() · ${m[1]} — el primer return de guarda está en :${primerReturn + 1}`);
        }
      }
    });
  }
}

/* AUTO-PRUEBA (L-459): si el censo no distingue su rojo, no cuenta un verde. */
const FIXTURE_MALO = [
  'export default function X() {',
  '  const [a, setA] = useState(0);',
  '  if (a === 0) {',
  '    return null;',
  '  }',
  '  const b = useMemo(() => 1, []);',
  '  return b;',
  '}',
];
const FIXTURE_BUENO = [
  'export default function X() {',
  '  const [a, setA] = useState(0);',
  '  const b = useMemo(() => 1, []);',
  '  if (a === 0) {',
  '    return null;',
  '  }',
  '  const f = () => { const c = useState(2); return c; };',
  '  return b;',
  '}',
];
/* ⚠️ **LA AUTO-PRUEBA MIDE CON LA MISMA FRONTERA QUE EL CENSO**, y esto también
   lo cazó ella: la primera versión de `censar` iba «del return al final del
   arreglo» e ignoraba el ámbito siguiente ⇒ **daba rojo sobre el fixture sano**.
   *Un arnés que no comparte la regla con lo que mide, mide otra cosa.* */
function censar(lineas) {
  const todos = ambitos(lineas);
  const c = todos[0];
  const hasta = todos.length > 1 ? todos[1].desde : lineas.length;
  const nivel = c.sangria + 2;
  const esCuerpo = (l) => l.search(/\S/) === nivel;
  let pr = -1;
  for (let i = c.desde + 1; i < hasta; i++) {
    if (!esCuerpo(lineas[i])) continue;
    if (/^\s*if\s*\(.*\)\s*return\b/.test(lineas[i])) { pr = i; break; }
    if (/^\s*if\s*\(/.test(lineas[i])) {
      for (let j = i + 1; j < hasta; j++) {
        if (lineas[j].search(/\S/) < nivel) break;
        if (/^\s*return\b/.test(lineas[j])) { pr = j; break; }
      }
      if (pr >= 0) break;
    }
  }
  if (pr < 0) return 0;
  let n = 0;
  for (let i = pr + 1; i < hasta; i++) {
    if (esCuerpo(lineas[i]) && HOOK.test(lineas[i])) n += 1;
  }
  return n;
}
if (censar(FIXTURE_MALO) !== 1) { di('ROJO · auto-prueba: no ve el hook bajo el return.'); process.exit(2); }
if (censar(FIXTURE_BUENO) !== 0) { di('ROJO · auto-prueba: grita sobre un componente sano (el hook del callback).'); process.exit(2); }
/* 🔴 EL CASO QUE PARIÓ `ambitos()`: un hook propio DESPUÉS de un componente
   con return de guarda. Sus hooks son suyos, no del componente de arriba. */
const FIXTURE_VECINO = [
  'export function Comp({ x }: { x: number }) {',
  '  if (!x) return null;',
  '  return x;',
  '}',
  '',
  'export function useAlgo() {',
  '  const r = useRef(0);',
  '  return r;',
  '}',
];
if (censar(FIXTURE_VECINO) !== 0) {
  di('ROJO · auto-prueba: le atribuye al componente los hooks de su vecino.');
  process.exit(2);
}
if (componentesVistos < 100) { di(`ROJO · el corpus es de ${componentesVistos} componentes — no pude medir.`); process.exit(2); }

di(`verify:hooks-bajo-return · ${componentesVistos} componentes · ${conReturnGuarda} con return de guarda · ${ofensores.length} con hooks debajo`);
if (ofensores.length > 0) {
  di('');
  for (const o of ofensores) di(`   ✗ ${o}`);
  di('');
  di('Un hook debajo de un return no falla hoy: falla el día que la rama cambia.');
  di('La cura es SUBIR EL HOOK, jamás bajar el return — el efecto se condiciona');
  di('por dentro, nunca por fuera.');
  process.exit(1);
}
di('\n✓ verify:hooks-bajo-return VERDE — ningún hook vive debajo de un return de guarda.');
process.exit(0);
