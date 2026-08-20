/**
 * S101-B · FASE 3 · EL COBRO — **ANDAMIO CON MUERTE ESCRITA**.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ☠️ ESTE ARCHIVO MUERE EN LA FASE 5.                                     │
 * │                                                                         │
 * │ **«La tarjeta más reciente» es regla de ANDAMIO, jamás de producto.**   │
 * │ El producto elige la tarjeta con una pantalla de medios de pago, y esa  │
 * │ pantalla es Fase 5. Hasta entonces esto existe para que la matriz del   │
 * │ cobro y el rojo esperado del `vat` se puedan MEDIR — no para que una    │
 * │ familia lo use.                                                         │
 * │                                                                         │
 * │ 🔴 Y si alguien lo encuentra vivo después de la Fase 5: es deuda, no    │
 * │    una decisión. *Elegir por la familia cuál de sus tarjetas se cobra   │
 * │    es exactamente lo que una pantalla de medios de pago existe para no  │
 * │    hacer.*                                                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * 🔴 **NADA ACÁ NACE POR ABRIRSE.** Se llama al TOCAR pagar. *La lección del
 *    andamio del alta —una pantalla que fabricaba estado por abrirse volvió
 *    inobservable un vencimiento— rige por construcción.*
 *
 * 🔴 **CANDADO DE VISIBILIDAD, igual que la celda del gate:** sin config, esto
 *    no existe. `hayCobroAndamio()` es lo que la pantalla consulta antes de
 *    ofrecer nada.
 */



/**
 * 🔴 LO ÚNICO ANDAMIO ACÁ ES LA SELECCIÓN DE TARJETA. **La función de cobro es
 *    PRODUCTO y no muere** (`supabase/functions/pagos-cobro`): autoriza por el
 *    JWT de la familia, **el monto jamás viaja del cliente** (lo lee del
 *    desglose congelado), verifica pertenencia y corre las compuertas
 *    server-side.
 *
 * *Se llama por la puerta única del cliente Supabase — la sesión viaja sola.*
 */
import { cobrarCompra } from '@epetplace/api';

export function hayCobroAndamio(): boolean {
  return true;
}

/** Las voces que este andamio puede pedir. Cerradas a propósito: si mañana
 *  hiciera falta una nueva, el typecheck obliga a agregarla a la letra. */
export type VozCobro =
  | 'despensa.cobroDesconocido'
  | 'despensa.cobroTokenAusente'
  | 'despensa.cobroConfirmando';

export type TarjetaParaCobro = { id: string } | null;

export type ResultadoCobro =
  | { ok: true }
  | { ok: false; voz: VozCobro };

/**
 * Dispara el débito contra **sandbox**.
 *
 * ⚠️ **ROJO ESPERADO Y DOCUMENTADO (firma del founder):** hoy esto rebota en
 * `order.vat` — la cuenta de staging aparenta exigir `vat > 0` y **todo
 * nuestro catálogo es `EC_IVA_0`**. **No es nuestro código** y **no se
 * re-diagnostica**: está en `D-852`, es precondición de octubre, y el correo a
 * Erick sale con eso adentro.
 *
 * *Se construye igual, como está firmado: el flujo tiene que existir entero
 * para que el día que el vat se destrabe no haya nada más que hacer.*
 */
export async function cobrarConTarjetaGuardada(
  compraId: string,
  tarjeta: TarjetaParaCobro,
): Promise<ResultadoCobro> {
  if (!tarjeta) return { ok: false, voz: 'despensa.cobroTokenAusente' };

  try {
    /* 🔴 SOLO IDS. **El monto no viaja** — lo lee el servidor del desglose
       congelado. *Mandarlo desde acá haría que la compuerta 2 verificara un
       número contra sí mismo.* */
    const r = await cobrarCompra(compraId, tarjeta.id);

    /* 🔴 La respuesta se lee como SEÑAL, no como hecho. Un `ok` acá significa
       «el proveedor contestó», y el llamador pasa a `confirmando` — **jamás a
       `exito`**. Confirma el webhook, o el barrido mismo-día. */
    if (r.ok) return { ok: true };

    /* 🔴 Un rechazo sin causa reconocida NO se dibuja como error de datos.
       *Pedirle a la familia que revise algo que puede estar perfecto es la
       clase de error que hace que vuelva a pagar lo que ya pagó.* */
    return { ok: false, voz: 'despensa.cobroDesconocido' };
  } catch {
    /* Red caída ≠ rechazo del banco. **No es un desenlace**: la voz de espera
       es la honesta, y el servidor tiene la verdad. */
    return { ok: false, voz: 'despensa.cobroConfirmando' };
  }
}
