/**
 * S94-PERF · LIB DEL LOOP DE VELOCIDAD.
 *
 * Hereda el transporte de las sesiones de seguridad (`scripts/s92/lib-s92.mjs`)
 * — el mismo `sql()` para el catálogo y el mismo `rest()` para el camino real —
 * y agrega lo único que esta sesión necesita y aquellas no: **medir tiempo**.
 *
 * ── LA REGLA QUE GOBIERNA ESTE ARCHIVO (R4 del arranque) ────────────────────
 * «Un número se juzga por la pregunta que contesta.» Por eso `cronometrar()`
 * NUNCA devuelve un valor solo: devuelve la serie entera, su mediana y su p95,
 * y el que reporta está obligado a decir DÓNDE se midió. Una media sola esconde
 * la cola, y la cola es lo que el usuario siente.
 *
 * ── Y LA QUE NACE DE UN ERROR YA COBRADO EN ESTA CASA ───────────────────────
 * La PRIMERA medición de cualquier cosa por red incluye el handshake TLS y el
 * arranque en frío del pooler. Meterla en la mediana infla el número y hace
 * ver mejoras donde solo hubo calentamiento. `cronometrar()` descarta N tiros
 * de calentamiento **y lo declara en su salida**, jamás en silencio.
 */

export { sql, rest, rpc, tokenDe, guardar, linea, URL, ANON, RAIZ } from '../s92/lib-s92.mjs';

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from '../s92/lib-s92.mjs';

export const SALIDA_PERF = join(RAIZ, 'scripts/perf/salida');

export function guardarPerf(nombre, datos) {
  mkdirSync(SALIDA_PERF, { recursive: true });
  const p = join(SALIDA_PERF, nombre);
  writeFileSync(p, typeof datos === 'string' ? datos : JSON.stringify(datos, null, 1));
  return p;
}

/** Percentil sobre una serie ya ordenable. Sin dependencias. */
export function percentil(serie, p) {
  if (serie.length === 0) return null;
  const s = [...serie].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return Math.round(s[i] * 10) / 10;
}

/**
 * Corre `fn` N veces y devuelve la serie completa + mediana + p95.
 * `calentar` tiros se descartan ANTES de medir, y el número queda en la salida
 * para que nadie tenga que confiar en que se hizo.
 */
export async function cronometrar(fn, { veces = 12, calentar = 2, rotulo = '' } = {}) {
  for (let i = 0; i < calentar; i++) await fn();
  const serie = [];
  for (let i = 0; i < veces; i++) {
    const t0 = performance.now();
    await fn();
    serie.push(performance.now() - t0);
  }
  return {
    rotulo,
    veces,
    calentar,
    p50: percentil(serie, 50),
    p95: percentil(serie, 95),
    min: Math.round(Math.min(...serie) * 10) / 10,
    max: Math.round(Math.max(...serie) * 10) / 10,
    serie: serie.map((x) => Math.round(x * 10) / 10),
  };
}

/** Redondeo a 1 decimal, para no reportar precisión que la medición no tiene. */
export const r1 = (x) => (x === null || x === undefined ? null : Math.round(Number(x) * 10) / 10);

/** Bytes a una unidad legible — los tamaños de tabla son el 90% de este reporte. */
export function humano(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n)) return String(bytes);
  const u = ['B', 'kB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${Math.round(v * 10) / 10} ${u[i]}`;
}
