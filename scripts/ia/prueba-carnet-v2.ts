// ARNÉS DE CONTRATO DE `extract-vacuna` v2 — S113-D, lote 1.0.
//
// ── 🔴 QUÉ PRUEBA ESTE ARNÉS Y QUÉ NO — LEER ANTES DE CITARLO ──────────────
// Corre con un PROVEEDOR FALSO, así que **no puede probar que el modelo mande
// once filas a `plan_impreso`**: manda lo que yo le diga. Lo que sí prueba, y
// es lo que le toca a esta pista:
//   · que la edge ACEPTE la forma correcta y la devuelva intacta,
//   · que RECHACE toda forma que no cumpla el esquema, sin datos parciales,
//   · que el cuerpo que sale lleve `max_tokens` 4000 y el razonamiento apagado,
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

/**
 * 🔴 LA SALIDA REAL del modelo sobre el carnet del <<1 -> 12>>, guardada tal
 * cual salió — **15 filas, DOS con `nombre: null`**. Es la fixture que prueba
 * que la firma (b) funciona sobre el caso que la motivó, y no sobre uno que yo
 * invente.
 *
 * ⚠️ **REDACTADA en un solo campo:** `veterinario` era el nombre de una PERSONA
 * real. Por eso los conjuntos de E no se commitean, y por eso esta fixture sí
 * puede: la estructura —cuántas filas, cuáles sin nombre, con qué fechas y
 * códigos— es lo único que el arnés necesita.
 */
const REAL_DOC_A = JSON.parse(await Deno.readTextFile(
  new URL('./fixture-carnet-real-docA.json', import.meta.url)))

// El catálogo real de `cat_vacunas`, medido: 7 códigos, sin tildes ni espacios.
const CATALOGO = [
  { codigo: 'antirrabica', nombre: 'antirrábica' },
  { codigo: 'giardia', nombre: 'giardia' },
  { codigo: 'leptospirosis', nombre: 'leptospirosis' },
  { codigo: 'leucemia_felina', nombre: 'leucemia felina' },
  { codigo: 'multiple', nombre: 'múltiple' },
  { codigo: 'tos_perreras', nombre: 'tos de las perreras' },
  { codigo: 'triple_felina', nombre: 'triple felina' },
]
let catalogoFalla = false

const fila = (extra: Record<string, unknown> = {}) => ({
  nombre: 'Nobivac DHPPi', fecha_aplicada: '2023-04-19', fecha_aplicada_precision: 'dia',
  fecha_literal: '19-4-23', fecha_proxima: null, fecha_proxima_precision: null, fecha_proxima_literal: null,
  lote: '56288', laboratorio: 'Zoetis', via: null, veterinario: 'CPA Teusaquillo',
  vencimiento_biologico: null, vacuna_codigo: 'multiple', cubre: ['multiple'],
  confianza: 'alta', evidencia: 'sticker', ...extra,
})

let cuerpoSalida: Record<string, unknown> | null = null
const fetchReal = globalThis.fetch
function proveedorFalso(devuelve: () => unknown) {
  // 🔴 Se RESETEA. Sin esto, `cuerpoSalida` arrastra el cuerpo del caso
  // anterior, y una aserción de «no se llamó al modelo» pasa por el valor
  // viejo. Lo cazó el caso 10 y el defecto era del arnés, no de la edge:
  // *un instrumento con estado que no se limpia mide la corrida pasada.*
  cuerpoSalida = null
  globalThis.fetch = ((entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada)
    if (url.includes('api.anthropic.com')) {
      cuerpoSalida = JSON.parse(String(init?.body ?? '{}'))
      return Promise.resolve(new Response(JSON.stringify({
        content: [{ type: 'text', text: JSON.stringify(devuelve()) }],
        stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 10 },
      }), { status: 200 }))
    }
    if (url.includes('/rest/v1/cat_vacunas')) {
      if (catalogoFalla) return Promise.resolve(new Response('[]', { status: 200 }))
      return Promise.resolve(new Response(JSON.stringify(CATALOGO), { status: 200, headers: { 'Content-Type': 'application/json' } }))
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
  const f0 = (json.vacunas as Record<string, unknown>[])[0]
  exigir('la fila viaja entera (16 del modelo + tipo_vacuna y dudosa derivados)', Object.keys(f0).length === 18, Object.keys(f0).length)
  exigir('tipo_vacuna DERIVADO del código (multiple → múltiple)', f0.tipo_vacuna === 'múltiple', f0.tipo_vacuna)
  exigir('y el código viaja tal cual', f0.vacuna_codigo === 'multiple')
}

console.log('\n== 2 · CARNET SIN FECHAS: null + confianza baja pasan ==')
{
  proveedorFalso(() => ({
    vacunas: [fila({ fecha_aplicada: null, fecha_aplicada_precision: null, lote: null, laboratorio: null, veterinario: null, vacuna_codigo: null, cubre: [], confianza: 'baja', evidencia: 'manuscrito' })],
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
  ['evidencia con el nombre viejo', { vacunas: [fila({ evidencia: 'sticker_con_fecha' })], plan_impreso: [] }],
  ['cubre con código fuera del catálogo', { vacunas: [fila({ cubre: ['multiple', 'antigripal'] })], plan_impreso: [] }],
  ['cubre con repetidos',     { vacunas: [fila({ cubre: ['multiple', 'multiple'] })], plan_impreso: [] }],
  ['cubre sin el código principal', { vacunas: [fila({ vacuna_codigo: 'antirrabica', cubre: ['multiple'] })], plan_impreso: [] }],
  ['cubre que no es lista',   { vacunas: [fila({ cubre: 'multiple' })], plan_impreso: [] }],
  ['precisión que NO coincide con la forma', { vacunas: [fila({ fecha_aplicada: '2023-04', fecha_aplicada_precision: 'dia' })], plan_impreso: [] }],
  ['fecha null con precisión puesta', { vacunas: [fila({ fecha_aplicada: null, fecha_aplicada_precision: 'dia' })], plan_impreso: [] }],
  ['fecha con precisión en null', { vacunas: [fila({ fecha_aplicada_precision: null })], plan_impreso: [] }],
  ['forma de fecha inventada', { vacunas: [fila({ fecha_aplicada: '2023-4-9', fecha_aplicada_precision: 'dia' })], plan_impreso: [] }],
  ['vacuna_codigo fuera del catálogo', { vacunas: [fila({ vacuna_codigo: 'antigripal' })], plan_impreso: [] }],
  ['código con tilde (el que el catálogo NO tiene)', { vacunas: [fila({ vacuna_codigo: 'antirrábica' })], plan_impreso: [] }],
  ['fecha con formato libre', { vacunas: [fila({ fecha_aplicada: '19/4/23' })], plan_impreso: [] }],
  ['cadena vacía en lote',    { vacunas: [fila({ lote: '' })], plan_impreso: [] }],
  ['fila de plan sin nombre', { vacunas: [], plan_impreso: [{ nombre: '' }] }],
] as const) {
  proveedorFalso(() => malo)
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  exigir(`${nombre} → 422 sin datos`, status === 422 && json.vacunas === undefined, { status, tieneDatos: json.vacunas !== undefined })
}

console.log('\n== 5 · EL CUERPO QUE SALE: 4000 tokens y sin razonamiento ==')
{
  proveedorFalso(() => ({ vacunas: [], plan_impreso: [] }))
  await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  exigir('max_tokens 4000 (firma del founder; era 16000)', cuerpoSalida?.max_tokens === 4000, cuerpoSalida?.max_tokens)
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
  exigir('mismo max_tokens y mismo prompt', cuerpoSalida?.max_tokens === 4000, cuerpoSalida?.max_tokens)
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

console.log('\n== 8bis · `cubre` VACÍO con código puesto es válido: es «no sé» ==')
{
  proveedorFalso(() => ({ vacunas: [fila({ vacuna_codigo: 'multiple', cubre: [] })], plan_impreso: [] }))
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir('200: lista vacía es una respuesta, no una contradicción', status === 200, status)
  exigir('el código principal viaja igual', f?.vacuna_codigo === 'multiple')
  console.log('  ↑ una cobertura inventada le dice al plan vacunal que la mascota está')
  console.log('    protegida contra algo que quizá no recibió. Eso no se corrige mirando:')
  console.log('    se descubre cuando el animal se enferma. Por eso vacío es legal.')
}

console.log('\n== 8ter · UNA COMBINADA CUBRE VARIAS ==')
{
  proveedorFalso(() => ({ vacunas: [fila({ vacuna_codigo: 'multiple', cubre: ['multiple', 'leptospirosis', 'antirrabica'] })], plan_impreso: [] }))
  const { json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir('las tres coberturas viajan', JSON.stringify(f?.cubre) === '["multiple","leptospirosis","antirrabica"]', f?.cubre)
}

console.log('\n== 9 · vacuna_codigo NULL es una respuesta, no una falla ==')
{
  proveedorFalso(() => ({ vacunas: [fila({ vacuna_codigo: null, cubre: [] })], plan_impreso: [] }))
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir('200 con código null', status === 200, status)
  exigir('tipo_vacuna derivado también null (no se inventa)', f?.tipo_vacuna === null, f?.tipo_vacuna)
  console.log('  ↑ un nombre comercial que no mapea vuelve null. Un código «probable»')
  console.log('    entra al plan vacunal como un hecho y nadie lo revisa.')
}

console.log('\n== 10 · CATÁLOGO CAÍDO: se falla, no se degrada en silencio ==')
{
  catalogoFalla = true
  proveedorFalso(() => ({ vacunas: [fila()], plan_impreso: [] }))
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  catalogoFalla = false
  exigir('502 error_modelo', status === 502 && json.codigo === 'error_modelo', { status, c: json.codigo })
  exigir('CERO llamadas al modelo (no se gasta sin lista blanca)', cuerpoSalida === null)
  console.log('  ↑ con el catálogo caído no hay lista blanca. Seguir devolvería')
  console.log('    códigos sin acotar, o null en todas las filas sin que nadie sepa')
  console.log('    que fue por una caída. Una degradación silenciosa es peor.')
}

console.log('\n== 11 · LA FIRMA (b): el carnet REAL entra entero, con dos filas sin nombre ==')
{
  proveedorFalso(() => REAL_DOC_A)
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const filas = json.vacunas as Record<string, unknown>[] | undefined
  exigir('LA EDGE NO REBOTA (antes: 422 por las dos sin nombre)', status === 200, { status, codigo: json.codigo })
  exigir('vuelven las 15 filas', filas?.length === 15, filas?.length)
  exigir('dos con nombre null', filas?.filter((f) => f.nombre === null).length === 2,
    filas?.filter((f) => f.nombre === null).length)
  exigir('y las dos traen fecha (el ancla que las deja existir)',
    filas?.filter((f) => f.nombre === null).every((f) => f.fecha_aplicada !== null))
  exigir('las 13 con nombre siguen intactas', filas?.filter((f) => typeof f.nombre === 'string').length === 13)

  // 🔴 EL ROJO DEL FOUNDER, sobre la salida REAL: los renglones 7 y 8 dicen
  // «Feb/2023» en PRÓXIMA y el modelo declara `dia`. Los 1 y 2 dicen
  // «29/08/2021», con día escrito. El control tiene que separarlos.
  const dudosas = filas?.map((f, i) => ({ n: i + 1, d: f.dudosa, lit: f.fecha_proxima_literal })).filter((x) => x.d === 'fecha')
  exigir('los renglones 7 y 8 salen DUDOSOS', JSON.stringify(dudosas?.map((x) => x.n)) === '[7,8]', dudosas)
  exigir('y traen su literal para la pantalla', dudosas?.every((x) => x.lit === 'Feb/2023'), dudosas?.map((x) => x.lit))
  exigir('los renglones 1 y 2 NO salen dudosos (día escrito)',
    filas?.[0].dudosa === null && filas?.[1].dudosa === null, [filas?.[0].dudosa, filas?.[1].dudosa])
  exigir('las dudosas bajan a confianza baja', dudosas !== undefined && filas!.filter((f) => f.dudosa === 'fecha').every((f) => f.confianza === 'baja'))
}

console.log('\n== 11bis · LAS TRES PRECISIONES, y el día que NO se inventa ==')
console.log('  (el caso vivo: el doc A dice «FEB 2023» en PRÓXIMA y el modelo devolvía')
console.log('   2023-02-25, copiándole el día 25 a la aplicación de esa misma fila.)')
for (const [nombre, valor, prec] of [
  ['día completo   "3 Ago 2023"', '2023-08-03', 'dia'],
  ['mes y año      "FEB 2023"',   '2023-02',    'mes'],
  ['sin año        "26 JUN"',     '--06-26',    'sin_anio'],
] as const) {
  proveedorFalso(() => ({ vacunas: [fila({ fecha_aplicada: valor, fecha_aplicada_precision: prec })], plan_impreso: [] }))
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir(`${nombre} → ${valor} · ${prec}`, status === 200 && f?.fecha_aplicada === valor && f?.fecha_aplicada_precision === prec,
    { status, v: f?.fecha_aplicada, p: f?.fecha_aplicada_precision })
}
{
  proveedorFalso(() => ({ vacunas: [fila({ fecha_proxima: '2023-02', fecha_proxima_precision: 'mes', fecha_proxima_literal: 'FEB 2023' })], plan_impreso: [] }))
  const { json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  exigir('la próxima también admite forma parcial (era donde se inventaba el día)',
    (json.vacunas as Record<string, unknown>[])?.[0]?.fecha_proxima === '2023-02')
}

console.log('\n== 11ter · EL CONTROL DETERMINISTICO: el literal desmiente al modelo ==')
console.log('  (el modelo afirma `dia` sobre «FEB 2023». No le creemos: se cuentan los')
console.log('   componentes del literal. Tres para un día; «FEB 2023» tiene dos.)')
for (const [caso, literal, prec, esperaDudosa] of [
  ['«3 Ago 2023» dice dia', '3 Ago 2023', 'dia', false],
  ['«19-4-23» dice dia', '19-4-23', 'dia', false],
  ['«13/NOV 2022» dice dia', '13/NOV 2022', 'dia', false],
  ['🔴 «FEB 2023» dice dia', 'FEB 2023', 'dia', true],
  ['🔴 «05-2024» dice dia', '05-2024', 'dia', true],
  ['«FEB 2023» dice mes', 'FEB 2023', 'mes', false],
  ['«26 JUN» dice sin_anio', '26 JUN', 'sin_anio', false],
] as const) {
  const valor = prec === 'dia' ? '2023-02-25' : prec === 'mes' ? '2023-02' : '--06-26'
  proveedorFalso(() => ({ vacunas: [fila({ fecha_aplicada: valor, fecha_aplicada_precision: prec, fecha_literal: literal })], plan_impreso: [] }))
  const { json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir(`${caso} → ${esperaDudosa ? 'DUDOSA' : 'pasa'}`,
    (f?.dudosa === 'fecha') === esperaDudosa && (esperaDudosa ? f?.confianza === 'baja' : true),
    { dudosa: f?.dudosa, confianza: f?.confianza })
}
{
  // la próxima recibe el mismo trato
  proveedorFalso(() => ({ vacunas: [fila({ fecha_proxima: '2023-02-25', fecha_proxima_precision: 'dia', fecha_proxima_literal: 'FEB 2023' })], plan_impreso: [] }))
  const { json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir('la PRÓXIMA con día inventado también marca la fila', f?.dudosa === 'fecha' && f?.confianza === 'baja', { d: f?.dudosa, c: f?.confianza })
  exigir('y el literal viaja a la pantalla', f?.fecha_proxima_literal === 'FEB 2023')
}
{
  // el literal NO se usa para corregir la fecha: sólo para marcar.
  proveedorFalso(() => ({ vacunas: [fila({ fecha_aplicada: '2023-02-25', fecha_aplicada_precision: 'dia', fecha_literal: 'FEB 2023' })], plan_impreso: [] }))
  const { json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  const f = (json.vacunas as Record<string, unknown>[])?.[0]
  exigir('la fecha NO se corrige sola (no sabemos cuál es la buena)', f?.fecha_aplicada === '2023-02-25')
}

console.log('\n== 12 · EL ANCLA: sin nombre NI fecha NI lote, la fila no existe ==')
for (const [nombre, malo] of [
  ['sin nombre, sin fecha, sin lote', { vacunas: [fila({ nombre: null, fecha_aplicada: null, fecha_aplicada_precision: null, lote: null })], plan_impreso: [] }],
  ['nombre en cadena vacía (no es lo mismo que null)', { vacunas: [fila({ nombre: '' })], plan_impreso: [] }],
] as const) {
  proveedorFalso(() => malo)
  const { status, json } = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  exigir(`${nombre} → 422`, status === 422 && json.vacunas === undefined, { status })
}
{
  proveedorFalso(() => ({ vacunas: [fila({ nombre: null, fecha_aplicada: null, fecha_aplicada_precision: null, lote: 'A468A01' })], plan_impreso: [] }))
  const a = await llamar({ imageBase64: PIXEL, mediaType: 'image/png' })
  exigir('sin nombre y sin fecha PERO con lote → entra', a.status === 200, a.status)
}
console.log('  ↑ el ancla es un rastro MATERIAL del carnet (fecha o lote), no el campo')
console.log('    `evidencia`: ése es obligatorio y siempre viene lleno, así que exigirlo')
console.log('    sería una regla vacua. Interpretación declarada de la firma.')

console.log(`\n${r === 0 ? 'OK' : 'ROJO'} arnés carnet v2 — ${v} verdes · ${r} rojos\n`)
Deno.exit(r === 0 ? 0 : 1)
