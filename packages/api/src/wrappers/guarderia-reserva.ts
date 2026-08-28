// La reserva de guardería — S107-A (el gate sanitario y el día).
//
// Contrato: `docs/contratos/s107-contrato-cupo-franja-estadia.md` §④ y §⑥.
//
// 🔴 EL ORDEN DEL COBRO NO SE NEGOCIA (`LETRA_PAGO_CITAS` §3): compuertas →
// cobro por el motor → **`confirmada` sólo cuando el motor confirma**. Estos
// wrappers son la PRIMERA mitad: la reserva nace `pendiente_pago` con hold de
// 15 minutos y su desglose se congela solo. **El cobro lo hace el motor de
// pagos por `cita_id`, que ya sabe hacerlo — acá no se reimplementa nada.**

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  /* 🔴 Este código NO se traduce a «revisá los datos»: la pantalla tiene que
     nombrar QUÉ falta y llevar a resolverlo a un toque. El detalle viaja en
     `faltantes`, y el tipo de la pieza de B hace que un faltante sin camino
     ni siquiera compile. */
  requisitos_sanitarios:  'Faltan requisitos sanitarios para poder reservar.',
  sin_cupo:               'Ese día ya no tiene lugar.',
  guarderia_no_disponible:'Esta guardería no está recibiendo reservas.',
  fecha_pasada:           'Ese día ya pasó.',
  mascota_no_elegible:    'La guardería es solo para perros y gatos.',
  no_access_to_mascota:   'No tienes acceso a esa mascota.',
  sin_sesion:             'No hay sesión activa.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorGuarderiaReserva = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorGuarderiaReserva[];

function fallaCodigo<T>(c: CodigoErrorGuarderiaReserva): ResultadoWrapper<T, CodigoErrorGuarderiaReserva> {
  return { ok: false, codigo: c, mensaje: MENSAJES[c] };
}
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorGuarderiaReserva> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const c of CODIGOS) if (raw.startsWith(c)) return fallaCodigo(c);
  return fallaCodigo('error_desconocido');
}

/** El vocabulario del motor, tal cual. La VOZ de cada estado es de la casa que lo muestra. */
export type EstadoRequisito = 'nunca_aplicada' | 'sin_carnet' | 'sin_fecha' | 'vencida';

export interface RequisitoFaltante {
  codigo: string;
  nombre: string;
  estado: EstadoRequisito;
  /** 'YYYY-MM-DD' o null — la fecha que el dueño declaró al cargar el carnet. */
  vence: string | null;
}

export interface RequisitosGuarderia {
  alDia: boolean;
  faltantes: RequisitoFaltante[];
}

/**
 * Qué le falta a esta mascota para poder ir a la guardería.
 *
 * 🔴 **La lista de vacunas es DATO** (`cat_plan_vacunal.exigida_guarderia`),
 * jamás código: el día que el veterinario defina la lista completa por especie,
 * es un `UPDATE` — no una versión de la app.
 */
export async function evaluarRequisitosGuarderia(
  mascotaId: string,
): Promise<ResultadoWrapper<RequisitosGuarderia, CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('evaluar_requisitos_guarderia', {
    p_mascota_id: mascotaId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (r.estado !== 'al_dia' && r.estado !== 'faltan') return fallaCodigo('datos_inconsistentes');
  if (!Array.isArray(r.faltantes)) return fallaCodigo('datos_inconsistentes');
  const faltantes: RequisitoFaltante[] = [];
  for (const f of r.faltantes) {
    if (typeof f !== 'object' || f === null) return fallaCodigo('datos_inconsistentes');
    const x = f as Record<string, unknown>;
    if (typeof x.codigo !== 'string' || typeof x.estado !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    faltantes.push({
      codigo: x.codigo,
      nombre: typeof x.nombre === 'string' ? x.nombre : x.codigo,
      estado: x.estado as EstadoRequisito,
      vence: typeof x.vence === 'string' ? x.vence : null,
    });
  }
  return { ok: true, data: { alDia: r.estado === 'al_dia', faltantes } };
}

export interface ReservaGuarderia {
  citaId: string;
  estadiaId: string;
  precio: number;
  /** El hold vence acá. Si el pago no llega, el lugar se libera. */
  expiraEn: string;
}

/**
 * Reserva UN día. Nace `pendiente_pago` con hold de 15 minutos.
 *
 * 🔴 **El cupo se toma bajo candado**: dos familias que tocan «reservar» en el
 * mismo segundo no pueden leer las dos el mismo «queda 1».
 */
export async function reservarDiaGuarderia(params: {
  prestadorId: string;
  mascotaId: string;
  /** 'YYYY-MM-DD' */
  fecha: string;
}): Promise<ResultadoWrapper<ReservaGuarderia, CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('reservar_dia_guarderia', {
    p_prestador_id: params.prestadorId,
    p_mascota_id: params.mascotaId,
    p_fecha: params.fecha,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.cita_id !== 'string' || typeof r.estadia_id !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  if (typeof r.precio !== 'number' || typeof r.expira_en !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: { citaId: r.cita_id, estadiaId: r.estadia_id, precio: r.precio, expiraEn: r.expira_en },
  };
}

// ── LA JORNADA DEL PRESTADOR ────────────────────────────────────────────────

/** El vocabulario del motor. La VOZ de cada estado es de la casa que lo muestra. */
export type EstadoEstadia =
  | 'reservada' | 'recogida_en_curso' | 'en_guarderia'
  | 'retorno_en_curso' | 'entregada' | 'cancelada' | 'no_recogida';

export interface EstadiaDelDia {
  estadiaId: string;
  citaId: string;
  estado: EstadoEstadia;
  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaFotoUrl: string | null;
  /** En qué sala quedó. null = todavía sin asignar. */
  espacioNombre: string | null;
  /** 🔴 Dónde hay que ir a buscarlo. Congelada al reservar (D-339). */
  direccion: unknown | null;
  aBordoEn: string | null;
  llegadaEn: string | null;
  entregadaEn: string | null;
}

/**
 * La lista de hoy del prestador.
 *
 * 🔴 **Es una VISTA sobre las estadías, jamás una entidad «jornada»**: un día
 * con seis animales son seis estadías. La pantalla compone; no hay un objeto
 * que pedir ni que mutar.
 *
 * 🔴 **Y sólo trae verdad firme.** Un hold sin pagar no es una estadía del día:
 * es alguien mirando. *Una lista que incluyera reservas que pueden evaporarse
 * en quince minutos haría salir al cuidador a buscar un animal que nadie
 * compró.*
 */
export async function obtenerEstadiasDelDia(
  prestadorId: string,
  /** 'YYYY-MM-DD' */
  fecha: string,
): Promise<ResultadoWrapper<EstadiaDelDia[], CodigoErrorGuarderiaReserva>> {
  const { data, error } = await getClient().rpc('obtener_estadias_del_dia', {
    p_prestador_id: prestadorId,
    p_fecha: fecha,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: EstadiaDelDia[] = [];
  for (const e of data) {
    if (typeof e !== 'object' || e === null) return fallaCodigo('datos_inconsistentes');
    const r = e as Record<string, unknown>;
    if (typeof r.estadia_id !== 'string' || typeof r.cita_id !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (typeof r.estado !== 'string' || typeof r.mascota_id !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    salida.push({
      estadiaId: r.estadia_id,
      citaId: r.cita_id,
      estado: r.estado as EstadoEstadia,
      mascotaId: r.mascota_id,
      mascotaNombre: typeof r.mascota_nombre === 'string' ? r.mascota_nombre : '',
      mascotaEspecie: typeof r.mascota_especie === 'string' ? r.mascota_especie : '',
      mascotaFotoUrl: typeof r.mascota_foto_url === 'string' ? r.mascota_foto_url : null,
      espacioNombre: typeof r.espacio_nombre === 'string' ? r.espacio_nombre : null,
      direccion: r.direccion_snapshot ?? null,
      aBordoEn: typeof r.a_bordo_en === 'string' ? r.a_bordo_en : null,
      llegadaEn: typeof r.llegada_en === 'string' ? r.llegada_en : null,
      entregadaEn: typeof r.entregada_en === 'string' ? r.entregada_en : null,
    });
  }
  return { ok: true, data: salida };
}
