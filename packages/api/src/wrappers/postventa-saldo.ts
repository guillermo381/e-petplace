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
 * Pagar un pedido con el saldo del hogar. La superficie del checkout la monta C;
 * ésta es la puerta al motor (`pagar_pedido_con_saldo`, S114-A ①).
 *
 * El motor: verifica que el pedido sea tuyo, que tenga stock reservado, que el
 * saldo alcance, CONSUME el saldo (idempotente por clave: un doble toque no
 * descuenta dos veces) y marca el pedido pagado por el mismo camino que el
 * webhook (`pago_capturado`). `saldo_insuficiente` trae `saldo` y `total` para
 * que la pantalla diga cuánto falta.
 */
export type PagoConSaldo = { pagadoCon: 'saldo'; saldoRestante: number; duplicado: boolean };

export async function pagarPedidoConSaldo(
  pedidoId: string,
): Promise<
  ResultadoWrapper<
    PagoConSaldo,
    'sin_sesion' | 'pedido_no_existe' | 'no_es_tuyo' | 'pago_sin_reserva' | 'sin_familia' | 'saldo_insuficiente' | 'error'
  >
> {
  const cli = getClient();
  const { data, error } = await cli.rpc('pagar_pedido_con_saldo', { p_pedido_id: pedidoId });
  if (error) return { ok: false, codigo: 'error', mensaje: ERR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object') return { ok: false, codigo: 'error', mensaje: ERR };
  if (o.ok !== true) {
    const c = typeof o.codigo === 'string' ? o.codigo : 'error';
    const cod = (['sin_sesion','pedido_no_existe','no_es_tuyo','pago_sin_reserva','sin_familia','saldo_insuficiente'] as const)
      .includes(c as never) ? (c as 'sin_sesion') : 'error';
    // saldo_insuficiente trae saldo/total: la pantalla decide qué decir con eso.
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
