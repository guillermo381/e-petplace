#!/usr/bin/env node
/**
 * VERIFY:ETIQUETA-DENTRO — el gate de N11″, y existe porque ES LA TERCERA
 * VUELTA DE ESTA LEY.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * N11 (S99-B) la puso adentro · N11′ (S100-B, firma del founder) la sacó
 * afuera · N11″ (S116-B lote 6, firma del founder) la volvió a meter,
 * flotando. **Tres vueltas en tres sesiones, y ninguna dejó instrumento.**
 * *Una ley que se reabre cada vez que alguien la mira de nuevo no está
 * firmada: está en discusión permanente.* Esto es lo que la cierra.
 *
 * ⚠️ **LO QUE ESTE GATE NO PUEDE HACER, dicho primero:** no sostiene la
 * ley — la sostiene la PIEZA, que dibuja la etiqueta adentro para toda la
 * casa v5. Lo que sostiene el gate es que **nadie la vuelva a sacar por
 * la puerta de atrás**, que son las dos únicas que hay: dibujarse un
 * rótulo propio encima del campo, o apagar el de la pieza.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── LAS TRES REGLAS, Y POR QUÉ CADA UNA MIDE LO QUE MIDE ───────────────
 *
 * **① RÓTULO PROPIO ENCIMA DE UN `<Campo>` — trinquete en 0.**
 * 🔴 **Nace protegiendo un CERO, y eso lo decidió medir.** El censo crudo
 * dio 8 candidatos —`<Texto>` pegado a un `<Campo>`— y **al resolver las
 * llaves contra el diccionario, NINGUNO era un rótulo**: «Opcional. Si no
 * podemos ubicarte a ti.», «Escribe el correo con el que entras…»,
 * «DATOS» (antetítulo de SECCIÓN). *Un gate que marcara los 8 habría
 * nacido con ocho rojos falsos, y un gate ruidoso se apaga.*
 *
 * ⇒ El discriminador **resuelve el texto y lo mide**: es rótulo si tiene
 * **≤3 palabras, no termina en `.`/`?`/`:`** y su variante no es
 * `antetitulo` ni `seccion` (ésas rotulan una SECCIÓN, no un campo).
 * ⚠️ **Si la llave no resuelve, NO SE MARCA y se cuenta aparte.** *Mejor
 * callar que gritar: un rojo que el autor no puede reproducir es lo que
 * enseña a ignorar el gate.*
 *
 * **② `etiquetaVisible={false}` — trinquete solo-baja, la OTRA puerta.**
 * Apagar el rótulo de la pieza es lo único que vuelve necesario dibujarse
 * uno. **Su exención está en la letra desde N11′** —la búsqueda no lleva
 * etiqueta: lupa + placeholder— así que no se prohíbe: se CONGELA.
 *
 * **③ `placeholder` dentro de un `<Campo>` — trinquete solo-baja.**
 * N11″ mata el placeholder de ejemplo: la etiqueta hace ese trabajo.
 *
 * 🔴 **POR QUÉ ES UN TRINQUETE Y NO EL TIPO, que sería mejor:** la forma
 * final de esta regla es **hacerla inexpresable** —`placeholder` sólo
 * legal con `etiquetaVisible={false}`, por unión discriminada— y ahí el
 * compilador la sostiene sin gate. **Hoy no se puede: hay 26 vivos en el
 * cliente y el typecheck quedaría en rojo hasta que C los limpie**, que
 * es frenar a otra pista para ganar una prolijidad. ⇒ **el trinquete baja
 * el número y el día que llegue a 0 este gate MUERE y lo reemplaza el
 * tipo.** *Su condición de muerte está escrita, que es lo que separa un
 * andamio de una deuda.*
 *
 * **④ DOS ESTILOS DE CAMPO EN LA MISMA PANTALLA — trinquete solo-baja.**
 * 🔴 **Esta regla la encontró el censo, y mide un hueco que el lote 6
 * ABRIÓ.** N11″ entró en `Campo` y **`CampoFecha` y `CampoCodigo` siguen
 * montando `EtiquetaDeCampo`, o sea la etiqueta AFUERA**. N11 lo prohíbe
 * con todas las letras: *«dos estilos de campo jamás conviven en la misma
 * región de una pantalla»* — y en `carnet.tsx` conviven en **líneas
 * consecutivas** (634-636).
 *
 * ⚠️ **Y el dueño de la cura soy YO, no la pantalla.** El encargo pedía el
 * censo *«para C»* y lo que el censo encontró es trabajo de `packages/ui`:
 * meter la etiqueta flotante en `CampoFecha` —que no es un `TextInput`
 * sino un selector con hoja— no es trivial y **no estaba pedido en este
 * lote**. *Se instrumenta para que no crezca mientras espera, que es lo
 * único honesto que se puede hacer con una deuda que uno mismo abrió.*
 *
 * ⚠️ **`CampoCodigo` es un caso aparte y se cuenta igual:** su etiqueta
 * afuera es la **exención vieja declarada** (*«una caja de UN dígito no
 * tiene lugar para un rótulo»*), que N11′ celebró como *«la excepción de
 * ayer es la norma de hoy»*. **Hoy la norma volvió a cambiar y esa
 * exención queda descolgada** — entra al conteo para que la mesa la vea,
 * no para acusarla.
 *
 * ── LA EXCEPCIÓN POR NOMBRE, declarada VACÍA ──────────────────────────
 * ⚠️ **N11′ dejó vivo un costo que N11″ NO contesta:** *«en español el
 * rótulo pesa el doble — "Instrucciones de entrega" encogida es nota al
 * pie»*. El día que un campo de rótulo largo necesite el rótulo afuera,
 * **entra acá por nombre y con su razón** — no por un `eslint-disable`
 * suelto ni relajando el discriminador. **Hoy la lista está VACÍA porque
 * ese campo no existe todavía** (medido: cero `<Campo>` del cliente con
 * un rótulo propio). *Se escribe vacía a propósito: la puerta tiene que
 * existir ANTES de que alguien la necesite, o se abre a los martillazos.*
 */

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

/* ── LOS BASELINES ─────────────────────────────────────────────────────
   Medidos contra el objeto el 15-sep-2026. **Solo-baja**: bajarlos es
   pasar el gate; subirlos es rojo. */
const BASELINE = {
  rotuloPropio: 0,
  etiquetaApagada: 6,
  placeholder: 26,
  dosEstilos: 6,
}

/** La excepción por nombre — ver la cabecera. **VACÍA a propósito.**
 *  Forma de una entrada: `'ruta/archivo.tsx:NNN': 'por qué'`. */
const EXCEPCION_ROTULO_LARGO = {}

const norm = (s) => s.trim()
const esComentario = (s) =>
  s === '' || s.startsWith('//') || s.startsWith('*') || s.startsWith('/*') || s.startsWith('{/*')

/* El diccionario, para resolver llaves. Si falta, las llaves no resuelven
   y sus casos se cuentan como NO CONCLUYENTES (ver ①). */
let DICC = ''
try { DICC = readFileSync('apps/cliente/src/i18n/es.ts', 'utf8') } catch { /* sin diccionario */ }

function resolverTexto(linea) {
  const lit = linea.match(/>\s*([^<{][^<]*?)\s*</)
  if (lit) return lit[1]
  const llave = linea.match(/t\(\s*['"]([^'"]+)['"]/)
  if (!llave || DICC === '') return null
  const hoja = llave[1].split('.').pop()
  /* ⚠️ Resolución por SUFIJO, y su límite se declara: sufijos comunes
     (`detalle`, `pregunta`) pueden pegar en la entrada equivocada. Por eso
     un texto resuelto sólo se usa para NO marcar; nunca alcanza solo para
     marcar un rojo sin que además sea corto y sin puntuación. */
  const m = DICC.match(new RegExp(`\\b${hoja}\\s*:\\s*(['"\`])([\\s\\S]*?)\\1`))
  return m ? m[2] : null
}

function esRotulo(linea) {
  if (/variante=["'](antetitulo|seccion)["']/.test(linea)) return false
  const txt = resolverTexto(linea)
  if (txt === null) return null // no concluyente
  const limpio = txt.replace(/\{\{[^}]*\}\}/g, 'x').trim()
  if (/[.?:!]$/.test(limpio)) return false
  return limpio.split(/\s+/).filter(Boolean).length <= 3
}

const archivos = execSync("git ls-files 'apps/cliente/src/**/*.tsx'", { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean)

const hallazgos = { rotuloPropio: [], etiquetaApagada: [], placeholder: [], dosEstilos: [] }
let noConcluyentes = 0

for (const f of archivos) {
  const L = readFileSync(f, 'utf8').split('\n')
  for (let i = 0; i < L.length; i++) {
    if (/\betiquetaVisible=\{false\}/.test(L[i])) hallazgos.etiquetaApagada.push(`${f}:${i + 1}`)
    if (!/<Campo(\s|>|$)/.test(L[i])) continue

    // ③ placeholder dentro del elemento
    for (let j = i; j < Math.min(L.length, i + 40); j++) {
      if (/\bplaceholder=/.test(L[j])) hallazgos.placeholder.push(`${f}:${j + 1}`)
      if (j > i && /\/>|^\s*>/.test(L[j])) break
    }

    // ① el rótulo propio: la primera línea con contenido ANTES del <Campo>
    for (let k = i - 1; k >= Math.max(0, i - 4); k--) {
      const p = norm(L[k])
      if (esComentario(p)) continue
      if (/<\/?(Texto|Text)\b/.test(p)) {
        const v = esRotulo(p)
        if (v === null) noConcluyentes++
        else if (v) hallazgos.rotuloPropio.push(`${f}:${k + 1}  ${p.slice(0, 64)}`)
      }
      break
    }
  }
}

/* ④ — una pantalla cuenta UNA vez, aunque tenga tres campos de cada tipo:
   lo que la ley prohíbe es la CONVIVENCIA, no cada aparición. */
for (const f of archivos) {
  const L = readFileSync(f, 'utf8').split('\n')
  const adentro = L.some((l) => /<Campo(\s|>|$)/.test(l))
  const afuera = L.map((l, i) => [i + 1, (l.match(/<(CampoFecha|CampoCodigo)\b/) || [])[1]])
    .filter(([, p]) => p !== undefined)
  if (adentro && afuera.length > 0) {
    hallazgos.dosEstilos.push(
      `${f}  ← ${afuera.map(([n, p]) => `${p}:${n}`).join(' · ')}`,
    )
  }
}

const exentos = new Set(Object.keys(EXCEPCION_ROTULO_LARGO))
hallazgos.rotuloPropio = hallazgos.rotuloPropio.filter((h) => !exentos.has(h.split('  ')[0]))

console.log('verify:etiqueta-dentro · N11″ — la etiqueta vive DENTRO del campo')
console.log(`   corpus: ${archivos.length} .tsx de apps/cliente`)

let rojo = false
for (const [regla, etiqueta] of [
  ['rotuloPropio', '① rótulo propio encima de un <Campo>'],
  ['etiquetaApagada', '② etiquetaVisible={false}'],
  ['placeholder', '③ placeholder dentro de un <Campo>'],
  ['dosEstilos', '④ dos estilos de campo en la misma pantalla'],
]) {
  const n = hallazgos[regla].length
  const base = BASELINE[regla]
  const signo = n > base ? '✗' : n < base ? '↓' : '✓'
  if (n > base) rojo = true
  console.log(`\n  ${signo} ${etiqueta} · ${n} (baseline ${base})`)
  if (n > base) {
    console.log('     SUBIÓ — el gate es solo-baja. Los sitios:')
    for (const h of hallazgos[regla]) console.log(`       ${h}`)
  } else if (n < base) {
    console.log(`     bajó de ${base} a ${n} — actualizá el baseline en este archivo.`)
  }
}

if (noConcluyentes > 0) {
  console.log(`\n  ⚠️ ${noConcluyentes} caso(s) NO CONCLUYENTE(S): su llave no resolvió contra el`)
  console.log('     diccionario y NO se marcaron. Un rojo que el autor no puede')
  console.log('     reproducir es lo que enseña a ignorar un gate.')
}

console.log(
  `\n  ⚠️ Su verde dice «nadie sacó la etiqueta por las dos puertas de atrás»,`,
)
console.log('     JAMÁS «la etiqueta se ve bien adentro»: eso lo decide el ojo')
console.log('     sobre una captura, y la ley ya se reabrió tres veces.')

process.exit(rojo ? 1 : 0)
