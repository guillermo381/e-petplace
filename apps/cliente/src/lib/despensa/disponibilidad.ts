/**
 * QUÉ LE PASÓ AL CARRITO MIENTRAS ESTABA GUARDADO (A-01, S100c).
 *
 * Vive en un archivo propio **y no adentro de la pantalla** por la misma razón
 * que `destinos.ts`: para que un instrumento pueda importar **LA función que
 * la pantalla usa**. *Un test que re-escribe la regla adentro mide su propio
 * eco: probaría que sé escribir dos veces lo mismo, no que el carrito frena.*
 *
 * ── 🔴 EL LÍMITE DEL DATO, HEREDADO Y NO DISIMULADO ──────────────────────
 * Todo esto se apoya en `ofertas.hay_stock`, que es `stock_disponible > 0`
 * (trigger `_trg_oferta_deriva_hay_stock`) — **booleano por FIRMA de S99**,
 * jamás un número: *la familia necesita «¿puedo comprar esto?», no el
 * inventario ajeno*. ⇒ acá se caza «se agotó» y **NO** «no alcanza para 5».
 * Quien pida 5 de un producto con 1 se sigue enterando en la caja, y cerrar
 * ese caso exige el motor (pedido Q4), no una función más lista.
 */

import type { EstadoOfertaCarrito } from '@epetplace/api';

export type ProblemaItem = 'agotado' | 'ya_no_publicada';

/**
 * `null` significa DOS cosas y las dos se tratan igual a propósito: «está
 * bien» y «todavía no se pudo medir». **Ninguna es motivo para acusar a un
 * producto de agotado** — Ley 13: un fallo jamás se disfraza de veredicto.
 */
export function problemaDelItem(
  estados: Record<string, EstadoOfertaCarrito> | null,
  ofertaId: string,
): ProblemaItem | null {
  const e = estados?.[ofertaId];
  if (e === undefined || e.disponible) return null;
  // Sin motivo explícito cae en «ya no está publicada»: es lo que le pasa a
  // una oferta que ni siquiera volvió del `select` (borrada, despublicada, o
  // fuera del alcance de la RLS).
  return e.motivo ?? 'ya_no_publicada';
}

/**
 * El precio de HOY, solo si difiere del que la familia vio al agregar.
 *
 * ⚠️ COMPARA EN CENTAVOS. Con flotantes, `12.30` y `12.3` son el mismo número
 * —eso no molesta— pero una resta de precios sí produce basura binaria, y una
 * comparación directa haría aparecer un «el precio cambió» sobre dos precios
 * idénticos. *Una alerta de precio falsa es peor que no tenerla: entrena a la
 * familia a ignorarla justo antes de pagar.*
 */
export function precioNuevoDelItem(
  estados: Record<string, EstadoOfertaCarrito> | null,
  item: { oferta_id: string; precio: number },
): number | null {
  const e = estados?.[item.oferta_id];
  if (e === undefined || e.precio_vigente === null) return null;
  const enCentavos = (n: number) => Math.round(n * 100);
  return enCentavos(e.precio_vigente) !== enCentavos(item.precio) ? e.precio_vigente : null;
}

/**
 * Cuántos ítems del carrito no se pueden comprar.
 *
 * Es lo que apaga el CTA: *dejarlos pasar sería devolver la mala noticia a la
 * caja*, que es el defecto entero que esto vino a cerrar. Con `estados = null`
 * da **0**: no se bloquea una compra por una duda de red.
 */
export function itemsBloqueados(
  estados: Record<string, EstadoOfertaCarrito> | null,
  items: { oferta_id: string }[],
): number {
  return items.filter((it) => problemaDelItem(estados, it.oferta_id) !== null).length;
}
