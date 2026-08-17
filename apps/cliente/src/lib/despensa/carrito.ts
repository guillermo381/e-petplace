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
 * · `cuentaComercialId` es NO-NULO desde el cableo del 12-ago: nació
 *   nulable porque la RLS de `vendedor_skus` impedía saber de qué
 *   vendedor era una oferta; la tanda de A lo denormalizó en `ofertas`
 *   por trigger (imposible de omitir) y el hueco murió el mismo día.
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
  /** El vendedor de la oferta publicada (ver cabecera: no-nulo por
   *  construcción desde el trigger de A). */
  cuentaComercialId: string;
  /** El país de la oferta — lo que el riel de moneda exige (D-448). */
  country_code: string;
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

/** El mismo estado, sin hook — para quien no es un componente (un
 *  instrumento, una función que arma el pedido). Es EL MISMO `leer` que
 *  consume `useCarrito`: una fuente, dos puertas. */
export function itemsDelCarrito(): ItemCarrito[] {
  return leer();
}

/**
 * Qué pasó al agregar. **La pantalla necesita saberlo para poder hablar**
 * — sobre todo en `consolidado`, que es el único caso donde el carrito
 * hace algo que la persona no pidió explícitamente.
 */
export type ResultadoAgregar =
  | { tipo: 'agregado' }
  | { tipo: 'sumado' }
  | {
      /** 🔴 La misma VARIANTE ya estaba, pero de OTRO vendedor. */
      tipo: 'consolidado';
      vendedorConservado: string;
      vendedorDescartado: string;
    };

/**
 * Agrega o SUMA cantidad. Tres casos, y el tercero es de S100:
 *
 * · misma OFERTA → suma cantidad (dos presentaciones del mismo producto
 *   siguen siendo dos filas: son dos ofertas distintas).
 * · misma VARIANTE de OTRO vendedor → **se CONSOLIDA en la que ya estaba.**
 * · nueva → fila nueva.
 *
 * ── 🔴 POR QUÉ SE CONSOLIDA (regla derivada de la firma F5) ────────────
 * F5 firmó *«un carrito, N pedidos independientes; la división se declara
 * antes de pagar»*. Y medido: **25 variantes tienen más de una oferta
 * publicada**, de vendedores distintos — o sea que la misma bolsa aparece
 * dos veces en la vitrina a dos precios.
 *
 * Sin esta regla, una familia agrega «la misma bolsa» dos veces creyendo
 * que son dos cosas distintas y **recibe DOS pedidos de DOS vendedores**.
 * *La división se declararía impecablemente y sería incomprensible* — el
 * defecto no estaría en la voz, estaría en que la voz dice la verdad sobre
 * algo que nunca debió pasar.
 *
 * **La misma variante nunca se parte entre vendedores dentro de un
 * carrito.** Gana **la que ya estaba** — determinista y sin sorpresa: el
 * carrito no cambia de vendedor por la espalda.
 *
 * Y lo que esta regla **NO** hace: si el vendedor conservado no tiene
 * stock suficiente, **ahí habla la voz de insuficiente (D-827)** — jamás
 * se parte en silencio para completar la cantidad.
 */
export function agregarAlCarrito(
  item: Omit<ItemCarrito, 'cantidad' | 'destino' | 'advertenciaEntendida'>,
  cantidad: number,
  destino: DestinoItem | null = null,
  advertenciaEntendida = false,
): ResultadoAgregar {
  const aplicar = (fila: ItemCarrito) => {
    fila.cantidad += cantidad;
    if (destino !== null) fila.destino = destino;
    if (advertenciaEntendida) fila.advertenciaEntendida = true;
  };

  const mismaOferta = items.find((i) => i.oferta_id === item.oferta_id);
  if (mismaOferta) {
    aplicar(mismaOferta);
    emitir();
    return { tipo: 'sumado' };
  }

  // La misma variante de OTRO vendedor: se consolida, no se parte.
  const mismaVariante = items.find((i) => i.variante_id === item.variante_id);
  if (mismaVariante) {
    aplicar(mismaVariante);
    emitir();
    return {
      tipo: 'consolidado',
      vendedorConservado: mismaVariante.cuentaComercialId,
      vendedorDescartado: item.cuentaComercialId,
    };
  }

  items.push({ ...item, cantidad, destino, advertenciaEntendida });
  emitir();
  return { tipo: 'agregado' };
}

/**
 * EL CARRITO PARTIDO EN N PEDIDOS (firma F5 del founder, 17-ago-2026:
 * *«un carrito, N pedidos independientes en v1; la división se declara
 * antes de pagar y se explica después»*).
 *
 * Es una función PURA sobre el carrito — no llama a nadie. La división
 * **coincide con lo que el motor ya hace por construcción**:
 * `crear_pedido_despensa` recibe UN `cuenta_comercial_id`, así que un
 * pedido es, y siempre fue, de un solo vendedor. *La firma no le pelea al
 * motor: lo confirma.*
 *
 * **El orden es el de APARICIÓN en el carrito**, no alfabético ni por
 * monto: la pantalla que declara «son 2 pedidos» tiene que listarlos en el
 * orden en que la persona los armó, o la declaración se lee como si el
 * sistema hubiera reordenado su compra.
 */
export interface GrupoDeVendedor {
  cuentaComercialId: string;
  items: ItemCarrito[];
}

export function agruparPorVendedor(lista: ItemCarrito[]): GrupoDeVendedor[] {
  const grupos: GrupoDeVendedor[] = [];
  for (const it of lista) {
    const g = grupos.find((x) => x.cuentaComercialId === it.cuentaComercialId);
    if (g) g.items.push(it);
    else grupos.push({ cuentaComercialId: it.cuentaComercialId, items: [it] });
  }
  return grupos;
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
