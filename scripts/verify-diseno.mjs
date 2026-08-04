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

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

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

const MINIMOS_CORPUS = { apps: 100, cliente: 45, ui: 38 };

const leer = (fs) => fs.map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));
const apps = leer(RAICES.flatMap(archivosTsx));
const ui = leer(RAICES_UI.flatMap(archivosTsx));

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
const BASELINE_HEX = 4;
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
/** El volcador corre UNA vez por invocación; si cae, R12 y R15 fallan
 *  fuerte. Desde r6 emite { pares, tokens } (los tokens para R15). */
function volcadorReal() {
  try {
    const out = execSync('pnpm exec tsx scripts/verify-diseno-pares.ts', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const dump = JSON.parse(out);
    if (!Array.isArray(dump?.pares) || dump.pares.length === 0) throw new Error('volcador sin pares');
    if (!Array.isArray(dump?.tokens) || dump.tokens.length === 0) throw new Error('volcador sin tokens');
    return dump;
  } catch (e) {
    return { caido: String(e.message ?? e).slice(0, 120) };
  }
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
  const ESPERADO = {
    lightOficio: { control: 'tealDark', active: 'tealDark', marcaEleccion: 'tealDark' },
    darkOficio: { control: 'teal', active: 'teal', marcaEleccion: 'teal' },
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
 *  SIGUIENTE NÚMERO LIBRE: **R30**.) */

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

// ── L-192: LA AUTO-PRUEBA — cada regla con modo de fallo DEBE salir
//    roja contra su fixture sintético, en CADA corrida. ──
const FIXTURES = {
  R1: [{ path: '(fixture)', src: '<SelectorOpcion naturaleza="foo" />\n<SelectorOpcion entidad naturaleza="existe" />' }],
  R2: [{ path: '(fixture)', src: Array(BASELINE_HEX + 1).fill("color: '#ABC123'").join('\n') }],
  R3: [{ path: '(fixture)', src: '<Tarjeta elevacion="flotante">' }],
  R4: [{ path: '(fixture)', src: "style={{ shadowColor: '#000000', shadowOpacity: 0.5 }}\nstyle={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}" }],
  R5: [{ path: '(fixture)', src: 'style={{ backgroundColor: theme.accent.cta }}\n<ThemeProvider cta="oficio">' }],
  R6: [{ path: '(fixture)', src: '<KeyboardAvoidingView behavior="padding">' }],
  R29: [{ path: '(fixture)', src: '<Campo label="Tel" sinPie />' }],
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
  R24: [
    ...OFICIOS_R24.map((o) => ({ path: `apps/cliente/src/app/(tabs)/explorar/${o}/index.tsx`, src: '' })),
    {
      path: 'apps/cliente/src/app/(tabs)/explorar/(fixture)/index.tsx',
      src: 'paddingBottom: Math.max(insets.bottom, spacing[4]),\nborderTopWidth: 1,',
    },
  ],
};
const REGLAS = { R1: r1, R2: r2, R3: r3, R4: r4, R5: r5, R6: r6, R7: r7, R8: r8, R9: r9, R10: r10, R11: r11, R12: r12, R13: r13, R14: r14, R15: r15, R16: r16, R17: r17, R18: r18, R20: r20, R24: r24, R25: r25, R27: r27, R29: r29, R30: r30 };
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
];
// R12 y R15 corren sobre el volcador vivo; si cayó, FALLAN FUERTE.
const dump = volcadorReal();
if ('caido' in (dump ?? {})) {
  corridas.push(['R12 (contraste dos temas)', { fallos: [`el VOLCADOR no corrió (${dump.caido}) — sin pares no hay verificación (L-192)`], info: 'VOLCADOR CAÍDO' }]);
  corridas.push(['R15 (exclusión A5)', { fallos: [`el VOLCADOR no corrió (${dump.caido}) — sin tokens no hay verificación (L-192)`], info: 'VOLCADOR CAÍDO' }]);
} else {
  corridas.push(['R12 (contraste dos temas: texto 4.5 · canto 3.0)', r12(dump.pares)]);
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
