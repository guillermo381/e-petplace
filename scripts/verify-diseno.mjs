#!/usr/bin/env node
/**
 * verify:diseno — el lint de las leyes de diseño FIRMADAS (S81-B, paga
 * D-481; ENSANCHADO S82-B). LA REGLA DE LA MESA: lo que un lint puede
 * verificar va masivo y el founder NO lo mira; este script SE ENSANCHA
 * con cada ley aplicada.
 *
 * L-192 MECANIZADA (la lección del silencio, S81): TODA regla con modo
 * de fallo se AUTO-PRUEBA en cada corrida — se le da su fixture de
 * violación sintético y TIENE que salir roja; si no puede, el lint
 * entero se declara DECORATIVO y falla. Una regla informativa (sin modo
 * de fallo) lo declara explícitamente y queda fuera de la auto-prueba.
 *
 * GUARD ESTRUCTURAL (S82-B, mismo espíritu L-192): toda regla de REGLAS
 * tiene que estar en FIXTURES o en INFORMATIVAS — exactamente en una.
 * Una regla que no está en ninguna ESCAPÓ de la auto-prueba en silencio
 * (el modo de fallo que L-192 existe para matar); en las dos, se
 * contradice. Cualquiera de los dos casos invalida el lint entero.
 *
 * El exit se lee del COMANDO, jamás del pipe (L-191).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { construirArbol, hitSlopsVecinos, autoPruebaArbol } from './lib-arbol-montaje.mjs';

const RAICES = ['apps/cliente/src', 'apps/prestador/src'];
const RAICES_UI = ['packages/ui/src/components', 'packages/ui/src/brand'];

function archivosTsx(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...archivosTsx(p));
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/**
 * ⚠️ EL MISMO ÁRBOL, PERO TAMBIÉN `.ts` — y nace de un caso REAL, no de una
 * previsión.
 *
 * Al extraer el flujo de reserva del paseo a `lib/reserva/paseo.ts` (D-730), el
 * guard de tres estados que **R34 existe para vigilar** se fue con él. El lint
 * siguió dando VERDE y su contador bajó de 5 a 4: *no porque el guard hubiera
 * desaparecido, sino porque dejó de verlo.* El corpus recorría solo `.tsx`, y
 * la lógica se había mudado a un archivo sin JSX.
 *
 * **Un lint que se apaga cuando el código cambia de extensión no protege el
 * código: protege un directorio.** Y lo más incómodo es que su salida no dice
 * «ya no miro»: dice un número más chico, que se lee como progreso.
 *
 * Se usa SOLO donde la regla vigila lógica y no píxeles (hoy R34), en vez de
 * ensanchar el corpus entero: ensancharlo encendería de una vez todas las demás
 * reglas sobre archivos que nunca miraron, y eso es decisión de mesa.
 */
function archivosCodigo(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...archivosCodigo(p));
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const MINIMOS_CORPUS = { apps: 100, cliente: 45, ui: 38 };

const leer = (fs) => fs.map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));
const apps = leer(RAICES.flatMap(archivosTsx));
const ui = leer(RAICES_UI.flatMap(archivosTsx));
/** El corpus de LÓGICA (ver `archivosCodigo`): incluye `.ts`, donde viven los
 *  flujos extraídos. Hoy lo consume R34. */
const appsCodigo = leer(RAICES.flatMap(archivosCodigo));
/** S96-B · el corpus de R35: la galería es el único lugar de `ui` que se
 *  compone como PANTALLA, y era el hueco de R2 (que solo mira `apps/`). */
const galeria = leer(archivosTsx('packages/ui/src/gallery'));

/** El ancla del corpus, ejecutada (su porqué y su alcance, arriba). Corre
 *  ANTES que cualquier regla: si el corpus se derrumbó, el lint entero se
 *  declara inválido en vez de imprimir doce ceros tranquilizadores. */
{
  const cliente = apps.filter((a) => /apps\/cliente\//.test(a.path)).length;
  const medido = { apps: apps.length, cliente, ui: ui.length };
  const rotos = Object.entries(MINIMOS_CORPUS).filter(([k, min]) => medido[k] < min);
  if (rotos.length > 0) {
    for (const [k, min] of rotos) {
      console.error(
        `CORPUS ✗ ${k}: esperaba al menos ${min} archivo(s) y encontró ${medido[k]}. Las reglas de AUSENCIA que leen este corpus (R1·R2·R3·R4·R5·R6·R7·R8·R10·R13·R20·R29) pasarían en VERDE sin verificar nada: su silencio dejaría de significar "no hay violaciones" y pasaría a significar "no miré" (L-192, tercera capa).`,
      );
    }
    console.error(`\nverify:diseno — corpus roto: el lint se declara inválido`);
    process.exit(1);
  }
}

/** EL ANCLA DEL CORPUS — LA TERCERA CAPA DE L-192, RESUELTA UNA VEZ
 *  (S85-B5, pedido de mesa: "los 12 guards sin ancla()").
 *
 *  EL HUECO MEDIDO: DOCE reglas de AUSENCIA (R1·R2·R3·R4·R5·R6·R7·R8·
 *  R10·R13·R20·R29) pasaban en VERDE con corpus 0 — probado dándoles `[]`
 *  y leyendo su salida: "0 artesanales", "0 crudos", "0 fugas". El
 *  silencio de una regla de ausencia significa "no hay violaciones" SOLO
 *  si hubo algo que mirar.
 *
 *  POR QUÉ UN ANCLA Y NO DOCE, que es la decisión de diseño: las doce
 *  comparten EL MISMO corpus y EL MISMO modo de falla. Doce `ancla()`
 *  copiadas serían doce sitios donde el mínimo puede quedar viejo por
 *  separado — la copia que L-175 prohíbe, un piso más arriba, y
 *  exactamente el argumento con el que esta casa retiró R26. El corpus se
 *  ancla UNA VEZ, en su origen, antes de que ninguna regla corra.
 *
 *  LOS MÍNIMOS, elegidos contra lo medido (apps 154 · cliente 72 · ui 57)
 *  con margen para que el trabajo normal —borrar pantallas, mover
 *  archivos— no fabrique rojos: se fija ~2/3. No son un objetivo ni una
 *  cuota: son el piso bajo el cual el verde deja de significar algo.
 *
 *  ⚠️ SU ALCANCE, DECLARADO PARA QUE NADIE LA LEA MÁS FUERTE DE LO QUE
 *  ES: ancla los corpus que las doce comparten, NO los sub-corpus que
 *  cada regla se filtra adentro. R13 mira solo `apps/cliente/` y por eso
 *  su casa está anclada aparte; pero una regla futura que filtre por una
 *  carpeta más chica vuelve a tener el hueco, y esa ancla es SUYA. Las
 *  reglas con corpus propio (R11 diccionarios · R17 exports · R18 Cuentas
 *  · R24 explorar/ · R25 la primitiva) ya traen la suya y no se tocan.
 *
 *  ☠️ CONDICIÓN DE MUERTE: ninguna propia — muere con el lint. Lo que sí
 *  cambia es el mínimo, y lo cambia quien MIDA, en el commit que mueva el
 *  corpus de verdad. Bajarlo para que pase un rojo es desarmar el guard. */
/** L-170 mecanizada: un censo NO lee comentarios como código — el
 *  primer disparo real del ratchet R2 fue un hex en PROSA (el
 *  comentario de C en bienvenida-dia1:110). Se despojan // y ／* *／
 *  antes de contar. */
const sinComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const lineaDe = (src, index) => src.slice(0, index).split('\n').length;

/** EL ANCLA — TERCERA CAPA DE L-192 (S82-B r36).
 *
 *  Las dos primeras capas preguntan si la regla PUEDE salir roja
 *  (fixture) y si CORRE contra la casa (guard de corridas). Falta la
 *  tercera, y es la que deja mudas a las reglas de AUSENCIA: una regla
 *  que dice "no encontré ninguna violación" da exactamente la misma
 *  salida verde cuando **no hay nada que mirar** — porque la carpeta se
 *  renombró, porque la clave que vigila cambió de nombre, porque el
 *  archivo se reestructuró. La regla sigue en su lugar, sigue corriendo,
 *  y ya no verifica nada.
 *
 *  El ancla lo cierra: la regla declara el MÍNIMO de corpus que necesita
 *  para que su silencio signifique algo. Sin ese mínimo, ROJO — el mismo
 *  criterio que ya aplicaban R12/R14/R15/R16/R19/R22 cada una por su
 *  cuenta ("sin fuente no hay verificación"); acá se vuelve una pieza con
 *  nombre para que la próxima regla no tenga que reinventarla.
 *
 *  CONDICIÓN DE MUERTE: ninguna — muere con el lint. Lo que sí puede
 *  morir es cada ancla suelta, el día que su regla deje de existir. */
function ancla(nombre, encontrado, minimo, queEs) {
  if (encontrado >= minimo) return [];
  return [
    `${nombre}: ANCLA ROTA — esperaba al menos ${minimo} ${queEs} y encontró ${encontrado}. Una regla de AUSENCIA sin corpus pasa en VERDE sin verificar nada: su silencio dejó de significar "no hay violaciones" y pasó a significar "no miré" (L-192, tercera capa).`,
  ];
}

// ── LAS REGLAS: funciones puras (archivos) → { fallos: string[], info } ──

/** R1 · 7bis sobre SelectorOpcion: naturaleza legal; entidad y
 *  naturaleza EXCLUYENTES (entidad ES relleno por espec S73). */
/** S85-B1 · EL LABEL DECÍA "implícita" Y EL BUCKET ERA "todo lo demás":
 *  un `naturaleza="seFija"` ESCRITO A MANO se contaba como heredado. El
 *  número era correcto y la palabra no — y en un censo de 59 casos eso
 *  borra justo la distinción que el censo existe para tener (qué se
 *  declaró vs qué se heredó del default). Se parte en dos conteos. */
function r1(archivos) {
  const fallos = [];
  let existe = 0, entidad = 0, seFijaDeclarada = 0, sinNaturaleza = 0;
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/<SelectorOpcion\b/g)) {
      const fin = src.indexOf('/>', m.index);
      const tag = src.slice(m.index, fin === -1 ? m.index + 800 : fin);
      const nat = tag.match(/naturaleza="(\w+)"/);
      const esEntidad = /\bentidad\b/.test(tag);
      const linea = lineaDe(src, m.index);
      if (nat && !['existe', 'seFija'].includes(nat[1]))
        fallos.push(`${path}:${linea} — naturaleza="${nat[1]}" no es un valor legal`);
      if (nat && esEntidad)
        fallos.push(`${path}:${linea} — entidad y naturaleza son excluyentes`);
      if (esEntidad) entidad++;
      else if (nat?.[1] === 'existe') existe++;
      else if (nat?.[1] === 'seFija') seFijaDeclarada++;
      else sinNaturaleza++;
    }
  }
  return {
    fallos,
    info: `existe=${existe} · entidad=${entidad} · seFija-declarada=${seFijaDeclarada} · sin-naturaleza=${sinNaturaleza}`,
  };
}

/** R2 · Ley 1 (cero hex crudos en apps) — RATCHET: baseline 4, medido POR
 *  ESTE LINT y SIN comentarios (la historia del número: grep -c dijo 7
 *  —contaba líneas—, el lint crudo dijo 8, y despojar prosa dijo 4:
 *  el contador lo mide la herramienta que lo exige, L-141+L-170). Solo baja. */
const BASELINE_HEX = 1;
function r2(archivos) {
  let hexes = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const n = (sinComentarios(src).match(/#[0-9A-Fa-f]{6}\b/g) ?? []).length;
    if (n > 0) { hexes += n; porArchivo.push(`${path}: ${n}`); }
  }
  const fallos = hexes > BASELINE_HEX
    ? [`Ley 1: ${hexes} hex crudos (baseline ${BASELINE_HEX}) — subió:\n    ${porArchivo.join('\n    ')}`]
    : [];
  return { fallos, info: `${hexes}/${BASELINE_HEX}${hexes < BASELINE_HEX ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R35 · EL COLOR APLICADO SALE DEL TEMA — LA LEY 1 EN `packages/ui`
 *  (S96-B, D-781; adjudicación de mesa sobre el hallazgo de B).
 *
 *  EL HUECO QUE CIERRA, y lo encontró una cura propia: al montar la
 *  muestra de `PuertaDeOficio` en la galería metí un hex crudo
 *  (`#00000010`) y **R2 no lo cazó, porque su corpus es solo `apps/`**.
 *  Lo curé antes de commitear, pero el agujero quedaba: **la Ley 1 no
 *  dice "cero hex crudos en apps", dice CERO HEX CRUDOS**, y la galería
 *  es el único lugar de `ui` que se compone como pantalla.
 *
 *  🔴 POR QUÉ NO ES "R2 CON EL CORPUS MÁS GRANDE", que era el pedido
 *  literal — y es el hallazgo de esta regla: **ensanchar R2 tal cual
 *  habría producido 29 rojos en la galería y ~27 eran FALSOS.** El regex
 *  de R2 cuenta `#XXXXXX` en cualquier posición, y la galería de TOKENS
 *  está llena de hex **dentro de strings de etiqueta** que documentan
 *  valores medidos (`"tealDark #0A7268 — claro 5.51"`). Eso no es un
 *  color aplicado: **es el trabajo de la galería**. `sinComentarios` no
 *  los quita porque no son comentarios.
 *
 *  ⇒ La regla no ensancha un corpus: **afina la PREGUNTA**. Mira hex en
 *  POSICIÓN DE VALOR DE ESTILO (`backgroundColor:`, `color:`, `fill:`…),
 *  que es lo único que la Ley 1 prohíbe. Un hex MENCIONADO documenta; un
 *  hex APLICADO se salta el tema.
 *
 *  LO QUE ENCONTRÓ AL MEDIRSE, antes de existir (por eso se mide antes
 *  de curar): **los 6 stops de la rampa del logo duplicados en
 *  `Isotipo.tsx`**, contra `DIRECCION_ARTE` §9bis.3 que declara
 *  `gradients.logo` como su FUENTE ÚNICA. Verificados byte a byte contra
 *  `palette` y deduplicados en el mismo commit — el render no cambió.
 *  *Una copia de la rampa de marca diverge en silencio: el día que
 *  alguien afine un stop, el isotipo se queda con el viejo.*
 *
 *  ⏪ BASELINE 0 — Y MURIÓ EL MISMO DÍA QUE NACIÓ. Nació en 1 con dueño
 *  declarado: `animated-icon.tsx` tenía `#208AEF` en un `splashOverlay`,
 *  residuo del template de Expo, **territorio de C** — así que se declaró
 *  y se pidió, no se curó desde acá (§6 del método). **C lo mató en su
 *  tanda de marca** (el overlay pasó a `palette.tealDark` + `<Isotipo
 *  variant="blanco">`) y con el merge `f3029182` el piso bajó en `main`.
 *
 *  **RE-MEDIDO SOBRE `main` ANTES DE BAJARLO, y no sobre el aviso:** C
 *  reportó "R35 bajó a 0" desde SU worktree cuando en `main` todavía daba
 *  1/1 — la clase ④ de S88 (*ningún contador se toma de un reporte previo;
 *  se lee del objeto en el turno en que se usa*), con el agravante de que
 *  acá el "objeto" tiene DOS árboles. **No se bajó hasta medir 0 en el
 *  árbol donde la regla corre**, porque un baseline es un TECHO: bajarlo
 *  antes de que baje el piso pone la regla en ROJO contra `main` y le
 *  frena el commit a todos, incluido quien hizo la cura.
 *
 *  *(Queda una mención de `#208AEF` en `main`: vive en el COMENTARIO que
 *  documenta qué había antes. R35 no la cuenta y hace bien — `sinComentarios`
 *  es L-170 mecanizada: un censo no lee prosa como código.)*
 *
 *  ☠️ CONDICIÓN DE MUERTE: ninguna propia — muere con el lint. */
const BASELINE_R35 = {};
const RE_R35 = /(backgroundColor|borderColor|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor|shadowColor|tintColor|color|fill|stroke|stopColor)\s*:\s*'#[0-9A-Fa-f]{3,8}'/g;
function r35(archivos) {
  const fallos = [];
  let total = 0;
  const sumaBaseline = Object.values(BASELINE_R35).reduce((a, b) => a + b, 0);
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    let enArchivo = 0;
    for (const m of limpio.matchAll(RE_R35)) {
      enArchivo++;
      total++;
      if (enArchivo > (BASELINE_R35[path] ?? 0))
        fallos.push(
          `${path}:${lineaDe(limpio, m.index)} — COLOR APLICADO A MANO (${m[0].trim()}). Ley 1: todo color sale de \`@epetplace/ui\` (tokens o slots del tema). Un hex acá no resuelve por tema: se queda igual en oscuro y en memorial, que es la mitad del sistema apagada en silencio.`,
        );
    }
  }
  // ANCLA — escrita contra el modo de falla de ESTA regla: si el corpus
  // de la galería deja de leerse (se renombra la carpeta, se mueve el
  // archivo), R35 informaría "0 colores a mano" en VERDE sobre el único
  // lugar de `ui` que se compone como pantalla — que es justo el lugar
  // por el que nació. No basta con "algún archivo de ui".
  const veGaleria = archivos.some((a) => a.path.includes('packages/ui/src/gallery/'));
  fallos.push(...ancla('R35', veGaleria ? 1 : 0, 1, 'archivo(s) de packages/ui/src/gallery (el corpus que R2 no miraba)'));
  return {
    fallos,
    info: `${total} color(es) aplicados a mano${sumaBaseline === 0 ? ' (DURA EN 0 desde S96-B: el residuo del template murió con la tanda de marca de C, el día que la regla nació)' : ` (baseline ${sumaBaseline})`}${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R3 · A6+§7 sobre Tarjeta — S82-B: GANA MODO DE FALLO (deja de ser
 *  informativa): `elevacion=` solo habla valores del contrato
 *  (plana|reposo|elevada; sm/md = alias DEPRECADOS — legales, contados
 *  aparte para que su número solo baje). El censo de adopción se
 *  conserva como info: las 'plana' explícitas son excepciones con dueño
 *  y su número solo se mueve con decisión — ese juicio sigue siendo de
 *  gate, no de lint. */
const ELEVACION_LEGAL = ['plana', 'reposo', 'elevada'];
const ELEVACION_DEPRECADA = ['sm', 'md'];
function r3(archivos) {
  const fallos = [];
  let plana = 0, explicita = 0, porDefault = 0, deprecada = 0;
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/<Tarjeta\b/g)) {
      const fin = src.indexOf('>', m.index);
      const tag = src.slice(m.index, fin === -1 ? m.index + 400 : fin);
      const ele = tag.match(/elevacion="(\w+)"/);
      if (!ele) { porDefault++; continue; }
      if (ele[1] === 'plana') plana++;
      else if (ELEVACION_DEPRECADA.includes(ele[1])) deprecada++;
      else if (ELEVACION_LEGAL.includes(ele[1])) explicita++;
      else fallos.push(`${path}:${lineaDe(src, m.index)} — elevacion="${ele[1]}" no es un valor del contrato`);
    }
  }
  return { fallos, info: `plana-declarada=${plana} · otra-explícita=${explicita} · deprecada-sm/md=${deprecada} · reposo-por-default=${porDefault}` };
}

/** R4 · Ley 20 (sombras artesanales PROHIBIDAS — el grep del gate,
 *  ahora mecánico): `shadowColor:` literal fuera de theme.* Y
 *  `boxShadow:` con string literal directo, en apps Y en packages/ui.
 *  DURA EN 0: apps y ui nacieron limpios (medido S81; re-medido S82 con
 *  la pata boxShadow — capFoto de AvatarMascota pasa: el valor es
 *  función de la fuente, material FIRMADO, no literal por pantalla). */
function r4(archivos) {
  const fallos = [];
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/shadowColor\s*:/g)) {
      const linea = lineaDe(src, m.index);
      const lineaTxt = src.split('\n')[linea - 1];
      if (!/theme\.|palette\.|tokens/.test(lineaTxt) || /['"]#/.test(lineaTxt)) {
        // literal de color o fuente desconocida = artesanal
        if (/['"]/.test(lineaTxt.split('shadowColor')[1] ?? '')) {
          fallos.push(`${path}:${linea} — sombra artesanal (Ley 20): ${lineaTxt.trim().slice(0, 60)}`);
        }
      }
    }
    for (const m of src.matchAll(/boxShadow\s*:\s*['"`]/g)) {
      fallos.push(`${path}:${lineaDe(src, m.index)} — boxShadow literal (Ley 20): la sombra sale de theme.elevacion, jamás de un string por pantalla`);
    }
  }
  return { fallos, info: `${fallos.length} artesanales` };
}

/** R5 · Ley 21 sobre Boton (S82-B — la capa que Boton ya EMBODIA por
 *  construcción: el CTA ancla al SLOT accent.cta desde S63 y "nadie
 *  re-resuelve por pantalla" ES la letra; target 44 por construcción
 *  desde S58). El único modo de ruptura posible desde apps es
 *  re-resolver el slot a mano — y eso es lo que se vigila, en dos vías:
 *  `cta="` fuera del _layout RAÍZ = DURA EN 0 (la letra: "el raíz del
 *  prestador pasa 'oficio'" — solo el raíz; medido: el único vivo es el
 *  raíz legal) · `accent.cta`/`ctaTexto` directo = RATCHET baseline 1
 *  (el hallazgo del estreno de esta regla: negocio/equipo.tsx:719
 *  colorCheck={theme.accent.ctaTexto} — COBRADO en S82-B ronda 2 por
 *  orden founder: el check sobre fill pasó al blanco del canon SÓLIDO,
 *  Ley 22). Baseline EN EL PISO: solo baja, y de 0 no se sube jamás. */
const BASELINE_ACCENT_CTA = 0;
function r5(archivos) {
  const fallos = [];
  let directos = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    const esLayoutRaiz = /src\/app\/_layout\.tsx$/.test(path);
    const n = (limpio.match(/accent\.cta(?:Texto)?\b/g) ?? []).length;
    if (n > 0) { directos += n; porArchivo.push(`${path}: ${n}`); }
    if (!esLayoutRaiz) {
      for (const m of limpio.matchAll(/\bcta="/g)) {
        fallos.push(`${path}:${lineaDe(limpio, m.index)} — cta= fuera del _layout raíz (Ley 21): solo el raíz declara el registro del CTA`);
      }
    }
  }
  if (directos > BASELINE_ACCENT_CTA)
    fallos.push(`Ley 21: ${directos} accent.cta re-resueltos en apps (baseline ${BASELINE_ACCENT_CTA}) — el CTA lo resuelve Boton por el slot:\n    ${porArchivo.join('\n    ')}`);
  return { fallos, info: `cta-fuera-de-raíz=${fallos.length - (directos > BASELINE_ACCENT_CTA ? 1 : 0)} · accent.cta=${directos}/${BASELINE_ACCENT_CTA}${directos < BASELINE_ACCENT_CTA ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R6 · La regla del teclado (§15b / D-498) sobre EvitaTeclado (S82-B):
 *  el portador es UNO y vive en ui — `KeyboardAvoidingView` crudo en
 *  apps = fallo. DURA EN 0 (medido: el barrido D-498 dejó apps limpias). */
/*  S85-B1 · DECÍA "N crudos" Y CONTABA ARCHIVOS: el `break` cortaba
 *  después del primero, así que una pantalla con tres portadores crudos
 *  reportaba "1 crudo" y curar uno la dejaba en verde aparente. Ahora
 *  cuenta OCURRENCIAS y las reporta todas — el número y la palabra
 *  vuelven a decir lo mismo, y el segundo caso de un archivo deja de
 *  esconderse detrás del primero. */
function r6(archivos) {
  const fallos = [];
  let archivosConCrudo = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    let enArchivo = 0;
    for (const m of limpio.matchAll(/\bKeyboardAvoidingView\b/g)) {
      enArchivo++;
      fallos.push(`${path}:${lineaDe(limpio, m.index)} — KeyboardAvoidingView crudo (D-498): la casa tiene UNA — EvitaTeclado`);
    }
    if (enArchivo > 0) archivosConCrudo++;
  }
  return { fallos, info: `${fallos.length} ocurrencia(s) en ${archivosConCrudo} archivo(s)` };
}

/** R7 · §5 LA ENTRADA sobre Entrada (S82-B): la entrada firmada tiene UN
 *  portador (Entrada, números PRIVADOS por condición de mesa) — el
 *  FadeIn* artesanal por pantalla es la re-implementación que el censo
 *  S81 señaló. RATCHET baseline 2 (el escalonado S52 del Hogar,
 *  pre-§5 — migra al tocarse, D-318). Solo baja. */
const BASELINE_FADEIN = 2;
function r7(archivos) {
  let n = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const c = (sinComentarios(src).match(/\bFadeIn(?:Down|Up|Left|Right)?\b/g) ?? []).length;
    if (c > 0) { n += c; porArchivo.push(`${path}: ${c}`); }
  }
  const fallos = n > BASELINE_FADEIN
    ? [`§5: ${n} FadeIn* artesanales (baseline ${BASELINE_FADEIN}) — la entrada tiene UN portador (Entrada):\n    ${porArchivo.join('\n    ')}`]
    : [];
  return { fallos, info: `${n}/${BASELINE_FADEIN}${n < BASELINE_FADEIN ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R8 · Ley 13 sobre EstadoVacio (S82-B — la capa que EstadoVacio
 *  embodia por construcción: SIN animación de entrada, "un vacío que
 *  anima llama la atención sobre sí mismo"). El modo de fallo es REAL y
 *  casi ocurrió: S81-B② documentó el veto L-c a envolver el EstadoVacio
 *  de adoptar en Entrada. Dos vías: <Entrada> conteniendo <EstadoVacio
 *  = DURA EN 0 (la vía del veto — el portador nuevo no absorbe vacíos)
 *  · <Animated.View entering=> conteniendo <EstadoVacio = RATCHET
 *  baseline 0 — EN EL PISO: los dos del estreno (hogar/index 913/1164)
 *  se COBRARON en S82-B ronda 2 por orden founder (la rama de error a
 *  View plano; la zona de la vida decide su envoltorio por estado —
 *  monta en vacío = aparece QUIETA). Solo baja — de 0 no se sube. */
const BASELINE_VACIO_ENTERING = 0;
/*  S85-B1 · EL RESUMEN ANULABA UN BRAZO CUANDO EL OTRO DISPARABA. El
 *  info derivaba `en-Entrada` de `fallos.length` con una condición que
 *  lo mandaba a 0 apenas el brazo del `entering` pasaba su baseline:
 *  medido, DOS violaciones reales de EstadoVacio-en-Entrada se
 *  reportaban como `en-Entrada=0`. Los fallos SÍ se listaban —el rojo
 *  nunca se perdió—, pero quien leyera el resumen buscaría el defecto
 *  en el brazo equivocado. Los dos brazos cuentan aparte, cada uno lo
 *  suyo. */
function r8(archivos) {
  const fallos = [];
  let enEntrada = 0, entering = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/<Entrada\b/g)) {
      const cierre = src.indexOf('</Entrada>', m.index);
      const bloque = src.slice(m.index, cierre === -1 ? m.index + 2000 : cierre);
      if (/<EstadoVacio\b/.test(bloque)) {
        enEntrada++;
        fallos.push(`${path}:${lineaDe(src, m.index)} — EstadoVacio dentro de Entrada (Ley 13): el vacío JAMÁS se anima (veto L-c, S81)`);
      }
    }
    for (const m of src.matchAll(/<Animated\.View\b[^>]*entering=/g)) {
      const cierre = src.indexOf('</Animated.View>', m.index);
      const bloque = src.slice(m.index, cierre === -1 ? m.index + 2000 : cierre);
      if (/<EstadoVacio\b/.test(bloque)) { entering++; porArchivo.push(`${path}:${lineaDe(src, m.index)}`); }
    }
  }
  if (entering > BASELINE_VACIO_ENTERING)
    fallos.push(`Ley 13: ${entering} EstadoVacio bajo entering= (baseline ${BASELINE_VACIO_ENTERING}) — el vacío JAMÁS se anima:\n    ${porArchivo.join('\n    ')}`);
  return { fallos, info: `en-Entrada=${enEntrada} · bajo-entering=${entering}/${BASELINE_VACIO_ENTERING}${entering < BASELINE_VACIO_ENTERING ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R9 · Ley 17.5 sobre EstadoVacio — INFORMATIVA DECLARADA, y el porqué
 *  es de LETRA, no de pereza: "todo vacío termina en un camino" CHOCA
 *  con el precedente FIRMADO del próximamente sereno (S52; adoptar S73
 *  declara en su CHANEL "cero CTA decorativo — el vacío sereno no
 *  inventa acciones"). Un DURA acá fabricaría falsos rojos sobre
 *  composiciones firmadas — el arbitraje es del founder (⚖️ en el
 *  reporte S82-B). El censo alimenta esa mesa. */
function r9(archivos) {
  let conCamino = 0, sinCamino = 0;
  for (const { src } of archivos) {
    for (const m of src.matchAll(/<EstadoVacio\b/g)) {
      const fin = src.indexOf('/>', m.index);
      const tag = src.slice(m.index, fin === -1 ? m.index + 800 : fin);
      if (/\baccion=/.test(tag)) conCamino++;
      else sinCamino++;
    }
  }
  return { fallos: [], info: `con-camino=${conCamino} · sin-camino=${sinCamino} (⚖️ 17.5 vs próximamente-sereno: arbitraje founder)` };
}

/** R10 · Los overrides LOCALES de la lámina S82-C (marca de agua ·
 *  canto que pinta la curva · fila de recomendación · filtro de la
 *  vida) NO SE GENERALIZAN desde la pantalla — la promoción es de B
 *  después del gate (orden founder S82 ronda 2). El guard ata el
 *  MARCADOR `@override-s82c` a su única casa (hogar/index del cliente):
 *  cubre el vector real de propagación — el copy-paste, que viaja CON
 *  el comentario (L-170 al revés: acá el comentario ES la señal, por
 *  eso esta regla lee el fuente CRUDO, sin despojar). DURA EN 0 fuera
 *  de la casa. Reconciliación declarada: no cubre la reinvención sin
 *  marcador — esa la atrapa el gate de craft, no un grep. */
/** TRES casas declaradas: el Hogar (ronda 2), el PERFIL (ronda 3 — la
 *  imagen-acuerdo ordenó serif/círculo locales ahí) y canto-curva.tsx
 *  (la pieza extraída para que el perfil no la clone — regla 37; sigue
 *  siendo override local del CLIENTE, jamás packages/ui). NOTA VIVA:
 *  en su primer día esta regla cobró una fuga REAL — la propia
 *  extracción de CantoCurva salió sin declarar su casa y el lint la
 *  paró (exit 1). El guard no es decorativo. */
// S85-B7 · `filtro-pills` SALE DE LA LISTA DE CASAS: se promovió a
// `packages/ui` y su marcador `@override-s82c` se fue con él — ya no es
// un override local, es una pieza de la casa. Dejar su nombre acá sería
// declarar como casa de override algo que dejó de serlo, que es la misma
// clase de mentira que R13 tenía en su info.
const CASA_OVERRIDE_S82C = /apps\/cliente\/src\/(app\/\(tabs\)\/hogar\/(index|mascota\/\[mascotaId\])|components\/(canto-curva|reserva-piezas|detalle-cita))\.tsx$/;
function r10(archivos) {
  const fallos = [];
  for (const { path, src } of archivos) {
    if (CASA_OVERRIDE_S82C.test(path)) continue;
    for (const m of src.matchAll(/@override-s82c/g)) {
      fallos.push(`${path}:${lineaDe(src, m.index)} — @override-s82c fuera de su casa: el override local NO se generaliza (la promoción es de B, post-gate)`);
    }
  }
  return { fallos, info: `${fallos.length} fugas del override` };
}

/** R11 · MODELO_LOYALTY §3 sobre LA VOZ DEL MOMENTO (S82-C r3, del
 *  literal transcrito del perfil): la voz describe la ETAPA — si algún
 *  día dice "va bien", "nivel", "%", "racha" o "completaste", cruzó lo
 *  que §3 prohíbe. Mecanizable porque la voz es DICCIONARIO CERRADO
 *  (keys vozCardM*): se escanean las líneas de esas keys en los
 *  diccionarios del cliente contra el vocabulario de score. DURA EN 0. */
const RE_VOZCARD = /vozCardM\d\s*:/;
const RE_SCORE = /%|\bnivel\b|\bprogres\w*|\bpunt(?:os|aje)\b|\brachas?\b|\bcomplet(?:aste|ado|é)\b|\bva bien\b|\blevel\b|\bstreak\b|\bscore\b/i;
function r11(archivosDic) {
  const fallos = [];
  let vigiladas = 0;
  for (const { path, src } of archivosDic) {
    let enArchivo = 0;
    src.split('\n').forEach((lineaTxt, i) => {
      if (!RE_VOZCARD.test(lineaTxt)) return;
      enArchivo++;
      if (RE_SCORE.test(lineaTxt)) {
        fallos.push(`${path}:${i + 1} — la voz del momento habla de DESEMPEÑO (LOYALTY §3): ${lineaTxt.trim().slice(0, 70)}`);
      }
    });
    // ANCLA: esta regla vigila una FAMILIA DE CLAVES POR NOMBRE
    // (`vozCardM<n>`). Si esas claves se renombran en una reforma de
    // i18n, el regex deja de matchear y la regla informa "0 voces con
    // score" para siempre — verde perfecto, vigilando un fantasma.
    fallos.push(...ancla('R11', enArchivo, 1, `clave(s) vozCardM* en ${path}`));
    vigiladas += enArchivo;
  }
  return { fallos, info: `${fallos.length} fallo(s) · ${vigiladas} voces vigiladas` };
}
const DICCIONARIOS = ['apps/cliente/src/i18n/es.ts', 'apps/cliente/src/i18n/en.ts'];
const dics = DICCIONARIOS.map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));

/** R12 · CONTRASTE EN LOS DOS TEMAS (S82-B r4, orden founder): todo par
 *  texto/superficie (4.5) y todo canto sobre su fondo (3.0 no-textual)
 *  pasa en claro Y en oscuro. Los pares los enumera el VOLCADOR
 *  (`scripts/verify-diseno-pares.ts`, misma matemática que
 *  verify-contrast S43 — los dos gates jamás miden distinto); esta
 *  regla los juzga. NO reemplaza a verify:contrast (178 pares curados
 *  por componente): este es el barrido SISTEMÁTICO.
 *  El censo del estreno (29-jul) midió 56 pares y halló 6 bajo mínimo:
 *  1 EXENTA FIRMADA + 5 A BASELINE nominal (lista servida al founder en
 *  el reporte r4) — solo-baja: un par que sale del baseline no vuelve,
 *  y todo par NUEVO bajo mínimo es rojo. Si el volcador no corre o no
 *  parsea, la regla FALLA FUERTE (L-192: el silencio no verifica). */
const EXENTAS_R12 = new Set([
  // FIRMADA S73 (registro del entity chip): fill-vs-fondo dark 2.24–2.47
  // — "el blanco 8.25 carga el estado; el ojo del founder lo firmó
  // igual; sube a deuda si un usuario real lo reporta".
  'dark·canto·accent.controlLleno/bg.card',
]);
const BASELINE_R12 = new Set([
  // ═══ S83-B30 · REGRESIÓN VIVA, NO HERENCIA — y se rotula así a
  // propósito, porque un baseline que no distingue lo heredado de lo que
  // uno acaba de romper es donde se esconde el daño propio.
  //
  // LAS CUATRO LAS CAUSÓ EL TAPIZ AL 8% (S83-B25, `42ffaef`, FIRMADO por
  // el founder), y el barrido las cazó en su PRIMERA corrida — media hora
  // después del commit. Antes/después, mismo medidor:
  //     fill accent.cta/bg.base ... 3.37 → 2.79 → ✅ CURADO en B31 (10.50)
  //     capaText.comunidad/capaBg ... 5.22 → 4.35 → ✅ 4.90 al 5% (B32)
  //     capaText.comunidadAmplia .... 4.71 → 3.87 → ⚠️ 4.40 al 5%, falta 0.10
  //     status.dangerText/dangerBg .. 5.48 → 4.43 → ✅ 5.06 al 5% (B32)
  //
  // LA CAUSA, medida: `capaBg` y `statusBg` son rgba con ALPHA y se
  // componen sobre `bg.base`. Aclarar el fondo aclara el tinte, y el
  // texto de capa —que es claro— pierde contraste contra él. **TRES de
  // las cuatro son de TEXTO**, o sea AA de verdad y no elemento gráfico.
  //
  // POR QUÉ EN BASELINE Y NO EN ROJO: el rojo bloquearía el hook a las
  // tres pistas en pleno ciclo de campo. Entran acotadas y VISIBLES en
  // cada corrida, no exentas — `EXENTAS_R12` es para lo que la casa
  // decidió; esto es lo que hay que decidir.
  //
  // ⏪ S85-B6 — VUELVE, Y VUELVE CON MÁS INFORMACIÓN QUE ANTES.
  // S85-B4 la curó bajando `violetAlpha15` a .12 (par 4.40 → 4.54). El
  // founder la REVIRTIÓ en dispositivo, literal: «el tinte verde no se ve
  // o no se percibe, ni en claro ni en oscuro». Un ajuste imperceptible
  // no paga su costo, así que el par vuelve a 4.40 y vuelve acá.
  //
  // LO QUE LA VUELTA DEJA MEDIDO, y por eso el menú de este par ya no es
  // el que era: (a) el comentario original ofrecía "volver el tapiz al
  // 3%" — esa salida apuntaba a `tapizDark`, el tapiz del CLIENTE, y este
  // par cuelga de `tapizDarkOficio`: MOVÍA UNA PERILLA QUE NO LO
  // GOBIERNA. (b) La perilla del tinte (`violetAlpha`) SÍ lo gobierna y
  // alcanza, pero su efecto es INVISIBLE — probado en dispositivo, no
  // deducido. (c) Quedan las dos caras: `tapizDarkOficio` un paso más
  // oscuro (#0B1213 → par 4.54; 19 pares mejoran, ninguno pasa a
  // reprobar) que toca un valor atado a "un tinte por casa", y la tanda
  // de los textos de capa del oscuro, que es cara y con gate propio.
  //
  // ⚠️ SE QUEDA VISIBLE EN CADA CORRIDA A PROPÓSITO: un número bajo
  // mínimo que nadie percibe SIGUE SIENDO un número bajo mínimo. Que el
  // founder no vea el tinte es dato sobre la CURA, no sobre el defecto —
  // el texto de capa sobre su tinte mide 4.40 contra un piso AA de 4.5, y
  // quien lo lea con menos vista que él lo va a sufrir igual. Qué hacer
  // con eso es decisión suya; esconderlo no es una de las opciones.
  'darkOficio·texto·capaText.comunidadAmplia/capaBg.comunidadAmplia',
  // ═══ S83-B30 · HEREDADAS DEL CLIENTE, que el barrido nuevo hizo
  // visibles pero NO nacieron hoy:
  // · el ORO contra papel (1.55) es EXENCIÓN FIRMADA — E1 lo midió y el
  //   founder firmó igual, compensando con `ctaElevado`. Su lugar sería
  //   EXENTAS, pero se deja acá con su nota hasta que la mesa lo mueva:
  //   moverlo yo sería firmar una exención que no firmé.
  'light·fill·accent.cta/bg.base',
  'light·fill·accent.cta/bg.card',
  // · los tres del oscuro del cliente, ya conocidos por r19/r20 (abajo).
  'darkOficio·canto·accent.controlLleno/bg.card',
  // S82-B r19 — LOS DOS PARES DE SUPERFICIE DEL OSCURO, con el hallazgo
  // que los pone acá y no en una cura: subir bg.card ROMPE los textos que
  // van encima. Medido: a 1.26 caen SEIS pares AA firmados (capaText
  // comunidadAmplia y comunidad, dangerText sobre su tinte, dos avatares
  // de iniciales, el tonal de Ley 22) y a 1.11 todavía caen DOS. El techo
  // no lo pone el gusto: lo pone el texto de capa del oscuro. Subir la
  // superficie exige subir ANTES violetText/pinkDark y re-medir los 178
  // — es una tanda propia con su gate, no un token. Revertido a 1.05.
  //
  // S82-B r20 — EL OTRO LADO DEL PAR TAMBIÉN CERRADO, por una razón
  // DISTINTA: bajar `bg.base` con card quieto NO rompe nada (los seis
  // pares eran texto sobre SUPERFICIE; los que tocan el FONDO ganan —
  // text.primary 17.73→18.29 · secondary 8.49→8.76 · capaText
  // 13.23→13.65) pero **NO ALCANZA**: con card en #0D0D12 y el fondo en
  // NEGRO ABSOLUTO el par llega a **1.083**, y de #050508 a #000000 sube
  // apenas 0.033. EL PORQUÉ: el +0.05 de la fórmula WCAG DOMINA cuando
  // las dos luminancias son ~0 (card L=0.00417, base L=0.00158) — el
  // contraste SE APLANA en el extremo oscuro. No falta margen: NO HAY
  // margen por debajo, y el tema perdería su "bosque nocturno" a cambio
  // de 0.03. ⇒ LOS DOS LADOS MEDIDOS Y CERRADOS; la decisión es del
  // founder: (a) abrir la tanda de los textos de capa del oscuro, o
  // (b) que el oscuro separe por otro canal — borde NO (A6/Ley 20).
  // S82-B r29 — RE-DECLARADOS, NO RETIRADOS (tu punto 5). Con (c) SIN
  // TARJETA firmado, `card` deja de ser "la tarjeta del contenido" —
  // pero NO deja de existir: sigue siendo la superficie de LO QUE
  // FLOTA (Hojas, modales, la barra fija del CTA), y eso es el PISO que
  // no puede desaparecer. Así que el par sigue midiendo algo real; lo
  // que cambió es QUÉ mide. Quedan en baseline con el mismo número y
  // otro significado, y su cura sigue siendo la misma tanda cara.
  'dark·superficie·bg.card/bg.base',
  'dark·superficie·bg.elevated/bg.base',
  // VACÍO desde S82-B r5 (solo-baja EJECUTADO): los 5 del censo del
  // estreno CURARON por orden founder — capa.identidad/cuidado del tema
  // CLARO bajaron al primer escalón oscuro de su rampa (verdeVitalDark ·
  // tealDark) y dangerText ganó su paso (coralDarkTexto). La reversa
  // vive en themes/light.ts (una línea). De vacío no se sube jamás.
]);
/** Las que están en baseline por REGRESIÓN de S83-B25 (el tapiz al 8%),
 *  no por herencia: se cuentan aparte para que el info no las disfrace de
 *  "baseline-founder". Un número que mezcla lo decidido con lo que hay que
 *  decidir esconde justo lo que hay que mirar. */
/** LA REGRESIÓN DEL TAPIZ — QUEDA UNA, Y VOLVIÓ POR FIRMA.
 *  Nacieron CUATRO en S83-B30 (el tapiz al 8%, firmado, cazadas media
 *  hora después del commit). El founder bajó a 5% ("al 8% es muy pesado",
 *  en dispositivo) y eso curó DOS SOLO, sin tocar un token de texto — la
 *  contracara exacta de la causa: los tintes son alpha sobre `bg.base`,
 *  así que oscurecer el fondo oscurece el tinte y el texto claro recupera
 *  contraste. La tercera (el CTA) cayó en B31.
 *
 *  LA CUARTA resistió a las dos bajadas de tapiz porque cuelga de OTRO
 *  fondo: `tapizDarkOficio`, el del prestador. S85-B4 la curó por el
 *  TINTE (`violetAlpha15` → .12) y el founder REVIRTIÓ esa cura en
 *  dispositivo: «el tinte verde no se ve o no se percibe, ni en claro ni
 *  en oscuro». Así que vuelve a estar abierta, y con una información que
 *  antes no existía: **la perilla del tinte alcanza pero es invisible**,
 *  medido en pantalla y no deducido.
 *
 *  ⚠️ Se cuenta APARTE de `BASELINE_R12` a propósito: `EXENTAS` es lo que
 *  la casa decidió y `BASELINE` lo heredado; esto es LO QUE HAY QUE
 *  DECIDIR, y un número que mezcla las tres esconde justo lo que hay que
 *  mirar. */
const REGRESION_B25 = new Set([
  'darkOficio·texto·capaText.comunidadAmplia/capaBg.comunidadAmplia',
]);
function r12(pares) {
  const fallos = [];
  let exentas = 0, enBaseline = 0, bajaron = 0, regresion = 0;
  for (const p of pares) {
    const clave = `${p.tema}·${p.clase}·${p.nombre}`;
    if (p.ratio >= p.minimo) {
      if (BASELINE_R12.has(clave)) bajaron++;
      continue;
    }
    if (EXENTAS_R12.has(clave)) { exentas++; continue; }
    if (REGRESION_B25.has(clave)) { regresion++; continue; }
    if (BASELINE_R12.has(clave)) { enBaseline++; continue; }
    fallos.push(`R12: ${clave} = ${p.ratio.toFixed(2)} (mín ${p.minimo}) — par bajo mínimo FUERA de baseline/exentas`);
  }
  return {
    fallos,
    info:
      `pares=${pares.length} · exentas-firmadas=${exentas} · baseline=${enBaseline}` +
      (regresion > 0
        ? ` · ⚠️ ${regresion} REGRESIÓN ABIERTA del tapiz 8% (S83-B25) — espera decisión del founder, NO es baseline`
        : '') +
      (bajaron > 0 ? ` · ${bajaron} BAJARON: actualizar baseline` : ''),
  };
}
/**
 * ⭐ S90-B · EL RESOLVEDOR DEL RUNNER — la cura de un modo de falla que NO
 * es del lint sino de su ARRANQUE.
 *
 * EL CASO, medido por la pista D en esta misma sesión: `pnpm exec tsx` NO
 * sobrevive a un worktree recién creado —o con `node_modules` prestado—
 * porque `pnpm exec` resuelve el workspace antes de resolver el binario.
 * D quedó **sin R12 ni R15**, que son las dos reglas de CONTRASTE: las
 * únicas que miden accesibilidad.
 *
 * POR QUÉ ERA GRAVE Y NO MOLESTO: el guard hacía lo correcto —salía en
 * ROJO, jamás en verde (L-197)— pero un rojo que solo dice «no pude»
 * **es indistinguible de un rojo que dice «encontré un par malo»** para
 * quien lo lee apurado. Una pista que arranca su worktree se queda sin
 * la medición de contraste y no tiene forma barata de saber por qué.
 *
 * LA CURA es que el volcador SEPA CORRER, en cascada, con cada intento
 * declarado:
 *   ① el binario de `node_modules/.bin`, resuelto POR RUTA subiendo el
 *      árbol — no le pregunta nada a pnpm, así que el modo de falla de D
 *      no existe acá;
 *   ② `pnpm exec` — el camino histórico, que sigue siendo el bueno
 *      cuando el workspace está sano;
 *   ③ `npx --no-install` — la última red, sin bajar nada de la red.
 *
 * Y SI LAS TRES CAEN, el mensaje dice LAS TRES con su error. *Todo freno
 * declara CONTRA QUÉ MIDIÓ* — un «no pude» sin el qué-intenté manda a la
 * siguiente pista a re-descubrir lo mismo.
 */
const RAIZ_REPO = resolve(dirname(new URL(import.meta.url).pathname), '..');

/** Busca un binario de `node_modules/.bin` subiendo desde `desde`. */
function binDeNodeModules(nombre, desde) {
  let dir = desde;
  for (let i = 0; i < 8; i++) {
    const p = join(dir, 'node_modules', '.bin', nombre);
    if (existsSync(p)) return p;
    const padre = dirname(dir);
    if (padre === dir) break;
    dir = padre;
  }
  return null;
}

/** El volcador corre UNA vez por invocación; si cae, R12 y R15 fallan
 *  fuerte. Desde r6 emite { pares, tokens } (los tokens para R15). */
function volcadorReal() {
  const GUION = 'scripts/verify-diseno-pares.ts';
  const binLocal = binDeNodeModules('tsx', RAIZ_REPO);
  const intentos = [
    binLocal ? { como: '.bin/tsx (por ruta)', cmd: `"${binLocal}" ${GUION}` } : null,
    { como: 'pnpm exec', cmd: `pnpm exec tsx ${GUION}` },
    { como: 'npx --no-install', cmd: `npx --no-install tsx ${GUION}` },
  ].filter(Boolean);

  const fallidos = [];
  for (const intento of intentos) {
    try {
      const out = execSync(intento.cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: RAIZ_REPO,
      });
      const dump = JSON.parse(out);
      if (!Array.isArray(dump?.pares) || dump.pares.length === 0) throw new Error('volcador sin pares');
      if (!Array.isArray(dump?.tokens) || dump.tokens.length === 0) throw new Error('volcador sin tokens');
      return { ...dump, via: intento.como };
    } catch (e) {
      fallidos.push(`${intento.como}: ${String(e.message ?? e).slice(0, 70)}`);
    }
  }
  return { caido: fallidos.join(' · ') };
}

/** R15 · LA EXCLUSIÓN DE A5 (§9bis.3 FIRMADA, S82-B r6 — orden founder):
 *  ningún token del tema del CLIENTE resuelve a #0F5E56 ni a su familia.
 *  La letra define la familia por ejemplar y por porqué ("es barro, no
 *  está en la marca, y colisiona con el acento firmado del prestador");
 *  el lint necesita números — OPERACIONALIZACIÓN DECLARADA de B
 *  (ajustable en mesa, jamás ley nueva): familia = matiz a ±12° de
 *  #0F5E56 (H≈174°) · saturación ≥30% · luminosidad ≤35% (el carácter
 *  oscuro-apagado). Verificada contra los ejemplares: #0F5E56 ✓ dentro ·
 *  tealDark #0A7268 ✓ dentro (ES el acento del prestador — la colisión
 *  literal) · tealDarkNoche ✓ dentro · teal vivo #28E8DA fuera (L 53%,
 *  está en la marca) · verdeVitalDark fuera (H 133°).
 *  Alcance: valores OPACOS (hex/rgb); los tints con alpha se CUENTAN
 *  como info (un rgba .25 de familia compositado no es barro — su
 *  destino es de mesa, no de este lint).
 *  EL CENSO DEL ESTRENO (29-jul): 8 tokens del tema claro resuelven a
 *  familia HOY — 1 de r5 (capa.cuidado, con sus opciones a/b en el
 *  reporte r6) y 7 PRE-EXISTENTES a r5 que nadie censó contra A5 desde
 *  su firma (accent.primary · capaText.cuidado · status.infoText · los
 *  5 de servicios) — TODOS a PENDIENTES nominales, arbitraje founder;
 *  solo-baja: el que sale no vuelve, y todo token NUEVO en familia es
 *  rojo. R12 pasó verde mientras esto se rompía porque mide RATIOS, no
 *  identidades — por eso esta regla existe aparte. */
const H_FAMILIA = 174.2, TOL_H = 12, MIN_S = 0.30, MAX_L = 0.35;
const PENDIENTES_R15 = new Set([
  'light·capa.cuidado',              // r5 — opciones (a)/(b) en el reporte r6
  'light·capaText.cuidado',          // pre-r5 (registro AA vivo desde S53)
  'light·accent.primary',            // pre-r5
  'light·status.infoText',           // pre-r5
  'light·services.vet',              // pre-r5
  'light·services.grooming',         // pre-r5
  'light·services.walking',          // pre-r5
  'light·services.boarding',         // pre-r5
  'light·services.store',            // pre-r5
  // pre-r5 Y EL MÁS GRANDE del censo: la COLA del gradiente firma UI
  // claro (firmaUILight stop 3) ES tealDark — la familia adentro del
  // gradiente de MARCA del cliente (el Boton marca de bienvenida).
  'light·accent.gradient.colors[2]',
]);
function hslDe(valor) {
  let r, g, b;
  const hex = valor.match(/^#([0-9a-fA-F]{6})$/);
  const rgb = valor.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)$/);
  if (hex) { r = parseInt(hex[1].slice(0, 2), 16); g = parseInt(hex[1].slice(2, 4), 16); b = parseInt(hex[1].slice(4, 6), 16); }
  else if (rgb) {
    if (rgb[4] !== undefined && +rgb[4] < 1) return { alpha: true };
    r = +rgb[1]; g = +rgb[2]; b = +rgb[3];
  } else return null;
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return { h: 0, s: 0, l };
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = 60 * (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4);
  return { h, s, l };
}
const esFamilia = (c) => c && !c.alpha && Math.abs(c.h - H_FAMILIA) <= TOL_H && c.s >= MIN_S && c.l <= MAX_L;
function r15(tokens) {
  const fallos = [];
  let pendientes = 0, tintsAlpha = 0, bajaron = PENDIENTES_R15.size;
  for (const t of tokens) {
    const c = hslDe(t.valor);
    if (c?.alpha) {
      // tint con alpha: si su base es familia, se cuenta como info
      const base = hslDe(t.valor.replace(/,\s*[\d.]+\)$/, ')').replace('rgba', 'rgb'));
      if (esFamilia(base)) tintsAlpha++;
      continue;
    }
    if (!esFamilia(c)) continue;
    const clave = `${t.tema}·${t.ruta}`;
    if (PENDIENTES_R15.has(clave)) { pendientes++; continue; }
    fallos.push(`R15: ${clave} = ${t.valor} — familia de #0F5E56 en el tema del cliente (A5 §9bis.3 FIRMADA)`);
  }
  bajaron -= pendientes;
  return {
    fallos,
    info: `pendientes-arbitraje=${pendientes}/${PENDIENTES_R15.size} · tints-alpha-familia(info)=${tintsAlpha}${bajaron > 0 ? ` · ${bajaron} BAJARON: actualizar pendientes` : ''}`,
  };
}

/** R13 · CONTROL CONTORNEADO (S82-B r4, orden founder — A6 SIN CAJA
 *  firmada, lado cliente): borderWidth sobre un tocable ARTESANAL
 *  (Pressable/Touchable*) = rojo — se rellena o va sin caja.
 *  ALCANCE DECLARADO, con sus tres bordes:
 *  (a) apps/cliente SOLO — A6 rige lado cliente por su propia letra
 *      (§9bis: "la dosis del prestador no se toca"), y en el prestador
 *      la gramática está/espera S78 FIRMADA usa contorno para "lo que
 *      espera" (medido hoy igual: prestador 0 contorneados inline).
 *  (b) El contorno FIRMADO de packages/ui queda FUERA de este scan y su
 *      destino es de MESA, no de este lint: Boton secundario/compacto
 *      (22c letra viva; la ANCHA es D-483), SelectorOpcion seFija (7bis
 *      FIRMADA: "se contornea lo que SE FIJA") y Campo (cola ⚖️). El
 *      choque entre el eslogan de la orden ("nunca contorno") y esas
 *      letras firmadas queda DECLARADO en el reporte r4 — esta regla
 *      caza lo ARTESANAL en pantallas, que es donde A6 no tiene juez.
 *  (c) Solo estilos INLINE en el tag (un StyleSheet con nombre escapa
 *      al scan — limitación declarada; hoy: cero casos, medido).
 *  Censo del estreno: UN contorneado en todo el monorepo — el
 *  FiltroVida de C (hogar/index:306, lote esperando SU gate) → baseline
 *  NOMINAL por archivo, dueño C: se rellena o pierde la caja en el
 *  gate. Solo baja. */
// VACÍO desde S82-B r5 (solo-baja EJECUTADO por la cura de C en su r4:
// el FiltroVida perdió el contorno en el gate — "reposo SIN CAJA...
// NUNCA contorno", convergencia con esta regla). DURA EN 0 desde acá.
const BASELINE_R13 = {};
function finDeTagJsx(src, i) {
  let d = 0;
  for (let j = i; j < src.length && j < i + 4000; j++) {
    const c = src[j];
    if (c === '{') d++;
    else if (c === '}') d--;
    else if (c === '>' && d === 0) return j;
  }
  return Math.min(i + 4000, src.length);
}
function r13(archivos) {
  const fallos = [];
  let total = 0;
  const sumaBaseline = Object.values(BASELINE_R13).reduce((a, b) => a + b, 0);
  for (const { path, src } of archivos) {
    if (!/apps\/cliente\//.test(path) && path !== '(fixture)') continue;
    let enArchivo = 0;
    for (const m of src.matchAll(/<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback)\b/g)) {
      const tag = src.slice(m.index, finDeTagJsx(src, m.index));
      if (/borderWidth/.test(tag)) {
        enArchivo++;
        if (enArchivo > (BASELINE_R13[path] ?? 0))
          fallos.push(`${path}:${lineaDe(src, m.index)} — control CONTORNEADO (<${m[1]}> con borderWidth, A6): se rellena o va sin caja`);
      }
    }
    total += enArchivo;
  }
  // S85-B1 · EL INFO ANUNCIABA COMO PENDIENTE UN TRABAJO CERRADO. Con el
  // baseline ya vacío desde S82-B r5, seguía imprimiendo en cada corrida
  // "(baseline nominal: FiltroVida de C — se resuelve en su gate)": nombraba
  // trabajo abierto que estaba curado Y se lo atribuía a otra pista. Es la
  // clase de dato que no se descubre chocando —nadie verifica por qué algo
  // NO se hizo—, así que el info dice el estado real y el histórico queda
  // arriba, en la nota del baseline, que es donde se lee al decidir.
  const nota = sumaBaseline === 0 ? 'DURA EN 0 desde S82-B r5' : `baseline ${sumaBaseline}`;
  return { fallos, info: `${total} contorneados (${nota})${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R14 · LA TARJETA NO TAPA EL SALUDO (S82-C r4, defecto 2 del gate
 *  mecanizado): la tarjeta de recomendaciones solapa la banda SOLO
 *  dentro del respiro que el techo deja al pie — SOLAPE_RECO tiene que
 *  ser ESTRICTAMENTE MENOR que RESPIRO_BANDA en hogar/index. Las
 *  constantes se leen del fuente (spacing[K]); si desaparecen o dejan
 *  de ser spacing-token, la regla FALLA (el silencio no verifica,
 *  L-192). Tabla de spacing espejada del token (estable desde v3.1). */
const SPACING_R14 = { 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 14: 56, 16: 64 };
function r14(archivos) {
  const hogar = archivos.find((a) => /hogar\/index\.tsx$/.test(a.path));
  if (!hogar) return { fallos: ['R14: hogar/index.tsx no encontrado — sin fuente no hay verificación'], info: 'SIN FUENTE' };
  const respiro = hogar.src.match(/RESPIRO_BANDA = spacing\[(\d+)\]/);
  const solape = hogar.src.match(/SOLAPE_RECO = spacing\[(\d+)\]/);
  if (!respiro || !solape)
    return { fallos: ['R14: RESPIRO_BANDA/SOLAPE_RECO no encontrados en hogar/index — la relación no se puede verificar (L-192)'], info: 'CONSTANTES AUSENTES' };
  const r = SPACING_R14[Number(respiro[1])];
  const s = SPACING_R14[Number(solape[1])];
  if (r === undefined || s === undefined)
    return { fallos: [`R14: spacing[${respiro[1]}]/spacing[${solape[1]}] fuera de la tabla espejada — ensanchar SPACING_R14`], info: 'TOKEN DESCONOCIDO' };
  const fallos = s >= r
    ? [`hogar/index — SOLAPE_RECO (${s}) ≥ RESPIRO_BANDA (${r}): la tarjeta TAPA el saludo/nombres del techo (defecto 2 del gate r4)`]
    : [];
  return { fallos, info: `solape=${s} < respiro=${r}` };
}

/** R16 · EL GUARD DEL PAPEL TAPIZ (S82-B r9 — mecaniza la promesa de los
 *  puntos 4 y 5 de la orden: "el prestador NO recibe tinte" y "la
 *  separación se construye con el valor firmado"). El modo de fallo que
 *  cierra es EL SILENCIO: el día que alguien encienda `papelTapiz` con
 *  el valor firmado, el prestador se tiñe SOLO —comparte `lightTheme`—
 *  y nadie lo nota hasta un gate. Entonces: **si `papelTapiz !==
 *  light0` (tinte ENCENDIDO), el tema del prestador (`lightOficio`)
 *  TIENE que pisar `bg.base` a `light0`**. Hoy pasa en verde por el
 *  apagado (papelTapiz === light0) — y cuando el color llegue, el lint
 *  exige su separación en el MISMO acto. Patrón del guard de la vitrina
 *  (S78): el orden nombra el artefacto que abre.
 *
 *  ENSANCHADA S83-B3 — LA MITAD OSCURA (orden founder: "R16 ve la mitad
 *  oscura"). El defecto era de la propia regla y es el que ella existe
 *  para cerrar, un tema más allá: vigilaba `lightOficio` y **nada miraba
 *  `darkOficio`**, así que borrar la línea del tapiz oscuro dejaba al
 *  prestador heredando el tinte MAGENTA del cliente con el lint EN VERDE.
 *  Cobró dos veces el 31-jul: dos lecturas distintas salieron de consultar
 *  una regla que veía medio mundo.
 *
 *  LA SIMETRÍA NO ES LITERAL, y ahí está el cuidado: en CLARO el prestador
 *  se separa QUEDÁNDOSE en el papel neutro (`light0`); en OSCURO se separa
 *  TENIENDO EL SUYO (`tapizDarkOficio`, el verde de su oficio) — "un tinte
 *  por casa, misma gramática" (r29, enmienda del founder). Por eso la
 *  mitad oscura no exige el neutro: exige SU token, y un `darkOficio` que
 *  pisara `bg.base` a `tapizDark` (el del cliente) sale ROJO igual.
 *
 *  TERCER BRAZO, no pedido pero del mismo silencio: si los dos tapices
 *  apuntaran al MISMO hex, la separación sería de nombre y no de color —
 *  verde de lint, una sola casa en pantalla. La letra dice "un tinte por
 *  casa"; el brazo la hace exigible.
 *
 *  ☠️ CONDICIÓN DE MUERTE: esta regla existe porque los temas de oficio se
 *  arman por SPREAD (`...darkTheme`) y heredan en silencio lo que no pisan
 *  — un olvido no rompe nada, y ese es el modo de falla. **Muere el día
 *  que `bg.base` de los temas de oficio deje de venir por herencia y pase
 *  a ser obligación de TIPO** (que el tsc se ponga rojo si falta), porque
 *  ahí el compilador cubre lo que hoy cubre el lint. **La retira la sesión
 *  que haga ese cambio estructural, y con el mismo criterio que rige acá:
 *  produciendo primero el rojo del tsc y recién entonces borrando la
 *  regla** — jamás al revés. Si en cambio el founder revirtiera "un tinte
 *  por casa", la regla no muere: cambia de letra (cae el tercer brazo). */
function r16(fuentes) {
  const pal = fuentes.palette ?? '';
  const temas = fuentes.temas ?? '';
  const hex = (nombre) => pal.match(new RegExp(`\\b${nombre}:\\s*'(#[0-9A-Fa-f]{6})'`));
  const luz = hex('light0');
  const tapiz = hex('papelTapiz');
  const oscuro = hex('dark0');
  const tapizD = hex('tapizDark');
  const tapizDO = hex('tapizDarkOficio');
  const papelOf = hex('papelTapizOficio');
  if (!luz || !tapiz || !oscuro || !tapizD || !tapizDO || !papelOf)
    return {
      fallos: ['R16: no se pudo leer light0/papelTapiz/papelTapizOficio/dark0/tapizDark/tapizDarkOficio de palette.ts — sin los valores no hay verificación (L-192)'],
      info: 'SIN FUENTE',
    };
  const igual = (a, b) => a[1].toUpperCase() === b[1].toUpperCase();
  const fallos = [];

  // ── MITAD CLARA: el prestador tiene EL SUYO ──
  // S83-B33 — LA LETRA CAMBIÓ Y LA REGLA CON ELLA. Hasta hoy esta mitad
  // exigía que lightOficio se quedara en el papel NEUTRO (`light0`),
  // porque S82 firmó "el prestador NO recibe tinte, es fondo del
  // cliente". El founder ENMENDÓ esa letra en S83: un tinte por casa en
  // LOS DOS temas. Así que ahora la regla es SIMÉTRICA con la oscura —
  // el prestador se separa TENIENDO EL SUYO, no quedándose en el neutro.
  const papelOficio = hex('papelTapizOficio');
  const encendido = !igual(luz, tapiz);
  const separado = /const lightOficio[\s\S]*?\bbg:\s*\{[^}]*\bbase:\s*palette\.papelTapizOficio/.test(temas);
  if (encendido && !separado)
    fallos.push(`R16: papelTapiz (${tapiz[1]}) está ENCENDIDO y lightOficio NO pisa bg.base a papelTapizOficio — el prestador estaría recibiendo el tinte MAGENTA del cliente en claro (S83-B33: un tinte por casa en los DOS temas)`);
  if (papelOficio && encendido && separado && igual(tapiz, papelOficio))
    fallos.push(`R16: papelTapiz y papelTapizOficio son el MISMO hex (${tapiz[1]}) — la separación es de nombre y no de color, en claro`);

  // ── MITAD OSCURA: el prestador se separa TENIENDO EL SUYO ──
  const encendidoOsc = !igual(oscuro, tapizD);
  const separadoOsc = /const darkOficio[\s\S]*?\bbg:\s*\{[^}]*\bbase:\s*palette\.tapizDarkOficio/.test(temas);
  if (encendidoOsc && !separadoOsc)
    fallos.push(`R16: tapizDark (${tapizD[1]}) está ENCENDIDO y darkOficio NO pisa bg.base a tapizDarkOficio — el prestador estaría recibiendo el tinte MAGENTA del cliente en oscuro (S82-B r29: un tinte por casa)`);
  if (encendidoOsc && separadoOsc && igual(tapizD, tapizDO))
    fallos.push(`R16: tapizDark y tapizDarkOficio son el MISMO hex (${tapizD[1]}) — la separación es de nombre y no de color: las dos casas se verían iguales (S82-B r29)`);

  const claro = `claro[tapiz=${encendido ? 'ENCENDIDO ' + tapiz[1] : 'apagado (=light0)'} · separación=${separado ? 'construida ' + (papelOficio ? papelOficio[1] : '') : 'no construida'}]`;
  const osc = `oscuro[tapiz=${encendidoOsc ? 'ENCENDIDO ' + tapizD[1] : 'apagado (=dark0)'} · separación=${separadoOsc ? 'construida ' + tapizDO[1] : 'no construida'}]`;
  return { fallos, info: `${claro} · ${osc}` };
}
const FUENTES_R16 = {
  palette: readFileSync('packages/ui/src/tokens/palette.ts', 'utf8'),
  temas: readFileSync('packages/ui/src/themes/index.ts', 'utf8'),
};


/* ☠️ R26 SE RETIRÓ EN S83-B17, Y LA RETIRÓ SU PROPIO ROJO.
 *  Vigilaba que `accent.control` del oficio fuera tealDark en LAS DOS
 *  casas. Cuando B17 le dio sus dos registros —teal puro en oscuro, por
 *  la misma medición que movió `accent.active`— R26 se puso ROJA contra
 *  el código correcto: su premisa ("un solo valor para las dos casas")
 *  había dejado de ser cierta.
 *
 *  NO SE PARCHEÓ, SE RETIRÓ: R27 ya vigila `control` en las dos casas Y
 *  ADEMÁS su registro, así que mantener las dos era tener dos reglas para
 *  la misma física — la copia que L-175 prohíbe, un piso más arriba. Un
 *  guard que sobrevive a su propia razón es basura que nadie se anima a
 *  tocar (precedente: R19 en S82-C r38, R21 en r30).
 *
 *  Y LO QUE DEJA COMO EVIDENCIA: el guard atrapó el cambio de quien lo
 *  escribió, el mismo día. Eso es lo que un guard tiene que hacer. */

/** R27 · EL PINK NO ENTRA AL PRESTADOR POR LA PUERTA DEL ESTADO ACTIVO
 *  (S83-B13). Hermana exacta de R26 y por la misma física: los temas de
 *  oficio se arman por SPREAD, así que quitar el override de
 *  `accent.active` no rompe nada, el tsc no lo ve —el campo existe igual,
 *  heredado— y el prestador vuelve a enfocar en MAGENTA sin que nadie se
 *  entere. Guard por AUSENCIA de la línea, no por presencia de un hex.
 *
 *  Y VIGILA ALGO MÁS QUE R26: aquí los dos brazos esperan valores
 *  DISTINTOS —tealDark en claro, teal PURO en oscuro—, porque el focus es
 *  gráfica y ninguno solo pasa en los dos temas (medido: puro REPRUEBA en
 *  claro con 1.46; tealDark en oscuro pasa con margen 0.37 y no ilumina).
 *  Un guard que aceptara cualquiera de los dos en cualquier tema dejaría
 *  pasar justo el error que la medición encontró.
 *
 *  ☠️ CONDICIÓN DE MUERTE: la misma de R16 (R26 ya se retiró) — muere el día que los
 *  slots dejen de resolverse por herencia y pasen a obligación de TIPO
 *  (tsc rojo si falta). La retira la sesión que haga ese cambio,
 *  produciendo primero el rojo del tsc y recién después borrando la
 *  regla. Si el founder cambiara el verde, la regla no muere: cambia de
 *  valor esperado. */
function r27(fuentes) {
  const temas = fuentes.temas ?? '';
  const fallos = [];
  // S83-B17: `control` recibió el MISMO tratamiento que `active` (misma
  // medición: tealDark rinde 3.37 en oscuro, margen 0.37). La regla se
  // ENSANCHA a los dos slots en vez de nacer una R28 gemela — dos reglas
  // para la misma física es la copia que L-175 prohíbe, un piso arriba.
  // 🔴 S98-B — CUARTO SLOT: `controlBg`, el TINTE de la elección (D-813).
  // Entra por la MISMA física y por eso ensancha la regla en vez de nacer
  // una gemela (L-175): los temas de oficio se arman por spread, así que
  // un slot que no se pisa se HEREDA MAGENTA en silencio y ni el tsc ni
  // el ojo lo ven —el campo existe igual—.
  //
  // ⚠️ Y ÉSTE ERA EL CASO REAL, no el hipotético: `control` estaba pisado
  // desde S83 y el tinte NO, así que el prestador elegía con **borde teal
  // y relleno magenta**. Vivió invisible porque la pieza nació en el
  // CLIENTE, donde las dos familias coinciden. *Un guard que vigila el
  // borde y no su relleno vigila media señal.*
  //
  // Los valores esperados son los TINTES de cuidado que la casa ya tiene
  // medidos (no colores nuevos): `tealAlpha16` en claro · `tealAlpha15`
  // en oscuro — cada tema con su alfa, igual que sus hermanos tienen cada
  // uno su registro.
  const ESPERADO = {
    lightOficio: { control: 'tealDark', controlBg: 'tealAlpha16', active: 'tealDark', marcaEleccion: 'tealDark' },
    darkOficio: { control: 'teal', controlBg: 'tealAlpha15', active: 'teal', marcaEleccion: 'teal' },
  };
  for (const [casa, slots] of Object.entries(ESPERADO)) {
    const bloque = new RegExp(`const ${casa}[\\s\\S]*?\\n\\}`).exec(temas)?.[0] ?? '';
    if (!bloque) {
      fallos.push(`R27: no se encontró ${casa} en themes/index.ts — sin la fuente no hay verificación (L-192)`);
      continue;
    }
    for (const [slot, token] of Object.entries(slots)) {
      const m = new RegExp(`\\baccent:\\s*\\{[^}]*\\b${slot}:\\s*palette\\.(\\w+)`).exec(bloque);
      if (!m)
        fallos.push(`R27: ${casa} NO pisa accent.${slot} — el prestador lo heredaría MAGENTA (§15b.1 + firma founder S83: el estado y la elección del prestador van en verde)`);
      else if (m[1] !== token)
        fallos.push(`R27: ${casa} pisa accent.${slot} a palette.${m[1]} y se esperaba palette.${token} — es GRÁFICA y necesita sus DOS registros (el puro reprueba en claro: 1.46 · tealDark en oscuro pasa por poco: 3.37)`);
    }
  }
  return { fallos, info: fallos.length === 0 ? 'estado, elección y PATA del oficio: tealDark en claro · teal puro en oscuro' : `${fallos.length} fallo(s)` };
}
const FUENTES_R27 = { temas: readFileSync('packages/ui/src/themes/index.ts', 'utf8') };
const FUENTES_R43 = { palette: readFileSync('packages/ui/src/tokens/palette.ts', 'utf8') };
/** R44 · los SEIS diccionarios de la casa (las dos apps + `ui`). El
 *  corpus `DICCIONARIOS` de arriba trae solo los del cliente y N12.4
 *  dice «en toda la casa», así que R44 arma el suyo — y su ancla exige
 *  los seis: si uno se cae del corpus, la regla dejaría de mirar esa
 *  casa en silencio. */
const CORPUS_R44 = [
  'apps/cliente/src/i18n/es.ts', 'apps/cliente/src/i18n/en.ts',
  'apps/prestador/src/i18n/es.ts', 'apps/prestador/src/i18n/en.ts',
  'packages/ui/src/i18n/es.ts', 'packages/ui/src/i18n/en.ts',
  ...archivosCodigo('packages/api/src'),
].map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));


/** R29 · `sinPie` NO VIAJA SOLO (S83-B1). La enmienda de la letra de
 *  `Campo` dice que la protección contra el layout shift **no se retira,
 *  sube un nivel**: el hijo deja de reservar el pie y lo monta el CONTROL
 *  COMPUESTO, para todos sus hijos. Si el compuesto no lo monta, la
 *  protección no subió: se perdió.
 *
 *  Y SE PIERDE EN SILENCIO, que es lo que la hace regla y no comentario:
 *  con `sinPie` el `Campo` sigue pintando su borde de error —eso no se
 *  delega— pero deja de renderizar el texto. El resultado es un borde
 *  rojo sin una palabra que lo explique: la pantalla parece funcionar, el
 *  tsc está verde, y el usuario no sabe qué corregir. Una verificación
 *  cuyo modo de falla es el silencio no es una verificación (L-192).
 *
 *  ALCANCE HONESTO, declarado para que nadie la lea como más fuerte de lo
 *  que es: verifica que las dos piezas VIVAN EN EL MISMO ARCHIVO, no que
 *  el pie reciba el MISMO `ayuda`/`error` que el campo. Es un piso, no una
 *  prueba — y cubre el modo de falla real, que es olvidarse del pie
 *  entero, no pasarle el mensaje equivocado.
 *
 *  ☠️ CONDICIÓN DE MUERTE: el día que ningún archivo de `apps/` use
 *  `sinPie` (el compuesto se retiró o `Campo` cambió de anatomía), la
 *  regla no tiene nada que vigilar y se retira con lápida. La retira quien
 *  mida cero usos, no quien la encuentre molesta. */
function r29(archivos) {
  const fallos = [];
  let compuestos = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    if (!/\bsinPie\b/.test(limpio)) continue;
    compuestos++;
    if (!/\bPieDeCampo\b/.test(limpio)) {
      fallos.push(
        `${path} usa \`sinPie\` y NO monta PieDeCampo — el borde de error queda SIN su mensaje: el control compuesto tiene que montar el pie de sus hijos (S83-B1, L-192)`,
      );
    }
  }
  return { fallos, info: `${compuestos} control(es) compuesto(s) con sinPie · ${fallos.length} sin su pie` };
}

/** R17 · LA GALERÍA NO ENVEJECE (S82-B r16, orden founder: "toda pieza
 *  exportada desde packages/ui tiene que aparecer en la galería. Una
 *  exportación nueva sin entrada = rojo"). El modo de fallo es el que YA
 *  ocurrió, y por eso existe: la galería se quedó atrás de S81 y S82 sin
 *  que nada lo dijera — lo vio el founder, no el sistema.
 *
 *  EXENTOS DECLARADOS — no es pereza: son piezas que NO SE PUEDEN MOSTRAR
 *  SIN CLONARLAS, y la regla dura de la orden manda declarar y no montar
 *  ("una galería que muestra un botón que no es EL botón hace firmar algo
 *  que no corre"):
 *   · `usePresionado` — HOOK de física: mostrarlo exige construir un
 *     tocable de ejemplo, o sea CLONAR el gesto. Se ve APLICADO en
 *     Boton/Tarjeta/Celda, que sí están.
 *   · `useTraduccionUi` · `recursosUi` — riel de idioma: no tienen forma.
 *   · `useAviso` · `AvisoProvider` — el Aviso se ve por su DISPARO (la
 *     galería lo dispara); el hook en sí no se dibuja.
 *   · `ThemeProvider` · `useTheme` — la galería ENTERA es su demostración.
 *   · `EvidenciaFotoCapturar` — abre la CÁMARA al tocarse: montarlo
 *     dispararía permisos del sistema dentro de una herramienta de
 *     verificación. Su hermano Thumbnail (presentacional) sí se monta.
 *  El resto es baseline NOMINAL solo-baja: la pieza que gana su entrada
 *  sale de la lista y no vuelve; toda exportación NUEVA es roja desde el
 *  primer día. */
const EXENTOS_R17 = new Set([
  'usePresionado', 'useTraduccionUi', 'recursosUi', 'useAviso', 'AvisoProvider',
  'ThemeProvider', 'useTheme', 'EvidenciaFotoCapturar',
  // NÚMEROS, no piezas: la anatomía firmada de la pata (S82 r37). Se
  // exportan para que el consumidor CALCULE el aire que la pata invade
  // en vez de estimarlo — mirarlos en una galería no diría nada.
  'PATA', 'MONTA',
  // S83-B1, misma clase: `ALTO_PIE_CAMPO` es el alto exacto que el pie
  // reserva (24.8) — un compuesto lo usa para CALCULAR, no para mirarlo.
  // Se declara aunque hoy el parseo no lo alcance (SCREAMING_CASE no pasa
  // el filtro de identificador): el día que el filtro se ensanche, la
  // declaración ya está y nadie tiene que re-decidir por qué está exento.
  'ALTO_PIE_CAMPO',
  // S91-B · EL TIPEO PREDICTIVO — misma clase que `usePresionado`, y por
  // el mismo criterio literal de esta lista: mostrarlo exige construirle
  // un campo y unos chips de ejemplo, o sea CLONAR la interacción de la
  // bitácora. Y las dos interacciones que lo consumen NO son la misma
  // (la bitácora marca de a muchos; el alta llena un campo con UNA), así
  // que la galería mostraría la de una casa como si fuera la pieza.
  // Su gate es `scripts/verify-sugerencias.ts` — con brazo de REGRESIÓN
  // contra la implementación vieja sobre el vocabulario VIVO.
  //
  // ⚠️ ESTAS CINCO NO SE DISPARAN HOY, y se dice para que nadie las lea
  // como cobertura: el parseo de abajo admite SOLO `PascalCase` y `useX`,
  // así que un nombre camelCase JAMÁS entra al corpus — no está exento,
  // está INVISIBLE. Se declaran igual por el mismo precedente y la misma
  // razón que `ALTO_PIE_CAMPO` (el día que el filtro se ensanche, la
  // decisión ya está tomada y nadie la re-discute). MEDIDO S91-B: hoy son
  // **30 los exports invisibles** de 105 —tokens, temas e infra de
  // captura/archivos, más estas cinco—, y `recursosUi` ya estaba en esta
  // lista siendo invisible SIN decirlo. Ensanchar el filtro encendería
  // 25 preexistentes de una vez: es decisión de mesa, no de esta tanda.
  'sugerir', 'coincidenciasPrimero', 'normalizarVoz', 'palabrasDeBusqueda',
  'puntajeDeCoincidencia',
]);
/** VACÍO desde S82-B r17: las NUEVE ganaron su entrada en la misma
 *  tanda que la regla las enumeró — importadas, jamás reimplementadas.
 *  De vacío no se sube: toda exportación nueva es roja el primer día. */
const SIN_ENTRADA_R17 = new Set([]);
function r17(fuentes) {
  // S83-B1 — LOS COMENTARIOS SE SACAN ANTES DE PARSEAR. El bloque se
  // parte por comas, así que un `//` DENTRO de las llaves se pega al
  // nombre que le sigue y ese nombre deja de parecer identificador:
  // escapaba del gate SIN decir nada, que es el modo de falla que este
  // lint existe para no tener (L-192). Es la misma trampa que L-170 ya
  // había cobrado en un censo de SQL: un censo por texto lee los
  // comentarios como código. Medido al curarlo: escapaba exactamente 1.
  const idx = (fuentes.index ?? '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const gal = fuentes.galeria ?? '';
  const nombres = new Set();
  for (const m of idx.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const parte of m[1].split(',')) {
      const t = parte.trim();
      if (!t || t.startsWith('type ')) continue;
      const n = t.split(/\s+as\s+/)[0].trim();
      if (/^[A-Z][A-Za-z]*$/.test(n) || /^use[A-Z]/.test(n)) nombres.add(n);
    }
  }
  const fallos = [];
  let presentes = 0, exentas = 0, pendientes = 0;
  for (const n of nombres) {
    if (EXENTOS_R17.has(n)) { exentas++; continue; }
    if (new RegExp('<' + n + '[\\s/>.]|\\b' + n + '\\(').test(gal)) { presentes++; continue; }
    if (SIN_ENTRADA_R17.has(n)) { pendientes++; continue; }
    fallos.push(`R17: ${n} se exporta desde packages/ui y NO aparece en la galería — una pieza que nadie puede mirar no se puede firmar`);
  }
  // ANCLA: R17 deriva su corpus del PARSEO de index.ts. Si ese archivo
  // cambia de forma de export (o la galería deja de importar), el parseo
  // devuelve cero nombres y la regla informa "0 pendientes" — verde sin
  // haber mirado una sola pieza. Las dos puntas se anclan: hay nombres
  // que vigilar Y hay al menos uno montado en la galería.
  fallos.push(...ancla('R17', nombres.size, 1, 'export(s) parseados de packages/ui/src/index.ts'));
  fallos.push(...ancla('R17', presentes, 1, 'pieza(s) encontradas en la galería'));
  return {
    fallos,
    info: `exportaciones=${nombres.size} · en-galería=${presentes} · exentas-declaradas=${exentas} · pendientes=${pendientes}/${SIN_ENTRADA_R17.size}`,
  };
}
const FUENTES_R17 = {
  index: readFileSync('packages/ui/src/index.ts', 'utf8'),
  galeria: readFileSync('packages/ui/src/gallery/TokenGallery.tsx', 'utf8'),
};

/** R18 · D-580 ENMENDADA (orden founder S82): LA ENTRADA A LA GALERÍA
 *  EN CUENTA **QUEDA VISIBLE** hasta el gate de producción, y su retiro
 *  exige FIRMA — ninguna sesión la paga por iniciativa propia.
 *
 *  LA POLARIDAD ES EL PUNTO (letra founder): el modo de falla de este
 *  guard es que la entrada **DESAPAREZCA**, jamás que aparezca. Un
 *  guard con la polaridad invertida (vigilar que NO esté) haría el
 *  trabajo de retirarla sin firma, que es exactamente lo que la orden
 *  prohíbe. Por eso vigila DOS cosas y las dos en positivo:
 *    ① la navegación a '/gallery' EXISTE en la Cuenta del cliente
 *    ② y NO está escondida tras `__DEV__` (el gate corre sobre el APK
 *      preview, donde `__DEV__` es false: esconderla ahí la mata justo
 *      donde se la necesita — L-161, la misma lección del marcador).
 *  El día que el founder firme el retiro, esta regla se BORRA en el
 *  mismo acto (y su borrado queda en el commit de la firma). */
// S84-B8 ② — LAS DOS CASAS. Hasta hoy R18 miraba SOLO la del cliente y
// el propio código de la entrada del prestador declaraba el hueco: "R18
// mira SOLO la Cuenta del cliente… esta entrada queda SIN guard". Una
// entrada de gate que puede desaparecer sin que nadie se entere es el
// modo de falla de siempre — y con la galería especializada en láminas
// (enmienda de método 2-ago) importa MÁS, no menos: es el único camino
// del founder a lo que tiene que firmar.
const CUENTAS_GALERIA = [
  'apps/cliente/src/app/(tabs)/cuenta/index.tsx',
  'apps/prestador/src/app/(tabs)/cuenta/index.tsx',
];
/* S85-B1 · EL MENSAJE GRITABA UNA CAUSA QUE EL PREDICADO NO MEDÍA — la
 *  forma exacta del freno falso de S84. El brazo `__DEV__` preguntaba
 *  `/__DEV__/.test(archivo entero)` y respondía "la entrada a la galería
 *  NO se esconde ahí": medido con la entrada PRESENTE en las dos casas y
 *  un `__DEV__` ajeno (un console.log), salía ROJO acusando de esconder
 *  una entrada que estaba a la vista.
 *
 *  SE CURAN LAS DOS PUNTAS, y por qué las dos: bajar solo el mensaje
 *  dejaría el guard sin nombrar nunca el defecto real de D-580; subir
 *  solo el predicado cambiaría una red gruesa por un parser —y un
 *  parser que no matchea pasa en VERDE, que es el modo de falla que
 *  L-192 existe para matar. Entonces:
 *   ① BRAZO PRECISO: si el `__DEV__` ENVUELVE la entrada, el mensaje
 *     dice eso, que es el defecto que D-580 prohíbe.
 *   ② BRAZO GRUESO: si hay `__DEV__` y no se pudo probar que envuelve,
 *     sigue siendo ROJO —la red no se afloja— pero el mensaje DECLARA
 *     que no probó la relación, en vez de afirmarla.
 *  La detección de ① es TEXTUAL y por eso es la que puede fallar; su
 *  falla cae siempre en ②, nunca en verde. */
const RE_ENTRADA_GALERIA = /router\.push\(['"]\/gallery['"]\)/;
/** ¿ese `__DEV__` envuelve a la entrada? Heurística declarada: cubre las
 *  dos formas con las que se esconde algo en esta casa —`__DEV__ && …` en
 *  JSX y `if (__DEV__) { … }`— exigiendo que entre el guard y la entrada
 *  no se haya cerrado ninguna llave. No pretende ser un parser. */
function devEnvuelve(limpio, iDev, iEntrada) {
  if (iEntrada === -1 || iEntrada <= iDev) return false;
  const entre = limpio.slice(iDev + '__DEV__'.length, iEntrada);
  if (/\}/.test(entre)) return false;
  return /^\s*&&/.test(entre) || /^\s*\)\s*\{/.test(entre);
}
function r18(casas) {
  const fallos = [];
  for (const { ruta, src } of casas) {
    const limpio = sinComentarios(src ?? '');
    if (!RE_ENTRADA_GALERIA.test(limpio)) {
      fallos.push(
        `${ruta} — LA ENTRADA A /gallery DESAPARECIÓ. D-580 (enmienda founder S82): queda VISIBLE hasta el gate de producción; su retiro exige FIRMA EXPLÍCITA, y con la firma se borra esta regla en el mismo acto.`,
      );
    }
    const iEntrada = limpio.search(RE_ENTRADA_GALERIA);
    const devs = [...limpio.matchAll(/__DEV__/g)];
    const envuelto = devs.some((d) => devEnvuelve(limpio, d.index, iEntrada));
    if (envuelto) {
      fallos.push(
        `${ruta} — LA ENTRADA A /gallery ESTÁ DETRÁS DE __DEV__. El gate corre sobre el APK preview, donde __DEV__ es false: ahí la entrada muere justo donde se la necesita (L-161, la misma lección del marcador).`,
      );
    } else if (devs.length > 0) {
      fallos.push(
        `${ruta} — hay ${devs.length} uso(s) de __DEV__ en la Cuenta de la galería. Este guard NO probó que alcancen a la entrada (su análisis es textual): se declara ROJO por precaución, porque la Cuenta que lleva al gate se mantiene sin ramas que el APK preview no ejecuta. Si el uso es legítimo, la decisión es de mesa y se declara acá — no se afloja el guard en silencio.`,
      );
    }
  }
  // ANCLA: sin casas que mirar la regla informaría "0 fallos" sin haber
  // abierto un archivo — verde sin verificación (L-192).
  fallos.push(...ancla('R18', casas.length, 2, 'Cuenta(s) de galería vigiladas'));
  return { fallos, info: fallos.length === 0 ? `${casas.length} entradas vivas y sin __DEV__` : `${fallos.length} fallo(s)` };
}

/* ☠️ R23 SE RETIRÓ EN S82-B (`d1e0e36`) Y SE FUE SIN LÁPIDA — ésta se le
 *  pone en S85-B, tres sesiones después, porque un hueco de numeración sin
 *  declarar es una pregunta que cada lector nuevo tiene que volver a
 *  investigar. (Lo fue: el reporte de apertura de S85 la trajo como "ni
 *  lápida ni mención"; la causa estaba en el historial, no en el archivo.)
 *
 *  QUÉ VIGILABA: que la huella de MARCA —la rellena en hex de capa— no
 *  viviera adentro de la placa del glifo. Nació en `ed92c43` (S82-B r23)
 *  con su rojo producido contra el archivo real.
 *
 *  POR QUÉ SE FUE: la enmienda de C dejó su premisa vieja (la marca del
 *  elegido pasó a ser `accent.control`, no un hex de capa) y **R22 la
 *  cubría entera y mejor** — ancla a `MarcaElegido` POR NOMBRE, exige que
 *  exista, que se monte y que no caiga dentro de la placa: todo lo de R23
 *  más lo que R23 no veía (que la pieza desaparezca). Dos reglas para la
 *  misma física es la copia que L-175 prohíbe, un piso arriba.
 *
 *  LO QUE DEJA COMO REGISTRO: no quedó alcance huérfano, y el retiro fue
 *  la propia ley de la casa aplicada a quien la escribió — un guard que
 *  sobrevive a su razón es basura que nadie se anima a tocar.
 *  (R28 nunca existió: se declinó al nacer, en el header de R27.
 *  SIGUIENTE NÚMERO LIBRE: **R33** — R31 NO SE TOMA: es un número que un
 *  brief citó sin letra (protocolo A7, adjudicación de mesa S88); usarlo
 *  ahora volvería verdadera retroactivamente una cita que nunca midió
 *  nada. R32 nació en S88 (la esquina compartida).) */

/* ☠️ R19 SE RETIRÓ EN S82-C r38, Y SU PROPIA REGLA DICTÓ EL RETIRO.
 *  Vigilaba que el relleno pleno se computara contra el número de
 *  hermanos (L-b). Cuando la marca del chip elegido pasó a ser LA PATA
 *  —forma, no relleno— la última pieza que rellenaba dejó de rellenar, y
 *  la regla salió ROJA diciendo exactamente lo que había que hacer: "o
 *  la pieza dejó de rellenar (y sale de la lista, EN EL MISMO COMMIT) o
 *  el nombre cambió y la regla quedó vigilando un fantasma". Era el
 *  primer caso, y la rama estaba escrita para esto.
 *  SIN CONSUMIDOR UN GUARD NO PROTEGE: DECORA — y su verde pasa a
 *  significar "no hay nada que mirar", que es el modo de fallo que
 *  L-192 existe para matar. L-b SIGUE RIGIENDO donde haya relleno; lo
 *  que ya no hay es relleno en las piezas locales de C. El día que
 *  alguna vuelva a rellenar, la regla se reescribe con su lista nueva. */


/** R20 · LA FAMILIA ALERTA NO SE RELLENA (S82-B, orden founder — el
 *  guard que protege los 4.2 grados).
 *
 *  POR QUÉ EXISTE: el CTA de oro vive a 4.2° del ámbar de alerta
 *  (medido r18: hueco 41.0–45.2 entre el alerta y la ventana prohibida
 *  del amarillo de marca). A esa distancia **el matiz no separa nada** —
 *  lo único que mantiene distinguibles al CTA y a "necesita atención" es
 *  que juegan en registros distintos: **el CTA es FILL saturado; el
 *  alerta vive como TINTE con su texto AA**. Si algún día un badge ámbar
 *  se rellena, los dos colapsan y **ningún grado de matiz lo arregla**:
 *  la cura sería mover el CTA, que ya no tiene a dónde ir.
 *
 *  QUÉ VIGILA: `backgroundColor` resuelto a `status.warning` (el campo
 *  gráfico) o a `palette.ochre` (el puro) en apps Y en packages/ui.
 *  QUÉ NO TOCA, y es la mayor parte de su uso legítimo: `warningBg` (el
 *  tinte — su forma correcta), `warningText`, `warningBorder`, y
 *  `status.warning` como color de ÍCONO o barra (registro gráfico, Ley
 *  2: AA gobierna texto, no gráfica).
 *  DURA EN 0: medido hoy, cero fills de alerta en las dos apps y en ui. */
function r20(archivos) {
  const fallos = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    for (const m of limpio.matchAll(/backgroundColor:\s*(theme\.status\.warning\b(?!Bg|Text|Border)|palette\.ochre\b(?!Dark|Alpha|Border))/g)) {
      fallos.push(`${path}:${lineaDe(limpio, m.index)} — la familia ALERTA como FILL (${m[1]}): el ámbar vive como TINTE con su texto AA. Rellenarlo colapsa el CTA de oro con "necesita atención" — están a 4.2° y el matiz no los separa`);
    }
  }
  return { fallos, info: `${fallos.length} fills de alerta` };
}



/* ☠️ R22 SE RETIRÓ EN S85-B7, POR SU CONDICIÓN ② — la que estaba
 *  escrita al nacer y nombraba este día con todas las letras:
 *  «`FiltroPills` se promueve a `packages/ui` con el invariante metido
 *  en el CONTRATO del componente — la marca como slot que no se puede
 *  anidar. Ahí el guard es redundante y lo retira B en el commit de la
 *  promoción.» La promoción ocurrió; el retiro va en el mismo commit,
 *  como su propia letra ordenaba.
 *
 *  QUÉ VIGILABA: que `MarcaElegido` existiera, se montara, y que su
 *  render NO cayera dentro del bloque de la placa del glifo. El defecto
 *  merecía guard porque SE VE COMO LAYOUT y no como cambio de ley: mover
 *  la huella adentro de la placa no rompe el build ni cambia un color, y
 *  sin embargo devuelve el producto al caso que S80 midió — los glifos
 *  b′ ya CONTIENEN una huella (Ley 12), así que adentro la marca es una
 *  huella entre huellas y deja de señalar.
 *
 *  POR QUÉ EL RETIRO NO DEJA ALCANCE HUÉRFANO, que es lo único que
 *  importa al retirar: el invariante dejó de depender de que alguien lo
 *  respete y pasó a ser IMPOSIBLE DE ROMPER DESDE AFUERA. En la pieza
 *  promovida la marca no es un slot que el consumidor pueda anidar: es
 *  estructura interna, hermana del label, y el consumidor no la toca. Un
 *  guard que vigila lo que el tipo ya garantiza es decoración — el mismo
 *  criterio con el que esta casa retiró R19, R21, R23 y R26.
 *
 *  LO QUE SIGUE VIGILADO, para que nadie crea que la ley se fue con el
 *  guard: R25 sigue cazando la pata RE-DIBUJADA en cualquier archivo, y
 *  las tres condiciones de la marca viven escritas en la primitiva
 *  `MarcaEleccion`. La ley no se retira: se retira su vigilancia
 *  redundante. */

/** R24 · EL PIE DE RESERVA NO SE COPIA (S82-B r35 — la regla que la
 *  extracción necesitaba para servir de algo).
 *
 *  EL DEFECTO QUE MECANIZA, medido y no supuesto: el pie fijo de la
 *  reserva vivía como pieza y DOS de sus cuatro pantallas lo tenían
 *  copiado a mano — y la copia no había divergido en un matiz: **había
 *  perdido el precio entero.** Nadie lo hizo mal a propósito; se copió
 *  porque copiar era posible. La pieza subió a `packages/ui`, y esta
 *  regla es lo que hace que la próxima copia no llegue a existir.
 *
 *  QUÉ MIRA: un `paddingBottom: Math.max(insets.bottom …)` dentro de
 *  `explorar/` — la firma exacta de un pie fijo hecho a mano. El
 *  `Math.max` es lo que delata la copia: es la decisión que la pieza ya
 *  toma por vos (la ley chica de la cola de scroll, S70-B5), y
 *  recalcularla en la pantalla es cómo se divergió la primera vez.
 *
 *  SU ALCANCE, ACOTADO A PROPÓSITO (y esto es letra, no pereza): rige
 *  SOLO en `explorar/`, que es la familia que el founder nombró. Un pie
 *  fijo en un LOG o en el Hogar es otro trabajo —no lleva precio ni
 *  "desde"— y esta regla no opina sobre él. Ensanchar el alcance a
 *  "todo pie fijo" convertiría una ley medida en una superstición.
 *
 *  BASELINE con nombre y CONDICIÓN DE MUERTE: quedan DOS, las dos de
 *  adiestramiento, y NO las curo yo — C las tiene declaradas como su
 *  paso siguiente (D-586: el índice es compartido). Cuando adopten la
 *  pieza, el conteo baja y el lint PIDE bajar el baseline: un guard que
 *  sobrevive a su propia razón es basura que nadie se anima a tocar. */
// S85-B1 · SOLO-BAJA EJECUTADO, la mitad. `explorar/adiestramiento/index.tsx`
// ADOPTÓ la pieza y sale de la lista: medido hoy, 0 copias a mano y 2
// `PieReserva`. El lint venía pidiendo esta baja desde que C la curó
// ("1/2 — BAJÓ: actualizar baseline") y el pedido se estaba imprimiendo
// sin que nadie lo cobrara. Queda UNA, con dueño y con su condición de
// muerte intacta (D-586: el índice es compartido; la cura es de C).
const BASELINE_R24 = {
  'apps/cliente/src/app/(tabs)/explorar/adiestramiento/confirmar-programa.tsx': 1,
};
const OFICIOS_R24 = ['paseo', 'veterinaria', 'grooming', 'adiestramiento'];
function r24(archivos) {
  const fallos = [];
  let total = 0;
  let corpus = 0;
  const sumaBaseline = Object.values(BASELINE_R24).reduce((a, b) => a + b, 0);
  for (const { path, src } of archivos) {
    if (!/\/explorar\//.test(path)) continue;
    corpus++;
    let enArchivo = 0;
    for (const m of sinComentarios(src).matchAll(/paddingBottom:\s*Math\.max\(\s*insets\.bottom/g)) {
      enArchivo++;
      if (enArchivo > (BASELINE_R24[path] ?? 0))
        fallos.push(
          `${path}:${lineaDe(src, m.index)} — PIE DE RESERVA COPIADO A MANO. La pieza es <PieReserva> (@epetplace/ui): trae el precio con su "desde", el CTA y el piso de la safe area. La copia de esta familia ya perdió el precio entero una vez — por eso existe la pieza.`,
        );
    }
    total += enArchivo;
  }
  // ANCLA — y la escribo contra MI PROPIA regla, que nació con este
  // hueco: R24 filtra por la RUTA `explorar/`. Si esas pantallas se
  // mueven o el segmento se renombra, el filtro no matchea nada, el
  // conteo da 0 y el lint informa "0 pies a mano" — verde, y la próxima
  // copia entra sin que nadie se entere. No basta con "algún archivo":
  // los CUATRO oficios tienen que estar, porque la regla existe para
  // esa familia y para el quinto que venga.
  const vistos = OFICIOS_R24.filter((o) =>
    archivos.some((a) => a.path.includes(`/explorar/${o}/index.tsx`)),
  );
  fallos.push(...ancla('R24', vistos.length, OFICIOS_R24.length, `pantalla(s) de reserva (faltan: ${OFICIOS_R24.filter((o) => !vistos.includes(o)).join(', ') || 'ninguna'})`));
  return {
    fallos,
    info: `${total}/${sumaBaseline} pies a mano en ${corpus} archivos de explorar/ · oficios anclados=${vistos.length}/4 (baseline: confirmar-programa de adiestramiento, de C)${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R25 · LA PATA NO SE REINVENTA (S82-B r37 — la ley de la marca de
 *  elección, mecanizada el día que se firmó).
 *
 *  POR QUÉ EXISTE: la pata marca la elección en TRES controles
 *  (`FiltroPills`, `FiltroMascotas`, `SelectorSegmentado`). Dejó de ser
 *  una decisión por pieza y pasó a ser gramática de la casa — y una
 *  gramática copiada en tres archivos no es gramática: son tres
 *  coincidencias esperando divergir. Es la MISMA enfermedad del pie de
 *  reserva, cazada esta vez ANTES de que divergiera.
 *
 *  QUÉ MIRA, y por qué ESTE literal: `rotate: '-14deg'` es la huella
 *  dactilar de la anatomía firmada — nadie llega a −14° por casualidad;
 *  si aparece, alguien está re-dibujando la pata. Es un net ANGOSTO a
 *  propósito: el obvio ("una Huella dentro de algo absoluto") da SEIS
 *  archivos y cinco son legítimos (AvatarMascota usa la huella como cara,
 *  el Hogar también) — una regla que grita donde no hay delito se
 *  desactiva sola en la cabeza de quien la lee.
 *
 *  BASELINE con nombre y CONDICIÓN DE MUERTE: 1, el `MarcaElegido` de
 *  `filtro-pills` (de C, byte-equivalente a la primitiva). Cuando C la
 *  adopte, el conteo baja y el lint PIDE bajar el baseline. */
const CASA_PATA = 'packages/ui/src/brand/MarcaEleccion.tsx';
// ✅ VACÍO desde S85-B7 (solo-baja EJECUTADO): el `MarcaElegido` local
// murió con la promoción de `FiltroPills` a `packages/ui` — la pieza
// adoptó la primitiva canónica `MarcaEleccion` en vez de su clon
// byte-equivalente. El lint venía pidiendo esta baja en cuanto el conteo
// cayera. DE VACÍO NO SE SUBE: toda pata re-dibujada es roja el primer día.
const BASELINE_R25 = {};
function r25(archivos) {
  const fallos = [];
  let total = 0;
  let casa = 0;
  const sumaBaseline = Object.values(BASELINE_R25).reduce((a, b) => a + b, 0);
  for (const { path, src } of archivos) {
    const n = (sinComentarios(src).match(/rotate:\s*'-14deg'/g) ?? []).length;
    if (path.endsWith('MarcaEleccion.tsx')) { casa += n; continue; }
    total += n;
    if (n > (BASELINE_R25[path] ?? 0))
      fallos.push(
        `${path} — LA PATA RE-DIBUJADA. La marca de la elección es UNA pieza: <MarcaEleccion> de @epetplace/ui (PATA 24 · MONTA = PATA/3 · −14° · absoluta sobre el canto). Sus tres condiciones viven ahí: aparece SOLO en la elegida · JAMÁS adentro de la placa (R22) · apoyada sobre el canto, con el aire reservado por quien la porta.`,
      );
  }
  // ANCLA: si la primitiva pierde su −14° (renombre, refactor), esta
  // regla queda vigilando un fantasma y todo pasa en verde.
  fallos.push(...ancla('R25', casa, 1, `−14° en la propia primitiva (${CASA_PATA})`));
  return {
    fallos,
    info: `${total} patas re-dibujadas${sumaBaseline === 0 ? ' (DURA EN 0 desde S85-B7: el clon local murió con la promoción)' : ` (baseline ${sumaBaseline})`}${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R30 · EL GLIFO RE-DIBUJADO (S86-B — la mitad de D-645 que ninguna
 *  promoción tuvo, y D-546 mecanizada).
 *
 *  EL DEFECTO QUE VIGILA, con su costo medido: tres archivos de apps
 *  copiaban geometría del registry de `Icono` porque la pieza no exponía
 *  el color de la huella ni el eje de la barra. La skill lo declaraba
 *  desde S78 —*"todo glifo nuevo del prestador nace con este riesgo"*— y
 *  la cabecera del clon del prestador lo cobró TRES VECES en una sola
 *  sesión (S85). **El día que la pieza ganó las props, los clones
 *  murieron; lo que faltaba es que nadie pueda fundar el cuarto.**
 *
 *  ⚠️ POR QUÉ ESTA REGLA Y NO "UN SVG CON TRAZO 1.9 + UNA HUELLA": lo
 *  medí y da SEIS archivos, casi todos legítimos —el Hogar y el perfil
 *  usan la huella como CARA de mascota y el 1.9 en otro control del mismo
 *  archivo—. **Una regla que grita donde no hay delito se desactiva sola
 *  en la cabeza de quien la lee** (la lección literal de R25). El delito
 *  no es dibujar: es dibujar LO QUE EL REGISTRY YA TIENE. Por eso compara
 *  contra el registry vivo — si un glifo no existe ahí, esto calla.
 *
 *  ⚠️ SU LÍMITE, MEDIDO Y DECLARADO EN VEZ DE DESCUBIERTO DESPUÉS: el
 *  umbral de 18 chars existe para que paths triviales (chevrones, checks)
 *  no coincidan por casualidad, y tiene un costo real — **un glifo cuyos
 *  paths sean TODOS cortos es invisible para esta regla**. Caso vivo al
 *  escribirla: `compartir` (tres paths de 8, 17 y 15 chars) viajaba
 *  concatenado en un solo `d=` del perfil de mascota y R30 no lo veía. Se
 *  curó el SITIO (hoy monta `<Icono>`), no el umbral: bajarlo compra
 *  ruido, no cobertura. Quien encuentre el segundo caso, que cure el
 *  sitio igual — o que cambie el eje de comparación, no el número.
 *
 *  BASELINE: **{} — DURA EN 0**, y nace así porque el único hit real de
 *  su primer día se curó en el mismo commit (el lápiz del perfil, al que
 *  además le faltaba el bisel). De vacío no se sube: todo glifo
 *  re-dibujado es rojo el primer día. */
const CASA_REGISTRY = 'packages/ui/src/components/Icono.tsx';
const MIN_PATH_R30 = 18;
const BASELINE_R30 = {};
const pathsDe = (src) => [...sinComentarios(src).matchAll(/d="([^"]+)"/g)];
function r30(archivos) {
  const fallos = [];
  const esRegistry = (p) => p.replace(/\\/g, '/').endsWith('components/Icono.tsx');
  const registry = archivos.find((a) => esRegistry(a.path));
  // El SET del registry: paths largos, del CÓDIGO (no de las lápidas —
  // L-170: un censo lee los comentarios como código si se lo permitís).
  const delSet = new Set(
    registry ? pathsDe(registry.src).map((m) => m[1].replace(/\s+/g, ' ').trim()).filter((d) => d.length >= MIN_PATH_R30) : [],
  );
  let copias = 0;
  for (const { path, src } of archivos) {
    if (esRegistry(path) || !path.replace(/\\/g, '/').startsWith('apps/')) continue;
    let n = 0;
    for (const m of pathsDe(src)) {
      const d = m[1].replace(/\s+/g, ' ').trim();
      if (!delSet.has(d)) continue;
      n++;
      copias++;
      if (n > (BASELINE_R30[path] ?? 0))
        fallos.push(
          `${path}:${lineaDe(src, m.index)} — GLIFO RE-DIBUJADO: este path existe BYTE-IDÉNTICO en el registry de \`Icono\`. Montá <Icono nombre="…"> — la pieza acepta \`tinta\` (trazo), \`huella\` (color independiente, D-546) y \`activa\` (el eje de la barra: la huella de ESTRUCTURA recolorea, la de MARCA aparece — ley 6, resuelta ADENTRO). Un dibujo con dos fuentes diverge en silencio: nada falla cuando una se actualiza y la otra no.`,
        );
    }
  }
  // ANCLA: si el registry se renombra, se parte o cambia de forma, el SET
  // queda vacío y la regla pasaría en VERDE sin comparar contra nada —
  // su silencio significaría "no miré", no "no hay copias" (L-192).
  fallos.push(...ancla('R30', delSet.size, 30, `paths de ≥${MIN_PATH_R30} chars en el registry (${CASA_REGISTRY})`));
  return {
    fallos,
    info: `${copias} glifo(s) re-dibujado(s) · ${delSet.size} paths del registry vigilados${copias === 0 ? ' (DURA EN 0 desde S86-B: los tres clones murieron)' : ''}`,
  };
}

/** Fixture de R30 — sintético a propósito: 34 paths largos distintos
 *  para pasar el ancla, y UN archivo de apps que copia el primero. Si el
 *  ancla fuera lo que lo pone rojo, la prueba pasaría por el motivo
 *  equivocado y no probaría la regla que dice probar (precedente R24). */
const PATHS_R30 = Array.from(
  { length: 34 },
  (_, i) => `M4.4 ${5 + i}.2h15.2a1.5 1.5 0 0 1 1.5 1.5v9.8a1.5 1.5 0 0 1-1.5 1.5Z`,
);
const FIXTURE_R30 = [
  { path: CASA_REGISTRY, src: PATHS_R30.map((d) => `<Path d="${d}" />`).join('\n') },
  { path: 'apps/cliente/src/(fixture)/GlifoCopiado.tsx', src: `<Path d="${PATHS_R30[0]}" />` },
];

/** Corpus de relleno para los fixtures de las reglas que anclan contra
 *  `MINIMOS_CORPUS.apps` (las cuatro del Norte). Archivos vacíos: no
 *  aportan violaciones, solo altura de corpus — su único trabajo es que
 *  el ancla no se encienda y el rojo medido sea el del brazo real. */
const RELLENO_APPS = Array.from({ length: MINIMOS_CORPUS.apps }, (_, i) => ({
  path: `(fixture-relleno-${i})`,
  src: '',
}));

/* ── LOS PISOS DE LAS CUATRO DEL NORTE ──────────────────────────────────
   Viven acá, y no pegados a su función como los demás baselines, por una
   razón mecánica: sus FIXTURES los leen, y los fixtures se evalúan antes
   que el cuerpo de las reglas. Un `const` no se hoistea. El porqué de
   cada número está en el header de su regla, más abajo.

   LOS CUATRO SON EL NÚMERO MEDIDO DEL CORPUS VIVO al abrir la tanda, no
   una cuota: 21 espaciados crudos · 20 radios crudos (hoy 7: las 13 pildoras murieron con la firma del 14-ago) · 6 pantallas sobre
   el presupuesto de separadores · 6 sobre el de tamaños. Solo bajan.

   ⚠️ LOS DOS PRIMEROS SE MIDIERON DOS VECES Y DIERON DISTINTO, y el que
   vale es el segundo: un `grep` sobre `apps` + `packages` dijo **36** y
   **21**; este lint, que corre solo sobre `apps` y despoja comentarios
   (L-170), dice **21** y **20**. No hay contradicción — miden corpus
   distintos —, pero **el piso lo fija la herramienta que lo exige**, o
   el ratchet arrancaría con margen regalado. Es exactamente la historia
   de R2 (grep 7 · lint crudo 8 · despojando prosa 4), y por eso se
   escribe: la próxima regla se ahorra el paso. */
// ⏬ S98-C: 21 → 20. El trinquete lo APRIETA quien lo baja, si no se
// oxida: la reconstrucción del Negocio en baldosas se llevó un `gap: 2`
// inline de la anatomía vieja de los mundos. El propio lint lo pidió
// («BAJÓ: actualizar baseline»). Declarado a B, dueña del instrumento.
const BASELINE_R36 = 20;
const BASELINE_R37 = 3;
const BASELINE_R38 = 6;
const BASELINE_R39 = 6;
const PRESUPUESTO_SEPARADORES = 3;
/** R42 · la puerta de la foto — su doctrina vive con la regla, abajo.
 *
 *  ⏬ S99-B · PARTICIÓN POR DUEÑO Y CURABILIDAD (orden de mesa, aplicada
 *  HACIA ATRÁS). El baseline decía *«2 de ui + 8 de apps»* y eso es
 *  origen, no estado: **un número parado no dice si nadie lo tocó o si
 *  nadie PUEDE tocarlo.**
 *
 *  🔴 Y AL APLICARLA APARECIÓ UNA TERCERA CLASE QUE LA ORDEN NO PREVIÓ,
 *  porque el objeto la tenía: **hay una entrada que NO ES DEUDA y jamás
 *  va a bajar** — `EvidenciaFoto` no es una puerta a mano esperando
 *  migrar: es **otra interacción** (cámara DIRECTA, la galería detrás de
 *  un mantenido). *Contarla como deuda miente en el otro sentido: promete
 *  un 0 que sería un error alcanzar.*
 *
 *  ⇒ Las tres clases, y el criterio para leer el número:
 *   · **CURABLE** — baja cuando su lote toque el archivo.
 *   · **BLOQUEADA** — no se cura escribiendo mejor; espera una firma.
 *   · **LEGÍTIMA** — cumple otra ley y **se queda**. El piso real de esta
 *     regla NO es 0: es 1. */
const CASA_PUERTA_FOTO = 'packages/ui/src/components/HojaCaptura.tsx';
/** clase → por qué está parada. La clave ES la ruta; el valor es la
 *  razón que el lector necesita para no pedirle a la persona equivocada
 *  que la cure. */
const BASELINE_R42_CLASES = {
  // ── LEGÍTIMA · NO baja nunca, y está bien ────────────────────────
  'packages/ui/src/components/EvidenciaFoto.tsx':
    'LEGÍTIMA (no es deuda) · no es un menú: la cámara es DIRECTA y la galería vive detrás de un mantenido. Otra interacción, otra pieza. El piso de R42 es 1, no 0.',
  // ── BLOQUEADA · no se cura escribiendo mejor ─────────────────────
  'packages/ui/src/components/SelectorAvatar.tsx':
    'BLOQUEADA · dueño B · su hoja tiene TRES Celda y la tercera («Por ahora no») es decisión FIRMADA en S45. Absorberla es un GATE DE FORMA del founder, no un refactor — y no viaja escondido adentro de otra tanda.',
  // ── CURABLES · bajan cuando su lote toque el archivo ─────────────
  'apps/cliente/src/app/carnet.tsx': 'CURABLE · dueño del lote del cliente',
  'apps/cliente/src/app/(tabs)/cuenta/perfil.tsx': 'CURABLE · dueño del lote del cliente',
  'apps/cliente/src/components/HojaFotoMascota.tsx':
    'CURABLE · dueño del lote del cliente. ⚠️ Su propia cabecera ya lo pedía desde S82: «cuando SelectorAvatar gane el encuadre de la casa, esta Hoja muere absorbida» — la deuda estaba declarada por su autor antes de que existiera la pieza.',
  'apps/prestador/src/app/ventas/configuracion.tsx': 'CURABLE · dueño del lote del prestador',
  'apps/prestador/src/app/(tabs)/cuenta/perfil.tsx':
    'CURABLE · dueño del lote del prestador. Nota: su captura de LOGO no migra (D-740, PNG con alpha) — migra la de avatar.',
  'apps/prestador/src/app/veterinaria/verificacion.tsx': 'CURABLE · dueño del lote del prestador',
  'apps/prestador/src/components/seccion-documentos.tsx': 'CURABLE · dueño del lote del prestador',
  'apps/prestador/src/components/alta/PasoDocumentos.tsx': 'CURABLE · dueño del lote del prestador (C lo tomó en L1: `FotoDelRepartidor` es su hermana de clase)',
};
const BASELINE_R42 = new Set(Object.keys(BASELINE_R42_CLASES));
/** El piso REAL: las que no son deuda. R42 no puede llegar a 0 y decirlo
 *  es la mitad del trabajo de la partición. */
const PISO_R42 = Object.values(BASELINE_R42_CLASES).filter((r) => r.startsWith('LEGÍTIMA')).length;

// ── L-192: LA AUTO-PRUEBA — cada regla con modo de fallo DEBE salir
//    roja contra su fixture sintético, en CADA corrida. ──
const FIXTURES = {
  R1: [{ path: '(fixture)', src: '<SelectorOpcion naturaleza="foo" />\n<SelectorOpcion entidad naturaleza="existe" />' }],
  R2: [{ path: '(fixture)', src: Array(BASELINE_HEX + 1).fill("color: '#ABC123'").join('\n') }],
  /* R35 · SU FIXTURE LLEGA UNA SESIÓN TARDE, y el porqué es el hallazgo
     de S97+-B: **la regla corría sin estar en `REGLAS`**, así que los
     TRES guards estructurales —que iteran `REGLAS`— no podían verla.
     Nació en S96-B, se reportó "DURA EN 0" en S96 y otra vez en S97, y
     en las dos el número salía de una regla **de la que nadie había
     comprobado que pudiera salir roja**. El caso limpio de L-192: no
     falló el guard, falló que el objeto vigilado nunca entró al corral.

     EL FIXTURE TRAE LA GALERÍA A PROPÓSITO. R35 tiene ancla (exige ver
     al menos un archivo de `packages/ui/src/gallery/`), así que un
     fixture sin ese path saldría rojo **por el ancla y no por la
     regla** — verde-por-la-razón-equivocada dado vuelta: un ROJO por la
     razón equivocada, que está igual de roto. El brazo del ancla tiene
     su propio rojo abajo, en EXTRAS_BRAZOS. */
  R35: [{ path: 'packages/ui/src/gallery/(fixture).tsx', src: "style={{ backgroundColor: '#00000010' }}" }],
  /* LAS CUATRO DEL NORTE · sus fixtures traen CORPUS DE RELLENO, y no es
     un truco: las cuatro anclan contra `MINIMOS_CORPUS.apps`, así que un
     fixture de un solo archivo saldría rojo POR EL ANCLA y dejaría el
     brazo real sin probar — el mismo error que R35 tenía y que esta
     tanda vino a cerrar. El relleno hace pasar el ancla para que el rojo
     que se mide sea el de la regla. El ancla tiene su rojo aparte, en
     EXTRAS_BRAZOS. */
  /* R40 · el fixture enciende el brazo ① (contador). Trae los CUATRO
     diccionarios para que el ancla no se encienda y el rojo medido sea
     el de la regla — la misma disciplina que R35 y las del Norte. El
     brazo ② (paridad es↔en) tiene su rojo aparte en EXTRAS_BRAZOS:
     ningún fixture único puede encender los dos, porque el que agrega
     claves de más las agrega EN LOS DOS idiomas. */
  /* R41 · el fixture trae SEIS piezas para que el ANCLA no sea lo que lo
     pone rojo (mínimo 6): cinco sanas —una por cada forma de estar
     cubierta, incluido el FUNDIDO PURO que se exime por medición— y UNA
     con `withSpring` sin el hook. Lo que tiene que salir rojo es la
     pieza descubierta, y una prueba que pasa por el motivo equivocado no
     prueba la regla que dice probar. */
  /* R42 · el fixture trae LAS DIEZ del baseline (como stubs) + la pieza
     canónica + UNA puerta nueva a mano. Sin las diez, el brazo «BAJÓ:
     sacar del baseline» se encendería también y el rojo medido no sería
     el de la regla; sin la canónica, se encendería el ANCLA. Lo único
     que tiene que salir rojo es la puerta nueva. */
  /* R43 · el fixture es una `palette.ts` sintética con las TRES casas
     (para que el ANCLA no sea lo que lo pone rojo) y UNA por debajo del
     piso. Lo que tiene que salir rojo es la casa floja. */
  /* R44 · el fixture trae los SEIS diccionarios (si no, el ancla es lo
     que lo pone rojo) con las 6 del baseline repartidas + UNA séptima.
     Lo que tiene que salir rojo es la voz nueva. */
  /* R44 · el fixture trae 40 archivos (el ancla) con las 9 del baseline
     repartidas + UNA décima. Lo rojo tiene que ser la voz nueva. Y trae
     además DOS legítimas —con oración previa que nombra la falla— para
     que el fixture pruebe que el net DISCRIMINA, no solo que dispara. */
  R44: [
    { path: 'apps/prestador/src/i18n/es.ts', src: Array(3).fill("      x: 'Revisa los datos de la nota.'").join('\n') },
    { path: 'apps/prestador/src/i18n/en.ts', src: Array(3).fill("      x: 'Check the details and try again.'").join('\n') },
    { path: 'packages/api/src/wrappers/a.ts', src: Array(3).fill("  datos_invalidos: 'Revisá los datos.',").join('\n') },
    { path: 'packages/api/src/wrappers/legitimas.ts', src: "  a: 'Una de las vacunas del carnet no es válida. Revisá los datos e intentá de nuevo.',\n  b: 'No pudimos guardar la foto. Revisa tu conexión y prueba de nuevo.',"  },
    { path: 'apps/cliente/src/i18n/es.ts', src: "      y: 'Algo salió mal.'" },
    ...Array.from({ length: 35 }, (_, i) => ({ path: `(relleno-${i}).ts`, src: '' })),
  ],
  R43: {
    palette: [
      "  papelTapiz: '#FAF2F5',",
      "  tapizDark: '#0D050D',",
      "  memorialDark0: '#0A0E0A',",
      "  campoBordeL: '#E3E0EF',", // 1.18 contra el tapiz — LA FLOJA
      "  campoBordeD: '#62627A',",
      "  campoBordeM: '#5A695A',",
    ].join('\n'),
  },
  R42: [
    { path: 'packages/ui/src/components/HojaCaptura.tsx', src: 'capturarConCamara(); capturarDeGaleria()' },
    ...[...BASELINE_R42].map((path) => ({ path, src: 'capturarConCamara(); capturarDeGaleria()' })),
    { path: 'apps/prestador/src/app/puerta-nueva.tsx', src: 'capturarConCamara(o); capturarDeGaleria(o)' },
  ],
  R41: [
    { path: 'packages/ui/src/components/Sana1.tsx', src: 'useReducedMotion(); withSpring(0)' },
    { path: 'packages/ui/src/components/Sana2.tsx', src: 'useReducedMotion(); withRepeat(x)' },
    { path: 'packages/ui/src/components/Sana3.tsx', src: 'useReducedMotion(); FadeInDown.duration(1)' },
    { path: 'packages/ui/src/components/Sana4.tsx', src: 'useReducedMotion(); withTiming(1); transform: [{ scale: 1 }]' },
    // el fundido puro: MUEVE nada — `withTiming` sobre opacity, cero
    // transform. NO debe exigir el hook (es el caso VisorFoto).
    { path: 'packages/ui/src/components/Fundido.tsx', src: 'withTiming(1); opacity: v.value' },
    { path: 'packages/ui/src/components/Descubierta.tsx', src: 'withSpring(0, { dampingRatio: 0.85 })' },
  ],
  R40: [
    { path: 'apps/cliente/src/i18n/es.ts', src: '    unoPENDIENTE:\n    dosPENDIENTE:' },
    { path: 'apps/cliente/src/i18n/en.ts', src: '    unoPENDIENTE:\n    dosPENDIENTE:' },
    { path: 'apps/prestador/src/i18n/es.ts', src: '' },
    { path: 'apps/prestador/src/i18n/en.ts', src: '' },
  ],
  R36: [...RELLENO_APPS, { path: '(fixture)', src: Array(BASELINE_R36 + 1).fill('paddingTop: 13').join('\n') }],
  R37: [...RELLENO_APPS, { path: '(fixture)', src: Array(BASELINE_R37 + 1).fill('borderRadius: 999').join('\n') }],
  R38: [
    ...RELLENO_APPS,
    ...Array.from({ length: BASELINE_R38 + 1 }, (_, i) => ({
      path: `(fixture-sep-${i})`,
      src: Array(PRESUPUESTO_SEPARADORES + 1).fill('<Separador />').join('\n'),
    })),
  ],
  R39: [
    ...RELLENO_APPS,
    ...Array.from({ length: BASELINE_R39 + 1 }, (_, i) => ({
      path: `(fixture-size-${i})`,
      src: 'size.xs\nsize.sm\nsize.base\nsize.md',
    })),
  ],
  R3: [{ path: '(fixture)', src: '<Tarjeta elevacion="flotante">' }],
  R4: [{ path: '(fixture)', src: "style={{ shadowColor: '#000000', shadowOpacity: 0.5 }}\nstyle={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}" }],
  R5: [{ path: '(fixture)', src: 'style={{ backgroundColor: theme.accent.cta }}\n<ThemeProvider cta="oficio">' }],
  R6: [{ path: '(fixture)', src: '<KeyboardAvoidingView behavior="padding">' }],
  R29: [{ path: '(fixture)', src: '<Campo label="Tel" sinPie />' }],
  /* R34: el bug del 9-ago, en tres líneas — la decisión por largo sin fase.
     Su hermano sano (`fase === 'listo' && x.length === 0`) NO debe salir rojo,
     y eso lo prueba el repo real: las cuatro pantallas de índice lo usan. */
  R34: [{ path: '(fixture)', src: "const elegibles = ofrecibles(mascotas, faseEspecies);\nif (elegibles.length === 0) { setSinElegibles(true); return; }" }],
  R7: [{ path: '(fixture)', src: Array(BASELINE_FADEIN + 1).fill('entering={FadeInDown}').join('\n') }],
  R8: [{ path: '(fixture)', src: '<Entrada><EstadoVacio titulo="x" /></Entrada>\n<Animated.View entering={FadeIn}><EstadoVacio titulo="y" /></Animated.View>' }],
  R10: [{ path: 'apps/cliente/src/app/otra-pantalla.tsx', src: '/** @override-s82c — copia ilegal */' }],
  R11: [{ path: '(fixture)/es.ts', src: "    vozCardM3: '{{nombre}} completó el 60% de su nivel — ¡sigue la racha!'," }],
  R12: [{ tema: 'light', clase: 'texto', nombre: '(fixture)', ratio: 2.0, minimo: 4.5 }],
  R13: [{ path: '(fixture)', src: '<Pressable style={{ borderWidth: 1.5, borderColor: theme.border.default }}>' }],
  R14: [{ path: 'x/hogar/index.tsx', src: 'const RESPIRO_BANDA = spacing[8];\nconst SOLAPE_RECO = spacing[14];' }],
  R15: [{ tema: 'light', ruta: '(fixture)', valor: '#0F5E56' }],
  // tinte ENCENDIDO y ningún override en lightOficio = el caso que la
  // regla existe para atrapar.
  R20: [{ path: '(fixture)', src: 'style={{ backgroundColor: theme.status.warning }}' }],
  R17: { index: "export { PiezaFantasma } from './components/PiezaFantasma'", galeria: '' },
  // S83-B7 · el ancla prueba SOLO el brazo de la entrada ausente. El de
  // __DEV__ va en EXTRAS_BRAZOS: ensanchar este string encendía los dos y
  // ninguno quedaba probado por separado — medido, no supuesto.
  R18: [{ ruta: '(fixture)', src: '<CeldaNavegacion titulo="Preferencias" onPress={() => router.push("/cuenta/preferencias")} />' }, { ruta: '(fixture2)', src: 'router.push("/gallery")' }],
  // el pleno que ignora a sus hermanos: exactamente mi defecto de r11
  // la marca anidada adentro de la placa: el defecto que se ve como layout
  // S83-B3 · el fixture trae la MITAD CLARA SANA a propósito, para que el
  // rojo solo pueda venir de la oscura — el precedente de R24, dos entradas
  // más abajo: una prueba que pasa por el motivo equivocado no prueba la
  // regla que dice probar. (El brazo claro y el de los hexes iguales tienen
  // su rojo en EXTRAS_R16: ningún fixture único puede encender los tres.)
  // S83-B6 · lightOficio SIN pisar control (darkOficio sano a propósito:
  // el rojo tiene que venir del brazo que se prueba, no del otro).
  // S83-B13 · lightOficio sin pisar active (darkOficio sano): el rojo
  // viene del brazo que se prueba y no del otro.
  R27: {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, control: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, active: palette.teal },\n}',
  },
  R16: {
    palette: "light0: '#FAF9F7',\npapelTapiz: '#FAF2F5',\npapelTapizOficio: '#F4F8F6',\ndark0: '#050508',\ntapizDark: '#0D050D',\ntapizDarkOficio: '#080D0E',",
    temas:
      'const lightOficio: Theme = { ...lightTheme,\n  bg: { ...lightTheme.bg, base: palette.light0 },\n}\n' +
      'const darkOficio: Theme = { ...darkTheme }',
  },
  // el pie a mano en una pantalla de explorar que NO está en el baseline
  // el fixture trae los CUATRO oficios para que el ancla NO sea lo que
  // lo pone rojo: lo que tiene que salir roja es la copia, y una prueba
  // que pasa por el motivo equivocado no prueba la regla que dice probar
  R25: [
    { path: 'packages/ui/src/brand/MarcaEleccion.tsx', src: "transform: [{ rotate: '-14deg' }]" },
    { path: 'apps/cliente/src/(fixture)/OtraPata.tsx', src: "transform: [{ rotate: '-14deg' }]" },
  ],
  R30: FIXTURE_R30,
  R32: [{
    path: '(fixture)/esquina.tsx',
    src: `
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <Pressable hitSlop={10}><Icono nombre="campana" tinta={t} /></Pressable>
        <Pressable hitSlop={10}><Destello /></Pressable>
      </View>`,
  }],
  R33: [{
    path: '(fixture)/campana-sin-superficie.tsx',
    src: '<Badge n={3} forma="huella"><Icono nombre="campana" tinta={t} /></Badge>',
  }],
  R24: [
    ...OFICIOS_R24.map((o) => ({ path: `apps/cliente/src/app/(tabs)/explorar/${o}/index.tsx`, src: '' })),
    {
      path: 'apps/cliente/src/app/(tabs)/explorar/(fixture)/index.tsx',
      src: 'paddingBottom: Math.max(insets.bottom, spacing[4]),\nborderTopWidth: 1,',
    },
  ],
};

/** R32 · LA ESQUINA COMPARTIDA — los 20dp de la lámina (S88-B; lámina
 *  `LAMINA_ESQUINA_CAMPANA.md`, número CONGELADO por el founder: 20dp de
 *  separación mínima entre zonas táctiles, CON GUARD).
 *
 *  POR QUÉ ESTE NÚMERO ES EL ÚNICO DE SU LÁMINA CON GUARD, y ordena la
 *  forma de la regla: el truncado, el contraste y el tamaño SE VEN en
 *  una captura — la separación de zonas táctiles NO. Con hitSlop 10 a
 *  cada lado y separación 8dp hay 12dp de solape ambiguo que ninguna
 *  captura muestra: solo aparece cuando un dedo real cae en la banda
 *  compartida, abre lo que no era, **y la persona cree que se equivocó
 *  ella**. Es el defecto silencioso perfecto (familia L-192).
 *
 *  LA LLAVE LA ESCRIBIÓ LA PROPIA LÁMINA: la campana va INLINE, jamás
 *  absoluta — *"la separación se vuelve un gap que el guard puede
 *  leer"*. Esta regla es la otra mitad de ese trato: si la separación
 *  no es legible estáticamente, el guard no la da por buena — sale ROJO
 *  pidiendo que se declare (L-197: «no pude medir» jamás degrada a
 *  verde).
 *
 *  LA ARITMÉTICA, mecanizada y no copiada: el 20 de la lámina es
 *  10+10 — los hitSlop de los DOS vecinos. La regla no fija 20: exige
 *  gap ≥ 2 × el hitSlop MÁS GRANDE de la ventana (default 10 si no hay
 *  ninguno declarado) — si alguien sube un hitSlop a 14, el mínimo pasa
 *  a 28 solo, sin esperar que alguien recuerde la cuenta.
 *
 *  ALCANCE DECLARADO (en la salida, como los demás):
 *   · dispara sobre archivos de apps que MONTAN el glifo `campana` —
 *     hoy CERO (C y D construyen contra esto): el conteo se imprime
 *     para que el silencio diga «nadie montó», no «no miré»;
 *   · la VENTANA sigue siendo ±25 líneas para el gap y el ABSOLUTO (son
 *     geometría de la FILA, y la convención de extraer la fila ya rige),
 *     pero el brazo del hitSlop dejó de ser ciego al otro lado de la
 *     extracción (S89-B): los componentes referenciados en la ventana se
 *     RESUELVEN por el árbol de montaje (`lib-arbol-montaje.mjs` — mismo
 *     archivo o un salto de import, `@epetplace/ui` incluido) y sus
 *     hitSlop NUMÉRICOS entran al mínimo. Un `hitSlop={expr}` no es
 *     legible estáticamente y NO baja el mínimo — límite declarado;
 *   · la HUELLA-NOVEDAD del Badge NO es zona táctil (mismo Pressable,
 *     oculta de a11y) — el gap de la lámina mide HERMANOS y la enmienda
 *     pata-pisa (S89 orden 7: superpuesta, `right:0`) la metió entera al
 *     glifo: ya ni asoma tinta al gap. Cero brazos nuevos.
 *   · NO mide punta a punta del render (eso es el gate en dispositivo
 *     con el nombre largo y en inglés — la otra línea de la lámina).
 *
 *  ☠️ CONDICIÓN DE MUERTE: si la esquina gana su propia PIEZA en
 *  packages/ui (la banda del techo con el gap adentro, estilo FilaCita
 *  — cero API de geometría), esta regla se angosta a «las apps usan la
 *  pieza» o se retira con lápida. */
const VENTANA_R32 = 25;
const GAP_MINIMO_R32 = 20; // el número congelado de la lámina (10+10)
/** spacing keys cuyo valor alcanza N dp (los tokens legales para el gap). */
const SPACING_R32 = { 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128 };

/** El árbol de montaje para el brazo del hitSlop (S89-B) — se construye UNA
 *  vez y SOLO tras pasar su auto-prueba: un grafo que no prueba su regla
 *  no aporta mínimos (L-197). Si la auto-prueba falla, r32 lo dice en ROJO
 *  en vez de medir con menos. */
let _arbolR32 = null;
function arbolR32() {
  if (_arbolR32 === null) {
    const fallas = autoPruebaArbol();
    _arbolR32 = fallas.length > 0 ? { roto: fallas } : { arbol: construirArbol() };
  }
  return _arbolR32;
}

function r32(archivos) {
  const fallos = [];
  let montajes = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    if (!/nombre=["']campana["']/.test(limpio)) continue;
    const lineas = limpio.split('\n');
    lineas.forEach((linea, i) => {
      if (!/nombre=["']campana["']/.test(linea)) return;
      montajes++;
      const ventana = lineas.slice(Math.max(0, i - VENTANA_R32), i + VENTANA_R32).join('\n');

      // ① INLINE, jamás absoluta — la condición que vuelve legible al resto
      if (/position:\s*['"]absolute['"]/.test(ventana)) {
        fallos.push(
          `${path}:${i + 1} — la campana convive con \`position: 'absolute'\` en su ventana (±${VENTANA_R32}): la lámina la manda INLINE, jamás absoluta — el texto no sabe que un absoluto está ahí, y la separación deja de ser legible`,
        );
      }

      // ② el mínimo REAL: 2 × el hitSlop más grande de la ventana (default 10)
      // hitSlop en sus DOS ropas — `hitSlop: 10` (objeto de estilo/props) y
      // `hitSlop={10}` (attr JSX). El brazo nació mirando solo la primera y
      // el barrido por-brazo lo cazó MUDO: con la ropa JSX el mínimo se
      // quedaba en 20 y un hitSlop de 14 pasaba sin subirlo a 28.
      const slops = [...ventana.matchAll(/hitSlop[:=]\s*\{?\s*(\d+)/g)].map((m) => Number(m[1]));
      // ②bis (S89-B) — los hitSlop que viven DENTRO de vecinos EXTRAÍDOS
      // (p. ej. `IdentidadDelTecho`): la ventana no los veía; el árbol de
      // montaje los resuelve. Sobre paths de fixture el árbol no tiene
      // nodo y devuelve vacío — los fixtures no cambian de veredicto.
      const estadoArbol = arbolR32();
      let fuentesVecinos = [];
      if (estadoArbol.roto !== undefined) {
        fallos.push(
          `${path}:${i + 1} — el árbol de montaje NO pasó su auto-prueba y el mínimo del hitSlop quedaría medido DE MENOS: ${estadoArbol.roto[0]} (L-197: no se mide con un instrumento roto)`,
        );
      } else if (!estadoArbol.arbol.archivos.has(path) && existsSync(path)) {
        // EL ANCLA del brazo (L-192): un archivo REAL que el árbol no
        // conoce = las convenciones de path divergieron y ②bis estaría
        // devolviendo vacío para TODO — la ceguera vieja con ropa nueva.
        // (Los paths de fixture no existen en disco y quedan fuera.)
        fallos.push(
          `${path}:${i + 1} — el árbol de montaje NO conoce este archivo real: el brazo del hitSlop de vecinos está midiendo DE MENOS en silencio (¿divergieron las raíces o la forma de los paths?)`,
        );
      } else {
        const vecinos = hitSlopsVecinos(estadoArbol.arbol, path, ventana);
        slops.push(...vecinos.valores);
        fuentesVecinos = vecinos.fuentes;
      }
      const minimo = Math.max(GAP_MINIMO_R32, 2 * Math.max(10, ...(slops.length ? slops : [10])));

      // ③ la separación LEGIBLE: gap por token de spacing en la ventana
      const gaps = [...ventana.matchAll(/gap:\s*spacing\[(\d+(?:\.\d+)?)\]/g)].map((m) => SPACING_R32[m[1]] ?? 0);
      const mayor = gaps.length ? Math.max(...gaps) : null;
      if (mayor === null) {
        fallos.push(
          `${path}:${i + 1} — la campana está montada y su ventana (±${VENTANA_R32}) NO declara ningún \`gap: spacing[...]\`: la separación de zonas táctiles no es legible estáticamente, y este es el único número de su lámina que NO se ve en una captura (L-197: sin medir no hay verde — declarala como gap en la fila que la porta, spacing[5]+)`,
        );
      } else if (mayor < minimo) {
        fallos.push(
          `${path}:${i + 1} — el gap de la esquina es ${mayor}dp y el mínimo es ${minimo}dp (2 × hitSlop ${Math.max(10, ...(slops.length ? slops : [10]))}): dos zonas táctiles a menos de eso se pisan, el toque abre lo que no era y la persona cree que se equivocó ella (lámina de la esquina, número congelado)${fuentesVecinos.length > 0 ? ` · hitSlop resuelto por árbol: ${fuentesVecinos.join(' · ')}` : ''}`,
        );
      }
    });
  }
  return {
    fallos,
    info: `${montajes} montaje(s) de campana en apps (las esquinas vivas de C y D) · ventana ±${VENTANA_R32} (gap/absoluto) · mínimo 2×hitSlop con vecinos EXTRAÍDOS resueltos por árbol de montaje (S89-B, piso ${GAP_MINIMO_R32})`,
  };
}

/** R33 · LA SUPERFICIE DE LA HUELLA SE DECLARA (S89 — nacida del defecto
 *  REAL que el paquete del gate censó y la orden 2 mandó curar:
 *  `techo-oficio.tsx` montaba `forma="huella"` SIN `superficie`, y en el
 *  prestador claro `accent.active` ES el hex del muro (tealDark ≡
 *  tealDark, 1.00) — **la huella era invisible exactamente en su lugar
 *  firmado, y el olvido no rompía nada ni se veía** (familia L-192; en
 *  oscuro se salvaba de rebote, por eso ningún ojo lo vio).
 *
 *  LA REGLA: en APPS, todo montaje de `forma="huella"` DECLARA su
 *  `superficie` — `"muro"` sobre el techo saturado · `"clara"` A
 *  PROPÓSITO sobre papel. El default de la pieza queda para la galería y
 *  los usos internos de ui (fuera de este corpus a propósito): lo que
 *  esta regla mata es el DEFAULT SILENCIOSO en una pantalla, que es
 *  exactamente el olvido que no se ve.
 *
 *  LÍMITE DECLARADO: lee el span del tag hasta su primer `>` — un
 *  atributo con `=>` adentro lo truncaría (hoy: cero casos en los dos
 *  montajes vivos).
 *
 *  ☠️ CONDICIÓN DE MUERTE: si `Badge` vuelve `superficie` OBLIGATORIA en
 *  el tipo cuando `forma="huella"`, el tsc cubre esto y la regla se
 *  retira con lápida. */
function r33(archivos) {
  const fallos = [];
  let montajes = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    for (const m of limpio.matchAll(/<Badge\b[^>]*forma=["']huella["'][^>]*>/g)) {
      montajes++;
      if (!/\bsuperficie\s*=/.test(m[0])) {
        const linea = limpio.slice(0, m.index).split('\n').length;
        fallos.push(
          `${path}:${linea} — \`forma="huella"\` SIN \`superficie\` declarada: el default 'clara' pinta accent.active, que sobre el muro claro del prestador ES el hex del muro — la huella desaparece en su lugar firmado y nada lo dice (el defecto real que la orden 2 de S89 curó; declarála: "muro" sobre el techo saturado, "clara" a propósito sobre papel)`,
        );
      }
    }
  }
  return {
    fallos,
    info: `${montajes} montaje(s) de forma="huella" en apps — la superficie se DECLARA (el default silencioso mató una huella en S89)`,
  };
}

/**
 * R34 (S92-BIS) — UNA LISTA DE TRES ESTADOS NO SE DECIDE POR EL LARGO.
 *
 * ── QUÉ LA PARIÓ, con su fecha ──────────────────────────────────────────────
 * El 9-ago-2026 el founder no pudo reservar un paseo: el último paso le decía
 * *«tu hogar todavía no tiene un perro registrado»* **con dos perros vivos
 * adentro**. El motor estaba sano —el guard `mascota_no_elegible` devolvía
 * `true`— y los permisos intactos. Lo que fallaba era la PANTALLA:
 *
 *   `ofrecibles()` devuelve `[]` en TRES situaciones distintas —«todavía no
 *   llegó el catálogo», «no pudo llegar» y «llegó y no hay perros»— y
 *   `elegibles.length === 0` **las confunde a las tres**, así que a dos de
 *   ellas les contestaba una frase falsa.
 *
 * ── POR QUÉ ESTE LINT Y NO UNA LEY ESCRITA ──────────────────────────────────
 * **La advertencia YA ESTABA ESCRITA**, en el header de la lib que ese mismo
 * archivo importa: *«la pantalla distingue ese vacío del vacío real mirando la
 * fase, jamás el largo: "no tenés mascotas elegibles" y "todavía no sé" son dos
 * frases distintas y una de las dos sería mentira»*. Cuatro pantallas la
 * cumplieron y una no, y **nada lo detectó durante meses**. *Una ley sin
 * instrumento se olvida — y ésta ya se olvidó una vez.*
 *
 * ── ALCANCE, declarado ──────────────────────────────────────────────────────
 * Vigila la familia donde el defecto MORDIÓ: el resultado de `ofrecibles(...)`.
 * No intenta cazar toda lista vacía del repo —eso da falsos positivos y un lint
 * que grita de más se apaga—. La clase completa queda censada en la deuda.
 */
function r34(archivos) {
  const fallos = [];
  let decisiones = 0;
  for (const { path, src } of archivos) {
    const nombres = [...src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*ofrecibles\s*\(/g)].map((m) => m[1]);
    if (nombres.length === 0) continue;

    /**
     * ⚠️ SE RECORRE EL ARCHIVO ORIGINAL, LÍNEA POR LÍNEA, y no el texto sin
     * comentarios. La v1 decidía sobre `sinComentarios(src)` y NUMERABA sobre
     * ese mismo texto: como quitar comentarios CORRE las líneas, los seis
     * primeros hallazgos apuntaron a líneas que no eran (una señalaba un
     * `conFoto.length > 0` inocente). *Un lint que manda a mirar el lugar
     * equivocado gasta la confianza que necesita para que lo miren.*
     */
    const lineas = src.split('\n');
    let enBloque = false;
    for (let i = 0; i < lineas.length; i++) {
      const cruda = lineas[i];
      const t = cruda.trim();
      if (enBloque) {
        if (t.includes('*/')) enBloque = false;
        continue;
      }
      if (t.startsWith('/*')) {
        if (!t.includes('*/')) enBloque = true;
        continue;
      }
      if (t.startsWith('//') || t.startsWith('*')) continue;

      for (const nombre of nombres) {
        /**
         * SOLO «no hay ninguno»: `=== 0` y `< 1`. La v2 incluía `=== 1` y
         * marcó como fallo un `if (elegibles.length === 1) elegirSola()`, que
         * es **sano**: preguntar «¿hay exactamente una?» no afirma ausencia, y
         * si la fase no llegó la lista está vacía y ese `if` simplemente no
         * entra. *Un lint que marca lo correcto enseña a ignorarlo.*
         */
        const re = new RegExp(`(^|[^.\\w])${nombre}\\.length\\s*(===\\s*0|<\\s*1)\\b`);
        if (!re.test(cruda)) continue;
        decisiones++;
        // la fase tiene que estar en la MISMA sentencia…
        const enLinea = /\.fase\s*(===|!==)|'listo'|'cargando'|'error'/.test(cruda);
        // …o en un guard que corta ANTES, en las 12 líneas previas
        const previas = lineas.slice(Math.max(0, i - 12), i).join('\n');
        const enGuard = /\.fase\s*(===|!==)\s*'(cargando|error|listo)'/.test(previas);
        if (!enLinea && !enGuard) {
          fallos.push(
            `${path}:${i + 1} — decide sobre \`${nombre}\` por el LARGO y sin mirar la FASE: \`ofrecibles()\` devuelve [] mientras carga, si falla Y si de verdad no hay — las tres cosas no se le dicen igual a una persona (el 9-ago esto le dijo al founder que no tenía perros, con dos perros vivos)`,
          );
        }
      }
    }
  }
  /* ═══ BRAZO B (S92-BIS, 9-ago — EL P0 REABIERTO) ════════════════════════
   *
   * ⚠️ ESTE BRAZO EXISTE PORQUE EL BRAZO A NO ALCANZÓ, y la prueba es que
   * **el bug volvió con la cura puesta y publicada**. El brazo A vigila el
   * resultado de `ofrecibles()`; el defecto se mudó **un piso más arriba**, a
   * la lista que ALIMENTA a `ofrecibles`:
   *
   *   const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);   // ← []
   *   const estado = await getEstadoOnboardingDueno();
   *   if (!vigente || !estado.ok || !estado.data.familia_id) return;    // ← mudo
   *   const r = await obtenerMascotasDeFamilia(...);
   *   if (!vigente || !r.ok) return;                                    // ← mudo
   *   setMascotas(r.data);
   *
   * Si cualquiera de esos `return` dispara, la lista queda en `[]` **para
   * siempre y sin decir nada**. Y como el catálogo es público y rápido, la
   * fase llega a `listo` igual ⇒ el brazo A ve un guard de fase correcto y
   * pasa, mientras la pantalla afirma que el hogar no tiene perros.
   *
   * ── LA REGLA, dicha en una línea ─────────────────────────────────────────
   * **Una lista que se llena desde la red no puede arrancar en `[]`**: tiene
   * que modelar sus tres estados, como ya hace `paseo/index.tsx`
   * (`useState<T[] | 'cargando' | 'error'>('cargando')`).
   *
   * ── EL ALCANCE, ACOTADO A PROPÓSITO Y CON SU MEDICIÓN ────────────────────
   * La v1 de este brazo marcaba **toda** lista de red que arrancara en `[]`, y
   * al correrla dio **31 fallos en las dos apps**. Ese número es un dato y va
   * a deuda —la clase es ancha de verdad—, pero **no puede ser el lint**: la
   * mayoría no es el defecto (un autocomplete de direcciones que arranca vacío
   * es correcto), y *un lint que enciende 31 rojos de golpe se apaga, y un lint
   * apagado no protege nada*. Es la misma trampa que el header del brazo A ya
   * nombra.
   *
   * Así que vigila **la familia donde el vacío se convierte en una AFIRMACIÓN
   * sobre el hogar de alguien**: las listas que se llenan con
   * `obtenerMascotasDeFamilia`. Ahí el `[]` no es «no muestro nada» — es *«no
   * tenés un perro registrado»*, dicho a alguien que tiene dos.
   *
   * El escape es explícito y barato: que el fallo TENGA VOZ. Vale
   * `setX('error')` (las fases) o un registro de fallo que la pantalla pinte
   * —`sumarFallo(...)`, como ya hace `hogar/adiestramiento.tsx`—. La regla no
   * exige una forma: exige que el fallo se pueda decir. */
  let listasDeHogar = 0;
  for (const { path, src } of archivos) {
    /* ⚠️ SE ATA LA LISTA A SU FUENTE, y no alcanza con que el archivo mencione
       el lector. La v2 marcaba cualquier lista vacía de un archivo que
       nombrara `obtenerMascotasDeFamilia`, y encendió `ofertaPublica` y
       `vocabulario` —dos listas que no son de mascotas— en pantallas sanas.
       *Dos falsos positivos alcanzan para que nadie vuelva a leer el lint.*
       Ahora se captura la variable que RECIBE la respuesta y solo se acusa al
       setter que se llena con ella. */
    /* Y además PROXIMIDAD, porque atar por nombre tampoco alcanzó: `r` es un
       nombre universal, y `setOfertaPublica(r.data)` de un `.then((r) => …)`
       en la línea 96 se leía como si viniera del `await` de la 136 — otro
       scope, otra pantalla, rojo falso. Se exige que el `setX(<var>.data)`
       viva DENTRO de las 15 líneas siguientes al await, que es el alcance real
       de ese bloque. */
    const lineasArchivo = src.split('\n');
    const receptoras = [];
    for (let i = 0; i < lineasArchivo.length; i++) {
      const m = /(?:const|let)\s+(\w+)\s*=\s*await\s+obtenerMascotasDeFamilia\s*\(/.exec(lineasArchivo[i]);
      if (m !== null) receptoras.push({ nombre: m[1], cerca: lineasArchivo.slice(i, i + 15).join('\n') });
    }
    if (receptoras.length === 0) continue;
    // `const [X, setX] = useState<...[]>([])` — lista que nace vacía
    for (const m of src.matchAll(/const\s*\[\s*(\w+)\s*,\s*(set\w+)\s*\]\s*=\s*useState<[^>]*\[\]>\(\[\]\)/g)) {
      const [, nombre, setter] = m;
      // ¿se llena con la respuesta DE ESE lector? (`setX(r.data)` con r = await …)
      const seLlenaDelHogar = receptoras.some((r) =>
        new RegExp(`${setter}\\(\\s*(?:\\w+\\.ok\\s*\\?\\s*)?${r.nombre}\\.data\\b`).test(r.cerca),
      );
      if (!seLlenaDelHogar) continue;
      listasDeHogar++;
      /* ⚠️ `'error'` EN CUALQUIER PARTE DEL ARGUMENTO, y no pegado al paréntesis.
         La v3 exigía `setX('error'` literal y **no reconocía
         `setX(r.ok ? r.data : 'error')`** — que es el patrón canónico de la
         casa, el que usa `paseo/index.tsx` y el que se acaba de escribir en
         `disponibles.tsx`. *El guard habría marcado en rojo la pantalla que lo
         hace bien.* Lo destapó probar el brazo EN ROJO antes de confiar en él
         (L-216): con el fixture ya curado, la auto-prueba no gritó
         «decorativo» porque el fixture seguía fallando… por el motivo
         equivocado. */
      const tieneFases = new RegExp(`${setter}\\([^)]*'error'`).test(src);
      const tieneRegistroDeFallo = /sumarFallo\s*\(/.test(src);
      if (!tieneFases && !tieneRegistroDeFallo) {
        fallos.push(
          `${path} — \`${nombre}\` se llena con \`obtenerMascotasDeFamilia\` y arranca en \`[]\`, sin ningún \`${setter}('error')\` ni registro de fallo: si la lectura falla, la lista queda vacía EN SILENCIO y la pantalla lee ese vacío como «no tenés mascotas». Modelá las tres fases como \`paseo/index.tsx\`: \`useState<T[] | 'cargando' | 'error'>('cargando')\` (el 9-ago esto le dijo al founder que no tenía perros — DOS VECES, la segunda con la primera cura ya publicada)`,
        );
      }
    }
  }

  return {
    fallos,
    info: `${decisiones} decisión/es sobre el resultado de ofrecibles() + ${listasDeHogar} lista(s) del hogar que arrancan vacías — todas tienen que poder decir que fallaron`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   LAS CUATRO REGLAS DEL NORTE (S97+-B — mesa del 13-ago)

   POR QUÉ EXISTEN, y es la razón por la que se escriben ANTES de tocar
   una pantalla: el Norte tiene diez artículos y **cuatro son medibles
   por máquina** (el ritmo · el radio · el separador · la escala). Los
   otros seis son juicio. Mecanizar los cuatro es lo que permite que C y
   D construyan sin pedir gate por pieza: lo que un lint puede verificar
   va masivo y el founder NO lo mira (la regla de la mesa, S81).

   LOS CUATRO SON RATCHET, JAMÁS DUROS EN 0, y eso es una decisión con
   número: el corpus vivo tiene 36 espaciados crudos, 21 radios crudos,
   6 pantallas sobre el presupuesto de separadores y 6 sobre el de
   tamaños. Nacer en 0 pondría el hook en rojo para las tres pistas en
   pleno ciclo — y un guard que le frena el commit a todo el mundo se
   desarma el mismo día. Nacen en su número MEDIDO: lo viejo queda
   VISIBLE en cada corrida y **lo nuevo no puede entrar**.
   ═══════════════════════════════════════════════════════════════════ */

/** R36 · N2 · EL RITMO — el espaciado sale del TOKEN.
 *
 *  🔴 LO QUE ESTA REGLA **NO** MIDE, y es el hallazgo que la formó: el
 *  Norte dice *«todo espaciado múltiplo de 8 (4 solo para pares
 *  íntimos)»*, y **mecanizar eso literal pondría en rojo la escala
 *  firmada de la casa**: `spacing` tiene 4·6·10·12·20·28, todos legales
 *  y usadísimos desde v3.1. Un lint que exige múltiplos de 8 declara
 *  ilegal medio sistema de tokens.
 *
 *  ⇒ La regla mide lo que el Norte de verdad quiere y el token ya
 *  habilita: **que nadie re-decida el ritmo a mano.** Los números del
 *  Norte (32 entre secciones · 16 entre tarjetas · 16-20 de padding ·
 *  24 sobre el título) son EXACTAMENTE `spacing[8]`, `spacing[4]`,
 *  `spacing[4|5]` y `spacing[6]` — cumplir N2 y salir del token son la
 *  misma acción. El múltiplo de 8 gobierna la COMPOSICIÓN, que es
 *  juicio de gate; el crudo es lo mecanizable.
 *
 *  Se reporta APARTE el crudo que ni siquiera coincide con un valor de
 *  la escala: ése no es "el token escrito a mano", es un número
 *  inventado, y son dos defectos distintos. */
const VALORES_SPACING = new Set([0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128]);
const RE_ESPACIADO = /\b(padding|margin|gap|rowGap|columnGap)(?:Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)?\s*:\s*(\d+)\b/g;
function r36(archivos) {
  const fallos = [];
  let crudos = 0, fueraDeEscala = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    let enArchivo = 0;
    for (const m of limpio.matchAll(RE_ESPACIADO)) {
      const v = Number(m[2]);
      crudos++; enArchivo++;
      if (!VALORES_SPACING.has(v)) fueraDeEscala++;
    }
    if (enArchivo > 0) porArchivo.push(`${path}: ${enArchivo}`);
  }
  if (crudos > BASELINE_R36)
    fallos.push(
      `N2 (el ritmo): ${crudos} espaciado(s) con número crudo (baseline ${BASELINE_R36}) — el ritmo sale de \`spacing\`, jamás de un número por pantalla. Los valores del Norte YA son tokens: 32=spacing[8] · 24=spacing[6] · 16=spacing[4] · 20=spacing[5]:\n    ${porArchivo.join('\n    ')}`,
    );
  fallos.push(...ancla('R36', archivos.length, MINIMOS_CORPUS.apps, 'archivo(s) de apps'));
  return {
    fallos,
    info: `${crudos}/${BASELINE_R36} crudos · ${fueraDeEscala} fuera de la escala de \`spacing\`${crudos < BASELINE_R36 ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R37 · N4 · EL RADIO ÚNICO — una sola escala, la de `radius`.
 *
 *  LO QUE ENCONTRÓ AL MEDIRSE, antes de existir (por eso se mide antes
 *  de curar): **13 píldoras escritas `borderRadius: 999`** cuando el
 *  token de la casa es `radius.full` = **9999**. Las dos clampean igual
 *  y por eso nadie lo vio nunca — *el defecto no es visual, es que la
 *  píldora de la casa dejó de tener un solo dueño*. Y **8 valores que
 *  no existen en ninguna escala**: 2 · 5 · 22 · 36.
 *
 *  Los dos se cuentan APARTE a propósito. La píldora a mano es un token
 *  re-tecleado (cura mecánica, cero cambio visual); el 22 y el 36 son
 *  geometría inventada, y ésos SÍ cambian el dibujo al curarse ⇒ su
 *  cura es de gate, no de reemplazo. Un número que mezcla las dos
 *  esconde justo cuál se puede pagar barato. */
const VALORES_RADIUS = new Set([0, 4, 8, 10, 12, 16, 20, 24, 9999]);
const RE_RADIO = /\bborderRadius(?:TopLeft|TopRight|BottomLeft|BottomRight)?\s*:\s*(\d+)\b/g;
function r37(archivos) {
  const fallos = [];
  let crudos = 0, pildoraAMano = 0, inventados = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    let enArchivo = 0;
    for (const m of limpio.matchAll(RE_RADIO)) {
      const v = Number(m[1]);
      crudos++; enArchivo++;
      if (v >= 100) pildoraAMano++;
      else if (!VALORES_RADIUS.has(v)) inventados++;
    }
    if (enArchivo > 0) porArchivo.push(`${path}: ${enArchivo}`);
  }
  if (crudos > BASELINE_R37)
    fallos.push(
      `N4 (el radio único): ${crudos} borderRadius con número crudo (baseline ${BASELINE_R37}) — la casa tiene UNA escala de radios (\`radius\`): 4·8·10·12·16·20·24·full. La píldora es \`radius.full\` (9999), jamás un 999 tecleado:\n    ${porArchivo.join('\n    ')}`,
    );
  fallos.push(...ancla('R37', archivos.length, MINIMOS_CORPUS.apps, 'archivo(s) de apps'));
  return {
    fallos,
    // LOS 3 QUE QUEDAN ESTÁN IDENTIFICADOS UNO POR UNO — se nombran acá
    // para que nadie los vuelva a auditar desde cero cada vez que lea el
    // reporte: **1 es LETRA FIRMADA y 2 son decisión del founder.**
    //  · `hogar/index:1259` → 36 en un 112×112 con `borderCurve:
    //    continuous` = **el SQUIRCLE 32% firmado en S53** (36/112 =
    //    32,1%). NO es un desvío: es la ley aplicada, y por eso no se
    //    "cura". Vive acá porque el ratchet cuenta números crudos, no
    //    intenciones.
    //  · `mascotas:426` y `:480` → 2 en un 9×9. La escala salta de 0 a 4
    //    y en un cuadrado de 9px esa diferencia SE VE ⇒ decisión del
    //    founder, no reemplazo mecánico.
    info: `${crudos}/${BASELINE_R37} crudos · ${pildoraAMano} píldora(s) a mano (radius.full es 9999) · ${inventados} fuera de toda escala${crudos < BASELINE_R37 ? ' — BAJÓ: actualizar baseline' : ''} · los 3 del piso: 1 squircle FIRMADO (S53) + 2 esquinas de 9px a firma`,
  };
}

/** R38 · N3 · LA MUERTE DEL SEPARADOR — presupuesto de 3 por pantalla.
 *
 *  «Entre secciones separa el espacio + el título» (N3). La línea se
 *  reserva para listas densas de datos, y el Norte le pone número:
 *  **máximo 3 por pantalla**. Ese techo es lo mecanizable de N3 — que
 *  la línea sea "de lista densa" es juicio, y el juicio es de gate.
 *
 *  ⚠️ EL CORPUS EXCLUYE LA GALERÍA A PROPÓSITO: `TokenGallery` monta
 *  **16** separadores y está bien que lo haga — su trabajo es exhibir
 *  piezas en fila, no componer una pantalla de producto. Meterla al
 *  corpus daría un rojo permanente sobre el único archivo cuyo oficio
 *  es tener muchos de todo. (Es el mismo criterio con el que R35 mira
 *  la galería para el color y no para la composición.) */
function r38(archivos) {
  const fallos = [];
  const excedidas = [];
  for (const { path, src } of archivos) {
    const n = (sinComentarios(src).match(/<Separador\b/g) ?? []).length;
    if (n > PRESUPUESTO_SEPARADORES) excedidas.push(`${path}: ${n}`);
  }
  if (excedidas.length > BASELINE_R38)
    fallos.push(
      `N3 (la muerte del separador): ${excedidas.length} pantalla(s) sobre el presupuesto de ${PRESUPUESTO_SEPARADORES} (baseline ${BASELINE_R38}) — entre secciones separan el ESPACIO y el TÍTULO, no la línea:\n    ${excedidas.join('\n    ')}`,
    );
  fallos.push(...ancla('R38', archivos.length, MINIMOS_CORPUS.apps, 'archivo(s) de apps'));
  return {
    fallos,
    info: `${excedidas.length}/${BASELINE_R38} pantalla(s) sobre el presupuesto de ${PRESUPUESTO_SEPARADORES}${excedidas.length < BASELINE_R38 ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R39 · N1 · LA ESCALA — máximo tres tamaños tipográficos por pantalla.
 *
 *  QUÉ MIDE EXACTAMENTE, y la distinción es el corazón de la regla:
 *  cuenta los `typography.size.*` **distintos** que una pantalla escribe
 *  A MANO. Una pantalla que compone con `<Texto variante="…">` da CERO
 *  y no aparece nunca — y eso es correcto, no un hueco: `Texto` ES el
 *  portador de la jerarquía (S71), y su receta ya está firmada adentro.
 *  Lo que N1 combate no es tener cuatro tamaños: es que la jerarquía se
 *  **re-decida en cada pantalla**, que es literalmente el problema por
 *  el que `Texto` nació.
 *
 *  ⇒ Un archivo que sube en esta regla tiene una cura ya construida:
 *  montar `Texto`. Por eso el rojo es accionable y no una queja. */
const PRESUPUESTO_TAMANOS = 3;
const RE_SIZE = /\btypography\.size\.(\w+)\b|\btypography\.size\['([^']+)'\]|\bsize\.(xs|sm|base|md|lg|xl|hero|display)\b|\bsize\['(2xl|3xl|4xl)'\]/g;
function r39(archivos) {
  const fallos = [];
  const excedidas = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    const usados = new Set();
    for (const m of limpio.matchAll(RE_SIZE)) usados.add(m[1] ?? m[2] ?? m[3] ?? m[4]);
    if (usados.size > PRESUPUESTO_TAMANOS) excedidas.push(`${path}: ${usados.size} (${[...usados].join(', ')})`);
  }
  if (excedidas.length > BASELINE_R39)
    fallos.push(
      `N1 (la escala): ${excedidas.length} pantalla(s) escriben más de ${PRESUPUESTO_TAMANOS} tamaños a mano (baseline ${BASELINE_R39}) — la jerarquía la porta \`Texto\`, no la pantalla:\n    ${excedidas.join('\n    ')}`,
    );
  fallos.push(...ancla('R39', archivos.length, MINIMOS_CORPUS.apps, 'archivo(s) de apps'));
  return {
    fallos,
    info: `${excedidas.length}/${BASELINE_R39} pantalla(s) sobre el presupuesto de ${PRESUPUESTO_TAMANOS} tamaños a mano${excedidas.length < BASELINE_R39 ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R40 · EL PLACEHOLDER NO SE EMBARCA EN SILENCIO (pedido de D, S97+).
 *
 *  EL CASO: `equipo.adminAvisoPENDIENTE` — el aviso §6 del toggle
 *  Administrador espera la SEGUNDA FIRMA del founder y su literal no lo
 *  escribe ninguna pista. D midió que **nada lo frenaba**: ni este lint
 *  ni ningún hook. Su frase, que es el porqué entero de la regla:
 *
 *    *«Un placeholder que puede embarcarse en silencio no está listo
 *     para recibir la firma: está listo para escaparse.»*
 *
 *  POR QUÉ VIVE ACÁ Y NO EN EL GUARD DE D, que era la pregunta abierta
 *  de su pedido: **`verify:diseno` ya vigila diccionarios de i18n** —R11
 *  mira `vozCardM*` contra el vocabulario de score de LOYALTY §3—, así
 *  que el corpus y el precedente ya existen. Meterla en otro instrumento
 *  sería un segundo lugar donde mirar lo mismo.
 *
 *  LOS DOS BRAZOS, y el segundo es el que D pidió con más razón:
 *   ① el CONTADOR solo-baja — si aparece otro placeholder sin
 *      declararlo, rojo.
 *   ② la PARIDAD es↔en por app — *«un idioma que recibe la firma y el
 *      otro no es la falla real»*. Ese es el modo de falla que un
 *      contador global no ve: dos archivos, uno curado y otro no, suman
 *      lo mismo que dos sin curar.
 *
 *  ☠️ MUERE SOLA: cuando llegue el literal firmado, la clave se renombra
 *  a `adminAviso`, el contador baja a 0 y esta regla se retira ENTERA
 *  (Ley 37). No es un guard permanente: es la correa de UN placeholder. */
const BASELINE_R40 = 1;
const RE_PENDIENTE = /^\s*([A-Za-z0-9_]*PENDIENTE)\s*:/gm;
function r40(dics) {
  const fallos = [];
  const porApp = new Map();
  for (const { path, src } of dics) {
    const app = path.includes('/cliente/') ? 'cliente' : 'prestador';
    const idioma = /\/en\.ts$/.test(path) ? 'en' : 'es';
    const claves = new Set([...sinComentarios(src).matchAll(RE_PENDIENTE)].map((m) => m[1]));
    if (!porApp.has(app)) porApp.set(app, {});
    porApp.get(app)[idioma] = claves;
  }
  const todas = new Set();
  for (const [app, { es, en }] of porApp) {
    // ② PARIDAD — el brazo que un contador global no puede ver.
    const soloEs = [...(es ?? [])].filter((k) => !(en ?? new Set()).has(k));
    const soloEn = [...(en ?? [])].filter((k) => !(es ?? new Set()).has(k));
    for (const k of soloEs)
      fallos.push(`R40: \`${k}\` está en ${app}/es.ts y NO en en.ts — un idioma recibió la firma y el otro no. El placeholder se retira de LOS DOS o de ninguno.`);
    for (const k of soloEn)
      fallos.push(`R40: \`${k}\` está en ${app}/en.ts y NO en es.ts — mismo caso, del otro lado.`);
    for (const k of [...(es ?? []), ...(en ?? [])]) todas.add(`${app}.${k}`);
  }
  // ① CONTADOR solo-baja (claves DISTINTAS, no ocurrencias: una clave en
  //    dos idiomas es UN placeholder, no dos).
  if (todas.size > BASELINE_R40)
    fallos.push(
      `R40: ${todas.size} placeholder(s) *PENDIENTE (baseline ${BASELINE_R40}) — un texto sin firma que puede embarcarse en silencio no está esperando la firma, se está escapando:\n    ${[...todas].join('\n    ')}`,
    );
  // ANCLA: sin los cuatro diccionarios la regla informaría "0
  // placeholders" en VERDE habiendo leído nada.
  fallos.push(...ancla('R40', dics.length, 4, 'diccionario(s) es/en de las dos apps'));
  return {
    fallos,
    info: `${todas.size}/${BASELINE_R40} placeholder(s) sin firma${todas.size < BASELINE_R40 ? ' — BAJÓ: la firma llegó, retirar la regla (Ley 37)' : ''} · paridad es↔en verificada en ${porApp.size} app(s)`,
  };
}
const DICS_R40 = [
  'apps/cliente/src/i18n/es.ts',
  'apps/cliente/src/i18n/en.ts',
  'apps/prestador/src/i18n/es.ts',
  'apps/prestador/src/i18n/en.ts',
].map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));

/** R41 · LO QUE SE MUEVE DE VERDAD MIRA `useReducedMotion` (S98-B).
 *
 *  EL PORQUÉ, y no es una regla de accesibilidad genérica: quien activa
 *  «reducir movimiento» en su teléfono lo hace porque el movimiento le
 *  produce un síntoma —mareo, náusea—, no porque le guste menos. Y esta
 *  casa lo cumplía en **4 de 63 piezas**: el portador de la entrada de
 *  toda la app lo ignoraba hasta la sesión pasada, y **la única
 *  animación en LOOP de la casa** hasta ésta.
 *
 *  🔴 QUÉ CUENTA COMO «MOVERSE DE VERDAD», que es la parte fina — porque
 *  una regla que exigiera el hook a TODO lo animado sería ruido y se
 *  terminaría silenciando:
 *   · `withRepeat`/`withDecay`/`withSpring` → SIEMPRE. Loop, inercia y
 *     rebote son movimiento autónomo por definición.
 *   · las entradas con DESPLAZAMIENTO (`FadeInDown`, `SlideIn`, `ZoomIn`,
 *     `BounceIn`, `FlipIn`) → SIEMPRE.
 *   · `withTiming` → **solo si el archivo también toca `transform`**. Un
 *     `withTiming` sobre `opacity` es un FUNDIDO, y **un fundido puro ya
 *     es aquello a lo que la preferencia degrada**: exigirle el hook
 *     sería pedirle que se proteja de sí mismo.
 *
 *  ⚡ ESA ÚLTIMA CLÁUSULA NO ES TEÓRICA: es `VisorFoto`, medida —CERO
 *  `transform` en todo el archivo, solo `opacity`—. Su header declaraba
 *  «SOLO FADES» desde S45 y era cierto. *La regla mecaniza el criterio
 *  con el que se lo eximió, en vez de dejarlo como excepción recordada.*
 *
 *  ⚠️ LO QUE **NO** VIGILA, declarado: el gesto de PRESIÓN
 *  (`usePresionado`, las `transitionProperty` de RN-web). Eso es
 *  manipulación directa —el elemento responde al dedo mientras el dedo
 *  está ahí—, no animación autónoma, y entra en la exención de siempre.
 *
 *  ☠️ CONDICIÓN DE MUERTE: si algún día el hook se resuelve una sola vez
 *  arriba y baja por contexto (como `theme`), esta regla pierde objeto y
 *  la retira quien haga ese cambio. */
const MUEVE_SIEMPRE = /withRepeat|withDecay|withSpring|FadeInDown|FadeInUp|FadeInLeft|FadeInRight|SlideIn[A-Za-z]*|ZoomIn[A-Za-z]*|BounceIn[A-Za-z]*|FlipIn[A-Za-z]*/;
const BASELINE_R41 = 0;
function r41(archivos) {
  const fallos = [];
  let mueven = 0;
  for (const { path, src } of archivos) {
    const desplaza = /withTiming/.test(src) && /transform|translateX|translateY|scale:|rotate/.test(src);
    if (!MUEVE_SIEMPRE.test(src) && !desplaza) continue;
    mueven++;
    if (/useReducedMotion/.test(src)) continue;
    fallos.push(
      `R41: ${path} MUEVE y no mira \`useReducedMotion\` — quien pide menos movimiento lo pide por un síntoma, no por gusto. La receta de la casa está escrita y firmada: se comparte brazo con memorial (fade puro, MISMO tempo y mismo escalón — reducir movimiento es quitarle el VIAJE, no el momento). Y el hook se llama SUELTO y se combina después: \`memorial || useReducedMotion()\` es una llamada condicional a un hook.`,
    );
  }
  if (fallos.length > BASELINE_R41)
    fallos.push(`R41: ${fallos.length} pieza(s) sobre el baseline ${BASELINE_R41}.`);
  // ANCLA: si el corpus se rompe o los nombres de las APIs cambian, la
  // regla no encontraría NADA que mueva y su verde significaría «no miré»
  // en vez de «está todo cubierto» (L-192).
  fallos.push(...ancla('R41', mueven, 6, 'pieza(s) de `ui` que se mueven de verdad'));
  return {
    fallos,
    info:
      fallos.length === 0
        ? `${mueven} pieza(s) mueven · ${mueven} declaran el hook · los fundidos puros quedan exentos POR MEDICIÓN (VisorFoto: 0 transform)`
        : `${fallos.length} fallo(s)`,
  };
}

/** R42 · LA PUERTA DE LA FOTO NO SE RE-DIBUJA (S99-B — `HojaCaptura`
 *  mecanizada el día que nació, misma disciplina que R25 y R30).
 *
 *  EL DEFECTO QUE VIGILA, con su número medido y no estimado: el PICKER
 *  nunca se duplicó —`capturaFoto` es una sola implementación—, pero la
 *  PUERTA («Tomar foto / Elegir de la galería») estaba escrita a mano en
 *  **diez lugares**. Y lo que la vuelve defecto en vez de prolijidad:
 *
 *   ⚠️ **EL CERROJO CONTRA EL DOBLE TAP VIVÍA EN 2 DE LOS 10 — y los 2
 *      eran los que ya eran pieza.** Los ocho de `apps/` lanzan DOS
 *      pickers si el dedo llega dos veces antes del próximo render.
 *
 *  *Un sitio que copia una anatomía copia lo que se VE; el cerrojo no se
 *  ve.* Por eso la cura no es revisar ocho archivos: es que el noveno no
 *  pueda nacer.
 *
 *  QUÉ MIRA, y por qué ESTE net: importar **las dos** funciones de
 *  captura en el mismo archivo es la huella dactilar de estar armando el
 *  menú de dos opciones — nadie necesita cámara Y galería juntas para
 *  otra cosa. Pedir "un `<Hoja>` con dos `<Boton>`" daría los mismos
 *  archivos con más ruido y con falsos donde la hoja tiene otra forma.
 *
 *  BASELINE NOMINAL SOLO-BAJA, con las diez y su razón. Las dos de `ui`
 *  NO son deuda de la misma clase que las ocho de `apps`:
 *   · `SelectorAvatar` — su hoja tiene TRES `Celda` y la tercera («Por
 *     ahora no») es decisión FIRMADA en S45. Absorberla es un gate de
 *     forma, no un refactor, y no viaja escondido.
 *   · `EvidenciaFoto` — no es un menú: la cámara es DIRECTA y la galería
 *     vive detrás de un mantenido. Otra interacción, otra pieza.
 *  Las ocho de `apps` bajan una por una cuando su lote las toque; **de
 *  cada baja hay que bajar también este baseline.** DE ACÁ NO SE SUBE:
 *  una puerta nueva a mano es roja el primer día. */
/* `CASA_PUERTA_FOTO` y `BASELINE_R42` viven ARRIBA, con los demás
   baselines: `FIXTURES` es un literal que se evalúa al cargar el módulo
   y su fixture de R42 los consume — declararlos acá los dejaba en la
   zona muerta del `const` (medido: `ReferenceError` en la primera
   corrida). El baseline se lee junto a su regla igual, por el puntero. */
function r42(archivos) {
  const fallos = [];
  let puertas = 0;
  let casa = 0;
  let baselineVivo = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    if (!/capturarConCamara/.test(limpio) || !/capturarDeGaleria/.test(limpio)) continue;
    if (path.endsWith('HojaCaptura.tsx')) { casa++; continue; }
    if (path.endsWith('capturaFoto.tsx')) continue; // la frontera las DEFINE
    puertas++;
    if (BASELINE_R42.has(path)) { baselineVivo++; continue; }
    fallos.push(
      `R42: ${path} — LA PUERTA DE LA FOTO RE-DIBUJADA. La hoja de «Tomar foto / Elegir de la galería» es UNA pieza: <HojaCaptura> de @epetplace/ui. Trae el CERROJO sincrónico contra el doble tap, que ocho de las diez copias a mano no tienen (dos toques = dos pickers). Las opciones de captura pasan derecho (recorteCuadrado/calidad/redimensionarA): la puerta no re-decide lo que cada dominio ya midió, y la voz del permiso denegado la dice la PANTALLA, no la pieza.`,
    );
  }
  if (baselineVivo < BASELINE_R42.size)
    fallos.push(
      `R42: el baseline declara ${BASELINE_R42.size} puerta(s) a mano y quedan ${baselineVivo} — BAJÓ: sacar de BASELINE_R42_CLASES la(s) que migraron (con su clase). Un baseline que sobra deja de ser una lista de deuda y pasa a ser un permiso.`,
    );
  // ANCLA: si la pieza pierde su llamada a las dos funciones (renombre,
  // refactor), esta regla vigila un fantasma y todo pasa en verde (L-192).
  fallos.push(...ancla('R42', casa, 1, `puerta canónica viva (${CASA_PUERTA_FOTO})`));
  return {
    fallos,
    info:
      `${puertas} puerta(s) a mano · baseline ${BASELINE_R42.size} = ` +
      `${Object.values(BASELINE_R42_CLASES).filter((r) => r.startsWith('CURABLE')).length} CURABLES · ` +
      `${Object.values(BASELINE_R42_CLASES).filter((r) => r.startsWith('BLOQUEADA')).length} BLOQUEADA (gate de forma) · ` +
      `${PISO_R42} LEGÍTIMA (no es deuda — el piso de esta regla es ${PISO_R42}, jamás 0). Solo-baja`,
  };
}

/** R43 · N11 · EL CONTORNO DEL CAMPO TIENE PISO, Y ES UN NÚMERO (S99-B).
 *
 *  N11 firmada: *«contorno visible **≥3:1** contra el fondo»*. Es la
 *  primera ley del Norte cuyo cumplimiento es **un número del tema**, así
 *  que se mecaniza sola — y hacía falta, porque **ninguno de los bordes
 *  que la casa ya tenía llegaba**: `border.default` **1.18** en claro y
 *  **1.28** en oscuro · `border.presente` **1.62** / **1.64**. *No es que
 *  estuvieran mal: separaban, y N11 pide contener.*
 *
 *  🔴 Y VIGILA ALGO QUE UN OJO NO VE: el día que alguien afine
 *  `campoBordeL` «un poquito más suave» porque le parece fuerte, el campo
 *  sigue **viéndose** — solo deja de cumplir. **Un piso que solo vive en
 *  una prosa se afloja sin que nada avise.**
 *
 *  QUÉ MIRA, y por qué contra `bg.base` y no contra el interior: la letra
 *  dice **«contra el fondo»**, y el fondo de la región de un formulario
 *  es la pantalla, no el relleno de la propia caja. Medir contra el
 *  interior daría números más altos y más cómodos — que es exactamente
 *  por qué no se mide así.
 *
 *  ⚠️ TIENE ANCLA: si los nombres de los tokens cambian y el regex deja
 *  de encontrarlos, la regla no mediría NADA y su verde significaría «no
 *  miré» (L-192). Exige encontrar los tres.
 *
 *  ── ⏬ S99-B · LA PARTICIÓN POR DUEÑO Y CURABILIDAD **NO APLICA ACÁ**,
 *  y se declara en vez de fabricarse ────────────────────────────────
 *  La orden de mesa la mandó hacia atrás sobre R42 **y R43**. En R42
 *  aplicó y encontró tres clases. **Acá no hay nada que partir, y decirlo
 *  es más honesto que inventar una tabla vacía:**
 *
 *  R42 y R44 llevan **un baseline: una lista de cosas PARADAS**, y ahí la
 *  mentira latente es real (*un número parado no dice si nadie lo tocó o
 *  si nadie PUEDE tocarlo*). **R43 no tiene baseline.** Sus tres números
 *  —3.34 · 3.40 · 3.34— **no son deuda parada: son la medición de que las
 *  tres casas CUMPLEN.** No hay entrada pendiente, no hay dueño ajeno, no
 *  hay nada bloqueado: si alguno bajara del piso, la regla se pone roja
 *  ese mismo día en vez de estacionarse en una lista.
 *
 *  ⇒ *Marcar como deuda un número que mide cumplimiento sería la misma
 *  clase de error que la orden viene a curar, al revés: una tabla de
 *  dueños sobre algo que nadie debe.* Precedente de la casa (S94-A):
 *  **cuatro de ocho choques del censo no eran letra obsoleta, y marcarlos
 *  habría sido peor que dejarlos.** */
const PISO_R43 = 3
/** Los pares (borde, fondo) de las tres casas. Los hex se LEEN de
 *  `palette.ts`; acá vive solo qué token va contra qué token. */
const PARES_R43 = [
  { casa: 'light', borde: 'campoBordeL', fondo: 'papelTapiz' },
  { casa: 'dark', borde: 'campoBordeD', fondo: 'tapizDark' },
  { casa: 'memorial', borde: 'campoBordeM', fondo: 'memorialDark0' },
]
function r43(fuentes) {
  const fallos = []
  /** Corpus PROPIO (patrón R27): `palette.ts` es `.ts` y el corpus de
   *  `ui` recorre solo `.tsx` — pedirlo por la lista lo dejaba fuera y
   *  la regla salía «sin corpus». Se pasa la fuente, como los temas. */
  const src = sinComentarios(fuentes.palette ?? '')
  const hexDe = (token) => {
    const m = src.match(new RegExp(`\\b${token}:\\s*'(#[0-9A-Fa-f]{6})'`))
    return m === null ? null : m[1]
  }
  const canal = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const lum = (h) => {
    const x = h.replace('#', '')
    return (
      0.2126 * canal(parseInt(x.slice(0, 2), 16)) +
      0.7152 * canal(parseInt(x.slice(2, 4), 16)) +
      0.0722 * canal(parseInt(x.slice(4, 6), 16))
    )
  }
  const ratio = (a, b) => {
    const [p, q] = [lum(a), lum(b)].sort((m, n) => n - m)
    return (p + 0.05) / (q + 0.05)
  }

  let medidos = 0
  const detalle = []
  for (const par of PARES_R43) {
    const borde = hexDe(par.borde)
    const fondo = hexDe(par.fondo)
    if (borde === null || fondo === null) {
      fallos.push(
        `R43: no se pudo leer ${borde === null ? par.borde : par.fondo} de palette.ts — token renombrado o movido. La regla dejaría de medir su casa en silencio, que es peor que un rojo.`,
      )
      continue
    }
    medidos++
    const v = ratio(borde, fondo)
    detalle.push(`${par.casa} ${v.toFixed(2)}`)
    if (v < PISO_R43)
      fallos.push(
        `R43: el contorno del campo en ${par.casa} da ${v.toFixed(2)}:1 contra el fondo — N11 pide ≥${PISO_R43}:1. La ley está firmada (DIRECCION_DISENO_S99 §N11) y su piso no se ablanda: si el borde se ve fuerte, la conversación es con la mesa, no con este número.`,
      )
  }
  // ANCLA: las tres casas o la regla no está mirando lo que dice mirar.
  fallos.push(...ancla('R43', medidos, 3, 'casa(s) con su par (contorno, fondo) medido'))
  return { fallos, info: `${detalle.join(' · ')} — piso ${PISO_R43}:1 (N11)` }
}

/** R44 · N12.4 · EL ERROR QUE NO DICE QUÉ ESTÁ MAL (S99-B).
 *
 *  N12.4 firmada: *«El error dice QUÉ está mal y CÓMO se arregla, con un
 *  ejemplo real. **"Campo inválido" está prohibido en toda la casa.**»*
 *
 *  QUÉ VIGILA: la voz que manda a *revisar* sin decir qué revisar. No es
 *  una regla de estilo — **es la diferencia entre un error que se puede
 *  arreglar y uno que solo se puede volver a intentar.**
 *
 *  🔴 Y NO ES HIPOTÉTICA: la casa ya la cobró antes de que existiera la
 *  ley. S75 registró que un rebote real iba a decir *«Revisá los datos»*
 *  hasta que su código entrara al diccionario de voces — o sea que este
 *  defecto ya se había visto de frente, y sin ley detrás no había con qué
 *  frenarlo.
 *
 *  BASELINE NOMINAL SOLO-BAJA, CON DUEÑO DECLARADO: **6, los seis en
 *  `apps/prestador` (3 `es` + 3 `en`), que NO es mi territorio.** Nacen
 *  declarados y pedidos, jamás curados por mí — el precedente es R35 en
 *  S96-B, que nació con baseline 1 y dueño y lo curó su dueño el mismo
 *  día. *La forma correcta de nacer de un ratchet: se declara y se pide,
 *  no se invade el territorio ajeno.* **DE ACÁ NO SE SUBE.**
 *
 *  ⚠️ EL NET ME COSTÓ TRES MEDICIONES, y queda escrito porque el número
 *  importaba: la primera dio **3** (`revisá?` no matchea «revisa» — la
 *  tilde opcional no cubre la vocal sin tilde), la segunda **4** («check
 *  the NOTE details» tiene una palabra en el medio), y la tercera, **6**.
 *  *Un baseline mal medido no protege de menos: protege de más, porque
 *  deja pasar como preexistente lo que nunca contó.* */
/** ⏪ ENSANCHADA EN LA MISMA SESIÓN, por el cruce de C — y las DOS
 *  mitades del cruce importan, con su literal:
 *  *«su regla encontró en mi territorio una deuda con dueño; mi medición
 *  encontró que su regla mira la mitad del problema.»*
 *
 *  🔴 **EL CORPUS ERA LA MITAD.** N12.4 dice *«en toda la casa»* y R44
 *  nació mirando SOLO los seis diccionarios. La misma voz vive también
 *  en `packages/api`, **hard-codeada en español en un paquete sin capa
 *  de idioma** (D-539) y mostrada directo por 34 archivos del prestador
 *  (`r.mensaje`) ⇒ **en inglés se ven en español.** *Una regla cuyo
 *  nombre promete «toda la casa» y cuyo corpus es la mitad está verde
 *  porque no mira, que es el modo de falla que L-192 persigue.*
 *
 *  ⚠️ Y AL ENSANCHAR, EL NET VIEJO SOBRE-CAPTURABA — el cruce se sirvió
 *  con **cinco** de `packages/api` y **son TRES**. Los otros dos
 *  (`vacunas.ts:198` · `_despensa-comun.ts:237`) **cumplen N12.4**:
 *  *«Una de las vacunas del carnet no es válida…»* y *«El recorrido
 *  llegó con datos inválidos»* **NOMBRAN LA FALLA**. Blanquearlos en un
 *  baseline los habría bendecido para siempre — el mismo daño que el
 *  subconteo, del otro lado.
 *
 *  ⇒ **EL DISCRIMINADOR, que es lo que esta regla aprendió:** el defecto
 *  no es contener «revisá» — es que **NADA diga qué falló ANTES**. Por
 *  eso el net ancla al arranque de la frase (`^[^.!?]*`): si hay una
 *  oración previa que nombra la falla, el mensaje cumple. Calibrado
 *  contra los **16 casos reales** de las dos casas, 16/16. */
const BASELINE_R44 = 9
const VOZ_SIN_QUÉ =
  /^[^.!?]*(revis[aá] los datos|check the [a-z ]*details?|campo (inv[aá]lido|requerido)|invalid field|algo sali[oó] mal|something went wrong)/i
function r44(archivos) {
  const fallos = []
  let total = 0
  let dics = 0
  for (const { path, src } of archivos) {
    dics++
    for (const linea of src.split('\n')) {
      /* El net mira el VALOR de la cadena, no la línea entera: una línea
         puede traer clave, comentario y comilla, y anclar al arranque de
         la LÍNEA haría que cualquier prefijo desactive el `^`. */
      for (const m of linea.matchAll(/'([^']{6,})'/g)) {
        if (!VOZ_SIN_QUÉ.test(m[1])) continue
        total++
        if (total > BASELINE_R44)
          fallos.push(
            `R44: ${path} — VOZ DE ERROR QUE NO DICE QUÉ (N12.4): «${m[1]}». La ley pide QUÉ está mal y CÓMO se arregla, con un ejemplo real. «Revisá los datos» deja a la persona con lo único que ya sabía: que algo falló.`,
          )
      }
    }
  }
  if (total < BASELINE_R44)
    fallos.push(
      `R44: quedan ${total} voces genéricas y el baseline declara ${BASELINE_R44} — BAJÓ: actualizar el baseline. Un baseline que sobra deja de ser deuda y pasa a ser permiso.`,
    )
  // ANCLA: si el corpus de diccionarios se rompe, la regla no vería
  // ninguna voz y su verde diría «no miré» (L-192). Son SEIS archivos.
  fallos.push(...ancla('R44', dics, 40, 'archivo(s) del corpus (6 diccionarios + los wrappers de api)'))
  return {
    fallos,
    info: `${total} voz/voces genérica(s) · baseline ${BASELINE_R44} = 6 diccionarios de \`apps/prestador\` (dueño C, CURABLES escribiendo mejor) + 3 de \`packages/api\` (dueño A, BLOQUEADAS: \`datos_invalidos\` es el fallback de CUALQUIER CHECK — la voz buena exige códigos tipados por constraint, no una frase mejor). Solo-baja`,
  }
}

const REGLAS = { R44: r44, R43: r43, R1: r1, R2: r2, R3: r3, R4: r4, R5: r5, R6: r6, R7: r7, R8: r8, R9: r9, R10: r10, R11: r11, R12: r12, R13: r13, R14: r14, R15: r15, R16: r16, R17: r17, R18: r18, R20: r20, R24: r24, R25: r25, R27: r27, R29: r29, R30: r30, R32: r32, R33: r33, R34: r34, R35: r35, R36: r36, R37: r37, R38: r38, R39: r39, R40: r40, R41: r41, R42: r42 };
const INFORMATIVAS = new Set(['R9']); // sin modo de fallo, declarado (el porqué en su header)

// ── GUARD ESTRUCTURAL (S82-B): ninguna regla escapa en silencio ──
let estructuraRota = 0;
for (const nombre of Object.keys(REGLAS)) {
  const enFixtures = nombre in FIXTURES;
  const enInformativas = INFORMATIVAS.has(nombre);
  if (enFixtures === enInformativas) {
    console.error(`ESTRUCTURA ✗ ${nombre} ${enFixtures ? 'está en FIXTURES y en INFORMATIVAS a la vez' : 'no está NI en FIXTURES NI en INFORMATIVAS — escapó de la auto-prueba (L-192)'}`);
    estructuraRota++;
  }
}
for (const nombre of Object.keys(FIXTURES)) {
  if (!(nombre in REGLAS)) {
    console.error(`ESTRUCTURA ✗ ${nombre} tiene fixture pero no regla`);
    estructuraRota++;
  }
}
if (estructuraRota > 0) {
  console.error(`\nverify:diseno — estructura rota (${estructuraRota}): el lint se declara inválido`);
  process.exit(1);
}

let decorativas = 0;
for (const [nombre, fixture] of Object.entries(FIXTURES)) {
  const res = REGLAS[nombre](fixture);
  if (res.fallos.length === 0) {
    console.error(`AUTO-PRUEBA ✗ ${nombre} no salió roja contra su fixture — REGLA DECORATIVA (L-192)`);
    decorativas++;
  }
}
/** AUTO-PRUEBA EXTRA DE R16 (S83-B3) — el mecanismo genérico corre UN
 *  fixture por regla, y R16 tiene TRES brazos cuyas condiciones son
 *  MUTUAMENTE EXCLUYENTES (el de "no separado" y el de "separado con el
 *  mismo hex" no pueden ser ciertos a la vez): ningún fixture único puede
 *  encenderlos todos. El genérico cubre el brazo que la orden pidió —la
 *  mitad oscura sin separar—; estos dos cubren los otros, para que ningún
 *  brazo quede sin su rojo. Un brazo sin prueba es una regla decorativa
 *  adentro de una regla viva, que es L-192 escondida un piso más abajo. */
const EXTRAS_R16 = [
  ['R16·brazo claro (tinte encendido, lightOficio sin pisar)', {
    palette: "light0: '#FAF9F7',\npapelTapiz: '#FAF2F5',\npapelTapizOficio: '#F4F8F6',\ndark0: '#050508',\ntapizDark: '#0D050D',\ntapizDarkOficio: '#080D0E',",
    temas:
      'const lightOficio: Theme = { ...lightTheme }\n' +
      'const darkOficio: Theme = { ...darkTheme,\n  bg: { ...darkTheme.bg, base: palette.tapizDarkOficio },\n}',
  }],
  ['R16·brazo hexes (las dos casas con el mismo tapiz)', {
    palette: "light0: '#FAF9F7',\npapelTapiz: '#FAF2F5',\ndark0: '#050508',\ntapizDark: '#0D050D',\ntapizDarkOficio: '#0D050D',",
    temas:
      'const lightOficio: Theme = { ...lightTheme,\n  bg: { ...lightTheme.bg, base: palette.light0 },\n}\n' +
      'const darkOficio: Theme = { ...darkTheme,\n  bg: { ...darkTheme.bg, base: palette.tapizDarkOficio },\n}',
  }],
];
/** LOS BRAZOS QUE EL CENSO DESTAPÓ (S83-B7, vía incremental de B4).
 *  El censo por instrumentación midió 42 brazos y encontró 8 sin rojo
 *  propio: no porque nadie los escribiera, sino porque **un fixture solo
 *  puede recorrer UN camino** y estos son excluyentes con el camino que
 *  el ancla ya prueba. Cuatro de los ocho son GUARDS DE FUENTE —el "sin
 *  fuente no hay verificación" de L-192—, que por construcción no se
 *  encienden nunca cuando el fixture trae la fuente: la defensa contra el
 *  silencio vivía sin que nadie hubiera comprobado que suena.
 *
 *  El refactor genérico (fixtures por brazo como DEFAULT, con nombres
 *  declarados y cobertura exigida) queda CANDIDATO con su costo medido:
 *  21 funciones, ~42 sitios, más el runner. Esto es la vía incremental. */
const EXTRAS_BRAZOS = [
  /* ── R34 brazo B: la lista de red que arranca vacía (S92-BIS) ──────────
     Su rojo va APARTE del brazo A a propósito: el fixture de A no tiene
     `useState<T[]>([])` y el de B no tiene `ofrecibles()`, así que ninguno
     puede encender los dos y cada brazo queda probado por su cuenta. Es la
     misma disciplina que R18 y R16 ya aplican.
     El fixture es el CÓDIGO REAL que produjo el P0, recortado. */
  ['R34·lista de red que arranca en [] y no puede decir que falló', r34, [
    {
      path: '(fixture)',
      src:
        'const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);\n' +
        'const r = await obtenerMascotasDeFamilia(familiaId);\n' +
        'if (!vigente || !r.ok) return;\n' +
        'setMascotas(r.data);',
    },
  ]],
  // ── R14: los tres guards, en el orden en que la función los alcanza ──
  ['R14·sin la fuente (hogar/index.tsx ausente)', r14, [{ path: 'x/OTRO.tsx', src: '' }]],
  ['R14·constantes ausentes en el hogar', r14, [{ path: 'x/hogar/index.tsx', src: 'const NADA = 1;' }]],
  ['R14·spacing fuera de la tabla espejada', r14, [
    { path: 'x/hogar/index.tsx', src: 'const RESPIRO_BANDA = spacing[99];\nconst SOLAPE_RECO = spacing[98];' },
  ]],
  // ── R16: el guard de fuente que nació decorativo EN B3, escrito por mí ──
  ['R16·sin los tokens del tapiz en palette', r16, { palette: '', temas: '' }],
  // ── R18: la entrada VIVE (no dispara su otro brazo) y hay __DEV__ ──
  // S85-B1 · los DOS brazos de __DEV__ tienen su rojo por separado, y el
  // orden importa: en el GRUESO el `__DEV__` va DESPUÉS de la entrada, así
  // que no puede envolverla ni encender el preciso. Un fixture que
  // encendiera los dos no probaría ninguno (el precedente de R16/R24).
  ['R18·__DEV__ ajeno, sin envolver (brazo grueso)', r18, [{ ruta: '(fixture)', src: 'router.push("/gallery")\nif (__DEV__) console.log("nada que ver")' }, { ruta: '(fixture2)', src: 'router.push("/gallery")' }]],
  ['R18·__DEV__ ENVUELVE la entrada — if (brazo preciso)', r18, [{ ruta: '(fixture)', src: 'if (__DEV__) { router.push("/gallery") }' }, { ruta: '(fixture2)', src: 'router.push("/gallery")' }]],
  ['R18·__DEV__ ENVUELVE la entrada — && en JSX (brazo preciso)', r18, [{ ruta: '(fixture)', src: '{__DEV__ && <Celda onPress={() => router.push("/gallery")} />}' }, { ruta: '(fixture2)', src: 'router.push("/gallery")' }]],
  // ── R30: el ANCLA, que es el guard de fuente de esta regla. Sin
  //    registry el SET queda vacío, ningún path matchea y la regla pasaría
  //    en VERDE habiendo comparado contra NADA. Su fixture principal trae
  //    el registry lleno a propósito, así que este brazo no se enciende
  //    ahí: sin esta línea, el guard nacería decorativo (el caso de R16).
  ['R30·sin el registry (el SET vacío no verifica nada)', r30, [{ path: 'apps/cliente/src/(fixture)/X.tsx', src: '<Path d="M4.4 5.2h15.2a1.5 1.5 0 0 1 1.5 1.5v9.8Z" />' }]],
  /* ── R35: EL ANCLA, que es su guard de fuente y el brazo que faltaba.
     Sin un archivo de `packages/ui/src/gallery/` en el corpus, R35
     informaría "0 colores a mano" en VERDE sobre el único lugar de `ui`
     que se compone como pantalla — que es el lugar POR EL QUE nació. Su
     fixture principal trae la galería a propósito, así que este brazo no
     se enciende ahí: sin esta línea el guard nacería decorativo. */
  ['R35·sin la galería en el corpus (el ancla)', r35, [{ path: 'packages/ui/src/components/X.tsx', src: '' }]],
  /* ── LAS CUATRO DEL NORTE: sus anclas. Los fixtures principales traen
     RELLENO_APPS justamente para que el ancla NO se encienda y se pruebe
     el brazo real; estos cuatro prueban el ancla misma, con corpus corto
     y sin violación. Sin ellos, cuatro guards de fuente vivirían sin que
     nadie hubiera comprobado que suenan (el caso de R16 en S83). */
  ['R36·ancla (corpus de apps derrumbado)', r36, [{ path: '(fixture)', src: '' }]],
  ['R37·ancla (corpus de apps derrumbado)', r37, [{ path: '(fixture)', src: '' }]],
  ['R38·ancla (corpus de apps derrumbado)', r38, [{ path: '(fixture)', src: '' }]],
  ['R39·ancla (corpus de apps derrumbado)', r39, [{ path: '(fixture)', src: '' }]],
  /* ── R40: LA PARIDAD (brazo ②) — el modo de falla que un contador
     global NO ve: un idioma recibe la firma y el otro no. Con UNA clave
     en `es` y ninguna en `en`, el contador da 1 (= baseline, verde) y
     solo la paridad puede ponerlo rojo. Por eso va aparte. */
  ['R40·paridad es↔en (un idioma curado y el otro no)', r40, [
    { path: 'apps/prestador/src/i18n/es.ts', src: '    adminAvisoPENDIENTE:' },
    { path: 'apps/prestador/src/i18n/en.ts', src: '' },
    { path: 'apps/cliente/src/i18n/es.ts', src: '' },
    { path: 'apps/cliente/src/i18n/en.ts', src: '' },
  ]],
  // ── R40: el ancla (guard de fuente) — sin los cuatro diccionarios
  //    informaría "0 placeholders" habiendo leído nada.
  ['R40·ancla (los diccionarios no se leyeron)', r40, [{ path: 'apps/cliente/src/i18n/es.ts', src: '' }]],
];
for (const [nombre, regla, fx] of EXTRAS_BRAZOS) {
  if (regla(fx).fallos.length === 0) {
    console.error(`AUTO-PRUEBA ✗ ${nombre} no salió roja — BRAZO DECORATIVO (L-192)`);
    decorativas++;
  }
}

const EXTRAS_R27 = [
  ['R27·brazo darkOficio (sin pisar active)', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, active: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, control: palette.tealDark },\n}',
  }],
  ['R27·el registro equivocado (puro en claro, que REPRUEBA)', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, active: palette.teal },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, active: palette.teal },\n}',
  }],
  ['R27·guard de fuente (themes ausente)', { temas: '' }],
  // 🔴 S98-B (D-813) · EL BRAZO DEL TINTE, CON TODO LO DEMÁS SANO — que es
  // la única forma de probar que el slot nuevo se vigila de verdad. Las
  // dos casas pisan `control`, `active` y `marcaEleccion` correctamente y
  // NINGUNA pisa `controlBg`: es EXACTAMENTE el estado que vivió en
  // producción hasta hoy, y con el que la regla vieja daba VERDE.
  // *Si este brazo no sale rojo, el cuarto slot es decorativo.*
  ['R27·brazo controlBg (todo lo demás sano — el estado que vivió en producción)', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, control: palette.tealDark, active: palette.tealDark, marcaEleccion: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, control: palette.teal, active: palette.teal, marcaEleccion: palette.teal },\n}',
  }],
  // Y su hermano: el slot PISADO pero con el registro del OTRO tema. Un
  // guard que solo mirara presencia dejaría pasar el tinte claro en el
  // tema oscuro, que es un alfa distinto por medición, no por gusto.
  ['R27·brazo controlBg con el alfa cruzado', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, control: palette.tealDark, controlBg: palette.tealAlpha15, active: palette.tealDark, marcaEleccion: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, control: palette.teal, controlBg: palette.tealAlpha16, active: palette.teal, marcaEleccion: palette.teal },\n}',
  }],
];
for (const [nombre, fx] of EXTRAS_R27) {
  if (r27(fx).fallos.length === 0) {
    console.error(`AUTO-PRUEBA ✗ ${nombre} no salió roja — BRAZO DECORATIVO (L-192)`);
    decorativas++;
  }
}


for (const [nombre, fx] of EXTRAS_R16) {
  if (r16(fx).fallos.length === 0) {
    console.error(`AUTO-PRUEBA ✗ ${nombre} no salió roja — BRAZO DECORATIVO (L-192)`);
    decorativas++;
  }
}

if (decorativas > 0) {
  console.error(`\nverify:diseno — ${decorativas} regla(s) decorativa(s): el lint se declara inválido`);
  process.exit(1);
}

// ── LA CORRIDA REAL ──
let fallosTotal = 0;
const corridas = [
  ['R1 (7bis/SelectorOpcion)', r1(apps)],
  ['R2 (Ley 1 hex crudos, apps)', r2(apps)],
  ['R3 (A6+§7/Tarjeta: contrato + censo)', r3(apps)],
  ['R4 (Ley 20 sombras artesanales, apps+ui)', r4([...apps, ...ui])],
  ['R5 (Ley 21/Boton: el CTA no se re-resuelve)', r5(apps)],
  ['R6 (D-498/EvitaTeclado: teclado crudo)', r6(apps)],
  ['R7 (§5/Entrada: FadeIn artesanal)', r7(apps)],
  ['R8 (Ley 13/EstadoVacio: el vacío no se anima)', r8(apps)],
  ['R9 (Ley 17.5/EstadoVacio — informativa)', r9(apps)],
  ['R10 (override-s82c atado a su casa)', r10(apps)],
  ['R11 (LOYALTY §3: la voz del momento sin score)', r11(dics)],
  ['R14 (el solape no tapa el saludo)', r14(apps)],
  ['R35 (Ley 1: el color aplicado sale del tema — ui+galería+apps)', r35([...apps, ...ui, ...galeria])],
];
// R12 y R15 corren sobre el volcador vivo; si cayó, FALLAN FUERTE.
const dump = volcadorReal();
if ('caido' in (dump ?? {})) {
  corridas.push(['R12 (contraste dos temas)', { fallos: [`el VOLCADOR no corrió (${dump.caido}) — sin pares no hay verificación (L-192)`], info: 'VOLCADOR CAÍDO' }]);
  corridas.push(['R15 (exclusión A5)', { fallos: [`el VOLCADOR no corrió (${dump.caido}) — sin tokens no hay verificación (L-192)`], info: 'VOLCADOR CAÍDO' }]);
} else {
  // S90-B: el volcador DICE POR DÓNDE corrió. No es adorno — es lo que
  // permite ver desde el reporte que la cascada hizo falta (o que no).
  const r12r = r12(dump.pares);
  corridas.push([
    'R12 (contraste dos temas: texto 4.5 · canto 3.0)',
    { ...r12r, info: `${r12r.info ?? ''} · volcador vía ${dump.via}` },
  ]);
  corridas.push(['R15 (A5 §9bis.3: la familia de #0F5E56 fuera del tema cliente)', r15(dump.tokens)]);
}
corridas.push(['R13 (A6: control contorneado, cliente)', r13(apps)]);
corridas.push(['R16 (papel tapiz: el prestador no recibe tinte)', r16(FUENTES_R16)]);
corridas.push(['R17 (la galería no envejece)', r17(FUENTES_R17)]);
corridas.push(['R20 (la familia alerta no se rellena)', r20([...apps, ...ui])]);
corridas.push(['R18 (D-580: la entrada a la galería NO desaparece, en LAS DOS casas)', r18(CUENTAS_GALERIA.map((ruta) => ({ ruta, src: readFileSync(ruta, 'utf8') })))]);
corridas.push(['R24 (el pie de reserva no se copia)', r24(apps)]);
corridas.push(['R25 (la pata no se reinventa)', r25([...apps, ...ui])]);
corridas.push(['R30 (el glifo no se re-dibuja: apps contra el registry)', r30([...apps, ...ui])]);
corridas.push(['R27 (el pink no enfoca en el prestador)', r27(FUENTES_R27)]);
corridas.push(['R29 (sinPie no viaja solo)', r29(apps)]);
corridas.push(['R32 (la esquina compartida: los 20dp de la lámina)', r32(apps)]);
corridas.push(['R33 (la superficie de la huella se declara)', r33(apps)]);
corridas.push(['R34 (una lista de tres estados no se decide por el largo)', r34(appsCodigo)]);
// ── LAS CUATRO DEL NORTE (mesa 13-ago) ──
corridas.push(['R36 (N2 el ritmo: el espaciado sale del token)', r36(apps)]);
corridas.push(['R37 (N4 el radio único: una sola escala)', r37(apps)]);
corridas.push(['R38 (N3 la muerte del separador: 3 por pantalla)', r38(apps)]);
corridas.push(['R39 (N1 la escala: 3 tamaños a mano por pantalla)', r39(apps)]);
corridas.push(['R40 (el placeholder sin firma no se embarca en silencio)', r40(DICS_R40)]);
corridas.push(['R41 (lo que se mueve de verdad mira useReducedMotion)', r41(ui)]);
corridas.push(['R42 (la puerta de la foto no se re-dibuja)', r42([...apps, ...ui])]);
corridas.push(['R43 (N11: el contorno del campo tiene piso)', r43(FUENTES_R43)]);
corridas.push(['R44 (N12.4: el error dice QUE esta mal)', r44(CORPUS_R44)]);

/** SEGUNDO GUARD ESTRUCTURAL (S82-B r35) — el hueco que encontré
 *  construyendo R24: una regla puede estar en REGLAS, tener su fixture,
 *  PASAR la auto-prueba… y no correr NUNCA contra el código real, porque
 *  `corridas` se arma a mano. Salió roja contra su fixture y muda contra
 *  la casa: exactamente el modo de falla que L-192 prohíbe, un piso más
 *  arriba. El guard cierra el triángulo (regla · fixture · corrida). */
const enCorridas = new Set(corridas.map(([n]) => n.match(/^R\d+/)?.[0]));
for (const nombre of Object.keys(REGLAS)) {
  if (!enCorridas.has(nombre)) {
    console.error(`ESTRUCTURA ✗ ${nombre} tiene regla y fixture pero NO CORRE contra el código real (L-192)`);
    estructuraRota++;
  }
}

/** TERCER GUARD ESTRUCTURAL (S97+-B) — LA DIRECCIÓN QUE FALTABA, y la
 *  encontró un defecto REAL de esta misma casa, no una previsión.
 *
 *  EL CASO: **R35 corría en `corridas` sin estar en `REGLAS`.** Nació en
 *  S96-B así y sobrevivió dos sesiones. Los otros dos guards preguntan
 *  «¿toda regla REGISTRADA está probada?» y «¿toda regla REGISTRADA
 *  corre?» — los dos iteran `REGLAS`, así que **una regla que corre sin
 *  registrarse es invisible para los tres**: no tiene fixture, nadie
 *  comprobó jamás que pueda salir roja, y su número igual se imprime
 *  cada corrida con cara de medición. En S96 y en S97 se reportó «R35
 *  DURA EN 0» leyendo una regla de la que nadie había verificado que
 *  supiera decir que no.
 *
 *  ⇒ Es L-192 en su forma más incómoda: **el guard escrito para impedir
 *  que una regla escape en silencio tenía él mismo la puerta abierta**,
 *  porque vigilaba el registro en vez de vigilar lo que corre. El
 *  triángulo (regla · fixture · corrida) solo se cierra si se recorre en
 *  los dos sentidos.
 *
 *  ☠️ CONDICIÓN DE MUERTE: ninguna — muere con el lint. */
for (const [etiqueta] of corridas) {
  const nombre = etiqueta.match(/^R\d+/)?.[0];
  if (nombre === undefined) {
    console.error(`ESTRUCTURA ✗ una corrida no declara su regla en la etiqueta: "${etiqueta}"`);
    estructuraRota++;
    continue;
  }
  if (!(nombre in REGLAS)) {
    console.error(
      `ESTRUCTURA ✗ ${nombre} CORRE contra el código real pero NO está en REGLAS — escapó de la auto-prueba y de los otros dos guards, que iteran REGLAS (L-192). Su número se imprime cada corrida sin que nadie haya comprobado que la regla pueda salir roja.`,
    );
    estructuraRota++;
  }
}
if (estructuraRota > 0) {
  console.error(`\nverify:diseno — estructura rota (${estructuraRota}): el lint se declara inválido`);
  process.exit(1);
}

for (const [nombre, res] of corridas) {
  console.log(`${nombre} · ${res.info}`);
  for (const f of res.fallos) { console.error(`  ✗ ${f}`); fallosTotal++; }
}

if (fallosTotal > 0) {
  console.error(`\nverify:diseno — ${fallosTotal} fallo(s)`);
  process.exit(1);
}
console.log(`\nverify:diseno — VERDE (auto-prueba: ${Object.keys(FIXTURES).length} reglas encendieron; informativas declaradas: ${[...INFORMATIVAS].join(',')})`);
