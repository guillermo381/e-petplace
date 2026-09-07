// ARNÉS · `coach-parte` (S113-D, lote 2.1). Proveedor falso: cero llamadas reales.
// El brazo que decide es **cuántas veces llamó al modelo**: silencio y aviso
// único se apagan NO llegando al modelo, y eso no se ve en la respuesta.

const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const TOKEN = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ role: 'authenticated', sub: 'u1' })}.f`

Deno.env.set('ANTHROPIC_API_KEY', 'sk-ant-FALSA')
Deno.env.set('SUPABASE_URL', 'https://falso.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'srk-falsa')

let cuerpos: Record<string, unknown>[] = []
let avisos: unknown = []
let rpcFalla = false
const fetchReal = globalThis.fetch
function falso(texto = 'Hoy hay dos cosas.', estadoModelo = 200) {
  cuerpos = []
  globalThis.fetch = ((e: string | URL | Request, i?: RequestInit) => {
    const url = String(e instanceof Request ? e.url : e)
    if (url.includes('api.anthropic.com')) {
      cuerpos.push(JSON.parse(String(i?.body ?? '{}')))
      if (estadoModelo !== 200) return Promise.resolve(new Response('{"error":"x"}', { status: estadoModelo }))
      return Promise.resolve(new Response(JSON.stringify({
        content: [{ type: 'text', text: texto }], stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      }), { status: 200 }))
    }
    if (url.includes('/auth/v1/user')) {
      return Promise.resolve(new Response('{"id":"u1"}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    if (url.includes('rpc/obtener_avisos_coach')) {
      return rpcFalla
        ? Promise.resolve(new Response('{"message":"no existe"}', { status: 404, headers: { 'Content-Type': 'application/json' } }))
        : Promise.resolve(new Response(JSON.stringify(avisos), { status: 200, headers: { 'Content-Type': 'application/json' } }))
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
const { frase } = await import('../coach-parte/index.ts')

async function llamar(cuerpo: Record<string, unknown> = { mascotaId: 'm1' }, conSesion = true) {
  const res = await manejador!(new Request('http://local/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(conSesion ? { Authorization: `Bearer ${TOKEN}` } : {}) },
    body: JSON.stringify(cuerpo),
  }))
  const txt = await res.text()
  let json: Record<string, unknown> = {}
  try { json = JSON.parse(txt) } catch { /* 204 no trae cuerpo */ }
  return { status: res.status, json, txt }
}

let v = 0, r = 0
const exigir = (n: string, ok: boolean, visto?: unknown) => {
  if (ok) { v++; console.log(`  OK   ${n}`) }
  else { r++; console.log(`  ROJO ${n}${visto === undefined ? '' : ` — visto: ${JSON.stringify(visto)}`}`) }
}

console.log('\n== 1 · 🔴 EL SILENCIO ES LA FUNCIÓN ==')
{
  avisos = []; falso()
  const a = await llamar()
  exigir('cero avisos → 204', a.status === 204, a.status)
  exigir('  ...SIN cuerpo (un 200 vacío invita a pintar una tarjeta con nada)', a.txt === '', a.txt)
  exigir('  ...🔴 CERO llamadas al modelo', cuerpos.length === 0, cuerpos.length)
}

console.log('\n== 2 · UN AVISO: la plantilla YA es la frase ==')
for (const [caso, aviso, dentro] of [
  ['vence en 12 días', { tipo: 'vacuna', titulo: 'La polivalente vence', dias: 12 }, 'en 12 días'],
  ['es hoy', { tipo: 'cita', titulo: 'Tenés cita con la clínica', dias: 0 }, 'es hoy'],
  ['es mañana', { tipo: 'cita', titulo: 'Tenés cita', dias: 1 }, 'es mañana'],
  ['venció hace 3', { tipo: 'antip', titulo: 'El antiparasitario venció', dias: -3 }, 'hace 3 días'],
  ['venció hace 1 (singular)', { tipo: 'antip', titulo: 'Venció', dias: -1 }, 'hace 1 día'],
] as const) {
  avisos = [aviso]; falso()
  const a = await llamar()
  exigir(`${caso} → 200 por plantilla`, a.status === 200 && a.json.fuente === 'plantilla', { s: a.status, f: a.json.fuente })
  exigir(`  ...dice «${dentro}»`, String(a.json.parte).includes(dentro), a.json.parte)
  exigir('  ...🔴 CERO llamadas al modelo', cuerpos.length === 0, cuerpos.length)
}
{
  // 🔴 sin `dias` NO se inventa un plazo: la frase sale sin cuándo.
  avisos = [{ tipo: 'x', titulo: 'Falta cargar el carnet' }]; falso()
  const a = await llamar()
  exigir('sin `dias`, NO se inventa un plazo', a.json.parte === 'Falta cargar el carnet.', a.json.parte)
  exigir('  ...y sigue sin tocar el modelo', cuerpos.length === 0, cuerpos.length)
}

console.log('\n== 3 · DOS O MÁS: recién ahí hay que hilar ==')
{
  avisos = [
    { tipo: 'vacuna', titulo: 'La polivalente vence', dias: 12 },
    { tipo: 'cita', titulo: 'Tenés cita con la clínica', dias: 1 },
  ]
  falso('Mañana tenés la cita y la polivalente vence en doce días.')
  const a = await llamar()
  exigir('dos avisos → el modelo', a.status === 200 && a.json.fuente === 'modelo', a.json.fuente)
  exigir('  ...UNA sola llamada', cuerpos.length === 1, cuerpos.length)
  exigir('  ...y los DOS avisos viajan ya redactados por la plantilla',
    JSON.stringify(cuerpos[0].messages).includes('en 12 días') &&
    JSON.stringify(cuerpos[0].messages).includes('es mañana'),
    JSON.stringify(cuerpos[0].messages).slice(0, 200))
  const sis = JSON.stringify(cuerpos[0].system ?? '')
  for (const ley of ['120 palabras', 'Sólo decís lo que está en la lista', 'No diagnostic', 'niños', 'sin pregunta'])
    exigir(`  la ley dice «${ley}»`, sis.includes(ley))
  exigir('  sonnet, 400 tokens, thinking disabled ESCRITO',
    cuerpos[0].model === 'claude-sonnet-5' && cuerpos[0].max_tokens === 400 &&
    JSON.stringify(cuerpos[0].thinking) === '{"type":"disabled"}',
    { m: cuerpos[0].model, t: cuerpos[0].max_tokens, th: cuerpos[0].thinking })
  exigir('  y su system NO va cacheado (se manda una vez por día: el caché cobra de más)',
    !JSON.stringify(cuerpos[0].system).includes('cache_control'))
}

console.log('\n== 4 · 🔴 SI EL REDACTOR SE CAE, EL AVISO NO SE PIERDE ==')
{
  avisos = [
    { tipo: 'vacuna', titulo: 'La polivalente vence', dias: 12 },
    { tipo: 'cita', titulo: 'Tenés cita', dias: 1 },
  ]
  falso('', 500)
  const a = await llamar()
  exigir('modelo caído → 200 igual, con las plantillas', a.status === 200 && a.json.fuente === 'plantilla_de_respaldo', { s: a.status, f: a.json.fuente })
  exigir('  ...y NO se pierde ningún aviso', String(a.json.parte).includes('12 días') && String(a.json.parte).includes('mañana'), a.json.parte)
  console.log('     ↑ un aviso que no sale porque el redactor se cayó es un vencimiento que nadie vio.')
}

console.log('\n== 5 · EL LECTOR CAÍDO ES SILENCIO, PERO SE GRITA ==')
{
  rpcFalla = true; falso()
  const a = await llamar()
  exigir('RPC caída → 204, no un parte inventado', a.status === 204 && a.txt === '', { s: a.status, t: a.txt })
  exigir('  ...cero modelo', cuerpos.length === 0, cuerpos.length)
  console.log('     ↑ 204 por error y 204 por «no hay nada» se ven IGUALES desde afuera,')
  console.log('       por eso el error va al log aunque la respuesta sea la misma.')
  rpcFalla = false
}

console.log('\n== 6 · LA PUERTA, Y LA BASURA QUE NO TUMBA LA TANDA ==')
{
  falso()
  const a = await llamar({ mascotaId: 'm1' }, false)
  exigir('sin sesión → 401', a.status === 401, a.status)
  const b = await llamar({})
  exigir('sin mascotaId → 400', b.status === 400, b.status)
  exigir('  ...ninguno tocó el modelo', cuerpos.length === 0, cuerpos.length)
}
{
  // un aviso sin título no tumba el parte: se cae él y los otros salen.
  avisos = [
    { tipo: 'vacuna', titulo: 'La polivalente vence', dias: 12 },
    { tipo: 'roto' },
    { tipo: 'cita', titulo: 'Tenés cita', dias: 1 },
  ]
  falso('dos cosas')
  const a = await llamar()
  exigir('aviso sin título → se cae ÉL, los otros dos siguen', a.json.avisos === 2, a.json.avisos)
  exigir('  ...y sigue siendo trabajo de hilar', a.json.fuente === 'modelo', a.json.fuente)
}
{
  // y si de tres sólo queda UNO válido, vuelve a ser plantilla: cero modelo.
  avisos = [{ tipo: 'roto' }, { tipo: 'cita', titulo: 'Tenés cita', dias: 1 }, { titulo: '   ' }]
  falso()
  const a = await llamar()
  exigir('si queda UNO válido, vuelve a plantilla y NO paga modelo',
    a.json.fuente === 'plantilla' && cuerpos.length === 0, { f: a.json.fuente, n: cuerpos.length })
}

console.log('\n== 6bis · 🔴 EL AVISO DE ANTICIPACIÓN: estadística de raza, NO diagnóstico ==')
{
  const anticipacion = {
    etapa: 'senior', cuando: 'en marzo', raza: 'Bulldog inglés',
    descripcion_familia: 'suelen tener problemas de cadera',
    chequeo_sugerido: 'vale la pena hablar con tu vet de un estudio de cadera en su próximo chequeo',
  }
  avisos = [{ tipo: 'anticipacion', titulo: 'Cambio de etapa', anticipacion, nombre: 'Thor' }]
  falso()
  const { status, json } = await llamar()
  const t = String(json.parte)
  exigir('200 por plantilla, CERO modelo', status === 200 && json.fuente === 'plantilla' && cuerpos.length === 0, { s: status, f: json.fuente, n: cuerpos.length })
  exigir('  el sujeto de la patología es LA RAZA, en plural', /Los Bulldog inglés suelen tener/.test(t), t)
  exigir('  🔴 y NUNCA «Thor tiene»', !/Thor (tiene|padece|sufre|puede tener)/i.test(t), t)
  exigir('  🔴 ni «displasia» como hallazgo suyo', !/Thor.{0,40}(displasia|problemas de cadera)/i.test(t), t)
  exigir('  la mascota aparece SÓLO cambiando de etapa', /Thor entra a senior en marzo/.test(t), t)
  exigir('  y termina mandando a hablarlo con el vet', /hablar con tu vet/.test(t), t)
  exigir('  cero palabras de alarma', !/urgente|grave|peligro|riesgo|alarma|ya mismo/i.test(t), t)
  console.log('     ↑ «los Bulldog suelen tener» es una estadística; «Thor tiene» es un')
  console.log('       diagnóstico, y entre las dos hay una sola coma de distancia.')
  console.log('     «' + t + '»')
}
{
  // los dos textos salen VERBATIM del catálogo de A: si esta edge los
  // recompusiera, habría dos versiones y la que se lee no sería la revisada.
  avisos = [{ tipo: 'anticipacion', titulo: 'x', nombre: 'Nube', anticipacion: {
    etapa: 'adulto', cuando: null, raza: 'Gato Común',
    descripcion_familia: 'TEXTO-EXACTO-DE-A', chequeo_sugerido: 'CHEQUEO-EXACTO-DE-A' } }]
  falso()
  const { json } = await llamar()
  exigir('la descripción de A viaja VERBATIM', String(json.parte).includes('TEXTO-EXACTO-DE-A'), json.parte)
  exigir('  y el chequeo de A también', String(json.parte).includes('CHEQUEO-EXACTO-DE-A'), json.parte)
  exigir('  sin `cuando`, la frase no inventa una fecha', !/ en /.test(String(json.parte).split('.')[0]), json.parte)
}

console.log('\n== 7 · CONTROL de `frase` (la pieza pura, sin edge) ==')
{
  exigir('el detalle se pega con punto', frase({ tipo: 'x', titulo: 'Algo', detalle: 'Y esto' } as never) === 'Algo. Y esto')
  exigir('sin detalle cierra con punto', frase({ tipo: 'x', titulo: 'Algo' } as never) === 'Algo.')
  exigir('dias 0 es hoy', frase({ tipo: 'x', titulo: 'A', dias: 0 } as never) === 'A — es hoy.')
}

console.log(`\n${r === 0 ? 'OK' : 'ROJO'} arnés coach-parte — ${v} verdes · ${r} rojos\n`)
if (r > 0) Deno.exit(1)
