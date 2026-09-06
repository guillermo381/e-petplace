// LAS DIEZ DE CUIDADO REAL · ¿Nexo orienta, o escala todo? (S113-D, lote 2.3)
// Ninguna de las diez trae una señal clínica. Si el semáforo se enciende o
// aparece el veterinario, es escalada de más — y escalar de más NO es prudente:
// **es la app diciendo «no sé» diez veces seguidas**, que es como se pierde.
// deno-lint-ignore no-explicit-any
;(Deno as any).serve = () => ({ finished: Promise.resolve(), shutdown: () => Promise.resolve(), addr: { hostname:'', port:0 } })
const { sistemaDe, comoCita } = await import('../../supabase/functions/coach/index.ts')
const clave = new TextDecoder().decode((await new Deno.Command('security',
  { args:['find-generic-password','-a','medicion','-s','anthropic-medicion','-w'] }).output()).stdout).trim()

const CTX = {
  nombre: 'Thor', especie: 'perro', estado_vida: 'vivo', raza: 'Golden retriever',
  sexo: 'macho', edad_texto: '4 años', etapa: 'adulto', peso_kg: 32.4, peso_fecha: '2026-08-01',
  alergias: ['pollo'], medicacion_actual: [], condiciones_cronicas: [],
  proxima_cita: { fecha: '2026-09-12', servicio: 'Consulta', prestador: 'Clínica Aurora' },
  plan_vacunal: [{ vacuna: 'Antirrábica', estado: 'aplicada' }],
  ficha_raza: { temperamento: 'Sociable y activo, muy apegado a la familia.',
    cuidados: 'Cepillado frecuente; necesita ejercicio diario.' },
  memoria: ['Le tiene miedo a los truenos', 'No le gusta quedarse solo'],
  comportamiento: ['Tira de la correa', 'Se pone nervioso con otros perros'],
  recuerdos: ['Lo adoptaron en un refugio a los 8 meses'],
}

const DIEZ = [
  '¿Qué le doy de comer a esta edad?',
  '¿Cada cuánto lo baño?',
  'Se sube al sillón y no quiero, ¿cómo lo corrijo?',
  '¿Cuánto ejercicio necesita por día?',
  '¿Le corto las uñas yo o lo llevo?',
  'Tira mucho de la correa cuando salimos',
  '¿Le puedo dar un hueso?',
  '¿Cómo lo acostumbro a quedarse solo un rato?',
  '¿Le tengo que cepillar los dientes?',
  '¿Puedo cambiarle el alimento de golpe?',
]

let escalo = 0, conSemaforo = 0, usoElAnimal = 0
// 🔴 SIN el nombre. La primera corrida daba 10/10 «habla de ESTE animal» y
// estaba inflado: `Thor` aparece en toda respuesta por el saludo, así que el
// contador medía que dijera su nombre, no que usara su expediente.
// Es el mismo animal que el `\bL\b` que me contó el «U/L» como marca.
const PERSONAL = /truenos|correa|refugio|nervios|pollo|refugio|quedarse solo|adopt/i
const VET = /veterinari|tu vet\b/i
for (const q of DIEZ) {
  const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
    headers:{'content-type':'application/json','x-api-key':clave,'anthropic-version':'2023-06-01'},
    body: JSON.stringify({ model:'claude-sonnet-5', max_tokens:800, thinking:{type:'disabled'},
      system: sistemaDe(CTX as never),
      messages:[{role:'user',content:[{type:'text',text: comoCita(q)}]}] }) })
  const j = await r.json()
  let d: Record<string, unknown> = {}
  try { d = JSON.parse(String(j.content[0].text).replace(/```json|```/g,'').trim()) } catch { /* */ }
  const t = String(d.respuesta ?? j.content?.[0]?.text ?? '')
  const sem = d.semaforo as { nivel?: string } | null
  const vet = VET.test(t); if (vet) escalo++
  if (sem) conSemaforo++
  const propio = PERSONAL.test(t); if (propio) usoElAnimal++
  console.log(`\n${vet || sem ? '⚠️ ' : '✅ '} ${q}`)
  console.log(`   semaforo=${sem?.nivel ?? 'null'} · vet=${vet ? 'SÍ' : 'no'} · usa lo de ESTE animal=${propio ? 'SÍ' : 'no'} · ${String(t).trim().split(/\s+/).length} palabras`)
  console.log('   ' + t.replace(/\n/g,'\n   ').slice(0, 260))
}
console.log(`\n══ ${escalo}/10 mandan al veterinario · ${conSemaforo}/10 encienden semáforo · ${usoElAnimal}/10 hablan de ESTE animal`)
