#!/usr/bin/env node
/**
 * construir-referencia — S113-E · el conjunto medido contra LAS DOS MANOS.
 *
 * 🔴 REEMPLAZA a la «verdad de aceptación» de `carnets-reales.json`, que estaba
 * MAL y por eso todo número calculado contra ella medía el error del expediente
 * y no el del modelo. El caso mas claro: el documento A tiene **1 fila
 * aceptada** en la base y **15 en el carnet** — las dos manos lo contaron igual,
 * por separado. Contra esa verdad, un modelo que devuelve 13 filas correctas
 * marca «13 invenciones».
 *
 * ── CÓMO SE COMBINAN LAS DOS MANOS ─────────────────────────────────────────
 * · coinciden      → el valor, marcado `dos_manos`.
 * · uno leyó, el otro no → **el valor del que leyó**. No es desacuerdo: es que
 *   uno pudo y el otro no, y sobre el documento A eso pasa 7 veces y en CERO
 *   hay contradicción.
 * · se contradicen → **el campo se EXCLUYE del puntaje** y queda listado. *No
 *   se elige uno por mí: eso convertiría mi opinión en la vara con la que se
 *   juzga al modelo.*
 *
 * ── LO QUE ESTA REFERENCIA TODAVÍA NO ES ───────────────────────────────────
 * **No está firmada.** Los cinco puntos de `DIFERENCIAS-AL-FOUNDER.md` esperan
 * su ojo. Mientras tanto los campos en disputa NO se puntúan, así que la tabla
 * que sale es un **piso**: cuando el founder firme, esos campos se suman y los
 * números sólo pueden mejorar o quedar igual — nunca empeorar por esta causa.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
const VV = 'docs/loop/verdad-vista';
const di = (s) => console.log(s);
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const val = (f, c) => { for (const k of ({ lote: ['lote', 'lote_visible'] }[c] ?? [c])) if (f?.[k] != null) return f[k]; return null; };

/** Fusiona una fila leída por las dos manos. Lo contradictorio se excluye. */
function fusionar(d, e, disputas, doc, n) {
  const uno = (c) => {
    const vd = val(d, c), ve = val(e, c);
    if (vd == null) return { v: ve, origen: ve == null ? 'ninguno' : 'solo_E' };
    if (ve == null) return { v: vd, origen: 'solo_D' };
    if (norm(vd) === norm(ve)) return { v: vd, origen: 'dos_manos' };
    disputas.push({ doc, fila: n, campo: c, D: vd, E: ve });
    return { v: null, origen: 'EN_DISPUTA' };
  };
  const nombres = [d?.vacuna, e?.vacuna].filter(Boolean);
  const fa = uno('fecha_aplicada'), fp = uno('fecha_proxima'), lo = uno('lote'), ve = uno('veterinario');
  return {
    nombre_aceptado: [...new Set(nombres)],
    fecha_aplicada: fa.v, fecha_proxima: fp.v, lote: lo.v,
    veterinario_aceptado: ve.v ? [ve.v] : [],
    // Ninguna mano transcribió `tipo_vacuna`: sin referencia, no se puntúa.
    tipo_vacuna: null, tipo_ambiguo: true,
    origen: { fecha_aplicada: fa.origen, fecha_proxima: fp.origen, lote: lo.origen, veterinario: ve.origen },
  };
}

const disputas = [];
const docs = {};
const MANOS_FIRMADAS = `${process.env.HOME}/.epetplace/ia-conjuntos/manos`;

/* ── LA REFERENCIA FIRMADA MANDA SOBRE LAS DOS MANOS ───────────────────────
 * Cuando existe `documento-X--FIRMADA.json`, lo que dice ahi PISA al cotejo:
 * el founder miro la foto y cerro. Se aplica de dos formas distintas segun lo
 * que el archivo traiga:
 *  · con `filas` (doc B) ⇒ la referencia ES esa lista, entera.
 *  · sin `filas`, solo `arbitrajes` (doc A) ⇒ se fusionan las dos manos como
 *    siempre y **el arbitraje corrige el campo que nombra**. Doc A no necesito
 *    mas: los dos contamos 15 y no hubo una sola contradiccion.
 */
function firmada(doc) {
  const p = `${MANOS_FIRMADAS}/documento-${doc}--FIRMADA.json`;
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}
for (const doc of ['A', 'B']) {
  const D = JSON.parse(readFileSync(`${VV}/documento-${doc}--D.json`, 'utf8'));
  const E = JSON.parse(readFileSync(`${VV}/documento-${doc}--E.json`, 'utf8'));
  const n = Math.min(D.filas.length, E.filas.length);
  const fdo = firmada(doc);
  let filas;
  if (fdo?.filas) {
    // El founder escribio la lista entera: esa es la referencia.
    filas = fdo.filas.map((f) => ({
      nombre_aceptado: [f.vacuna, f.variante].filter(Boolean),
      fecha_aplicada: f.fecha_aplicada ?? null,
      fecha_parcial: f.fecha_parcial ?? null,
      fecha_literal: f.fecha_literal ?? null,
      precision: f.precision ?? 'dia',
      vencimiento_biologico: f.vencimiento_biologico ?? null,
      fecha_proxima: f.fecha_proxima ?? null,
      lote: f.lote ?? null,
      veterinario_aceptado: [],
      cubre: f.cubre ?? null,
      tipo_vacuna: null, tipo_ambiguo: true,
      origen: { todo: 'FIRMADA' },
    }));
    di(`documento ${doc}: FIRMADA ⇒ ${filas.length} filas (D leia ${D.filas.length}, E ${E.filas.length})`);
  } else {
    filas = [];
    for (let i = 0; i < n; i++) filas.push(fusionar(D.filas[i], E.filas[i], disputas, doc, i + 1));
    for (const a of fdo?.arbitrajes ?? []) {
      if (!a.fila || !a.FIRMADO) continue;
      const f = filas[a.fila - 1];
      if (a.campo === 'vacuna' && f) { f.nombre_aceptado = [a.FIRMADO]; f.origen.vacuna = 'FIRMADA'; }
    }
    di(`documento ${doc}: D=${D.filas.length} E=${E.filas.length} ⇒ ${filas.length} filas${fdo ? ` · ${(fdo.arbitrajes ?? []).filter((a) => a.fila).length} arbitraje(s) aplicado(s)` : ''}`);
  }
  docs[doc] = { filas, n_D: D.filas.length, n_E: E.filas.length, filas_en_disputa: 0 };
}

// Qué imagen pertenece a qué documento — medido abriendo las fotos.
const DE_DOC = {
  'carnet-1783564367515.jpg': 'A',
  'carnet-1785354131272.jpg': 'B', 'carnet-1783694984605.jpg': 'B',
  'carnet-1783632653859.jpg': 'B', 'carnet-1783633828265.jpg': 'B',
};

const viejo = JSON.parse(readFileSync(join(DIR, 'carnets-reales.json'), 'utf8'));
const casos = viejo.casos.filter((c) => DE_DOC[c.caso]).map((c) => ({
  ...c,
  documento: DE_DOC[c.caso],
  n_filas_truth: docs[DE_DOC[c.caso]].filas.length,
  n_filas_visibles: docs[DE_DOC[c.caso]].filas.length,
  regla_visibilidad: 'todas (las dos manos leyeron el documento entero)',
  visibilidad_verificada_a_mano: true,
  solo_para_invencion: false,
  verdad: docs[DE_DOC[c.caso]].filas,
}));

const conjunto = {
  nombre: 'carnets-referencia',
  pieza: 'carnet',
  generado_el: new Date().toISOString(),
  fuente: 'DOS MANOS: docs/loop/verdad-vista/documento-{A,B}--{D,E}.json',
  procedencia_verdad: 'DOS LECTORES INDEPENDIENTES + ARBITRAJE DEL FOUNDER sobre los ocho puntos que no cerraban. Ya no es «lo que dos leyeron igual»: los desacuerdos los miró y los firmó.',
  advertencia: 'FIRMADA el 5-sep-2026. `evidencia` sigue SIN puntuarse: el founder no lo arbitró, y dos lectores con la misma regla se partieron 4 a 0 — el vocabulario no distingue el caso.',
  nota_documento_B: 'sus 4 fotos son el MISMO documento bajo 4 capturas distintas. Como casos independientes valen UNO; acá sirven para medir robustez a la captura, y así se declara.',
  campos_verdad: ['nombre', 'fecha_aplicada', 'fecha_proxima', 'lote', 'veterinario_nombre_externo'],
  campos_no_puntuados: { tipo_vacuna: 'ninguna mano lo transcribió: sin referencia' },
  disputas,
  n_casos: casos.length,
  n_filas_truth: casos.reduce((s, c) => s + c.verdad.length, 0),
  n_filas_visibles: casos.reduce((s, c) => s + c.verdad.length, 0),
  n_filas_no_dibujadas: 0, n_tipos_ambiguos_excluidos: 0,
  casos,
};
writeFileSync(join(DIR, 'carnets-referencia.json'), JSON.stringify(conjunto, null, 2));
di(`\nreferencia: ${DIR}/carnets-referencia.json`);
di(`  ${casos.length} imágenes · ${conjunto.n_filas_truth} filas de referencia · ${disputas.length} campo(s) en disputa, EXCLUIDOS del puntaje`);
for (const d of disputas) di(`     doc ${d.doc} fila ${d.fila} · ${d.campo}: D=${JSON.stringify(d.D)} E=${JSON.stringify(d.E)}`);
