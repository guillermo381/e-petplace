/**
 * Subida del avatar de la mascota (S45-B4.1; medida en dispositivo en
 * S45-bugs). Bucket PÚBLICO 'mascotas' (policy: primer segmento del
 * path = auth.uid()).
 *
 * VÍA: bytes → ArrayBuffer → storage.upload. Medido en dispositivo
 * real: 12B=0.4s · 5MB=44s. Con el resize a ~800px de SelectorAvatar
 * (~100-300KB) la subida es de segundos. NO usar FormData de RN:
 * storage-js lo rechaza con "Unsupported FormDataPart implementation"
 * (probado en dispositivo, S45). La resiliencia vive en el cierre:
 * reintento + "Continuar sin foto".
 * Devuelve la URL pública para la RPC del cierre (p_foto_url).
 */

import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { getClient } from '@epetplace/api';

/**
 * BUG S45 (dos literales del dispositivo): en Expo Go el directorio del
 * proyecto se llama LITERALMENTE `%40guillo381%2Fcliente` (slug del
 * monorepo) y picker/manipulator devuelven ese path crudo como uri.
 * TODA API de FS (File nueva Y legacy) decodifica %XX → resuelve un path
 * inexistente → "Missing 'READ' permission" / "isn't readable".
 * Cura: re-encodear los '%' (→ %25) para que la decodificación devuelva
 * el literal. Probado en este equipo: la forma %2540…%252F… se lee OK.
 * En dev build el path no tiene '%' y esto es un no-op.
 */
function uriLegible(uri: string): string {
  return uri.replace(/%/g, '%25');
}

const BUCKET = 'mascotas';

export type ResultadoSubidaAvatar =
  | { ok: true; fotoUrl: string }
  | { ok: false; mensaje: string };

async function leerBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const r = await fetch(uri);
    return await r.arrayBuffer();
  }
  const bytes = await new File(uriLegible(uri)).bytes();
  return bytes.buffer as ArrayBuffer;
}

export async function subirAvatar(input: {
  uri: string;
  userId: string;
}): Promise<ResultadoSubidaAvatar> {
  const path = `${input.userId}/avatar-${Date.now()}.jpg`;
  try {
    const bytes = await leerBytes(input.uri);
    const { error } = await getClient()
      .storage.from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) {
      // el literal SIEMPRE al log — un catch mudo escondió este bug (S45)
      console.error('[subir-avatar] storage error=', error.message);
      return { ok: false, mensaje: error.message };
    }
  } catch (e) {
    console.error('[subir-avatar] EXCEPCION=', e instanceof Error ? `${e.name}: ${e.message}` : String(e));
    return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo leer la foto.' };
  }

  const { data } = getClient().storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, fotoUrl: data.publicUrl };
}
