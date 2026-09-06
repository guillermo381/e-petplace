/**
 * GATE · UN VOCABULARIO, UNA FORMA (S113-D, lote 2.8).
 *
 * La edge valida contra una lista cerrada y el wrapper de `packages/api` valida
 * contra OTRA copia de la misma lista. El wrapper decía en un comentario que era
 * «espejo EXACTO» de la edge — y no lo era: tenía `sticker_con_fecha` (jubilado)
 * donde la edge ya tenía `sticker`, así que **cada fila del carnet que la edge
 * daba por buena rebotaba en el cliente**. Ningún typecheck lo ve: son dos
 * arrays de strings, los dos válidos.
 *
 * Y hay una tercera copia que nadie mira: **el PROMPT**. Un ejemplo trabajado
 * con un valor jubilado es la parte del prompt que el modelo más copia.
 *
 * Este gate lee las TRES del código fuente —jamás las escribe— y exige que
 * digan lo mismo.
 *   node scripts/verify-vocabularios.mjs
 */
import { readFileSync } from 'node:fs'

const EDGE = 'supabase/functions/extract-vacuna/index.ts'
const WRAPPER = 'packages/api/src/wrappers/vacunas.ts'
const edge = readFileSync(EDGE, 'utf8')
const wrapper = readFileSync(WRAPPER, 'utf8')

let v = 0, r = 0
const exigir = (n, ok, visto) => {
  if (ok) { v++; console.log(`  OK   ${n}`) }
  else { r++; console.log(`  ROJO ${n}${visto === undefined ? '' : ` — visto: ${JSON.stringify(visto)}`}`) }
}

/** Extrae `const NOMBRE = [...]` de un fuente. Devuelve null si no está —
 *  que NO es lo mismo que estar vacío, y por eso se distingue. */
function lista(src, nombre) {
  const m = src.match(new RegExp(`const ${nombre}(?::[^=]+)? = \\[([^\\]]*)\\]`))
  if (!m) return null
  return m[1].split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
}

console.log('\nvocabularios · la edge y el wrapper tienen que decir lo mismo\n')

const CERRADOS = ['EVIDENCIAS', 'VIAS', 'CONFIANZAS']
const enElPrompt = {}
for (const nombre of CERRADOS) {
  const a = lista(edge, nombre)
  const b = lista(wrapper, nombre)
  // 🔴 El primer brazo es que las dos EXISTAN. Si una desaparece, comparar
  // `null` contra `null` daría verde sobre un vocabulario que ya no se valida.
  exigir(`${nombre} existe en la edge`, Array.isArray(a) && a.length > 0, a)
  exigir(`${nombre} existe en el wrapper`, Array.isArray(b) && b.length > 0, b)
  if (!a || !b) continue
  enElPrompt[nombre] = a
  exigir(`${nombre} dice lo MISMO en las dos puntas`,
    JSON.stringify([...a].sort()) === JSON.stringify([...b].sort()), { edge: a, wrapper: b })
}

console.log('\nel PROMPT no puede nombrar un valor que el validador rechaza\n')

// El prompt vive en el mismo archivo que el validador, así que se mide sobre
// el template: todo `evidencia "x"` / `via "x"` / `confianza "x"` que aparezca
// tiene que estar en su lista. Es donde se coló el defecto: en el ejemplo
// trabajado, que es lo que el modelo copia.
const CAMPO = { evidencia: 'EVIDENCIAS', via: 'VIAS', confianza: 'CONFIANZAS' }
let hallados = 0
  /* 🔴 EL PATRÓN TOLERA EL CAST — enmienda de A en el merge (5-sep). El wrapper
     pasó a declarar sus listas contra su propio tipo, lo que obliga a ensanchar
     en el uso: `(CONFIANZAS as readonly string[]).includes(...)`. Con el patrón
     atado a la escritura literal, **una mejora del código daba rojo**: el hecho
     era el mismo y el gate medía la forma de escribirlo. *Un gate atado a cómo se
     escribe algo mide la convención, no el hecho — y su rojo manda a deshacer una
     mejora.* */
for (const [campo, cual] of Object.entries(CAMPO)) {
  const permitidos = enElPrompt[cual] ?? []
  for (const m of edge.matchAll(new RegExp(`${campo} "([a-z_]+)"`, 'g'))) {
    hallados++
    exigir(`el prompt dice ${campo} "${m[1]}" y está en ${cual}`, permitidos.includes(m[1]),
      { escrito: m[1], permitidos })
  }
}
// Un gate que no encuentra ninguna ocurrencia no está midiendo: lo dice.
exigir('el prompt nombra al menos un valor de vocabulario (si no, esto no mide nada)',
  hallados > 0, hallados)

console.log('\ny el wrapper tiene que ACEPTAR el null que la edge produce\n')

// 🔴 La otra mitad del mismo defecto, y la comparación de listas NO la ve: la
// edge, cuando el modelo manda un valor fuera del vocabulario, **lo anula y
// marca la fila** en vez de tirarla (lote ①). Un wrapper que exige `string`
// rechaza justo las filas que la edge decidió conservar — las dos listas
// pueden coincidir perfectamente y el contrato romperse igual.
for (const [campo, cual] of Object.entries(CAMPO)) {
  // 🔴 No alcanza con ver el `deLista(...)`: si viene con un `?? 'valor'`, el
  // campo NUNCA sale null y el wrapper hace bien en exigir string. La primera
  // corrida de este gate dio un rojo FALSO por eso, sobre `confianza`, que
  // tiene `?? 'baja'`. *Un gate que mira la llamada y no la asignación entera
  // manda a "curar" un acierto.*
  const asignacion = edge.match(new RegExp(`const \\w+ = deLista\\('${campo}', ${cual}\\)([^\\n]*)`))
  if (!asignacion) continue
  const tieneRespaldo = /\?\?/.test(asignacion[1])
  if (tieneRespaldo) {
    exigir(`\`${campo}\` tiene respaldo en la edge (${asignacion[1].trim()}): nunca es null, el wrapper exige string`,
      new RegExp(`typeof v\\.${campo} === 'string' && \\(?${cual}( as readonly string\\[\\])?\\)?\\.includes`).test(wrapper))
    continue
  }
  const exigeString = new RegExp(`typeof v\\.${campo} === 'string' && \\(?${cual}( as readonly string\\[\\])?\\)?\\.includes`).test(wrapper)
  const aceptaNull = new RegExp(`enListaOnull\\(v\\.${campo}, ${cual}\\)`).test(wrapper)
  exigir(`la edge puede anular \`${campo}\`, así que el wrapper acepta null`,
    aceptaNull && !exigeString, { aceptaNull, exigeString })
}

console.log(`\n${r === 0 ? 'OK' : 'ROJO'} verify:vocabularios — ${v} verdes · ${r} rojos\n`)
process.exit(r === 0 ? 0 : 1)
