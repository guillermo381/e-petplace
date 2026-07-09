// Resolución de URLs FIRMADAS para las fotos de mascotas (S47-B0.2).
// El bucket `mascotas` es PRIVADO y `mascotas.foto_url` guarda el PATH
// (la URL firmada es efímera: persistirla sería guardar algo vencido).
// La RLS se evalúa AL FIRMAR (policy mascotas_select_dueno_o_acceso:
// carpeta propia del dueño OR join inverso foto_url +
// user_tiene_acceso_a_mascota — el prestador con acceso firma).
//
// Cache en memoria con TTL: re-renders y navegación no re-firman; el
// batch firma una lista entera (Agenda) en UN round-trip.
//
// Contrato de degradación (decisión arquitecto S47): un path que no se
// puede firmar devuelve null/entrada ausente y el consumidor cae a la
// huella digna de AvatarMascota — degradación DISEÑADA del sistema, no
// fallback mudo: cada fallo loggea su literal (regla 36).

import { getClient } from '../client';

const BUCKET = 'mascotas';
const TTL_SEGUNDOS = 3600;
/** Margen antes del vencimiento real: una URL a punto de vencer no sirve
 *  para un <Image> que la va a pedir "en un rato". */
const MARGEN_MS = 5 * 60 * 1000;

const cache = new Map<string, { url: string; venceEn: number }>();

function deCache(path: string): string | null {
  const hit = cache.get(path);
  if (hit && hit.venceEn > Date.now()) return hit.url;
  if (hit) cache.delete(path);
  return null;
}

function guardar(path: string, url: string): void {
  cache.set(path, { url, venceEn: Date.now() + TTL_SEGUNDOS * 1000 - MARGEN_MS });
}

/** URL firmada para UN path del bucket mascotas (null = no firmable:
 *  sin acceso o path inexistente — literal al log, huella en pantalla). */
export async function resolverUrlFoto(path: string): Promise<string | null> {
  const cacheada = deCache(path);
  if (cacheada !== null) return cacheada;

  const { data, error } = await getClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, TTL_SEGUNDOS);

  if (error || !data?.signedUrl) {
    console.error('[fotos] no se pudo firmar', path, '=', error?.message ?? 'sin signedUrl');
    return null;
  }
  guardar(path, data.signedUrl);
  return data.signedUrl;
}

/** URLs firmadas para una LISTA de paths (Agenda: un solo round-trip).
 *  El Map trae solo los paths firmables; los ausentes quedan loggeados. */
export async function resolverUrlsFotos(paths: string[]): Promise<Map<string, string>> {
  const resultado = new Map<string, string>();
  const faltantes: string[] = [];

  for (const p of paths) {
    const cacheada = deCache(p);
    if (cacheada !== null) resultado.set(p, cacheada);
    else if (!faltantes.includes(p)) faltantes.push(p);
  }
  if (faltantes.length === 0) return resultado;

  const { data, error } = await getClient()
    .storage.from(BUCKET)
    .createSignedUrls(faltantes, TTL_SEGUNDOS);

  if (error || !data) {
    console.error('[fotos] batch de firma falló =', error?.message ?? 'sin data');
    return resultado;
  }
  for (const item of data) {
    if (item.error || !item.signedUrl || !item.path) {
      console.error('[fotos] no se pudo firmar', item.path ?? '(sin path)', '=', item.error ?? 'sin signedUrl');
      continue;
    }
    guardar(item.path, item.signedUrl);
    resultado.set(item.path, item.signedUrl);
  }
  return resultado;
}
