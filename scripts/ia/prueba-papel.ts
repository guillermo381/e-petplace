import { declararObjeto } from './declarar-objeto.ts'
// ARNÉS · `extract-papel` (S113-D, lote 2.2). Proveedor falso, cero llamadas.
// La ley —transcribe, no interpreta— la mide el modelo real (`papel-real.ts`);
// acá se mide el CABLEADO: qué entra, qué se anula, qué se descarta.

const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const TOKEN = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ role: 'authenticated' })}.f`
const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

Deno.env.set('ANTHROPIC_API_KEY', 'sk-ant-FALSA')
Deno.env.set('SUPABASE_URL', 'https://falso.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'srk-falsa')

let cuerpos: Record<string, unknown>[] = []
const fetchReal = globalThis.fetch
function falso(devuelve: () => unknown) {
  cuerpos = []
  globalThis.fetch = ((e: string | URL | Request, i?: RequestInit) => {
    const url = String(e instanceof Request ? e.url : e)
    if (url.includes('api.anthropic.com')) {
      cuerpos.push(JSON.parse(String(i?.body ?? '{}')))
      return Promise.resolve(new Response(JSON.stringify({
        content: [{ type: 'text', text: JSON.stringify(devuelve()) }],
        stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 },
      }), { status: 200 }))
    }
    if (url.includes('/rest/v1/')) return Promise.resolve(new Response('[]', { status: 201 }))
    return fetchReal(e as string, i)
  }) as typeof fetch
}

let manejador: ((r: Request) => Response | Promise<Response>) | null = null
// deno-lint-ignore no-explicit-any
;(Deno as any).serve = (h: any) => {
  manejador = typeof h === 'function' ? h : h?.fetch
  return { finished: Promise.resolve(), shutdown: () => Promise.resolve(), addr: { hostname: '', port: 0 } }
}
const { sanearFila, precisionDe } = await import('../extract-papel/index.ts')

// 🔴 CONTRA QUÉ MIDE ESTE ARNÉS. La huella se calcula al momento: una
// escrita a mano es justo el problema que esto viene a evitar.
await declararObjeto({
  mide: ['supabase/functions/extract-papel/index.ts', 'supabase/functions/_shared/ia/mod.ts'],
  modeloReal: false,
  noCubre: 'la LEY de no interpretar, que es comportamiento del modelo y la mide `papel-real.ts` sobre un PDF.',
})

async function llamar(cuerpo: Record<string, unknown>, conSesion = true) {
  const res = await manejador!(new Request('http://local/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(conSesion ? { Authorization: `Bearer ${TOKEN}` } : {}) },
    body: JSON.stringify(cuerpo),
  }))
  let json: Record<string, unknown> = {}
  try { json = await res.json() } catch { /* */ }
  return { status: res.status, json }
}
const { tipoPorBytes } = await import('../extract-papel/index.ts')

const analito = (o: Record<string, unknown> = {}) => ({
  nombre: 'Creatinina', valor: '1.8', unidad: 'mg/dL', referencia: '0.5 - 1.6',
  literal: 'Creatinina 1.8 mg/dL (0.5 - 1.6) H', fecha: '2026-08-12',
  fecha_precision: 'dia', evidencia: 'impreso', confianza: 'alta', ...o,
})
const salida = (filas: unknown[], o: Record<string, unknown> = {}) =>
  ({ clase: 'examen', fecha_documento: '2026-08-12', emisor: 'Lab San Jorge', filas, ...o })

let v = 0, r = 0
const exigir = (n: string, ok: boolean, visto?: unknown) => {
  if (ok) { v++; console.log(`  OK   ${n}`) }
  else { r++; console.log(`  ROJO ${n}${visto === undefined ? '' : ` — visto: ${JSON.stringify(visto)}`}`) }
}

console.log('\n== 1 · LA PUERTA ==')
{
  falso(() => salida([analito()]))
  exigir('sin sesión → 401', (await llamar({ imageBase64: PIXEL }, false)).status === 401)
  exigir('sin imageBase64 → 400', (await llamar({})).status === 400)
  exigir('archivo gigante → 400', (await llamar({ imageBase64: 'x'.repeat(7_000_001) })).status === 400)
  exigir('  ...y ninguno tocó el modelo', cuerpos.length === 0, cuerpos.length)
}

console.log('\n== 2 · 🔴 UN PDF VIAJA COMO DOCUMENTO, UNA FOTO COMO IMAGEN ==')
{
  falso(() => salida([analito()]))
  const a = await llamar({ imageBase64: 'JVBERi0x', mediaType: 'application/pdf' })
  const c = (cuerpos[0].messages as { content: { type: string }[] }[])[0].content
  exigir('el PDF sale como `document`', c[0].type === 'document', c[0])
  exigir('  ...y `modo_captura` se DERIVA del archivo, no del cliente', a.json.modo_captura === 'pdf', a.json.modo_captura)
  falso(() => salida([analito()]))
  /* `PIXEL` son bytes PNG y acá se declaran `image/jpeg`: el tipo real gana
     (`image/png`) y el modo sigue siendo `foto` — que es lo que este caso mide. */
  const b = await llamar({ imageBase64: PIXEL, mediaType: 'image/jpeg' })
  const c2 = (cuerpos[0].messages as { content: { type: string }[] }[])[0].content
  exigir('la foto sale como `image`', c2[0].type === 'image', c2[0])
  exigir('  ...y su modo es `foto`', b.json.modo_captura === 'foto', b.json.modo_captura)
  /* 🔴 ESTE CASO ERA UN VERDE FALSO Y SE DESTAPÓ EN LA FASE 3. Mandaba
     `PIXEL` —que son bytes **PNG**— diciendo `mediaType: 'application/pdf'`, y
     exigía que el modo saliera `pdf`. Pasaba… **porque el código le creía a la
     etiqueta del cliente**, que es exactamente lo que este caso dice impedir.
     *El nombre del test era correcto y su fixture no podía distinguir.*
     Ahora el modo sale de los BYTES, así que la mentira se prueba de verdad:
     bytes de PDF con `modo_captura: 'foto'` → `pdf`, y su ESPEJO, que es la
     dirección que el código viejo tenía mal y nadie medía. */
  falso(() => salida([analito()]))
  const d = await llamar({ imageBase64: 'JVBERi0xLjQKMSAw', mediaType: 'image/png', modo_captura: 'foto' })
  exigir('🔴 el cliente NO puede mentir el modo — bytes de PDF ⇒ pdf', d.json.modo_captura === 'pdf', d.json.modo_captura)
  falso(() => salida([analito()]))
  const e2 = await llamar({ imageBase64: PIXEL, mediaType: 'application/pdf', modo_captura: 'pdf' })
  exigir('  ...y EL ESPEJO: bytes de PNG declarados PDF ⇒ foto', e2.json.modo_captura === 'foto', e2.json.modo_captura)
}

console.log('\n== 3 · EL CUERPO, Y LA LEY EN EL PROMPT ==')
{
  falso(() => salida([analito()]))
  await llamar({ imageBase64: PIXEL })
  const b = cuerpos[0]
  exigir('sonnet, 4000 tokens, thinking disabled ESCRITO',
    b.model === 'claude-sonnet-5' && b.max_tokens === 4000 && JSON.stringify(b.thinking) === '{"type":"disabled"}',
    { m: b.model, t: b.max_tokens, th: b.thinking })
  const txt = JSON.stringify(b.messages)
  for (const ley of ['NO DECÍS SI UN RESULTADO ESTÁ BIEN O MAL', 'no nombrás enfermedades'.toUpperCase().slice(0, 3), 'copiar lo que el laboratorio escribió no es', 'NUNCA inventes el día'])
    exigir(`  el prompt dice «${ley.slice(0, 40)}»`, txt.includes(ley))
}

console.log('\n== 4 · VOCABULARIOS: lo que no está en la lista se ANULA, no tumba ==')
for (const [caso, fila, campo] of [
  ['evidencia inventada', analito({ evidencia: 'intuicion' }), 'evidencia'],
  ['confianza inventada', analito({ confianza: 'segurisima' }), 'confianza'],
] as const) {
  falso(() => salida([fila, analito({ nombre: 'ALT' })]))
  const a = await llamar({ imageBase64: PIXEL })
  const f = (a.json.filas as Record<string, unknown>[])[0]
  exigir(`${caso} → 200 con las DOS filas`, a.status === 200 && (a.json.filas as unknown[]).length === 2, a.status)
  exigir(`  ...\`${campo}\` anulado (o al respaldo) y la fila MARCADA`,
    f.dudosa === 'incompleta' && (f[campo] === null || f[campo] === 'baja'), { c: f[campo], d: f.dudosa })
}
{
  falso(() => salida([analito()], { clase: 'radiografia' }))
  const a = await llamar({ imageBase64: PIXEL })
  exigir('clase fuera del vocabulario → null, no la inventada', a.json.clase === null, a.json.clase)
  exigir('  ...y las filas igual salen', (a.json.filas as unknown[]).length === 1)
}

console.log('\n== 5 · LO QUE FALTA NO TUMBA LA TANDA ==')
{
  falso(() => salida([analito(), { nombre: 'Urea', literal: 'Urea 40 mg/dL' }, analito({ nombre: 'ALT' })]))
  const a = await llamar({ imageBase64: PIXEL })
  const f = (a.json.filas as Record<string, unknown>[])[1]
  exigir('fila a medias → entra MARCADA', (a.json.filas as unknown[]).length === 3 && f.dudosa === 'incompleta', f)
  exigir('  ...con sus campos en null, no ausentes', f.valor === null && f.unidad === null)
  exigir('  ...y conserva lo que traía', f.nombre === 'Urea' && f.literal === 'Urea 40 mg/dL')
}
{
  falso(() => salida([analito(), { ...analito(), nombre: 42 }, analito({ nombre: 'ALT' })]))
  const a = await llamar({ imageBase64: PIXEL })
  const d = a.json.filas_descartadas as { indice: number; motivo: string }[]
  exigir('tipo equivocado → descarta ESA fila', (a.json.filas as unknown[]).length === 2 && d[0].indice === 2, { n: (a.json.filas as unknown[]).length, d })
  exigir('  ...y dice cuál', d[0].motivo === '`nombre` no es texto', d[0].motivo)
}
{
  falso(() => salida([{ evidencia: 'impreso' }, analito()]))
  const a = await llamar({ imageBase64: PIXEL })
  const d = a.json.filas_descartadas as { motivo: string }[]
  exigir('EL ANCLA: sin nombre y sin literal, la fila no existe',
    (a.json.filas as unknown[]).length === 1 && d[0].motivo.startsWith('sin nombre y sin literal'), d)
}
{
  falso(() => salida([analito({ fecha: '12/08/2026' })]))
  const a = await llamar({ imageBase64: PIXEL })
  const f = (a.json.filas as Record<string, unknown>[])[0]
  exigir('fecha ilegible → null + marca, NO descarte', f.fecha === null && f.fecha_precision === null && f.dudosa === 'incompleta', f)
}

console.log('\n== 6 · LA PRECISIÓN SE DERIVA DE LA FORMA ==')
for (const [v_, esperado] of [['2026-08-12', 'dia'], ['2026-08', 'mes'], ['--08-12', 'sin_anio'], ['2026-8-1', null]] as const) {
  exigir(`«${v_}» → ${esperado}`, precisionDe(v_) === esperado, precisionDe(v_))
}
{
  falso(() => salida([analito({ fecha: '2026-08', fecha_precision: 'dia' })]))
  const a = await llamar({ imageBase64: PIXEL })
  const f = (a.json.filas as Record<string, unknown>[])[0]
  exigir('el modelo dice `dia` y la forma dice `mes` → gana la FORMA', f.fecha_precision === 'mes', f.fecha_precision)
}

console.log('\n== 7 · CONTROL de `sanearFila` (la pieza pura) ==')
{
  const ok = sanearFila(analito(), 'examen')
  exigir('fila completa → ok, sin marca', ok.ok === true && ok.incompleta === false)
  exigir('no-objeto → descarte con motivo', sanearFila(7, 'examen').ok === false)
  const r2 = sanearFila({ nombre: 'X', literal: 'X 1' }, 'receta')
  exigir('la clase viaja en la fila', r2.ok === true && r2.fila.clase === 'receta', r2.ok && r2.fila.clase)
}

console.log('\n== 8 · 🔴 NULL PORQUE NO APLICA ≠ NULL PORQUE NO SE PUDO LEER ==')
{
  // Un examen NO tiene dosis. Marcarlo por eso haría que la marca signifique
  // «esto es un examen» en vez de «no se pudo leer algo».
  const e = sanearFila(analito(), 'examen')
  exigir('examen completo, SIN dosis → no marcado', e.ok === true && e.incompleta === false, e.ok && e.incompleta)
  const rec = sanearFila({ nombre: 'Enrofloxacina 50mg', dosis: '1 comprimido', frecuencia: 'cada 24 h',
    hasta_cuando: '7 días', literal: 'Enrofloxacina 50mg 1 comp c/24h x 7 días', fecha: '2026-08-12',
    evidencia: 'manuscrito', confianza: 'alta' }, 'receta')
  exigir('receta completa, SIN unidad ni referencia → no marcada', rec.ok === true && rec.incompleta === false, rec.ok && rec.incompleta)
  const inf = sanearFila({ nombre: 'Informe ecográfico', nota: 'Tres líneas.', fecha: '2026-08-12',
    evidencia: 'membrete', confianza: 'media' }, 'informe')
  exigir('informe completo, SIN valor ni dosis → no marcado', inf.ok === true && inf.incompleta === false, inf.ok && inf.incompleta)
  // y el par que discrimina: lo que SÍ aplica y falta, marca.
  const sinValor = sanearFila(analito({ valor: undefined }), 'examen')
  exigir('CONTROL: examen SIN valor → SÍ marcado', sinValor.ok === true && sinValor.incompleta === true, sinValor.ok && sinValor.incompleta)
  const sinDosis = sanearFila({ nombre: 'X', literal: 'X', fecha: '2026-08-12', evidencia: 'impreso', confianza: 'alta' }, 'receta')
  exigir('CONTROL: receta SIN dosis → SÍ marcada', sinDosis.ok === true && sinDosis.incompleta === true, sinDosis.ok && sinDosis.incompleta)
}

console.log('\n== 6 · LOS DOS ROJOS DE LA FASE 3 (dictado del founder) ==')
{
  /* 🔴 ① UN VALOR FUERA DE RANGO VUELVE CON SU MARCA Y SIN ADJETIVO.
     La Creatinina del fixture es 1.8 sobre un rango 0.5-1.6 —fuera de rango— y
     el papel trae la `H`. Lo que tiene que pasar: la `H` VIAJA (la escribió el
     laboratorio: copiarla es leer, no interpretar) y **ninguna palabra de
     juicio aparece en ningún campo**. */
  const fila = sanearFila(analito(), 'examen')
  const texto = JSON.stringify(fila).toLowerCase()
  const JUICIOS = ['alto', 'alta', 'bajo', 'baja', 'elevad', 'normal', 'anormal',
                   'preocupa', 'grave', 'leve', 'severo', 'insuficien']
  /* `confianza: 'alta'` es un campo del contrato, no un juicio sobre el valor:
     se saca antes de buscar. *Si no, el gate daría rojo sobre su propio
     vocabulario y su rojo dejaría de significar algo.* */
  const sinConfianza = texto.replace(/"confianza":"[a-z]+"/g, '')
  const cuela = JUICIOS.filter((j) => sinConfianza.includes(j))
  exigir('valor fuera de rango: la marca `H` viaja en el literal',
    fila.ok === true && String((fila as any).fila?.literal ?? '').includes('H'))
  exigir('  ...y NINGÚN adjetivo de juicio en la fila', cuela.length === 0, cuela)

  /* 🔴 ② UN PDF MANDADO COMO IMAGEN SE RECHAZA POR BLOQUE, NO DA LECTURA BASURA.
     Antes, un `mediaType` que no estuviera en la lista **caía a `image/jpeg`**,
     así que un PDF viajaba en un bloque `image` y el proveedor devolvía basura
     o un error opaco. *No fallaba en la puerta: fallaba adentro, y a la familia
     le llegaba «no pudimos leer el papel».* Ahora el tipo se lee de los BYTES.
     Encabezados reales, no inventados. */
  const B64 = {
    pdf: 'JVBERi0xLjQKMSAwIG9iago8',            // %PDF-1.4
    png: 'iVBORw0KGgoAAAANSUhEUg==',            // \x89PNG\r\n\x1a\n
    jpeg: '/9j/4AAQSkZJRgABAQEAYABg',           // \xFF\xD8\xFF
    webp: 'UklGRmQAAABXRUJQVlA4IA==',           // RIFF....WEBP
    basura: 'ZXN0byBubyBlcyBuaSB1bmEg',         // texto plano
  }
  exigir('PDF por sus bytes', tipoPorBytes(B64.pdf) === 'application/pdf', tipoPorBytes(B64.pdf))
  exigir('PNG por sus bytes', tipoPorBytes(B64.png) === 'image/png', tipoPorBytes(B64.png))
  exigir('JPEG por sus bytes', tipoPorBytes(B64.jpeg) === 'image/jpeg', tipoPorBytes(B64.jpeg))
  exigir('WebP por sus bytes', tipoPorBytes(B64.webp) === 'image/webp', tipoPorBytes(B64.webp))
  exigir('CONTROL: lo que no es ninguno → null (se rechaza)', tipoPorBytes(B64.basura) === null, tipoPorBytes(B64.basura))
  exigir('EL ROJO: un PDF declarado "image/png" NO viaja como imagen',
    tipoPorBytes(B64.pdf) === 'application/pdf')

  falso(() => salida([analito()]))
  const rBasura = await llamar({ imageBase64: B64.basura, mediaType: 'image/png' })
  exigir('  ...y un archivo que no es foto ni PDF rebota 400', rBasura.status === 400, rBasura.status)
  exigir('  ...sin haber tocado el modelo', cuerpos.length === 0, cuerpos.length)
}

console.log(`\n${r === 0 ? 'OK' : 'ROJO'} arnés extract-papel — ${v} verdes · ${r} rojos\n`)
if (r > 0) Deno.exit(1)
