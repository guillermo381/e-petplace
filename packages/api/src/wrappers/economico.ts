// ECONÓMICO — la tarifa de servicio y la comisión, para el checkout y el taller de precio.
// Letra: MODELO_ECONOMICO v1.1 · D-A, D-B, D-D.
//
// 🔴 NINGÚN PORCENTAJE, NINGÚN MÍNIMO Y NINGUNA FECHA VIVEN ACÁ. Todo se le pregunta al
// motor, que resuelve de `fee_configs` por vigencia. *El día que la comisión cambie, la
// pantalla dice la verdad sola — que es exactamente lo que la regla del §891 del modelo
// financiero pide desde S56.*

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export interface TarifaServicio {
  /** Lo que se COBRA. En promoción es 0 — y la línea SE MUESTRA igual. */
  base: number;
  /** Lo que se regala. Se muestra tachado o como descuento; nunca se esconde. */
  descuento: number;
  montoLista: number;
  codigoIva: string;
  tarifaPct: number;
  valorIva: number;
  promocionada: boolean;
}

export interface ComisionAplicable {
  /** La fecha con la que se preguntó. Se devuelve para que la pantalla pueda decirla. */
  fechaConsultada: string;
  pct: number;
  minimo: number;
  base: 'subtotal' | 'total_con_impuesto' | string;
  comisionLlevaIva: boolean;
  codigoIva: string | null;
  tarifaIvaPct: number | null;
  categoria: string;
}

export type CodigoEconomico =
  | 'sin_configuracion' | 'sin_tarifa_iva_vigente'
  | 'prestador_sin_cuenta_comercial' | 'tipo_servicio_no_existe'
  | 'sin_fee_vigente_para_esa_fecha' | 'no_se_pudo';

const fallo = (codigo: CodigoEconomico, mensaje: string): ResultadoWrapper<never> =>
  ({ ok: false, codigo, mensaje });

/**
 * La tarifa de servicio a la familia, para una fecha.
 *
 * 🔴 EN PROMOCIÓN DEVUELVE `base: 0` CON SU `descuento`, y la línea igual se dibuja.
 * *Una línea que se esconde mientras vale cero hay que construirla el día que se cobra,
 * y ese día el usuario ve aparecer un cargo que nunca estuvo.*
 */
export async function tarifaServicio(
  fecha?: string,
): Promise<ResultadoWrapper<TarifaServicio>> {
  const { data, error } = await getClient().rpc('tarifa_servicio_vigente',
    fecha ? { p_fecha: fecha } : {});
  if (error) return fallo('no_se_pudo', 'No pudimos leer la tarifa de servicio.');
  const d = (data ?? {}) as Record<string, unknown>;
  if (!d.vigente) {
    return fallo((d.motivo as CodigoEconomico) ?? 'no_se_pudo',
      'La tarifa de servicio no está configurada.');
  }
  return {
    ok: true,
    data: {
      base: Number(d.base), descuento: Number(d.descuento),
      montoLista: Number(d.monto_lista), codigoIva: String(d.codigo_iva),
      tarifaPct: Number(d.tarifa_pct), valorIva: Number(d.valor_iva),
      promocionada: Boolean(d.promocionada),
    },
  };
}

/**
 * Lo que el prestador va a recibir — **para la fecha en que su precio vaya a regir**.
 *
 * 🔴 LA FECHA LA PONE QUIEN PREGUNTA, y no es un detalle: hoy la comisión resuelve 10 %
 * y desde el 1-oct 18 %. Un prestador que configura hoy un precio para operar en octubre
 * vería «recibís el 90 %» y cobraría el 82 %. **Pasá la fecha en que el precio va a
 * regir, no la de hoy.** Ninguna capa tiene esa fecha escrita: vive en la vigencia de
 * `fee_configs`.
 */
export async function comisionAplicable(args: {
  prestadorId: string; tipoServicio: string; fechaVigencia: string;
}): Promise<ResultadoWrapper<ComisionAplicable>> {
  const { data, error } = await getClient().rpc('comision_aplicable', {
    p_prestador_id: args.prestadorId,
    p_tipo_servicio: args.tipoServicio,
    p_fecha: args.fechaVigencia,
  });
  if (error) return fallo('no_se_pudo', 'No pudimos calcular tu comisión.');
  const d = (data ?? {}) as Record<string, unknown>;
  if (!d.conocida) {
    /* Fail-closed: si el motor no sabe, la pantalla NO muestra 0 %. Decirle a un
       prestador «te queda el 100 %» es la mentira más cara que puede decir. */
    return fallo((d.motivo as CodigoEconomico) ?? 'no_se_pudo',
      'No pudimos calcular tu comisión para esa fecha.');
  }
  return {
    ok: true,
    data: {
      fechaConsultada: String(d.fecha_consultada),
      pct: Number(d.pct), minimo: Number(d.minimo),
      base: String(d.base), comisionLlevaIva: Boolean(d.comision_lleva_iva),
      codigoIva: (d.codigo_iva as string) ?? null,
      tarifaIvaPct: d.tarifa_iva_pct == null ? null : Number(d.tarifa_iva_pct),
      categoria: String(d.categoria),
    },
  };
}

/**
 * Lo que el prestador RECIBE por un precio neto, en una fecha.
 *
 * 🔴 APLICA EL MÍNIMO. Sin esto la pantalla mostraría «18 %» sobre un ticket chico y
 * mentiría: un paseo de $6,00 al 18 % da $1,08, pero se cobra el mínimo de $1,50.
 * El cálculo es el MISMO que hace el motor (`comision_efectiva`), no una copia.
 */
export function netoDelPrestador(precioNeto: number, c: ComisionAplicable): {
  comision: number; aplico: 'porcentual' | 'minimo'; neto: number;
} {
  const porcentual = Math.round(precioNeto * c.pct) / 100;
  const comision = Math.max(porcentual, c.minimo);
  return {
    comision,
    aplico: porcentual >= c.minimo ? 'porcentual' : 'minimo',
    neto: Math.round((precioNeto - comision) * 100) / 100,
  };
}
