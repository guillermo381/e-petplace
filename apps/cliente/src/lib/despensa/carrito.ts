/**
 * EL CARRITO DE LA DESPENSA (S96-D · LETRA_RECORRIDO_DESPENSA_S96 §6.3).
 *
 * QUÉ ES Y QUÉ NO ES, porque el deslinde es la arquitectura:
 *
 * · Es la INTENCIÓN de compra — qué ofertas, cuántas, para quién. Vive en
 *   memoria de proceso y muere con la app. NO va a AsyncStorage a
 *   propósito: un carrito que hiberna días en disco es un carrito de
 *   precios viejos, y "el precio que se muestra ES el precio" es la
 *   conquista de S95 que no se regala (los productos quedan a dos toques;
 *   rearmarlo es barato, mentir un precio no).
 *
 * · 🔴 NO CALCULA PLATA. Ni subtotal, ni impuesto, ni total. El carrito
 *   con números reales es el pedido en estado `creado` que devuelve
 *   `crearPedidoDespensa` al confirmar — el motor calcula, esta capa
 *   transporta (misma ley que `despensa-pedido.ts`: un total calculado en
 *   dos lugares es un total que un día discrepa en una factura).
 *
 * · CADA ÍTEM LLEVA SU DESTINO (§6.3): una mascota, donación, o NINGUNO —
 *   y ninguno es LEGAL (la regla general de §4: la app nunca adivina de
 *   quién es una compra; ofrece atarla y el dueño decide, incluso después
 *   de entregada).
 *
 * · `advertenciaEntendida` (§5.4): el paso explícito de entendimiento de
 *   la alergia, POR ÍTEM. ⚠️ HUECO DECLARADO: la letra pide que el paso
 *   "quede registrado" y hoy el motor no tiene productor para eso (ni
 *   señal en `cat_senales_comerciales` ni columna del ítem) — el registro
 *   vive en este estado hasta que A publique la forma. Pedido enviado a A
 *   el 12-ago-2026.
 *
 * · `cuentaComercialId` nace NULABLE y es un hueco medido, no un olvido:
 *   la RLS de `vendedor_skus` (solo-vendedor) impide que el cliente sepa
 *   de qué vendedor es una oferta, y sin ese id `crear_pedido_despensa`
 *   no se puede llamar. Pedido bloqueante enviado a A el 12-ago-2026; el
 *   checkout lo declara mientras tanto.
 */

import { useSyncExternalStore } from 'react';
import type { DestinoItem } from '@epetplace/ui';

export interface ItemCarrito {
  oferta_id: string;
  producto_id: string;
  variante_id: string;
  nombre: string;
  marca: string | null;
  presentacion: string;
  /** El precio UNITARIO de la oferta publicada, tal como lo dijo el
   *  motor al listarla. Es para PINTAR la fila — el total lo dice
   *  `crearPedidoDespensa`, jamás una suma de estos. */
  precio: number;
  moneda: string;
  foto_url: string | null;
  especies_aplicables: string[];
  alergenos: string[];
  /** null = el catálogo todavía no expone el vendedor (hueco declarado
   *  arriba). El checkout no puede crear pedido sin esto. */
  cuentaComercialId: string | null;
  cantidad: number;
  /** null = sin destino, y es legal (§4). */
  destino: DestinoItem | null;
  /** §5.4 — el paso explícito quedó dado para este producto y la mascota
   *  del destino. Solo tiene sentido cuando hubo advertencia. */
  advertenciaEntendida: boolean;
}

let items: ItemCarrito[] = [];
const oyentes = new Set<() => void>();

function emitir() {
  items = [...items];
  for (const o of oyentes) o();
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

function leer(): ItemCarrito[] {
  return items;
}

/** El carrito vivo, reactivo. La identidad del array cambia con cada
 *  mutación (emitir clona), así que `useSyncExternalStore` re-renderiza
 *  sin comparadores a medida. */
export function useCarrito(): ItemCarrito[] {
  return useSyncExternalStore(suscribir, leer, leer);
}

/** Agrega o SUMA cantidad si la oferta ya está (misma oferta = misma
 *  fila; dos presentaciones del mismo producto son dos filas porque son
 *  dos ofertas). */
export function agregarAlCarrito(
  item: Omit<ItemCarrito, 'cantidad' | 'destino' | 'advertenciaEntendida'>,
  cantidad: number,
  destino: DestinoItem | null = null,
  advertenciaEntendida = false,
): void {
  const existente = items.find((i) => i.oferta_id === item.oferta_id);
  if (existente) {
    existente.cantidad += cantidad;
    if (destino !== null) existente.destino = destino;
    if (advertenciaEntendida) existente.advertenciaEntendida = true;
  } else {
    items.push({ ...item, cantidad, destino, advertenciaEntendida });
  }
  emitir();
}

export function quitarDelCarrito(ofertaId: string): void {
  items = items.filter((i) => i.oferta_id !== ofertaId);
  emitir();
}

export function fijarCantidad(ofertaId: string, cantidad: number): void {
  const item = items.find((i) => i.oferta_id === ofertaId);
  if (!item) return;
  if (cantidad <= 0) {
    quitarDelCarrito(ofertaId);
    return;
  }
  item.cantidad = cantidad;
  emitir();
}

export function fijarDestino(ofertaId: string, destino: DestinoItem | null): void {
  const item = items.find((i) => i.oferta_id === ofertaId);
  if (!item) return;
  item.destino = destino;
  emitir();
}

export function marcarAdvertenciaEntendida(ofertaId: string): void {
  const item = items.find((i) => i.oferta_id === ofertaId);
  if (!item) return;
  item.advertenciaEntendida = true;
  emitir();
}

/** Se vacía al confirmar la compra (el pedido ya vive en el motor) o a
 *  pedido del dueño. */
export function vaciarCarrito(): void {
  items = [];
  emitir();
}

/** Cuántas UNIDADES hay (para el CTA "Ver carrito · N"). */
export function unidadesEnCarrito(lista: ItemCarrito[]): number {
  return lista.reduce((suma, i) => suma + i.cantidad, 0);
}
