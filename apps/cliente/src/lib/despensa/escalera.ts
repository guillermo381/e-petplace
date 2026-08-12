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
 * · La escalera feliz: pagando → confirmado → preparando → en camino →
 *   entregado. (Preparando tapa tres escalones internos del vendedor a
 *   propósito: picking/empacado/documentado son SU operación, no una
 *   noticia para la familia.)
 * · `no_llego` = DESVÍO con tono alerta (§9.3: el pedido vuelve y se
 *   reagenda) — los pasos hasta "en camino" quedan hechos.
 * · `cancelado` = SIN escalera (regla de existencia de TarjetaPedido:
 *   vacío es vacío) + desvío neutro: terminó sin drama, apagado no dice
 *   error.
 */

import type { DesvioEscalera, PasoEscalera } from '@epetplace/ui';
import type { NarrativaPedido } from '@epetplace/api';

/** Las voces YA resueltas por el riel de la pantalla. */
export interface VocesEscalera {
  pagando: string;
  confirmado: string;
  preparando: string;
  enCamino: string;
  entregado: string;
  noLlego: string;
  noLlegoDetalle: string;
  cancelado: string;
}

const ESCALERA: { clave: NarrativaPedido; voz: keyof VocesEscalera }[] = [
  { clave: 'pagando', voz: 'pagando' },
  { clave: 'confirmado', voz: 'confirmado' },
  { clave: 'preparando', voz: 'preparando' },
  { clave: 'en_camino', voz: 'enCamino' },
  { clave: 'entregado', voz: 'entregado' },
];

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

  if (narrativa === 'no_llego') {
    // El camino llegó hasta la puerta y volvió: lo caminado queda hecho.
    const pasos: PasoEscalera[] = ESCALERA.slice(0, 4).map((p) => ({
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
