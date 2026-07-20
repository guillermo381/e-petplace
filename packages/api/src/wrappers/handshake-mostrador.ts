// HANDSHAKE MOSTRADOR (S70-A3/A3bis) — un paso, por mascota, historia recién
// al autorizar. Wrappers de las 2 RPCs (migración 20260719160000):
//   crear_solicitud_autorizacion(...)      → uuid   (lado prestador)
//   responder_solicitud_autorizacion(id,acc) → jsonb (lado dueño)
// La búsqueda enmendada (buscar_cliente_por_*) vive en el wrapper del
// mostrador (lado B); su rama 'registrado' ahora trae mascotas[{mascota_id,
// nombre, foto_url}] — ver reporte S70-A3.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export type TipoSolicitud = 'atencion' | 'alta_mascota';
export type AccionSolicitud = 'autorizar' | 'rechazar';

/** Payload del alta mínima (solo tipo='alta_mascota'). */
export type PayloadAlta = {
  nombre: string;
  especie: string;
  sexo?: string | null;
  fecha_nacimiento?: string | null;
  precision?: string | null;
  foto_url?: string | null;
}

const CODIGOS_SOLICITUD = [
  'acceso_denegado',
  'no_opera_cuenta',
  'cuenta_no_activa',
  'tipo_invalido',
  'mascota_requerida',
  'mascota_no_existe',
  'destino_requerido',
  'payload_alta_invalido',
  'solicitud_duplicada',
  'solicitud_no_existe',
  'solicitud_expirada',
  'solicitud_no_pendiente',
  'no_es_familia',
  'accion_invalida',
  'sin_familia',
  'familia_ambigua',
  'especie_invalida',
  'datos_invalidos',
] as const;
export type CodigoErrorSolicitud = (typeof CODIGOS_SOLICITUD)[number];

const MENSAJES_SOLICITUD: Record<CodigoErrorSolicitud, string> = {
  acceso_denegado: 'Tu sesión no está activa. Iniciá sesión de nuevo.',
  no_opera_cuenta: 'No operás este negocio.',
  cuenta_no_activa: 'El negocio todavía no está activo.',
  tipo_invalido: 'Tipo de solicitud inválido.',
  mascota_requerida: 'Elegí una mascota.',
  mascota_no_existe: 'Esa mascota ya no existe.',
  destino_requerido: 'Falta el cliente destinatario.',
  payload_alta_invalido: 'Faltan datos de la mascota (nombre y especie).',
  solicitud_duplicada: 'Ya hay una solicitud pendiente para esta mascota.',
  solicitud_no_existe: 'Esa solicitud ya no existe.',
  solicitud_expirada: 'La solicitud venció. Pedila de nuevo.',
  solicitud_no_pendiente: 'Esta solicitud ya fue respondida.',
  no_es_familia: 'Solo la familia puede responder esta solicitud.',
  accion_invalida: 'Acción inválida.',
  sin_familia: 'No tenés una familia activa.',
  familia_ambigua: 'Tenés más de una familia; no pudimos elegir una sola.',
  especie_invalida: 'La especie no es válida.',
  datos_invalidos: 'Revisá los datos.',
};

function fallo<T>(error: { code?: string; message: string }): ResultadoWrapper<T, CodigoErrorSolicitud> {
  const raw = error.message;
  if (raw.startsWith('auth_required')) return { ok: false, codigo: 'acceso_denegado', mensaje: MENSAJES_SOLICITUD.acceso_denegado };
  for (const c of CODIGOS_SOLICITUD) if (raw.startsWith(c)) return { ok: false, codigo: c, mensaje: MENSAJES_SOLICITUD[c] };
  return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_SOLICITUD.datos_invalidos };
}

export interface CrearSolicitudInput {
  cuentaComercialId: string;
  tipo: TipoSolicitud;
  /** tipo='atencion': la mascota existente. */
  mascotaId?: string | null;
  /** tipo='alta_mascota': el cliente registrado hallado por la búsqueda. */
  destinoUserId?: string | null;
  /** tipo='alta_mascota': los datos del alta mínima. */
  payloadAlta?: PayloadAlta | null;
  countryCode?: string;
}

/** Lado prestador: emite la solicitud de autorización (10' perezosa). */
export async function crearSolicitudAutorizacion(
  input: CrearSolicitudInput,
): Promise<ResultadoWrapper<string, CodigoErrorSolicitud>> {
  const { data, error } = await getClient().rpc('crear_solicitud_autorizacion', {
    p_cuenta_comercial_id: input.cuentaComercialId,
    p_tipo: input.tipo,
    p_mascota_id: input.mascotaId ?? undefined,
    p_destino_user_id: input.destinoUserId ?? undefined,
    p_payload_alta: input.payloadAlta ?? undefined,
    p_country_code: input.countryCode ?? 'EC',
  });
  if (error) return fallo(error);
  const id = str(data);
  if (id === null) return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_SOLICITUD.datos_invalidos };
  return { ok: true, data: id };
}

export interface RespuestaSolicitud {
  estado: 'autorizada' | 'rechazada';
  tipo: TipoSolicitud;
  /** Presente al autorizar: la mascota (existente o recién nacida). */
  mascotaId: string | null;
}

/** Lado dueño: autoriza o rechaza. Al autorizar 'alta_mascota' nace la
 *  mascota en la familia real + el acceso, en una transacción. */
export async function responderSolicitudAutorizacion(
  solicitudId: string,
  accion: AccionSolicitud,
): Promise<ResultadoWrapper<RespuestaSolicitud, CodigoErrorSolicitud>> {
  const { data, error } = await getClient().rpc('responder_solicitud_autorizacion', {
    p_solicitud_id: solicitudId,
    p_accion: accion,
  });
  if (error) return fallo(error);
  if (!esObj(data) || data['ok'] !== true) {
    return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_SOLICITUD.datos_invalidos };
  }
  const estado = data['estado'];
  const tipo = data['tipo'];
  if ((estado !== 'autorizada' && estado !== 'rechazada') || (tipo !== 'atencion' && tipo !== 'alta_mascota')) {
    return { ok: false, codigo: 'datos_invalidos', mensaje: MENSAJES_SOLICITUD.datos_invalidos };
  }
  return { ok: true, data: { estado, tipo, mascotaId: str(data['mascota_id']) } };
}

// ── Lado dueño: las solicitudes que esperan mi respuesta ─────────────────────

export interface SolicitudPendiente {
  solicitudId: string;
  tipo: TipoSolicitud;
  mascotaId: string | null;
  /** Nombre de la mascota (existente) o el propuesto en el alta. */
  mascotaNombre: string | null;
  negocioNombre: string | null;
  expiraEn: string;
}

/** Las solicitudes pendientes vigentes que me tocan (familia o destino). */
export async function obtenerSolicitudesPendientesDueno(): Promise<
  ResultadoWrapper<SolicitudPendiente[], CodigoErrorSolicitud>
> {
  const { data, error } = await getClient()
    .rpc('obtener_solicitudes_pendientes_dueno')
    .returns<Record<string, unknown>[]>();
  if (error) return fallo(error);
  const filas = Array.isArray(data) ? data : [];
  return {
    ok: true,
    data: filas.filter(esObj).map((f) => ({
      solicitudId: String(f['solicitud_id']),
      tipo: (f['tipo'] === 'alta_mascota' ? 'alta_mascota' : 'atencion') as TipoSolicitud,
      mascotaId: str(f['mascota_id']),
      mascotaNombre: str(f['mascota_nombre']),
      negocioNombre: str(f['negocio_nombre']),
      expiraEn: String(f['expira_en'] ?? ''),
    })),
  };
}
