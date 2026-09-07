#!/usr/bin/env node
/**
 * S113-E · LAS DIFERENCIAS ENTRE LAS DOS MANOS, POR NÚMERO DE FILA.
 *
 * Complementa a `cotejar-verdad.mjs` (de D), que empareja por NOMBRE. Dos
 * cosas hacen que ese emparejamiento produzca casi puro ruido sobre estos dos
 * archivos, y ninguna es un desacuerdo de lectura:
 *
 *  ① **Alias de campo**: D escribe `lote_visible`, E escribe `lote`. El cotejo
 *    compara `lote` ⇒ TODOS los lotes de D salen `null` y aparecen como
 *    desacuerdo. *No lo son: es el mismo dato con otro nombre.*
 *  ② **Granularidad del nombre**: «Peek'o» vs «Peek», «Imrab 3TF (antirrábica,
 *    virus inactivado)» vs «Imrab 3TF». La clave del cotejo son los 14 primeros
 *    caracteres normalizados ⇒ los lee como filas distintas y las reporta como
 *    «sólo D» / «sólo E», cuando los dos vimos la misma fila.
 *
 * Acá el emparejamiento es por **número de fila**, que es lo que los dos
 * lectores recorrimos en el mismo orden, y los alias se resuelven. Lo que queda
 * es desacuerdo de verdad — que es lo único que merece el ojo del founder.
 *
 *   node scripts/ia/diferencias-por-fila.mjs A
 */
import { readFileSync } from 'node:fs';

const DIR = 'docs/loop/verdad-vista';
const ALIAS = { lote: ['lote', 'lote_visible'], vencimiento_biologico: ['vencimiento_biologico', 'vencimiento', 'venc_visible'] };
const CAMPOS = ['vacuna', 'fecha_aplicada', 'fecha_proxima', 'lote', 'vencimiento_biologico', 'veterinario', 'evidencia'];

const val = (fila, campo) => {
  for (const k of (ALIAS[campo] ?? [campo])) if (fila?.[k] != null) return fila[k];
  return null;
};
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

const doc = (process.argv[2] ?? 'A').toUpperCase();
const D = JSON.parse(readFileSync(`${DIR}/documento-${doc}--D.json`, 'utf8'));
const E = JSON.parse(readFileSync(`${DIR}/documento-${doc}--E.json`, 'utf8'));

console.log(`\n═══ DOCUMENTO ${doc} · D (${D.filas.length} filas) vs E (${E.filas.length} filas) ═══`);
console.log(D.filas.length === E.filas.length
  ? `✅ LOS DOS CONTAMOS ${D.filas.length}. El conteo es el numero mas importante y coincide.`
  : `🔴 CONTEOS DISTINTOS: D=${D.filas.length} · E=${E.filas.length}. Eso se arbitra primero.`);

const n = Math.max(D.filas.length, E.filas.length);
let filasConDif = 0, puntos = 0;
const lineas = [];
for (let i = 0; i < n; i++) {
  const d = D.filas[i], e = E.filas[i];
  const difs = [];
  for (const c of CAMPOS) {
    const vd = val(d, c), ve = val(e, c);
    if (norm(vd) === norm(ve)) continue;
    // Un nombre contenido en el otro NO es desacuerdo de lectura: es detalle.
    if (c === 'vacuna' && vd && ve && (norm(vd).includes(norm(ve)) || norm(ve).includes(norm(vd)))) continue;
    difs.push({ campo: c, D: vd, E: ve });
  }
  if (!difs.length) continue;
  filasConDif += 1; puntos += difs.length;
  lineas.push(`\n  FILA ${i + 1}   D: «${val(d,'vacuna') ?? '—'}»\n            E: «${val(e,'vacuna') ?? '—'}»`);
  for (const x of difs) lineas.push(`     ${x.campo.padEnd(22)} D: ${JSON.stringify(x.D)}   E: ${JSON.stringify(x.E)}`);
}

if (!lineas.length) console.log('\n✅ cero desacuerdos de contenido fila por fila.');
else { console.log(`\n--- AL FOUNDER · ${filasConDif} fila(s), ${puntos} punto(s) ---`); console.log(lineas.join('\n')); }
console.log('');
