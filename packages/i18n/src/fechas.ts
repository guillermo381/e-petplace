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

/**
 * DÍA DE SEMANA CORTO — "lun" / "mon". La tira de días y los ejes de
 * barras (S86: D-645 cobrada).
 *
 * ⚠️ NACIÓ TARDE Y ESO ES EL PUNTO. La condición de promoción estaba
 * ESCRITA —el HOY del prestador decía en su comentario *"su día en
 * `packages/i18n` llega con el TERCER consumidor"*— y para cuando se
 * cobró había **SEIS** sitios con la misma llamada a `Intl`: dos del
 * prestador (HOY · mascotas) y cuatro del cliente (los explorar de
 * veterinaria, adiestramiento, grooming y paseo).
 *
 * **La letra estaba bien y nadie la leyó, porque vivía en un comentario
 * de UNA de las copias** — el lugar donde solo la mira quien ya está
 * mirando esa copia. *Una condición de promoción que no la cuenta
 * nadie no es una condición: es una intención.*
 * ⇒ hoy la cuenta `scripts/verify-promociones.mjs`, que sale ROJO al
 * pasar el umbral. Ver D-645.
 *
 * Fecha-sola por partes literales, jamás `new Date(iso)` (D-312).
 */
export function diaSemanaCorto(iso: string, idioma: IdiomaSoportado): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  // Degrada al número de día — NUNCA a una fecha inventada (L-197).
  if (!a || !m || m < 1 || m > 12 || !d) return iso.slice(8, 10);
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  return new Intl.DateTimeFormat(locale, { weekday: 'short' })
    .format(new Date(a, m - 1, d))
    .replace('.', '');
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
