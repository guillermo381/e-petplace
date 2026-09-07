#!/usr/bin/env tsx
/**
 * verify:busqueda-poda — la poda del segundo pase de la búsqueda (S113-D · fase 3).
 *
 * 🔴 QUÉ MIDE, EN UNA LÍNEA: que sacar una palabra ESTRUCTURAL rescate las
 * búsquedas en voz de persona **sin convertir una pregunta de cuidado en un
 * resultado falso**, y que nadie meta en la lista una palabra que es CONTENIDO.
 *
 * Sus dos mitades, y la segunda es la que envejece sola:
 *   ① OFFLINE — el comportamiento de `podarConsulta` sobre las frases medidas
 *     contra la familia del founder (23 búsquedas + 20 preguntas de cuidado).
 *   ② CONTRA LA BASE — que ninguna palabra de la lista sea, hoy, el nombre de
 *     un servicio o de un producto publicado. *Una lista escrita a mano contra
 *     un catálogo que crece es correcta el día que se escribe y falsa después.*
 *     Sin base: **NO CONCLUYENTE (exit 2), jamás verde.**
 *
 * ⚠️ Corre en `tsx` y **importa la pieza real**. La primera versión de este
 * gate transpilaba la fuente a mano con `replace()` y se rompió con una
 * anotación de tipo: *un gate que reimplementa a su sujeto mide su propia
 * copia*, y el día que no se rompa va a estar midiendo otra cosa.
 *
 * ⚠️ Su verde dice «la poda separa estas 43 frases», JAMÁS «la búsqueda
 * entiende lo que le pidan». Las 43 las escribió quien escribió la poda.
 */
import { spawnSync } from 'node:child_process'
import { podarConsulta, PALABRAS_ESTRUCTURALES } from '../packages/domain/src/busquedaPoda'

let ok = 0, rojo = 0, nc = 0
const OK = (m: string) => { ok++; console.log('  OK   ' + m) }
const ROJO = (m: string) => { rojo++; console.log('  ROJO ' + m) }
const NC = (m: string) => { nc++; console.log('  ⚠️ NC  ' + m) }

/* ── ① LAS QUE LA PODA TIENE QUE RESCATAR ─────────────────────────────────
   Las cinco medidas contra datos reales: pase 1 = 0, pase 2 = 1..20. */
const RESCATAR: [string, string][] = [
  ['pedido de croquetas', 'croquetas'],
  ['la cita de Thor', 'Thor'],
  ['mi pedido de Advantix', 'Advantix'],
  ['la cita de vacunación', 'vacunación'],
  ['el pedido de arena', 'arena'],
]
for (const [frase, esperado] of RESCATAR) {
  const p = podarConsulta(frase)
  if (p.vale_reintentar && p.consulta === esperado) OK(`«${frase}» → «${p.consulta}»`)
  else ROJO(`«${frase}» → «${p.consulta}» (esperaba «${esperado}», reintentar=${p.vale_reintentar})`)
}

/* ── ② LAS QUE LA PODA NO DEBE TOCAR ──────────────────────────────────────
   🔴 «el paseo de Zeus» encuentra 20 resultados SIN podar, porque «paseo» es
   el nombre de un servicio: está en el texto indexado. Si alguien lo agrega a
   la lista, esta búsqueda pasa a podarse y el gate lo dice acá. */
for (const frase of ['el paseo de Zeus', 'baño y corte', 'Thor', 'croquetas', 'Clínica Los Shyris']) {
  const p = podarConsulta(frase)
  if (!p.vale_reintentar) OK(`«${frase}» no se poda`)
  else ROJO(`«${frase}» se podó a «${p.consulta}» — quitó ${JSON.stringify(p.quitadas)}`)
}

/* ── ③ NINGUNA PREGUNTA DE CUIDADO SE PODA ────────────────────────────────
   Era el riesgo real del atajo: que podar convirtiera una pregunta en un
   resultado. Medido: 0 de 20 encuentran algo, ni antes ni después. */
const PREGUNTAS = [
  'cuándo le toca la pipeta', 'cada cuánto se baña un gato', 'es normal que tome tanta agua',
  'qué le doy si vomita', 'cuánto tiene que pesar un beagle adulto', 'puedo darle hueso de pollo',
  'por qué se rasca tanto', 'a qué edad se castra', 'se le cae mucho pelo, es normal',
  'cuántas veces al día come un cachorro', 'le puedo dar leche', 'qué vacunas le faltan',
  'cómo sé si tiene fiebre', 'es malo que duerma tanto', 'cuándo puedo sacarlo a la calle',
  'qué hago si no quiere comer', 'mi perro cojea desde ayer', 'cómo le corto las uñas',
  'necesita desparasitación', 'está muy flaco',
]
const podadas = PREGUNTAS.filter((q) => podarConsulta(q).vale_reintentar)
if (podadas.length === 0) OK(`ninguna de las ${PREGUNTAS.length} preguntas de cuidado se poda`)
else ROJO(`${podadas.length} pregunta(s) se podan: ${JSON.stringify(podadas)}`)

/* ── ④ LO DESCARTADO SE REGISTRA (ley de la fase 3) ───────────────────────
   *Sin esto, la próxima medición no distingue un modelo que falla de un
   casamiento que se comió la respuesta.* */
const p1 = podarConsulta('mi pedido de Advantix')
if (p1.quitadas.length === 1 && p1.quitadas[0].toLowerCase() === 'pedido') OK('la poda dice QUÉ sacó (`quitadas`)')
else ROJO(`la poda no registra lo descartado: ${JSON.stringify(p1.quitadas)}`)

/* ── ⑤ CONTRA LA BASE: la lista no puede pisar CONTENIDO ──────────────────*/
const q = `select coalesce(string_agg(distinct lower(nombre),' | '),'') v from tipos_servicio
  union all select coalesce(string_agg(distinct lower(nombre),' | '),'') from (select nombre from productos where estado='publicado' limit 500) x;`
const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q], { encoding: 'utf8' })
let filas: { v: string }[] | null = null
try {
  filas = JSON.parse(`${r.stdout}${r.stderr}`.split('\n').filter((l) => !/^npm warn|^Initialising/.test(l)).join('\n')).rows
} catch { /* sin base */ }
if (!filas) {
  NC('no pude leer el catálogo: **no concluyente**, no verde — la lista puede haber quedado vieja')
} else {
  const texto = filas.map((f) => f.v).join(' | ')
  const lim = (w: string) => new RegExp(`(?<![\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, 'iu')
  const choques = PALABRAS_ESTRUCTURALES.filter((w) => lim(w).test(texto))
  if (choques.length === 0) OK(`ninguna de las ${PALABRAS_ESTRUCTURALES.length} estructurales es nombre de servicio o producto`)
  else ROJO(`ES CONTENIDO, no estructura — sacala de la lista: ${JSON.stringify(choques)}`)
}

console.log(`\n${rojo === 0 && nc === 0 ? 'OK' : nc > 0 && rojo === 0 ? 'NO CONCLUYENTE' : 'ROJO'} verify:busqueda-poda — ${ok} verdes · ${rojo} rojos · ${nc} no concluyentes`)
console.log('  ⚠️ su verde dice «la poda separa estas 43 frases», JAMÁS «la búsqueda entiende lo que le pidan».')
process.exit(rojo > 0 ? 1 : nc > 0 ? 2 : 0)
