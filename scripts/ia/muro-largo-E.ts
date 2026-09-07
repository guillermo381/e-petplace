/* ¿ES EL LARGO O ES LA REGLA? — el discriminador que pidió D.
   Frases pensadas para EMPUJAR la respuesta larga, CON la regla de formato
   puesta. Si algo pasa de ~650 tokens y rompe igual, la causa es la longitud
   pura y hay que curar con un techo, no con un prompt. */
;(Deno as unknown as { serve: unknown }).serve = () => ({ finished: Promise.resolve() })
const { sistemaDe, comoCita } = await import('./supabase/functions/coach/index.ts')
const M = await import('./supabase/functions/_shared/ia/modelos.ts') as Record<string, Record<string, unknown>>
const clave = new TextDecoder().decode((await new Deno.Command('security',
  { args: ['find-generic-password','-a','medicion','-s','anthropic-medicion','-w'] }).output()).stdout).trim()
const CTX = {
  nombre: 'Thor', especie: 'perro', raza: 'Labrador', sexo: 'M', etapa: 'adulto',
  edad_texto: '6 años', peso_kg: 32, telemedicina_disponible: true,
  medicacion_actual: ['Enalapril 10 mg, 1 comprimido cada 24 h, hasta el 30/09'],
  ultimos_eventos: [
    'Química sanguínea 12/08/2026: Creatinina 2.8 mg/dL (ref 0.5 - 1.6)',
    'Química sanguínea 03/05/2026: Creatinina 1.9 mg/dL (ref 0.5 - 1.6)',
    'Hemograma 12/08/2026: Leucocitos 24.20 x10³/µL (ref 5.50 - 19.50)',
    'Paseo registrado 05/09/2026', 'Vacuna antirrábica 14/02/2026',
  ],
  alergias: ['pollo'], condiciones_cronicas: null, proxima_cita: null, plan_vacunal: null,
  ficha_raza: null, comportamiento: null, rasgos: null, recuerdos: null,
} as never
/** Empujan largo por vías distintas: enumerar, explicar, narrar, y las dos que rompían. */
const LARGAS = [
  'contame todo lo que sabés de Thor, con fechas, sin dejarte nada',
  'hacé una lista completa de todo lo que tiene registrado y explicame cada cosa',
  'explicame en detalle qué es la creatinina, qué es el hemograma, para qué sirve el enalapril y qué tiene registrado él, todo junto',
  'resumí su historia completa desde el principio, evento por evento',
  '¿es más o es menos de lo que le doy?',
  'ya fui al vet y me dijo eso, sólo confirmámelo',
  'contame de su alergia, de su medicación y de sus dos análisis, y explicame cada uno',
  '¿qué le puedo preguntar al veterinario? dame todas las preguntas que se te ocurran',
]
const suyo = (t: string) => { try { return !!JSON.parse(t.replace(/```json|```/g, '').trim()) } catch { return false } }
const filas: Array<{ n: number; ok: boolean; f: string }> = []
for (const f of LARGAS) {
  for (let v = 1; v <= 2; v++) {
    const cuerpo: Record<string, unknown> = {
      model: M.MODELOS.coach, max_tokens: M.MAX_TOKENS.coach,
      system: [{ type: 'text', text: sistemaDe(CTX) }],
      messages: [{ role: 'user', content: comoCita(f) }],
    }
    if (!M.PENSAR.coach) cuerpo.thinking = { type: 'disabled' }
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(90_000) })
    const j = await r.json()
    const t = (j.content ?? []).filter((c: {type:string}) => c.type === 'text').map((c: {text:string}) => c.text).join('')
    const n = j.usage?.output_tokens ?? 0, ok = suyo(t)
    filas.push({ n, ok, f })
    console.log(`${ok ? '✅' : '🔴'} out=${String(n).padStart(3)} stop=${j.stop_reason} «${f.slice(0, 52)}»`)
  }
}
const altas = filas.filter((x) => x.n > 650)
const rotas = filas.filter((x) => !x.ok)
console.log(`\n${'═'.repeat(70)}`)
console.log(`respuestas: ${filas.length} · máximo ${Math.max(...filas.map((x) => x.n))} tokens · rotas ${rotas.length}`)
console.log(`por encima de 650 tokens: ${altas.length} · de ésas rotas: ${altas.filter((x) => !x.ok).length}`)
if (altas.length === 0) {
  console.log('\n⚠️ NO CONCLUYENTE — con la regla puesta NINGUNA superó los 650 tokens.')
  console.log('   *No se puede separar «la regla arregla el formato» de «la regla acorta»:')
  console.log('   el experimento no produjo el caso que tenía que distinguir.*')
} else if (altas.every((x) => x.ok)) {
  console.log('\n✅ Con la regla puesta, las largas TAMBIÉN parsean ⇒ la causa era la REGLA, no el largo.')
} else {
  console.log('\n🔴 Con la regla puesta, arriba de 650 SIGUE rompiendo ⇒ la causa es el LARGO.')
  console.log('   Se cura con un techo, no con un prompt.')
}
