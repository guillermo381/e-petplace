#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env --allow-run
/**
 * LA INTENCIÓN DE BÚSQUEDA CONTRA EL CONJUNTO DE E — 3 vueltas, vara nueva.
 * S113-D · fase 3.
 *
 * 🔴 **MODELO REAL: gasta** (~US$ 0,07). Usa EL prompt de la edge y **su misma
 * configuración**, importada: si `TEMPERATURA_CERO` dice que esta pieza va a 0,
 * el arnés manda 0. *Un arnés que fija la temperatura por su cuenta mide una
 * configuración que la edge no tiene.*
 *
 * ── POR QUÉ EL CONJUNTO ES DE E Y NO MÍO ───────────────────────────────────
 * Mis 43 frases daban 23/23 y las 30 de E daban 5/30 con el mismo motor: *un
 * conjunto que arma el mismo que arma el instrumento mide la facilidad de sus
 * propios ejemplos.* Éste lo escribió E **a propósito contra** mi lista.
 *
 * ── LAS TRES VUELTAS, Y NO SON CEREMONIA ───────────────────────────────────
 * El prompt viejo daba 0 casos variables en 3 corridas y los dos lo dimos por
 * determinista; al agregarle un campo, 3 de 20 pasaron a variar. *La
 * determinación nunca fue una propiedad: era una coincidencia no medida.* Con
 * `temperature: 0` vuelve a ser propiedad — y esto lo verifica, no lo supone.
 */
import { declararObjeto, exigirCasos } from './declarar-objeto.ts'
import { SISTEMA, comoCita, saneaIntencion } from '../buscar-intencion/index.ts'
import { MODELOS, MAX_TOKENS, TEMPERATURA_CERO, PENSAR } from '../_shared/ia/modelos.ts'
import { costoEstimadoUsd } from '../_shared/ia/precios.ts'

await declararObjeto({
  mide: ['supabase/functions/buscar-intencion/index.ts', 'supabase/functions/_shared/ia/modelos.ts'],
  modeloReal: true,
  noCubre:
    'si la BÚSQUEDA encuentra: esto mide cómo se separa la frase, no qué devuelve la caja ' +
    '(eso es `prueba-busqueda.mts` y el gate de calidad de E). Y las etiquetas de `tipo` son ' +
    'de E: una diferencia puede ser del modelo o de su expectativa, y se reportan aparte.',
})

const clave = new TextDecoder().decode((await new Deno.Command('security',
  { args: ['find-generic-password', '-a', 'medicion', '-s', 'anthropic-medicion', '-w'] }).output()).stdout).trim()
if (!clave.startsWith('sk-ant-')) { console.error('🔴 NO CONCLUYENTE — sin clave'); Deno.exit(2) }

type Frase = { f: string; intencion: string; tipo?: string; estresa?: string }
const conjunto = JSON.parse(await Deno.readTextFile(
  new URL('./fixture-frases-E.json', import.meta.url))) as { frases: Frase[] }
const FRASES = conjunto.frases
const VUELTAS = 3

const MODELO = MODELOS.busqueda
let tokIn = 0, tokOut = 0, costo = 0

async function uno(f: string) {
  const cuerpo: Record<string, unknown> = {
    model: MODELO, max_tokens: MAX_TOKENS.busqueda,
    system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: comoCita(f) }],
  }
  if (!PENSAR.busqueda) cuerpo.thinking = { type: 'disabled' }
  // 🔴 La temperatura sale de la TABLA de la casa, no de este archivo.
  if (TEMPERATURA_CERO.busqueda) cuerpo.temperature = 0
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(cuerpo),
  })
  const j = await r.json()
  if (!r.ok) { console.error(`  🔴 ${r.status} «${f}»`); return null }
  tokIn += j.usage.input_tokens; tokOut += j.usage.output_tokens
  costo += costoEstimadoUsd(MODELO, {
    tokens_entrada: j.usage.input_tokens ?? 0, tokens_salida: j.usage.output_tokens ?? 0,
    tokens_cache_lectura: j.usage.cache_read_input_tokens ?? 0,
    tokens_cache_escritura: j.usage.cache_creation_input_tokens ?? 0,
  }) ?? 0
  const t = (j.content ?? []).filter((c: { type: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text).join('')
  let crudo: unknown = null
  try { crudo = JSON.parse(t.replace(/^```json\s*|```$/g, '').trim()) } catch { /* saneo */ }
  return saneaIntencion(crudo)
}

const acum = new Map<string, string[]>()
for (let v = 0; v < VUELTAS; v++) {
  for (let i = 0; i < FRASES.length; i += 8) {
    const lote = FRASES.slice(i, i + 8)
    const res = await Promise.all(lote.map((x) => uno(x.f)))
    lote.forEach((x, k) => {
      const r = res[k]
      if (r) acum.set(x.f, [...(acum.get(x.f) ?? []), `${r.es_pregunta}|${r.tipo}|${r.termino}`])
    })
  }
}
exigirCasos([...acum.values()].reduce((a, b) => a + b.length, 0), 'clasificaciones')

const PREG = FRASES.filter((x) => x.intencion !== 'busqueda')
const BUSQ = FRASES.filter((x) => x.intencion === 'busqueda')
let varian = 0, pregOk = 0, busqOk = 0, tipoOk = 0, tipoMedibles = 0
const difTipo: string[] = []

const linea = (x: Frase, esperaPregunta: boolean) => {
  const v = acum.get(x.f) ?? []
  const u = new Set(v)
  if (u.size > 1) varian++
  const nOk = v.filter((s) => s.startsWith(esperaPregunta ? 'true|' : 'false|')).length
  const bien = nOk === v.length && v.length === VUELTAS
  if (bien) { if (esperaPregunta) pregOk++; else busqOk++ }
  // `tipo` sólo se compara donde E puso una etiqueta y NO es pregunta.
  if (!esperaPregunta && x.tipo) {
    tipoMedibles++
    const tipos = new Set(v.map((s) => s.split('|')[1]))
    if (tipos.size === 1 && [...tipos][0] === x.tipo) tipoOk++
    else difTipo.push(`${x.f} → dio ${[...tipos].join('/')} · E esperaba ${x.tipo}`)
  }
  console.log(`  ${bien ? 'ok  ' : '🔴  '} ${nOk}/${v.length} ${u.size > 1 ? '⚠️ VARÍA ' : '         '}${x.f.slice(0, 36).padEnd(36)} ${[...u].join('  ||  ')}`)
}

console.log(`\n── ${PREG.length} PREGUNTAS DE CUIDADO (deben salir pregunta) ──`)
for (const x of PREG) linea(x, true)
console.log(`\n── ${BUSQ.length} BÚSQUEDAS (NO deben salir pregunta) ──`)
for (const x of BUSQ) linea(x, false)

const n = FRASES.length * VUELTAS
console.log(`\n═══ ${FRASES.length} frases × ${VUELTAS} vueltas · temperature=${TEMPERATURA_CERO.busqueda ? 0 : 'por defecto'} ═══`)
console.log(`  🔴 CASOS QUE VARÍAN     ${varian}/${FRASES.length}`)
console.log(`  preguntas siempre bien  ${pregOk}/${PREG.length}`)
console.log(`  búsquedas siempre bien  ${busqOk}/${BUSQ.length}`)
console.log(`  tipo == etiqueta de E   ${tipoOk}/${tipoMedibles}   ⚠️ una diferencia puede ser de la etiqueta`)
if (difTipo.length) console.log(difTipo.map((s) => `     ${s}`).join('\n'))
console.log(`\nCOSTO REAL  ${tokIn} tok entrada · ${tokOut} salida · $${costo.toFixed(4)} · $${(costo / n).toFixed(6)} por consulta`)
Deno.exit(0)
