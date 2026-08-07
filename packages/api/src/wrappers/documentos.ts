// S89-A · orden 8 ⑤ — LOS PAPELES DEL PRODUCTO.
//
// El aparato JAMÁS pone su JWT en una URL: pide un token de un solo uso (10
// minutos, gate de acceso a la mascota en el server) y abre la URL del
// documento con ese token. La Edge Function lo valida y lo QUEMA en el mismo
// acto — un link reenviado a un tercero ya no sirve.
//
// v1: `carnet_vacunas`. Historia clínica y certificados heredan el molde.

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:            'No hay sesión activa.',
  sin_acceso:            'No tienes acceso al expediente de esta mascota.',
  tipo_invalido:         'Ese tipo de documento no existe.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'No pudimos preparar el documento. Prueba de nuevo.',
} as const;

export type CodigoDocumento = keyof typeof MENSAJES;
type Falla = { ok: false; codigo: CodigoDocumento; mensaje: string };
function falla(codigo: CodigoDocumento): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export type TipoDocumento = 'carnet_vacunas';

/** Devuelve la URL LISTA PARA ABRIR del documento (token de un solo uso
 *  adentro). Quien la reciba después de usada, recibe un rebote — por
 *  diseño: el papel lleva el expediente de una mascota. */
export async function urlDocumento(
  mascotaId: string,
  tipo: TipoDocumento = 'carnet_vacunas',
): Promise<ResultadoWrapper<string, CodigoDocumento>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('emitir_token_documento', {
    p_mascota_id: mascotaId,
    p_tipo: tipo,
  });

  if (error) {
    if (error.message.startsWith('no_access_to_mascota')) return falla('sin_acceso');
    if (error.message.startsWith('tipo_documento_invalido')) return falla('tipo_invalido');
    if (error.message.startsWith('auth_required')) return falla('sin_sesion');
    return falla('error_desconocido');
  }
  const token = (data as { token?: string } | null)?.token;
  if (typeof token !== 'string') return falla('datos_inconsistentes');

  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (typeof base !== 'string' || base.length === 0) return falla('error_desconocido');
  return { ok: true, data: `${base}/functions/v1/documento-carnet?t=${token}` };
}
