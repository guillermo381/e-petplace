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
for (const doc of ['A', 'B']) {
  const D = JSON.parse(readFileSync(`${VV}/documento-${doc}--D.json`, 'utf8'));
  const E = JSON.parse(readFileSync(`${VV}/documento-${doc}--E.json`, 'utf8'));
  const n = Math.min(D.filas.length, E.filas.length);
  const filas = [];
  for (let i = 0; i < n; i++) filas.push(fusionar(D.filas[i], E.filas[i], disputas, doc, i + 1));
  const extra = Math.abs(D.filas.length - E.filas.length);
  docs[doc] = { filas, n_D: D.filas.length, n_E: E.filas.length, filas_en_disputa: extra };
  di(`documento ${doc}: D=${D.filas.length} E=${E.filas.length} ⇒ ${filas.length} filas de referencia${extra ? ` (+${extra} EN DISPUTA, fuera del puntaje)` : ''}`);
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
  procedencia_verdad: 'DOS LECTORES INDEPENDIENTES. Lo coincidente NO es «verdad»: es que dos lectores leyeron igual, y dos lectores pueden equivocarse igual. Lo contradictorio se excluye del puntaje en vez de resolverlo por mi cuenta.',
  advertencia: 'NO FIRMADA. Los puntos de DIFERENCIAS-AL-FOUNDER.md esperan arbitraje; mientras tanto los campos en disputa no se puntúan y la tabla es un PISO.',
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
