/**
 * Formato de fecha ÚNICO del riel (S53-B2c.1) — la voz de máquina
 * "03 ago 2023" / "03 aug 2023" por idioma vía Intl. Cero formateos
 * artesanales por pantalla: TODOS los módulos consumen esta función
 * (la cura Intl de S52 llegó a LineaDeVida; esta la vuelve ley).
 */

import type { IdiomaSoportado } from './idiomas';

/** Fecha larga en voz HUMANA por idioma — "7 de julio" / "July 7"
 *  (S55-A A3, cierra D-323/H1: nace acá al tocarse la primera pantalla
 *  que la necesitaba — el detalle del paseo la armaba artesanal). Sin
 *  año: es voz de título/contexto, no metadata (esa es la corta). */
export function fechaLargaHumana(iso: string, idioma: IdiomaSoportado): string {
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  // Timestamp con hora → día LOCAL del dispositivo (un paseo de la noche
  // en UTC-5 no puede saltar de día). Fecha-sola → partes literales
  // (jamás por Date(iso): la medianoche UTC corre el día — D-312).
  if (iso.length > 10) {
    const f = new Date(iso);
    if (Number.isNaN(f.getTime())) return iso.slice(0, 10);
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(f);
  }
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(a, m - 1, d));
}

/** Fecha con DÍA DE SEMANA en voz humana por idioma — "Lunes, 13 de julio" /
 *  "Monday, July 13" (S57-B1: headers de día de la agenda semanal; cura
 *  también el es-EC fijo del header de HOY — hallazgo D-315p). Fecha-sola
 *  por partes literales (jamás Date(iso) — D-312); sin año: voz de título. */
export function fechaDiaSemanaHumana(iso: string, idioma: IdiomaSoportado): string {
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso.slice(0, 10);
  const s = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(a, m - 1, d),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
