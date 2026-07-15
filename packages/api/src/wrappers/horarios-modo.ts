// D-386 — LA ELECCIÓN DE MODO DE HORARIOS (S62-B, sobre el motor de la
// Sesión A: migración 20260715130000, commit 5b4a39c).
//
// La letra founder S60: el prestador con varios oficios ELIGE — horarios
// por servicio O franjas universales; jamás mezcladas. El motor lo hace
// invariante (guard por triggers en la fuente + RPC elegir_modo_horarios
// + UNIQUE NULLS NOT DISTINCT); acá vive la puerta única del app.
//
// Camino de escritura del MODO: SOLO la RPC (SECURITY DEFINER, resuelve
// el prestador por auth.uid()) — jamás UPDATE directo. Las FRANJAS se
// siguen escribiendo directo por RLS (camino probado S55-B); los guards
// de DB pueden rebotar franja_especifica_en_modo_universal /
// franja_universal_en_modo_por_servicio (ERRCODE 23514) si un camino
// contradice el modo — acá se normalizan por startsWith (L-115).
//
// GRANULARIDAD (decisión founder S62, opción (b)): servicio_id es la
// OFERTA de prestador_servicios (en paseo, una por bloque). La UI
// presenta la elección a nivel del OFICIO y REPLICA la franja a las
// ofertas que el prestador marque — la franja por oferta individual no
// se expone (Ley 3: ningún paseador piensa "los lunes atiendo paseos
// de 30 pero no de 60").

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:                    'No hay sesión activa.',
  modo_invalido:                 'Esa organización de agenda no existe.',
  prestador_no_encontrado:       'No encontramos tu negocio.',
  franjas_del_otro_modo_existen: 'Todavía tienes franjas guardadas con la organización actual.',
  franja_especifica_en_modo_universal:
    'Tu agenda está en "una agenda para todo" — una franja por servicio no se puede guardar así.',
  franja_universal_en_modo_por_servicio:
    'Tu agenda está organizada por servicio — una franja general no se puede guardar así.',
  franja_duplicada:              'Esa franja ya existe tal cual ese día.',
  franja_solapada:               'Esa franja se cruza con una que ya tienes ese día.',
  rango_horario_invalido:        'La hora de fin tiene que ser después de la de inicio.',
  dia_invalido:                  'El día no es válido.',
  cupo_invalido:                 'El cupo tiene que ser entre 1 y 4.',
  datos_inconsistentes:          'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:             'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorModoHorarios = keyof typeof MENSAJES;

type Falla = { ok: false; codigo: CodigoErrorModoHorarios; mensaje: string };
function falla(codigo: CodigoErrorModoHorarios): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export type ModoHorarios = 'universal' | 'por_servicio';

/** Los códigos que la RPC / los guards de DB emiten por RAISE — se
 *  normalizan por startsWith (L-115). auth_required mapea a sin_sesion
 *  (la voz de la casa para ese estado). */
const CODIGOS_SERVIDOR: [prefijo: string, codigo: CodigoErrorModoHorarios][] = [
  ['auth_required', 'sin_sesion'],
  ['modo_invalido', 'modo_invalido'],
  ['prestador_no_encontrado', 'prestador_no_encontrado'],
  ['franjas_del_otro_modo_existen', 'franjas_del_otro_modo_existen'],
  ['franja_especifica_en_modo_universal', 'franja_especifica_en_modo_universal'],
  ['franja_universal_en_modo_por_servicio', 'franja_universal_en_modo_por_servicio'],
];

function normalizarError(mensaje: string): Falla {
  for (const [prefijo, codigo] of CODIGOS_SERVIDOR) {
    if (mensaje.startsWith(prefijo)) return falla(codigo);
  }
  if (mensaje.includes('duplicate key')) return falla('franja_duplicada');
  return falla('error_desconocido');
}

/** El modo vigente del prestador (prestadores.modo_horarios). */
export async function obtenerModoHorarios(
  prestadorId: string,
): Promise<ResultadoWrapper<ModoHorarios, CodigoErrorModoHorarios>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestadores')
    .select('modo_horarios')
    .eq('id', prestadorId)
    .maybeSingle();

  if (error) return normalizarError(error.message);
  if (data === null) return falla('prestador_no_encontrado');
  if (data.modo_horarios !== 'universal' && data.modo_horarios !== 'por_servicio') {
    return falla('datos_inconsistentes');
  }
  return { ok: true, data: data.modo_horarios };
}

/**
 * Escribe la elección — EL camino único (RPC elegir_modo_horarios).
 * franjas_del_otro_modo_existen = el prestador todavía tiene franjas
 * del modo viejo: la UI ofrece eliminarlas y reintentar, o cancelar.
 */
export async function elegirModoHorarios(
  modo: ModoHorarios,
): Promise<ResultadoWrapper<ModoHorarios, CodigoErrorModoHorarios>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('elegir_modo_horarios', { p_modo: modo });

  if (error) return normalizarError(error.message);
  if (data !== 'universal' && data !== 'por_servicio') return falla('datos_inconsistentes');
  return { ok: true, data };
}

/**
 * Borra TODAS las franjas propias del prestador (generales y por
 * servicio; las de empleados NO se tocan). Es el camino de "eliminar
 * tus franjas actuales y empezar de nuevo" del cambio de modo — las
 * franjas son configuración, no historia (regla 7.8 protege eventos).
 */
export async function eliminarFranjasPrestador(
  prestadorId: string,
): Promise<ResultadoWrapper<{ eliminadas: number }, CodigoErrorModoHorarios>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .delete()
    .eq('prestador_id', prestadorId)
    .is('empleado_id', null)
    .select('id');

  if (error) return normalizarError(error.message);
  return { ok: true, data: { eliminadas: Array.isArray(data) ? data.length : 0 } };
}

export interface FranjaHorarioServicio {
  id: string;
  /** La OFERTA dueña de la franja (prestador_servicios.id). */
  servicioId: string;
  /** 0=Domingo … 6=Sábado (regla 32). */
  diaSemana: number;
  /** 'HH:MM' */
  horaInicio: string;
  horaFin: string;
  duracionSlotMinutos: number;
  maxCitasPorSlot: number;
  activo: boolean;
}

const SELECT_FRANJA_SERVICIO =
  'id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo';

function aHoraCorta(v: string): string {
  return v.slice(0, 5);
}

function mapearFranjaServicio(fila: {
  id: string;
  servicio_id: string | null;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_minutos: number;
  max_citas_por_slot: number | null;
  activo: boolean;
}): FranjaHorarioServicio {
  return {
    id: fila.id,
    servicioId: fila.servicio_id ?? '',
    diaSemana: fila.dia_semana,
    horaInicio: aHoraCorta(fila.hora_inicio),
    horaFin: aHoraCorta(fila.hora_fin),
    duracionSlotMinutos: fila.duracion_slot_minutos,
    maxCitasPorSlot: fila.max_citas_por_slot ?? 1,
    activo: fila.activo,
  };
}

/** Las franjas POR SERVICIO de las ofertas dadas (empleados fuera). */
export async function obtenerFranjasDeServicios(
  prestadorId: string,
  servicioIds: string[],
): Promise<ResultadoWrapper<FranjaHorarioServicio[], CodigoErrorModoHorarios>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');
  if (servicioIds.length === 0) return { ok: true, data: [] };

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .select(SELECT_FRANJA_SERVICIO)
    .eq('prestador_id', prestadorId)
    .in('servicio_id', servicioIds)
    .is('empleado_id', null)
    .order('dia_semana', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (error) return normalizarError(error.message);
  if (!Array.isArray(data)) return falla('datos_inconsistentes');
  return { ok: true, data: data.map(mapearFranjaServicio) };
}

export interface InputCrearFranjaServicio {
  prestadorId: string;
  /** La OFERTA (prestador_servicios.id) dueña de la franja. */
  servicioId: string;
  /** 0=Domingo … 6=Sábado (regla 32). */
  diaSemana: number;
  /** 'HH:MM' en la grilla de 30 (v1: grilla fija). */
  horaInicio: string;
  horaFin: string;
  maxCitasPorSlot: number;
}

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Agrega una franja POR SERVICIO. El solape se pre-valida SOLO contra
 * las franjas de LA MISMA oferta (dos ofertas distintas con franjas a
 * la misma hora es LEGAL — cada una tiene su agenda; la ocupación del
 * motor sigue global, cláusula del arquitecto). La anti-duplicación
 * exacta vive en DB (UNIQUE NULLS NOT DISTINCT); el guard de modo
 * rebota tipado si el modo vigente no es por_servicio.
 */
export async function crearFranjaServicio(
  input: InputCrearFranjaServicio,
): Promise<ResultadoWrapper<FranjaHorarioServicio, CodigoErrorModoHorarios>> {
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
    .eq('servicio_id', input.servicioId)
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
      servicio_id: input.servicioId,
      dia_semana: input.diaSemana,
      hora_inicio: input.horaInicio,
      hora_fin: input.horaFin,
      duracion_slot_minutos: 30,
      max_citas_por_slot: input.maxCitasPorSlot,
      activo: true,
    })
    .select(SELECT_FRANJA_SERVICIO)
    .single();

  if (error) return normalizarError(error.message);
  if (data === null) return falla('error_desconocido');
  return { ok: true, data: mapearFranjaServicio(data) };
}
