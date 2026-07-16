/**
 * Subida del clip de adiestramiento (tanda corta S63-B) — CALCO de
 * subir-evidencia.ts (S44/S61-B10): dos pasos con huérfano recuperable.
 *
 * Bucket REAL del chasis de la A (migración 20260715220000):
 * 'adiestramiento-clips' — privado, 50 MB, MIME video/mp4 ·
 * video/quicktime · video/webm. Path OBLIGATORIO
 * {prestador_id}/{slug}-{timestamp}.{ext}: el PRIMER segmento lo
 * exigen las policies de storage (user_puede_acceder_prestador sobre
 * split_part) Y el RPC de registro (rebota clip_path_invalido).
 *
 * Paso 1 = subir bytes (la frontera dual-forma leerBytes, L-137 3ª
 * enmienda) · Paso 2 = registrar_clip_adiestramiento (sin registro el
 * clip es INVISIBLE para el dueño). Si el paso 2 falla con la subida
 * hecha, el reintento entra por storagePath y salta al paso 2 —
 * jamás re-subir.
 */

import { Platform } from 'react-native';
import { leerBytes } from '@epetplace/ui';
import { getClient, registrarClipAdiestramiento } from '@epetplace/api';

const BUCKET = 'adiestramiento-clips';

export type CausaSubidaClip = 'lectura' | 'red' | 'servidor' | 'registro';

export interface ResultadoSubidaClip {
  ok: boolean;
  /** path ya subido — se conserva para reintentar SOLO el registro. */
  storagePath?: string;
  mensaje?: string;
  causa?: CausaSubidaClip;
}

function esErrorDeRed(mensaje: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(mensaje);
}

/** iOS graba .mov (quicktime); Android, .mp4. El MIME dice la verdad
 *  del archivo — ambos están permitidos por el bucket. */
function tipoDe(uri: string): { ext: string; mime: string } {
  return /\.mov$/i.test(uri) ? { ext: 'mov', mime: 'video/quicktime' } : { ext: 'mp4', mime: 'video/mp4' };
}

export async function subirClip(input: {
  uri: string;
  prestadorId: string;
  adiestramientoId: string;
  /** 1..3 — el techo §12.3; el motor lo re-valida (tope DURO). */
  orden: number;
  duracionS: number;
  /** reintento post-subida: salta el paso 1. */
  storagePath?: string;
}): Promise<ResultadoSubidaClip> {
  let path = input.storagePath;

  if (!path) {
    const { ext, mime } = tipoDe(input.uri);
    path = `${input.prestadorId}/clip-adiestramiento-${Date.now()}.${ext}`;
    let bytes: ArrayBuffer;
    try {
      bytes = await leerBytes(input.uri);
    } catch (e) {
      const lit = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[subir-clip] LECTURA falló (${Platform.OS}) · uri=${input.uri.slice(0, 80)} · ${lit}`);
      return { ok: false, causa: 'lectura', mensaje: lit };
    }
    const { error } = await getClient()
      .storage.from(BUCKET)
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) {
      console.error(`[subir-clip] SUBIDA falló · bucket=${BUCKET} · ${error.message}`);
      return { ok: false, causa: esErrorDeRed(error.message) ? 'red' : 'servidor', mensaje: error.message };
    }
  }

  const r = await registrarClipAdiestramiento({
    adiestramiento_id: input.adiestramientoId,
    storage_path: path,
    orden: input.orden,
    duracion_segundos: input.duracionS,
  });
  if (!r.ok) {
    console.error(`[subir-clip] REGISTRO falló · ${r.codigo} · ${r.mensaje}`);
    return { ok: false, storagePath: path, causa: 'registro', mensaje: r.mensaje };
  }
  return { ok: true, storagePath: path };
}
