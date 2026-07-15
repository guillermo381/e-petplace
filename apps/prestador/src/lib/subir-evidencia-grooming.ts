/**
 * Subida de evidencia del GROOMING (S60-B1; bucket propio S61-B4) —
 * espejo del patrón del paseo (subir-evidencia.ts, S44-B4.3): bucket
 * privado 'grooming-archivos' DEL OFICIO (hallazgo A2/T8: subir al
 * bucket del paseo dejaba la foto infirmable para el dueño; policies
 * por prestador en el primer segmento del path — mismo scheme), dos
 * pasos con huérfano recuperable. La diferencia es el REGISTRO:
 * evento_grooming_archivos vía registrar_archivo_grooming, que porta
 * el TIPO (foto_recibir / foto_durante / foto_entregar /
 * foto_incidencia / otro — CHECK de DB) del que cuelgan los guards del
 * cierre (§8) y del terminar (foto_entregar, D-270). Los objetos
 * viejos en cita-archivos NO se migran: los cubre la policy puente
 * (20260714090000) y el wrapper del dueño firma con fallback.
 */

import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { getClient, registrarArchivoGrooming, type TipoArchivoGrooming } from '@epetplace/api';

// S45/L-137: en Expo Go el path del proyecto contiene '%40…%2F…'
// literales y las FS APIs decodifican %XX → path inexistente.
function uriLegible(uri: string): string {
  return uri.replace(/%/g, '%25');
}

const BUCKET = 'grooming-archivos';

export interface ResultadoSubidaGrooming {
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
  const bytes = await new File(uriLegible(uri)).bytes();
  return bytes.buffer as ArrayBuffer;
}

export async function subirEvidenciaGrooming(input: {
  uri: string;
  prestadorId: string;
  groomingId: string;
  tipo: TipoArchivoGrooming;
  /** reintento post-subida: salta el paso 1. */
  storagePath?: string;
}): Promise<ResultadoSubidaGrooming> {
  let path = input.storagePath;

  if (!path) {
    path = `${input.prestadorId}/foto-grooming-${input.tipo}-${Date.now()}.jpg`;
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

  const r = await registrarArchivoGrooming({
    grooming_id: input.groomingId,
    storage_path: path,
    tipo: input.tipo,
  });
  if (!r.ok) return { ok: false, storagePath: path, mensaje: r.mensaje };
  return { ok: true, storagePath: path };
}
