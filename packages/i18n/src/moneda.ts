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
 * ⏪☠️ MARCA S115-B · **ENMENDADA POR EL FOUNDER EL MISMO DÍA — y se deja
 *    escrita, no borrada, porque el arco es lo que evita que la próxima mesa
 *    lo vuelva a decidir sin los números.**
 *
 * **① Primera firma (10-sep): «EL FORMATO DE LA CASA ES PUNTO»**, con su
 *    razón: *«es lo que la gente ya ve en el checkout y en PrecioText, y
 *    migrar a coma sería cambiar el número que el producto muestra sin que
 *    nadie lo pida»*.
 *
 * **② El dato que la dio vuelta**, medido al ir a ejecutarla: la premisa era
 *    que **este riel no lo llamaba nadie** —premisa que venía de un reporte
 *    MÍO de la tanda 1, y era falsa: lo que no llama nadie es el hook
 *    `useMoneda`—. Medido: **8 consumidores, 7 VIVOS y todos del prestador**
 *    (`historico` · `ventas/facturacion` · `ventas/mostrador` ·
 *    `ventas/pedido` · `ventas/producto` · `ventana-pedidos` ·
 *    `vitrina-piezas`). Y la diferencia **no era sólo el separador decimal**:
 *    `formatearPrecio` **no tenía separador de MILES**.
 *
 * **③ ☠️ LA ENMIENDA — el founder firma al revés**, con su razón:
 *    *«un payout sin separador de miles se lee mal justo donde el prestador
 *    mira cuánto cobra… y no hay un solo cliente real todavía: hoy es gratis,
 *    en octubre no»*. Y después la cerró: **COMA DECIMAL Y PUNTO DE MILES,
 *    sin excepciones**, *«es el formato ecuatoriano y el de los RIDE que el
 *    cliente va a recibir del SRI — la app no puede decir un número distinto
 *    del que dice su factura»*.
 *
 * ⇒ **`formatearPrecio` no se retiró ni se alineó al punto: ADOPTÓ el formato
 *   y bajó acá como fuente única** (ver el bloque de abajo). *Retirar este
 *   riel habría roto siete pantallas vivas; alinearlo al punto le habría
 *   quitado los miles a liquidaciones.*
 *
 * ⚠️ Y el 8 **corrigió a mi propio censo, que había dicho 5**: mi `grep` medía
 * el import en UNA línea y `grep` trabaja línea por línea, así que perdía los
 * MULTILÍNEA. *Lo cazó el gate al correr sobre el corpus real.*
 *
 * **Lo que sostiene la firma:** `R87` (nadie formatea con otro riel), `R88`
 * (nadie parsea plata a mano) y `R89` (ningún monto formateado viaja a un
 * payload), más `verify:plata`, que mide este archivo.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
 * LA FUENTE ÚNICA DEL FORMATO DE PLATA — firma del founder (10-sep-2026).
 *
 * **COMA DECIMAL Y PUNTO DE MILES, en toda la casa, sin excepciones:**
 * `$45,00` · `$1.234,50` · `$0,99`.
 *
 * 🔴 **LA RAZÓN NO ES ESTÉTICA:** *«es el formato ecuatoriano y el de los RIDE
 * que el cliente va a recibir del SRI — la app no puede decir un número
 * distinto del que dice su factura»*. Y el separador de miles **no puede
 * faltar en liquidaciones**, que es donde el prestador mira cuánto cobra.
 *
 * ⚠️ **NO DEPENDE DEL IDIOMA, y está firmado:** *«la factura dice el mismo
 * número en los dos idiomas, y la app tiene que decir lo mismo que la
 * factura»*. Antes `monto()` daba `$1,234.50` en inglés; ahora da
 * `$1.234,50` en los dos.
 *
 * ── POR QUÉ VIVE ACÁ Y NO EN `packages/ui` ────────────────────────────────
 * La firma pedía que `formatearPrecio` (de `PrecioText`) fuera la fuente y que
 * `monto()` delegara en ella. **Medido: `packages/ui` YA depende de
 * `packages/i18n`** —su `package.json` lo declara— así que un import al revés
 * sería un **CICLO**. ⇒ el formato baja al riel, que es donde ya vive el de
 * las fechas, y **`PrecioText.formatearPrecio` pasa a re-exportarlo**: los
 * consumidores no cambian una línea y la fuente sigue siendo una sola.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Los decimales de la casa. Vive acá y no repetido en cada llamada. */
const DECIMALES = 2

/**
 * EL formato de plata. **Recibe un número y devuelve el texto** — nunca al
 * revés, y nunca convierte moneda (ver `monto` para eso).
 *
 * `es-EC` produce exactamente el formato firmado; **se fija el locale y no se
 * lee el del usuario**, porque el número tiene que coincidir con el de la
 * factura en los dos idiomas.
 */
export function formatearPrecio(valor: number, simbolo = '$', decimales = DECIMALES): string {
  const numero = new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
  return `${simbolo}${numero}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * `parsearPrecio` — EL PAR INVERSO. Una verdad leída en las dos direcciones.
 *
 * 🔴 **POR QUÉ NACE, y es un defecto MEDIDO, no una precaución:** con el
 * separador de miles, el parseo que la casa tenía —`.replace(',', '.')` y
 * `parseFloat`— devuelve **un número plausible y equivocado**:
 * ```
 *   '1.234,50' → replace(',', '.') → '1.234.50' → parseFloat → 1.234
 * ```
 * Y lo caro no es el número: **`SliderPrecio` se protege con
 * `Number.isFinite`, y `1.234` ES finito** ⇒ la protección no se disparaba y
 * la edición quedaba activa sobre un riel mal numerado. *El guard existía y el
 * defecto pasaba por debajo.*
 *
 * ── LO QUE SE HACE INEXPRESABLE (firma del founder) ──────────────────────
 * *«que un parseo fallido devuelva algo que NO es finito, para que
 * `Number.isFinite` vuelva a servir de guard»*.
 *
 * ⇒ **se valida la FORMA antes de parsear.** En el formato de la casa el punto
 * SIEMPRE separa grupos de TRES dígitos y la coma SIEMPRE es decimal, así que
 * un texto cuyo punto no separe un grupo de tres **no es un precio de esta
 * casa** y devuelve `NaN`:
 * ```
 *   '1.234,50' → 1234.5   ✓   (el punto separa un grupo de 3)
 *   '1234,50'  → 1234.5   ✓   (sin separador de miles, también legal)
 *   '25,00'    → 25       ✓
 *   '1234.50'  → NaN      ✓   ← formato AJENO (punto decimal): se RECHAZA
 * ```
 * **El último es el que importa.** Sin la validación de forma daría `123450`
 * —cien veces el valor— y `Number.isFinite` lo dejaría pasar otra vez.
 * *Entre rebotar una entrada de formato ajeno y aceptar un número cien veces
 * más grande, se rebota.*
 *
 * 🔴 `L-535` — **LA LEY DEL PARSEO TOLERANTE** (firma del founder,
 * 10-sep-2026). ***Un parseo tolerante es el que devuelve el número
 * plausible.*** Por eso `NaN` ante un formato ajeno **es la cura**, y no un
 * helper permisivo al lado.
 *
 * Y es **la misma forma** con la que en esta sesión se hizo inexpresable una
 * promoción sin su precio tachado (`TarjetaServicio`, unión discriminada) y el
 * motivo de rechazo del SRI en `TarjetaFactura`: *cuando un estado no debe
 * poder existir, no se documenta que no debe existir — se hace que no se pueda
 * escribir.* Acá el estado prohibido es «un número plausible salido de un texto
 * que no entendimos».
 *
 * ⚠️ **Y por eso NO hay dos helpers, uno estricto y otro tolerante:** el
 * tolerante sería exactamente el que devuelve el número plausible. La app
 * MUESTRA el formato en pantalla, así que quien tipea tiene la guía a la
 * vista; y un campo que rebota es un campo que se corrige, mientras que un
 * número equivocado se cobra.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Con separador de miles: grupos de 3 tras el primero. O sin él. */
const FORMA_DE_PRECIO = /^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$|^-?\d+(,\d{1,2})?$/

/**
 * El texto a número. **`NaN` cuando el texto no es un precio de esta casa** —
 * jamás un número plausible (ver el bloque de arriba).
 *
 * Tolera el símbolo, los espacios y el signo; **no tolera otro formato**.
 */
export function parsearPrecio(texto: string): number {
  // Se quitan símbolo y espacios, no los separadores: la forma se juzga con ellos.
  const limpio = texto.replace(/[^0-9.,-]/g, '').trim();
  if (limpio === '' || !FORMA_DE_PRECIO.test(limpio)) return Number.NaN;
  return Number.parseFloat(limpio.replace(/\./g, '').replace(',', '.'));
}

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
export function monto(valor: number, config: ConfigMoneda, _idioma?: IdiomaSoportado): string {
  /* 🔴 DELEGA — no duplica el formato. Era la segunda implementación del mismo
     formateo y por eso divergía del resto de la casa.
     ⚠️ `_idioma` queda en la firma **a propósito**: sus siete consumidores vivos
     lo pasan, y sacarlo obligaría a tocar siete pantallas para un parámetro que
     ya no decide nada. **Deja de usarse, y eso ES la firma**: la factura dice el
     mismo número en los dos idiomas. Lo que SÍ sigue siendo del país son el
     símbolo y los decimales, que es lo que este riel existe para resolver. */
  return formatearPrecio(valor, config.simbolo, config.decimales);
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
