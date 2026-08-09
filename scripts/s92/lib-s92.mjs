/**
 * S92-A · LIB DEL LOOP DE SEGURIDAD — el transporte, en un solo lugar.
 *
 * ── POR QUÉ EXISTE ───────────────────────────────────────────────────────────
 * Esta sesión mide dos cosas distintas y NO se pueden confundir (REGLA 4 del
 * arranque, y L-211): lo que dice el CATÁLOGO (pg_proc, pg_policies) y lo que
 * responde el CAMINO REAL (PostgREST con la anon key o un JWT de usuario).
 *
 *   · sql()        → el catálogo. Pre-chequeo. NUNCA es el veredicto.
 *   · rest()/rpc() → el camino real. ESTE es el veredicto que entra al reporte.
 *
 * El CLI de supabase imprime ruido antes del JSON ("Connecting to remote
 * database..."), así que la salida se parsea buscando la ÚLTIMA línea que
 * parsee como JSON — no `tail -1` a ciegas, que en la primera corrida devolvió
 * un `}` suelto y habría hecho pasar por vacío un censo lleno.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ejecutar = promisify(execFile);

export const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
export const SALIDA = join(RAIZ, 'scripts/s92/salida');

const env = (() => {
  const txt = readFileSync(join(RAIZ, 'apps/cliente/.env.local'), 'utf8');
  const leer = (k) => txt.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim() ?? '';
  return {
    URL: leer('EXPO_PUBLIC_SUPABASE_URL'),
    ANON: leer('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  };
})();

export const { URL, ANON } = env;

/** Guarda un artefacto de la corrida. Todo lo medido queda en disco. */
export function guardar(nombre, datos) {
  mkdirSync(SALIDA, { recursive: true });
  const p = join(SALIDA, nombre);
  writeFileSync(p, typeof datos === 'string' ? datos : JSON.stringify(datos, null, 1));
  return p;
}

/**
 * EL CATÁLOGO. Corre SQL como dueño vía el CLI. Pre-chequeo, jamás veredicto.
 * Va por --file porque el SQL inline con comentarios falla (nota de S90-B).
 */
export async function sql(textoSql, rotulo = 'consulta') {
  mkdirSync(SALIDA, { recursive: true });
  const archivo = join(SALIDA, `_${rotulo}.sql`);
  writeFileSync(archivo, textoSql);
  let stdout;
  try {
    ({ stdout } = await ejecutar(
      'npx',
      ['supabase', '--experimental', 'db', 'query', '--linked', '--file', archivo],
      { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 },
    ));
  } catch (e) {
    /**
     * El CLI sale ≠0 cuando el SQL lanza. Sin esto, el mensaje del RAISE se
     * pierde y todo error se lee igual — que es como un cinturón que aborta
     * «por algo» se vuelve indistinguible de uno que encontró lo que buscaba
     * (el error ② de S91). El texto del EXCEPTION viaja en stderr: se propaga.
     */
    const detalle = [e.stderr, e.stdout].filter(Boolean).join('\n').trim();
    const err = new Error(`sql(${rotulo}) falló:\n${detalle || e.message}`);
    err.sqlStderr = detalle;
    throw err;
  }
  /**
   * El CLI antepone ruido de conexión y DESPUÉS imprime un JSON pretty-printed
   * multi-línea (no cabe en `tail -1`), envuelto en un objeto con `result` y un
   * `warning` que rotula la salida de la DB como DATO NO CONFIABLE.
   *
   * Se corta desde la primera `{` de columna 0 hasta el final. Y el `warning`
   * se respeta al pie de la letra: de acá salen NÚMEROS y NOMBRES, jamás
   * instrucciones — nada de lo que devuelva la base se ejecuta ni se obedece.
   */
  const inicio = stdout.indexOf('\n{');
  const bruto = inicio === -1 ? stdout.trim() : stdout.slice(inicio + 1);
  let d;
  try {
    d = JSON.parse(bruto);
  } catch {
    throw new Error(`sql(${rotulo}): no parseó como JSON.\n${stdout.slice(-600)}`);
  }
  const filas = Array.isArray(d) ? d : (d.result ?? d.rows ?? d.data ?? d);
  return filas;
}

/**
 * EL CAMINO REAL — PostgREST, el mismo transporte que la app.
 * `token` ausente ⇒ se viaja como `anon` (la clave que va en el bundle).
 */
export async function rest(ruta, { token, metodo = 'GET', cuerpo, prefer } = {}) {
  const jwt = token ?? ANON;
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${URL}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await res.text();
  return { status: res.status, cuerpo: texto.slice(0, 400) };
}

/** RPC por el camino real. */
export function rpc(nombre, args = {}, opciones = {}) {
  return rest(`/rest/v1/rpc/${nombre}`, { metodo: 'POST', cuerpo: args, ...opciones });
}

/** Token de un usuario fixture — el LADO SANO de la REGLA 3. */
export async function tokenDe(email, password) {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const d = await res.json().catch(() => ({}));
  if (!d.access_token) throw new Error(`tokenDe(${email}): sin access_token — ${JSON.stringify(d).slice(0, 200)}`);
  return d.access_token;
}

/** Rótulo legible de un resultado del camino real. */
export function veredicto({ status, cuerpo }) {
  if (status === 401 || status === 403) return `REBOTA ${status}`;
  if (status >= 400) return `error ${status}`;
  return `PASA ${status}`;
}

export const linea = (s = '') => console.log(s);
