// Wrapper del CONTACTO DE LA VISITA (S74-A, decisión de mesa): nombre +
// teléfono de QUIEN RESERVÓ la cita — el contacto es propiedad de la
// VISITA, no del animal (recepción v1 no toca D-485 ni el modelo de
// familia). RPC `obtener_contacto_reserva_cita`: gate por
// `empleado_tiene_rol` del negocio de la cita (recepción INCLUIDA, A3.4);
// walk-in sin reservador = nulls honestos — la pantalla dice el hueco
// (Ley 13), el motor no inventa. El teléfono viaja con su código de país
// TAL CUAL está guardado (letra Uber P21: jamás derivado del perfil).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_CONTACTO = [
  'auth_required',
  'cita_no_encontrada',
  'sin_acceso',
] as const;

export type CodigoErrorContactoReserva = (typeof CODIGOS_ERROR_CONTACTO)[number];

const MENSAJES_ERROR_CONTACTO: Record<
  CodigoErrorContactoReserva | 'error_desconocido',
  string
> = {
  auth_required: 'No hay sesión activa.',
  cita_no_encontrada: 'La cita no existe o ya no es accesible.',
  sin_acceso: 'No tienes acceso al contacto de esta visita.',
  error_desconocido: 'No pudimos cargar el contacto. Prueba de nuevo.',
};

export interface ContactoReservaCita {
  /** Nombre de quien reservó; null honesto (walk-in fantasma o perfil sin nombre). */
  nombre: string | null;
  telefono: string | null;
  telefonoCodigoPais: string | null;
}

function mapeoErrorContacto(raw: string): ResultadoWrapper<never> {
  for (const codigo of CODIGOS_ERROR_CONTACTO) {
    // L-115: los RPCs levantan '<codigo>: <detalle>' — normalizar por prefijo
    if (raw.startsWith(codigo)) {
      return { ok: false, codigo, mensaje: MENSAJES_ERROR_CONTACTO[codigo] };
    }
  }
  return {
    ok: false,
    codigo: 'error_desconocido',
    mensaje: MENSAJES_ERROR_CONTACTO.error_desconocido,
  };
}

/** El contacto de quien reservó la cita, para el equipo del negocio que
 *  la recibe. Siempre las mismas claves, null sin dato (L-124): un
 *  reservador sin perfil legible resuelve a nulls honestos, jamás a
 *  error inventado. */
export async function obtenerContactoReservaCita(
  citaId: string,
): Promise<ResultadoWrapper<ContactoReservaCita>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('obtener_contacto_reserva_cita', {
    p_cita_id: citaId,
  });
  if (error) return mapeoErrorContacto(error.message);
  const fila = Array.isArray(data) ? data[0] : null;
  return {
    ok: true,
    data: {
      nombre: fila?.nombre ?? null,
      telefono: fila?.telefono ?? null,
      telefonoCodigoPais: fila?.telefono_codigo_pais ?? null,
    },
  };
}

// ═══ S78-B · EL MOTOR DE RECEPCIÓN (migración s78a6, aplicada y
// verificada contra la DB viva: las 3 funciones + la columna existen).
// Guards de shape contra el RETURNS TABLE real de la migración (L-124:
// siempre las mismas claves, null sin dato). Los errores viajan tipados
// por prefijo (L-115). ═══

const CODIGOS_ERROR_RECEPCION = [
  'auth_required',
  'cita_no_encontrada',
  'sin_acceso',
  'cita_no_activa',
  'cuenta_no_encontrada',
] as const;

export type CodigoErrorRecepcion = (typeof CODIGOS_ERROR_RECEPCION)[number] | 'error_desconocido';

function mapeoErrorRecepcion(raw: string): { ok: false; codigo: CodigoErrorRecepcion; mensaje: string } {
  for (const codigo of CODIGOS_ERROR_RECEPCION) {
    if (raw.startsWith(codigo)) return { ok: false, codigo, mensaje: raw };
  }
  return { ok: false, codigo: 'error_desconocido', mensaje: raw };
}

export interface CitaJornadaRecepcion {
  citaId: string;
  /** 'HH:MM:SS' del motor; null honesto (la por-coordinar no entra: el
   *  lector exige estado firme, pero el shape no lo presume). */
  hora: string | null;
  duracionMinutos: number | null;
  estado: string | null;
  tipoServicio: string | null;
  mascotaId: string | null;
  mascotaNombre: string | null;
  /** null = LA CITA DEL NEGOCIO (S77 §11a: la baja estampa NULL). La
   *  sección "Del negocio" del M1 de B consume exactamente esto. */
  empleadoId: string | null;
  empleadoNombre: string | null;
  /** null = todavía no llegó. Es un HECHO con hora, jamás un estado. */
  llegadaEn: string | null;
}

/** La jornada del día CON su persona — los DOS permisos de §4 en una
 *  función (ver la cita del negocio + resolver el id a nombre). El
 *  alcance lo modula el MOTOR por rol (titular/recepción = todo ·
 *  profesional = lo suyo): la pantalla no re-decide. */
export async function obtenerJornadaRecepcion(
  prestadorId: string,
  fecha: string,
): Promise<ResultadoWrapper<CitaJornadaRecepcion[], CodigoErrorRecepcion>> {
  const { data, error } = await getClient().rpc('obtener_jornada_recepcion', {
    p_prestador_id: prestadorId,
    p_fecha: fecha,
  });
  if (error) return mapeoErrorRecepcion(error.message);
  const filas = Array.isArray(data) ? data : [];
  return {
    ok: true,
    data: filas.map((f) => ({
      citaId: f.cita_id,
      hora: f.hora ?? null,
      duracionMinutos: f.duracion_minutos ?? null,
      estado: f.estado ?? null,
      tipoServicio: f.tipo_servicio ?? null,
      mascotaId: f.mascota_id ?? null,
      mascotaNombre: f.mascota_nombre ?? null,
      empleadoId: f.empleado_id ?? null,
      empleadoNombre: f.empleado_nombre ?? null,
      llegadaEn: f.llegada_en ?? null,
    })),
  };
}

/** "Llegó" — estampa el HECHO. Idempotente en el motor: si ya había
 *  llegada devuelve la que hay (re-tapear no miente la hora). El deshacer
 *  NO existe y es a propósito (familia D-544: corregir es AGREGAR). */
export async function registrarLlegada(
  citaId: string,
): Promise<ResultadoWrapper<{ llegadaEn: string }, CodigoErrorRecepcion>> {
  const { data, error } = await getClient().rpc('registrar_llegada', { p_cita_id: citaId });
  if (error) return mapeoErrorRecepcion(error.message);
  if (typeof data !== 'string' || data.length === 0) {
    return { ok: false, codigo: 'error_desconocido', mensaje: 'respuesta_sin_llegada' };
  }
  return { ok: true, data: { llegadaEn: data } };
}

export interface SolicitudMostrador {
  solicitudId: string;
  tipo: string | null;
  /** DERIVADO por el server (expiración perezosa): una 'pendiente' con
   *  expira_en vencido llega como 'expirada' — la fila no se tocó. */
  estado: string | null;
  mascotaId: string | null;
  mascotaNombre: string | null;
  expiraEn: string | null;
  /** El reloj LO DICE EL SERVER (jamás la hora del teléfono, que puede
   *  estar corrida). Nunca negativo. */
  segundosRestantes: number;
  respondidaEn: string | null;
  createdAt: string | null;
}

/** Las solicitudes §7bis del lado del MOSTRADOR (últimas 24 h) — el
 *  lector que faltaba: la recepcionista dejaba de ver su estado
 *  envejecer en el instante de dispararlo. */
export async function obtenerSolicitudesMostrador(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<SolicitudMostrador[], CodigoErrorRecepcion>> {
  const { data, error } = await getClient().rpc('obtener_solicitudes_mostrador', {
    p_cuenta_comercial_id: cuentaComercialId,
  });
  if (error) return mapeoErrorRecepcion(error.message);
  const filas = Array.isArray(data) ? data : [];
  return {
    ok: true,
    data: filas.map((f) => ({
      solicitudId: f.solicitud_id,
      tipo: f.tipo ?? null,
      estado: f.estado ?? null,
      mascotaId: f.mascota_id ?? null,
      mascotaNombre: f.mascota_nombre ?? null,
      expiraEn: f.expira_en ?? null,
      segundosRestantes: typeof f.segundos_restantes === 'number' ? f.segundos_restantes : 0,
      respondidaEn: f.respondida_en ?? null,
      createdAt: f.created_at ?? null,
    })),
  };
}
