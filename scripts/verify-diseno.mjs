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
const CASA_OVERRIDE_S82C = /apps\/cliente\/src\/(app\/\(tabs\)\/hogar\/(index|mascota\/\[mascotaId\])|components\/canto-curva)\.tsx$/;
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
  // Los 5 del censo del estreno — deuda declarada, arbitraje founder:
  // el borderline de texto (4.48, y el porqué: el gate S43 compone el
  // tinte sobre CARD y pasa; sobre BASE queda 0.02 abajo)…
  'light·texto·status.dangerText/status.dangerBg',
  // …y los 4 cantos claros: los hex puros de identidad (verdeVital) y
  // cuidado (teal) sobre papel no llegan a 3:1 — la letra vigente del
  // gate S43 los EXIME como registro gráfico redundante (el glifo y la
  // voz portan el canal); R12 los pone a la vista para que la exención
  // se ratifique o muera EN LA MESA, no por costumbre.
  'light·canto·capa.identidad/bg.card',
  'light·canto·capa.identidad/bg.base',
  'light·canto·capa.cuidado/bg.card',
  'light·canto·capa.cuidado/bg.base',
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
/** El volcador corre UNA vez por invocación; si cae, R12 falla fuerte. */
function paresReales() {
  try {
    const out = execSync('pnpm exec tsx scripts/verify-diseno-pares.ts', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const pares = JSON.parse(out);
    if (!Array.isArray(pares) || pares.length === 0) throw new Error('volcador vacío');
    return pares;
  } catch (e) {
    return { caido: String(e.message ?? e).slice(0, 120) };
  }
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
const BASELINE_R13 = { 'apps/cliente/src/app/(tabs)/hogar/index.tsx': 1 };
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
};
const REGLAS = { R1: r1, R2: r2, R3: r3, R4: r4, R5: r5, R6: r6, R7: r7, R8: r8, R9: r9, R10: r10, R11: r11, R12: r12, R13: r13, R14: r14 };
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
// R12 corre sobre el volcador vivo; si el volcador cayó, FALLA FUERTE.
const pares = paresReales();
corridas.push(
  'caido' in (pares ?? {})
    ? ['R12 (contraste dos temas)', { fallos: [`el VOLCADOR no corrió (${pares.caido}) — sin pares no hay verificación (L-192)`], info: 'VOLCADOR CAÍDO' }]
    : ['R12 (contraste dos temas: texto 4.5 · canto 3.0)', r12(pares)],
);
corridas.push(['R13 (A6: control contorneado, cliente)', r13(apps)]);
for (const [nombre, res] of corridas) {
  console.log(`${nombre} · ${res.info}`);
  for (const f of res.fallos) { console.error(`  ✗ ${f}`); fallosTotal++; }
}

if (fallosTotal > 0) {
  console.error(`\nverify:diseno — ${fallosTotal} fallo(s)`);
  process.exit(1);
}
console.log(`\nverify:diseno — VERDE (auto-prueba: ${Object.keys(FIXTURES).length} reglas encendieron; informativas declaradas: ${[...INFORMATIVAS].join(',')})`);
