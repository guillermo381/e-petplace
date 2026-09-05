// ARNÉS DE `llamarModelo` — S113-D, lote 0.
//
// Corre con `node scripts/verify-ia-puerta.mjs`, que lo copia a un temp FUERA
// del repo (si no, `deno` muta el `package.json` del monorepo — L-490 / el
// aislamiento de `verify-edge-deno`).
//
// ── EL INSTRUMENTO ES UN SOLO INTERCEPTOR DE `fetch` ────────────────────────
// Y eso es lo que lo hace barato: el insert a `ia_uso` de supabase-js **también
// sale por `fetch`**. Un mismo interceptor ve la request a Anthropic Y la fila
// que se escribe, así que el control cruzado «los tokens de la fila == el
// `usage` de la respuesta» se mide de verdad, sin base de datos.
//
// ── LOS ROJOS SE PRODUCEN, NO SE SUPONEN ───────────────────────────────────
// Cada caso de error tiene su proveedor falso devolviendo ese fallo exacto.
// Un arnés que sólo prueba el camino feliz no está midiendo.

import { llamarModelo } from '../_shared/ia/mod.ts'
import type { Pieza } from '../_shared/ia/modelos.ts'
import {
  MAX_TOKENS, MODELOS_ADAPTIVOS, PENSAR, TECHO_SIN_RAZONAR, TIMEOUT_MS,
} from '../_shared/ia/modelos.ts'

Deno.env.set('ANTHROPIC_API_KEY', 'sk-ant-FALSA-DE-PRUEBA')
Deno.env.set('SUPABASE_URL', 'https://proyecto-falso.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-falsa')

const fetchReal = globalThis.fetch

interface Captura {
  cuerpoAnthropic: unknown
  intentos: number
  filas: Record<string, unknown>[]
}

type Falso = (intento: number, signal: AbortSignal | null) => Promise<Response> | Response

/** Instala el proveedor falso. Devuelve lo capturado y cómo desinstalarlo. */
function interceptar(falso: Falso, filaFalla = false): { cap: Captura; quitar: () => void } {
  const cap: Captura = { cuerpoAnthropic: null, intentos: 0, filas: [] }
  globalThis.fetch = ((entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada)

    if (url.includes('api.anthropic.com')) {
      cap.intentos++
      cap.cuerpoAnthropic = JSON.parse(String(init?.body ?? '{}'))
      return Promise.resolve(falso(cap.intentos, init?.signal ?? null))
    }

    if (url.includes('/rest/v1/ia_uso')) {
      cap.filas.push(JSON.parse(String(init?.body ?? '{}')))
      if (filaFalla) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: 'relation "ia_uso" does not exist' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }
      return Promise.resolve(new Response('[]', { status: 201, headers: { 'Content-Type': 'application/json' } }))
    }

    return fetchReal(entrada as string, init)
  }) as typeof fetch

  return { cap, quitar: () => { globalThis.fetch = fetchReal } }
}

const respuestaOk = (texto: string, extra: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({
      content: [{ type: 'text', text: texto }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 1234, output_tokens: 56, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      ...extra,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )

let verdes = 0
let rojos = 0
function exigir(nombre: string, condicion: boolean, visto?: unknown) {
  if (condicion) { verdes++; console.log(`  OK   ${nombre}`) }
  else { rojos++; console.log(`  ROJO ${nombre}${visto === undefined ? '' : ` — visto: ${JSON.stringify(visto)}`}`) }
}

console.log('\n== 0bis · TECHO BAJO ⇒ RAZONAMIENTO APAGADO, EXPLÍCITO ==')
console.log('  (E midió que omitir `thinking` deja a Sonnet 5 razonar solo, quemarse el')
console.log('   techo y devolver CERO CARACTERES en carnets reales. D lo aisló: mismo')
console.log('   prompt, con razonamiento gastó 6.716 y 10.895 tokens contra 2.015 y')
console.log('   1.248 sin razonar, y devolvió LAS MISMAS FILAS.)')
{
  // ── BRAZO 1 · la tabla: techo bajo ⇒ PENSAR false ────────────────────────
  // Se recorre la TABLA, no una lista aparte: la regla es *sobre* `MAX_TOKENS`,
  // así que su propia tabla es la fuente correcta. (El censo de que toda pieza
  // esté en TODAS las tablas vive en el lote 1.2, con `PIEZAS` en runtime.)
  const bajas = (Object.keys(MAX_TOKENS) as Pieza[]).filter((p) => MAX_TOKENS[p] < TECHO_SIN_RAZONAR)
  exigir(`hay piezas con techo < ${TECHO_SIN_RAZONAR} que vigilar (si no, este gate no mide nada)`,
    bajas.length > 0, bajas)
  for (const p of bajas) {
    exigir(`${p} (techo ${MAX_TOKENS[p]}) NO razona`, PENSAR[p] === false, PENSAR[p])
  }

  // ── BRAZO 2 · el CUERPO: que el campo salga de verdad a la request ───────
  // Es el que importa. La tabla puede decir `false` y el cuerpo no llevar el
  // campo: ahí el proveedor razona igual y nadie se entera hasta el truncado.
  for (const p of bajas) {
    const { cap, quitar } = interceptar(() => respuestaOk('{"a":1}'))
    await llamarModelo({
      pieza: p,
      sistema: p === 'presencia' ? 'x' : undefined,
      mensajes: [{ rol: 'user', texto: 'x' }],
      salida: 'json',
    })
    quitar()
    const cuerpo = cap.cuerpoAnthropic as Record<string, unknown>
    const modelo = String(cuerpo.model)
    if (MODELOS_ADAPTIVOS.has(modelo)) {
      exigir(`${p} manda thinking disabled ESCRITO en la request`,
        JSON.stringify(cuerpo.thinking) === '{"type":"disabled"}', cuerpo.thinking)
    } else {
      // En un modelo que no razona solo, omitirlo YA es apagarlo; mandarle una
      // forma que quizá no acepta sería estrenar un 400 para no cambiar nada.
      exigir(`${p} corre ${modelo}, que no razona solo: sin campo, y está bien`,
        cuerpo.thinking === undefined, cuerpo.thinking)
    }
    exigir(`${p} manda el techo de su tabla (${MAX_TOKENS[p]})`, cuerpo.max_tokens === MAX_TOKENS[p], cuerpo.max_tokens)
  }
}

const pedidoBase = { pieza: 'documento' as const, mensajes: [{ rol: 'user' as const, texto: 'hola' }], salida: 'json' as const }

console.log('\n== 1 · VERDE json + control cruzado de tokens ==')
{
  const { cap, quitar } = interceptar(() => respuestaOk('{"documento":{"nombre":"Ana"}}'))
  const r = await llamarModelo(pedidoBase)
  quitar()
  exigir('devuelve ok', r.ok === true)
  exigir('parsea el JSON', r.ok === true && JSON.stringify(r.datos) === '{"documento":{"nombre":"Ana"}}', r.ok && r.datos)
  exigir('escribe UNA fila', cap.filas.length === 1, cap.filas.length)
  exigir("resultado 'ok'", cap.filas[0]?.resultado === 'ok', cap.filas[0]?.resultado)
  exigir('tokens de la fila == usage de la respuesta',
    cap.filas[0]?.tokens_entrada === 1234 && cap.filas[0]?.tokens_salida === 56,
    { e: cap.filas[0]?.tokens_entrada, s: cap.filas[0]?.tokens_salida })
  exigir('pieza y edge medidos', cap.filas[0]?.pieza === 'documento' && cap.filas[0]?.edge === 'extract-documento', cap.filas[0]?.edge)
  /* 🔴 ESTE ASSERT SE DIO VUELTA, y la razón importa (S113-A).
     D lo escribió como `costo === null` con el motivo entre paréntesis:
     «E no entregó precios». **E los entregó**, así que el assert estaba
     codificando un ESTADO TEMPORAL como si fuera un invariante — y el día
     que el estado cambió, el gate se puso rojo sobre código correcto.
     *Un assert que describe una ausencia caduca cuando la ausencia se llena.*

     La versión nueva no dice «es un número»: exige **la aritmética exacta**,
     que es lo que de verdad hay que proteger. Con el `usage` de esta sonda
     (1234 entrada / 56 salida) y la tabla de E para `claude-sonnet-5`
     ($2 y $10 por millón), el costo es
       1234 × 2/1e6  +  56 × 10/1e6  =  0,002468 + 0,00056 = 0,003028
     Si alguien mueve un precio o invierte entrada con salida, esto lo caza. */
  const costoEsperado = (1234 * 2) / 1e6 + (56 * 10) / 1e6
  exigir(`costo = ${costoEsperado} (usage × tabla de E)`,
    Math.abs((cap.filas[0]?.costo_estimado_usd ?? -1) - costoEsperado) < 1e-9,
    cap.filas[0]?.costo_estimado_usd)
  exigir('latencia es número', typeof cap.filas[0]?.latencia_ms === 'number')
  const claves = Object.keys(cap.filas[0] ?? {}).sort().join(',')
  exigir('CERO dato personal: sólo las columnas del contrato',
    claves === 'costo_estimado_usd,edge,latencia_ms,modelo,pieza,resultado,tokens_cache_escritura,tokens_cache_lectura,tokens_entrada,tokens_salida', claves)
}

console.log('\n== 2 · VERDE texto (la rama que nadie usa todavía) ==')
{
  const { cap, quitar } = interceptar(() => respuestaOk('esto no es JSON y está bien'))
  const r = await llamarModelo({ ...pedidoBase, salida: 'texto' })
  quitar()
  exigir('devuelve el texto crudo', r.ok === true && r.datos === 'esto no es JSON y está bien', r.ok && r.datos)
  exigir('escribe su fila', cap.filas.length === 1 && cap.filas[0]?.resultado === 'ok')
}

console.log('\n== 3 · ROJO proveedor 500 + reintentos ==')
{
  const { cap, quitar } = interceptar(() => new Response('boom', { status: 500 }))
  const r = await llamarModelo(pedidoBase)
  quitar()
  exigir("error 'error_proveedor'", r.ok === false && r.error === 'error_proveedor', r.ok === false && r.error)
  exigir('estadoHttp 500 (la edge lo mapea)', r.ok === false && r.estadoHttp === 500)
  exigir('3 intentos (1 + 2 reintentos)', cap.intentos === 3, cap.intentos)
  exigir('escribe UNA fila igual', cap.filas.length === 1, cap.filas.length)
  exigir('tokens NULL, jamás 0', cap.filas[0]?.tokens_entrada === null, cap.filas[0]?.tokens_entrada)
}

console.log('\n== 4 · ROJO 4xx NO se reintenta ==')
{
  const { cap, quitar } = interceptar(() => new Response('mala', { status: 400 }))
  const r = await llamarModelo(pedidoBase)
  quitar()
  exigir('un solo intento', cap.intentos === 1, cap.intentos)
  exigir('estadoHttp 400', r.ok === false && r.estadoHttp === 400)
}

console.log('\n== 5 · ROJO respuesta sin JSON válido ==')
{
  const { cap, quitar } = interceptar(() => respuestaOk('lo siento, no puedo'))
  const r = await llamarModelo(pedidoBase)
  quitar()
  exigir("error 'error_parseo'", r.ok === false && r.error === 'error_parseo', r.ok === false && r.error)
  exigir("detalle 'json_invalido'", r.ok === false && r.detalle === 'json_invalido')
  exigir('fila escrita con tokens reales', cap.filas[0]?.resultado === 'error_parseo' && cap.filas[0]?.tokens_entrada === 1234)
  exigir('NO devuelve datos', r.ok === false)
}

console.log('\n== 6 · ROJO truncado (max_tokens) ==')
{
  const { cap, quitar } = interceptar(() =>
    new Response(JSON.stringify({ content: [{ type: 'text', text: '{"a":' }], stop_reason: 'max_tokens', usage: { input_tokens: 9, output_tokens: 9 } }), { status: 200 }))
  const r = await llamarModelo(pedidoBase)
  quitar()
  exigir("detalle 'truncado' (la edge conserva su mensaje)", r.ok === false && r.detalle === 'truncado', r.ok === false && r.detalle)
  exigir('fila error_parseo', cap.filas[0]?.resultado === 'error_parseo')
}

console.log('\n== 7 · ROJO rechazo del modelo ==')
{
  const { cap, quitar } = interceptar(() =>
    new Response(JSON.stringify({ content: [], stop_reason: 'refusal', usage: { input_tokens: 7, output_tokens: 0 } }), { status: 200 }))
  const r = await llamarModelo(pedidoBase)
  quitar()
  exigir("error 'rechazo'", r.ok === false && r.error === 'rechazo', r.ok === false && r.error)
  exigir("fila resultado 'rechazo'", cap.filas[0]?.resultado === 'rechazo', cap.filas[0]?.resultado)
}

console.log('\n== 8 · ROJO timeout ==')
console.log('  (se instrumenta bajando TIMEOUT_MS.documento a 50 ms: se mide el CAMINO')
console.log('   del timeout, no su duración — la de producción vive en modelos.ts)')
{
  const original = TIMEOUT_MS.documento
  TIMEOUT_MS.documento = 50
  const { cap, quitar } = interceptar((_i, signal) =>
    new Promise<Response>((_, rechazar) => {
      signal?.addEventListener('abort', () => rechazar(new DOMException('Aborted', 'AbortError')))
    }))
  const r = await llamarModelo(pedidoBase)
  quitar()
  TIMEOUT_MS.documento = original
  exigir("error 'timeout'", r.ok === false && r.error === 'timeout', r.ok === false && r.error)
  exigir('NO se reintenta un timeout', cap.intentos === 1, cap.intentos)
  exigir("fila resultado 'timeout'", cap.filas[0]?.resultado === 'timeout', cap.filas[0]?.resultado)
}

console.log('\n== 9 · EL REGISTRO NO PUEDE ROMPER EL PRODUCTO ==')
console.log('  (es el caso VIVO hoy: `ia_uso` todavía no existe — la crea E)')
{
  const { cap, quitar } = interceptar(() => respuestaOk('{"ok":1}'), true)
  const r = await llamarModelo(pedidoBase)
  quitar()
  exigir('el insert falló de verdad', cap.filas.length === 1)
  exigir('y la llamada SIGUE devolviendo ok', r.ok === true, r.ok === false && r.error)
}

console.log('\n== 10 · EL CACHÉ SÓLO DONDE SE MIDIÓ QUE PAGA ==')
{
  const { cap, quitar } = interceptar(() => respuestaOk('{"a":1}'))
  await llamarModelo({ pieza: 'presencia', sistema: 'SISTEMA ESTABLE', mensajes: [{ rol: 'user', texto: 'x' }], salida: 'json' })
  const conCache = JSON.stringify((cap.cuerpoAnthropic as Record<string, unknown>).system)
  await llamarModelo({ pieza: 'nota_clinica', sistema: 'no deberia cachear', mensajes: [{ rol: 'user', texto: 'x' }], salida: 'json' })
  const sinCache = JSON.stringify((cap.cuerpoAnthropic as Record<string, unknown>).system)
  quitar()
  exigir('presencia lleva cache_control', conCache.includes('"cache_control":{"type":"ephemeral"}'), conCache)
  exigir('nota_clinica manda system string plano, sin caché', sinCache === '"no deberia cachear"', sinCache)
}

console.log(`\n${rojos === 0 ? 'OK' : 'ROJO'} arnés de la puerta — ${verdes} verdes · ${rojos} rojos\n`)
Deno.exit(rojos === 0 ? 0 : 1)
