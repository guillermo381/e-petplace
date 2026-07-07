/**
 * Subida de evidencia del paseo (S44-B4.3). Bucket y path RELEVADOS
 * del repo viejo + DB (regla 21/39): bucket privado 'cita-archivos',
 * path {prestador_id}/{slug}-{timestamp}.{ext} — las policies del
 * bucket validan user_puede_acceder_prestador(primer segmento).
 * Dos pasos con huérfano recuperable (patrón S31/S38): si la subida
 * quedó hecha y el registro falló, el reintento salta directo al paso 2.
 */

import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { getClient, registrarArchivoAtencion } from '@epetplace/api';

const BUCKET = 'cita-archivos';

export interface ResultadoSubida {
  ok: boolean;
  /** path ya subido — se conserva para reintentar solo el registro. */
  storagePath?: string;
  mensaje?: string;
}

async function leerBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const r = await fetch(uri);
    return await r.arrayBuffer();
  }
  const bytes = await new File(uri).bytes();
  return bytes.buffer as ArrayBuffer;
}

export async function subirEvidencia(input: {
  uri: string;
  prestadorId: string;
  eventoAtencionId: string;
  /** reintento post-subida: salta el paso 1. */
  storagePath?: string;
}): Promise<ResultadoSubida> {
  let path = input.storagePath;

  if (!path) {
    path = `${input.prestadorId}/foto-paseo-${Date.now()}.jpg`;
    try {
      const bytes = await leerBytes(input.uri);
      const { error } = await getClient()
        .storage.from(BUCKET)
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
      if (error) return { ok: false, mensaje: error.message };
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo leer la foto.' };
    }
  }

  const r = await registrarArchivoAtencion({
    evento_atencion_id: input.eventoAtencionId,
    bucket: BUCKET,
    storage_path: path,
    mime_type: 'image/jpeg',
  });
  if (!r.ok) return { ok: false, storagePath: path, mensaje: r.mensaje };
  return { ok: true, storagePath: path };
}
