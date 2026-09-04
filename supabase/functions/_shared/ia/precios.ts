// _shared/ia/precios.ts — LA COSTURA DEL COSTO (S113-D, lote 0).
//
// ── ✅ LA TABLA YA ESTÁ (S113-E, 3-sep-2026) ────────────────────────────────
// E la entregó y esta costura quedó llena. La cabecera original de D se
// conserva abajo porque explica POR QUÉ nació vacía y cuál era el bloqueante;
// borrarla dejaría el archivo sin su historia. **El bloqueante que nombraba ya
// no rige.**
//
// ── (histórico de D) ESTA TABLA NO ERA MÍA Y NACIÓ VACÍA, A PROPÓSITO ───────
// El mandato es explícito: *«`costo_estimado_usd` se calcula con la tabla de
// precios de E (constante exportada por E, con fecha); si E no la entregó
// todavía, NULL y lo decís»*.
//
// **MEDIDO al cerrar el lote 0 (base dd40e37e):** E no la entregó. Evidencia:
// `grep -rn "ia_uso\|PRECIOS_IA\|costo_estimado_usd"` sobre todo el repo →
// **cero hits**, y `git log dd40e37e..pista/s113-e` → **vacío**.
//
// ⇒ Por eso `costoEstimadoUsd()` devuelve **`null`, jamás un número plausible**.
// *Un costo inventado es peor que un costo ausente: el ausente se llena, el
// inventado se suma y se reporta.*
//
// ── CÓMO SE DESTRABA, CON EL BLOQUEANTE NOMBRADO ────────────────────────────
// El día que E exporte su constante, esto es UNA línea: se llena `PRECIOS` con
// su tabla (y su `FECHA_PRECIOS`) o se importa directo de donde la deje. No
// hace falta tocar `mod.ts`, `uso.ts` ni ninguna edge — la costura está acá y
// sólo acá. *Una deuda con su bloqueante nombrado alguien la destraba; una
// «pendiente» espera para siempre.*

/** USD por millón de tokens. Vacío hasta que E entregue el suyo — ver cabecera. */
export interface PrecioModelo {
  entrada: number
  salida: number
  cache_lectura: number
  cache_escritura: number
}

/**
 * Fecha en que estos precios se leyeron de la lista OFICIAL de Anthropic
 * (`https://platform.claude.com/docs/en/about-claude/pricing`). No de un blog,
 * no de memoria. Al tocar cualquier número se re-lee la lista y se mueve esta
 * fecha: *un precio sin fecha de verificación es un precio inventado con buena
 * letra.*
 */
export const FECHA_PRECIOS: string | null = '2026-09-03'

/** De dónde salieron. */
export const FUENTE_PRECIOS =
  'https://platform.claude.com/docs/en/about-claude/pricing'

/**
 * Qué tokenizador usa el modelo — **campo aditivo de E, no lo usa
 * `costoEstimadoUsd`**, y por eso no cambia nada de lo que D construyó.
 *
 * 🔴 Existe porque cambia el resultado de toda comparación entre modelos.
 * Nota oficial: *«Claude 4.7 and later models use a newer tokenizer […]
 * produces approximately 30% more tokens for the same text […] Claude Sonnet
 * 4.6 and earlier models use the previous tokenizer.»*
 * ⇒ **Sonnet 5 tokeniza con el NUEVO; Haiku 4.5 con el VIEJO.** Para el MISMO
 * carnet, Sonnet 5 emite ~1,3× los tokens ⇒ el cociente de precios ($2 vs $1)
 * **subestima** el ahorro real, que en entrada es ≈2,6:1.
 * *Comparar $/MTok entre dos modelos que tokenizan distinto es comparar dos
 * unidades con el mismo nombre.* Por eso el arnés compara costo por ÍTEM
 * medido, nunca $/MTok.
 */
export type Tokenizador = 'nuevo' | 'previo'
export const TOKENIZADOR: Record<string, Tokenizador> = {
  'claude-sonnet-5': 'nuevo',
  'claude-haiku-4-5': 'previo',
  'claude-opus-5': 'nuevo',
}

/** El lote (Batch API) descuenta 50 % sobre entrada y salida. */
export const DESCUENTO_LOTE = 0.5

/**
 * USD por millón de tokens. VERIFICADOS el 2026-09-03 contra la lista oficial.
 *
 * `cache_escritura` es la de **5 minutos** (1,25 × entrada), que es la que usa
 * la casa. La de 1 hora (2 × entrada) no se guarda: hoy nadie la usa, y una
 * perilla que nadie mueve es una perilla que envejece mal.
 *
 * 🔴 **UNA CORRECCIÓN QUE VALE ANOTAR:** la mesa daba por cierto que Sonnet 5
 * había subido a $3/$15 al vencer su precio de introducción el 31-ago-2026.
 * **La lista oficial dice lo contrario, con todas las letras:** *«The $2/$10
 * […] pricing for Claude Sonnet 5, announced at launch as introductory pricing
 * through August 31, 2026, is now the standard price. The previously scheduled
 * increase to $3/$15 […] on September 1, 2026 will not occur.»*
 * El aumento estaba anunciado y **se canceló**. Rige $2 / $10.
 */
export const PRECIOS: Record<string, PrecioModelo> = {
  'claude-sonnet-5':  { entrada: 2, salida: 10, cache_lectura: 0.2,  cache_escritura: 2.5 },
  'claude-haiku-4-5': { entrada: 1, salida: 5,  cache_lectura: 0.1,  cache_escritura: 1.25 },
  'claude-opus-5':    { entrada: 5, salida: 25, cache_lectura: 0.5,  cache_escritura: 6.25 },
}

/**
 * Costo estimado de una llamada, o `null` si no hay precio para ese modelo.
 *
 * Devuelve `null` en DOS casos y los dos son honestos: la tabla está vacía
 * (hoy), o el modelo no figura en ella (un modelo nuevo sin precio cargado).
 * En ninguno se adivina.
 */
export function costoEstimadoUsd(
  modelo: string,
  uso: {
    tokens_entrada: number | null
    tokens_salida: number | null
    tokens_cache_lectura: number | null
    tokens_cache_escritura: number | null
  },
): number | null {
  const p = PRECIOS[modelo]
  if (!p) return null
  // Si el proveedor no reportó tokens, no hay costo que calcular: NULL, no 0.
  if (uso.tokens_entrada === null && uso.tokens_salida === null) return null

  const porMillon = (tokens: number | null, precio: number) =>
    tokens === null ? 0 : (tokens / 1_000_000) * precio

  const total =
    porMillon(uso.tokens_entrada, p.entrada) +
    porMillon(uso.tokens_salida, p.salida) +
    porMillon(uso.tokens_cache_lectura, p.cache_lectura) +
    porMillon(uso.tokens_cache_escritura, p.cache_escritura)

  // numeric(10,6) en la tabla: se redondea acá para no mandar más precisión de
  // la que la columna puede guardar.
  return Math.round(total * 1_000_000) / 1_000_000
}
