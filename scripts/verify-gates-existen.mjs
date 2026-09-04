#!/usr/bin/env node
/**
 * S113-E · EL GATE QUE MIDE QUE LOS GATES EXISTAN.
 *
 * ═══ POR QUÉ EXISTE ════════════════════════════════════════════════════════
 * El canon nombra gates por su nombre — *«corré `verify:tal`»* — y quien lo lee
 * asume que existe. **En un solo lote aparecieron DOS pedidos por nombre de
 * gates ausentes.** Dos veces la misma forma en un lote no es un olvido: es una
 * clase, y una clase se mide.
 *
 * 🔴 **Su modo de falla es el peor de los tres:** un gate que no existe no
 * falla — **no corre**. No hay rojo, no hay excepción, no hay línea. El canon
 * dice que algo se vigila, nadie lo vigila, y el silencio se lee como salud.
 * *Un gate inexistente es indistinguible de un gate que siempre pasa.*
 *
 * ═══ QUÉ MIDE ══════════════════════════════════════════════════════════════
 * Todo `verify:<nombre>` nombrado en `CLAUDE.md` y en `docs/loop/*.md`, contra
 * los scripts del `package.json` **raíz**. Esa es la vara: el package.json es
 * lo único que hace a un gate *invocable*. Un archivo suelto en `scripts/` que
 * nadie puede llamar por su nombre no es un gate — es un archivo.
 *
 * ═══ DOS CLASES, porque se curan distinto ═════════════════════════════════
 * El reporte las separa en vez de amontonarlas:
 *   · **SIN NADA** — ni script ni archivo. Se construye, o se retira la
 *     mención del canon. Es trabajo o es letra vieja.
 *   · **SIN LÍNEA** — el archivo existe en `scripts/` pero el `package.json`
 *     no lo expone con ese nombre (o lo expone con otro). Se cura con UNA
 *     línea. *Es el caso más traicionero: el gate existe, alguien lo escribió,
 *     y el nombre con el que el canon lo pide no lo invoca.*
 *
 * ═══ LO QUE ESTE GATE **NO** DICE ══════════════════════════════════════════
 * Que un gate exista **no** dice que mida, ni que esté verde, ni que alguien lo
 * corra. Mide una sola cosa —presencia del nombre— y no se la debe leer como
 * más que eso.
 *
 * ═══ CONTROL (`--control`) ═════════════════════════════════════════════════
 *   POSITIVO  planta `verify:gate-que-no-existe` en un .md temporal → ROJO,
 *             y el rojo NOMBRA ese gate (no cualquier rojo sirve)
 *   NEGATIVO  se retira el .md → el veredicto vuelve a ser el del árbol
 *
 * Salida: 0 verde · 1 hay nombrados que no existen · 2 no concluyente.
 */
import { readdirSync, readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const di = (s) => process.stdout.write(s + '\n');
const PATRON = /verify:[a-z0-9-]+/g;

/* ═══ LA TABLA DE JUBILACIONES — S113-A, firma del founder 4-sep-2026 ═══════
   Precedente vivo de la casa: `R62` de `verify:diseno` es literalmente «la
   tabla de jubilaciones», y `verify-edge-simbolos` quedó como lápida con
   exit 2. **Un gate jubilado se DECLARA, no se borra.**

   🔴 POR QUÉ HACE FALTA, y no es comodidad: estos tres nombres viven en
   **actas FIRMADAS** (`S103-ACTA-CIERRE.md`) y en partes de pista cerrados.
   *Reescribir un acta para que un gate se ponga verde es exactamente el modo
   de falla que esta casa nombra: ajustar el mundo al instrumento.* La medición
   de aquel día era verdadera para quien la escribió; lo que no existe es el
   comando. **La medición NO se reescribe — se marca.**

   ⚠️ ESTO NO ES UNA LISTA DE PERDÓN. Cada entrada trae su ficha y su razón, y
   el gate **verifica que la tabla no mienta**: si un nombre jubilado llegara a
   tener script o archivo, sale ROJO — porque entonces la jubilación sería
   falsa y alguien estaría corriendo un gate que el canon da por muerto. */
const JUBILADOS = new Map([
  ['verify:borradores', {
    ficha: 'D-1015',
    razon: 'nunca existió en git; los tres números que CLAUDE.md le atribuía se RETIRARON (firma founder 4-sep-2026). Se re-mide el día que una decisión lo necesite, y el gate se construye ese día.',
  }],
  ['verify:legales', {
    ficha: 'D-1015',
    razon: 'nombrado sólo en el parte de S103-B, cerrado. Sin archivo en git. Mismo trato: se construye el día que una decisión lo necesite.',
  }],
  ['verify:huerfanas', {
    ficha: 'D-1015',
    razon: 'nombrado una vez en el parte de S103-B, cerrado. Sin archivo en git.',
  }],
]);

/** Los .md donde el canon nombra gates. */
function corpus() {
  const fuentes = [];
  if (existsSync('CLAUDE.md')) fuentes.push('CLAUDE.md');
  if (existsSync('docs/loop')) {
    for (const f of readdirSync('docs/loop').filter((x) => x.endsWith('.md'))) {
      fuentes.push(join('docs/loop', f));
    }
  }
  return fuentes;
}

/** nombre → [{archivo, linea}] donde se lo nombra. */
function nombrados(fuentes) {
  const donde = new Map();
  for (const f of fuentes) {
    readFileSync(f, 'utf8').split('\n').forEach((linea, i) => {
      for (const m of linea.matchAll(PATRON)) {
        if (!donde.has(m[0])) donde.set(m[0], []);
        donde.get(m[0]).push({ archivo: f, linea: i + 1 });
      }
    });
  }
  return donde;
}

function censar() {
  const fuentes = corpus();
  const donde = nombrados(fuentes);
  const scripts = new Set(Object.keys(JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {}));
  const enScripts = [...scripts].filter((s) => s.startsWith('verify:'));

  const archivos = existsSync('scripts') ? readdirSync('scripts') : [];
  const faltan = [];
  const jubiladosVivos = [];   // la tabla mintiendo: jubilado con script o archivo
  for (const [nombre, sitios] of donde) {
    if (scripts.has(nombre) && !JUBILADOS.has(nombre)) continue;
    const baseJ = nombre.slice('verify:'.length);
    const archivoJ = archivos.find((a) => a === `verify-${baseJ}.mjs` || a === `verify-${baseJ}.ts`
      || a === `_censo-${baseJ}.mjs`);
    if (JUBILADOS.has(nombre)) {
      // 🔴 EL CONTROL DE LA TABLA: un jubilado que existe es una jubilación falsa.
      if (scripts.has(nombre) || archivoJ) {
        jubiladosVivos.push({ nombre, script: scripts.has(nombre), archivo: archivoJ ?? null });
      }
      continue;
    }
    if (scripts.has(nombre)) continue;
    // ¿Existe el archivo con ese nombre, aunque el package.json no lo exponga?
    const base = nombre.slice('verify:'.length);
    const archivo = archivos.find((a) => a === `verify-${base}.mjs` || a === `verify-${base}.ts`
      || a === `_censo-${base}.mjs`);
    faltan.push({ nombre, sitios, archivo: archivo ? join('scripts', archivo) : null });
  }
  return { fuentes, donde, enScripts, faltan, jubiladosVivos };
}

function reportar({ fuentes, donde, enScripts, faltan, jubiladosVivos }) {
  di(`gates-existen · ${donde.size} nombres en ${fuentes.length} archivo(s) · ` +
     `${enScripts.length} verify:* en package.json · ${JUBILADOS.size} jubilado(s) declarado(s)`);

  // 🔴 La tabla mintiendo es MÁS grave que un gate ausente: significa que el
  //    canon da por muerto algo que alguien puede correr.
  if (jubiladosVivos.length) {
    di(`\n🔴 LA TABLA DE JUBILACIONES MIENTE (${jubiladosVivos.length}):`);
    for (const j of jubiladosVivos) {
      di(`   ${j.nombre} está declarado JUBILADO y ` +
         `${j.script ? 'TIENE línea en package.json' : ''}${j.script && j.archivo ? ' y ' : ''}` +
         `${j.archivo ? `existe ${j.archivo}` : ''}`);
    }
    di('   ⇒ o se saca de la tabla, o se saca del repo. No las dos cosas.');
    return 1;
  }

  if (faltan.length === 0) {
    di('\n✅ VERDE · todo gate nombrado en el canon existe como script invocable.');
    if (JUBILADOS.size) {
      di(`   (${JUBILADOS.size} jubilado(s) apartado(s) POR DECLARACIÓN, no por silencio:`);
      for (const [n, j] of JUBILADOS) di(`      ${n} — ${j.ficha}`);
      di('    viven en actas firmadas, que no se reescriben para poner un gate en verde.)');
    }
    return 0;
  }
  const sinNada = faltan.filter((f) => !f.archivo);
  const sinLinea = faltan.filter((f) => f.archivo);

  if (sinLinea.length) {
    di(`\n🔴 SIN LÍNEA en package.json — el archivo existe, el nombre no invoca (${sinLinea.length}):`);
    for (const f of sinLinea) {
      di(`   ${f.nombre}`);
      di(`     archivo: ${f.archivo}`);
      di(`     nombrado en: ${f.sitios.slice(0, 2).map((s) => `${s.archivo}:${s.linea}`).join(' · ')}` +
         (f.sitios.length > 2 ? ` (+${f.sitios.length - 2})` : ''));
    }
    di('   ⇒ cura: UNA línea en el package.json raíz (o corregir la mención).');
  }
  if (sinNada.length) {
    di(`\n🔴 SIN NADA — ni script ni archivo (${sinNada.length}):`);
    for (const f of sinNada) {
      di(`   ${f.nombre}`);
      di(`     nombrado en: ${f.sitios.slice(0, 2).map((s) => `${s.archivo}:${s.linea}`).join(' · ')}` +
         (f.sitios.length > 2 ? ` (+${f.sitios.length - 2})` : ''));
    }
    di('   ⇒ cura: construirlo, o retirar la mención del canon. Hoy no vigila nada.');
  }
  di(`\n🔴 ${faltan.length} gate(s) nombrados que nadie puede correr.`);
  return 1;
}

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  const PLANTADO = 'verify:gate-que-no-existe-s113e';
  const tmp = join('docs/loop', '_control-s113e-gates.md');
  let rojo = false;

  // ① POSITIVO primero. Y no alcanza «salió 1»: el rojo tiene que NOMBRAR el
  //    gate plantado — si no, podría estar saliendo rojo por otra cosa.
  writeFileSync(tmp, `# control\n\nCorré \`${PLANTADO}\` antes de cerrar.\n`);
  let r = censar();
  const loVio = r.faltan.some((f) => f.nombre === PLANTADO);
  di(`${loVio ? '✅' : '🔴'} POSITIVO  nombre plantado en un .md ⇒ ${loVio ? 'lo caza y lo nombra' : 'NO LO VIO'}`);
  if (!loVio) rojo = true;

  // ② NEGATIVO: sin el .md, ese nombre desaparece del veredicto.
  rmSync(tmp, { force: true });
  r = censar();
  const yaNo = !r.faltan.some((f) => f.nombre === PLANTADO);
  di(`${yaNo ? '✅' : '🔴'} NEGATIVO  se retira el .md ⇒ ${yaNo ? 'el nombre ya no figura' : 'SIGUE FIGURANDO'}`);
  if (!yaNo) rojo = true;
  di(`   (el árbol tiene ${r.faltan.length} hallazgo(s) propios — el control no los juzga)`);

  di(rojo ? '\n🔴 EL GATE NO MIDE.' : '\n✅ el gate mide: caza el nombre plantado y lo suelta al quitarlo.');
  process.exit(rojo ? 1 : 0);
}

// ═══ CORRIDA NORMAL ═══════════════════════════════════════════════════════
const r = censar();
if (r.fuentes.length === 0) {
  di('🔴 NO CONCLUYENTE: no encontré CLAUDE.md ni docs/loop/*.md que leer.');
  process.exit(2);
}
if (r.donde.size === 0) {
  di('🔴 NO CONCLUYENTE: 0 nombres de gate en el corpus. Un cero sin control no es un verde.');
  process.exit(2);
}
process.exit(reportar(r));
