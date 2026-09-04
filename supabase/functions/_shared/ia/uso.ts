// _shared/ia/uso.ts — EL REGISTRO DE USO (S113-D, lote 0).
//
// ── QUÉ HABÍA ANTES: NADA. MEDIDO ───────────────────────────────────────────
// `grep -E "usage|input_tokens|output_tokens|\.insert\(|createClient"` sobre
// las cuatro edges → **0 hits en las cuatro**. Control positivo del mismo grep
// sobre `despachar-push/index.ts` → 2 hits (`createClient`, `.insert`), o sea
// que el grep sí encuentra lo que busca. **No se sabía cuánto cuesta la IA de
// esta casa porque nadie lo estaba escribiendo.**
//
// ── 🔴 LA LEY QUE GOBIERNA ESTE ARCHIVO ─────────────────────────────────────
// **El registro JAMÁS puede romper el producto.** Si la tabla no existe, si la
// credencial falta, si la red se cae — se loguea y se sigue. Una familia no se
// queda sin leer su carnet porque no pudimos anotar cuántos tokens costó.
// *Por eso `registrarUso` no lanza nunca y no devuelve nada que el llamador
// deba mirar.*
//
// Hoy esto importa de verdad: **la tabla `ia_uso` todavía NO EXISTE** (medido:
// cero migraciones con ese nombre; la crea E). O sea que hasta que E la cree,
// cada llamada va a loguear un fallo de registro y **las cuatro edges van a
// seguir funcionando igual que hoy**. Eso es el diseño, no un accidente.
//
// ── 🔴 CERO DATO PERSONAL ───────────────────────────────────────────────────
// Acá no entra ni un `mascota_id`, ni un `user_id`, ni una línea del dictado
// del vet, ni un dígito de una cédula, ni el texto del prompt. Se anota QUÉ
// pieza corrió, con QUÉ modelo, CÓMO salió y CUÁNTO costó. Nada más.
// *El texto de un error de parseo va al log de la edge — que es efímero y de
// operación —, nunca a esta tabla.*

import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Pieza } from './modelos.ts'
import { EDGES } from './modelos.ts'
import { costoEstimadoUsd } from './precios.ts'

/** Cómo terminó la llamada. Vocabulario CERRADO — espeja el contrato de E. */
export type ResultadoUso =
  | 'ok'
  | 'timeout'
  | 'error_proveedor'
  | 'error_parseo'
  | 'rechazo'

/**
 * Tokens de una llamada. **`null` cuando el proveedor no los reportó — jamás
 * cero.** Un cero dice «costó cero»; un null dice «no sé», y son cosas
 * distintas: si un timeout se anotara con ceros, el promedio de tokens de la
 * casa quedaría diluido por llamadas que nunca respondieron.
 */
export interface Uso {
  tokens_entrada: number | null
  tokens_salida: number | null
  tokens_cache_lectura: number | null
  tokens_cache_escritura: number | null
  latencia_ms: number
}

/** El `usage` crudo de Anthropic → nuestro `Uso`. Campo ausente = null. */
export function usoDesdeRespuesta(usage: unknown, latenciaMs: number): Uso {
  const u = (usage ?? {}) as Record<string, unknown>
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null)
  return {
    tokens_entrada: num(u.input_tokens),
    tokens_salida: num(u.output_tokens),
    tokens_cache_lectura: num(u.cache_read_input_tokens),
    tokens_cache_escritura: num(u.cache_creation_input_tokens),
    latencia_ms: latenciaMs,
  }
}

/** Uso de una llamada que no llegó a respuesta: sólo se sabe cuánto tardó. */
export function usoSinRespuesta(latenciaMs: number): Uso {
  return {
    tokens_entrada: null,
    tokens_salida: null,
    tokens_cache_lectura: null,
    tokens_cache_escritura: null,
    latencia_ms: latenciaMs,
  }
}

/**
 * Escribe UNA fila en `public.ia_uso`, con `service_role`.
 *
 * Una fila por llamada a `llamarModelo` — no una por intento. Los reintentos
 * que fallaron no producen `usage`, y sumar filas vacías inflaría el conteo de
 * llamadas de la casa.
 *
 * **No lanza nunca.** Ver la ley de la cabecera.
 */
export async function registrarUso(
  pieza: Pieza,
  modelo: string,
  resultado: ResultadoUso,
  uso: Uso,
): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const clave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !clave) {
      console.error('[ia_uso] sin SUPABASE_URL/SERVICE_ROLE_KEY: no se registra')
      return
    }
    const supabase = createClient(url, clave)
    const { error } = await supabase.from('ia_uso').insert({
      pieza,
      modelo,
      edge: EDGES[pieza],
      resultado,
      tokens_entrada: uso.tokens_entrada,
      tokens_salida: uso.tokens_salida,
      tokens_cache_lectura: uso.tokens_cache_lectura,
      tokens_cache_escritura: uso.tokens_cache_escritura,
      latencia_ms: uso.latencia_ms,
      costo_estimado_usd: costoEstimadoUsd(modelo, uso),
    })
    if (error) {
      // El caso vivo HOY: la tabla todavía no existe (la crea E).
      console.error('[ia_uso] no se pudo registrar:', error.message)
    }
  } catch (e) {
    console.error('[ia_uso] excepción registrando:', String(e))
  }
}
