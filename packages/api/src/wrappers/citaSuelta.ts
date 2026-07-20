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

// ── Las citas del dueño fuera del plan (sueltas y de paquete) ────────────────

export interface CitaPaseoDueno {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  duracion_minutos: number;
  precio: number | null;
  prestador_id: string | null;
  /** S60-A6 (aditivo): la zona de servicios del Hogar habla con nombre. */
  mascota_id: string | null;
  tipo_servicio: string | null;
  /** Discrimina la familia: 'paquete' (bono_id) o 'suelta'. El plan vive en obtenerCitasDePlan. */
  origen: 'suelta' | 'paquete';
  bono_id: string | null;
}

/**
 * Las citas de paseo del dueño que NO son de plan (RLS solo-dueño):
 * sueltas pagadas y reservas de paquete — el hub "Mis paseos" las lista
 * junto a los planes. Todos los estados; la superficie decide qué pinta.
 */
export async function obtenerMisCitasPaseo(): Promise<
  ResultadoWrapper<CitaPaseoDueno[], CodigoErrorCitaSuelta>
> {
  const supabase = getClient();
  // CURA S60-A4: la lectura era categoría-AGNÓSTICA y las citas de
  // grooming se FUGABAN a "Mis paseos". El filtro sale del CATÁLOGO
  // (regla 21 — paseo tiene varios códigos: paseo/paseo_paquete/
  // paseo_mensual, jamás hardcode); tipo NULL se conserva (legacy
  // pre-tipo: nunca es grooming, y era el comportamiento vigente).
  const [tipos, { data, error }] = await Promise.all([
    supabase.from('tipos_servicio').select('codigo').eq('categoria', 'paseo'),
    supabase
      .from('evento_cita_servicio')
      .select('id, fecha, hora, estado, duracion_minutos, precio, prestador_id, mascota_id, tipo_servicio, bono_id, estado_reserva, presupuesto_id')
      .is('suscripcion_servicio_id', null)
      .in('estado', ['confirmada', 'en_curso', 'completada', 'cancelada', 'no_show'])
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true }),
  ]);
  if (error || tipos.error) return mapeoError(error?.message ?? tipos.error?.message ?? 'error');
  const codigosPaseo = new Set(tipos.data.map((t) => t.codigo));

  const citas: CitaPaseoDueno[] = [];
  for (const fila of data ?? []) {
    // S72-A (fuga inversa L-157): `tipo_servicio` NULL ya NO significa solo
    // "legacy pre-tipo" — desde D-439 una cita de presupuesto todo-libre es
    // legal SIN tipo, y ES VETERINARIA (el presupuesto es primitiva vet, §8).
    // El comentario histórico ("tipo NULL nunca es grooming") quedó falso:
    // una todo-libre de presupuesto se colaba en "Mis paseos". Discriminación:
    //   tipo en catálogo paseo        → paseo real, entra
    //   tipo NULL + presupuesto NULL  → legacy pre-tipo, entra (comportamiento vigente)
    //   tipo NULL + presupuesto NOT   → procedimiento vet todo-libre, FUERA
    //   tipo fuera del catálogo paseo → otro oficio, FUERA
    if (fila.tipo_servicio === null) {
      if (fila.presupuesto_id !== null) continue;
    } else if (!codigosPaseo.has(fila.tipo_servicio)) {
      continue;
    }
    if (typeof fila.id !== 'string' || typeof fila.estado !== 'string') {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_SUELTO.datos_inconsistentes };
    }
    // Solo el ciclo de pago vivo: los holds nunca pagados no son "paseos".
    if (fila.estado_reserva !== 'pagada' && fila.estado_reserva !== 'cancelada') continue;
    // Un paseo pagado tiene fecha firme; una fila sin fecha acá es data rota,
    // no un "paseo" — se descarta antes de que String(null) escupa "null"
    // literal a la UI (S72-A). No hay cita de paseo legal SIN fecha.
    if (fila.fecha === null) continue;
    citas.push({
      id: fila.id,
      fecha: String(fila.fecha),
      hora: String(fila.hora),
      estado: fila.estado,
      duracion_minutos: Number(fila.duracion_minutos),
      precio: fila.precio === null ? null : Number(fila.precio),
      prestador_id: fila.prestador_id ?? null,
      mascota_id: fila.mascota_id ?? null,
      tipo_servicio: fila.tipo_servicio ?? null,
      origen: fila.bono_id !== null ? 'paquete' : 'suelta',
      bono_id: fila.bono_id ?? null,
    });
  }
  return { ok: true, data: citas };
}

/**
 * Resuelve la OFERTA de una cita (prestador + tipo + duración) por la
 * policy pública ps_public — el reagendado necesita el id de la oferta
 * para pedir inicios reales (obtenerSlotsDisponibles). null honesto si
 * el prestador ya no oferta ese bloque (la reagenda no se ofrece).
 */
export async function resolverOfertaDeCita(input: {
  prestador_id: string;
  tipo_servicio: string;
  duracion_minutos: number;
}): Promise<ResultadoWrapper<{ prestador_servicio_id: string } | null, CodigoErrorCitaSuelta>> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('prestador_servicios')
    .select('id')
    .eq('prestador_id', input.prestador_id)
    .eq('tipo_servicio', input.tipo_servicio)
    .eq('duracion_minutos', input.duracion_minutos)
    .eq('activo', true)
    .limit(1)
    .maybeSingle();
  if (error) return mapeoError(error.message);
  if (data === null) return { ok: true, data: null };
  return { ok: true, data: { prestador_servicio_id: data.id } };
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
