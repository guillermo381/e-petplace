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

/**
 * Redacta cualquier JWT antes de escribirlo a disco.
 *
 * ⚠️ NACE DE UN ERROR PROPIO, y por eso vive acá y no en la disciplina: el
 * censo de secretos de B2 encontró **un token de sesión real que yo mismo había
 * dejado** en `salida/b0-seis-flujos.json` y commiteado. Era de una cuenta
 * fixture y ya venció, pero el punto es otro: **los artefactos de una auditoría
 * de seguridad son un vector nuevo**. Guardar «lo que salió por el cable» es
 * exactamente lo que hace útil el reporte y lo que lo vuelve peligroso.
 *
 * La disciplina no alcanzaba (R6 estaba escrita desde el arranque y no lo
 * evitó); el saneador sí, porque no se puede olvidar.
 */
function redactar(valor) {
  if (typeof valor === 'string') {
    return valor.replace(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, (t) => `«JWT REDACTADO · largo=${t.length} · …${t.slice(-4)}»`);
  }
  if (Array.isArray(valor)) return valor.map(redactar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, redactar(v)]));
  }
  return valor;
}

export function guardarSeg2(nombre, datos) {
  mkdirSync(SALIDA_SEG2, { recursive: true });
  const p = join(SALIDA_SEG2, nombre);
  const limpio = redactar(datos);
  writeFileSync(p, typeof limpio === 'string' ? limpio : JSON.stringify(limpio, null, 1));
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

/**
 * Intento de ESCRITURA sobre un path — el precedente de S47.
 *
 * ⚠️ El `tipo` es un parámetro y no una constante por una razón medida: la
 * primera versión mandaba siempre `text/plain`, y cuando los buckets ganaron
 * `allowed_mime_types` el rebote pasó a ser **415 invalid_mime_type**, que se
 * lee igual que un rebote de policy y no lo es. Para probar una POLICY hay que
 * mandar un tipo que el bucket acepte; si no, se está probando el filtro de
 * mime. *Otra vez la misma trampa: un assert se juzga por la pregunta que
 * contesta.*
 */
export async function subirObjeto(bucket, path, token, contenido = 'seg2-probe', tipo = 'text/plain') {
  const jwt = token ?? ANON_KEY;
  const r = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}`, 'Content-Type': tipo },
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
