/**
 * EL DÍA LOCAL — la aritmética de fechas del prestador, en UN solo lugar.
 *
 * Nace en S99-D al montar la ventana hermana de pedidos: **necesitaba la
 * misma rueda que el HOY, y la rueda se computa con estas dos funciones.**
 * Vivían adentro de `(tabs)/index.tsx` con su trampa documentada; copiarlas
 * habría sido fabricar la divergencia el mismo día que nace la hermana —
 * y la hermana existe justamente para que las dos ventanas hablen del
 * MISMO día. *Dos aritméticas de fecha que hoy coinciden coinciden por
 * copia, que es la forma más frágil de coincidir.* (L-175: se ENSANCHA.)
 *
 * 🔴 LA TRAMPA, conservada verbatim porque es la razón de que existan:
 * **jamás `new Date(iso)` directo ni `toISOString()`** — los dos corren el
 * día en UTC−5 (D-312 · hallazgo S55). Se opera por PARTES literales.
 */

/** Fecha local del dispositivo, `YYYY-MM-DD` (`en-CA` da ese formato). */
export function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

/** Suma días en fecha LOCAL por partes literales (ver la trampa arriba). */
export function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA').format(new Date(a ?? 0, (m ?? 1) - 1, (d ?? 1) + dias));
}

/**
 * ⭐ **EL DÍA EN LA ZONA DEL NEGOCIO, no en la del teléfono** (S112-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **`hoyLocal()` EVITA EL UTC Y AUN ASÍ PUEDE PEDIR EL DÍA EQUIVOCADO.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Su `Intl` sin `timeZone` usa **la zona del DISPOSITIVO**, y ésa no tiene por
 * qué ser la del negocio: un teléfono en otra zona —o puesto en UTC— pide un
 * día y **la base contesta con el suyo**. El rojo del founder: *«a las 23:30 en
 * Quito la pantalla pide el 3 mientras la base sigue en el 2»*.
 *
 * ⚠️ **Y el modo de falla es el peor posible: NO ES UN ERROR.** El lector
 * devuelve cinco filas igual, todas en otro estado — *un cero o un estado
 * inesperado se lee como defecto de la pantalla y es el día.*
 *
 * ⇒ La zona se pasa explícita y **coincide con la que usa `hoy_local()` en la
 * base**, que es la única forma de que el día que se pide y el día que se
 * responde sean el mismo.
 *
 * 🔴 **LÍMITE DECLARADO:** el default es la zona de la casa porque **el
 * prestador todavía no publica la suya donde esta pantalla mira** — `MiPrestador`
 * trae `country_code` y no zona, y `zonaHoraria` vive **por franja** en la
 * config de guardería, que el día no lee. *Es exactamente igual de correcto que
 * hoy para un negocio en Ecuador y exactamente igual de equivocado para uno que
 * no lo esté* — con la diferencia de que ahora **no depende del teléfono**, que
 * era el defecto. Pedido a A: la zona del prestador en su fila.
 */
export const ZONA_DE_LA_CASA = 'America/Guayaquil';

export function hoyEnZona(zona: string = ZONA_DE_LA_CASA): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona }).format(new Date());
}

/**
 * La hora de un acto, **en la zona del negocio**.
 *
 * *Un sello se guarda en UTC y se lee donde ocurrió*: dibujarlo en la zona del
 * teléfono haría que una llegada de las 13:38 en Quito se lea «18:38» para
 * quien tenga el aparato en otra zona — y no hay nada que avise.
 */
export function horaEnZona(iso: string, zona: string = ZONA_DE_LA_CASA): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}
