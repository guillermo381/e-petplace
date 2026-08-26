// LA PIZARRA Y LA AGENDA DEL NEGOCIO (S86 — pedido de C; desbloquea la
// pantalla de la pizarra y el alta de cita del mostrador).
//
// ⚠️ PROCEDENCIA: los nombres SALEN DEL MOTOR, leído con
// `pg_get_functiondef` (regla 40). La spec de C fue anunciada y no
// viajó. Si difiere: GANA EL MOTOR y se corrige acá — jamás se clona
// una segunda forma.
//
// ═══ DOS CORRECCIONES QUE DA LA FUENTE, y se declaran porque el pedido
//     venía con la premisa contraria ═══
//
//  ① `ya_tomada` **NO viaja en el dato**. El pedido decía que, por
//     devolver `jsonb`, viajaría adentro del objeto. El body dice otra
//     cosa: es `RAISE EXCEPTION 'ya_tomada' USING ERRCODE = '23505'`
//     ⇒ **llega como error de PostgREST**, y el `jsonb` solo carga la
//     forma del ÉXITO (`{ok, citaId, empleadoId}`).
//     **LA CONCLUSIÓN DEL PEDIDO NO CAMBIA — SE REFUERZA:** tiene que
//     tener CÓDIGO PROPIO. Si cae en `error_desconocido`, la pizarra no
//     puede decir «alguien llegó primero» y la saca en silencio, que es
//     lo que la lámina prohíbe. Solo cambia POR DÓNDE se lo captura.
//
//  ② `el_mostrador_registra_no_reserva` **no vive en
//     `crear_cita_negocio`**: lo levanta `registrar_atencion_mostrador`
//     (medido: es la ÚNICA función que lo contiene). Su cura va en
//     `veterinaria-mostrador.ts`, no acá. Se hizo, y se dice.
//
// ═══ Y UNA DISTINCIÓN DEL MOTOR QUE NO SE PUEDE APLANAR ═══
//     `slot_ocupado` y `sin_quien_la_tome` son DOS VERDADES DISTINTAS, y
//     el propio body lo declara: la primera es «esa hora no existe como
//     inicio»; la segunda es «la hora está, pero no queda NADIE que
//     pueda tomarla». Colapsarlas manda al mostrador a mover la hora
//     cuando el problema es de gente. (Precedente: `persona_no_disponible`
//     vs `slot_ocupado`, S78.)

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── ① LA PIZARRA (lector) ────────────────────────────────────────────

const MENSAJES_PIZARRA = {
  sin_sesion: 'No hay sesión activa.',
  sin_acceso: 'No tienes acceso a este negocio.',
  error_desconocido: 'No pudimos leer la pizarra.',
} as const;

export type CodigoErrorPizarra = keyof typeof MENSAJES_PIZARRA;

/** Una cita EN LA PIZARRA: sin tratante puesto (`empleado_id IS NULL`). */
export interface CitaDePizarra {
  citaId: string;
  /** `YYYY-MM-DD`. */
  fecha: string;
  /** `HH:MM:SS`. */
  hora: string;
  /** Código de motor — NO se pinta. */
  tipoServicio: string;
  /** `null` = servicio sin voz. NO es un código crudo para pintar (Ley 3). */
  servicioVoz: string | null;
  mascotaId: string;
  mascotaNombre: string;
  /** `null` honesto si la mascota no declara especie. */
  mascotaEspecie: string | null;
}

export async function obtenerPizarra(
  prestadorId: string,
): Promise<ResultadoWrapper<CitaDePizarra[], CodigoErrorPizarra>> {
  const { data, error } = await getClient().rpc('obtener_pizarra', {
    p_prestador_id: prestadorId,
  });

  if (error) {
    const raw = error.message ?? '';
    if (raw.startsWith('auth_required')) {
      return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES_PIZARRA.sin_sesion };
    }
    if (raw.startsWith('no_access_to_prestador')) {
      return { ok: false, codigo: 'sin_acceso', mensaje: MENSAJES_PIZARRA.sin_acceso };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_PIZARRA.error_desconocido };
  }

  // L-197: sin dato no se opina. Una forma inesperada NO se completa con
  // una lista vacía — «la pizarra está vacía» y «no pude leerla» son
  // cosas distintas y la superficie tiene que poder distinguirlas.
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_PIZARRA.error_desconocido };
  }

  return {
    ok: true,
    data: data.map((f) => ({
      citaId: f.cita_id,
      fecha: f.fecha,
      hora: f.hora,
      tipoServicio: f.tipo_servicio,
      servicioVoz: f.servicio_voz,
      mascotaId: f.mascota_id,
      mascotaNombre: f.mascota_nombre,
      mascotaEspecie: f.mascota_especie,
    })),
  };
}

// ── ② TOMAR (el acto) ────────────────────────────────────────────────

const MENSAJES_TOMAR = {
  sin_sesion: 'No hay sesión activa.',
  cita_no_existe: 'Esa cita ya no está.',
  no_sos_del_equipo: 'No eres parte del equipo de este negocio.',
  no_es_tu_especialidad: 'Esa cita es de un servicio que no atiendes.',
  /** ⚠️ EL CÓDIGO QUE NO SE PUEDE PERDER (ver ① de la cabecera). */
  ya_tomada: 'Alguien del equipo la tomó primero.',
  error_desconocido: 'No pudimos tomar la cita. Prueba de nuevo.',
} as const;

export type CodigoErrorTomarCita = keyof typeof MENSAJES_TOMAR;

export interface CitaTomada {
  citaId: string;
  empleadoId: string;
}

export async function tomarCita(
  citaId: string,
): Promise<ResultadoWrapper<CitaTomada, CodigoErrorTomarCita>> {
  const { data, error } = await getClient().rpc('tomar_cita', { p_cita_id: citaId });

  if (error) {
    const raw = error.message ?? '';
    // El orden no es casual: `ya_tomada` primero porque es el ÚNICO que
    // la superficie tiene obligación de decir con voz propia — el resto
    // puede degradar sin romper la lámina, éste no.
    if (raw.startsWith('ya_tomada')) {
      return { ok: false, codigo: 'ya_tomada', mensaje: MENSAJES_TOMAR.ya_tomada };
    }
    if (raw.startsWith('auth_required')) {
      return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES_TOMAR.sin_sesion };
    }
    if (raw.startsWith('cita_no_existe')) {
      return { ok: false, codigo: 'cita_no_existe', mensaje: MENSAJES_TOMAR.cita_no_existe };
    }
    if (raw.startsWith('no_sos_del_equipo')) {
      return { ok: false, codigo: 'no_sos_del_equipo', mensaje: MENSAJES_TOMAR.no_sos_del_equipo };
    }
    if (raw.startsWith('no_es_tu_especialidad')) {
      return { ok: false, codigo: 'no_es_tu_especialidad', mensaje: MENSAJES_TOMAR.no_es_tu_especialidad };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_TOMAR.error_desconocido };
  }

  const d = data as { ok?: boolean; citaId?: string; empleadoId?: string } | null;
  if (d === null || typeof d !== 'object' || typeof d.citaId !== 'string' || typeof d.empleadoId !== 'string') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_TOMAR.error_desconocido };
  }
  return { ok: true, data: { citaId: d.citaId, empleadoId: d.empleadoId } };
}

// ── ③ CREAR CITA DEL NEGOCIO ─────────────────────────────────────────

const MENSAJES_CREAR = {
  sin_sesion: 'No hay sesión activa.',
  sin_acceso: 'No tienes acceso a este negocio.',
  fecha_en_el_pasado: 'Esa fecha ya pasó.',
  prestador_sin_cuenta: 'Tu negocio todavía no está habilitado para agendar.',
  sin_acceso_mascota: 'No tienes acceso a esta mascota.',
  mascota_no_existe: 'Esa mascota ya no está.',
  servicio_no_activo: 'Ese servicio no está activo en tu negocio.',
  prestador_bloqueado: 'Ese día está bloqueado en tu agenda.',
  slot_ocupado: 'Esa hora ya no está disponible.',
  /** ⚠️ Distinto de `slot_ocupado` POR DISEÑO DEL MOTOR — ver cabecera. */
  sin_quien_la_tome: 'La hora está libre, pero no queda nadie que pueda tomarla.',
  error_desconocido: 'No pudimos agendar la cita. Prueba de nuevo.',
} as const;

export type CodigoErrorCrearCitaNegocio = keyof typeof MENSAJES_CREAR;

export interface CitaDeNegocioCreada {
  citaId: string;
  /** `true` = nació SIN tratante ⇒ vive en la pizarra hasta que alguien la tome. */
  aLaPizarra: boolean;
}

/**
 * @param empleadoId  `undefined` / `null` = **a la pizarra**. Ése es el
 *   camino que dispara el cupo (`sin_quien_la_tome`): el motor cuenta
 *   cuántas personas elegibles tienen ese inicio libre y cuántas citas
 *   ya están a la pizarra a esa hora.
 * @param precio      `undefined` = el del servicio.
 */
export async function crearCitaNegocio(datos: {
  prestadorId: string;
  mascotaId: string;
  tipoServicio: string;
  fecha: string;
  hora: string;
  empleadoId?: string | null;
  precio?: number;
}): Promise<ResultadoWrapper<CitaDeNegocioCreada, CodigoErrorCrearCitaNegocio>> {
  const { data, error } = await getClient().rpc('crear_cita_negocio', {
    p_prestador_id: datos.prestadorId,
    p_mascota_id: datos.mascotaId,
    p_tipo_servicio: datos.tipoServicio,
    p_fecha: datos.fecha,
    p_hora: datos.hora,
    // `null` y `undefined` son LO MISMO para el motor (el parámetro es
    // DEFAULT NULL = a la pizarra) — pero los tipos generados solo
    // admiten `string`. Se OMITE en vez de castear: un `as` acá sería
    // esconder que la ausencia y el null son el mismo camino.
    ...(typeof datos.empleadoId === 'string' ? { p_empleado_id: datos.empleadoId } : null),
    ...(datos.precio !== undefined ? { p_precio: datos.precio } : null),
  });

  if (error) {
    const raw = error.message ?? '';
    const directos: CodigoErrorCrearCitaNegocio[] = [
      'fecha_en_el_pasado',
      'prestador_sin_cuenta',
      'sin_acceso_mascota',
      'mascota_no_existe',
      'servicio_no_activo',
      'prestador_bloqueado',
      // `sin_quien_la_tome` ANTES que `slot_ocupado`: son prefijos
      // distintos, pero el orden deja explícito que no se colapsan.
      'sin_quien_la_tome',
      'slot_ocupado',
    ];
    for (const c of directos) {
      if (raw.startsWith(c)) return { ok: false, codigo: c, mensaje: MENSAJES_CREAR[c] };
    }
    if (raw.startsWith('auth_required')) {
      return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES_CREAR.sin_sesion };
    }
    if (raw.startsWith('no_access_to_prestador')) {
      return { ok: false, codigo: 'sin_acceso', mensaje: MENSAJES_CREAR.sin_acceso };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_CREAR.error_desconocido };
  }

  const d = data as { ok?: boolean; citaId?: string; aLaPizarra?: boolean } | null;
  if (d === null || typeof d !== 'object' || typeof d.citaId !== 'string' || typeof d.aLaPizarra !== 'boolean') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_CREAR.error_desconocido };
  }
  return { ok: true, data: { citaId: d.citaId, aLaPizarra: d.aLaPizarra } };
}
