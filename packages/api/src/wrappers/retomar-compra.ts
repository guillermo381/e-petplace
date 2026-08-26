/**
 * S105-A · RETOMAR LA COMPRA — el pago que quedó a medias.
 *
 * **Por qué existe, con el número medido:** 37 compras abandonadas vivas con
 * **$4.617,92 detenidos**. No es una comodidad de producto — *es plata que hoy
 * nadie puede completar.*
 *
 * 🔴 **Y lo que las frenaba NO era el intento vencido**, que es lo que todos
 * suponíamos: corrida la compuerta real sobre las 37, **36 cortan en
 * `1_reserva_vencida`** y ninguna por el intento. *El botón «pagar» no nacía
 * muerto por `D-913`: nacía muerto por el stock* — y esa compuerta no es un
 * defecto, es el inventario diciendo la verdad.
 *
 * ⚠️ **ESTE WRAPPER NACE CON SU MOTOR, EN LA MISMA TANDA, Y ESO NO ES
 * CASUALIDAD:** dos veces en un solo día se entregó motor sin puerta (el `uid`
 * y el lector de cita), y la casa tiene **cero llamadas `.rpc()` directas**, así
 * que sin wrapper una función no existe para nadie. *El contrato de una pieza
 * de motor incluye su puerta.*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type CodigoRetomarCompra =
  | 'sin_sesion'
  /** Ambiguo a propósito: «no existe» y «es de otro» dan este mismo código. */
  | 'compra_no_existe'
  | 'compra_no_retomable'
  /**
   * 🔴 Un ítem ya no está. **La compra NO se retoma a medias** — *una compra
   * que se completa sin uno de sus productos es una compra distinta de la que
   * la familia dejó, y nadie se lo dijo.* Viene con `faltantes`.
   */
  | 'producto_no_disponible'
  /**
   * No se pudo re-apartar el stock. **Re-apartar es parte del acto de
   * retomar**, no un paso posterior: si falla, la compra queda como estaba.
   */
  | 'stock_insuficiente';

export type ItemFaltante = {
  itemId: string;
  producto: string | null;
  razon: 'sin_oferta' | 'retirado' | 'sin_stock' | 'no_publicada';
};

export type AjustePrecio = {
  producto: string | null;
  /** Lo que se le prometió el día que armó la compra. */
  antes: number;
  /** Lo que vale hoy — y lo que se le va a cobrar. */
  ahora: number;
};

export type CompraRetomada = {
  compraId: string;
  /** `false` con `ok:true` sólo en `ya_pagada`. */
  retomada: boolean;
  /** El total que se va a cobrar, ya re-congelado. */
  total: number;
  /**
   * 🔴 **VIAJAN PARA QUE LA PANTALLA LOS DIGA** — firma del founder: *el precio
   * menor «se dice en pantalla»*. Si no se mostraran, la familia vería un total
   * distinto del que dejó **sin explicación**, y eso se lee peor que el precio
   * viejo.
   */
  ajustesDePrecio: AjustePrecio[];
  bajoDePrecio: boolean;
};

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

const CODIGOS: readonly string[] = [
  'sin_sesion', 'compra_no_existe', 'compra_no_retomable',
  'producto_no_disponible', 'stock_insuficiente',
];

/**
 * Retoma una compra abandonada.
 *
 * **El precio: el menor de los dos.** *Nunca cobramos más de lo que el producto
 * vale hoy; si bajó, la persona se entera de algo bueno.* El precio original
 * no se pierde — queda en `pedido_items.precio_unitario_prometido`.
 *
 * En el fallo por `producto_no_disponible`, la lista de faltantes viaja en
 * `faltantes` de este resultado — **nombrar cuál falta es parte de la
 * respuesta**: *«no se puede completar» sin decir cuál obliga a la familia a
 * adivinar.*
 */
export async function retomarCompra(
  compraId: string,
): Promise<
  ResultadoWrapper<CompraRetomada, CodigoRetomarCompra>
  & { faltantes?: ItemFaltante[] }
> {
  const { data, error } = await getClient().rpc('retomar_compra', {
    p_compra_id: compraId,
  });
  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: error.message };
  if (!esObj(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'datos_inconsistentes' };
  }

  if (data.ok !== true) {
    const c = typeof data.codigo === 'string' ? data.codigo : 'error_desconocido';
    const base = {
      ok: false as const,
      codigo: (CODIGOS.includes(c) ? c : 'error_desconocido') as CodigoRetomarCompra,
      mensaje: c,
    };
    /* Los faltantes viajan CON el fallo, no aparte: quien pinta el error es
       quien tiene que poder nombrar el producto. */
    if (c === 'producto_no_disponible' && Array.isArray(data.faltantes)) {
      return {
        ...base,
        faltantes: (data.faltantes as unknown[]).filter(esObj).map((f) => ({
          itemId: String(f.item ?? ''),
          producto: typeof f.producto === 'string' ? f.producto : null,
          razon: (f.razon as ItemFaltante['razon']) ?? 'sin_oferta',
        })),
      };
    }
    return base;
  }

  const ajustes = Array.isArray(data.ajustes_de_precio) ? data.ajustes_de_precio : [];

  return {
    ok: true,
    data: {
      compraId: typeof data.compra_id === 'string' ? data.compra_id : compraId,
      retomada: data.retomada === true,
      total: typeof data.total === 'number' ? data.total : Number(data.total ?? 0),
      ajustesDePrecio: (ajustes as unknown[]).filter(esObj).map((a) => ({
        producto: typeof a.producto === 'string' ? a.producto : null,
        antes: Number(a.antes),
        ahora: Number(a.ahora),
      })),
      bajoDePrecio: data.bajo_de_precio === true,
    },
  };
}
