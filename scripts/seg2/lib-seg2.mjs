/**
 * S92-BIS · LIB DEL LOOP DEL PERÍMETRO.
 *
 * Hereda el transporte de S92 (`scripts/s92/lib-s92.mjs`) y le agrega lo que
 * esta sesión necesita y aquella no: **Storage por HTTP**, que es el único
 * camino real para un bucket — `storage.objects` por SQL contesta otra pregunta.
 *
 * ── R6 · NINGÚN SECRETO SE TRANSCRIBE ────────────────────────────────────────
 * Todo lo que huela a llave se reporta por IDENTIDAD Y ESTADO: nombre, dónde
 * vive, últimos 4 caracteres, veredicto. `huella()` es la única forma en que un
 * secreto puede aparecer en un reporte de esta sesión.
 */

export { sql, rest, rpc, tokenDe, guardar, linea, URL, ANON, RAIZ } from '../s92/lib-s92.mjs';

import { URL as SUPA_URL, ANON as ANON_KEY } from '../s92/lib-s92.mjs';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

export const SALIDA_SEG2 = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/scripts/seg2/salida';

export function guardarSeg2(nombre, datos) {
  mkdirSync(SALIDA_SEG2, { recursive: true });
  const p = join(SALIDA_SEG2, nombre);
  writeFileSync(p, typeof datos === 'string' ? datos : JSON.stringify(datos, null, 1));
  return p;
}

/**
 * LA ÚNICA FORMA EN QUE UN SECRETO ENTRA A UN REPORTE (R6).
 * Devuelve identidad y forma, jamás el valor: largo, prefijo reconocible y los
 * últimos 4. Con esto alcanza para decir «es la misma llave» o «no lo es», que
 * es lo que un acta necesita — y no alcanza para usarla, que es el punto.
 */
export function huella(valor) {
  if (valor === undefined || valor === null || valor === '') return '(ausente)';
  const s = String(valor);
  const prefijo = s.startsWith('eyJ') ? 'JWT' : s.startsWith('sb_') ? 'sb_' : s.startsWith('EAA') ? 'EAA(Meta)' : s.startsWith('AIza') ? 'AIza(Google)' : s.startsWith('re_') ? 're_(Resend)' : '¿?';
  return `largo=${s.length} · forma=${prefijo} · …${s.slice(-4)}`;
}

/** El claim `role` de un JWT, sin exponer el token. Distingue anon de service_role. */
export function rolDeJwt(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64').toString('utf8'));
    return { role: payload.role ?? '(sin claim role)', ref: payload.ref ?? null, exp: payload.exp ?? null };
  } catch {
    return { role: '(no es un JWT parseable)', ref: null, exp: null };
  }
}

// ── STORAGE POR CAMINO REAL ─────────────────────────────────────────────────

/**
 * Descarga por la ruta PÚBLICA. Si el bucket es público, esto responde 200 sin
 * ninguna credencial — que es exactamente lo que hay que saber.
 */
export async function objetoPublico(bucket, path) {
  const r = await fetch(`${SUPA_URL}/storage/v1/object/public/${bucket}/${encodeURI(path)}`);
  return { status: r.status, bytes: Number(r.headers.get('content-length') ?? 0), tipo: r.headers.get('content-type') };
}

/** Descarga por la ruta autenticada. Sin `token` viaja como `anon`. */
export async function objetoAutenticado(bucket, path, token) {
  const jwt = token ?? ANON_KEY;
  const r = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` },
  });
  const cuerpo = r.status >= 400 ? (await r.text()).slice(0, 160) : '';
  return { status: r.status, bytes: Number(r.headers.get('content-length') ?? 0), cuerpo };
}

/** Listado por la API de Storage — dice si un anónimo puede ENUMERAR un bucket. */
export async function listarBucket(bucket, token, prefijo = '') {
  const jwt = token ?? ANON_KEY;
  const r = await fetch(`${SUPA_URL}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: prefijo, limit: 5, offset: 0 }),
  });
  const texto = await r.text();
  let n = 0;
  try {
    const j = JSON.parse(texto);
    n = Array.isArray(j) ? j.length : 0;
  } catch {
    /* no es json */
  }
  return { status: r.status, objetos: n, cuerpo: texto.slice(0, 160) };
}

/** Intento de ESCRITURA sobre un path ajeno — el precedente de S47. */
export async function subirObjeto(bucket, path, token, contenido = 'seg2-probe') {
  const jwt = token ?? ANON_KEY;
  const r = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}`, 'Content-Type': 'text/plain' },
    body: contenido,
  });
  return { status: r.status, cuerpo: (await r.text()).slice(0, 160) };
}

/** Intento de BORRADO sobre un path ajeno. */
export async function borrarObjeto(bucket, path, token) {
  const jwt = token ?? ANON_KEY;
  const r = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    method: 'DELETE',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` },
  });
  return { status: r.status, cuerpo: (await r.text()).slice(0, 160) };
}
