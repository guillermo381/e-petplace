/**
 * EL CANAL DE CONTACTO HUMANO DEL CLIENTE (S96-D · LETRA_RECORRIDO §8.4)
 * — UNA constante, jamás regada por pantallas: cuando exista el módulo de
 * postventa (D-774), muere en un solo lugar.
 *
 * CLON DECLARADO de `apps/prestador/src/lib/contacto.ts` (S61-B13): las
 * dos apps no comparten lib y `packages/domain` es territorio de A — si
 * el número cambia, cambia en LOS DOS archivos (anotado para la vara
 * cruzada; la promoción a paquete compartido es decisión de mesa, no de
 * esta pista).
 *
 * La regla de la letra que las pantallas deben cumplir al usarlo: el
 * botón DICE a dónde va y en qué horario contestan — prometer respuesta
 * inmediata a las dos de la mañana es prometer lo que no se cumple.
 */

export const WHATSAPP_EQUIPO = '573208408790';

/** Para mostrar cuando WhatsApp no abre (fallback honesto). */
export const WHATSAPP_EQUIPO_HUMANO = '+57 320 840 8790';

export function urlWhatsApp(mensaje: string): string {
  return `https://wa.me/${WHATSAPP_EQUIPO}?text=${encodeURIComponent(mensaje)}`;
}
