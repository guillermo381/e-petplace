// Liquidaciones propias, solo lectura — S55-B (B1: vista de Liquidaciones v1,
// RUTA 3.1.D / peldaño 2 de Cobros en Negocio).
// RLS relevada S55: owner_select_own_liquidaciones (el owner de la cuenta
// comercial ve las suyas; admin todo vía is_admin). SOLO SELECT — generar,
// aprobar y pagar liquidaciones es del admin (MODELO_FINANCIERO §7.2).

import { getClient } from '../client';
import type { Database } from '../database.types';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:        'No hay sesión activa.',
  error_desconocido: 'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorLiquidaciones = 'sin_sesion';

export type EstadoLiquidacion = Database['public']['Enums']['estado_liquidacion_enum'];

export interface LiquidacionPropia {
  id: string;
  /** Número legible de la liquidación (para conversaciones con el equipo). */
  numeroLiquidacion: string;
  /** ISO — inicio y fin del período consolidado. */
  periodoInicio: string;
  periodoFin: string;
  /** Lo que la plataforma transfiere (payout − ajustes − retenciones). */
  montoNetoAPagar: number;
  moneda: string;
  /** Estado REAL del enum — la voz humana es de la pantalla. */
  estado: EstadoLiquidacion;
  /** ISO cuando ya se pagó; null honesto mientras no. */
  pagadoEn: string | null;
  eventosCount: number;
}

/** Las liquidaciones de la cuenta comercial propia, de la más reciente a la más vieja. */
export async function obtenerMisLiquidaciones(): Promise<
  ResultadoWrapper<LiquidacionPropia[], CodigoErrorLiquidaciones>
> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) {
    return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  }

  const { data, error } = await getClient()
    .from('liquidaciones')
    .select('id, numero_liquidacion, periodo_inicio, periodo_fin, monto_neto_a_pagar, moneda, estado, pagado_en, eventos_count')
    .order('periodo_fin', { ascending: false });

  if (error || !Array.isArray(data)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  return {
    ok: true,
    data: data.map((fila) => ({
      id: fila.id,
      numeroLiquidacion: fila.numero_liquidacion,
      periodoInicio: fila.periodo_inicio,
      periodoFin: fila.periodo_fin,
      montoNetoAPagar: fila.monto_neto_a_pagar,
      moneda: fila.moneda,
      estado: fila.estado,
      pagadoEn: fila.pagado_en,
      eventosCount: fila.eventos_count,
    })),
  };
}
