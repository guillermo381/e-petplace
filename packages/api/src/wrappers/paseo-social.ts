// P19 (S59) — la socialización del paseo grupal: la respuesta vive
// EDITABLE en mascotas.paseo_social_ok (null = sin responder); el NO se
// registra SIEMPRE en paseo_social_negativas (también el re-NO). El
// escritor único es la RPC responder_socializacion_paseo (gate: familia
// ADULTA de la mascota — endurecido S59-A3b).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type CodigoErrorPaseoSocial =
  | 'acceso_denegado'
  | 'respuesta_invalida'
  | 'mascota_sin_familia'
  | 'error_desconocido'
  | 'datos_inconsistentes';

const MENSAJES: Record<CodigoErrorPaseoSocial, string> = {
  acceso_denegado: 'No tenés acceso para responder por esta mascota.',
  respuesta_invalida: 'La respuesta no es válida.',
  mascota_sin_familia: 'Esta mascota todavía no tiene una familia armada.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'Ocurrió un error inesperado. Probá de nuevo.',
};

function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorPaseoSocial> {
  // startsWith, no igualdad (L-115)
  const codigo: CodigoErrorPaseoSocial =
    raw === 'auth_required' || raw.startsWith('no_access_to_mascota')
      ? 'acceso_denegado'
      : raw.startsWith('respuesta_invalida')
        ? 'respuesta_invalida'
        : raw.startsWith('mascota_sin_familia')
          ? 'mascota_sin_familia'
          : raw === 'datos_inconsistentes'
            ? 'datos_inconsistentes'
            : 'error_desconocido';
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export interface RespuestaPaseoSocial {
  mascota_id: string;
  paseo_social_ok: boolean;
}

/** Responde (o edita) la pregunta única de P19 para una mascota.
 *  SÍ habilita agendar y no se re-pregunta; NO bloquea la reserva
 *  (guard server `paseo_social_no`) y queda registrado. */
export async function responderSocializacionPaseo(
  mascotaId: string,
  seLlevabien: boolean,
): Promise<ResultadoWrapper<RespuestaPaseoSocial, CodigoErrorPaseoSocial>> {
  const { data, error } = await getClient().rpc('responder_socializacion_paseo', {
    p_mascota_id: mascotaId,
    p_ok: seLlevabien,
  });

  if (error) return fallo(error.message);
  const o = data as Record<string, unknown> | null;
  if (
    o === null ||
    typeof o !== 'object' ||
    o.ok !== true ||
    typeof o.mascota_id !== 'string' ||
    typeof o.paseo_social_ok !== 'boolean'
  ) {
    return fallo('datos_inconsistentes');
  }
  return { ok: true, data: { mascota_id: o.mascota_id, paseo_social_ok: o.paseo_social_ok } };
}
