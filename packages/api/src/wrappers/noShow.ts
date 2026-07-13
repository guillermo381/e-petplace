// Marcar NO-SHOW de una cita — S57-B3 (superficie del PRESTADOR sobre la
// RPC de la A, migración 20260712180000/b43aa7f; Decisión T/7.15-7.16:
// el no_show ES un cierre — devenga igual que cerrar con calidad porque
// la franja se bloqueó de verdad; P16c/P18c). Guards del body verificado
// con pg_get_functiondef (regla 40): solo el prestador de la cita, solo
// estado 'confirmada', y el candado cita_aun_no_ocurre hasta la hora de
// recogida (hora local America/Guayaquil).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_NO_SHOW = [
  'acceso_denegado',
  'cita_no_encontrada',
  'cita_estado_invalido',
  'cita_aun_no_ocurre',
  'cita_sin_precio',
  'prestador_sin_cuenta_comercial',
] as const;

export type CodigoErrorNoShow = (typeof CODIGOS_NO_SHOW)[number];

const MENSAJES_NO_SHOW: Record<
  CodigoErrorNoShow | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:       'No tienes acceso a esta cita.',
  cita_no_encontrada:    'La cita no existe o ya no es accesible.',
  cita_estado_invalido:  'Esta cita no está en un estado que permita marcar no-show.',
  cita_aun_no_ocurre:    'Todavía no es la hora de este paseo — el no-show existe recién desde la hora de recogida.',
  cita_sin_precio:       'La cita no tiene precio registrado — avisa al equipo.',
  prestador_sin_cuenta_comercial: 'Tu negocio no tiene cuenta comercial — avisa al equipo.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'Ocurrió un error inesperado. Prueba de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorNoShow | 'error_desconocido' {
  if (raw === 'auth_required' || raw.startsWith('no_access_to_prestador')) return 'acceso_denegado';
  if (raw.startsWith('cita_no_existe') || raw.startsWith('cita_sin_prestador')) return 'cita_no_encontrada';
  if (raw.startsWith('cita_estado_invalido_para_no_show')) return 'cita_estado_invalido';
  for (const codigo of CODIGOS_NO_SHOW) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

export interface ResultadoNoShow {
  cita_id: string;
  estado: 'no_show';
  /** El devengo del cierre (Decisión T); null = cita sin ciclo de pago (legacy). */
  evento_economico_id: string | null;
}

/** El paseador declara que la familia no cumplió la reserva (cierre no_show — devenga). */
export async function marcarNoShowCita(
  citaId: string,
): Promise<ResultadoWrapper<ResultadoNoShow, CodigoErrorNoShow>> {
  const { data, error } = await getClient().rpc('marcar_no_show_cita', { p_cita_id: citaId });
  if (error) {
    const codigo = normalizarCodigo(error.message);
    return { ok: false, codigo, mensaje: MENSAJES_NO_SHOW[codigo] };
  }
  const o = data as Record<string, unknown> | null;
  if (
    typeof o !== 'object' ||
    o === null ||
    o.ok !== true ||
    typeof o.cita_id !== 'string' ||
    o.estado !== 'no_show' ||
    !(o.evento_economico_id === null || typeof o.evento_economico_id === 'string')
  ) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_NO_SHOW.datos_inconsistentes };
  }
  return {
    ok: true,
    data: {
      cita_id: o.cita_id,
      estado: 'no_show',
      evento_economico_id: o.evento_economico_id as string | null,
    },
  };
}
