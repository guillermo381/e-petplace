// Lectura del ledger propio — S54-B (peldaño 1 de liquidaciones en Negocio,
// DISEÑO_EXPERIENCIA §13 Zona 4: "el que trabaja ve lo que va a cobrar").
// SOLO LECTURA por RLS relevada (owner_select_own_eventos: el owner de la
// cuenta comercial ve sus eventos; cuenta_comercial_id IS NOT NULL).
// Verdad firme (test 8): SOLO estado='pendiente_liquidar' — lo reversado,
// en disputa o ya liquidado no cuenta acá.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { Json } from '../database.types';

const MENSAJES = {
  sin_sesion:           'No hay sesión activa.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorEventosEconomicos = 'sin_sesion';

export interface ResumenPendienteLiquidar {
  /** Cantidad de eventos económicos esperando liquidación. 0 = peldaño 0. */
  cantidad: number;
  /** Suma de monto_payout pendiente (lo que el prestador va a cobrar). */
  montoPayout: number;
  /** Moneda de los eventos (una cuenta = un país = una moneda). null sin eventos. */
  moneda: string | null;
}

/** Lo cobrado esperando liquidación, de la cuenta comercial propia. */
export async function obtenerResumenPendienteLiquidar(): Promise<
  ResultadoWrapper<ResumenPendienteLiquidar, CodigoErrorEventosEconomicos>
> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) {
    return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  }

  const { data, error } = await getClient()
    .from('eventos_economicos')
    .select('monto_payout, moneda')
    .eq('estado', 'pendiente_liquidar');

  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }

  let montoPayout = 0;
  for (const fila of data) {
    montoPayout += fila.monto_payout ?? 0;
  }

  return {
    ok: true,
    data: {
      cantidad: data.length,
      montoPayout,
      moneda: data.length > 0 ? data[0].moneda : null,
    },
  };
}

// ── S55-B (B1): el DESGLOSE del ledger propio — vista de Liquidaciones v1.
// Lee v_eventos_con_origen (security_invoker relevado S55: la RLS de
// eventos_economicos Y la de la tabla origen son la puerta; grants solo
// authenticated). Verdad firme intacta: SOLO estado='pendiente_liquidar'.

export interface EventoPendienteLiquidar {
  id: string;
  /** tipo_evento del ledger (ej. 'cita_pagada'). La voz humana es de la pantalla. */
  tipoEvento: string;
  montoBruto: number;
  montoPlataforma: number;
  /** Lo que el prestador va a cobrar por este evento. null = el ledger no lo trae (L-124). */
  montoPayout: number | null;
  moneda: string;
  /** ISO — el momento del devengo (el cierre con calidad, Decisión R). */
  fechaDevengo: string;
  /** metadata.pago_simulado=true — la superficie DEBE declararlo (regla de la tanda). */
  pagoSimulado: boolean;
  /** tipo_servicio de la cita origen si es parseable ('paseo', …). null sin dato. */
  tipoServicio: string | null;
}

function leerPagoSimulado(metadata: Json | null): boolean {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    !Array.isArray(metadata) &&
    metadata['pago_simulado'] === true
  );
}

function leerTipoServicio(origenData: Json | null): string | null {
  if (typeof origenData !== 'object' || origenData === null || Array.isArray(origenData)) return null;
  const v = origenData['tipo_servicio'];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** Cada evento propio esperando liquidación, del más reciente al más viejo. */
export async function obtenerDesglosePendienteLiquidar(): Promise<
  ResultadoWrapper<EventoPendienteLiquidar[], CodigoErrorEventosEconomicos>
> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) {
    return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  }

  const { data, error } = await getClient()
    .from('v_eventos_con_origen')
    .select('id, tipo_evento, monto_bruto, monto_plataforma, monto_payout, moneda, fecha_devengo, metadata, origen_data')
    .eq('estado', 'pendiente_liquidar')
    .order('fecha_devengo', { ascending: false });

  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }

  const eventos: EventoPendienteLiquidar[] = [];
  for (const fila of data) {
    // guard de shape (L-124): las claves duras del ledger vienen NOT NULL
    // por schema; si la vista devolviera otra cosa, es inconsistencia, no vacío
    if (
      typeof fila.id !== 'string' ||
      typeof fila.tipo_evento !== 'string' ||
      typeof fila.monto_bruto !== 'number' ||
      typeof fila.monto_plataforma !== 'number' ||
      typeof fila.moneda !== 'string' ||
      typeof fila.fecha_devengo !== 'string'
    ) {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
    }
    eventos.push({
      id: fila.id,
      tipoEvento: fila.tipo_evento,
      montoBruto: fila.monto_bruto,
      montoPlataforma: fila.monto_plataforma,
      montoPayout: typeof fila.monto_payout === 'number' ? fila.monto_payout : null,
      moneda: fila.moneda,
      fechaDevengo: fila.fecha_devengo,
      pagoSimulado: leerPagoSimulado(fila.metadata),
      tipoServicio: leerTipoServicio(fila.origen_data),
    });
  }

  return { ok: true, data: eventos };
}
