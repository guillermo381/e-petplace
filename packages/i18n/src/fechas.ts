/**
 * Formato de fecha ÚNICO del riel (S53-B2c.1) — la voz de máquina
 * "03 ago 2023" / "03 aug 2023" por idioma vía Intl. Cero formateos
 * artesanales por pantalla: TODOS los módulos consumen esta función
 * (la cura Intl de S52 llegó a LineaDeVida; esta la vuelve ley).
 */

import type { IdiomaSoportado } from './idiomas';

/** dd mon yyyy en mono-voz (minúsculas), para metadata chica. */
export function fechaCortaMono(iso: string, idioma: IdiomaSoportado): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso.slice(0, 10).toLowerCase();
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  const mes = new Intl.DateTimeFormat(locale, { month: 'short' })
    .format(new Date(a, m - 1, d))
    .replace('.', '')
    .toLowerCase();
  return `${String(d).padStart(2, '0')} ${mes} ${a}`;
}
