/**
 * Subida de evidencia del paseo (S44-B4.3; cura S61-B10). Bucket y path
 * RELEVADOS del repo viejo + DB (regla 21/39): bucket privado
 * 'cita-archivos', path {prestador_id}/{slug}-{timestamp}.{ext} — las
 * policies del bucket validan user_puede_acceder_prestador(primer
 * segmento). Dos pasos con huérfano recuperable (patrón S31/S38): si la
 * subida quedó hecha y el registro falló, el reintento salta al paso 2.
 *
 * S61-B10 (diagnóstico B9): la lectura pasa por LA FRONTERA dual-forma
 * de packages/ui (L-137 3ª enmienda — la cura naive local rompía con
 * uris pre-codificados de galería) y TODA falla deja su causa LITERAL
 * en el log ([subir-evidencia] …) + tipada para la voz de la pantalla.
 */

import { Platform } from 'react-native';
import { leerBytes } from '@epetplace/ui';
import { getClient, registrarArchivoAtencion } from '@epetplace/api';

const BUCKET = 'cita-archivos';

export type CausaSubida = 'lectura' | 'red' | 'servidor';

export interface ResultadoSubida {
  ok: boolean;
  /** path ya subido — se conserva para reintentar solo el registro. */
  storagePath?: string;
  mensaje?: string;
  /** S61-B10: la causa tipada — 'red' habla su voz; el resto muestra el literal. */
  causa?: CausaSubida;
}

function esErrorDeRed(mensaje: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(mensaje);
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
    let bytes: ArrayBuffer;
    try {
      bytes = await leerBytes(input.uri);
    } catch (e) {
      const lit = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[subir-evidencia] LECTURA falló (${Platform.OS}) · uri=${input.uri.slice(0, 80)} · ${lit}`);
      return { ok: false, causa: 'lectura', mensaje: lit };
    }
    const { error } = await getClient()
      .storage.from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) {
      console.error(`[subir-evidencia] SUBIDA falló · bucket=${BUCKET} · ${error.message}`);
      return { ok: false, causa: esErrorDeRed(error.message) ? 'red' : 'servidor', mensaje: error.message };
    }
  }

  const r = await registrarArchivoAtencion({
    evento_atencion_id: input.eventoAtencionId,
    bucket: BUCKET,
    storage_path: path,
    mime_type: 'image/jpeg',
  });
  if (!r.ok) {
    console.error(`[subir-evidencia] REGISTRO falló · ${r.mensaje}`);
    return { ok: false, storagePath: path, causa: 'servidor', mensaje: r.mensaje };
  }
  return { ok: true, storagePath: path };
}
