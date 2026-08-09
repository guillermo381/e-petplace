#!/usr/bin/env node
/**
 * verify-rutas — NINGÚN CAMINO LLEVA A UNA PANTALLA QUE NO EXISTE.
 * (S86-B, sobre la propuesta de C.)
 *
 * ══ EL CASO QUE LO PARIÓ ══
 * El dashboard enlazaba a `/negocio/liquidaciones`, **que no existe**.
 * Typecheck VERDE, lint VERDE, gate VERDE — sobre un camino muerto. Es la
 * familia entera de S85: no rompe nada, produce una salida creíble, y lo
 * único que falla es lo que el usuario encuentra al tocar.
 *
 * Ninguna herramienta de la casa podía verlo, y por una razón estructural:
 * expo-router resuelve rutas por CONVENCIÓN DE ARCHIVOS, así que un
 * `router.push('/lo/que/sea')` es un STRING — para el compilador es tan
 * válido como cualquier otro. El único que puede decir la verdad es quien
 * cruza los dos lados: el árbol de `app/` y los push del código.
 *
 * ══ QUÉ HACE ══
 * ① Enumera las rutas REALES del árbol de `app/` de cada app, con las
 *    convenciones de expo-router (grupos `(x)` que no viajan a la URL,
 *    `index` que colapsa al directorio, `[param]` dinámico, `_layout` que
 *    no es ruta).
 * ② Extrae cada destino LITERAL del código de esa MISMA app.
 * ③ Cruza. Un destino sin ruta que lo reciba es ROJO.
 *
 * ══ ⚠️ SU LÍMITE, Y VA EN LA SALIDA, NO SOLO ACÁ ══
 * **Solo ve destinos LITERALES.** Los armados por variable, por template
 * o por helper quedan AFUERA — y el script IMPRIME CUÁNTOS SON en cada
 * corrida. *Un guard que aparenta cobertura total es peor que uno que
 * declara su alcance*: el primero se cita como prueba de que no hay
 * caminos muertos; el segundo dice exactamente qué miró.
 *
 * ⚠️ NO lee con `grep` y es a propósito: `apps/prestador/src/app/(tabs)/index.tsx`
 * tiene un byte NUL literal en el fuente y `grep` lo clasifica como
 * BINARIO y lo omite EN SILENCIO (medido S86-B: 1 archivo de 982, y es la
 * pantalla más grande del prestador). Un censo que use grep sobre esta app
 * mide de menos sin avisar.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const APPS = [
  { nombre: 'cliente', raiz: 'apps/cliente/src' },
  { nombre: 'prestador', raiz: 'apps/prestador/src' },
];

/** Mínimo de rutas por app: menos que esto es árbol roto o ruta mal dada,
 *  y el silencio del script dejaría de significar "no hay caminos muertos"
 *  para significar "no miré" (L-192, la capa del ancla). */
const ANCLA_MIN_RUTAS = 15;

const tsx = (d) => {
  const out = [];
  if (!existsSync(d)) return out;
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) out.push(...tsx(p));
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
};

/** L-170: un censo NO lee comentarios como código. Un `router.push` citado
 *  en un comentario no navega a ningún lado. */
const sinComentarios = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// ─────────────────────────────────────────────────────────────────────────
// ① LAS RUTAS REALES — la convención de expo-router, aplicada al árbol
// ─────────────────────────────────────────────────────────────────────────
/** Un archivo puede ser alcanzable por VARIAS URLs: los grupos `(tabs)`
 *  son opcionales en el enlace (expo-router acepta `/hogar` y
 *  `/(tabs)/hogar`, y el código de la casa usa las dos formas — medido).
 *  Se generan todas las combinaciones de incluir/omitir cada grupo. */
function urlsDe(rel) {
  let ruta = rel.replace(/\.tsx$/, '');
  if (ruta.endsWith('/index')) ruta = ruta.slice(0, -'/index'.length);
  if (ruta === 'index') ruta = '';
  const segs = ruta === '' ? [] : ruta.split('/');
  let variantes = [[]];
  for (const s of segs) {
    const esGrupo = /^\(.+\)$/.test(s);
    variantes = variantes.flatMap((v) => (esGrupo ? [v, [...v, s]] : [[...v, s]]));
  }
  return variantes.map((v) => '/' + v.join('/')).map((u) => (u === '/' ? '/' : u.replace(/\/$/, '')));
}

function rutasDe(raizApp) {
  const dirApp = join(raizApp, 'app');
  const set = new Set();
  for (const p of tsx(dirApp)) {
    const base = p.split('/').pop();
    // `_layout` no es ruta; `+not-found`/`+html` son especiales de expo-router
    if (base === '_layout.tsx' || base.startsWith('+')) continue;
    for (const u of urlsDe(relative(dirApp, p))) set.add(u);
  }
  return set;
}

// ─────────────────────────────────────────────────────────────────────────
// ② LOS DESTINOS DEL CÓDIGO — las formas MEDIDAS en el árbol (S86-B), no
//    las imaginadas: push/replace/navigate literal (102) · `pathname:` de
//    la forma-objeto (64, la más usada) · `ruta:` de los menús (15).
// ─────────────────────────────────────────────────────────────────────────
const RE_DESTINO =
  /(?:router\.(?:push|replace|navigate)\(\s*|pathname:\s*|\bruta:\s*)['"](\/[^'"]*)['"]/g;

/** Lo que este guard NO puede ver, y por eso se cuenta y se declara.
 *
 *  ⚠️ SE MIDIÓ ANTES DE CONFIAR EN ÉL, y menos mal: la primera versión de
 *  este contador decía **104** y los reales son **5**. Los otros 99 eran
 *  la forma-objeto `router.push({ pathname: '/x' })` — que ESTE MISMO
 *  guard verifica por `pathname:`. *Un guard que declara mal su alcance
 *  es tan malo como el que no lo declara:* habría anunciado 104 huecos
 *  inexistentes y cualquiera habría concluido que casi no mira nada. */
const RE_NAV_ABIERTA = /router\.(?:push|replace|navigate)\(\s*(?![\s]*['"])[A-Za-z_`{[]/g;
/** …salvo la forma-objeto con pathname literal, que sí se verifica. */
const ES_OBJETO_LITERAL = /^\s*\{[\s\S]{0,80}?pathname:\s*['"]/;

function destinosDe(raizApp) {
  const out = [];
  let opacos = 0;
  for (const p of tsx(raizApp)) {
    const src = sinComentarios(readFileSync(p, 'utf8'));
    for (const m of src.matchAll(RE_DESTINO)) {
      // la forma-objeto con `pathname` puede traer query — se corta
      out.push({ destino: m[1].split('?')[0], archivo: p });
    }
    for (const m of src.matchAll(RE_NAV_ABIERTA)) {
      const cola = src.slice(m.index + m[0].length - 1);
      if (!ES_OBJETO_LITERAL.test(cola)) opacos++;
    }
  }
  return { destinos: out, opacos };
}

// ─────────────────────────────────────────────────────────────────────────
// ③ AUTO-PRUEBA (L-192) — el guard tiene que poder salir ROJO, y se
//    demuestra en CADA corrida, no se afirma en el reporte.
// ─────────────────────────────────────────────────────────────────────────
function autoPrueba() {
  const mudos = [];
  const rutas = new Set(['/', '/negocio', '/cita/[citaId]']);
  const existe = (d) => rutas.has(d);
  if (existe('/negocio/liquidaciones'))
    mudos.push('el matcher acepta una ruta INEXISTENTE — el caso que parió el guard pasaría en verde.');
  if (!existe('/cita/[citaId]')) mudos.push('el matcher rechaza una ruta DINÁMICA válida — falso positivo constante.');
  if (!existe('/negocio')) mudos.push('el matcher rechaza una ruta simple válida — falso positivo constante.');
  // el enumerador, contra un caso armado a mano
  const u = urlsDe('(tabs)/hogar/index.tsx');
  if (!u.includes('/hogar') || !u.includes('/(tabs)/hogar'))
    mudos.push(`el enumerador no genera las DOS formas del grupo: ${JSON.stringify(u)} — los push con "(tabs)" saldrían rojos siendo válidos.`);
  if (!urlsDe('index.tsx').includes('/')) mudos.push('el enumerador no resuelve la raíz.');

  // ── EL CONTADOR DEL LÍMITE, que YA SE EQUIVOCÓ UNA VEZ (decía 104 sobre
  //    5 reales) y por eso tiene su propio rojo. Si volviera a contar la
  //    forma-objeto literal como hueco, el guard mentiría sobre su alcance
  //    — en la dirección de aparentar que mira MENOS de lo que mira, que
  //    es igual de falso que la inversa.
  const objetoLiteral = "router.push({ pathname: '/x', params: { a } })";
  const porVariable = 'router.push(lugar.ruta)';
  const cuentaOpacos = (src) => {
    let n = 0;
    for (const m of src.matchAll(RE_NAV_ABIERTA)) {
      if (!ES_OBJETO_LITERAL.test(src.slice(m.index + m[0].length - 1))) n++;
    }
    return n;
  };
  if (cuentaOpacos(objetoLiteral) !== 0)
    mudos.push('el contador del límite cuenta la forma-objeto LITERAL como hueco — el guard declararía mal su alcance.');
  if (cuentaOpacos(porVariable) !== 1)
    mudos.push('el contador del límite NO ve una navegación por variable — el alcance declarado sería falso.');

  return mudos;
}

// ─────────────────────────────────────────────────────────────────────────
function main() {
  const mudos = autoPrueba();
  if (mudos.length > 0) {
    console.error('\n🔴 AUTO-PRUEBA ROTA (L-192) — verify:rutas se declara DECORATIVO y no reporta:\n');
    for (const m of mudos) console.error(`   · ${m}`);
    console.error('\nUn guard que no puede fallar no verifica nada.\n');
    process.exit(1);
  }

  console.log('\n  verify:rutas — ningún camino lleva a una pantalla que no existe\n');
  let fallos = 0;
  let opacosTotal = 0;
  let literalesTotal = 0;

  for (const { nombre, raiz } of APPS) {
    if (!existsSync(raiz)) {
      console.error(`  🔴 ${nombre}: no existe ${raiz} — corré desde la raíz del monorepo.`);
      process.exit(2);
    }
    const rutas = rutasDe(raiz);
    if (rutas.size < ANCLA_MIN_RUTAS) {
      console.error(
        `  🔴 ANCLA ROTA · ${nombre}: el árbol de app/ trajo ${rutas.size} rutas y se esperan al menos ` +
          `${ANCLA_MIN_RUTAS}. Sin rutas, TODO destino saldría rojo (o nada se verificaría): el silencio ` +
          `de este guard dejaría de significar "no hay caminos muertos" (L-192).`,
      );
      process.exit(1);
    }
    const { destinos, opacos } = destinosDe(raiz);
    opacosTotal += opacos;
    literalesTotal += destinos.length;

    const rotos = destinos.filter((d) => !rutas.has(d.destino));
    console.log(`  ${nombre} · ${rutas.size} rutas en el árbol · ${destinos.length} destinos literales`);
    if (rotos.length === 0) {
      console.log(`     ✓ los ${destinos.length} llegan a una pantalla real`);
    } else {
      // se agrupa por destino: un mismo camino muerto enlazado desde tres
      // lados es UN defecto con tres síntomas
      const porDestino = new Map();
      for (const r of rotos) {
        if (!porDestino.has(r.destino)) porDestino.set(r.destino, []);
        porDestino.get(r.destino).push(r.archivo);
      }
      for (const [d, archivos] of porDestino) {
        console.error(`     ✗ CAMINO MUERTO: ${d} — no existe en apps/${nombre}/src/app/`);
        for (const a of archivos) console.error(`         enlazado desde ${a}`);
        fallos++;
      }
    }
    console.log('');
  }

  // ── EL LÍMITE, EN LA SALIDA (no solo en la cabecera) ──
  console.log('  ── ALCANCE DECLARADO ──');
  console.log(`  Verificados: ${literalesTotal} destinos LITERALES.`);
  console.log(`  NO LITERALES: ${opacosTotal} navegación(es) que abren con variable, ternario o tabla.`);
  console.log('     Su destino PUEDE estar cubierto igual —si el literal aparece en un `pathname:`');
  console.log('     o en un `ruta:` que este guard sí lee— pero el guard NO LO GARANTIZA para ellas.');
  console.log('  Este guard solo ve strings literales: un camino muerto armado en runtime NO lo caza.');
  console.log('  El número de arriba no es cobertura total — es exactamente lo que miró.');
  console.log('  (Un guard que aparenta cobertura total es peor que uno que declara su alcance.)\n');

  if (fallos > 0) {
    console.error(`  verify:rutas — ${fallos} camino(s) muerto(s)\n`);
    process.exit(1);
  }
  console.log('  verify:rutas — VERDE\n');
}

main();
