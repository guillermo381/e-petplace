// Wrapper del CONTACTO DE LA VISITA (S74-A, decisión de mesa): nombre +
// teléfono de QUIEN RESERVÓ la cita — el contacto es propiedad de la
// VISITA, no del animal (recepción v1 no toca D-485 ni el modelo de
// familia). RPC `obtener_contacto_reserva_cita`: gate por
// `empleado_tiene_rol` del negocio de la cita (recepción INCLUIDA, A3.4);
// walk-in sin reservador = nulls honestos — la pantalla dice el hueco
// (Ley 13), el motor no inventa. El teléfono viaja con su código de país
// TAL CUAL está guardado (letra Uber P21: jamás derivado del perfil).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_CONTACTO = [
  'auth_required',
  'cita_no_encontrada',
  'sin_acceso',
] as const;

export type CodigoErrorContactoReserva = (typeof CODIGOS_ERROR_CONTACTO)[number];

const MENSAJES_ERROR_CONTACTO: Record<
  CodigoErrorContactoReserva | 'error_desconocido',
  string
> = {
  auth_required: 'No hay sesión activa.',
  cita_no_encontrada: 'La cita no existe o ya no es accesible.',
  sin_acceso: 'No tienes acceso al contacto de esta visita.',
  error_desconocido: 'No pudimos cargar el contacto. Prueba de nuevo.',
};

export interface ContactoReservaCita {
  /** Nombre de quien reservó; null honesto (walk-in fantasma o perfil sin nombre). */
  nombre: string | null;
  telefono: string | null;
  telefonoCodigoPais: string | null;
}

function mapeoErrorContacto(raw: string): ResultadoWrapper<never> {
  for (const codigo of CODIGOS_ERROR_CONTACTO) {
    // L-115: los RPCs levantan '<codigo>: <detalle>' — normalizar por prefijo
    if (raw.startsWith(codigo)) {
      return { ok: false, codigo, mensaje: MENSAJES_ERROR_CONTACTO[codigo] };
    }
  }
  return {
    ok: false,
    codigo: 'error_desconocido',
    mensaje: MENSAJES_ERROR_CONTACTO.error_desconocido,
  };
}

/** El contacto de quien reservó la cita, para el equipo del negocio que
 *  la recibe. Siempre las mismas claves, null sin dato (L-124): un
 *  reservador sin perfil legible resuelve a nulls honestos, jamás a
 *  error inventado. */
export async function obtenerContactoReservaCita(
  citaId: string,
): Promise<ResultadoWrapper<ContactoReservaCita>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('obtener_contacto_reserva_cita', {
    p_cita_id: citaId,
  });
  if (error) return mapeoErrorContacto(error.message);
  const fila = Array.isArray(data) ? data[0] : null;
  return {
    ok: true,
    data: {
      nombre: fila?.nombre ?? null,
      telefono: fila?.telefono ?? null,
      telefonoCodigoPais: fila?.telefono_codigo_pais ?? null,
    },
  };
}
