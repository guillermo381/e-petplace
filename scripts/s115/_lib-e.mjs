/**
 * S115-E · Cimiento común de los instrumentos de la pista E.
 *
 * 🔴 L-533 EN LA FUENTE: TRES CÓDIGOS DE SALIDA, Y NINGUNO SE SOLAPA.
 *   0 = SANO      · el producto pasó la medición
 *   1 = ROJO      · el producto tiene el defecto que este instrumento busca
 *   2 = NO CONCLUYENTE · el instrumento no pudo medir (entorno, precondición ausente,
 *                        excepción propia) — jamás se confunde con un hallazgo.
 *
 * *Un instrumento que puede morir con el mismo código que su hallazgo está
 * adivinando.* Por eso acá TODA excepción no capturada sale con 2, y el 1 sólo lo
 * puede emitir una aserción explícita del cuerpo.
 *
 * Uso mínimo:
 *   import { correr, ok, rojo, noConcluyente, q, uno } from './_lib-e.mjs';
 *   correr('nombre-del-instrumento', async (r) => { ... });
 */
import { dbQuery } from '../lib-db.mjs';
import { spawnSync } from 'node:child_process';

export const SANO = 0;
export const ROJO = 1;
export const NO_CONCLUYENTE = 2;

/** Error que significa «el producto está mal» (exit 1). */
export class Rojo extends Error {
  constructor(msg) { super(msg); this.name = 'Rojo'; }
}
/** Error que significa «no pude medir» (exit 2). */
export class NoConcluyente extends Error {
  constructor(msg) { super(msg); this.name = 'NoConcluyente'; }
}

export const rojo = (msg) => { throw new Rojo(msg); };
export const noConcluyente = (msg) => { throw new NoConcluyente(msg); };

/**
 * Consulta de sólo lectura. Cualquier fallo del canal es NO CONCLUYENTE, jamás rojo:
 * que la base no conteste no dice nada del producto.
 */
export function q(sql) {
  try {
    return dbQuery(sql);
  } catch (e) {
    throw new NoConcluyente(`la consulta no pudo correr: ${String(e?.message ?? e).slice(0, 400)}`);
  }
}

/** Primera fila de una consulta que DEBE devolver al menos una. */
export function uno(sql) {
  const filas = q(sql);
  if (!Array.isArray(filas) || filas.length === 0) {
    throw new NoConcluyente(`la consulta no devolvió filas:\n${sql.trim().slice(0, 200)}`);
  }
  return filas[0];
}

/** ¿Existe el objeto? Devuelve boolean; no decide si su ausencia es rojo o no. */
export function existeTabla(nombre) {
  return uno(`select to_regclass('public.${nombre}') is not null as e`).e === true;
}

/** El SHA y la rama se LEEN del objeto, jamás del parte de otra pista. */
export function procedencia() {
  const g = (args) => {
    const r = spawnSync('git', args, { encoding: 'utf8' });
    return r.status === 0 ? r.stdout.trim() : '(no disponible)';
  };
  return {
    sha: g(['rev-parse', 'HEAD']),
    rama: g(['rev-parse', '--abbrev-ref', 'HEAD']),
    sucio: g(['status', '--porcelain']).length > 0,
  };
}

/**
 * Corre un instrumento y traduce su resultado a los tres códigos.
 * El cuerpo recibe un registrador `r` para dejar rastro de lo que midió.
 */
export async function correr(nombre, cuerpo) {
  const p = procedencia();
  const lineas = [];
  const r = {
    di: (s) => { lineas.push(s); console.log(s); },
    dato: (k, v) => { const s = `    ${k}: ${v}`; lineas.push(s); console.log(s); },
  };
  console.log(`\n━━ ${nombre}`);
  console.log(`   rama ${p.rama} · sha ${p.sha.slice(0, 8)}${p.sucio ? ' · ⚠️ árbol sucio' : ''}`);
  try {
    await cuerpo(r);
    console.log(`\n🟢 SANO · ${nombre}`);
    process.exit(SANO);
  } catch (e) {
    if (e instanceof Rojo) {
      console.log(`\n🔴 ROJO · ${nombre}\n   ${e.message}`);
      process.exit(ROJO);
    }
    console.log(`\n⚪ NO CONCLUYENTE · ${nombre}\n   ${e?.name === 'NoConcluyente' ? e.message : `excepción del instrumento: ${String(e?.stack ?? e).slice(0, 600)}`}`);
    process.exit(NO_CONCLUYENTE);
  }
}
