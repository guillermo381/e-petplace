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
 * Pagar una COMPRA con el saldo del hogar. Simétrico con el riel de tarjeta, que
 * cobra la compra (N pedidos, uno por tienda) y NO el pedido suelto (S114-A ① v2,
 * hallazgo de C: cobrar por pedido dejaba un cobro parcial con dos tiendas).
 *
 * El motor (`pagar_compra_con_saldo`) es TODO O NADA: verifica dueño + reserva de
 * todos los pedidos ANTES de tocar plata, consume el saldo una vez por
 * `compras.total`, marca los N pedidos + la compra, y si algo falla la
 * transacción entera se deshace — cero cobro parcial. La superficie la monta C.
 *
 * 🔴 `saldo_insuficiente` TRAE `saldo` y `total` para que la pantalla diga «te
 * faltan $X» — la promesa del comentario ahora la cumple el return.
 */
export type PagoConSaldo = { pagadoCon: 'saldo'; saldoRestante: number; duplicado: boolean };

export type CodigoPagoSaldo =
  | 'sin_sesion' | 'compra_no_existe' | 'no_es_tuya' | 'compra_no_pagable'
  | 'pago_sin_reserva' | 'sin_familia' | 'saldo_insuficiente' | 'error';

/** El error de saldo insuficiente lleva los números; el resto, sólo su código. */
export type ErrorPagoSaldo =
  | { ok: false; codigo: 'saldo_insuficiente'; mensaje: string; saldo: number; total: number }
  | { ok: false; codigo: Exclude<CodigoPagoSaldo, 'saldo_insuficiente'>; mensaje: string };

export async function pagarCompraConSaldo(
  compraId: string,
): Promise<{ ok: true; data: PagoConSaldo } | ErrorPagoSaldo> {
  const cli = getClient();
  const { data, error } = await cli.rpc('pagar_compra_con_saldo', { p_compra_id: compraId });
  if (error) return { ok: false, codigo: 'error', mensaje: ERR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object') return { ok: false, codigo: 'error', mensaje: ERR };

  if (o.ok !== true) {
    const CODES = ['sin_sesion','compra_no_existe','no_es_tuya','compra_no_pagable',
                   'pago_sin_reserva','sin_familia','saldo_insuficiente'] as const;
    const raw = typeof o.codigo === 'string' ? o.codigo : 'error';
    const cod: CodigoPagoSaldo = (CODES as readonly string[]).includes(raw)
      ? (raw as CodigoPagoSaldo) : 'error';
    if (cod === 'saldo_insuficiente') {
      // Los números para «te faltan $X». La pantalla decide qué decir con ellos.
      return {
        ok: false, codigo: 'saldo_insuficiente', mensaje: ERR,
        saldo: Number(o.saldo ?? 0), total: Number(o.total ?? 0),
      };
    }
    return { ok: false, codigo: cod, mensaje: ERR };
  }

  return {
    ok: true,
    data: {
      pagadoCon: 'saldo',
      saldoRestante: Number(o.saldo_restante ?? 0),
      duplicado: o.duplicado === true,
    },
  };
}
