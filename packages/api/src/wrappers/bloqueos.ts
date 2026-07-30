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

import { getClient, uidActual } from '../client';
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
  if ((await uidActual()) === null) return falla('sin_sesion');

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
  if ((await uidActual()) === null) return falla('sin_sesion');

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
  if ((await uidActual()) === null) return falla('sin_sesion');

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

// ── S82 r7 · DÍAS CERRADOS (recurrencia semanal) ──
// Distinto de `prestador_bloqueos`, que son RANGOS DE FECHA (vacaciones):
// esto es "el negocio cierra los domingos". Sin esta declaración el motor
// no puede distinguir "cierra" de "todavía no configuró" — las dos cosas
// daban cero franjas y la pantalla no podía decir "cerrado" sin mentir.

export interface DiaCerrado {
  /** 0..6 — MISMA convención que prestador_horarios.dia_semana. */
  dia_semana: number;
  /** Voz del negocio; null = cerrado sin motivo declarado (la pantalla
   *  dice "cerrado" y nada más — jamás inventa el porqué). */
  motivo: string | null;
}

/** Los días que el negocio declaró CERRADOS. Lista vacía = no declaró
 *  ninguno (que NO es lo mismo que "abre todos los días": un día sin
 *  franjas sigue siendo "sin horarios", otro estado y otra voz). */
export async function obtenerDiasCerrados(
  prestadorId: string,
): Promise<ResultadoWrapper<DiaCerrado[], 'error_lectura'>> {
  const { data, error } = await getClient().rpc('obtener_dias_cerrados', { p_prestador_id: prestadorId });
  if (error || !Array.isArray(data)) {
    return { ok: false, codigo: 'error_lectura', mensaje: 'No pudimos leer los días de atención.' };
  }
  const filas: DiaCerrado[] = [];
  for (const f of data as Record<string, unknown>[]) {
    if (typeof f.dia_semana !== 'number') continue;
    filas.push({ dia_semana: f.dia_semana, motivo: typeof f.motivo === 'string' ? f.motivo : null });
  }
  return { ok: true, data: filas };
}

/** El negocio declara (o levanta) un día cerrado. `cerrado=false` borra
 *  la declaración — volver a "sin horarios" es explícito. */
export async function declararDiaCerrado(
  prestadorId: string,
  diaSemana: number,
  cerrado: boolean,
  motivo?: string,
): Promise<ResultadoWrapper<{ dia_semana: number; cerrado: boolean }, 'sin_sesion' | 'sin_acceso' | 'dia_invalido' | 'desconocido'>> {
  const { data, error } = await getClient().rpc('declarar_dia_cerrado', {
    p_prestador_id: prestadorId,
    p_dia_semana: diaSemana,
    p_cerrado: cerrado,
    ...(motivo !== undefined ? { p_motivo: motivo } : null),
  });
  if (error) {
    const m = error.message;
    const codigo = m.startsWith('auth_required')
      ? 'sin_sesion'
      : m.startsWith('no_access_to_prestador')
        ? 'sin_acceso'
        : m.startsWith('dia_invalido')
          ? 'dia_invalido'
          : 'desconocido';
    return { ok: false, codigo, mensaje: 'No pudimos guardar el día. Prueba de nuevo.' };
  }
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || typeof o.dia_semana !== 'number' || typeof o.cerrado !== 'boolean') {
    return { ok: false, codigo: 'desconocido', mensaje: 'No pudimos guardar el día. Prueba de nuevo.' };
  }
  return { ok: true, data: { dia_semana: o.dia_semana, cerrado: o.cerrado } };
}
