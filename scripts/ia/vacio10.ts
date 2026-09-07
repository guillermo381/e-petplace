// D1 · LAS DIEZ CON LA MASCOTA VACÍA. Ninguna con señal clínica.
// deno-lint-ignore no-explicit-any
;(Deno as any).serve = () => ({ finished: Promise.resolve(), shutdown: () => Promise.resolve(), addr: { hostname:'', port:0 } })
const { presentacion, sistemaDe, comoCita } = await import('../../supabase/functions/coach/index.ts')
const clave = new TextDecoder().decode((await new Deno.Command('security',
  { args:['find-generic-password','-a','medicion','-s','anthropic-medicion','-w'] }).output()).stdout).trim()
const VACIO = { nombre:'Lolo', especie:'perro', estado_vida:'vivo', etapa:'adulto' }
const p = presentacion(VACIO as never)
console.log('══ PRESENTACIÓN VACÍA ══')
p.burbujas.forEach((b,i)=>console.log(`  ${i+1}. ${b.replace(/\n/g,'\n     ')}`))
console.log(`  chips: ${p.chips.join(' | ')}`)

const DIEZ = ['¿Qué le doy de comer?','¿Cada cuánto lo baño?','¿Qué cuidados necesita a su edad?',
  '¿Cuánto ejercicio necesita por día?','¿Le corto las uñas yo o lo llevo?','Tira mucho de la correa',
  '¿Le puedo dar un hueso?','¿Cómo lo acostumbro a quedarse solo?','¿Le tengo que cepillar los dientes?',
  '¿Cada cuánto lo desparasito?']
const VOSEO = /\b(querés|tenés|podés|fijate|contame|decime|mirá|sabés|hablá|cargá|probá|elegí|andá|dale|cont[aá]le|carg[aá]s)\b/i
let orientan=0, generales=0, invitan=0, conVoseo=0
for (const q of DIEZ) {
  const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
    headers:{'content-type':'application/json','x-api-key':clave,'anthropic-version':'2023-06-01'},
    body: JSON.stringify({ model:'claude-sonnet-5', max_tokens:800, thinking:{type:'disabled'},
      system: sistemaDe(VACIO as never), messages:[{role:'user',content:[{type:'text',text:comoCita(q)}]}] }) })
  const j = await r.json()
  let d: Record<string,unknown> = {}
  try { d = JSON.parse(String(j.content[0].text).replace(/```json|```/g,'').trim()) } catch { /* */ }
  const t = String(d.respuesta ?? '')
  // Se rinde = no da NADA útil, sólo manda al vet o dice que no tiene datos.
  const rinde = t.trim().length < 90 || /^(no tengo|todav[ií]a no tengo)[^.]*\.\s*(habla|consulta|lo mejor)/i.test(t.trim())
  const general = /general|todav[ií]a no|en general|referencia/i.test(t)
  const invita = /si me (dices|cuentas|cargas)|cuando (cargues|me)|cu[eé]ntame|dime/i.test(t)
  const vos = t.match(VOSEO)
  if (!rinde) orientan++; if (general) generales++; if (invita) invitan++; if (vos) conVoseo++
  console.log(`\n${!rinde && general && invita && !vos ? 'OK  ':'ROJO'} «${q}» · ${t.trim().split(/\s+/).length} palabras${vos?' · 🔴 VOSEO: '+vos[0]:''}`)
  console.log('   ' + t.replace(/\n/g,'\n   ').slice(0,170))
}
console.log(`\n══ ${orientan}/10 ORIENTAN · ${generales}/10 dicen que es general · ${invitan}/10 invitan · ${conVoseo}/10 con voseo`)
