#!/usr/bin/env node
/**
 * verify:tdz — S113-E, lote 1.0
 *
 * ── QUÉ MIDE ────────────────────────────────────────────────────────────────
 * Un `const`/`let` USADO ANTES DE DECLARARSE. En JavaScript eso es la *zona
 * muerta temporal*: **compila perfecto y revienta en ejecución**, con un
 * `ReferenceError` que en React Native se ve como la pantalla entera caída.
 *
 * ── POR QUÉ NO ALCANZABA `verify:ref-antes-de-uso` ──────────────────────────
 * Ese gate nació en S112 del crash del hilo de adopción y su alcance escrito
 * son los `useRef`. C se comió la misma clase en S113 con una FUNCIÓN
 * (`enMemoriaDe` declarada abajo, usada arriba por un IIFE) y **el gate no la
 * vio**: no es un `useRef`. *Un gate atado a un NOMBRE mide la convención, no
 * el hecho.* Éste mide el hecho, con el analizador de alcances de ESLint.
 *
 * ── LAS DOS EXENCIONES, Y SON HECHOS DEL LENGUAJE, NO PREFERENCIAS ──────────
 * · `functions: false` — una `function declaration` SÍ se hoistea entera:
 *   llamarla antes de su línea es legal y corriente. Marcarla sería un rojo
 *   falso sobre código correcto.
 * · `ignoreTypeReferences` (por defecto en la regla de typescript-eslint) — un
 *   `interface`/`type` usado antes de declararse también se hoistea. Por eso
 *   este gate usa `@typescript-eslint/no-use-before-define` y NO la del
 *   núcleo: la del núcleo no distingue un tipo de un valor y convertiría cada
 *   archivo con tipos al final en un rojo.
 *
 * Uso:  node scripts/verify-tdz.mjs
 *       node scripts/verify-tdz.mjs --control
 */

import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { readdirSync, statSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const REGLA = 'casa/tdz';
const DIRS = ['apps/cliente/src', 'apps/prestador/src', 'packages/ui/src'];
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SALTAR = new Set(['node_modules', '.git', 'dist', 'build', '.expo', 'coverage']);

/* ═══ LA REGLA PROPIA, Y POR QUÉ NO ALCANZABA LA DE LA CASA ═════════════════
 *
 * `@typescript-eslint/no-use-before-define` marca el orden **LÉXICO**. El TDZ
 * muerde por el orden **DE EJECUCIÓN**, y no son lo mismo:
 *
 *     const A = () => estilos.x;        // línea 1 — SEGURO
 *     const estilos = { x: 1 };         // línea 2
 *
 * `A` sólo lee `estilos` cuando alguien la llama, y para entonces la línea 2 ya
 * corrió. Es el patrón `StyleSheet.create` al pie del archivo, que esta casa usa
 * en todos lados. Medido: la regla cruda da **23 rojos sobre este repo y casi
 * todos son de esa forma** — un gate que se pone rojo sobre código sano lo
 * silencian en una semana, y entonces no protege de nada.
 *
 * Lo que SÍ revienta es que la lectura ocurra en la misma pasada sincrónica que
 * todavía no llegó a la declaración. Eso pasa cuando entre el uso y la
 * declaración **no hay ninguna función que difiera**: un IIFE no difiere (se
 * invoca ahí mismo), y el callback de `map`/`filter`/`forEach`/`sort` tampoco
 * (el método lo llama sincrónicamente). **Ésa es exactamente la forma del
 * crash de C**: un IIFE que adentro hace `.filter(f => enMemoriaDe(f))` sobre
 * un `const` declarado más abajo.
 *
 * Por eso la regla mide DOS cosas y sólo una es roja:
 *   ROJO   el uso se evalúa YA        → `ReferenceError` en ejecución.
 *   AVISO  el uso está diferido       → legal; se lista y no corta.
 */
const METODOS_SINCRONOS = new Set([
  'map', 'filter', 'forEach', 'reduce', 'reduceRight', 'some', 'every',
  'find', 'findIndex', 'findLast', 'flatMap', 'sort', 'from',
]);
const ES_FUNCION = new Set(['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration']);

/** ¿Esta función se invoca en el acto, o queda guardada para después? */
function seInvocaYa(fn) {
  const p = fn.parent;
  if (!p || p.type !== 'CallExpression') return false;
  if (p.callee === fn) return true;                       // IIFE: (() => {})()
  if (!p.arguments.includes(fn)) return false;
  return p.callee.type === 'MemberExpression'
    && p.callee.property?.type === 'Identifier'
    && METODOS_SINCRONOS.has(p.callee.property.name);      // xs.map(fn) — sincrónico
}

const AVISOS = [];

const reglaTdz = {
  meta: { type: 'problem', schema: [], messages: { tdz: "'{{nombre}}' se usa antes de declararse y NO está diferido: revienta en ejecución." } },
  create(context) {
    const sc = context.sourceCode;
    function revisar(scope) {
      for (const v of scope.variables) {
        const def = v.defs[0];
        if (!def) continue;
        const clase = def.type === 'Variable' ? def.parent?.kind : def.type === 'ClassName' ? 'class' : null;
        if (clase !== 'const' && clase !== 'let' && clase !== 'class') continue;
        const finDecl = def.name.range[1];
        for (const ref of v.references) {
          if (ref.init) continue;                                   // es su propia inicialización
          if (ref.identifier.range[0] >= finDecl) continue;         // uso posterior: legal
          // ¿alguna función DIFIERE la lectura, entre el uso y el ámbito de la declaración?
          let diferido = false;
          /* 🔴 DE ADENTRO HACIA AFUERA. `getAncestors` devuelve del más externo al
             más interno, y la primera versión de esta regla lo recorría así: como
             el bloque del ámbito de la declaración (`Program`, para un `const` de
             módulo) es el PRIMER ancestro, cortaba en la primera vuelta y no
             llegaba a ver nunca la función que difiere ⇒ marcaba en rojo el
             patrón `styles` al pie, que es sano. **Lo cazó el control, no la
             lectura**: la regla se veía bien y estaba al revés. */
          for (const a of [...sc.getAncestors(ref.identifier)].reverse()) {
            if (a === v.scope.block) break;
            if (ES_FUNCION.has(a.type) && !seInvocaYa(a)) { diferido = true; break; }
          }
          if (diferido) { AVISOS.push({ archivo: context.filename, linea: ref.identifier.loc.start.line, col: ref.identifier.loc.start.column + 1, nombre: v.name }); continue; }
          context.report({ node: ref.identifier, messageId: 'tdz', data: { nombre: v.name } });
        }
      }
      scope.childScopes.forEach(revisar);
    }
    return { 'Program:exit'(node) { revisar(sc.getScope(node)); } };
  },
};

const CONFIG = {
  linterOptions: { reportUnusedDisableDirectives: 'off' },
  files: ['**/*.{ts,tsx,js,jsx}'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
  },
  plugins: { casa: { rules: { tdz: reglaTdz } } },
  rules: { [REGLA]: 'error' },
};

const di = (s) => console.log(s);
const rel = (p) => p.replace(process.cwd() + '/', '');

function archivos(dir) {
  const out = [];
  let e;
  try { e = readdirSync(dir); } catch { return out; }
  for (const n of e) {
    if (SALTAR.has(n)) continue;
    const p = join(dir, n);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) out.push(...archivos(p));
    else if (EXT.has(n.slice(n.lastIndexOf('.')))) out.push(p);
  }
  return out;
}

async function medir(rutas) {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: CONFIG });
  const res = await eslint.lintFiles(rutas);
  const violaciones = [], sinMedir = [];
  for (const f of res) {
    for (const m of f.messages) {
      // Sólo `fatal` significa «no se pudo analizar». Un `ruleId` nulo dice
      // «este mensaje no es de una regla», no «no pude leer el archivo».
      if (m.fatal) { sinMedir.push({ archivo: f.filePath, linea: m.line, motivo: m.message }); continue; }
      if (m.ruleId === REGLA) violaciones.push({ archivo: f.filePath, linea: m.line, col: m.column, mensaje: m.message });
    }
  }
  return { violaciones, sinMedir, revisados: res.length };
}

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  /* El temporal vive DENTRO del repo: ESLint 10 ignora todo archivo fuera del
     base path y devuelve cero violaciones — un control ahí afuera saldría
     verde por la razón equivocada. (Medido en verify:hooks, lote 0.) */
  const tmp = '.control-verify-tdz-s113e';
  mkdirSync(tmp, { recursive: true });
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };

  /* ── POSITIVO · la forma EXACTA del TDZ que se comió C ────────────────────
     El encargo pedía correr el gate sobre «el enMemoriaDe de C antes de su
     cura». **Ese estado no existe en git**: C lo curó ANTES de commitear
     (en `origin/pista/s113-c-07` el `const` ya está en la línea 1228, arriba
     de `filasReco` en la 1233, con su comentario de advertencia). Así que el
     control REPRODUCE la forma que C describe en su parte §⑤ —un `const`
     flecha declarado abajo y usado por un IIFE de arriba— en vez de depender
     de un accidente de la historia. Reproducible para siempre, y es el mismo
     defecto. */
  writeFileSync(join(tmp, 'tdz-enmemoriade.tsx'), `
export function Hogar() {
  const filasReco: string[] = (() => {
    return ['a', 'b'].filter((f) => !enMemoriaDe(f));
  })();
  const enMemoriaDe = (id: string): boolean => id === 'a';
  return filasReco;
}
`);
  /* ── NEGATIVO 1 · el orden correcto (la cura de C) NO se marca ─────────── */
  writeFileSync(join(tmp, 'curado.tsx'), `
export function Hogar() {
  const enMemoriaDe = (id: string): boolean => id === 'a';
  const filasReco: string[] = (() => {
    return ['a', 'b'].filter((f) => !enMemoriaDe(f));
  })();
  return filasReco;
}
`);
  /* ── NEGATIVO 2 · una `function declaration` usada antes SÍ es legal ───── */
  writeFileSync(join(tmp, 'hoisting-legal.tsx'), `
export function Pantalla() {
  const x = ayuda(2);
  function ayuda(n: number) { return n * 2; }
  return x;
}
`);
  /* ── NEGATIVO 3 · un TIPO usado antes de declararse también se hoistea ─── */
  writeFileSync(join(tmp, 'tipo-antes.tsx'), `
const cosa: Forma = { n: 1 };
interface Forma { n: number }
export default cosa;
`);

  /* ── NEGATIVO 4 · el patrón de la casa: `styles` al pie, leído dentro de un
     componente. **Es el discriminador que separa este gate del crudo**: la
     regla léxica lo marca (y marcaba 23 así en este repo); acá tiene que
     salir AVISO y no rojo, porque el cuerpo del componente corre después. */
  writeFileSync(join(tmp, 'diferido-styles.tsx'), `
export function Icono() {
  return estilos.caja;
}
const estilos = { caja: 1 };
`);

  const r = await medir([join(tmp, 'diferido-styles.tsx'), join(tmp, 'tdz-enmemoriade.tsx'), join(tmp, 'curado.tsx'), join(tmp, 'hoisting-legal.tsx'), join(tmp, 'tipo-antes.tsx')]);
  const de = (n) => r.violaciones.filter((v) => v.archivo.endsWith(n));
  const pos = de('tdz-enmemoriade.tsx');

  ok(pos.length === 1 && /enMemoriaDe/.test(pos[0].mensaje),
    'POSITIVO  el TDZ de C sale ROJO, con path:línea',
    pos.length ? `(${rel(pos[0].archivo)}:${pos[0].linea}:${pos[0].col} — ${pos[0].mensaje})` : '(no lo detectó)');
  ok(de('curado.tsx').length === 0, 'NEGATIVO  el orden correcto (la cura de C) queda VERDE');
  ok(de('hoisting-legal.tsx').length === 0, 'NEGATIVO  una `function` usada antes de su línea es legal y no se marca');
  ok(de('tipo-antes.tsx').length === 0, 'NEGATIVO  un TIPO usado antes de declararse tampoco se marca');
  ok(de('diferido-styles.tsx').length === 0 && AVISOS.some((a) => a.archivo.endsWith('diferido-styles.tsx')),
    'CLASE     el `styles` al pie sale AVISO, no rojo (el cuerpo corre después)',
    `(${AVISOS.filter((a) => a.archivo.endsWith('diferido-styles.tsx')).length} aviso)`);
  ok(r.sinMedir.length === 0, 'PARSEO    los cuatro casos se analizaron de verdad',
    r.sinMedir.length ? `(sin medir: ${r.sinMedir.length})` : `(${r.revisados} archivos)`);

  rmSync(tmp, { recursive: true, force: true });
  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo. El gate NO mide lo que dice medir.`); process.exit(1); }
  di('✅ produce su rojo sobre el defecto real y no marca lo que el lenguaje sí hoistea.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const rutas = DIRS.flatMap(archivos);
if (rutas.length === 0) { di('🔴 cero archivos: el corpus está vacío. NO CONCLUYENTE.'); process.exit(2); }

const { violaciones, sinMedir, revisados } = await medir(rutas);
di(`verify:tdz · ${revisados} archivos de ${DIRS.join(', ')}`);

if (sinMedir.length) {
  di(`\n🔴 SIN MEDIR — ESLint no los pudo parsear (${sinMedir.length}):`);
  for (const s of sinMedir.slice(0, 10)) di(`   ${rel(s.archivo)}:${s.linea}  ${s.motivo}`);
  di('   Un archivo que no se analiza NO es un archivo limpio.');
  process.exit(2);
}

if (violaciones.length) {
  di(`\n🔴 ${violaciones.length} uso(s) antes de declarar — TDZ: compila y revienta en ejecución:`);
  for (const v of violaciones) di(`   ${rel(v.archivo)}:${v.linea}:${v.col}  ${v.mensaje}`);
  process.exit(1);
}
if (AVISOS.length) {
  di(`\n⚠️ ${AVISOS.length} uso(s) antes de declarar pero DIFERIDOS — legales, se listan y no cortan:`);
  const porArchivo = new Map();
  for (const a of AVISOS) porArchivo.set(rel(a.archivo), (porArchivo.get(rel(a.archivo)) ?? 0) + 1);
  for (const [f, n] of [...porArchivo].sort((a, b) => b[1] - a[1]).slice(0, 12)) di(`   ${f}  (${n})`);
  di('   Son la forma `const estilos = …` al pie leída dentro de un componente: el cuerpo corre después.');
}
di(`\n✅ cero usos antes de declarar SIN DIFERIR en ${revisados} archivos.`);
