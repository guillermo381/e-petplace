/**
 * Subida de evidencia del GROOMING (S60-B1; bucket propio S61-B4; cura
 * S61-B10) — espejo del patrón del paseo (subir-evidencia.ts): bucket
 * privado 'grooming-archivos' DEL OFICIO (hallazgo A2/T8; policies por
 * prestador en el primer segmento del path), dos pasos con huérfano
 * recuperable. La diferencia es el REGISTRO: evento_grooming_archivos
 * vía registrar_archivo_grooming, que porta el TIPO (foto_recibir /
 * foto_durante / foto_entregar / foto_incidencia / otro — CHECK de DB)
 * del que cuelgan los guards del cierre (§8) y del terminar
 * (foto_entregar, D-270). Los objetos viejos en cita-archivos NO se
 * migran: los cubre la policy puente (20260714090000) y el wrapper del
 * dueño firma con fallback.
 *
 * S61-B10 (diagnóstico B9): la lectura pasa por LA FRONTERA dual-forma
 * de packages/ui (L-137 3ª enmienda — la cura naive local rompía con
 * uris pre-codificados de galería) y TODA falla deja su causa LITERAL
 * en el log ([subir-evidencia-grooming] …) + tipada para la pantalla.
 */

import { Platform } from 'react-native';
import { leerBytes } from '@epetplace/ui';
import { getClient, registrarArchivoGrooming, type TipoArchivoGrooming } from '@epetplace/api';

const BUCKET = 'grooming-archivos';

export type CausaSubidaGrooming = 'lectura' | 'red' | 'servidor';

export interface ResultadoSubidaGrooming {
  ok: boolean;
  /** path ya subido — se conserva para reintentar solo el registro. */
  storagePath?: string;
  mensaje?: string;
  /** S61-B10: la causa tipada — 'red' habla su voz; el resto muestra el literal. */
  causa?: CausaSubidaGrooming;
}

function esErrorDeRed(mensaje: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(mensaje);
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
    let bytes: ArrayBuffer;
    try {
      bytes = await leerBytes(input.uri);
    } catch (e) {
      const lit = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[subir-evidencia-grooming] LECTURA falló (${Platform.OS}) · uri=${input.uri.slice(0, 80)} · ${lit}`);
      return { ok: false, causa: 'lectura', mensaje: lit };
    }
    const { error } = await getClient()
      .storage.from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) {
      console.error(`[subir-evidencia-grooming] SUBIDA falló · bucket=${BUCKET} · ${error.message}`);
      return { ok: false, causa: esErrorDeRed(error.message) ? 'red' : 'servidor', mensaje: error.message };
    }
  }

  const r = await registrarArchivoGrooming({
    grooming_id: input.groomingId,
    storage_path: path,
    tipo: input.tipo,
  });
  if (!r.ok) {
    console.error(`[subir-evidencia-grooming] REGISTRO falló · ${r.mensaje}`);
    return { ok: false, storagePath: path, causa: 'servidor', mensaje: r.mensaje };
  }
  return { ok: true, storagePath: path };
}
