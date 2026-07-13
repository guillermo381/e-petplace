// Configuración del servicio de paseo — S55-B (B2, decisión founder S55:
// el prestador gobierna su propia oferta).
//
// MODELO CERRADO: duraciones = menú canónico 30/60/120/180/240/300 (máx
// 300 — más de 5 h es guardería, no paseo). Precio POR BLOQUE. La
// recurrencia/paquete mensual es capa posterior (MODELO_FINANCIERO v2.5
// + política P14 + motor — NO vive acá).
//
// MOTOR DE OCUPACIÓN POR VENTANA: el hallazgo S55-B (la cita no guardaba
// duración; crear_bloqueo validaba cupo solo sobre el slot → doble-booking
// parcial en bloques >30') lo curó la Sesión A en S55-A B2 — verificado
// LITERAL contra DB viva antes de levantar la guarda temporal de esta
// tanda: la cita guarda duracion_minutos, la ventana completa se valida
// contra la franja y _agenda_ocupacion cuenta el máximo solape. Todos
// los bloques del menú nacen ofertables.
//
// Camino de escritura relevado y PROBADO S55-B (sonda con ROLLBACK):
// el owner escribe directo por RLS (prestador_servicios_own /
// prestador_horarios_own, ALL con WITH CHECK por prestadores.user_id).
// La RLS es la puerta — cero RPC nueva, cero L-140 acá.

import { getClient } from '../client';
import type { Database } from '../database.types';
import type { ResultadoWrapper } from '../resultado';

type UpdateOferta = Database['public']['Tables']['prestador_servicios']['Update'];
type UpdateFranja = Database['public']['Tables']['prestador_horarios']['Update'];

const MENSAJES = {
  sin_sesion:             'No hay sesión activa.',
  bloque_invalido:        'Esa duración no está en el menú de paseos.',
  precio_invalido:        'El precio tiene que ser mayor a cero.',
  bloque_duplicado:       'Ya ofreces un paseo de esa duración.',
  precio_plan_invalido:   'El precio del plan tiene que ser mayor a cero. Déjalo vacío si no ofreces plan.',
  precio_paquete_invalido: 'El precio por salida del paquete tiene que ser mayor a cero. Déjalo vacío si no ofreces paquete.',
  rango_horario_invalido: 'La hora de fin tiene que ser después de la de inicio.',
  franja_solapada:        'Esa franja se cruza con una que ya tienes ese día.',
  cupo_invalido:          'El cupo tiene que ser entre 1 y 4.',
  dia_invalido:           'El día no es válido.',
  no_encontrada:          'No encontramos ese registro tuyo.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorConfiguracionPaseo = keyof typeof MENSAJES;

type Falla = { ok: false; codigo: CodigoErrorConfiguracionPaseo; mensaje: string };
function falla(codigo: CodigoErrorConfiguracionPaseo): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

/** El menú canónico de bloques (decisión founder S55). El 30 es la "Salida corta" (voz firmada S56). */
export const BLOQUES_PASEO = [30, 60, 120, 180, 240, 300] as const;
export type BloquePaseo = (typeof BLOQUES_PASEO)[number];

export interface OfertaPaseoPropia {
  id: string;
  duracionMinutos: number;
  precio: number;
  /**
   * Precio POR SALIDA cuando el bloque es parte de un plan mensual
   * (D-338, contrato S56 ratificado: columna en prestador_servicios,
   * SIN CHECK relacional contra precio — el plan puede valer más).
   * null = el prestador NO ofrece plan en este bloque (oferta honesta).
   */
  precioPlan: number | null;
  /**
   * Precio POR SALIDA cuando el bloque se compra como PAQUETE de salidas
   * (D-343, S57 — patrón idéntico a precioPlan: columna
   * prestador_servicios.precio_paquete, SIN CHECK relacional).
   * null = el prestador NO ofrece paquete en este bloque; la superficie
   * de compra del dueño no aparece. Presets 5/10/15 fijos por letra
   * (MODELO_PASEO §6bis) — el prestador configura SOLO este precio.
   */
  precioPaquete: number | null;
  nombre: string | null;
  descripcion: string | null;
  activo: boolean;
}

export interface FranjaHorario {
  id: string;
  /** 0=Domingo … 6=Sábado (regla 32, sin transformaciones). */
  diaSemana: number;
  /** 'HH:MM' */
  horaInicio: string;
  horaFin: string;
  duracionSlotMinutos: number;
  maxCitasPorSlot: number;
  activo: boolean;
}

function aHoraCorta(v: string): string {
  return v.slice(0, 5);
}

function mapearOferta(fila: {
  id: string;
  duracion_minutos: number | null;
  precio: number;
  precio_plan: number | null;
  precio_paquete: number | null;
  nombre_custom: string | null;
  descripcion: string | null;
  activo: boolean;
}): OfertaPaseoPropia {
  return {
    id: fila.id,
    duracionMinutos: fila.duracion_minutos ?? 30,
    precio: fila.precio,
    precioPlan: fila.precio_plan,
    precioPaquete: fila.precio_paquete,
    nombre: fila.nombre_custom,
    descripcion: fila.descripcion,
    activo: fila.activo,
  };
}

const SELECT_OFERTA = 'id, duracion_minutos, precio, precio_plan, precio_paquete, nombre_custom, descripcion, activo';

/** Los bloques de paseo del prestador propio, del más corto al más largo. */
export async function obtenerOfertasPaseoPropias(
  prestadorId: string,
): Promise<ResultadoWrapper<OfertaPaseoPropia[], CodigoErrorConfiguracionPaseo>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_servicios')
    .select(SELECT_OFERTA)
    .eq('prestador_id', prestadorId)
    .eq('tipo_servicio', 'paseo')
    .order('duracion_minutos', { ascending: true });

  if (error || !Array.isArray(data)) return falla('error_desconocido');
  return { ok: true, data: data.map(mapearOferta) };
}

export interface InputCrearOfertaPaseo {
  prestadorId: string;
  duracionMinutos: number;
  precio: number;
  /** Precio por salida en plan mensual; ausente/null = sin plan en este bloque. */
  precioPlan?: number | null;
  /** Precio por salida en paquete; ausente/null = sin paquete en este bloque (D-343). */
  precioPaquete?: number | null;
  nombre?: string;
  descripcion?: string;
}

/** Crea un bloque del menú canónico. Nace activo (ofertable al cliente). */
export async function crearOfertaPaseo(
  input: InputCrearOfertaPaseo,
): Promise<ResultadoWrapper<OfertaPaseoPropia, CodigoErrorConfiguracionPaseo>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  if (!BLOQUES_PASEO.includes(input.duracionMinutos as BloquePaseo)) return falla('bloque_invalido');
  if (!Number.isFinite(input.precio) || input.precio <= 0) return falla('precio_invalido');
  if (
    input.precioPlan !== undefined &&
    input.precioPlan !== null &&
    (!Number.isFinite(input.precioPlan) || input.precioPlan <= 0)
  ) {
    return falla('precio_plan_invalido');
  }
  if (
    input.precioPaquete !== undefined &&
    input.precioPaquete !== null &&
    (!Number.isFinite(input.precioPaquete) || input.precioPaquete <= 0)
  ) {
    return falla('precio_paquete_invalido');
  }

  // un bloque por duración: el schema no tiene UNIQUE (relevado S55) —
  // la unicidad se cuida acá y el gate del founder la ratifica en UI
  const { data: existentes, error: errLectura } = await getClient()
    .from('prestador_servicios')
    .select('id, duracion_minutos')
    .eq('prestador_id', input.prestadorId)
    .eq('tipo_servicio', 'paseo');
  if (errLectura || !Array.isArray(existentes)) return falla('error_desconocido');
  if (existentes.some((f) => (f.duracion_minutos ?? 30) === input.duracionMinutos)) {
    return falla('bloque_duplicado');
  }

  const { data, error } = await getClient()
    .from('prestador_servicios')
    .insert({
      prestador_id: input.prestadorId,
      tipo_servicio: 'paseo',
      duracion_minutos: input.duracionMinutos,
      precio: input.precio,
      precio_plan: input.precioPlan ?? null,
      precio_paquete: input.precioPaquete ?? null,
      nombre_custom: input.nombre?.trim() || null,
      descripcion: input.descripcion?.trim() || null,
      activo: true,
      especies_compatibles: ['perro'],
    })
    .select(SELECT_OFERTA)
    .single();

  if (error || data === null) return falla('error_desconocido');
  return { ok: true, data: mapearOferta(data) };
}

export interface InputActualizarOfertaPaseo {
  id: string;
  precio?: number;
  /** number = precio por salida del plan · null = quitar el plan del bloque · ausente = no tocar. */
  precioPlan?: number | null;
  /** number = precio por salida del paquete · null = quitar el paquete del bloque · ausente = no tocar. */
  precioPaquete?: number | null;
  nombre?: string | null;
  descripcion?: string | null;
  activo?: boolean;
}

/**
 * Edita precio/nombre/descripción o pausa/reactiva. El precio nuevo rige
 * SOLO holds futuros: el snapshot de crear_bloqueo_agenda protege lo ya
 * creado (MODELO_FINANCIERO §3.2 — garantizado server-side, relevado S55).
 */
export async function actualizarOfertaPaseo(
  input: InputActualizarOfertaPaseo,
): Promise<ResultadoWrapper<OfertaPaseoPropia, CodigoErrorConfiguracionPaseo>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  if (input.precio !== undefined && (!Number.isFinite(input.precio) || input.precio <= 0)) {
    return falla('precio_invalido');
  }
  if (
    input.precioPlan !== undefined &&
    input.precioPlan !== null &&
    (!Number.isFinite(input.precioPlan) || input.precioPlan <= 0)
  ) {
    return falla('precio_plan_invalido');
  }
  if (
    input.precioPaquete !== undefined &&
    input.precioPaquete !== null &&
    (!Number.isFinite(input.precioPaquete) || input.precioPaquete <= 0)
  ) {
    return falla('precio_paquete_invalido');
  }

  const cambios: UpdateOferta = {};
  if (input.precio !== undefined) cambios.precio = input.precio;
  if (input.precioPlan !== undefined) cambios.precio_plan = input.precioPlan;
  if (input.precioPaquete !== undefined) cambios.precio_paquete = input.precioPaquete;
  if (input.nombre !== undefined) cambios.nombre_custom = input.nombre?.trim() || null;
  if (input.descripcion !== undefined) cambios.descripcion = input.descripcion?.trim() || null;
  if (input.activo !== undefined) cambios.activo = input.activo;

  const { data, error } = await getClient()
    .from('prestador_servicios')
    .update(cambios)
    .eq('id', input.id)
    .select(SELECT_OFERTA)
    .maybeSingle();

  if (error) return falla('error_desconocido');
  // sin fila tocada = no era tuya o no existe — jamás no-op silencioso (cura T4 S54)
  if (data === null) return falla('no_encontrada');
  return { ok: true, data: mapearOferta(data) };
}

const SELECT_FRANJA = 'id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo';

function mapearFranja(fila: {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_minutos: number;
  max_citas_por_slot: number | null;
  activo: boolean;
}): FranjaHorario {
  return {
    id: fila.id,
    diaSemana: fila.dia_semana,
    horaInicio: aHoraCorta(fila.hora_inicio),
    horaFin: aHoraCorta(fila.hora_fin),
    duracionSlotMinutos: fila.duracion_slot_minutos,
    maxCitasPorSlot: fila.max_citas_por_slot ?? 1,
    activo: fila.activo,
  };
}

/**
 * Las franjas GENERALES del prestador (servicio_id y empleado_id NULL —
 * las franjas por servicio/empleado son el peldaño 2, hueco declarado).
 */
export async function obtenerFranjasHorario(
  prestadorId: string,
): Promise<ResultadoWrapper<FranjaHorario[], CodigoErrorConfiguracionPaseo>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .select(SELECT_FRANJA)
    .eq('prestador_id', prestadorId)
    .is('servicio_id', null)
    .is('empleado_id', null)
    .order('dia_semana', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (error || !Array.isArray(data)) return falla('error_desconocido');
  return { ok: true, data: data.map(mapearFranja) };
}

export interface InputCrearFranja {
  prestadorId: string;
  /** 0=Domingo … 6=Sábado (regla 32). */
  diaSemana: number;
  /** 'HH:MM' en la grilla de 30 (v1: grilla fija). */
  horaInicio: string;
  horaFin: string;
  maxCitasPorSlot: number;
}

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Agrega una franja general. El SOLAPE se valida acá contra TODAS las
 * franjas del día (activas y pausadas — una pausada que se reactive no
 * puede chocar): el UNIQUE del schema no protege con servicio_id NULL
 * (relevado S55: NULLs no colisionan).
 */
export async function crearFranjaHorario(
  input: InputCrearFranja,
): Promise<ResultadoWrapper<FranjaHorario, CodigoErrorConfiguracionPaseo>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  if (!Number.isInteger(input.diaSemana) || input.diaSemana < 0 || input.diaSemana > 6) {
    return falla('dia_invalido');
  }
  if (!HORA_RE.test(input.horaInicio) || !HORA_RE.test(input.horaFin)) return falla('rango_horario_invalido');
  if (input.horaFin <= input.horaInicio) return falla('rango_horario_invalido');
  if (!Number.isInteger(input.maxCitasPorSlot) || input.maxCitasPorSlot < 1 || input.maxCitasPorSlot > 4) {
    return falla('cupo_invalido');
  }

  const { data: delDia, error: errDia } = await getClient()
    .from('prestador_horarios')
    .select('id, hora_inicio, hora_fin')
    .eq('prestador_id', input.prestadorId)
    .is('servicio_id', null)
    .is('empleado_id', null)
    .eq('dia_semana', input.diaSemana);
  if (errDia || !Array.isArray(delDia)) return falla('error_desconocido');
  const solapa = delDia.some(
    (f) => input.horaInicio < aHoraCorta(f.hora_fin) && input.horaFin > aHoraCorta(f.hora_inicio),
  );
  if (solapa) return falla('franja_solapada');

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .insert({
      prestador_id: input.prestadorId,
      dia_semana: input.diaSemana,
      hora_inicio: input.horaInicio,
      hora_fin: input.horaFin,
      duracion_slot_minutos: 30,
      max_citas_por_slot: input.maxCitasPorSlot,
      activo: true,
    })
    .select(SELECT_FRANJA)
    .single();

  if (error || data === null) return falla('error_desconocido');
  return { ok: true, data: mapearFranja(data) };
}

export interface InputActualizarFranja {
  id: string;
  activo?: boolean;
  maxCitasPorSlot?: number;
}

/** Pausa/reactiva una franja o cambia su cupo de paseos simultáneos. */
export async function actualizarFranjaHorario(
  input: InputActualizarFranja,
): Promise<ResultadoWrapper<FranjaHorario, CodigoErrorConfiguracionPaseo>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  if (
    input.maxCitasPorSlot !== undefined &&
    (!Number.isInteger(input.maxCitasPorSlot) || input.maxCitasPorSlot < 1 || input.maxCitasPorSlot > 4)
  ) {
    return falla('cupo_invalido');
  }

  const cambios: UpdateFranja = {};
  if (input.activo !== undefined) cambios.activo = input.activo;
  if (input.maxCitasPorSlot !== undefined) cambios.max_citas_por_slot = input.maxCitasPorSlot;

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .update(cambios)
    .eq('id', input.id)
    .select(SELECT_FRANJA)
    .maybeSingle();

  if (error) return falla('error_desconocido');
  if (data === null) return falla('no_encontrada');
  return { ok: true, data: mapearFranja(data) };
}

/**
 * Quita una franja. Las franjas son CONFIGURACIÓN de disponibilidad, no
 * historia — borrarlas es legal (la regla 7.8 protege eventos y plata);
 * las citas ya confirmadas no dependen de la franja (relevado S55).
 */
export async function eliminarFranjaHorario(
  id: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorConfiguracionPaseo>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return falla('error_desconocido');
  if (data === null) return falla('no_encontrada');
  return { ok: true, data: { id: data.id } };
}
