// DISCRIMINADOR DE CUERPO — S113-D, lote 0.
//
// Ejerce UNA edge de verdad y escribe a disco el cuerpo EXACTO que sale hacia
// Anthropic. Se corre sobre el arbol ANTES de migrar y sobre el arbol DESPUES,
// y se diffean los dos archivos. Si el diff no es vacio (o no es solo
// cache_control), la migracion cambio algo que no debia.
//
// COMO EJERCE LA EDGE, Y POR QUE ASI: en vez de levantar un puerto, se stubbea
// `Deno.serve` ANTES de importar el modulo y se le roba el handler. Es la misma
// ejecucion —el modulo corre entero, con su exigirSesion, sus validaciones y su
// armado de prompt— sin la fragilidad de un puerto.
//
//   deno run --allow-env --allow-net --allow-read --allow-write \
//     capturar-cuerpo.ts <edge> <salida.json>

const edge = Deno.args[0]
const salida = Deno.args[1]

Deno.env.set('ANTHROPIC_API_KEY', 'sk-ant-FALSA-DE-PRUEBA')
Deno.env.set('SUPABASE_URL', 'https://proyecto-falso.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-falsa')

// JWT falso con role=authenticated. `exigirSesion` NO verifica la firma (lo
// hizo verify_jwt en el borde): solo lee el claim.
const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const TOKEN = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ role: 'authenticated' })}.firma`

// Imagen 1x1 png real, en base64. Fija: si variara, el diff seria ruido.
const PIXEL =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const CUERPOS: Record<string, unknown> = {
  'extract-vacuna': { imageBase64: PIXEL, mediaType: 'image/png' },
  'extract-documento': { imagenBase64: PIXEL, mediaType: 'image/png' },
  'estructurar-nota-clinica': {
    texto: 'Paciente llega por vomito de dos dias. Peso 12.4 kilos, temperatura 39.1. Doy metoclopramida 0.5 mg por kilo cada 8 horas por 3 dias.',
    especie: 'perro',
    motivo: 'vomito',
  },
  'escribir-presencia': {
    hechos: [
      { etiqueta: 'verificado', texto: 'Registro veterinario 1234' },
      { etiqueta: 'declarado', texto: 'Atiende a domicilio en Quito' },
    ],
    respuestas: ['Me gusta trabajar con perros grandes.', 'Llevo ocho anios en esto.'],
    intento: 1,
  },
}

let cuerpoCapturado: unknown = null
const filas: Record<string, unknown>[] = []
const fetchReal = globalThis.fetch
globalThis.fetch = ((entrada: string | URL | Request, init?: RequestInit) => {
  const url = String(entrada instanceof Request ? entrada.url : entrada)
  if (url.includes('api.anthropic.com')) {
    cuerpoCapturado = JSON.parse(String(init?.body ?? '{}'))
    return Promise.resolve(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: '{}' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
  }
  if (url.includes('/rest/v1/ia_uso')) {
    filas.push(JSON.parse(String(init?.body ?? '{}')))
    return Promise.resolve(new Response('[]', { status: 201, headers: { 'Content-Type': 'application/json' } }))
  }
  if (url.includes('/rest/v1/')) {
    return Promise.resolve(new Response('[]', { status: 201, headers: { 'Content-Type': 'application/json' } }))
  }
  return fetchReal(entrada as string, init)
}) as typeof fetch

// Robo del handler: stub de Deno.serve ANTES del import.
let manejador: ((req: Request) => Response | Promise<Response>) | null = null
// deno-lint-ignore no-explicit-any
;(Deno as any).serve = (h: any) => {
  manejador = typeof h === 'function' ? h : h?.fetch
  return { finished: Promise.resolve(), shutdown: () => Promise.resolve(), addr: { hostname: '', port: 0 } }
}

await import(`../${edge}/index.ts`)

if (!manejador) {
  console.error(`ROJO: ${edge} no registro handler en Deno.serve`)
  Deno.exit(2)
}

const respuesta = await manejador(
  new Request('http://local/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(CUERPOS[edge]),
  }),
)

if (cuerpoCapturado === null) {
  console.error(`ROJO: ${edge} NO llamo a Anthropic. Status devuelto: ${respuesta.status}`)
  console.error(await respuesta.text())
  Deno.exit(2)
}

await Deno.writeTextFile(salida, JSON.stringify(cuerpoCapturado, null, 2) + '\n')
await Deno.writeTextFile(salida + '.filas.json', JSON.stringify(filas, null, 2) + '\n')
console.log(`  ${edge}: status ${respuesta.status} · filas en ia_uso: ${filas.length}`)
if (filas.length) console.log(`    ${JSON.stringify(filas[0])}`)
