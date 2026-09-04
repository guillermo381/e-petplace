// _shared/ia/precios.ts — LA COSTURA DEL COSTO (S113-D, lote 0).
//
// ── 🔴 ESTA TABLA NO ES MÍA Y HOY ESTÁ VACÍA, A PROPÓSITO ───────────────────
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

/** Fecha de vigencia de la tabla. `null` mientras no haya tabla. */
export const FECHA_PRECIOS: string | null = null

/** MEDIDO: vacía. La llena E (ver cabecera), no esta pista. */
export const PRECIOS: Record<string, PrecioModelo> = {}

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
