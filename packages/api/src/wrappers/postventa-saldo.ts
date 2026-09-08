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
