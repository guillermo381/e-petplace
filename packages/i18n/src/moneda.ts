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

/* ═══════════════════════════════════════════════════════════════════════════
 * 🔴 MARCA S115-B — FIRMA DEL FOUNDER (10-sep-2026): **EL FORMATO DE LA PLATA
 *    DE LA CASA ES PUNTO.** Su literal:
 *
 *    *«es lo que la gente ya ve en el checkout y en PrecioText, y migrar a
 *    coma sería cambiar el número que el producto muestra sin que nadie lo
 *    pida… un formateador que contradice al resto y espera a que alguien lo
 *    llame de buena fe es justamente el modo de falla que acabamos de
 *    nombrar.»*
 *
 * ⇒ **LA FUENTE DE VERDAD DEL FORMATO ES `formatearPrecio` de `PrecioText`**
 *   (`packages/ui`). Si algún día se decide coma, **es una línea ahí** y lo
 *   hereda todo el producto.
 *
 * ── PERO ESTA FUNCIÓN NO SE RETIRÓ, Y LA RAZÓN ES UNA MEDICIÓN ────────────
 * La firma ofrecía *«retiralo o marcalo»* sobre la premisa de que **no lo
 * llamaba nadie** — premisa que venía de un reporte MÍO de la tanda 1, y
 * **era falsa**: lo que no llama nadie es el hook `useMoneda`, no este riel.
 *
 * Medido el 10-sep: **8 consumidores, 7 VIVOS y todos del prestador**:
 *   `app/historico` · `app/ventas/facturacion` · `app/ventas/mostrador` ·
 *   `app/ventas/pedido/[pedidoId]` · `app/ventas/producto/[productoId]` ·
 *   `components/ventana-pedidos` · `components/vitrina-piezas`
 * más `apps/cliente/src/lib/use-moneda.ts`, que sí está muerto.
 * **Retirarlo rompía siete pantallas vivas.**
 *
 * ⚠️ Y el 8 **corrigió a mi propio censo, que había dicho 5**: mi `grep` medía
 * el import en UNA línea y `grep` trabaja línea por línea, así que perdía los
 * imports MULTILÍNEA. *Lo cazó el gate al correr sobre el corpus real* — un
 * censo por patrón acota, no cierra.
 *
 * ── LA DIVERGENCIA ESTÁ VIVA HOY, Y NO ES SÓLO LA COMA ───────────────────
 * ```
 *                     $45        $1234.50
 *   monto()  es  →  $45,00      $1.234,50
 *   monto()  en  →  $45.00      $1,234.50
 *   formatearPrecio  $45.00     $1234.50   ← sin separador de miles
 * ```
 * ⚠️ **Alinear esta función al punto NO es una línea inocua: le quita el
 * separador de MILES al prestador**, justo en liquidaciones y facturación,
 * que es donde viven los montos grandes. *Eso es una decisión de producto y
 * no la toma un riel* — queda servida al founder, con estos números.
 *
 * ── QUÉ SOSTIENE LA FIRMA MIENTRAS TANTO ─────────────────────────────────
 * **`R87` de `verify:diseno`, solo-baja desde 8.** Un consumidor NUEVO de
 * esta función sale en rojo. *La marca sola sería «una regla que alguien
 * tiene que acordarse de seguir», que es exactamente lo que la firma dice
 * que no dura; el gate es lo que la hace durar.*
 * ═══════════════════════════════════════════════════════════════════════════ */

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

/**
 * EL PRECIO POR KILO — el escalón que nadie pone.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * Vive ACÁ, junto a `monto()`, y no en la pantalla, por una razón medida:
 * **lo van a mostrar DOS superficies** — la ficha de la familia y el
 * «Ver como cliente» del vendedor, que por N17 tiene que mostrar
 * exactamente lo mismo. *Dos cálculos que hoy dan igual coinciden por
 * copia, que es la forma más frágil de coincidir* — y acá el que se
 * desalinee no rompe nada visible: **le dice al vendedor un número y a la
 * familia otro**, que es peor que un error, porque nadie lo ve.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── EL NULO ES HONESTO, y son TRES casos, no uno ───────────────────────
 * Devuelve `null` —y quien la llama NO dibuja nada— cuando:
 *   · **no hay peso declarado** (`null`): la variante existe y su peso no;
 *     inventarlo sería fabricar el dato que hace valioso al cálculo.
 *   · **el peso es 0 o negativo**: dato malo. Dividir daría `Infinity` o un
 *     número con signo, y los dos se pintarían como si fueran precio.
 *   · **el precio no es finito**.
 *
 * *No se devuelve «—» ni «s/d»: el que decide cómo se ve una ausencia es
 * la pantalla, no el formateador.*
 *
 * ── LA FORMA LA FIRMÓ LA MESA, y el registro ES el mensaje ─────────────
 * Se muestra en **mono** (`Texto variante="dato"`), secondary, **debajo del
 * precio**. Mono porque **es un dato derivado por una máquina** (Ley 3), y
 * esa diferencia tipográfica es la que hace que se lea como *cálculo* — que
 * es justo su valor: *nadie lo pone; nosotros sí.*
 *
 * El sufijo `/ kg` **no se traduce**: `kg` es el símbolo SI y es el mismo en
 * los dos idiomas (mismo criterio que el símbolo de la moneda, que tampoco
 * viaja por diccionario).
 */
export function precioPorKg(
  precio: number,
  pesoKg: number | null,
  config: ConfigMoneda,
  idioma: IdiomaSoportado,
): string | null {
  if (pesoKg === null || !Number.isFinite(pesoKg) || pesoKg <= 0) return null;
  if (!Number.isFinite(precio)) return null;
  return `${monto(precio / pesoKg, config, idioma)} / kg`;
}
