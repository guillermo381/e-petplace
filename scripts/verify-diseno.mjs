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

const leer = (fs) => fs.map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));
const apps = leer(RAICES.flatMap(archivosTsx));
const ui = leer(RAICES_UI.flatMap(archivosTsx));

/** L-170 mecanizada: un censo NO lee comentarios como código — el
 *  primer disparo real del ratchet R2 fue un hex en PROSA (el
 *  comentario de C en bienvenida-dia1:110). Se despojan // y ／* *／
 *  antes de contar. */
const sinComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const lineaDe = (src, index) => src.slice(0, index).split('\n').length;

// ── LAS REGLAS: funciones puras (archivos) → { fallos: string[], info } ──

/** R1 · 7bis sobre SelectorOpcion: naturaleza legal; entidad y
 *  naturaleza EXCLUYENTES (entidad ES relleno por espec S73). */
function r1(archivos) {
  const fallos = [];
  let existe = 0, entidad = 0, implicita = 0;
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
      else implicita++;
    }
  }
  return { fallos, info: `existe=${existe} · entidad=${entidad} · seFija-implícita=${implicita}` };
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
function r6(archivos) {
  const fallos = [];
  for (const { path, src } of archivos) {
    for (const m of sinComentarios(src).matchAll(/\bKeyboardAvoidingView\b/g)) {
      fallos.push(`${path}:${lineaDe(sinComentarios(src), m.index)} — KeyboardAvoidingView crudo (D-498): la casa tiene UNA — EvitaTeclado`);
      void m;
      break;
    }
  }
  return { fallos, info: `${fallos.length} crudos` };
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
function r8(archivos) {
  const fallos = [];
  let entering = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/<Entrada\b/g)) {
      const cierre = src.indexOf('</Entrada>', m.index);
      const bloque = src.slice(m.index, cierre === -1 ? m.index + 2000 : cierre);
      if (/<EstadoVacio\b/.test(bloque))
        fallos.push(`${path}:${lineaDe(src, m.index)} — EstadoVacio dentro de Entrada (Ley 13): el vacío JAMÁS se anima (veto L-c, S81)`);
    }
    for (const m of src.matchAll(/<Animated\.View\b[^>]*entering=/g)) {
      const cierre = src.indexOf('</Animated.View>', m.index);
      const bloque = src.slice(m.index, cierre === -1 ? m.index + 2000 : cierre);
      if (/<EstadoVacio\b/.test(bloque)) { entering++; porArchivo.push(`${path}:${lineaDe(src, m.index)}`); }
    }
  }
  if (entering > BASELINE_VACIO_ENTERING)
    fallos.push(`Ley 13: ${entering} EstadoVacio bajo entering= (baseline ${BASELINE_VACIO_ENTERING}) — el vacío JAMÁS se anima:\n    ${porArchivo.join('\n    ')}`);
  return { fallos, info: `en-Entrada=${fallos.length > 0 && entering <= BASELINE_VACIO_ENTERING ? fallos.length : 0} · bajo-entering=${entering}/${BASELINE_VACIO_ENTERING}${entering < BASELINE_VACIO_ENTERING ? ' — BAJÓ: actualizar baseline' : ''}` };
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
const CASA_OVERRIDE_S82C = /apps\/cliente\/src\/(app\/\(tabs\)\/hogar\/(index|mascota\/\[mascotaId\])|components\/(canto-curva|filtro-pills|reserva-piezas))\.tsx$/;
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
  for (const { path, src } of archivosDic) {
    src.split('\n').forEach((lineaTxt, i) => {
      if (RE_VOZCARD.test(lineaTxt) && RE_SCORE.test(lineaTxt)) {
        fallos.push(`${path}:${i + 1} — la voz del momento habla de DESEMPEÑO (LOYALTY §3): ${lineaTxt.trim().slice(0, 70)}`);
      }
    });
  }
  return { fallos, info: `${fallos.length} voces con score` };
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
function r12(pares) {
  const fallos = [];
  let exentas = 0, enBaseline = 0, bajaron = 0;
  for (const p of pares) {
    const clave = `${p.tema}·${p.clase}·${p.nombre}`;
    if (p.ratio >= p.minimo) {
      if (BASELINE_R12.has(clave)) bajaron++;
      continue;
    }
    if (EXENTAS_R12.has(clave)) { exentas++; continue; }
    if (BASELINE_R12.has(clave)) { enBaseline++; continue; }
    fallos.push(`R12: ${clave} = ${p.ratio.toFixed(2)} (mín ${p.minimo}) — par bajo mínimo FUERA de baseline/exentas`);
  }
  return {
    fallos,
    info: `pares=${pares.length} · exentas-firmadas=${exentas} · baseline-founder=${enBaseline}/${BASELINE_R12.size}${bajaron > 0 ? ` · ${bajaron} BAJARON: actualizar baseline` : ''}`,
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
  return { fallos, info: `${total}/${sumaBaseline} contorneados (baseline nominal: FiltroVida de C — se resuelve en su gate)${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}` };
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
 *  (S78): el orden nombra el artefacto que abre. */
function r16(fuentes) {
  const pal = fuentes.palette ?? '';
  const temas = fuentes.temas ?? '';
  const luz = pal.match(/\blight0:\s*'(#[0-9A-Fa-f]{6})'/);
  const tapiz = pal.match(/\bpapelTapiz:\s*'(#[0-9A-Fa-f]{6})'/);
  if (!luz || !tapiz)
    return { fallos: ['R16: no se pudo leer light0/papelTapiz de palette.ts — sin los valores no hay verificación (L-192)'], info: 'SIN FUENTE' };
  const encendido = luz[1].toUpperCase() !== tapiz[1].toUpperCase();
  // La separación: lightOficio (el tema del prestador) pisando bg.base.
  const separado = /const lightOficio[\s\S]*?\bbg:\s*\{[^}]*\bbase:\s*palette\.light0/.test(temas);
  const fallos = encendido && !separado
    ? [`R16: papelTapiz (${tapiz[1]}) está ENCENDIDO y lightOficio NO pisa bg.base a light0 — el prestador estaría recibiendo el tinte del cliente (orden founder S82 r8/r9 punto 5)`]
    : [];
  return { fallos, info: `tapiz=${encendido ? 'ENCENDIDO ' + tapiz[1] : 'apagado (=light0)'} · separación-prestador=${separado ? 'construida' : 'no construida'}` };
}
const FUENTES_R16 = {
  palette: readFileSync('packages/ui/src/tokens/palette.ts', 'utf8'),
  temas: readFileSync('packages/ui/src/themes/index.ts', 'utf8'),
};


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
]);
/** VACÍO desde S82-B r17: las NUEVE ganaron su entrada en la misma
 *  tanda que la regla las enumeró — importadas, jamás reimplementadas.
 *  De vacío no se sube: toda exportación nueva es roja el primer día. */
const SIN_ENTRADA_R17 = new Set([]);
function r17(fuentes) {
  const idx = fuentes.index ?? '';
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
const CUENTA_CLIENTE = 'apps/cliente/src/app/(tabs)/cuenta/index.tsx';
function r18(fuentes) {
  const src = fuentes.cuenta ?? '';
  const fallos = [];
  if (!/router\.push\(['"]\/gallery['"]\)/.test(sinComentarios(src))) {
    fallos.push(
      `${CUENTA_CLIENTE} — LA ENTRADA A /gallery DESAPARECIÓ. D-580 (enmienda founder S82): queda VISIBLE hasta el gate de producción; su retiro exige FIRMA EXPLÍCITA, y con la firma se borra esta regla en el mismo acto.`,
    );
  }
  if (/__DEV__/.test(sinComentarios(src))) {
    fallos.push(
      `${CUENTA_CLIENTE} — la Cuenta usa __DEV__: la entrada a la galería NO se esconde ahí (el gate corre sobre el APK preview, donde __DEV__ es false — L-161).`,
    );
  }
  return { fallos, info: fallos.length === 0 ? 'entrada viva y sin __DEV__' : `${fallos.length} fallo(s)` };
}

/** R19 · L-b MECANIZADA (S82-C r14): EL RELLENO PLENO SE COMPUTA CONTRA
 *  EL NÚMERO DE HERMANOS — jamás incondicional.
 *
 *  EL DEFECTO QUE LA PARE ES MÍO Y ESTÁ FECHADO. En r11 puse la
 *  duración a rellenarse con `naturaleza="existe"` y lo declaré "por
 *  ley": leí la 19.8 (SE RELLENA LO QUE EXISTE) y me salteé L-b, que
 *  es la que dice CUÁNTO — *"el relleno pleno se reserva a la ELECCIÓN
 *  QUE CIERRA; en fila de barrido (≥4 hermanos comparables) la
 *  selección va por elevación, escala y color de texto"*. Eran CINCO
 *  bloques. El founder lo cobró tres rondas después, mirando.
 *
 *  POR QUÉ ES SILENCIOSO (que es el único motivo por el que merece
 *  guard, L-192): un pleno incondicional COMPILA, se ve BIEN en el
 *  hogar de prueba —dos mascotas, tres chips— y solo miente cuando el
 *  usuario real tiene cuatro. El typecheck no lo ve, el gate en
 *  dispositivo tampoco si el dispositivo tiene pocos datos. Es un
 *  defecto que solo aparece en la casa de otro.
 *
 *  QUÉ VIGILA, y por qué así: en las piezas locales de C que rellenan
 *  al elegir, toda decisión de relleno tiene que ATARSE A UN CONTEO.
 *  No verifica el número (3 o 4 es dosis, y la dosis la firma el
 *  founder) — verifica que el conteo ESTÉ. Un `pleno` que no mira
 *  cuántos hermanos hay ya decidió ignorar L-b. */
const PIEZAS_R19 = ['apps/cliente/src/components/filtro-pills.tsx'];
function r19(archivos) {
  const fallos = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    // toda asignación de `pleno` (const o dentro de una función)
    const asignaciones = limpio.match(/\bpleno\s*=\s*[^;\n]+/g) ?? [];
    if (asignaciones.length === 0) {
      fallos.push(
        `${path} — pieza declarada en R19 sin ninguna decisión de relleno: o la pieza dejó de rellenar (y sale de la lista, en el mismo commit) o el nombre cambió y la regla quedó vigilando un fantasma.`,
      );
      continue;
    }
    // El conteo puede vivir a UNA indirección — y debe poder: en
    // FiltroMascotas el umbral se llama `esBarrido` y lleva su comentario
    // de L-b encima, que es donde tiene que estar. Exigir `.length`
    // literal en la misma línea castigaba a la pieza que MEJOR aplicaba
    // la ley. (Primera corrida de esta regla: roja contra código
    // correcto — se corrigió la regla, no el código.)
    const definiciones = new Map();
    for (const m of limpio.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g)) {
      definiciones.set(m[1], m[2]);
    }
    const cuenta = (expr, saltos = 0) => {
      if (/\.length/.test(expr)) return true;
      if (saltos >= 2) return false;
      return (expr.match(/[A-Za-z_$][\w$]*/g) ?? []).some(
        (id) => definiciones.has(id) && cuenta(definiciones.get(id), saltos + 1),
      );
    };
    for (const a of asignaciones) {
      if (!cuenta(a)) {
        fallos.push(
          `${path} — relleno pleno SIN conteo de hermanos: «${a.trim()}». L-b: con 4+ comparables el pleno se cae y la selección va por elevación, escala y color de texto. El conteo se computa en la PIEZA, no en la cabeza de cada pantalla.`,
        );
      }
    }
  }
  return { fallos, info: fallos.length === 0 ? 'todo relleno atado a su conteo' : `${fallos.length} fallo(s)` };
}


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



/** R22 · LA MARCA DEL ELEGIDO NO SE METE ADENTRO DE LA PLACA
 *  (S82-C r19 — enmienda de Ley 6 firmada; §5 de
 *  `docs/relevamientos/2026-07-30-s82-C-ENMIENDA-ley6-para-A.md`).
 *
 *  POR QUÉ MERECE GUARD, que es el único criterio (L-192): **el defecto
 *  se ve como una decisión de layout, no como un cambio de ley.** Mover
 *  la huella adentro de la placa no rompe el build, no cambia ningún
 *  color, no toca ninguna ley escrita — y sin embargo devuelve el
 *  producto al caso que S80 midió: los glifos b′ CONTIENEN una huella
 *  (Ley 12), así que adentro de la placa la marca queda como una huella
 *  entre huellas y deja de señalar. Lo único que la hace legible es
 *  ESCALA y AISLAMIENTO — 13px, sola, fuera de la placa.
 *
 *  QUÉ VIGILA: que `MarcaElegido` exista y se monte (no puede
 *  desaparecer en silencio) y que su render NO caiga dentro del bloque
 *  de la placa del glifo. Es HERMANA del label, jamás hija de la placa.
 *
 *  ☠️ CONDICIÓN DE MUERTE, escrita al nacer: esta regla se retira el día
 *  que ocurra cualquiera de las dos —
 *   ① el founder FIRMA un diseño donde la marca viva adentro de la placa
 *     (eso enmienda §5 de la enmienda: la regla queda equivocada y se
 *     borra EN EL MISMO COMMIT de la firma, no después);
 *   ② `FiltroPills` se promueve a `packages/ui` con el invariante
 *     metido en el CONTRATO del componente — la marca como slot que no
 *     se puede anidar. Ahí el guard es redundante y lo retira B en el
 *     commit de la promoción.
 *  Un guard que sobrevive a su razón es basura que después nadie se
 *  anima a tocar. */
const PIEZA_R22 = 'apps/cliente/src/components/filtro-pills.tsx';
function r22(fuentes) {
  const src = fuentes.filtro ?? '';
  const limpio = sinComentarios(src);
  const fallos = [];
  if (!/function\s+MarcaElegido\b/.test(limpio)) {
    fallos.push(
      `${PIEZA_R22} — MarcaElegido DESAPARECIÓ. La marca del elegido tiene nombre propio porque la ley que la gobierna se ve como layout; sin el nombre no hay nada que vigilar.`,
    );
  }
  const usos = [...limpio.matchAll(/<MarcaElegido\b/g)];
  if (usos.length === 0) {
    fallos.push(`${PIEZA_R22} — MarcaElegido no se monta: el chip elegido se quedó sin marca.`);
  }
  // el bloque de la PLACA: desde su ancho declarado hasta su cierre
  const abre = limpio.indexOf('width: 30');
  if (abre === -1) {
    fallos.push(
      `${PIEZA_R22} — no se encontró la placa del glifo (width: 30): la regla quedó vigilando un fantasma. Si la placa cambió de forma, se re-ancla la regla EN EL MISMO COMMIT.`,
    );
  } else {
    const cierra = limpio.indexOf('</View>', abre);
    const dentro = cierra === -1 ? limpio.slice(abre) : limpio.slice(abre, cierra);
    if (/<MarcaElegido\b/.test(dentro)) {
      fallos.push(
        `${PIEZA_R22} — LA MARCA QUEDÓ ADENTRO DE LA PLACA. Los glifos b′ ya contienen una huella (Ley 12): adentro, la marca es una huella entre huellas y deja de señalar — el caso exacto que S80 midió. Es HERMANA del label, jamás hija de la placa.`,
      );
    }
  }
  return { fallos, info: fallos.length === 0 ? 'marca viva y fuera de la placa' : `${fallos.length} fallo(s)` };
}



// ── L-192: LA AUTO-PRUEBA — cada regla con modo de fallo DEBE salir
//    roja contra su fixture sintético, en CADA corrida. ──
const FIXTURES = {
  R1: [{ path: '(fixture)', src: '<SelectorOpcion naturaleza="foo" />\n<SelectorOpcion entidad naturaleza="existe" />' }],
  R2: [{ path: '(fixture)', src: Array(BASELINE_HEX + 1).fill("color: '#ABC123'").join('\n') }],
  R3: [{ path: '(fixture)', src: '<Tarjeta elevacion="flotante">' }],
  R4: [{ path: '(fixture)', src: "style={{ shadowColor: '#000000', shadowOpacity: 0.5 }}\nstyle={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}" }],
  R5: [{ path: '(fixture)', src: 'style={{ backgroundColor: theme.accent.cta }}\n<ThemeProvider cta="oficio">' }],
  R6: [{ path: '(fixture)', src: '<KeyboardAvoidingView behavior="padding">' }],
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
  R18: { cuenta: '<CeldaNavegacion titulo="Preferencias" onPress={() => router.push("/cuenta/preferencias")} />' },
  // el pleno que ignora a sus hermanos: exactamente mi defecto de r11
  R19: [{ path: '(fixture)', src: 'const pleno = elegido && sinGlifo;' }],
  // la marca anidada adentro de la placa: el defecto que se ve como layout
  R22: { filtro: 'function MarcaElegido() {}\n<View style={{ width: 30 }}><MarcaElegido /></View>' },
  R16: { palette: "light0: '#FAF9F7',\npapelTapiz: '#FAF2F5',", temas: 'const lightOficio: Theme = { ...lightTheme }' },
};
const REGLAS = { R1: r1, R2: r2, R3: r3, R4: r4, R5: r5, R6: r6, R7: r7, R8: r8, R9: r9, R10: r10, R11: r11, R12: r12, R13: r13, R14: r14, R15: r15, R16: r16, R17: r17, R18: r18, R19: r19, R20: r20, R22: r22 };
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
corridas.push(['R18 (D-580: la entrada a la galería NO desaparece)', r18({ cuenta: readFileSync(CUENTA_CLIENTE, 'utf8') })]);
corridas.push([
  'R22 (la marca del elegido no se mete en la placa)',
  r22({ filtro: readFileSync(PIEZA_R22, 'utf8') }),
]);
corridas.push([
  'R19 (L-b: el relleno pleno se computa contra sus hermanos)',
  r19(PIEZAS_R19.map((p) => ({ path: p, src: readFileSync(p, 'utf8') }))),
]);
for (const [nombre, res] of corridas) {
  console.log(`${nombre} · ${res.info}`);
  for (const f of res.fallos) { console.error(`  ✗ ${f}`); fallosTotal++; }
}

if (fallosTotal > 0) {
  console.error(`\nverify:diseno — ${fallosTotal} fallo(s)`);
  process.exit(1);
}
console.log(`\nverify:diseno — VERDE (auto-prueba: ${Object.keys(FIXTURES).length} reglas encendieron; informativas declaradas: ${[...INFORMATIVAS].join(',')})`);
