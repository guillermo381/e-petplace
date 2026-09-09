// ═══════════════════════════════════════════════════════════════════════════
// S114-A · A4 · F6 · El saldo e-PetPlace — la lectura para la familia.
//
// Es un PASIVO del ledger, DEL HOGAR (§7). Se ACREDITA sólo por el motor y se
// CONSUME FIFO al pagar; ninguna app lo escribe. Por eso acá hay UN lector y
// cero escritor: acreditar y consumir son funciones del motor sin EXECUTE para
// `authenticated` (D-314).
// ═══════════════════════════════════════════════════════════════════════════

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const ERR = 'No pudimos leer tu saldo. Prueba de nuevo.';

/**
 * El saldo disponible del hogar del usuario en sesión.
 *
 * Es un número DERIVADO de la suma de movimientos, no un total materializado —
 * así no puede divergir de sus movimientos (la lección del ledger de S95).
 */
export async function obtenerMiSaldo(): Promise<ResultadoWrapper<number, 'error_lectura' | 'sin_familia'>> {
  const cli = getClient();
  const uid = (await cli.auth.getUser()).data.user?.id;
  if (!uid) return { ok: false, codigo: 'sin_familia', mensaje: ERR };
  const { data: fam, error: eF } = await cli.rpc('_familia_del_user', { p_user: uid });
  if (eF) return { ok: false, codigo: 'error_lectura', mensaje: ERR };
  if (!fam) return { ok: false, codigo: 'sin_familia', mensaje: ERR };
  const { data, error } = await cli.rpc('saldo_hogar_disponible', { p_familia: fam });
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: ERR };
  return { ok: true, data: Number(data ?? 0) };
}

/**
 * Aplicar el saldo del hogar a una COMPRA (pago mixto). Simétrico con el riel de
 * tarjeta, que cobra la COMPRA (N pedidos, uno por tienda) y no el pedido suelto.
 *
 * FIRMA DEL FOUNDER (S114-A): el saldo es PARCIAL + RIEL. Si la familia tiene $13
 * y el pedido son $20, aplica $13 de saldo y el riel cobra $7. El saldo se
 * consume DESPUÉS de que el riel confirma (lo hace confirmar_pago_compra). La
 * atomicidad no se relaja: todo o nada sobre los N pedidos.
 *
 * Tres resultados, y C ramifica sobre `modo`:
 *  · 'pagado'   — el saldo cubrió TODO: la compra ya está pagada, no va al riel.
 *  · 'mixto'    — reservó `saldoAplicado`; falta cobrar `restoACobrar` por el riel
 *                 (pagos-cobro lee compras.saldo_aplicado y cobra la diferencia).
 *  · 'sin_saldo'— no había saldo (o pediste 0): el riel cobra `restoACobrar` = total.
 *
 * Para el riel, C llama a pagos-cobro con la compra IGUAL que hoy: el edge ya sabe
 * cobrar total − saldo_aplicado. No hay `saldo_insuficiente`: el mixto aplica lo
 * que haya y el riel cubre el resto.
 *
 * `p_monto_saldo` opcional: cuánto saldo aplicar (capado por lo disponible y el
 * total). Sin él, aplica todo lo que alcance hasta el total.
 *
 * REEMPLAZA a pagar_compra_con_saldo (una cosa, una puerta).
 */
export type ResultadoSaldoACompra =
  | { modo: 'pagado'; saldoAplicado: number; saldoRestante: number; duplicado: boolean }
  | { modo: 'mixto'; saldoAplicado: number; restoACobrar: number; saldoRestante: number }
  | { modo: 'sin_saldo'; restoACobrar: number; saldoRestante: number };

export type CodigoSaldoACompra =
  | 'sin_sesion' | 'compra_no_existe' | 'no_es_tuya' | 'compra_no_pagable'
  | 'pago_sin_reserva' | 'sin_familia' | 'error';

export async function aplicarSaldoACompra(
  compraId: string,
  montoSaldo?: number,
): Promise<
  | { ok: true; data: ResultadoSaldoACompra }
  | { ok: false; codigo: CodigoSaldoACompra; mensaje: string }
> {
  const cli = getClient();
  const { data, error } = await cli.rpc('aplicar_saldo_a_compra', {
    p_compra_id: compraId,
    ...(montoSaldo != null ? { p_monto_saldo: montoSaldo } : {}),
  });
  if (error) return { ok: false, codigo: 'error', mensaje: ERR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object') return { ok: false, codigo: 'error', mensaje: ERR };

  if (o.ok !== true) {
    const CODES = ['sin_sesion','compra_no_existe','no_es_tuya','compra_no_pagable',
                   'pago_sin_reserva','sin_familia'] as const;
    const raw = typeof o.codigo === 'string' ? o.codigo : 'error';
    const cod: CodigoSaldoACompra = (CODES as readonly string[]).includes(raw)
      ? (raw as CodigoSaldoACompra) : 'error';
    return { ok: false, codigo: cod, mensaje: ERR };
  }

  const saldoAplicado = Number(o.saldo_aplicado ?? 0);
  const restoACobrar = Number(o.resto_a_cobrar ?? 0);
  const saldoRestante = Number(o.saldo_restante ?? 0);

  // pagado_con:'saldo' ⇒ el saldo cubrió todo (no va al riel).
  if (o.pagado_con === 'saldo') {
    return {
      ok: true,
      data: { modo: 'pagado', saldoAplicado, saldoRestante, duplicado: o.duplicado === true },
    };
  }
  // requiere_riel ⇒ falta cobrar por tarjeta. Con saldo aplicado es 'mixto';
  // sin saldo aplicado es 'sin_saldo' (el riel cobra el total).
  if (saldoAplicado > 0) {
    return { ok: true, data: { modo: 'mixto', saldoAplicado, restoACobrar, saldoRestante } };
  }
  return { ok: true, data: { modo: 'sin_saldo', restoACobrar, saldoRestante } };
}
