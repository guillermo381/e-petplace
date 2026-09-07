#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env
/**
 * ARNÉS · el reintento de contrato de `llamarModelo` (S113-D · fase 3).
 * Proveedor FALSO, cero llamadas reales.
 *
 * 🔴 POR QUÉ EXISTE, con su medición: E corrió 40 ataques contra la EDGE
 * desplegada y **4 volvieron `502 error_modelo`** — cuatro preguntas razonables
 * que hoy devuelven «probá de nuevo» a una familia. Las mismas frases parseaban
 * contra nuestros dos fixtures y rompen contra el expediente REAL de Thor, que
 * es más grande que ambos. *Nuestros fixtures eran, otra vez, más fáciles que
 * el objeto.*
 *
 * La forma del fallo ya estaba medida: cuando rompe, **el modelo devuelve prosa
 * desde el primer carácter** — no JSON truncado ni malformado, un envoltorio
 * que nunca salió. *No hay nada que reparar en el texto*, así que la cura es
 * pedirlo de nuevo, y eso es lo que este arnés vigila.
 *
 * ⚠️ Mide el CABLEADO —que se pida de nuevo, una sola vez, sin tocar el system
 * cacheado, y que un truncado NO se reintente— **jamás que el modelo se
 * recupere**.
 *
 * ✅ **Y LA EFICACIA YA SE MIDIÓ, contra la edge desplegada (E):**
 *     antes del reintento  **8 de 16** (50 %)
 *     después              **16 de 16** (100 %), cero fallos individuales
 * **La línea de base es lo que lo vuelve afirmable**: desde una tasa del 50 %,
 * sacar 16 de 16 por azar es **1 en 65.536**. *Sin ella, un 16/16 era
 * indistinguible de una buena racha.* Y su costo fue barato de otra manera: al
 * tomarla apareció que **una de las cuatro frases no estaba rota** —recuperaba
 * 4/4 sola— y la habíamos metido en la lista por un solo fallo. *Sin la base
 * habríamos curado algo sano y contado su acierto como mérito del reintento.*
 */
import { declararObjeto, exigirCasos } from './declarar-objeto.ts'

await declararObjeto({
  mide: ['supabase/functions/_shared/ia/mod.ts'],
  modeloReal: false,
  noCubre:
    'si el modelo se recupera al segundo pedido — pero eso YA se midió y el número está abajo: ' +
    'este arnés sigue probando sólo el cableado, y su verde no dice nada de la eficacia.',
})

Deno.env.set('ANTHROPIC_API_KEY', 'sk-ant-FALSA')
Deno.env.set('SUPABASE_URL', 'https://falso.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'srk-falsa')
const { llamarModelo } = await import('../_shared/ia/mod.ts')

let llamadas: string[] = []
const real = globalThis.fetch
function proveedor(...textos: string[]) {
  llamadas = []
  let i = 0
  globalThis.fetch = ((u: string | URL | Request, init?: RequestInit) => {
    const url = String(u)
    if (!url.includes('api.anthropic.com')) return Promise.resolve(new Response('{}', { status: 200 }))
    const cuerpo = JSON.parse(String(init?.body ?? '{}'))
    llamadas.push(JSON.stringify(cuerpo.messages))
    const t = textos[Math.min(i++, textos.length - 1)]
    return Promise.resolve(new Response(JSON.stringify({
      content: [{ type: 'text', text: t }], stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 5 },
    }), { status: 200 }))
  }) as typeof fetch
}
const pedir = () => llamarModelo({
  pieza: 'busqueda', sistema: 'sos un clasificador',
  mensajes: [{ rol: 'user', texto: 'hola' }], salida: 'json',
})
let v = 0, r = 0
const exigir = (n: string, ok: boolean, visto?: unknown) => {
  ok ? (v++, console.log('  OK   ' + n)) : (r++, console.log(`  ROJO ${n} — ${JSON.stringify(visto)}`))
}

// ① prosa y después JSON: se recupera, y con DOS llamadas
proveedor('La pregunta que me hacés no tiene una respuesta simple.', '{"tipo":"cita"}')
const a = await pedir()
exigir('prosa → reintento → JSON: recupera', a.ok === true, a)
exigir('  ...y fueron exactamente 2 llamadas', llamadas.length === 2, llamadas.length)
exigir('  ...y el reintento agregó el recordatorio', llamadas[1]?.includes('formato pedido'), llamadas[1]?.slice(0, 80))
exigir('  ...sin tocar el `system` (que va cacheado)', !llamadas[1]?.includes('sos un clasificador'))

// ② prosa las DOS veces: falla, y NO se pide una tercera
proveedor('prosa igual', 'y de nuevo prosa')
const b = await pedir()
exigir('CONTROL: prosa dos veces → falla', b.ok === false, b)
exigir('  ...y NO hay tercera llamada', llamadas.length === 2, llamadas.length)

// ③ JSON a la primera: UNA sola llamada (el reintento no se dispara de más)
proveedor('{"tipo":"pedido"}')
const c = await pedir()
exigir('CONTROL: JSON a la primera → 1 llamada', c.ok === true && llamadas.length === 1, llamadas.length)

// ④ truncado NO se reintenta: es otra cosa y se cura con el techo
llamadas = []
globalThis.fetch = ((u: string | URL | Request, init?: RequestInit) => {
  if (!String(u).includes('api.anthropic.com')) return Promise.resolve(new Response('{}', { status: 200 }))
  llamadas.push('x')
  return Promise.resolve(new Response(JSON.stringify({
    content: [{ type: 'text', text: '{"tipo":' }], stop_reason: 'max_tokens',
    usage: { input_tokens: 10, output_tokens: 5 },
  }), { status: 200 }))
}) as typeof fetch
const d = await pedir()
exigir('CONTROL: truncado NO se reintenta', d.ok === false && llamadas.length === 1, llamadas.length)

globalThis.fetch = real
exigirCasos(v + r, 'comprobaciones del reintento')
console.log(`\n${r === 0 ? 'OK' : 'ROJO'} reintento de contrato — ${v} verdes · ${r} rojos`)
console.log('  ⚠️ mide el CABLEADO, jamás que el modelo se recupere.')
Deno.exit(r ? 1 : 0)
