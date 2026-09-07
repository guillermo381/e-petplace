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
  ['verify:todo', {
    ficha: 'D-1015',
    razon:
      'NUNCA fue un gate: era la abreviatura de B para «todos los gates», escrita en el archivo compartido de pendientes de S113. La nota de B ya se curó — hoy el nombre sobrevive SÓLO citado dentro del parte cerrado de C (`docs/loop/S113-C-2.0.md`), donde C lo transcribe justamente para reportar este rojo. Reescribir el parte de otra pista para que un gate se ponga verde es ajustar el mundo al instrumento: la medición de C era verdadera y se MARCA, no se borra.',
  }],
  ['verify:huerfanas', {
    ficha: 'D-1015',
    razon: 'nombrado una vez en el parte de S103-B, cerrado. Sin archivo en git.',
  }],
]);

/** Los .md donde el canon nombra gates. */
/**
 * 🔴 **LA MITAD QUE FALTABA: `package.json` → ARCHIVO.**
 * Este gate medía **canon → script** y daba VERDE con `verify:pide-en-memorial`
 * registrado en `package.json` y **sin archivo en ningún lado**. *Una línea en
 * `package.json` es una promesa de que se puede correr*, y cuando no se puede el
 * fallo es `MODULE_NOT_FOUND` — que en una tanda se lee como un script roto, no
 * como un gate ausente. **Encontrado caminando una pantalla**: el código citaba
 * ese gate como la razón por la que el caso estaba cubierto.
 */
export function lineasSinArchivo(scripts, existe) {
  const rotas = [];
  for (const [nombre, linea] of Object.entries(scripts ?? {})) {
    if (!nombre.startsWith('verify:')) continue;
    /* Se toma el PRIMER argumento que parece una ruta de archivo. Un comando
       compuesto (`a && b`) declara varias; alcanza con que alguna no exista. */
    for (const tok of String(linea).split(/\s+/)) {
      if (!/^[\w./-]+\.(mjs|mts|ts|js|cjs)$/.test(tok)) continue;
      if (!existe(tok)) rotas.push({ nombre, ruta: tok });
    }
  }
  return rotas;
}

/**
 * 🔴 **DOS LÍNEAS CON EL MISMO NOMBRE: LA ÚLTIMA GANA Y LA OTRA DESAPARECE.**
 * `package.json` es JSON: una clave repetida no es un error, es un reemplazo
 * silencioso. Encontrado al CERRAR S113 — mi `verify:boveda` y el arnés de B
 * compartían nombre, **el mío quedó inalcanzable**, y ni `pnpm` ni este gate
 * dijeron nada: los dos archivos existen, así que el brazo de
 * `package.json → archivo` daba verde. *Un gate que no corre porque otro le tapó
 * el nombre no da rojo: no corre, y su silencio se lee como salud.*
 * ⚠️ Y nació de un MERGE, no de un descuido: el de B llegó por `main` DESPUÉS de
 * que yo registrara el mío. *Nadie escribió el duplicado; lo escribió juntar dos
 * ramas, que es cuando nadie está mirando el archivo.*
 */
export function nombresDuplicados(texto) {
  const vistos = new Map();
  for (const m of String(texto ?? '').matchAll(/^\s*"(verify:[\w:.-]+)"\s*:/gm)) {
    vistos.set(m[1], (vistos.get(m[1]) ?? 0) + 1);
  }
  return [...vistos.entries()].filter(([, n]) => n > 1).map(([nombre, n]) => ({ nombre, n }));
}

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

  /* ═══ 🔴 LOS REPOS HERMANOS DE LA CASA — S113-B, y es una CURA DE ROJO FALSO ═
     ⏪ Este gate leía SÓLO el `package.json` de este monorepo, y el canon nombra
     gates del SITIO, que vive en `../epetplace-web`. Resultado medido:
     `verify:sin-supabase` salió como *«nadie puede correrlo»* estando **vivo,
     con línea propia y con su control positivo corrido el mismo día** — lo dice
     `docs/loop/S113-NOCHE.md:294`.

     *Un rojo falso es más caro que un hueco: el hueco se ve, y el rojo falso
     enseña a saltear el gate.* Y su cura no es una jubilación —el gate no está
     jubilado, está en otro lado— sino ensanchar al lector.

     ⚠️ **Descartable y anunciado**: si el repo hermano no está en disco, esto
     no hace nada y el gate mide exactamente lo que medía antes. El reporte dice
     cuántos entraron por acá, para que su silencio no se lea como que no había. */
  const HERMANOS = ['../epetplace-web', '../e-petplace-admin'];
  const deHermanos = new Map();
  for (const repo of HERMANOS) {
    const pj = join(repo, 'package.json');
    if (!existsSync(pj)) continue;
    for (const k of Object.keys(JSON.parse(readFileSync(pj, 'utf8')).scripts ?? {})) {
      if (!k.startsWith('verify:') || scripts.has(k)) continue;
      deHermanos.set(k, repo);
    }
  }

  const enScripts = [...scripts].filter((s) => s.startsWith('verify:'));

  const archivos = existsSync('scripts') ? readdirSync('scripts') : [];
  const faltan = [];
  const jubiladosVivos = [];   // la tabla mintiendo: jubilado con script o archivo
  const homonimosHermanos = []; // jubilado acá, vivo en un repo de la casa: se AVISA
  const archivoDe = (n) => {
    const f = `verify-${n.slice('verify:'.length)}.mjs`;
    return existsSync(join('scripts', f)) ? f : null;
  };
  for (const [nombre, sitios] of donde) {
    /* 🔴 DOS CORPUS, A PROPÓSITO — y confundirlos rompe el control de la tabla.
       La pregunta *«¿alguien puede correr esto?»* se contesta con la CASA
       entera (este repo + los hermanos): si el gate vive en el sitio, existe.
       La pregunta *«¿la tabla de jubilaciones miente?»* se contesta con ESTE
       repo, que es sobre lo que la tabla habla. *Mezclarlos haría que un
       homónimo del sitio declare falsa una jubilación de acá.* */
    if ((scripts.has(nombre) || deHermanos.has(nombre)) && !JUBILADOS.has(nombre)) continue;
    const baseJ = nombre.slice('verify:'.length);
    const archivoJ = archivos.find((a) => a === `verify-${baseJ}.mjs` || a === `verify-${baseJ}.ts`
      || a === `_censo-${baseJ}.mjs`);
    if (JUBILADOS.has(nombre)) {
      /* El jubilado que vive en un repo hermano NO es la tabla mintiendo: es un
         dato que su dueño necesita. Se AVISA y no se falla. */
      if (deHermanos.has(nombre) && !scripts.has(nombre) && !archivoDe(nombre)) {
        homonimosHermanos.push({ nombre, repo: deHermanos.get(nombre) });
        continue;
      }
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
  return { fuentes, donde, enScripts, faltan, jubiladosVivos, deHermanos, homonimosHermanos };
}

function reportar({ fuentes, donde, enScripts, faltan, jubiladosVivos, deHermanos, homonimosHermanos }) {
  di(`gates-existen · ${donde.size} nombres en ${fuentes.length} archivo(s) · ` +
     `${enScripts.length} verify:* en package.json · ${JUBILADOS.size} jubilado(s) declarado(s)` +
     (deHermanos.size
       ? ` · ${deHermanos.size} en repo hermano (${[...new Set(deHermanos.values())].join(' · ')})`
       : ' · repos hermanos NO en disco: los gates del sitio no se pudieron medir'));

  // 🔴 La tabla mintiendo es MÁS grave que un gate ausente: significa que el
  //    canon da por muerto algo que alguien puede correr.
  if (homonimosHermanos.length) {
    di(`\n⚠️ JUBILADO ACÁ, VIVO EN UN REPO DE LA CASA (${homonimosHermanos.length}) — no es la tabla mintiendo, es un dato para su dueño:`);
    for (const h of homonimosHermanos) di(`   ${h.nombre} → tiene línea en ${h.repo}/package.json`);
    di('   ⇒ la ficha de su jubilación se midió contra ESTE repo. Si es el MISMO gate,');
    di('     la jubilación se revisa; si es un homónimo, se declara en la razón.');
  }

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

  const dup = nombresDuplicados(readFileSync('package.json', 'utf8'));
  if (dup.length) {
    di(`\n🔴 NOMBRES REPETIDOS EN package.json (${dup.length}) — la última línea gana`);
    di('   y la otra queda inalcanzable, sin que nada falle:');
    for (const d of dup) di(`   ${d.nombre} × ${d.n}`);
    return 1;
  }

  const rotas = lineasSinArchivo(
    JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {},
    (r) => existsSync(r));
  if (rotas.length) {
    di(`\n🔴 LÍNEAS DE package.json QUE APUNTAN A UN ARCHIVO QUE NO EXISTE (${rotas.length}):`);
    for (const r of rotas) di(`   ${r.nombre} → ${r.ruta}`);
    di('   ⇒ correrlas da MODULE_NOT_FOUND, que en una tanda se lee como un script');
    di('     roto y no como un gate ausente. O existe el archivo, o se saca la línea.');
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

  /* 🔴 EL BRAZO NUEVO TAMBIÉN SE PRUEBA, y su positivo va primero: sin esto
     tendría un brazo que nunca produjo su rojo — que es lo mismo que no medir. */
  const R = lineasSinArchivo(
    { 'verify:fantasma': 'tsx apps/x/no-existe.mts', 'verify:vivo': 'node scripts/si-existe.mjs',
      'build': 'node scripts/tampoco-existe.mjs' },
    (r) => r === 'scripts/si-existe.mjs');
  const dosDir = [
    [R.length === 1 && R[0].nombre === 'verify:fantasma', 'POSITIVO  una línea que apunta a un archivo inexistente se delata'],
    [!R.some((x) => x.nombre === 'verify:vivo'), 'NEGATIVO  una línea cuyo archivo existe no produce hallazgo'],
    [!R.some((x) => x.nombre === 'build'), 'CLASE     sólo se juzgan las `verify:*` — el resto del package.json no es de este gate'],
    [lineasSinArchivo({ 'verify:x': 'pnpm -r typecheck' }, () => false).length === 0,
      'CLASE     una línea sin ninguna ruta de archivo no se inventa un hallazgo'],
    [nombresDuplicados('  "verify:a": "x"\n  "verify:a": "y"\n  "verify:b": "z"\n').length === 1,
      'POSITIVO  dos líneas con el MISMO nombre se delatan — en JSON la última gana'],
    [nombresDuplicados('  "verify:a": "x"\n  "verify:b": "y"\n').length === 0,
      'NEGATIVO  nombres distintos no producen hallazgo'],
    [nombresDuplicados('  "build": "x"\n  "build": "y"\n').length === 0,
      'CLASE     sólo se juzgan las `verify:*`'],
  ];
  let rojo2 = false;
  for (const [b, et] of dosDir) { di(`${b ? '✅' : '🔴'} ${et}`); if (!b) rojo2 = true; }

  di((rojo || rojo2) ? '\n🔴 EL GATE NO MIDE.' : '\n✅ el gate mide: las DOS direcciones — canon→script y package.json→archivo.');
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
