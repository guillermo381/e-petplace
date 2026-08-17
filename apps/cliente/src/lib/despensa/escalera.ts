/**
 * LA ESCALERA DEL PEDIDO — de la narrativa a los pasos (S96-D · D-B4 ·
 * `LETRA_RECORRIDO_DESPENSA_S96` §8.1).
 *
 * UNA función para los dos consumidores (la lista y el detalle): la
 * narrativa del catálogo (`v_pedidos_narrativa`, SIETE y solo siete) se
 * convierte en los `PasoEscalera` que `EscaleraEstados`/`TarjetaPedido`
 * de B dibujan. Las VOCES las pone la pantalla (Ley 3: el riel, jamás
 * esta lib) — acá solo se decide qué paso está hecho, cuál es el actual
 * y cuándo el camino se DESVIÓ.
 *
 * · La escalera feliz: confirmado → preparando → en camino → entregado.
 *   (Preparando tapa tres escalones internos del vendedor a propósito:
 *   picking/empacado/documentado son SU operación, no una noticia para
 *   la familia.)
 * · `no_llego` = DESVÍO con tono alerta (§9.3: el pedido vuelve y se
 *   reagenda) — los pasos hasta "en camino" quedan hechos.
 * · `cancelado` = SIN escalera (regla de existencia de TarjetaPedido:
 *   vacío es vacío) + desvío neutro: terminó sin drama, apagado no dice
 *   error.
 *
 * ── 🔴 S100-D · SON CUATRO NODOS, NO CINCO — `pagando` SALE ─────────────
 * Receta de B firmada (`2026-08-18-s99b-RECETA-SEGUIMIENTO-DE-NODOS` §1):
 * **una narrativa NO es automáticamente un escalón.** Tres de las siete no
 * son pasos de un camino — `no_llego` y `cancelado` son DESVÍO (banda que
 * sustituye), y `pagando` **es ANTES de que exista una promesa**.
 *
 * *Dibujar la escalera en `pagando` prometería un recorrido que todavía no
 * arrancó* — y esta lib lo hacía: `pagando` era su primer escalón, así que
 * un pedido cuyo pago aún no confirma mostraba cuatro peldaños por delante
 * como si el vendedor ya lo hubiera tomado. **Se cae el escalón, no se
 * renombra.**
 *
 * ⚠️ **Sin escalera, la fila queda muda sobre su estado** — y por eso la
 * pantalla cae a `narrativa_nombre` (voz del CATÁLOGO, dato y no `switch`)
 * cuando esta función no devuelve pasos. La regla Chanel de la lista
 * («no dice narrativa como texto suelto: la escalera la DIBUJA») supone
 * que la escalera dibuja; donde no dibuja, el texto no duplica nada — es
 * el único portador. Declarado acá para que no se lea como desvío de esa
 * regla.
 */

import type { DesvioEscalera, IconoNombre, PasoEscalera } from '@epetplace/ui';
import type { NarrativaPedido } from '@epetplace/api';

/** Las voces YA resueltas por el riel de la pantalla.
 *  `pagando` NO está: dejó de ser escalón (ver cabecera) y su voz la pone
 *  el catálogo (`narrativa_nombre`), no este mapa. */
export interface VocesEscalera {
  confirmado: string;
  preparando: string;
  enCamino: string;
  entregado: string;
  noLlego: string;
  noLlegoDetalle: string;
  cancelado: string;
}

const ESCALERA: { clave: NarrativaPedido; voz: keyof VocesEscalera }[] = [
  { clave: 'confirmado', voz: 'confirmado' },
  { clave: 'preparando', voz: 'preparando' },
  { clave: 'en_camino', voz: 'enCamino' },
  { clave: 'entregado', voz: 'entregado' },
];

/**
 * EL GLIFO DE CADA NODO — el slot `icono` de B, lleno.
 *
 * 🔴 **Se mapea por lo que DIBUJA, no por su nombre**, que es la regla que
 * el vendedor ya aplicó en su ventana: los cuatro glifos de B son **bolsa ·
 * caja · flecha · visto**, separados por EJE y no por contenido, porque
 * *a 12 px no sobrevive el detalle interior, sobrevive la ORIENTACIÓN*.
 * Acá los nombres de B y las narrativas de la familia coinciden uno a uno
 * —fueron dibujados para esta escalera— y aun así el mapa se escribe
 * explícito: **la coincidencia de nombres es un accidente cómodo, no un
 * contrato.**
 *
 * El slot es OPCIONAL por diseño de B y la escalera funciona entera sin él;
 * el ícono es lo que hace que cada etapa diga QUÉ ES **sin texto**, que es
 * la pregunta del ojo de la receta (§6.3).
 */
export const GLIFO_NODO: Record<string, IconoNombre> = {
  confirmado: 'nodoConfirmado', // la bolsa — el pedido tomado
  preparando: 'nodoPreparando', // la caja abierta — se está armando
  en_camino: 'nodoEnCamino', // la flecha — el movimiento
  entregado: 'nodoEntregado', // el visto — el único que COMPLETA algo
};

export function escaleraDePedido(
  narrativa: NarrativaPedido,
  voces: VocesEscalera,
  /** Dato de máquina para el paso ACTUAL (la ventana prometida, la hora)
   *  — voz de la pantalla, mono en la pieza. */
  detalleActual?: string,
): { pasos: PasoEscalera[]; desvio?: DesvioEscalera } {
  if (narrativa === 'cancelado') {
    return { pasos: [], desvio: { etiqueta: voces.cancelado, tono: 'neutro' } };
  }

  // `pagando` es ANTES de que haya recorrido: sin escalera y sin banda.
  // No es un desvío —no se torció nada— y por eso no usa la banda, que
  // significa "el camino se interrumpió". La fila lo dice con la voz del
  // catálogo (ver cabecera).
  if (narrativa === 'pagando') return { pasos: [] };

  if (narrativa === 'no_llego') {
    // El camino llegó hasta la puerta y volvió: lo caminado queda hecho.
    // Son los TRES primeros (confirmado · preparando · en camino) — con
    // `pagando` fuera, el `slice(0, 4)` de antes se habría comido también
    // `entregado` y habría dicho que el pedido llegó.
    const pasos: PasoEscalera[] = ESCALERA.slice(0, 3).map((p) => ({
      clave: p.clave,
      etiqueta: voces[p.voz],
      estado: 'hecho',
    }));
    return {
      pasos,
      desvio: { etiqueta: voces.noLlego, detalle: voces.noLlegoDetalle, tono: 'alerta' },
    };
  }

  const idx = ESCALERA.findIndex((p) => p.clave === narrativa);
  const pasos: PasoEscalera[] = ESCALERA.map((p, i) => ({
    clave: p.clave,
    etiqueta: voces[p.voz],
    // `entregado` es terminal: el último paso queda HECHO, no "actual
    // para siempre".
    estado:
      i < idx || (narrativa === 'entregado' && i === idx)
        ? 'hecho'
        : i === idx
          ? 'actual'
          : 'pendiente',
    detalle: i === idx && detalleActual !== undefined ? detalleActual : undefined,
  }));
  return { pasos };
}
