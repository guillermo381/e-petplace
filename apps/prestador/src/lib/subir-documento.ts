/**
 * Subida de documentos de verificación profesional (S68-B, P3). Clon
 * del patrón subir-evidencia (S61-B10): dos pasos con huérfano
 * recuperable, lectura por LA FRONTERA de packages/ui (L-137) y causa
 * LITERAL en el log + tipada para la voz de la pantalla.
 *
 * Bucket y path RELEVADOS contra DB viva (S68-B): bucket PRIVADO
 * 'prestador-documentos', policy prestador_archivos_propios — la
 * carpeta raíz del path es el AUTH.UID() del usuario (NO el
 * prestador_id; a diferencia de cita-archivos). Admin lee por su
 * policy propia.
 */

import { Platform } from 'react-native';
import { leerBytes } from '@epetplace/ui';
import {
  getClient,
  registrarDocumentoVerificacion,
  type DocumentoVerificacion,
  type TipoDocumentoVerificacion,
} from '@epetplace/api';

const BUCKET = 'prestador-documentos';

export type CausaSubidaDocumento = 'sin_sesion' | 'lectura' | 'red' | 'servidor';

export type ResultadoSubidaDocumento =
  | { ok: true; documento: DocumentoVerificacion }
  | {
      ok: false;
      causa: CausaSubidaDocumento;
      mensaje: string;
      /** path ya subido — el reintento salta al paso de registro. */
      storagePath?: string;
    };

function esErrorDeRed(mensaje: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(mensaje);
}

export async function subirDocumentoVerificacion(input: {
  uri: string;
  prestadorId: string;
  tipo: TipoDocumentoVerificacion;
  /** El nombre humano con que se registra (voz de la pantalla). */
  nombre: string;
  /** reintento post-subida: salta el paso 1. */
  storagePath?: string;
}): Promise<ResultadoSubidaDocumento> {
  let path = input.storagePath;

  if (!path) {
    // la carpeta raíz ES el auth.uid() (policy prestador_archivos_propios)
    const { data: auth } = await getClient().auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return { ok: false, causa: 'sin_sesion', mensaje: 'No hay sesión activa.' };

    path = `${userId}/${input.tipo}-${Date.now()}.jpg`;
    let bytes: ArrayBuffer;
    try {
      bytes = await leerBytes(input.uri);
    } catch (e) {
      const lit = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[subir-documento] LECTURA falló (${Platform.OS}) · uri=${input.uri.slice(0, 80)} · ${lit}`);
      return { ok: false, causa: 'lectura', mensaje: lit };
    }
    const { error } = await getClient()
      .storage.from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) {
      console.error(`[subir-documento] SUBIDA falló · bucket=${BUCKET} · ${error.message}`);
      return { ok: false, causa: esErrorDeRed(error.message) ? 'red' : 'servidor', mensaje: error.message };
    }
  }

  const r = await registrarDocumentoVerificacion({
    prestadorId: input.prestadorId,
    tipo: input.tipo,
    nombre: input.nombre,
    archivoPath: path,
  });
  if (!r.ok) {
    console.error(`[subir-documento] REGISTRO falló · ${r.mensaje}`);
    return { ok: false, storagePath: path, causa: 'servidor', mensaje: r.mensaje };
  }
  return { ok: true, documento: r.data };
}
