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
  registrarDocumentoCuenta,
  registrarDocumentoVerificacion,
  type DocumentoCuenta,
  type DocumentoVerificacion,
  type TipoDocumentoVerificacion,
} from '@epetplace/api';

/** El vocabulario de tipos lo dicta el motor (`cuenta_comercial_documentos`),
 *  jamás la pantalla. */
export type TipoDocumentoCuenta = DocumentoCuenta['tipo'];

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
  /** S84-C33 — ISO2 del país que EMITIÓ el documento. Se ENSANCHA en vez
   *  de clonar el helper (L-175): el pipeline de subida es el mismo y lo
   *  único nuevo es un campo que viaja al registro.
   *  **Omitirlo guarda null = "no declarado"** — jamás el país del
   *  negocio (P21). */
  paisEmisor?: string;
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
    paisEmisor: input.paisEmisor,
  });
  if (!r.ok) {
    console.error(`[subir-documento] REGISTRO falló · ${r.mensaje}`);
    return { ok: false, storagePath: path, causa: 'servidor', mensaje: r.mensaje };
  }
  return { ok: true, documento: r.data };
}

/* ══════════════════════════════════════════════════════════════════════
 * LOS DOCUMENTOS DE LA CUENTA COMERCIAL (S97-C · paso ③ del wizard)
 *
 * Vive ACÁ y no en un archivo clon (L-175: se ensancha la casa, no se
 * copia el pipeline) — comparte `leerBytes`, `esErrorDeRed` y la forma
 * del huérfano recuperable.
 *
 * 🔴 LO QUE **NO** SE HEREDA, y es el motivo de medirlo en vez de
 * copiarlo: **la carpeta raíz del path es el `cuenta_comercial_id`**, no
 * el `auth.uid()`. Medido contra la policy viva
 * `cuenta_documentos_operador`, que llavea por
 * `_user_opera_cuenta_comercial((storage.foldername(name))[1], auth.uid())`
 * — al revés del bucket del prestador. Copiar el path de arriba habría
 * dado un rebote de permisos con el archivo ya subido.
 * ══════════════════════════════════════════════════════════════════════ */

const BUCKET_CUENTA = 'cuenta-documentos';

export type ResultadoSubidaDocumentoCuenta =
  | { ok: true; documentoId: string }
  | { ok: false; causa: CausaSubidaDocumento; mensaje: string; storagePath?: string };

export async function subirDocumentoCuenta(input: {
  uri: string;
  cuentaComercialId: string;
  tipo: TipoDocumentoCuenta;
  nombre: string;
  /** reintento post-subida: salta el paso 1 (huérfano recuperable). */
  storagePath?: string;
}): Promise<ResultadoSubidaDocumentoCuenta> {
  let path = input.storagePath;

  if (!path) {
    // La carpeta raíz ES la cuenta comercial (policy medida arriba).
    path = `${input.cuentaComercialId}/${input.tipo}-${Date.now()}.jpg`;
    let bytes: ArrayBuffer;
    try {
      bytes = await leerBytes(input.uri);
    } catch (e) {
      const lit = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(
        `[subir-documento-cuenta] LECTURA falló (${Platform.OS}) · uri=${input.uri.slice(0, 80)} · ${lit}`,
      );
      return { ok: false, causa: 'lectura', mensaje: lit };
    }
    const { error } = await getClient()
      .storage.from(BUCKET_CUENTA)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) {
      console.error(`[subir-documento-cuenta] SUBIDA falló · bucket=${BUCKET_CUENTA} · ${error.message}`);
      return {
        ok: false,
        causa: esErrorDeRed(error.message) ? 'red' : 'servidor',
        mensaje: error.message,
      };
    }
  }

  const r = await registrarDocumentoCuenta({
    cuenta_comercial_id: input.cuentaComercialId,
    tipo: input.tipo,
    nombre: input.nombre,
    archivo_path: path,
  });
  if (!r.ok) {
    console.error(`[subir-documento-cuenta] REGISTRO falló · ${r.mensaje}`);
    return { ok: false, storagePath: path, causa: 'servidor', mensaje: r.mensaje };
  }
  return { ok: true, documentoId: r.data.documento_id };
}
