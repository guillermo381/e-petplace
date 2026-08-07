// S89-A — EL TREN DE PUSH · la puerta del token.
//
// ⚠️ «push» es vocabulario de INGENIERÍA: jamás aparece de cara a la persona
// (LEY S89, MODELO_NOTIFICACIONES §7). En superficie se dice «avisos en el
// teléfono». Este archivo es motor, y acá el nombre técnico es correcto.
//
// El token lo emite el SO y lo pide `expo-notifications` (horneado en las
// builds 1.0.3/1.0.4). Esta puerta lo guarda idempotente: un aparato que
// re-arranca no acumula filas.

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:          'No hay sesión activa.',
  token_invalido:      'El teléfono no entregó un identificador válido.',
  error_desconocido:   'No pudimos activar los avisos en este teléfono. Prueba de nuevo.',
} as const;

export type CodigoPush = keyof typeof MENSAJES;
type Falla = { ok: false; codigo: CodigoPush; mensaje: string };
function falla(codigo: CodigoPush): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export type PlataformaPush = 'android' | 'ios';

/** Guarda el token de ESTE aparato para ESTA persona. Idempotente. */
export async function registrarTokenDeAparato(
  token: string,
  plataforma: PlataformaPush,
): Promise<ResultadoWrapper<null, CodigoPush>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { error } = await getClient().rpc('registrar_push_token', {
    p_token: token,
    p_plataforma: plataforma,
  });

  if (error) {
    if (error.message.startsWith('token_vacio') || error.message.startsWith('plataforma_invalida')) {
      return falla('token_invalido');
    }
    if (error.message.startsWith('auth_required')) return falla('sin_sesion');
    return falla('error_desconocido');
  }
  return { ok: true, data: null };
}
