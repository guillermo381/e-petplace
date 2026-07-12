// Wrappers del PLAN de paseo (S56-A Tarea 2 — D-338, espec firmada:
// MODELO_PASEO v1.2 §6 + financiero v2.6 Decisión S/7.14 + P14).
// La plata: UN cobro simulado declarado por período mensual — el server
// es el único que cobra y genera citas (contratar_plan_paseo, atómico);
// acá solo viaja el contrato. Patrón canónico: códigos tipados +
// normalización por prefijo (L-115) + guards contra el DDL real de la
// migración 20260712130000 (L-124).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── Códigos de error (verificados contra los RAISE de cada body) ────────────

const CODIGOS_ERROR_PLAN = [
  'acceso_denegado',
  'dias_invalidos',
  'frecuencia_invalida',
  'slot_invalido',
  'slot_en_pasado',
  'prestador_inactivo',
  'servicio_no_disponible',
  'plan_duplicado',
  'plan_sin_citas',
  'fecha_sin_cupo',
  'fuera_de_horario',
  'slot_ocupado',
  'pago_no_disponible',
  // D-341 (S56): bloqueos/vacaciones del paseador — lo levantan
  // contratar_plan_paseo (fecha del período bloqueada) y saltar_cita_plan.
  'prestador_no_disponible',
  'plan_no_encontrado',
  'plan_no_activo',
  'cita_no_encontrada',
  'cita_no_es_de_plan',
  'cita_estado_invalido',
  'aviso_tarde',
  'fuera_del_periodo',
] as const;

export type CodigoErrorPlan = (typeof CODIGOS_ERROR_PLAN)[number];

const MENSAJES_ERROR_PLAN: Record<
  CodigoErrorPlan | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:      'No tenés acceso para hacer esto.',
  dias_invalidos:       'Elegí al menos un día de la semana.',
  frecuencia_invalida:  'Elegí una frecuencia para el plan.',
  slot_invalido:        'El horario elegido no es válido.',
  slot_en_pasado:       'Ese horario ya pasó — elegí otro.',
  prestador_inactivo:   'Este paseador no está disponible.',
  servicio_no_disponible: 'Este servicio ya no está disponible.',
  plan_duplicado:       'Ya tenés un plan activo con este paseador para esta mascota.',
  plan_sin_citas:       'Con esos días no queda ninguna salida en el mes — revisá la selección.',
  fecha_sin_cupo:       'Una de las fechas del plan ya está ocupada — probá otro horario o menos días.',
  fuera_de_horario:     'El paseador no atiende en ese horario.',
  slot_ocupado:         'Ese horario acaba de ocuparse — elegí otro.',
  pago_no_disponible:   'Este paseador todavía no puede recibir pagos por la app.',
  prestador_no_disponible: 'El paseador no está disponible en esas fechas — elegí otro horario.',
  plan_no_encontrado:   'El plan no existe o ya no es accesible.',
  plan_no_activo:       'Este plan ya no está activo.',
  cita_no_encontrada:   'La salida no existe o ya no es accesible.',
  cita_no_es_de_plan:   'Esa salida no es parte de un plan.',
  cita_estado_invalido: 'Esa salida ya no se puede mover.',
  aviso_tarde:          'Faltan menos de 24 horas — esta salida ya no se puede mover.',
  fuera_del_periodo:    'La nueva fecha tiene que caer dentro del período de tu plan.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorPlan | 'error_desconocido' {
  if (raw === 'auth_required' || raw === 'no_access_to_mascota' || raw.startsWith('no_es_tu_plan')) {
    return 'acceso_denegado';
  }
  // Errores del lado prestador/motor: un solo hecho honesto para el dueño.
  if (
    raw.startsWith('cuenta_sin_rol_activo') ||
    raw.startsWith('cuenta_no_activa') ||
    raw.startsWith('prestador_sin_cuenta_comercial') ||
    raw.startsWith('sin_fee_config')
  ) {
    return 'pago_no_disponible';
  }
  for (const codigo of CODIGOS_ERROR_PLAN) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function mapeoErrorAResultado<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorPlan> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_PLAN[codigo] };
}

type Obj = Record<string, unknown>;
function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

// ── Contratar (el chip "Hacerlo frecuente" termina acá) ─────────────────────

export interface ContratarPlanInput {
  prestador_id: string;
  /** prestador_servicios.id — la oferta del bloque elegida en el flujo suelto. */
  prestador_servicio_id: string;
  mascota_id: string;
  /** Días 0=Domingo..6=Sábado (regla 32), multi-selección de la Hoja. */
  dias: number[];
  /** HH:MM — el inicio elegido en el CUÁNDO. */
  hora: string;
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
  auto_renovar: boolean;
}

export interface PlanContratado {
  suscripcion_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  citas_generadas: number;
  total_periodo: number;
  precio_unitario_efectivo: number;
  auto_renovar: boolean;
}

/**
 * Contrata el plan mensual: UN cobro simulado declarado por período +
 * las citas del período FIRMES (motor de ventana). Atómico server-side:
 * si una fecha no tiene cupo, nada nace. El total y el unitario vuelven
 * del server — la pantalla muestra ESOS números, jamás re-calcula.
 */
export async function contratarPlanPaseo(
  input: ContratarPlanInput,
): Promise<ResultadoWrapper<PlanContratado, CodigoErrorPlan>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('contratar_plan_paseo', {
    p_prestador_id: input.prestador_id,
    p_servicio_id: input.prestador_servicio_id,
    p_mascota_id: input.mascota_id,
    p_dias: input.dias,
    p_hora: input.hora,
    p_frecuencia: input.frecuencia,
    p_auto_renovar: input.auto_renovar,
  });
  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Obj | null;
  if (
    !esObj(o) || o.ok !== true ||
    typeof o.suscripcion_id !== 'string' ||
    typeof o.periodo_inicio !== 'string' ||
    typeof o.periodo_fin !== 'string' ||
    typeof o.citas_generadas !== 'number'
  ) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PLAN.datos_inconsistentes };
  }
  return {
    ok: true,
    data: {
      suscripcion_id: o.suscripcion_id,
      periodo_inicio: o.periodo_inicio,
      periodo_fin: o.periodo_fin,
      citas_generadas: o.citas_generadas,
      total_periodo: Number(o.total_periodo),
      precio_unitario_efectivo: Number(o.precio_unitario_efectivo),
      auto_renovar: Boolean(o.auto_renovar),
    },
  };
}

// ── El hub "Mis paseos" (lecturas por RLS solo-dueño) ───────────────────────

export interface PlanPaseo {
  id: string;
  mascota_id: string;
  prestador_id: string;
  /** La oferta del bloque (prestador_servicios.id) — null si el prestador la borró. */
  prestador_servicio_id: string | null;
  estado: string;
  estado_pago: string;
  periodo_inicio: string;
  periodo_fin: string;
  precio_mensual: number;
  precio_unitario_efectivo: number | null;
  dias_semana: number[];
  hora: string;
  duracion_minutos: number;
  frecuencia: string;
  auto_renovar: boolean;
}

/** Los planes de paseo del dueño (todos los estados — el hub decide qué pinta). */
export async function obtenerMisPlanesPaseo(): Promise<ResultadoWrapper<PlanPaseo[], CodigoErrorPlan>> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('suscripciones_servicio')
    .select('id, mascota_id, prestador_id, prestador_servicio_id, estado, estado_pago, periodo_inicio, periodo_fin, precio_mensual, precio_unitario_efectivo, dias_semana, hora, duracion_minutos, frecuencia, auto_renovar')
    .eq('tipo_servicio', 'paseo_mensual')
    .order('created_at', { ascending: false });
  if (error) return mapeoErrorAResultado(error.message);

  const planes: PlanPaseo[] = [];
  for (const fila of data ?? []) {
    if (typeof fila.id !== 'string' || typeof fila.estado !== 'string' || typeof fila.periodo_fin !== 'string') {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PLAN.datos_inconsistentes };
    }
    planes.push({
      id: fila.id,
      mascota_id: fila.mascota_id,
      prestador_id: fila.prestador_id,
      prestador_servicio_id: fila.prestador_servicio_id ?? null,
      estado: fila.estado,
      estado_pago: fila.estado_pago,
      periodo_inicio: fila.periodo_inicio,
      periodo_fin: fila.periodo_fin,
      precio_mensual: Number(fila.precio_mensual),
      precio_unitario_efectivo: fila.precio_unitario_efectivo === null ? null : Number(fila.precio_unitario_efectivo),
      dias_semana: (fila.dias_semana ?? []) as number[],
      hora: String(fila.hora),
      duracion_minutos: Number(fila.duracion_minutos),
      frecuencia: String(fila.frecuencia),
      auto_renovar: Boolean(fila.auto_renovar),
    });
  }
  return { ok: true, data: planes };
}

export interface CitaDePlan {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  duracion_minutos: number;
  precio: number | null;
}

/** Las salidas de un plan (RLS: solo las del dueño), ordenadas por fecha. */
export async function obtenerCitasDePlan(
  suscripcionId: string,
): Promise<ResultadoWrapper<CitaDePlan[], CodigoErrorPlan>> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('evento_cita_servicio')
    .select('id, fecha, hora, estado, duracion_minutos, precio')
    .eq('suscripcion_servicio_id', suscripcionId)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });
  if (error) return mapeoErrorAResultado(error.message);
  return {
    ok: true,
    data: (data ?? []).map((c) => ({
      id: String(c.id),
      fecha: String(c.fecha),
      hora: String(c.hora),
      estado: String(c.estado),
      duracion_minutos: Number(c.duracion_minutos),
      precio: c.precio === null ? null : Number(c.precio),
    })),
  };
}

// ── P14: pausa de un toque + saltar con reagenda ────────────────────────────

/** P14(d): pausar = no renovar. Un toque, reversible. */
export async function configurarRenovacionPlan(input: {
  suscripcion_id: string;
  auto_renovar: boolean;
}): Promise<ResultadoWrapper<{ auto_renovar: boolean }, CodigoErrorPlan>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('configurar_renovacion_plan', {
    p_suscripcion_id: input.suscripcion_id,
    p_auto_renovar: input.auto_renovar,
  });
  if (error) return mapeoErrorAResultado(error.message);
  const o = data as Obj | null;
  if (!esObj(o) || o.ok !== true) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PLAN.datos_inconsistentes };
  }
  return { ok: true, data: { auto_renovar: Boolean(o.auto_renovar) } };
}

/** P14(a): saltar UNA salida con ≥24 h — reagenda dentro del período, mismo paseador. */
export async function saltarCitaPlan(input: {
  cita_id: string;
  nueva_fecha: string;
  nueva_hora: string;
}): Promise<ResultadoWrapper<{ fecha: string; hora: string }, CodigoErrorPlan>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('saltar_cita_plan', {
    p_cita_id: input.cita_id,
    p_nueva_fecha: input.nueva_fecha,
    p_nueva_hora: input.nueva_hora,
  });
  if (error) return mapeoErrorAResultado(error.message);
  const o = data as Obj | null;
  if (!esObj(o) || o.ok !== true || typeof o.fecha !== 'string') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PLAN.datos_inconsistentes };
  }
  return { ok: true, data: { fecha: o.fecha, hora: String(o.hora) } };
}
