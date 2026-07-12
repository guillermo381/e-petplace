// Vacaciones / bloqueos del prestador — S56-B TAREA 2 (D-341).
//
// La RLS es la puerta: prestador_bloqueos_own (ALL por prestadores.user_id,
// ÚNICA post-D-342 — verificado literal contra DB viva). Cero RPC, cero
// L-140 acá: mismo camino probado de configuracionPaseo.
//
// La PROMESA la cumple el motor, no esta pantalla: _prestador_bloqueado
// (helper interno, ACL postgres/service_role) se consulta en SEIS puertas
// (slots, inicios, paseadores, hold, y las dos del plan) — verificado por
// prosrc en esta sesión. Semántica del rango: fechas INCLUSIVE ambos
// extremos, granularidad día. El bloqueo mata oferta y holds NUEVOS;
// las citas ya confirmadas siguen en pie (P14/P16, jamás automático).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:           'No hay sesión activa.',
  rango_invalido:       'El fin tiene que ser el mismo día del inicio o después.',
  inicio_pasado:        'El bloqueo no puede empezar en el pasado.',
  no_eliminable:        'Solo puedes quitar bloqueos que aún no empezaron.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorBloqueos = keyof typeof MENSAJES;

type Falla = { ok: false; codigo: CodigoErrorBloqueos; mensaje: string };
function falla(codigo: CodigoErrorBloqueos): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export interface BloqueoPrestador {
  id: string;
  /** ISO 'YYYY-MM-DD', inclusive. */
  fechaInicio: string;
  fechaFin: string;
  motivo: string | null;
}

const SELECT_BLOQUEO = 'id, fecha_inicio, fecha_fin, motivo';

function mapear(fila: {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
}): BloqueoPrestador {
  return { id: fila.id, fechaInicio: fila.fecha_inicio, fechaFin: fila.fecha_fin, motivo: fila.motivo };
}

// Fecha local del dispositivo (patrón hoyLocal de las pantallas — jamás
// toISOString: corre el día post-19:00 en UTC-5, hallazgo S55).
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

const ISO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Bloqueos vigentes y futuros del prestador propio (los pasados no se listan). */
export async function obtenerBloqueosPrestador(
  prestadorId: string,
): Promise<ResultadoWrapper<BloqueoPrestador[], CodigoErrorBloqueos>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_bloqueos')
    .select(SELECT_BLOQUEO)
    .eq('prestador_id', prestadorId)
    .gte('fecha_fin', hoyLocal())
    .order('fecha_inicio', { ascending: true });

  if (error || !Array.isArray(data)) return falla('error_desconocido');
  return { ok: true, data: data.map(mapear) };
}

export interface InputCrearBloqueoPrestador {
  prestadorId: string;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string;
}

/** Crea un rango de bloqueo (vigente desde hoy o futuro). Espejo del CHECK bloqueo_fechas_validas. */
export async function crearBloqueoPrestador(
  input: InputCrearBloqueoPrestador,
): Promise<ResultadoWrapper<BloqueoPrestador, CodigoErrorBloqueos>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  if (!ISO_FECHA.test(input.fechaInicio) || !ISO_FECHA.test(input.fechaFin)) {
    return falla('rango_invalido');
  }
  if (input.fechaFin < input.fechaInicio) return falla('rango_invalido');
  if (input.fechaInicio < hoyLocal()) return falla('inicio_pasado');

  const { data, error } = await getClient()
    .from('prestador_bloqueos')
    .insert({
      prestador_id: input.prestadorId,
      fecha_inicio: input.fechaInicio,
      fecha_fin: input.fechaFin,
      motivo: input.motivo?.trim() || null,
    })
    .select(SELECT_BLOQUEO)
    .single();

  if (error || data === null) return falla('error_desconocido');
  return { ok: true, data: mapear(data) };
}

/**
 * Quita un bloqueo que AÚN NO EMPEZÓ (alcance v1 del brief: eliminar
 * futuros; terminar-antes un bloqueo vigente es peldaño posterior).
 * El filtro por fecha viaja en el DELETE — cero ventana entre leer y borrar.
 */
export async function eliminarBloqueoPrestador(
  id: string,
): Promise<ResultadoWrapper<null, CodigoErrorBloqueos>> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_bloqueos')
    .delete()
    .eq('id', id)
    .gt('fecha_inicio', hoyLocal())
    .select('id');

  if (error) return falla('error_desconocido');
  // sin fila = no era tuyo, no existe, o ya empezó — jamás no-op silencioso
  if (!Array.isArray(data) || data.length === 0) return falla('no_eliminable');
  return { ok: true, data: null };
}
