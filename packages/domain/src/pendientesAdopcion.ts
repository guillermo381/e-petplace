/**
 * PENDIENTES DE ADOPCIÓN — el número de la burbuja y **a dónde lleva su toque**.
 *
 * ── POR QUÉ ES DOMINIO Y NO PANTALLA ────────────────────────────────────────
 * Lo consumen **las dos apps** desde su shell. Si cada una sumara por su cuenta
 * y decidiera su destino, *la familia y el refugio verían números distintos
 * para el mismo hecho, y ninguna forma de saber cuál miente* — que es la misma
 * razón por la que `armarHilo` y `leerEscalera` viven acá.
 *
 * ── DE DÓNDE SALE, y qué cuenta ─────────────────────────────────────────────
 * De `contarPendientes()` (A): **un viaje**, `{ mensajesSinLeer,
 * hilosConSinLeer, solicitudesPorRevisar }`. Vivo con `suscribirseAMisHilos`
 * — **una suscripción por sesión**, cuyo `'reconectado'` llega también en la
 * primera conexión, así que la carga inicial y el refresco son **un solo
 * camino**: *«llegó algo, pedí el contador»*.
 *
 * 🔴 **EL NÚMERO CUENTA CONVERSACIONES, NO MENSAJES** (firma del founder). Dos
 * razones, y la segunda es la que lo vuelve exigible:
 *
 * ① **cada unidad es UNA COSA QUE ATENDER.** Cinco mensajes en dos
 *    conversaciones son dos cosas que hacer, no cinco.
 * ② 🔴 **hace EXACTO el descuento al instante.** `hilosConSinLeer` son **ids
 *    SIN su cuenta**, así que contando mensajes *no hay forma de saber cuántos
 *    descontar al abrir un hilo* — habría que inventar un número o pedirle un
 *    campo más a A. Contando conversaciones, abrir un hilo lo saca de la lista
 *    y el número baja **1, exacto y sin viaje.**
 *
 * ⚠️ **Su costo, declarado:** un segundo mensaje en una conversación ya sin
 * leer **no mueve el número**. *Es correcto — «alguien te espera» ya era
 * cierto* — pero es una diferencia visible y se dice, no se descubre.
 * ⇒ `mensajesSinLeer` de A queda **sin consumidor por esta decisión**, no por
 * olvido.
 */

/** Lo que `contarPendientes()` devuelve, en lo que a esta regla le importa.
 *  Tipado por estructura a propósito: la regla no depende del wrapper. */
export interface ContadorPendientes {
  readonly hilosConSinLeer: readonly string[];
  readonly solicitudesPorRevisar: number;
}

export interface ResumenPendientes {
  /** El número de la burbuja. Con 0, la pieza no se dibuja. */
  readonly total: number;
  /** Cuántas conversaciones tienen algo sin leer (≠ cuántos mensajes). */
  readonly conversaciones: number;
  /**
   * 🔴 **LA REGLA DE NAVEGACIÓN, DERIVADA Y NO DECIDIDA POR LA PANTALLA.**
   * El id **si y sólo si** hay exactamente UNA conversación con algo sin leer y
   * nada más que atender. Con cero, con varias, o con solicitudes por revisar
   * encima ⇒ `null` = **a la lista**.
   *
   * *Vive acá porque si cada shell la resolviera, alcanzaría con que una
   * escribiera `>= 1` en vez de `=== 1` para que el cliente saltara al hilo
   * equivocado — y eso no lo ve ningún typecheck.*
   */
  readonly unica: string | null;
  /** SÓLO refugio: las que esperan veredicto. **Se expone derivado y no se
   *  recalcula en la pantalla** — `total - conversaciones` habría sido *dos
   *  números que deben coincidir saliendo de dos cuentas*, la forma que esta
   *  casa ya pagó (`L-284`). Cero en la app de la familia. */
  readonly porRevisar: number;
}

/** Un contador que llega roto aporta 0.
 *  *Un `NaN` sumado deja el número entero en `NaN` y la pieza dibujaría «NaN»
 *  sobre la app — un dato imposible es peor que un dato ausente.* */
function sano(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

/** Ids repetidos NO cuentan dos veces. *El lector no debería mandarlos, y si
 *  algún día los manda, el defecto no puede ser un número inflado en pantalla
 *  que nadie sabe de dónde salió.* */
export function resumirPendientes(c: ContadorPendientes): ResumenPendientes {
  const hilos = [...new Set(c.hilosConSinLeer.filter((h) => typeof h === 'string' && h !== ''))];
  const revisar = sano(c.solicitudesPorRevisar);
  return {
    total: hilos.length + revisar,
    conversaciones: hilos.length,
    porRevisar: revisar,
    unica: hilos.length === 1 && revisar === 0 ? (hilos[0] ?? null) : null,
  };
}

/**
 * El descuento AL INSTANTE al abrir un hilo (firma del founder: *«marcarHiloLeido
 * baja el número al instante, sin esperar al servidor»*).
 *
 * **Saca el hilo de la lista** — no resta un número a ciegas. Con el número
 * contando conversaciones eso es **exacto por construcción**: la conversación
 * deja de estar sin leer, y baja exactamente una.
 */
export function descontarHilo(c: ContadorPendientes, solicitudId: string): ContadorPendientes {
  return {
    hilosConSinLeer: c.hilosConSinLeer.filter((h) => h !== solicitudId),
    /* ⚠️ **El por-revisar se CONSERVA**: abrir una conversación no revisa una
       solicitud. *Ponerlo en 0 acá haría desaparecer del número un trabajo que
       nadie hizo, y volvería en el próximo contador* — la forma en que un
       número miente y después se corrige solo. */
    solicitudesPorRevisar: c.solicitudesPorRevisar,
  };
}
