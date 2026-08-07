// S89-A orden 8 ⑤ · S90-A orden 1 — LOS PAPELES DEL PRODUCTO.
//
// El aparato JAMÁS pone su JWT en una URL: pide un token de un solo uso (10
// minutos, gate de acceso a la mascota en el server) y abre la URL del
// documento con ese token. La Edge Function lo valida y lo QUEMA en el mismo
// acto — un link reenviado a un tercero ya no sirve.
//
// S90-A: muere el mapa local tipo→función — la RPC valida contra
// `cat_documentos_mascota` y DEVUELVE la función que compone el papel. Un
// papel nuevo en el catálogo no toca este archivo (era la tercera de las
// tres enumeraciones a mano que el catálogo vino a matar).
//
// La receta exige su consulta (`refId` = la cita): es UN PAPEL POR CONSULTA
// (decisión 4 firmada, brief S90 ②).

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:            'No hay sesión activa.',
  sin_acceso:            'No tienes acceso al expediente de esta mascota.',
  tipo_invalido:         'Ese tipo de documento no existe.',
  ref_requerida:         'Este documento se emite por consulta: falta indicar cuál.',
  sin_medicacion:        'Esa consulta no tiene medicación prescrita.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'No pudimos preparar el documento. Prueba de nuevo.',
} as const;

export type CodigoDocumento = keyof typeof MENSAJES;
type Falla = { ok: false; codigo: CodigoDocumento; mensaje: string };
function falla(codigo: CodigoDocumento): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export type TipoDocumento =
  | 'carnet_vacunas'
  | 'historia_clinica'
  | 'receta'
  | 'ficha_identidad';

/** Devuelve la URL LISTA PARA ABRIR del documento (token de un solo uso
 *  adentro). Quien la reciba después de usada, recibe un rebote — por
 *  diseño: el papel lleva el expediente de una mascota.
 *  `refId`: para la receta, la cita de la consulta (un papel por consulta). */
export async function urlDocumento(
  mascotaId: string,
  tipo: TipoDocumento = 'carnet_vacunas',
  refId?: string,
): Promise<ResultadoWrapper<string, CodigoDocumento>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('emitir_token_documento', {
    p_mascota_id: mascotaId,
    p_tipo: tipo,
    ...(refId ? { p_ref: refId } : {}),
  });

  if (error) {
    if (error.message.startsWith('no_access_to_mascota')) return falla('sin_acceso');
    if (error.message.startsWith('tipo_documento_invalido')) return falla('tipo_invalido');
    if (error.message.startsWith('ref_requerida')) return falla('ref_requerida');
    if (error.message.startsWith('receta_sin_medicacion')) return falla('sin_medicacion');
    if (error.message.startsWith('auth_required')) return falla('sin_sesion');
    return falla('error_desconocido');
  }
  const fila = data as { token?: string; funcion?: string } | null;
  if (typeof fila?.token !== 'string' || typeof fila?.funcion !== 'string') {
    return falla('datos_inconsistentes');
  }

  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (typeof base !== 'string' || base.length === 0) return falla('error_desconocido');
  return { ok: true, data: `${base}/functions/v1/${fila.funcion}?t=${fila.token}` };
}
