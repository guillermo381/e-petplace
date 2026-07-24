/**
 * Subida del LOGO del negocio (S76-B1, D-505 — la firma gana productor).
 * Clon del patrón subir-documento (S68-B): dos pasos con huérfano
 * recuperable, lectura por LA FRONTERA de packages/ui (L-137) y causa
 * LITERAL en el log + tipada para la voz de la pantalla.
 *
 * Bucket RELEVADO contra DB viva (S76-B): `avatars` — PÚBLICO (el logo
 * es identidad PÚBLICA del negocio: lo ve el invitado en /invitacion y
 * mañana el pet parent en toda firma; una URL firmada efímera acá sería
 * fricción sin secreto que proteger). Policies vivas: INSERT cualquier
 * authenticated · UPDATE solo carpeta propia — se sube a la carpeta
 * `auth.uid()` con nombre único por timestamp, jamás se pisa.
 *
 * El registro (paso 2) es `actualizarPerfilPrestador({ foto_url })` —
 * la whitelist de PRODUCTO ganó la columna en esta misma tanda; escribe
 * por `user_id`, así que el logo es del TITULAR (coherente con D-513:
 * la gestión de negocio hoy es titular-only).
 */

import { Platform } from 'react-native';
import { leerBytes } from '@epetplace/ui';
import { actualizarPerfilPrestador, getClient } from '@epetplace/api';

const BUCKET = 'avatars';

export type CausaSubidaLogo = 'sin_sesion' | 'lectura' | 'red' | 'servidor';

export type ResultadoSubidaLogo =
  | { ok: true; path: string }
  | {
      ok: false;
      causa: CausaSubidaLogo;
      mensaje: string;
      /** path ya subido — el reintento salta al paso de registro. */
      storagePath?: string;
    };

function esErrorDeRed(mensaje: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(mensaje);
}

export async function subirLogoNegocio(input: {
  uri: string;
  /** reintento post-subida: salta el paso 1. */
  storagePath?: string;
}): Promise<ResultadoSubidaLogo> {
  let path = input.storagePath;

  if (!path) {
    // carpeta propia: la policy UPDATE de `avatars` es por auth.uid()
    const { data: auth } = await getClient().auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return { ok: false, causa: 'sin_sesion', mensaje: 'No hay sesión activa.' };

    path = `${userId}/logo-negocio-${Date.now()}.jpg`;
    let bytes: ArrayBuffer;
    try {
      bytes = await leerBytes(input.uri);
    } catch (e) {
      const lit = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[subir-logo] LECTURA falló (${Platform.OS}) · uri=${input.uri.slice(0, 80)} · ${lit}`);
      return { ok: false, causa: 'lectura', mensaje: lit };
    }
    const { error } = await getClient()
      .storage.from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) {
      console.error(`[subir-logo] SUBIDA falló · bucket=${BUCKET} · ${error.message}`);
      return { ok: false, causa: esErrorDeRed(error.message) ? 'red' : 'servidor', mensaje: error.message };
    }
  }

  const r = await actualizarPerfilPrestador({ foto_url: path });
  if (!r.ok) {
    console.error(`[subir-logo] REGISTRO falló · ${r.mensaje}`);
    return { ok: false, storagePath: path, causa: 'servidor', mensaje: r.mensaje };
  }
  return { ok: true, path };
}

/** Quitar el logo = foto_url a NULL honesto ('' pasa por aNull del
 *  wrapper). El objeto viejo queda en el bucket (huérfano conocido,
 *  clase D-303 — jamás se borra identidad por las dudas). */
export async function quitarLogoNegocio(): Promise<{ ok: boolean; mensaje?: string }> {
  const r = await actualizarPerfilPrestador({ foto_url: '' });
  if (!r.ok) {
    console.error(`[subir-logo] QUITAR falló · ${r.mensaje}`);
    return { ok: false, mensaje: r.mensaje };
  }
  return { ok: true };
}
