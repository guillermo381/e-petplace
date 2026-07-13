// Wrappers de CANCELACIÓN Y REAGENDA del paseo SUELTO (S57-A3 — P18
// firmada: POLITICAS v1.5 + MODELO_PASEO v1.3 §3bis + financiero v2.7
// regla 7.16). Las tres ventanas: ≥24 h reagendar o cancelar · 24-2 h
// solo reagendar · <2 h el paseo se pierde (no_show, lado prestador).
// La cancelación se DECLARA sobre el pago (reembolso simulado — cero
// eventos económicos); la elección de destino del reembolso NO existe
// en v1 (decisión founder S57, disparo: Kushki fase 1).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_SUELTO = [
  'acceso_denegado',
  'cita_no_encontrada',
  'cita_es_de_plan',
  'cita_es_de_paquete',
  'cita_estado_invalido',
  'ventana_vencida',
  'ventana_cancelacion_vencida',
  'slot_invalido',
  'slot_en_pasado',
  'fuera_de_horario',
  'slot_ocupado',
  'prestador_no_disponible',
] as const;

export type CodigoErrorCitaSuelta = (typeof CODIGOS_ERROR_SUELTO)[number];

const MENSAJES_ERROR_SUELTO: Record<
  CodigoErrorCitaSuelta | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:       'No tenés acceso para hacer esto.',
  cita_no_encontrada:    'El paseo no existe o ya no es accesible.',
  cita_es_de_plan:       'Este paseo es parte de tu plan — se maneja desde el plan.',
  cita_es_de_paquete:    'Este paseo es de tu paquete — se maneja desde el paquete.',
  cita_estado_invalido:  'Este paseo ya no se puede modificar.',
  ventana_vencida:       'Faltan menos de 2 horas — este paseo ya no se puede mover.',
  ventana_cancelacion_vencida:
    'Faltan menos de 24 horas — ya no se puede cancelar, pero todavía podés reagendarlo.',
  slot_invalido:         'El horario elegido no es válido.',
  slot_en_pasado:        'Ese horario ya pasó — elegí otro.',
  fuera_de_horario:      'El paseador no atiende en ese horario.',
  slot_ocupado:          'Ese horario acaba de ocuparse — elegí otro.',
  prestador_no_disponible: 'El paseador no está disponible en esa fecha — elegí otra.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorCitaSuelta | 'error_desconocido' {
  if (raw === 'auth_required') return 'acceso_denegado';
  // ventana_cancelacion_vencida ANTES que ventana_vencida (prefijo compartido)
  if (raw.startsWith('ventana_cancelacion_vencida')) return 'ventana_cancelacion_vencida';
  for (const codigo of CODIGOS_ERROR_SUELTO) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function mapeoError<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorCitaSuelta> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_SUELTO[codigo] };
}

type Obj = Record<string, unknown>;
function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

/**
 * P18(a)/(b) — con ≥2 h: mueve el paseo pagado a otra franja REAL del
 * MISMO paseador (los inicios salen de obtenerIniciosPaseo, motor de
 * ventana de siempre). El pago viaja con la cita; la franja vieja se
 * libera y se re-oferta sola.
 */
export async function reagendarCitaSuelta(input: {
  cita_id: string;
  /** yyyy-mm-dd */
  nueva_fecha: string;
  /** HH:MM */
  nueva_hora: string;
}): Promise<ResultadoWrapper<{ fecha: string; hora: string }, CodigoErrorCitaSuelta>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('reagendar_cita_suelta', {
    p_cita_id: input.cita_id,
    p_nueva_fecha: input.nueva_fecha,
    p_nueva_hora: input.nueva_hora,
  });
  if (error) return mapeoError(error.message);
  const o = data as Obj | null;
  if (!esObj(o) || o.ok !== true || typeof o.fecha !== 'string') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_SUELTO.datos_inconsistentes };
  }
  return { ok: true, data: { fecha: o.fecha, hora: String(o.hora) } };
}

/**
 * P18(a) — con ≥24 h: cancela definitivo con reembolso SIMULADO Y
 * DECLARADO sobre el pago (regla 7.16 — la superficie dice que el pago
 * era simulado y la devolución también). Entre 24 y 2 h el server rebota
 * ventana_cancelacion_vencida: ahí solo queda reagendar.
 */
export async function cancelarCitaSuelta(
  citaId: string,
): Promise<ResultadoWrapper<{ reembolso_monto: number; reembolso_simulado: true }, CodigoErrorCitaSuelta>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('cancelar_cita_suelta', { p_cita_id: citaId });
  if (error) return mapeoError(error.message);
  const o = data as Obj | null;
  if (!esObj(o) || o.ok !== true || o.reembolso_simulado !== true) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_SUELTO.datos_inconsistentes };
  }
  return { ok: true, data: { reembolso_monto: Number(o.reembolso_monto), reembolso_simulado: true } };
}
