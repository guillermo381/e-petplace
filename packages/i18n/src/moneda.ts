/**
 * EL RIEL DE MONEDA (S82-A r15) — hermano de `fechas.ts`, y por la misma
 * razón: el formateo artesanal por pantalla diverge. Hoy hay **115
 * formateos a mano** en el producto (41 `$${…}` + 74 `toFixed(2)`,
 * medidos S82) y **ninguno contempla que exista otra moneda**.
 *
 * ══ LA DISTINCIÓN QUE GOBIERNA ESTE ARCHIVO — SON DOS EJES ══
 *
 *   · **EL PAÍS gobierna LA MONEDA.** Qué se cobra: USD en Ecuador, COP
 *     en Colombia. Sale de la OPERACIÓN, jamás de la identidad del
 *     usuario — **P21, letra firmada** ("la cuenta es GLOBAL; el país es
 *     contexto de OPERACIÓN"). Un dueño ecuatoriano de viaje no empieza
 *     a pagar en otra moneda.
 *   · **EL IDIOMA gobierna EL FORMATO.** Cómo se escribe: separadores y
 *     posición del símbolo. Un dueño en Ecuador **con la app en inglés
 *     sigue pagando USD**, pero lo lee `$1,234.50` en vez de `$1.234,50`.
 *
 * Colapsarlos en uno era el defecto de la ficha vieja de D-448 ("una
 * función por idioma"): por eso esta función recibe **los dos**.
 *
 * ES PURA A PROPÓSITO: recibe la config de moneda ya resuelta, no la
 * busca. Quien la trae es `packages/api` (`obtenerConfigMoneda`, que lee
 * `country_config` — donde el dato está sembrado desde hace meses y
 * nadie lo consumía). Así el riel no depende de la DB y se puede probar
 * con valores en la mano.
 */

import type { IdiomaSoportado } from './idiomas';

/** La config de moneda de un país — espejo EXACTO de las tres columnas
 *  de `country_config` que la gobiernan (medidas: EC = USD `$` 2 ·
 *  CO = COP `$` 2). El shape viaja por estructura, no por import: el
 *  riel no conoce `packages/api`. */
export interface ConfigMoneda {
  /** ISO 4217 — 'USD' | 'COP'. */
  codigo: string;
  /** El símbolo que se pinta — hoy '$' en los dos países vivos. */
  simbolo: string;
  /** Cuántos decimales muestra esa moneda (COP en la calle usa 0; hoy la
   *  config dice 2 en ambos y **este riel obedece al dato, no a la
   *  costumbre** — si algún día CO pasa a 0, cambia la fila y nada más). */
  decimales: number;
}

/** El fallback declarado: Ecuador es el único país activo hoy
 *  (`country_config.is_active`), así que un monto sin país resuelto se
 *  lee en USD — **pero eso es una decisión, no un default silencioso**:
 *  el llamador que no puede resolver el país debería preguntarse por qué.
 *  Cuando CO se active, este fallback deja de ser inocuo. */
export const MONEDA_FALLBACK: ConfigMoneda = { codigo: 'USD', simbolo: '$', decimales: 2 };

/**
 * EL formato de plata del producto. Una sola función para las dos apps.
 *
 *   monto(45, EC, 'es')     → '$45,00'
 *   monto(45, EC, 'en')     → '$45.00'
 *   monto(1234.5, CO, 'es') → '$1.234,50'
 *
 * El símbolo va PEGADO al número (convención de los dos países vivos) y
 * el separador lo pone `Intl` según el idioma — el mismo motor que ya
 * gobierna las fechas del riel, así que no se suma dependencia.
 */
export function monto(valor: number, config: ConfigMoneda, idioma: IdiomaSoportado): string {
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  const numero = new Intl.NumberFormat(locale, {
    minimumFractionDigits: config.decimales,
    maximumFractionDigits: config.decimales,
  }).format(valor);
  return `${config.simbolo}${numero}`;
}

/**
 * El monto con su CÓDIGO de moneda, para cuando el símbolo solo sería
 * ambiguo. **Y hoy lo es de verdad: EC y CO usan los DOS el símbolo `$`**
 * — medido en `country_config` —, así que en cualquier superficie donde
 * convivan montos de países distintos, `$45` no dice nada. Esa es la
 * razón de que esta variante exista desde el día uno y no "cuando haga
 * falta": el día que CO se active, hace falta.
 *
 *   montoConCodigo(45, EC, 'es') → '$45,00 USD'
 */
export function montoConCodigo(valor: number, config: ConfigMoneda, idioma: IdiomaSoportado): string {
  return `${monto(valor, config, idioma)} ${config.codigo}`;
}
