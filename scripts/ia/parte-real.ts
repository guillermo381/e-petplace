// El parte del día, contra el modelo real: ¿respeta las 120 palabras y no agrega?
// deno-lint-ignore no-explicit-any
;(Deno as any).serve = () => ({ finished: Promise.resolve(), shutdown: () => Promise.resolve(), addr: { hostname: '', port: 0 } })
const { frase } = await import('../../supabase/functions/coach-parte/index.ts')
const src = await Deno.readTextFile(new URL('../../supabase/functions/coach-parte/index.ts', import.meta.url))
const SIS = src.match(/const SISTEMA = `([\s\S]*?)`\n/)![1]
const clave = new TextDecoder().decode((await new Deno.Command('security',
  { args: ['find-generic-password','-a','medicion','-s','anthropic-medicion','-w'] }).output()).stdout).trim()

const TANDAS = [
  [{ tipo:'vacuna', titulo:'La polivalente vence', dias:12 }, { tipo:'cita', titulo:'Tenés cita con Clínica Aurora', dias:1 }],
  [{ tipo:'antip', titulo:'El antiparasitario venció', dias:-5 }, { tipo:'vacuna', titulo:'La antirrábica vence', dias:3 },
   { tipo:'peso', titulo:'Hace 4 meses que no registrás el peso', dias:null }],
]
for (const [i, t] of TANDAS.entries()) {
  const lista = t.map((a) => `· ${frase(a as never)}`).join('\n')
  const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
    headers:{'content-type':'application/json','x-api-key':clave,'anthropic-version':'2023-06-01'},
    body: JSON.stringify({ model:'claude-sonnet-5', max_tokens:400, thinking:{type:'disabled'}, system:SIS,
      messages:[{role:'user',content:[{type:'text',text:`Hoy, para esta mascota:\n${lista}`}]}] }) })
  const j = await r.json()
  const txt = j.content?.[0]?.text ?? JSON.stringify(j).slice(0,200)
  const pal = String(txt).trim().split(/\s+/).length
  const costo = (j.usage.input_tokens*2)/1e6 + (j.usage.output_tokens*10)/1e6
  console.log(`\n── tanda ${i+1} (${t.length} avisos) · ${pal} palabras · $${costo.toFixed(6)}`)
  console.log(`   ${pal <= 120 ? 'OK  ' : 'ROJO'} techo de 120 palabras`)
  console.log(`   ${/\?$/.test(String(txt).trim()) ? 'ROJO' : 'OK  '} termina sin pregunta`)
  console.log('   ' + String(txt).replace(/\n/g,'\n   '))
}
