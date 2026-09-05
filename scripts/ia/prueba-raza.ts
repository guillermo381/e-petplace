// ARNÉS DE CONTRATO DE `sugerir-raza` — S113-D, lote 1.2.
//
// ⚠️ MISMA ADVERTENCIA QUE EL CARNET: corre con PROVEEDOR FALSO. No prueba que
// el modelo reconozca un labrador; prueba que la edge **acepte lo correcto y
// rechace todo lo demás**, y que la lista blanca se exija en el VALIDADOR y no
// sólo en el prompt. La exactitud la mide E con las fotos reales.
//
// El interceptor de `fetch` sirve las TRES cosas: el catálogo de `cat_razas`,
// la llamada al modelo y el insert a `ia_uso`.

import { llamarModelo as _ } from '../_shared/ia/mod.ts'
void _

Deno.env.set('ANTHROPIC_API_KEY', 'sk-ant-FALSA-DE-PRUEBA')
Deno.env.set('SUPABASE_URL', 'https://proyecto-falso.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-falsa')

const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const tokenDe = (rol: string) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ role: rol })}.firma`
const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

// Los slugs son los REALES de `cat_razas`, tipos incluidos: `pitbul-terrier`
// tiene una sola L y `jack-rusell` una sola S. **Se copian tal cual.** Si el
// arnés los "corrigiera", estaría midiendo un catálogo que no existe.
const CATALOGO_PERRO = ['criollo', 'golden-retriever', 'jack-rusell', 'labrador-retriever', 'pitbul-terrier']

let cuerpoSalida: Record<string, unknown> | null = null
let filasUso = 0
const fetchReal = globalThis.fetch
function proveedorFalso(devuelve: () => unknown, catalogo: string[] = CATALOGO_PERRO) {
  cuerpoSalida = null
  filasUso = 0
  globalThis.fetch = ((entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada)
    if (url.includes('api.anthropic.com')) {
      cuerpoSalida = JSON.parse(String(init?.body ?? '{}'))
      return Promise.resolve(new Response(JSON.stringify({
        content: [{ type: 'text', text: JSON.stringify(devuelve()) }],
        stop_reason: 'end_turn', usage: { input_tokens: 5, output_tokens: 5 },
      }), { status: 200 }))
    }
    if (url.includes('/rest/v1/cat_razas')) {
      return Promise.resolve(new Response(JSON.stringify(catalogo.map((slug) => ({ slug }))),
        { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    if (url.includes('/rest/v1/ia_uso')) { filasUso++; return Promise.resolve(new Response('[]', { status: 201 })) }
    if (url.includes('/rest/v1/')) return Promise.resolve(new Response('[]', { status: 200 }))
    return fetchReal(entrada as string, init)
  }) as typeof fetch
}

let manejador: ((r: Request) => Response | Promise<Response>) | null = null
// deno-lint-ignore no-explicit-any
;(Deno as any).serve = (h: any) => {
  manejador = typeof h === 'function' ? h : h?.fetch
  return { finished: Promise.resolve(), shutdown: () => Promise.resolve(), addr: { hostname: '', port: 0 } }
}
await import('../sugerir-raza/index.ts')

async function llamar(cuerpo: Record<string, unknown>, rol = 'authenticated') {
  const res = await manejador!(new Request('http://local/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDe(rol)}` },
    body: JSON.stringify(cuerpo),
  }))
  let json: Record<string, unknown> = {}
  try { json = await res.json() } catch { /* sin JSON */ }
  return { status: res.status, json }
}
const base = { imagenBase64: PIXEL, mediaType: 'image/png', especie: 'perro' }

let v = 0, r = 0
const exigir = (n: string, c: boolean, visto?: unknown) => {
  if (c) { v++; console.log(`  OK   ${n}`) }
  else { r++; console.log(`  ROJO ${n}${visto === undefined ? '' : ` — visto: ${JSON.stringify(visto)}`}`) }
}

console.log('\n== 1 · VERDE: tres candidatas del catálogo ==')
{
  proveedorFalso(() => ({
    candidatas: [
      { raza_codigo: 'labrador-retriever', confianza: 'alta' },
      { raza_codigo: 'golden-retriever', confianza: 'media' },
      { raza_codigo: 'criollo', confianza: 'baja' },
    ], mestizo: false, sin_animal: false,
  }))
  const { status, json } = await llamar(base)
  exigir('200', status === 200, status)
  exigir('3 candidatas', (json.candidatas as unknown[])?.length === 3)
  exigir('escribe su fila en ia_uso', filasUso === 1, filasUso)
  exigir('el catálogo entró al prompt', String(cuerpoSalida?.messages ?? '').includes('labrador-retriever') || JSON.stringify(cuerpoSalida).includes('labrador-retriever'))
  exigir('modelo por defecto haiku', cuerpoSalida?.model === 'claude-haiku-4-5', cuerpoSalida?.model)
  exigir('haiku SIN campo thinking', cuerpoSalida?.thinking === undefined)
}

console.log('\n== 2 · ROJO PEDIDO: foto sin animal ==')
{
  proveedorFalso(() => ({ candidatas: [], mestizo: false, sin_animal: true }))
  const { status, json } = await llamar(base)
  exigir('200 (no es un error: es una respuesta)', status === 200, status)
  exigir('sin_animal true', json.sin_animal === true)
  exigir('candidatas vacías', (json.candidatas as unknown[])?.length === 0)
}

console.log('\n== 3 · ROJO PEDIDO: un gato con especie «perro» declarada ==')
{
  proveedorFalso(() => ({ candidatas: [], mestizo: false, sin_animal: false }))
  const { status, json } = await llamar(base)
  exigir('200', status === 200, status)
  exigir('candidatas vacías', (json.candidatas as unknown[])?.length === 0)
  exigir('sin_animal FALSE (hay animal, no es de la especie)', json.sin_animal === false, json.sin_animal)
}

console.log('\n== 4 · LA LISTA BLANCA SE EXIGE EN EL VALIDADOR ==')
for (const [nombre, malo] of [
  ['raza inventada',            { candidatas: [{ raza_codigo: 'labradoodle', confianza: 'alta' }], mestizo: false, sin_animal: false }],
  ['raza de OTRA especie',      { candidatas: [{ raza_codigo: 'siames', confianza: 'alta' }], mestizo: false, sin_animal: false }],
  ['slug "corregido"',          { candidatas: [{ raza_codigo: 'pitbull-terrier', confianza: 'alta' }], mestizo: false, sin_animal: false }],
  ['cuatro candidatas',         { candidatas: CATALOGO_PERRO.slice(0, 4).map((s) => ({ raza_codigo: s, confianza: 'alta' })), mestizo: false, sin_animal: false }],
  ['candidata repetida',        { candidatas: [{ raza_codigo: 'criollo', confianza: 'alta' }, { raza_codigo: 'criollo', confianza: 'baja' }], mestizo: true, sin_animal: false }],
  ['confianza inventada',       { candidatas: [{ raza_codigo: 'criollo', confianza: 'segurisimo' }], mestizo: false, sin_animal: false }],
  ['mestizo no booleano',       { candidatas: [], mestizo: 'si', sin_animal: false }],
  ['se contradice',             { candidatas: [{ raza_codigo: 'criollo', confianza: 'alta' }], mestizo: false, sin_animal: true }],
] as const) {
  proveedorFalso(() => malo)
  const { status, json } = await llamar(base)
  exigir(`${nombre} → 422 sin datos`, status === 422 && json.candidatas === undefined, { status, datos: json.candidatas !== undefined })
}
console.log('  ↑ «slug corregido» es el caso fino: `pitbul-terrier` tiene UNA L en el')
console.log('    catálogo real. Un modelo que lo escribe "bien" devuelve un código que')
console.log('    no existe, y la fila no se podría guardar. El validador lo caza.')

console.log('\n== 5 · ESPECIE SIN RAZAS: no se llama al modelo ==')
{
  proveedorFalso(() => ({ candidatas: [], mestizo: false, sin_animal: false }), [])
  const { status, json } = await llamar({ ...base, especie: 'dragon' })
  exigir('400 especie_desconocida', status === 400 && json.codigo === 'especie_desconocida', { status, c: json.codigo })
  exigir('CERO llamadas al modelo (no se gasta)', cuerpoSalida === null)
  exigir('cero filas en ia_uso (no hubo llamada que registrar)', filasUso === 0, filasUso)
}

console.log('\n== 6 · LA PALANCA Y EL TECHO ==')
{
  proveedorFalso(() => ({ candidatas: [], mestizo: false, sin_animal: false }))
  const cli = await llamar({ ...base, modelo: 'claude-sonnet-5' }, 'authenticated')
  exigir('authenticated NO elige modelo', cli.status === 400, cli.status)
  proveedorFalso(() => ({ candidatas: [], mestizo: false, sin_animal: false }))
  const srv = await llamar({ ...base, modelo: 'claude-sonnet-5' }, 'service_role')
  exigir('service_role sí, y sonnet lleva thinking disabled', srv.status === 200 && JSON.stringify(cuerpoSalida?.thinking) === '{"type":"disabled"}', cuerpoSalida?.thinking)
  proveedorFalso(() => ({ candidatas: [], mestizo: false, sin_animal: false }))
  const gr = await llamar({ ...base, imagenBase64: 'A'.repeat(2_800_000) })
  exigir('> 2 MB rebota', gr.status === 400 && gr.json.codigo === 'imagen_invalida', gr.status)
}

console.log(`\n${r === 0 ? 'OK' : 'ROJO'} arnés sugerir-raza — ${v} verdes · ${r} rojos\n`)
Deno.exit(r === 0 ? 0 : 1)
