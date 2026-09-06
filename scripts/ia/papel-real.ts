// deno-lint-ignore no-explicit-any
;(Deno as any).serve = () => ({ finished: Promise.resolve(), shutdown: () => Promise.resolve(), addr: { hostname: '', port: 0 } })
const src = await Deno.readTextFile(new URL('../../supabase/functions/extract-papel/index.ts', import.meta.url))
const PROMPT = src.match(/const PROMPT = `([\s\S]*?)`\n/)![1]
const clave = new TextDecoder().decode((await new Deno.Command('security',
  { args:['find-generic-password','-a','medicion','-s','anthropic-medicion','-w'] }).output()).stdout).trim()
const bytes = Deno.readFileSync('/tmp/examen-sintetico.pdf')
let bin = ''; for (const b of bytes) bin += String.fromCharCode(b)
const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
  headers:{'content-type':'application/json','x-api-key':clave,'anthropic-version':'2023-06-01'},
  body: JSON.stringify({ model:'claude-sonnet-5', max_tokens:4000, thinking:{type:'disabled'},
    messages:[{role:'user',content:[
      { type:'document', source:{ type:'base64', media_type:'application/pdf', data: btoa(bin) } },
      { type:'text', text: PROMPT }]}] }) })
const j = await r.json()
if (!r.ok) { console.log('HTTP '+r.status+' '+JSON.stringify(j).slice(0,300)); Deno.exit(1) }
const t = j.content[0].text
console.log(`in ${j.usage.input_tokens} / out ${j.usage.output_tokens} · $${((j.usage.input_tokens*2)/1e6+(j.usage.output_tokens*10)/1e6).toFixed(6)}\n`)
let d; try { d = JSON.parse(t.replace(/```json|```/g,'').trim()) } catch { console.log('NO PARSEA:\n'+t.slice(0,600)); Deno.exit(1) }
console.log(`clase=${d.clase} · fecha=${d.fecha_documento} · emisor=${d.emisor} · ${d.filas.length} filas`)
for (const f of d.filas) console.log(`  ${String(f.nombre).padEnd(16)} ${String(f.valor).padEnd(8)} ${String(f.unidad ?? '').padEnd(11)} ref=${String(f.referencia ?? '')}\n      literal: ${f.literal}`)
// 🔴 LA LEY
const PROHIBIDO = /\b(alto|bajo|elevad|disminuid|aumentad|anormal|normal|preocupa|indica|sugiere|compatible con|leucocitosis|trombocitopenia|insuficiencia)\b/i
const sucias = d.filas.filter((f:any) => PROHIBIDO.test(JSON.stringify({ nota:f.nota, valor:f.valor, unidad:f.unidad, referencia:f.referencia })))
console.log(`\n${sucias.length===0?'OK  ':'ROJO'} la ley: cero interpretación fuera del literal`)
if (sucias.length) for (const f of sucias) console.log('     ' + JSON.stringify(f))
const conMarca = d.filas.filter((f:any) => /\b[HL]\b/.test(String(f.literal ?? '')))
console.log(`${conMarca.length>=2?'OK  ':'ROJO'} las marcas H/L del laboratorio SÍ se copian en el literal (${conMarca.length})`)
