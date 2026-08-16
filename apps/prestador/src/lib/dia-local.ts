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
