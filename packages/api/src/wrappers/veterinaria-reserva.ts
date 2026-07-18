// LA RESERVA VET del lado DUEÑO (S68-A2, V2 del esqueleto vet —
// MODELO_VETERINARIA §6/§17 sobre el chasis del grooming SIN talla).
// Patrón canónico del monorepo (ver agendamiento.ts / grooming-reserva.ts):
// códigos tipados + normalización por prefijo (L-115) + guards de shape
// contra el RETURNS real de la migración 20260717210000 (L-124) +
// ResultadoWrapper discriminated union.
//
// Decisiones que este archivo implementa:
// - El QUÉ son los tipos del catálogo maestro (consulta_general,
//   vacunacion, urgencia_*) con el "desde" agregado server-side —
//   telemedicina y emergencia existen pero nacen reservable=false: el
//   motor las deja fuera SOLO (la UI jamás las filtra por lista).
// - reserva_solo_hoy viaja en la oferta: la UI de urgencia fija el día
//   en HOY; la ley dura vive en crear_bloqueo_agenda (urgencia_solo_hoy).
// - El hold y el pago son los del chasis compartido: crearBloqueoAgenda
//   y confirmarCitaPagada de agendamiento.ts se consumen TAL CUAL (los
//   códigos S68 servicio_no_reservable / urgencia_solo_hoy ya viven ahí).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── Códigos de error (verificados contra los RAISE de cada body) ────────────

const CODIGOS_ERROR_VET_RESERVA = [
  'acceso_denegado',
  // §1bis: el techo de especie del tipo manda desde la DB.
  'mascota_no_elegible',
  'servicio_invalido',
  // S68: el tipo existe pero no se reserva por la app (telemedicina camino
  // (c) / emergencia honesta) — rebote tipado, no disfraz de inexistente.
  'servicio_no_reservable',
  'slot_invalido',
] as const;

export type CodigoErrorVetReserva = (typeof CODIGOS_ERROR_VET_RESERVA)[number];

const MENSAJES: Record<
  CodigoErrorVetReserva | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:        'No tienes acceso para hacer esto.',
  mascota_no_elegible:    'Este servicio todavía no está disponible para esta mascota.',
  servicio_invalido:      'Este servicio ya no está disponible.',
  servicio_no_reservable: 'Este servicio todavía no se puede reservar por la app.',
  slot_invalido:          'El horario elegido no es válido.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Prueba de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorVetReserva | 'error_desconocido' {
  if (raw === 'auth_required' || raw.startsWith('no_access_to_mascota')) {
    return 'acceso_denegado';
  }
  if (raw.startsWith('ventana_invalida')) return 'slot_invalido';
  // Códigos con sufijo ': <detalle>' — normalizar por prefijo (L-115).
  for (const codigo of CODIGOS_ERROR_VET_RESERVA) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function fallo<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorVetReserva> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

type Obj = Record<string, unknown>;

function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

// ── A · La oferta reservable para SU mascota (los chips del QUÉ) ────────────

export interface OfertaVet {
  /** consulta_general | vacunacion | urgencia_local | urgencia_domicilio. */
  tipo_servicio: string;
  /** Voz canónica del catálogo maestro (no la custom por vet). */
  servicio_nombre: string;
  /** Mínimo REAL entre vets cobrables. El server congela al reservar. */
  desde_precio: number;
  /** true = hay más de un precio entre vets → la UI dice "desde". */
  varia: boolean;
  /** S68: true = urgencia — solo se reserva para HOY (la UI fija el día;
   *  el guard del motor es la ley). */
  reserva_solo_hoy: boolean;
}

/** Los tipos del mundo vet realmente ofertados HOY por vets cobrables
 *  (7.13) y RESERVABLES (S68, dos niveles), con el "desde" agregado. */
export async function obtenerOfertaVet(
  mascotaId: string,
): Promise<ResultadoWrapper<OfertaVet[], CodigoErrorVetReserva>> {
  const { data, error } = await getClient().rpc('obtener_oferta_vet', {
    p_mascota_id: mascotaId,
  });

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  const ofertas: OfertaVet[] = [];
  for (const fila of data) {
    if (
      !esObj(fila) ||
      typeof fila.tipo_servicio !== 'string' ||
      typeof fila.servicio_nombre !== 'string' ||
      typeof fila.desde_precio !== 'number' ||
      typeof fila.varia !== 'boolean' ||
      typeof fila.reserva_solo_hoy !== 'boolean'
    ) {
      return fallo('datos_inconsistentes');
    }
    ofertas.push({
      tipo_servicio: fila.tipo_servicio,
      servicio_nombre: fila.servicio_nombre,
      desde_precio: fila.desde_precio,
      varia: fila.varia,
      reserva_solo_hoy: fila.reserva_solo_hoy,
    });
  }
  return { ok: true, data: ofertas };
}

// ── B · Inicios disponibles para la grilla del CUÁNDO ───────────────────────
// La duración NO viaja: cada vet aporta inicios con SU duración de la
// oferta (motor de ventana intacto).

export interface InputIniciosVet {
  /** 'YYYY-MM-DD'. */
  fecha: string;
  tipo_servicio: string;
  mascota_id: string;
}

/** Horas de inicio 'HH:MM' donde ALGÚN vet puede la ventana entera.
 *  Urgencia con fecha ≠ hoy devuelve vacío (cinturón del motor). */
export async function obtenerIniciosVet(
  input: InputIniciosVet,
): Promise<ResultadoWrapper<string[], CodigoErrorVetReserva>> {
  const { data, error } = await getClient().rpc('obtener_inicios_vet_disponibles', {
    p_fecha: input.fecha,
    p_tipo_servicio: input.tipo_servicio,
    p_mascota_id: input.mascota_id,
  });

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  const horas: string[] = [];
  for (const fila of data) {
    if (!esObj(fila) || typeof fila.hora !== 'string') {
      return fallo('datos_inconsistentes');
    }
    horas.push(fila.hora.slice(0, 5));
  }
  return { ok: true, data: horas };
}

// ── C · El QUIÉN con el precio resuelto server-side ─────────────────────────

export interface VeterinarioDisponible {
  prestador_id: string;
  /** prestador_servicios.id — el identificador de la OFERTA para el hold. */
  prestador_servicio_id: string;
  prestador_nombre: string;
  servicio_nombre: string;
  /** El precio de la oferta — el checkout muestra el snapshot del hold. */
  precio: number;
  /** La duración de la oferta del vet — consecuencia, jamás menú. */
  duracion_minutos: number;
  /** El DÓNDE: dirección de la clínica, o null honesto sin declarar. */
  direccion: string | null;
  ciudad: string | null;
}

export interface InputVeterinariosDisponibles {
  /** 'YYYY-MM-DD'. */
  fecha: string;
  /** 'HH:MM' — un inicio de la grilla. */
  hora: string;
  tipo_servicio: string;
  mascota_id: string;
}

/** Vets cobrables que pueden la ventana entera en ese inicio, con
 *  precio/duración de su oferta y el dónde de su clínica. */
export async function obtenerVeterinariosDisponibles(
  input: InputVeterinariosDisponibles,
): Promise<ResultadoWrapper<VeterinarioDisponible[], CodigoErrorVetReserva>> {
  const { data, error } = await getClient().rpc('obtener_veterinarios_disponibles', {
    p_fecha: input.fecha,
    p_hora: input.hora,
    p_tipo_servicio: input.tipo_servicio,
    p_mascota_id: input.mascota_id,
  });

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  const vets: VeterinarioDisponible[] = [];
  for (const fila of data) {
    if (
      !esObj(fila) ||
      typeof fila.prestador_id !== 'string' ||
      typeof fila.prestador_servicio_id !== 'string' ||
      typeof fila.prestador_nombre !== 'string' ||
      typeof fila.servicio_nombre !== 'string' ||
      typeof fila.precio !== 'number' ||
      typeof fila.duracion_minutos !== 'number'
    ) {
      return fallo('datos_inconsistentes');
    }
    vets.push({
      prestador_id: fila.prestador_id,
      prestador_servicio_id: fila.prestador_servicio_id,
      prestador_nombre: fila.prestador_nombre,
      servicio_nombre: fila.servicio_nombre,
      precio: fila.precio,
      duracion_minutos: fila.duracion_minutos,
      direccion: typeof fila.direccion === 'string' && fila.direccion.length > 0 ? fila.direccion : null,
      ciudad: typeof fila.ciudad === 'string' && fila.ciudad.length > 0 ? fila.ciudad : null,
    });
  }
  return { ok: true, data: vets };
}
