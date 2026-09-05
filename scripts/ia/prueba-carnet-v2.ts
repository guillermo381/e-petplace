// ARNÉS DE CONTRATO DE `extract-vacuna` v2 — S113-D, lote 1.0.
//
// ── 🔴 QUÉ PRUEBA ESTE ARNÉS Y QUÉ NO — LEER ANTES DE CITARLO ──────────────
// Corre con un PROVEEDOR FALSO, así que **no puede probar que el modelo mande
// once filas a `plan_impreso`**: manda lo que yo le diga. Lo que sí prueba, y
// es lo que le toca a esta pista:
//   · que la edge ACEPTE la forma correcta y la devuelva intacta,
//   · que RECHACE toda forma que no cumpla el esquema, sin datos parciales,
//   · que el cuerpo que sale lleve `max_tokens` 2000 y el razonamiento apagado,
//   · que el override de modelo sea inalcanzable desde el cliente.
//
// **Que el modelo de verdad separe plan de aplicación lo mide E**, con los 5
// carnets reales y las 32 filas de verdad. *Un arnés con proveedor falso mide
// el contrato; la exactitud se mide contra la realidad.*

import { llamarModelo } from '../_shared/ia/mod.ts'

Deno.env.set('ANTHROPIC_API_KEY', 'sk-ant-FALSA-DE-PRUEBA')
Deno.env.set('SUPABASE_URL', 'https://proyecto-falso.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-falsa')

const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const tokenDe = (rol: string) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ role: rol })}.firma`
const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const fila = (extra: Record<string, unknown> = {}) => ({
  nombre: 'Nobivac DHPPi', fecha_aplicada: '2023-04-19', fecha_proxima: null,
  lote: '56288', laboratorio: 'Zoetis', via: null, veterinario: 'CPA Teusaquillo',
  vencimiento_biologico: null, tipo_vacuna: 'múltiple',
  confianza: 'alta', evidencia: 'sticker_con_fecha', ...extra,
})

let cuerpoSalida: Record<string, unknown> | null = null
const fetchReal = globalThis.fetch
function proveedorFalso(devuelve: () => unknown) {
  globalThis.fetch = ((entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada)
    if (url.includes('api.anthropic.com')) {
      cuerpoSalida = JSON.parse(String(init?.body ?? '{}'))
      return Promise.resolve(new Response(JSON.stringify({
        content: [{ type: 'text', text: JSON.stringify(devuelve()) }],
        stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 10 },
      }), { status: 200 }))
    }
    if (url.includes('/rest/v1/')) return Promise.resolve(new Response('[]', { status: 201 }))
    return fetchReal(entrada as string, init)
  }) as typeof fetch
}

let manejador: ((r: Request) => Response | Promise<Response>) | null = null
// deno-lint-ignore no-explicit-any
;(Deno as any).serve = (h: any) => {
  manejador = typeof h === 'function' ? h : h?.fetch
  return { finished: Promise.resolve(), shutdown: () => Promise.resolve(), addr: { hostname: '', port: 0 } }
}
await import('../extract-vacuna/index.ts')

async function llamar(cuerpo: Record<string, unknown>, rol = 'authenticated') {
  const res = await manejador!(new Request('http://local/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDe(rol)}` },
    body: JSON.stringify(cuerpo),
  }))
  let json: Record<string, unknown> = {}
  try { json = await res.json() } catch { /* respuesta sin JSON */ }
  return { status: res.status, json }
}

let v = 0, r = 0
const exigir = (n: string, c: boolean, visto?: unknown) => {
  if (c) { v++; console.log(`  OK   ${n}`) }
  else { r++; console.log(`  ROJO ${n}${visto === undefined ? '' : ` — visto: ${JSON.stringify(visto)}`}`) }
}

console.log('\n== 1 · EL CASO «1 → 12»: una aplicación, once del plan ==')
{
  const once = Array.from({ length: 11 }, (_, i) => ({ nombre: `Refuerzo ${i + 1}` }))
  proveedorFalso(() => ({ vacunas: [fila()], plan_impreso: once }))
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  exigir('200', status === 200, status)
  exigir('1 en vacunas', (json.vacunas as unknown[])?.length === 1, (json.vacunas as unknown[])?.length)
  exigir('11 en plan_impreso', (json.plan_impreso as unknown[])?.length === 11, (json.plan_impreso as unknown[])?.length)
  exigir('la fila viaja entera (11 campos)', Object.keys((json.vacunas as Record<string,unknown>[])[0]).length === 11)
}

console.log('\n== 2 · CARNET SIN FECHAS: null + confianza baja pasan ==')
{
  proveedorFalso(() => ({
    vacunas: [fila({ fecha_aplicada: null, lote: null, laboratorio: null, veterinario: null, tipo_vacuna: null, confianza: 'baja', evidencia: 'manuscrito' })],
    plan_impreso: [],
  }))
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir('200 con fecha null', status === 200 && f?.fecha_aplicada === null, { status, f: f?.fecha_aplicada })
  exigir("confianza 'baja' llega a C", f?.confianza === 'baja', f?.confianza)
  exigir('plan_impreso vacío es honesto, no error', Array.isArray(json.plan_impreso) && (json.plan_impreso as unknown[]).length === 0)
}

console.log('\n== 3 · EL STICKER: su fecha va a vencimiento, no a aplicación ==')
{
  proveedorFalso(() => ({
    vacunas: [fila({ fecha_aplicada: '2023-04-19', vencimiento_biologico: '2025-05-31' })],
    plan_impreso: [],
  }))
  const { json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir('los dos campos viajan separados', f?.fecha_aplicada === '2023-04-19' && f?.vencimiento_biologico === '2025-05-31', f)
  console.log('  ⚠️ que el MODELO no los confunda lo mide E con el carnet real, no este arnés.')
}

console.log('\n== 4 · ROJOS DE ESQUEMA: 422 y CERO datos parciales ==')
for (const [nombre, malo] of [
  ['sin plan_impreso',        { vacunas: [fila()] }],
  ['via fuera del CHECK',     { vacunas: [fila({ via: 'endovenosa' })], plan_impreso: [] }],
  ['confianza inventada',     { vacunas: [fila({ confianza: 'altisima' })], plan_impreso: [] }],
  ['evidencia inventada',     { vacunas: [fila({ evidencia: 'intuicion' })], plan_impreso: [] }],
  ['tipo_vacuna fuera del vocabulario', { vacunas: [fila({ tipo_vacuna: 'antigripal' })], plan_impreso: [] }],
  ['fecha con formato libre', { vacunas: [fila({ fecha_aplicada: '19/4/23' })], plan_impreso: [] }],
  ['cadena vacía en lote',    { vacunas: [fila({ lote: '' })], plan_impreso: [] }],
  ['fila de plan sin nombre', { vacunas: [], plan_impreso: [{ nombre: '' }] }],
] as const) {
  proveedorFalso(() => malo)
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  exigir(`${nombre} → 422 sin datos`, status === 422 && json.vacunas === undefined, { status, tieneDatos: json.vacunas !== undefined })
}

console.log('\n== 5 · EL CUERPO QUE SALE: 2000 tokens y sin razonamiento ==')
{
  proveedorFalso(() => ({ vacunas: [], plan_impreso: [] }))
  await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  exigir('max_tokens 2000 (era 16000)', cuerpoSalida?.max_tokens === 2000, cuerpoSalida?.max_tokens)
  exigir('modelo por defecto sonnet-5', cuerpoSalida?.model === 'claude-sonnet-5', cuerpoSalida?.model)
  exigir("sonnet lleva thinking disabled", JSON.stringify(cuerpoSalida?.thinking) === '{"type":"disabled"}', cuerpoSalida?.thinking)
  exigir('sin output_config (nadie movió el esfuerzo)', cuerpoSalida?.output_config === undefined)
}

console.log('\n== 6 · LA COMPARACIÓN DE E ES JUSTA: haiku NO lleva thinking ==')
console.log('  (omitir `thinking` en haiku YA es no pensar; mandárselo sería estrenar un 400)')
{
  proveedorFalso(() => ({ vacunas: [], plan_impreso: [] }))
  await llamar({ imageBase64: PIXEL, mediaType: 'image/png', modelo: 'claude-haiku-4-5' }, 'service_role')
  exigir('modelo cambiado a haiku', cuerpoSalida?.model === 'claude-haiku-4-5', cuerpoSalida?.model)
  exigir('haiku SIN campo thinking', cuerpoSalida?.thinking === undefined, cuerpoSalida?.thinking)
  exigir('mismo max_tokens y mismo prompt', cuerpoSalida?.max_tokens === 2000)
}

console.log('\n== 7 · LA PALANCA DE MEDICIÓN ES INALCANZABLE DESDE EL CLIENTE ==')
{
  proveedorFalso(() => ({ vacunas: [], plan_impreso: [] }))
  const cliente = await llamar({ imageBase64: PIXEL, mediaType: 'image/png', modelo: 'claude-haiku-4-5' }, 'authenticated')
  exigir('authenticated NO puede elegir modelo', cliente.status === 400, cliente.status)
  const fuera = await llamar({ imageBase64: PIXEL, mediaType: 'image/png', modelo: 'claude-opus-5' }, 'service_role')
  exigir('service_role tampoco sale de la lista blanca', fuera.status === 400, fuera.status)
}

console.log('\n== 8 · EL TECHO DE 2 MB ==')
{
  proveedorFalso(() => ({ vacunas: [], plan_impreso: [] }))
  const grande = 'A'.repeat(2_800_000)
  const { status, json } = await llamar({ imageBase64: grande, mediaType: 'image/png' })
  exigir('> 2 MB rebota tipado', status === 400 && json.codigo === 'imagen_invalida', { status, c: json.codigo })
  const ok = await llamar({ imageBase64: 'A'.repeat(1_000_000), mediaType: 'image/png' })
  exigir('1 MB pasa (control positivo del techo)', ok.status === 200, ok.status)
}

console.log(`\n${r === 0 ? 'OK' : 'ROJO'} arnés carnet v2 — ${v} verdes · ${r} rojos\n`)
Deno.exit(r === 0 ? 0 : 1)
