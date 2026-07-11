// Wrappers del agendamiento del dueño (S54-B2 — hold 15 min + cobro
// simulado). Patrón canónico del monorepo (ver paseo.ts): códigos
// tipados + normalizarCodigo por prefijo (L-115) + guards de shape
// contra el DDL REAL de la migración 20260710210000 (L-124) +
// ResultadoWrapper discriminated union.
//
// Decisiones que este archivo implementa (S54, founder+arquitecto):
// - La oferta es DERIVADA de prestadores reales (RLS ps_public es la
//   puerta: activo=true + prestador activo) — cero catálogo estático,
//   cero precio hardcodeado. prestador_servicios NO tiene FK a
//   tipos_servicio → dos queries + Map (patrón FK-joins), jamás asumir
//   un embed que PostgREST no puede resolver.
// - crearBloqueoAgenda devuelve el SNAPSHOT de precio del hold; el
//   checkout muestra ESE número, jamás re-resuelve contra la oferta.
// - confirmarCitaPagada NO crea el evento económico (variante (b):
//   nace al cerrar con calidad); pre-valida el motor y los errores de
//   ese lado se agrupan para el dueño en 'pago_no_disponible'.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── Códigos de error (verificados contra los RAISE de cada body) ────────────

const CODIGOS_ERROR_AGENDAMIENTO = [
  'acceso_denegado',
  'rango_invalido',
  'prestador_inactivo',
  'servicio_no_disponible',
  'slot_invalido',
  'slot_en_pasado',
  'fuera_de_horario',
  'slot_ocupado',
  'cita_no_encontrada',
  'cita_ya_confirmada',
  'cita_estado_invalido',
  'hold_expirado',
  'pago_no_disponible',
] as const;

export type CodigoErrorAgendamiento = (typeof CODIGOS_ERROR_AGENDAMIENTO)[number];

const MENSAJES_ERROR_AGENDAMIENTO: Record<
  CodigoErrorAgendamiento | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:        'No tenés acceso para hacer esto.',
  rango_invalido:         'El rango de fechas no es válido.',
  prestador_inactivo:     'Este prestador no está disponible.',
  servicio_no_disponible: 'Este servicio ya no está disponible.',
  slot_invalido:          'El horario elegido no es válido.',
  slot_en_pasado:         'Ese horario ya pasó — elegí otro.',
  fuera_de_horario:       'El prestador no atiende en ese horario.',
  slot_ocupado:           'Ese horario acaba de ocuparse — elegí otro.',
  cita_no_encontrada:     'La reserva no existe o ya no es accesible.',
  cita_ya_confirmada:     'Esta cita ya está confirmada y pagada.',
  cita_estado_invalido:   'La reserva no está en un estado que permita pagarla.',
  hold_expirado:          'Este horario se liberó — elegí otro.',
  pago_no_disponible:     'Este prestador todavía no puede recibir pagos por la app.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorAgendamiento | 'error_desconocido' {
  if (
    raw === 'auth_required' ||
    raw === 'no_access_to_mascota' ||
    raw.startsWith('no_es_tu_cita')
  ) {
    return 'acceso_denegado';
  }
  if (raw.startsWith('cita_no_existe')) return 'cita_no_encontrada';
  if (raw.startsWith('ventana_invalida')) return 'slot_invalido';
  // Errores del lado prestador/motor: para el dueño son un solo hecho
  // honesto — este prestador aún no puede cobrar por la app.
  if (
    raw.startsWith('cuenta_sin_rol_activo') ||
    raw.startsWith('cuenta_no_activa') ||
    raw.startsWith('prestador_sin_cuenta_comercial') ||
    raw.startsWith('sin_fee_config') ||
    raw.startsWith('cita_sin_prestador') ||
    raw.startsWith('cita_sin_precio')
  ) {
    return 'pago_no_disponible';
  }
  // Códigos con sufijo ': <detalle>' — normalizar por prefijo (L-115).
  for (const codigo of CODIGOS_ERROR_AGENDAMIENTO) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function mapeoErrorAResultado<T>(
  mensajeOriginal: string,
): ResultadoWrapper<T, CodigoErrorAgendamiento> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_AGENDAMIENTO[codigo] };
}

type Obj = Record<string, unknown>;

function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

// ── A · Oferta derivada de paseo ─────────────────────────────────────────────

export interface OfertaPaseo {
  /** prestador_servicios.id — el identificador de la OFERTA (con precio). */
  prestador_servicio_id: string;
  prestador_id: string;
  prestador_nombre: string;
  /** nombre_custom del prestador, o el nombre del catálogo maestro. */
  servicio_nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number;
  especies_compatibles: string[];
}

/**
 * Paseadores REALES con oferta de paseo activa y su precio real.
 * S54-B3.2: pasa a RPC DEFINER (obtener_oferta_paseo) — la regla founder
 * "no se oferta quien no puede cobrar" exige filtrar por cuenta comercial
 * ACTIVA, y la RLS de cuentas_comerciales es solo-owner: el criterio
 * vive server-side. También alimenta el selector de duración del paso
 * CUÁNDO (solo duraciones que existen de verdad).
 */
export async function obtenerOfertaPaseo(): Promise<
  ResultadoWrapper<OfertaPaseo[], CodigoErrorAgendamiento>
> {
  const { data, error } = await getClient().rpc('obtener_oferta_paseo');

  if (error) return mapeoErrorAResultado(error.message);
  if (!Array.isArray(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const ofertas: OfertaPaseo[] = [];
  for (const o of data) {
    if (
      !esObj(o) ||
      typeof o.prestador_servicio_id !== 'string' ||
      typeof o.prestador_id !== 'string' ||
      typeof o.prestador_nombre !== 'string' ||
      typeof o.servicio_nombre !== 'string' ||
      !(o.descripcion === null || typeof o.descripcion === 'string') ||
      typeof o.duracion_minutos !== 'number' ||
      typeof o.precio !== 'number'
    ) {
      return mapeoErrorAResultado('datos_inconsistentes');
    }
    ofertas.push({
      prestador_servicio_id: o.prestador_servicio_id,
      prestador_id: o.prestador_id,
      prestador_nombre: o.prestador_nombre,
      servicio_nombre: o.servicio_nombre,
      descripcion: o.descripcion,
      duracion_minutos: o.duracion_minutos,
      precio: o.precio,
      especies_compatibles: Array.isArray(o.especies_compatibles)
        ? o.especies_compatibles.filter((e): e is string => typeof e === 'string')
        : [],
    });
  }
  return { ok: true, data: ofertas };
}

// ── A2 · El QUIÉN para una ventana (momento-primero, S54-B3.2) ──────────────

export interface PaseadorDisponible {
  prestador_id: string;
  prestador_servicio_id: string;
  prestador_nombre: string;
  servicio_nombre: string;
  precio: number;
  duracion_minutos: number;
}

export interface InputPaseadoresDisponibles {
  /** 'YYYY-MM-DD'. */
  fecha: string;
  /** 'HH:MM' alineada a la grilla (30 min). */
  hora: string;
  duracion_minutos: number;
}

/**
 * Paseadores que PUEDEN en la ventana [hora, hora+duración]: oferta
 * activa con esa duración exacta + cuenta que puede cobrar + franja que
 * contiene la ventana + sin colisión (firmes ni holds vigentes).
 * Ventana en el pasado devuelve [] (la UI filtra las horas de hoy).
 */
export async function obtenerPaseadoresDisponibles(
  input: InputPaseadoresDisponibles,
): Promise<ResultadoWrapper<PaseadorDisponible[], CodigoErrorAgendamiento>> {
  const { data, error } = await getClient().rpc('obtener_paseadores_disponibles', {
    p_fecha:            input.fecha,
    p_hora:             input.hora,
    p_duracion_minutos: input.duracion_minutos,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!Array.isArray(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const disponibles: PaseadorDisponible[] = [];
  for (const p of data) {
    if (
      !esObj(p) ||
      typeof p.prestador_id !== 'string' ||
      typeof p.prestador_servicio_id !== 'string' ||
      typeof p.prestador_nombre !== 'string' ||
      typeof p.servicio_nombre !== 'string' ||
      typeof p.precio !== 'number' ||
      typeof p.duracion_minutos !== 'number'
    ) {
      return mapeoErrorAResultado('datos_inconsistentes');
    }
    disponibles.push({
      prestador_id: p.prestador_id,
      prestador_servicio_id: p.prestador_servicio_id,
      prestador_nombre: p.prestador_nombre,
      servicio_nombre: p.servicio_nombre,
      precio: p.precio,
      duracion_minutos: p.duracion_minutos,
    });
  }
  return { ok: true, data: disponibles };
}

// ── B · Slots disponibles (derivados: horarios − firmes − holds vigentes) ────

export interface SlotDisponible {
  /** 'YYYY-MM-DD'. */
  fecha: string;
  /** 'HH:MM:SS'. */
  hora: string;
  duracion_minutos: number;
  cupos_restantes: number;
}

export interface InputSlotsDisponibles {
  prestador_id: string;
  prestador_servicio_id: string;
  /** 'YYYY-MM-DD' inclusive. Rango máximo 60 días (guard de la RPC). */
  desde: string;
  hasta: string;
}

export async function obtenerSlotsDisponibles(
  input: InputSlotsDisponibles,
): Promise<ResultadoWrapper<SlotDisponible[], CodigoErrorAgendamiento>> {
  const { data, error } = await getClient().rpc('obtener_slots_disponibles', {
    p_prestador_id: input.prestador_id,
    p_servicio_id:  input.prestador_servicio_id,
    p_desde:        input.desde,
    p_hasta:        input.hasta,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!Array.isArray(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const slots: SlotDisponible[] = [];
  for (const fila of data) {
    if (
      !esObj(fila) ||
      typeof fila.fecha !== 'string' ||
      typeof fila.hora !== 'string' ||
      typeof fila.duracion_minutos !== 'number' ||
      typeof fila.cupos_restantes !== 'number'
    ) {
      return mapeoErrorAResultado('datos_inconsistentes');
    }
    slots.push({
      fecha: fila.fecha,
      hora: fila.hora,
      duracion_minutos: fila.duracion_minutos,
      cupos_restantes: fila.cupos_restantes,
    });
  }
  return { ok: true, data: slots };
}

// ── C · Crear el hold (la cita nace pendiente + pendiente_pago, 15 min) ─────

export interface HoldAgenda {
  cita_id: string;
  /** ISO — vencimiento del hold (15 min). El checkout cuenta contra esto. */
  expira_en: string;
  /** SNAPSHOT del precio de la oferta al momento del hold. */
  precio: number;
  fecha: string;
  hora: string;
}

export interface InputCrearBloqueo {
  prestador_id: string;
  prestador_servicio_id: string;
  mascota_id: string;
  /** 'YYYY-MM-DD'. */
  fecha: string;
  /** 'HH:MM' alineada a la grilla del prestador. */
  hora: string;
}

/** El hold es INVISIBLE al prestador (verdad firme): nace 'pendiente'. */
export async function crearBloqueoAgenda(
  input: InputCrearBloqueo,
): Promise<ResultadoWrapper<HoldAgenda, CodigoErrorAgendamiento>> {
  const { data, error } = await getClient().rpc('crear_bloqueo_agenda', {
    p_prestador_id: input.prestador_id,
    p_servicio_id:  input.prestador_servicio_id,
    p_mascota_id:   input.mascota_id,
    p_fecha:        input.fecha,
    p_hora:         input.hora,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const o = data;
  if (
    o.ok !== true ||
    typeof o.cita_id !== 'string' ||
    typeof o.expira_en !== 'string' ||
    typeof o.precio !== 'number' ||
    typeof o.fecha !== 'string' ||
    typeof o.hora !== 'string'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      cita_id: o.cita_id,
      expira_en: o.expira_en,
      precio: o.precio,
      fecha: o.fecha,
      hora: o.hora,
    },
  };
}

// ── D · Confirmar pagada (el pago —simulado— vuelve firme la cita) ──────────

export interface CitaPagada {
  cita_id: string;
  estado: 'confirmada';
  estado_reserva: 'pagada';
  /** ISO — timestamp del pago (fecha_cobro del evento al cerrar, variante b). */
  pagado_en: string;
}

export interface InputConfirmarCita {
  cita_id: string;
}

/**
 * Chequeo perezoso del hold (vencido → 'hold_expirado') + pre-validación
 * del motor financiero (falla → 'pago_no_disponible'). NO crea el evento
 * económico: nace al cerrar con calidad (variante b, S54).
 */
export async function confirmarCitaPagada(
  input: InputConfirmarCita,
): Promise<ResultadoWrapper<CitaPagada, CodigoErrorAgendamiento>> {
  const { data, error } = await getClient().rpc('confirmar_cita_pagada', {
    p_cita_id: input.cita_id,
  });

  if (error) return mapeoErrorAResultado(error.message);
  if (!esObj(data)) return mapeoErrorAResultado('datos_inconsistentes');
  const o = data;
  if (
    o.ok !== true ||
    typeof o.cita_id !== 'string' ||
    o.estado !== 'confirmada' ||
    o.estado_reserva !== 'pagada' ||
    typeof o.pagado_en !== 'string'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      cita_id: o.cita_id,
      estado: 'confirmada',
      estado_reserva: 'pagada',
      pagado_en: o.pagado_en,
    },
  };
}
