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
import { contarSolicitudesPorRevisar, obtenerSolicitudesDeMisPublicaciones } from '@epetplace/api';
import { descontarHilo, resumirPendientes, type FilaConSinLeer, type ResumenPendientes } from '@epetplace/domain';

const VACIO: ResumenPendientes = { total: 0, conversaciones: 0, unica: null };

let filas: readonly FilaConSinLeer[] = [];
/* El resumen se guarda DERIVADO, no se calcula en `leer()`: `useSyncExternalStore`
   exige una referencia estable y derivar en cada lectura devolvería un objeto
   nuevo cada vez ⇒ re-render infinito. Mismo criterio que el carrito. */
let resumen: ResumenPendientes = VACIO;
/** Lo último que dijo `contar_solicitudes_por_revisar`, para no perderlo en un
 *  descuento local (ver `marcarLeidoLocal`). */
let revisarActual = 0;
const oyentes = new Set<() => void>();

function emitir(nuevas: readonly FilaConSinLeer[], porRevisar = 0): void {
  filas = nuevas;
  revisarActual = porRevisar;
  resumen = resumirPendientes(nuevas, porRevisar);
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

/** Relee del servidor. Silencioso: si falla, el número no se mueve. */
export async function recontarPendientes(): Promise<void> {
  /* Los dos en paralelo: son dos preguntas independientes y encadenarlas
     pagaría dos olas por un número que se dibuja de una sola vez (L-223). */
  const [r, rev] = await Promise.all([obtenerSolicitudesDeMisPublicaciones(), contarSolicitudesPorRevisar()]);
  if (!r.ok) return;
  if (!rev.ok) console.warn(`[pendientes] por-revisar no se pudo leer: ${rev.mensaje}`);
  emitir(
    r.data.map((s) => ({ solicitudId: s.solicitudId, sinLeer: s.sinLeer })),
    rev.ok ? rev.data : 0,
  );
}

/**
 * 🔴 **EL DESCUENTO AL INSTANTE** (firma del founder: *«baja el número al
 * instante, sin esperar al servidor»*). Corre sobre las filas que el shell YA
 * tiene ⇒ **cero viaje**, que es lo que lo hace instantáneo.
 *
 * *Pone esa conversación en CERO, no resta uno*: si el hilo traía cuatro sin
 * leer, abrirlo los lee los cuatro. **Restar 1 dejaría la burbuja en 3 sobre un
 * hilo ya leído**, y el próximo recuento lo corregiría solo — o sea un número
 * equivocado que se arregla solo, que es el más difícil de reportar.
 */
export function marcarLeidoLocal(solicitudId: string): void {
  /* ⚠️ **El por-revisar se CONSERVA**: abrir una conversación no revisa una
     solicitud. *Pasarlo como 0 acá haría desaparecer del número un trabajo
     pendiente que nadie hizo* — y volvería en el próximo recuento, que es la
     forma en que un número miente y después se corrige solo. */
  emitir(descontarHilo(filas, solicitudId), revisarActual);
}
