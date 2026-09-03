/**
 * PENDIENTES DE ADOPCIÓN — el número de la burbuja y **a dónde lleva su toque**.
 *
 * ── POR QUÉ ES DOMINIO Y NO PANTALLA ────────────────────────────────────────
 * Lo consumen **las dos apps** desde su shell. Si cada una sumara por su cuenta
 * y decidiera su destino, *la familia y el refugio verían números distintos
 * para el mismo hecho, y ninguna forma de saber cuál miente* — que es la misma
 * razón por la que `armarHilo` y `leerEscalera` viven acá.
 *
 * ── DE DÓNDE SALE EL NÚMERO, y por qué NO hace falta una RPC nueva ──────────
 * El mandato nombraba un `contar_pendientes`. **Medido: no existe** — ni en la
 * base ni en los wrappers. **Pero `sinLeer` YA VIAJA** por solicitud en los dos
 * lectores de listado (`obtenerMisSolicitudesAdopcion` ·
 * `obtenerSolicitudesDeMisPublicaciones`), así que el total se **deriva** de lo
 * que ya se pide. *Pedir una función nueva para sumar un campo que ya llega es
 * pagar un viaje por una cuenta.*
 *
 * 🔴 **LO QUE ESTO NO DA, declarado: el TIEMPO REAL.** El mandato pedía
 * `suscribirseAMisHilos`, que tampoco existe (hay `suscribirseAlHilo`, POR
 * hilo). ⇒ el número se recalcula al arrancar, al volver a la app y al marcar
 * leído — **no cuando llega un mensaje con la app abierta**. Es un pedido con
 * nombre a A/D, no un olvido.
 */

/** Lo mínimo que las DOS filas comparten. Tipado por estructura a propósito:
 *  `MiSolicitud` y `SolicitudRecibida` no son el mismo tipo y no tienen por qué
 *  serlo — lo que comparten es el hecho. */
export interface FilaConSinLeer {
  readonly solicitudId: string;
  readonly sinLeer: number;
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
}

/** Un contador que llega roto no rompe la burbuja: aporta 0.
 *  *Un `NaN` sumado deja el número entero en `NaN`, y la pieza dibujaría
 *  «NaN» sobre la app — un dato imposible es peor que un dato ausente.* */
function sano(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

/**
 * @param filas   las solicitudes con su `sinLeer`
 * @param porRevisar  SÓLO refugio: solicitudes esperando su veredicto. Suman al
 *   número **y fuerzan el destino a la lista** — *hay dos clases de cosa que
 *   atender y una sola no alcanza para elegir a dónde llevar.*
 */
export function resumirPendientes(
  filas: readonly FilaConSinLeer[],
  porRevisar = 0,
): ResumenPendientes {
  const conAlgo = filas.filter((f) => sano(f.sinLeer) > 0);
  const mensajes = conAlgo.reduce((n, f) => n + sano(f.sinLeer), 0);
  const revisar = sano(porRevisar);
  return {
    total: mensajes + revisar,
    conversaciones: conAlgo.length,
    unica: conAlgo.length === 1 && revisar === 0 ? (conAlgo[0]?.solicitudId ?? null) : null,
  };
}

/**
 * El descuento AL INSTANTE al abrir un hilo (firma del founder: *«marcarHiloLeido
 * baja el número al instante, sin esperar al servidor»*).
 *
 * *Se descuenta lo de ESA conversación, no «uno»*: si el hilo traía cuatro sin
 * leer, abrirlo los lee los cuatro. **Restar 1 dejaría la burbuja en 3 sobre un
 * hilo ya leído**, y el próximo recuento la corregiría sola — o sea un número
 * equivocado que se arregla solo, que es el más difícil de reportar.
 */
export function descontarHilo(
  filas: readonly FilaConSinLeer[],
  solicitudId: string,
): readonly FilaConSinLeer[] {
  return filas.map((f) => (f.solicitudId === solicitudId ? { ...f, sinLeer: 0 } : f));
}
