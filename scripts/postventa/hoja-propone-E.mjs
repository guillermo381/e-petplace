/**
 * hoja-propone-E — ¿LA HOJA PROPONE, O DICE ALGO QUE VALDRÍA PARA CUALQUIER CASO?
 * (S114-D, lote 6.)
 *
 * ── POR QUÉ NO ALCANZA LO QUE YA MIDE `ejercer-postventa-E` ────────────────
 * Aquél mide la FORMA: que venga marcada, que no traiga estado ni monto, que
 * tenga su `porque`. Todo eso puede estar perfecto en una propuesta que diga
 * «revisar el caso y responderle a la familia», que serviría para cualquier
 * caso del mundo. *Una propuesta bien formada y vacía pasa todos los controles
 * de forma.*
 *
 * ── QUÉ MIDE, Y CUÁL ES SU LÍMITE ──────────────────────────────────────────
 * Si la propuesta **usa el material de ESTE hilo**. El sujeto lo permite porque
 * el hilo tiene datos duros y verificables: 22 minutos contra 45 reservados, y
 * un prestador que reconoce que no avisó.
 * ⚠️ **No mide si la propuesta es BUENA** — eso es criterio, y lo lee la casa.
 * Mide si está anclada en el caso o flota. *Un detector de calidad sería el
 * tercer detector romo que esta casa ya declaró peor que ninguno.*
 */
import { entrar, llamar, reUsted, reVoseo } from './ejercer-postventa-E.mjs'
import { execFileSync } from 'node:child_process'

const CASO = 'de6015a1-7aeb-4cc5-be8c-2e475a08ba48'
const N = Number(process.argv[2] ?? 5)

const sql = (q) => {
  const s = execFileSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace', timeout: 180_000 })
  return JSON.parse(s.slice(s.indexOf('{'))).rows ?? []
}

const [c] = sql(`select clase, objeto_tipo, motivo_codigo, etapa, objeto_id::text as objeto
                   from public.casos_postventa where id='${CASO}'`)
if (!c) { console.error('🔴 NO CONCLUYENTE — el caso no existe'); process.exit(2) }
const hilo = sql(`select autor as quien, cuerpo as texto, creado_en::text as cuando
                    from public.caso_mensajes where caso_id='${CASO}' order by creado_en`)

/** Los anclajes: datos que SÓLO están en este hilo. */
const ANCLAS = [
  { nombre: 'la duración real (22)', re: /\b22\b/ },
  { nombre: 'lo reservado (45)', re: /\b45\b/ },
  { nombre: 'el aviso que faltó', re: /avis[aoó]|advert|comunic|inform/i },
  { nombre: 'la razón del prestador (el perro)', re: /perro|se resist|no quiso|volvi/i },
]
/* Un anclaje NO es una propuesta: que cite el número no dice que proponga algo.
   Por eso además se mira si hay un ACTO — un verbo de resolución. Los dos
   juntos son lo que separa «leyó» de «propuso», y ninguno solo alcanza. */
const ACTO = /devolv|reembols|acredit|saldo|compensa|reintegr|descuent|cr[eé]dito|repetir|repone|nueva salida|otra salida/i

const familia = await entrar('epetplace-cuenta-casa-prueba')
console.log(`\n  caso ${CASO}`)
console.log(`  clase ${c.clase} · ${c.objeto_tipo} · ${c.motivo_codigo} · ${c.etapa} · ${hilo.length} turnos`)
console.log(`  ${N} corridas — el sujeto es un modelo, así que esto es tendencia\n`)

const marca = { anclas: [], acto: 0, ok: 0, voz: 0 }
for (let i = 1; i <= N; i++) {
  const r = await llamar('postventa-hoja', familia.token, {
    caso: { motivo: c.motivo_codigo, clase: c.clase, objeto: c.objeto_tipo, etapa: c.etapa },
    hilo, evidencia: { objeto_id: c.objeto, tipo: c.objeto_tipo },
  })
  const j = r.json
  if (r.status !== 200 || !j?.propuesta) {
    console.log(`  [${i}] 🔴 sin hoja (status ${r.status}${j?.codigo ? ` · ${j.codigo}` : ''})`)
    continue
  }
  marca.ok += 1
  const texto = `${j.propuesta.que} ${j.propuesta.porque}`
  const cita = ANCLAS.filter((a) => a.re.test(texto)).map((a) => a.nombre)
  marca.anclas.push(cita.length)
  const tieneActo = ACTO.test(texto)
  if (tieneActo) marca.acto += 1
  if (reVoseo.test(texto) || reUsted.test(`${j.resumen_hilo} ${texto}`)) marca.voz += 1
  console.log(`  [${i}] anclajes ${cita.length}/4${tieneActo ? ' · ACTO ✅' : ' · sin acto ⚠️'}`)
  console.log(`      qué: ${j.propuesta.que}`)
  console.log(`      por qué: ${j.propuesta.porque}\n`)
}

const med = (xs) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)
console.log(`  ${'─'.repeat(66)}`)
console.log(`  hojas: ${marca.ok}/${N}`)
console.log(`  anclada en el hilo: ${med(marca.anclas)} de 4 anclajes  (rango ${Math.min(...marca.anclas)}–${Math.max(...marca.anclas)})`)
console.log(`  propone un ACTO de resolución: ${marca.acto}/${marca.ok}`)
console.log(`  voseo o usted: ${marca.voz}/${marca.ok}`)
console.log(`\n  ⚠️ Esto NO dice si la propuesta es BUENA — eso lo lee la casa.`)
console.log(`     Dice si está anclada en ESTE caso o si flotaría en cualquiera.\n`)
