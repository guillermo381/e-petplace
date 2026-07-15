/**
 * EL CANAL DE CONTACTO DEL EQUIPO (S61-B13, dato del founder) — UNA
 * constante, jamás regada por pantallas: cuando el flujo real de
 * solicitud nazca (D-399), muere en un solo lugar. El canal es el
 * WhatsApp del founder — decisión founder S61, correcta para el grupo
 * curado F1 (la curaduría es manual a propósito).
 */

export const WHATSAPP_EQUIPO = '573208408790';

/** Para mostrar cuando WhatsApp no abre (fallback honesto). */
export const WHATSAPP_EQUIPO_HUMANO = '+57 320 840 8790';

export function urlWhatsApp(mensaje: string): string {
  return `https://wa.me/${WHATSAPP_EQUIPO}?text=${encodeURIComponent(mensaje)}`;
}
