/**
 * Subida de fotos de mascota al bucket PRIVADO 'mascotas' (S45-B4.1 →
 * S47-B0.2 privado → S47-B1.2 errores tipados tras el gate B3 fallido).
 * Policy INSERT: primer segmento del path = auth.uid().
 *
 * VÍA: bytes → ArrayBuffer → storage.upload (NO FormData de RN:
 * "Unsupported FormDataPart implementation", probado S45). La LECTURA
 * del archivo vive en la frontera única lib/leer-archivo.ts (cura
 * L-137 dual-forma, no saltable).
 *
 * ERRORES TIPADOS (S47-B1.2 — regla 36: un rechazo del bucket o una
 * excepción local JAMÁS se disfrazan de "problema de conexión"):
 *   lectura_local       — la foto nunca salió del teléfono (FS)
 *   archivo_grande      — pre-check local >5MB o rechazo del bucket
 *   mime_no_soportado   — el bucket solo acepta jpeg/png/webp
 *   rechazado_por_policy— RLS (sesión/carpeta)
 *   red_o_desconocido   — lo único que puede llamarse "conexión"
 * La clasificación del StorageError pasa en ESTA frontera (análogo
 * L-115: acá se toca el crudo, los consumidores solo ven el código);
 * el literal SIEMPRE va al log.
 * Devuelve el PATH (p_foto_url / p_archivo_url guardan path; la
 * lectura firma con resolverUrlFoto — S47-B0.2).
 */

import { getClient } from '@epetplace/api';

import { leerBytes } from '@/lib/leer-archivo';

export { leerBase64 } from '@/lib/leer-archivo';

const BUCKET = 'mascotas';
// Espejo del file_size_limit del bucket (relevado S47-B0.2): el
// pre-check evita el round-trip condenado (resize degradado a original).
const MAX_BYTES = 5 * 1024 * 1024;

export type CodigoErrorSubida =
  | 'lectura_local'
  | 'archivo_grande'
  | 'mime_no_soportado'
  | 'rechazado_por_policy'
  | 'red_o_desconocido';

export type ResultadoSubidaAvatar =
  | { ok: true; path: string }
  | { ok: false; codigo: CodigoErrorSubida; mensaje: string };

// Literales medidos E2E contra el bucket real (S47-B1.2 diagnóstico).
function clasificarErrorStorage(mensaje: string): CodigoErrorSubida {
  if (mensaje.includes('exceeded the maximum allowed size')) return 'archivo_grande';
  if (mensaje.includes('mime type')) return 'mime_no_soportado';
  if (mensaje.includes('row-level security') || mensaje.includes('security policy')) return 'rechazado_por_policy';
  return 'red_o_desconocido';
}

/** Subida genérica al bucket mascotas (carpeta del dueño).
 *  prefijo: 'avatar' | 'carnet'. */
export async function subirFotoMascota(input: {
  uri: string;
  userId: string;
  prefijo: string;
}): Promise<ResultadoSubidaAvatar> {
  const path = `${input.userId}/${input.prefijo}-${Date.now()}.jpg`;

  let bytes: ArrayBuffer;
  try {
    bytes = await leerBytes(input.uri);
  } catch (e) {
    // la foto nunca salió del teléfono — NO es "conexión" (gate B3)
    console.error('[subir-avatar] lectura_local=', e instanceof Error ? `${e.name}: ${e.message}` : String(e));
    return { ok: false, codigo: 'lectura_local', mensaje: 'No se pudo leer la foto del teléfono.' };
  }

  if (bytes.byteLength > MAX_BYTES) {
    console.error('[subir-avatar] archivo_grande pre-check=', bytes.byteLength, 'bytes');
    return { ok: false, codigo: 'archivo_grande', mensaje: 'La foto supera el máximo de 5MB.' };
  }

  const { error } = await getClient()
    .storage.from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) {
    // el literal SIEMPRE al log — un catch mudo escondió un bug (S45)
    console.error('[subir-avatar] storage error=', error.message);
    return { ok: false, codigo: clasificarErrorStorage(error.message), mensaje: error.message };
  }

  return { ok: true, path };
}

export async function subirAvatar(input: {
  uri: string;
  userId: string;
}): Promise<ResultadoSubidaAvatar> {
  return subirFotoMascota({ ...input, prefijo: 'avatar' });
}

/** Borra un objeto propio (policy DELETE por carpeta, S47-B0.2) — la
 *  limpieza cuando la extracción del carnet falla (B3: el objeto no
 *  queda colgado sin aviso). El fallo se loggea y NO rompe el flujo:
 *  el huérfano es deuda conocida (D-303), no un error del dueño. */
export async function borrarFotoMascota(path: string): Promise<void> {
  const { error } = await getClient().storage.from(BUCKET).remove([path]);
  if (error) console.error('[subir-avatar] delete falló', path, '=', error.message);
}
