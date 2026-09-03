/**
 * EL NÚMERO DE LA BURBUJA — lado REFUGIO (S112-C).
 *
 * Molde de `useCarrito` (`lib/despensa/carrito.ts`): estado de módulo +
 * `useSyncExternalStore`. **Es el precedente de la casa para estado que vive en
 * el shell y se toca desde una pantalla** — acá el shell dibuja el número y el
 * hilo lo baja al abrirse.
 *
 * La derivación (sumar, contar conversaciones, elegir destino) es de
 * `@epetplace/domain` y la comparten las dos apps. **Acá vive sólo el viaje.**
 *
 * ── CUÁNDO SE RECUENTA, y lo que eso NO cubre ───────────────────────────────
 * · al arrancar el shell · al volver la app al frente · al marcar un hilo leído.
 *
 * 🔴 **NO cuando llega un mensaje con la app abierta.** Eso pedía
 * `suscribirseAMisHilos`, y **no existe** (medido contra el árbol y contra la
 * base: hay `suscribirseAlHilo`, POR hilo). *Suscribir N hilos desde el shell
 * serían N canales para contestar una sola pregunta.* Pedido con nombre a A/D
 * — **no es un olvido, es un hueco declarado.**
 *
 * ⚠️ **UN FALLO DE LECTURA DEJA EL NÚMERO DONDE ESTABA, JAMÁS EN CERO.** *Un
 * cero por fallo se lee «no tenés nada» y la familia deja de mirar; un número
 * viejo, en cambio, la manda a una lista que le dice la verdad.* (Ley 13.)
 */

import { useSyncExternalStore } from 'react';
import { contarPendientes, suscribirseAMisHilos } from '@epetplace/api';
import {
  descontarHilo,
  resumirPendientes,
  type ContadorPendientes,
  type ResumenPendientes,
} from '@epetplace/domain';

const VACIO: ResumenPendientes = { total: 0, conversaciones: 0, unica: null };
const CERO: ContadorPendientes = { hilosConSinLeer: [], solicitudesPorRevisar: 0 };

let contador: ContadorPendientes = CERO;
/* El resumen se guarda DERIVADO, no se calcula en `leer()`:
   `useSyncExternalStore` exige una referencia estable y derivar en cada lectura
   devolvería un objeto nuevo cada vez ⇒ re-render infinito. Mismo criterio que
   `useCarrito`. */
let resumen: ResumenPendientes = VACIO;
const oyentes = new Set<() => void>();

function emitir(c: ContadorPendientes): void {
  contador = c;
  resumen = resumirPendientes(c);
  for (const o of oyentes) o();
}

function suscribir(o: () => void): () => void {
  oyentes.add(o);
  return () => oyentes.delete(o);
}

const leer = (): ResumenPendientes => resumen;

/** El número y su destino, reactivos. Lo consume el shell. */
export function usePendientesAdopcion(): ResumenPendientes {
  return useSyncExternalStore(suscribir, leer, leer);
}

/**
 * Relee del servidor. **Silencioso: si falla, el número no se mueve.**
 * *Un cero por fallo se lee «no tenés nada» y la persona deja de mirar; un
 * número viejo, en cambio, la manda a una lista que le dice la verdad* (Ley 13).
 */
export async function recontarPendientes(): Promise<void> {
  const r = await contarPendientes();
  if (!r.ok) return;
  emitir({ hilosConSinLeer: r.data.hilosConSinLeer, solicitudesPorRevisar: r.data.solicitudesPorRevisar });
}

/**
 * 🔴 **EL DESCUENTO AL INSTANTE** (firma del founder: *«baja el número al
 * instante, sin esperar al servidor»*). Saca el hilo de la lista que el shell YA
 * tiene ⇒ **cero viaje**, que es lo que lo hace instantáneo — y **exacto**,
 * porque el número cuenta conversaciones.
 *
 * *El servidor se enterará igual por `marcarHiloLeido`, y su `'lectura'` va a
 * traer el contador bueno unos milisegundos después. Esto no lo reemplaza: le
 * gana de mano.*
 */
export function marcarLeidoLocal(solicitudId: string): void {
  emitir(descontarHilo(contador, solicitudId));
}

/**
 * ⭐ **EL VIVO, con UN SOLO CAMINO.** `suscribirseAMisHilos` emite
 * `'reconectado'` **también en la primera conexión** (contrato de A, a
 * propósito) ⇒ *la carga inicial y el refresco son el mismo código*: llegó
 * algo, pedí el contador.
 *
 * ⚠️ **`esMio` se descarta a propósito:** mandar un mensaje no puede hacer
 * parpadear tu propia burbuja. *Un indicador que reacciona a lo que uno acaba
 * de hacer enseña a ignorarlo.*
 *
 * Lo monta el SHELL y se desmonta con él — una suscripción por sesión, no una
 * por pantalla.
 */
export function escucharPendientes(): () => void {
  return suscribirseAMisHilos((c) => {
    if (c.tipo === 'mensaje' && c.esMio) return;
    void recontarPendientes();
  });
}

/* ═══ EL SILENCIO, Y AHORA ES POR CLASE ═══════════════════════════════════════
 *
 * N28 manda que una pieza del shell **se calle por SUPERFICIE, con lista
 * explícita y su razón escrita**: *el silencio es una decisión que se declara,
 * nunca un olvido que se descubre.*
 *
 * 🔴 **Y con el abanico de B el silencio dejó de ser de la PIEZA para ser de la
 * CLASE, que es lo que mi diseño original no podía expresar.** Con dos burbujas
 * había que apagar una entera; acá **la clase sale del arreglo y la otra sigue
 * viva** — porque *un mensaje pendiente en el checkout sigue estando pendiente*,
 * y apagarlo ahí sería esconder trabajo por estar en otra pantalla.
 *
 * ⚠️ **SE DETECTA CON `useSegments()`, JAMÁS con el nombre del tab.** El guard
 * del carrito vivió muerto por eso: recibía `state.routes[state.index].name`,
 * que devuelve el nombre del TAB (`despensa`, `explorar`…) y **nunca vale
 * `'checkout'`**. *Un guard que compara contra un valor que su fuente no puede
 * producir no falla: pasa siempre — y su comentario lo hace peor, porque el que
 * lo lee cree que está cubierto.*
 */
export function silenciaMensajes(segmentos: readonly string[]): boolean {
  /* EN EL HILO. Es la pantalla que ya es el destino —*una puerta al cuarto donde
     estás parado es ruido con forma de atajo*— y además **el disco cae justo
     sobre la barra de escribir**: el rojo que el founder nombró. */
  return segmentos.some((s) => s === 'solicitud' || s === '[solicitudId]');
}

/** El prestador **no tiene carrito** —la despensa es de la familia—, así que su
 *  burbuja lleva UNA sola clase y el abanico no puede nacer acá. *Se dice en vez
 *  de deducirse del hecho de que hoy no haya carrito.* */
export function clasesVisibles(segmentos: readonly string[]): { mensajes: boolean } {
  return { mensajes: !silenciaMensajes(segmentos) };
}
