#!/usr/bin/env node
/**
 * verify:diseno — el lint de las leyes de diseño FIRMADAS (S81-B, paga
 * D-481: "no hay verify:diseno ni enganche"). LA REGLA DE LA MESA: lo
 * que un lint puede verificar va masivo y el founder NO lo mira; este
 * script SE ENSANCHA con cada ley aplicada (una sección por ley).
 *
 * Salida: exit 0 = todas las reglas duras pasan. El exit se lee del
 * COMANDO, jamás del pipe (L-191).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAICES = ['apps/cliente/src', 'apps/prestador/src'];

function archivosTsx(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...archivosTsx(p));
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const archivos = RAICES.flatMap(archivosTsx);
let fallos = 0;

// ── R1 · 7bis EL EJE DEL RELLENO (FIRMADO 29-jul-2026) sobre
//    SelectorOpcion: `naturaleza` con valor legal; `entidad` y
//    `naturaleza` son EXCLUYENTES (entidad es relleno por espec propia
//    S73 — declarar ambas es contradicción). Censo informativo de
//    adopción por modo. ──
let nExiste = 0, nEntidad = 0, nImplicita = 0;
for (const f of archivos) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/<SelectorOpcion\b/g)) {
    const fin = src.indexOf('/>', m.index);
    const tag = src.slice(m.index, fin === -1 ? m.index + 800 : fin);
    const nat = tag.match(/naturaleza="(\w+)"/);
    const esEntidad = /\bentidad\b/.test(tag);
    const linea = src.slice(0, m.index).split('\n').length;
    if (nat && !['existe', 'seFija'].includes(nat[1])) {
      console.error(`R1 ✗ ${f}:${linea} — naturaleza="${nat[1]}" no es un valor legal`);
      fallos++;
    }
    if (nat && esEntidad) {
      console.error(`R1 ✗ ${f}:${linea} — entidad y naturaleza son excluyentes (entidad ES relleno, S73)`);
      fallos++;
    }
    if (esEntidad) nEntidad++;
    else if (nat?.[1] === 'existe') nExiste++;
    else nImplicita++;
  }
}
console.log(`R1 (7bis/SelectorOpcion) · existe=${nExiste} · entidad=${nEntidad} · seFija-implícita=${nImplicita}`);

// ── R2 · LEY 1 (cero hex crudos en apps) — RATCHET: el baseline son
//    los 8 hex vivos medidos POR ESTE LINT al nacer (lamina-fusion 1 ·
//    animated-icon 3 · techo-oficio 4). Nota de método: el primer conteo
//    de la sesión dio 7 por `grep -c` (cuenta LÍNEAS, no matches — una
//    línea traía dos hex); el contador lo mide la herramienta que lo
//    exige, jamás un grep aparte (L-141). El contador SOLO puede bajar:
//    subirlo = fallo. En 0, el baseline se sella. ──
const BASELINE_HEX = 8;
let hexes = 0;
const hexPorArchivo = new Map();
for (const f of archivos) {
  const n = (readFileSync(f, 'utf8').match(/#[0-9A-Fa-f]{6}\b/g) ?? []).length;
  if (n > 0) { hexes += n; hexPorArchivo.set(f, n); }
}
if (hexes > BASELINE_HEX) {
  console.error(`R2 ✗ Ley 1: ${hexes} hex crudos en apps (baseline ${BASELINE_HEX}) — subió:`);
  for (const [f, n] of hexPorArchivo) console.error(`    ${f}: ${n}`);
  fallos++;
} else {
  console.log(`R2 (Ley 1 hex crudos) · ${hexes}/${BASELINE_HEX} — ${hexes < BASELINE_HEX ? 'BAJÓ: actualizar baseline' : 'estable'}`);
}

if (fallos > 0) {
  console.error(`\nverify:diseno — ${fallos} fallo(s)`);
  process.exit(1);
}
console.log('\nverify:diseno — VERDE');
