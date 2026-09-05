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
// ⚠️ `yorkshire-terrier` entra por el mandato del founder, NO por una medición
// mía contra `cat_razas`: la service_role del llavero está truncada (reportado
// a E). Los otros seis SÍ los medí. Si ese slug no existiera en la tabla, el
// caso 7 mediría un catálogo inventado — se declara para que se pueda corregir.
const CATALOGO_PERRO = ['american-bully', 'criollo', 'golden-retriever', 'jack-rusell', 'labrador-retriever', 'pitbul-terrier', 'yorkshire-terrier']

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
      return Promise.resolve(new Response(JSON.stringify(catalogo.map((slug) => ({ slug, nombre: slug.replace(/-/g, ' ') }))),
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
  exigir('modelo por defecto sonnet-5', cuerpoSalida?.model === 'claude-sonnet-5', cuerpoSalida?.model)
  // 🔴 Sonnet 5 razona SOLO si no se le dice lo contrario, y con 500 tokens de
  // techo se los comería pensando: cero caracteres de salida. Haiku podía
  // omitirlo; sonnet NO. Es el gate de la puerta, acá sobre la pieza.
  exigir('sonnet-5 lleva thinking disabled ESCRITO',
    JSON.stringify(cuerpoSalida?.thinking) === '{"type":"disabled"}', cuerpoSalida?.thinking)
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

console.log('\n== 4 · LA CANDIDATA QUE NO SIRVE SE DESCARTA; NO TUMBA LA RESPUESTA ==')
console.log('  (firma del founder tras verlo en vivo: el modelo devolvio «American Bully»')
console.log('   y el codigo es `american-bully`. La raza estaba BIEN y se rechazaba todo.)')
for (const [nombre, entrada, esperadas, motivo] of [
  ['«American Bully» → se normaliza y ENTRA', [{ raza_codigo: 'American Bully', confianza: 'alta' }], ['american-bully'], null],
  ['«Golden Retriever» con mayusculas y espacio', [{ raza_codigo: 'Golden Retriever', confianza: 'media' }], ['golden-retriever'], null],
  ['🔴 EL ROJO DEL FOUNDER: «yorkshire_terrier» → yorkshire-terrier', [{ raza_codigo: 'yorkshire_terrier', confianza: 'alta' }], ['yorkshire-terrier'], null],
  ['guion bajo + mayusculas juntos', [{ raza_codigo: 'Golden_Retriever', confianza: 'media' }], ['golden-retriever'], null],
  ['separador repetido y mezclado', [{ raza_codigo: 'american _ Bully', confianza: 'alta' }], ['american-bully'], null],
  ['guion bajo sobre el slug con UNA L', [{ raza_codigo: 'Pitbul_Terrier', confianza: 'baja' }], ['pitbul-terrier'], null],
  ['«criollo » con espacio y acento raro', [{ raza_codigo: ' Crióllo ', confianza: 'baja' }], ['criollo'], null],
  ['raza inventada → se descarta, las buenas quedan',
    [{ raza_codigo: 'criollo', confianza: 'alta' }, { raza_codigo: 'labradoodle', confianza: 'alta' }], ['criollo'], 'no esta en el catalogo'],
  ['raza de OTRA especie → se descarta', [{ raza_codigo: 'siames', confianza: 'alta' }], [], 'no esta en el catalogo'],
  ['confianza inventada → se descarta esa', [{ raza_codigo: 'criollo', confianza: 'segurisimo' }], [], 'confianza fuera del vocabulario'],
  ['repetida → entra una', [{ raza_codigo: 'criollo', confianza: 'alta' }, { raza_codigo: 'Criollo', confianza: 'baja' }], ['criollo'], 'repetida'],
  ['cuatro → entran tres', CATALOGO_PERRO.slice(0, 4).map((s) => ({ raza_codigo: s, confianza: 'alta' })), CATALOGO_PERRO.slice(0, 3), 'sobra del tope de 3'],
] as const) {
  proveedorFalso(() => ({ candidatas: entrada, mestizo: false, sin_animal: false }))
  const { status, json } = await llamar(base)
  const codigos = (json.candidatas as { raza_codigo: string }[] | undefined)?.map((c) => c.raza_codigo)
  exigir(`${nombre} → 200`, status === 200, { status, codigo: json.codigo })
  exigir(`  ...y quedan [${esperadas.join(', ')}]`, JSON.stringify(codigos) === JSON.stringify(esperadas), codigos)
  if (motivo) {
    const d = json.descartadas as { motivo: string }[] | undefined
    exigir(`  ...y dice por que: ${motivo}`, d?.some((x) => x.motivo === motivo) === true, d)
  }
}
console.log('\n  🔴 NUNCA 422 por una candidata: si no queda ninguna, `candidatas: []` con 200.')
{
  proveedorFalso(() => ({ candidatas: [{ raza_codigo: 'labradoodle', confianza: 'alta' }], mestizo: false, sin_animal: false }))
  const { status, json } = await llamar(base)
  exigir('ninguna sobrevive → 200 con lista vacia', status === 200 && (json.candidatas as unknown[]).length === 0, { status, n: (json.candidatas as unknown[])?.length })
}
console.log('\n  Lo que SI sigue tumbando la respuesta: la FORMA rota, no una candidata.')
for (const [nombre, malo] of [
  ['mestizo no booleano', { candidatas: [], mestizo: 'si', sin_animal: false }],
  ['candidatas no es lista', { candidatas: 'criollo', mestizo: false, sin_animal: false }],
  ['se contradice (sin animal Y candidatas)', { candidatas: [{ raza_codigo: 'criollo', confianza: 'alta' }], mestizo: false, sin_animal: true }],
] as const) {
  proveedorFalso(() => malo)
  const { status, json } = await llamar(base)
  exigir(`${nombre} → 422`, status === 422 && json.candidatas === undefined, { status })
}
console.log('\n  ⚠️ Ojo con `pitbul-terrier`: tiene UNA L en el catalogo. Un modelo que lo')
console.log('     escribe «pitbull-terrier» NO normaliza al mismo slug, y esa candidata')
console.log('     se descarta. Es correcto -- ese codigo no existe -- pero es la clase')
console.log('     de perdida que hay que MEDIR con `descartadas`, no suponer que no pasa.')

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

console.log('\n== 7 · LA SALIDA REAL DE LA FOTO DE ZEUS (American Bully) ==')
console.log('  (corrida contra claude-haiku-4-5 el 5-sep: 1.555 ms, 76 tokens de salida.')
console.log('   Con el catalogo mandado como `slug — nombre`, el modelo devuelve el SLUG')
console.log('   exacto. El normalizador es el cinturon, no el mecanismo.)')
{
  const REAL_ZEUS = {
    candidatas: [
      { raza_codigo: 'american-bully', confianza: 'alta' },
      { raza_codigo: 'pitbul-terrier', confianza: 'media' },
      { raza_codigo: 'boxer', confianza: 'media' },
    ],
    mestizo: false, sin_animal: false,
  }
  proveedorFalso(() => REAL_ZEUS, [...CATALOGO_PERRO, 'boxer'])
  const { status, json } = await llamar(base)
  const codigos = (json.candidatas as { raza_codigo: string }[])?.map((c) => c.raza_codigo)
  exigir('200', status === 200, status)
  exigir('american-bully ENTRE las candidatas', codigos?.includes('american-bully'), codigos)
  exigir('y es la primera, con confianza alta',
    (json.candidatas as { raza_codigo: string; confianza: string }[])?.[0]?.raza_codigo === 'american-bully' &&
    (json.candidatas as { confianza: string }[])?.[0]?.confianza === 'alta')
  exigir('`pitbul-terrier` con UNA L sobrevive (es el slug real)', codigos?.includes('pitbul-terrier'))
  exigir('cero descartadas', (json.descartadas as unknown[])?.length === 0, json.descartadas)
}

console.log(`\n${r === 0 ? 'OK' : 'ROJO'} arnés sugerir-raza — ${v} verdes · ${r} rojos\n`)
Deno.exit(r === 0 ? 0 : 1)
