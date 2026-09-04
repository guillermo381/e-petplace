// _shared/ia/mod.ts — LA PUERTA ÚNICA DE LA IA DE LA CASA (S113-D, lote 0).
//
// ── POR QUÉ VIVE ACÁ Y NO EN `packages/ia` — MEDIDO, NO SUPUESTO ────────────
// Se plantó una sonda real: un `packages/ia-prueba/mod.ts` y una edge que lo
// importaba con `../../../packages/...`. El aislamiento de la casa
// (`scripts/verify-edge-deno.mjs:165` copia **sólo** `supabase/functions` a un
// temp fuera del repo) devolvió, literal:
//
//   TS2307 [ERROR]: Cannot find module 'file:///private/tmp/packages/ia-prueba/mod.ts'
//
// El `../../../` se escapa del árbol que viaja. **`packages/` no acompaña a una
// edge.** En cambio `_shared` sí — es el mecanismo probado de la casa, con 14
// importadores vivos (`sesion.ts`, `papel.ts`, `despacho.ts`, `iva.ts`).
//
// ⚠️ Y el hallazgo que salió de paso, que se REPORTA y no se cura acá: el gate
//    `verify:edge-deno` dio **VERDE (exit 0) con la sonda rota adentro** —
//    `TS2307` cae en su bucket «fuera de clase, declarados y NO gateados». O
//    sea que un import a `packages/*` reventaría en despliegue **con el gate en
//    verde**. No se ensancha acá: la propia cabecera de ese gate documenta que
//    ensancharlo ya fracasó una vez (20 rojos, casi todos falsos).
//
// ── QUÉ HACE ────────────────────────────────────────────────────────────────
// Una sola función para las cuatro piezas. El modelo, el `max_tokens`, el
// timeout y el caché salen de `modelos.ts` — **medidos de lo que cada edge ya
// hacía**. En el lote 0 **no cambia ningún modelo ni ningún prompt**: el cuerpo
// que sale a Anthropic es byte a byte el mismo que salía, salvo el
// `cache_control` de `presencia`.
//
// ── LO QUE NO HACE ──────────────────────────────────────────────────────────
// No decide contratos de producto. Devuelve el error TIPADO y **cada edge lo
// mapea a su propio código y su propio mensaje**, exactamente los de hoy: por
// eso el error trae `estadoHttp` y `detalle`. *Unificar la puerta no es
// unificar la voz — la voz es de cada superficie.*

import type { Pieza } from './modelos.ts'
import { CACHEAR_SISTEMA, MAX_TOKENS, MODELOS, TIMEOUT_MS } from './modelos.ts'
import { registrarUso, type Uso, usoDesdeRespuesta, usoSinRespuesta } from './uso.ts'

export type { Pieza } from './modelos.ts'
export type { Uso } from './uso.ts'

const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const VERSION_API = '2023-06-01'

/** Reintentos y espera creciente. Sólo ante 429/5xx — jamás ante 4xx. */
const REINTENTOS = 2
const ESPERAS_MS = [500, 1500]

export interface Imagen {
  mediaType: string
  base64: string
}

export interface Mensaje {
  rol: 'user' | 'assistant'
  texto: string
}

export interface PedidoIa {
  pieza: Pieza
  /** Bloque `system`. Sólo `presencia` lo usa hoy (medido). */
  sistema?: string
  mensajes: Mensaje[]
  /** Van ADELANTE del texto del primer mensaje — el orden que ya tenían las
   *  dos edges de imagen (`content: [image, text]`). */
  imagenes?: Imagen[]
  salida: 'json' | 'texto'
  /** Escape hatch. Sin esto manda `MAX_TOKENS[pieza]`, que es lo medido. */
  maxTokens?: number
  /** Sin esto manda `CACHEAR_SISTEMA[pieza]`, que es lo decidido con número. */
  cachearSistema?: boolean
}

/**
 * `detalle` existe para que cada edge conserve su mensaje de hoy al pie de la
 * letra. Sin él, un `error_parseo` no distinguiría un truncado de un JSON roto
 * y las cuatro edges tendrían que cambiarle el texto a la familia.
 */
export type DetalleError =
  | 'sin_credencial'
  | 'no_ok'
  | 'respuesta_no_json'
  | 'sin_texto'
  | 'truncado'
  | 'json_invalido'

export type RespuestaIa =
  | { ok: true; datos: unknown; uso: Uso }
  | {
    ok: false
    error: 'timeout' | 'error_proveedor' | 'error_parseo' | 'rechazo'
    detalle?: DetalleError
    /** Status de Anthropic. `0` cuando no hubo respuesta (sin credencial, red). */
    estadoHttp?: number
    uso?: Uso
  }

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Quita las cercas de código y parsea. Sin fallback: si no parsea, es rojo. */
function parsearJson(texto: string): { ok: true; datos: unknown } | { ok: false } {
  const limpio = texto.replace(/```json|```/g, '').trim()
  try {
    return { ok: true, datos: JSON.parse(limpio) }
  } catch {
    // Los primeros 200 caracteres van al LOG de la edge, jamás a `ia_uso`.
    console.error('[ia] salida no parseable (200 chars):', limpio.slice(0, 200))
    return { ok: false }
  }
}

/** Arma el cuerpo. **Byte a byte el de hoy**, salvo el caché de `presencia`. */
function construirCuerpo(p: PedidoIa, cachear: boolean): Record<string, unknown> {
  const contenidoImagenes = (p.imagenes ?? []).map((img) => ({
    type: 'image',
    source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
  }))

  const messages = p.mensajes.map((m, i) => ({
    role: m.rol,
    // Las imágenes van sólo en el primer mensaje y ANTES del texto: es el
    // orden que `extract-vacuna` y `extract-documento` ya tenían.
    content: i === 0
      ? [...contenidoImagenes, { type: 'text', text: m.texto }]
      : [{ type: 'text', text: m.texto }],
  }))

  const cuerpo: Record<string, unknown> = {
    model: MODELOS[p.pieza],
    max_tokens: p.maxTokens ?? MAX_TOKENS[p.pieza],
  }

  if (p.sistema !== undefined) {
    // Sin caché el `system` sale como string plano — idéntico a hoy. Con caché
    // sale como bloque, que es la ÚNICA forma de marcarlo: el `cache_control`
    // de nivel superior cachearía el ÚLTIMO bloque, que acá es el material del
    // prestador y cambia en cada llamada — escribiría una entrada que nadie
    // lee nunca.
    cuerpo.system = cachear
      ? [{ type: 'text', text: p.sistema, cache_control: { type: 'ephemeral' } }]
      : p.sistema
  }

  cuerpo.messages = messages
  return cuerpo
}

/**
 * La puerta. Llama al modelo de la pieza, **registra el uso pase lo que pase**
 * y devuelve un resultado tipado.
 */
export async function llamarModelo(p: PedidoIa): Promise<RespuestaIa> {
  const modelo = MODELOS[p.pieza]
  const cachear = p.cachearSistema ?? CACHEAR_SISTEMA[p.pieza]
  const arranque = Date.now()

  const fallar = async (
    error: 'timeout' | 'error_proveedor' | 'error_parseo' | 'rechazo',
    detalle?: DetalleError,
    estadoHttp?: number,
  ): Promise<RespuestaIa> => {
    const uso = usoSinRespuesta(Date.now() - arranque)
    await registrarUso(p.pieza, modelo, error, uso)
    return { ok: false, error, detalle, estadoHttp, uso }
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return await fallar('error_proveedor', 'sin_credencial', 0)

  const cuerpo = JSON.stringify(construirCuerpo(p, cachear))

  let respuesta: Response | null = null
  let textoRespuesta = ''

  for (let intento = 0; intento <= REINTENTOS; intento++) {
    const abortador = new AbortController()
    const reloj = setTimeout(() => abortador.abort(), TIMEOUT_MS[p.pieza])
    try {
      respuesta = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': VERSION_API,
        },
        body: cuerpo,
        signal: abortador.signal,
      })
      textoRespuesta = await respuesta.text()
    } catch (e) {
      // Un timeout NO se reintenta: el mandato limita el reintento a 429/5xx, y
      // reintentar algo que ya tardó 2 minutos es apilar 2 minutos más.
      const abortado = abortador.signal.aborted
      clearTimeout(reloj)
      console.error('[ia] fetch falló:', String(e))
      return await fallar(abortado ? 'timeout' : 'error_proveedor', 'no_ok', 0)
    }
    clearTimeout(reloj)

    const reintentable = respuesta.status === 429 || respuesta.status >= 500
    if (!reintentable || intento === REINTENTOS) break
    console.error(`[ia] ${respuesta.status} — reintento ${intento + 1}/${REINTENTOS}`)
    await dormir(ESPERAS_MS[intento])
  }

  if (!respuesta!.ok) {
    console.error('[ia] Anthropic non-ok:', respuesta!.status, textoRespuesta)
    return await fallar('error_proveedor', 'no_ok', respuesta!.status)
  }

  let data: {
    content?: { type: string; text?: string }[]
    stop_reason?: string
    usage?: unknown
  }
  try {
    data = JSON.parse(textoRespuesta)
  } catch {
    console.error('[ia] respuesta de Anthropic no es JSON:', textoRespuesta.slice(0, 200))
    return await fallar('error_proveedor', 'respuesta_no_json', respuesta!.status)
  }

  // Desde acá SÍ hay `usage`: todo lo que siga se registra con tokens reales.
  const uso = usoDesdeRespuesta(data.usage, Date.now() - arranque)
  const fallarConUso = async (
    error: 'error_parseo' | 'rechazo',
    detalle?: DetalleError,
  ): Promise<RespuestaIa> => {
    await registrarUso(p.pieza, modelo, error, uso)
    return { ok: false, error, detalle, estadoHttp: respuesta!.status, uso }
  }

  if (data.stop_reason === 'refusal') {
    console.error('[ia] el modelo rechazó la solicitud (stop_reason refusal)')
    return await fallarConUso('rechazo')
  }
  if (data.stop_reason === 'max_tokens') {
    console.error('[ia] respuesta truncada por max_tokens')
    return await fallarConUso('error_parseo', 'truncado')
  }

  const bloque = data.content?.find((b) => b.type === 'text')?.text
  if (typeof bloque !== 'string') {
    console.error('[ia] la respuesta no trae bloque de texto')
    return await fallarConUso('error_parseo', 'sin_texto')
  }

  if (p.salida === 'texto') {
    await registrarUso(p.pieza, modelo, 'ok', uso)
    return { ok: true, datos: bloque, uso }
  }

  const parseado = parsearJson(bloque)
  if (!parseado.ok) return await fallarConUso('error_parseo', 'json_invalido')

  await registrarUso(p.pieza, modelo, 'ok', uso)
  return { ok: true, datos: parseado.datos, uso }
}
