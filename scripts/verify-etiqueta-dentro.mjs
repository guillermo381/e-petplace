#!/usr/bin/env node
/**
 * VERIFY:ETIQUETA-DENTRO — el gate de N11″, y existe porque ES LA TERCERA
 * VUELTA DE ESTA LEY.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 📜 **LA FUENTE ES LA LETRA, NO UN PARTE:** `docs/DIRECCION_DISENO_S99.md`
 * **§N11″** — *«en todos los formularios de la casa, el nombre del campo va
 * DENTRO del campo, flotando… el placeholder de ejemplo muere»* (firma del
 * founder, 15-sep-2026; depositada por A).
 *
 * ⏪ **Este gate nació citando el lote 6 porque la letra todavía no estaba
 * depositada** —medido ese día en el worktree, en `origin/main` y en la
 * punta de A: los tres decían N11′—. **Hoy se refunda en la letra**, que es
 * de donde tiene que colgar: *un gate fundado en un parte hereda el defecto
 * que el propio N11′ nombró — «una firma que vive en un parte no está
 * firmada».*
 *
 * N11 (S99) la puso adentro **quieta** · N11′ (S100) la sacó afuera ·
 * N11″ (S116) la volvió a meter **flotando**. **Tres vueltas en tres
 * sesiones, y ninguna dejó instrumento** — la propia letra lo dice: *«no
 * hay gate que lo vigile todavía: su verde no existe, así que nadie puede
 * confundir "no lo mide nadie" con "está cumplido"»*. Esto es ese verde.
 *
 * 🔴 **Y N11″ NO es volver a N11**, que es lo que el gate tiene que dejar
 * claro para que la cuarta vuelta no empiece por ahí: N11 tenía la etiqueta
 * **quieta, compartiendo renglón con el valor** —el defecto que N11′ midió
 * bien—. **N11″ no lo niega: lo disuelve**, subiéndola al borde.
 *
 * ⚠️ **ALCANCE: EL CLIENTE.** La letra es explícita — *«el prestador sigue
 * con su dosis, la etiqueta afuera de N11′, hasta que se rediseñe»*, y
 * *«N11 prohíbe que dos estilos convivan EN LA MISMA REGIÓN DE UNA
 * PANTALLA — no prohíbe que dos apps vayan a distinta velocidad»*. Por eso
 * este gate mira **sólo `apps/cliente`**, y por eso las piezas guardan su
 * etiqueta por casa en vez de mudarla.
 *
 * 🔴 **UN CHOQUE ABIERTO CON LA LETRA, declarado y no resuelto acá:**
 * N11″ hereda de N11′ la cláusula ***«≥24 px entre un campo y el
 * siguiente»***… **y la orden del lote 6 fue bajar ese aire a 10-12**, que
 * es lo que B construyó y midió (12 exactos). *La cláusula conserva el
 * número pero perdió su razón*: existía para que la etiqueta de AFUERA no
 * se leyera como el pie del campo de arriba, y ya no hay etiqueta afuera.
 * **Rige lo ordenado y medido; la letra necesita la enmienda.** Al buzón de
 * A. *Dos letras firmadas que se contradicen son peores que una
 * equivocada.*
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
 * 🔴 **LA LISTA DE PIEZAS «CON LA ETIQUETA AFUERA» SE DERIVA DE LA FUENTE,
 * NO SE ESCRIBE.** ⏪ Nació como una lista de NOMBRES (`CampoFecha`,
 * `CampoCodigo`) y **eso medía la convención, no el hecho**: al curar
 * `CampoFecha` el gate siguió contándola en 6 porque **seguía
 * llamándose igual**. *Una regla atada a un nombre da un número que dejó
 * de significar lo que dice* — es `L-459` en su forma chica, y la cacé
 * porque el founder había predicho el número («la regla ④ baja a 0») y no
 * bajó.
 * ⇒ Una pieza tiene la etiqueta afuera en la casa v5 **si su línea de
 * `<EtiquetaDeCampo` NO lleva el guard de casa (`v5`)**. ⚠️ **Y ese
 * discriminador también se corrigió midiendo:** primero fue *«renderiza
 * `<EtiquetaDeCampo`»* y marcó a las DOS piezas curadas —porque las dos
 * la siguen renderizando **para el prestador**, que conserva N11′—;
 * después fue *«el archivo menciona `formaV5`»* y tampoco, porque
 * `CampoCodigo` lo menciona **para otra cosa** (radio y color). *Lo que
 * decide no es que el archivo hable de la casa: es que ESA LÍNEA esté
 * guardada.* Así el gate baja solo cuando alguien cura de verdad, y **una
 * pieza nueva con la etiqueta suelta aparece sin que nadie la liste.**
 *
 * ⚠️ **`CampoCodigo` es EXCEPCIÓN DECLARADA por firma de la mesa**
 * (15-sep-2026): *ocho casillas de un dígito no tienen dónde poner una
 * etiqueta flotante; su rótulo vive arriba del grupo.* Vive abajo, por
 * nombre — **no se cuenta, y se ve que no se cuenta.**
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
  placeholder: 16,
  dosEstilos: 0,
}

/** La excepción por nombre — ver la cabecera. **VACÍA a propósito.**
 *  Forma de una entrada: `'ruta/archivo.tsx:NNN': 'por qué'`.
 *
 *  ⚠️ **Y la letra pide MÁS que esto:** N11″ dice que la excepción del
 *  rótulo largo *«es una EXCEPCIÓN DECLARADA EN LA PANTALLA — escrita ahí,
 *  con el rótulo que la motiva y su medida… JAMÁS POR OMISIÓN»*. **Esta
 *  lista es la mitad mecánica; el comentario en la pantalla es la otra, y
 *  es la que la letra llama «la regla».** *Sin él no se distingue una
 *  excepción de un incumplimiento.* */
const EXCEPCION_ROTULO_LARGO = {}

/** ⭐ **EXCEPCIÓN DECLARADA — firma de la mesa, 15-sep-2026.**
 *  `CampoCodigo`: **ocho casillas de un dígito no tienen dónde poner una
 *  etiqueta flotante; su rótulo vive arriba del grupo.** *Es la exención
 *  que S99 ya había escrito («una caja de UN dígito no tiene lugar para un
 *  rótulo») y que N11′ celebró como «la excepción de ayer es la norma de
 *  hoy» — con N11″ la norma volvió a cambiar y la excepción vuelve a serlo,
 *  ahora firmada en vez de heredada.* */
const PIEZAS_EXENTAS = new Set(['CampoCodigo'])

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

/* ④ — LA LISTA SE DERIVA DE LA FUENTE (ver la cabecera). Una pieza tiene
   la etiqueta AFUERA si renderiza `<EtiquetaDeCampo`. */
const piezasAfuera = execSync("git ls-files 'packages/ui/src/components/Campo*.tsx'", {
  encoding: 'utf8',
})
  .trim().split('\n').filter(Boolean)
  .filter((f) =>
    readFileSync(f, 'utf8')
      .split('\n')
      .some((l) => /<EtiquetaDeCampo\b/.test(l) && !/\bv5\b/.test(l)),
  )
  .map((f) => f.split('/').pop().replace('.tsx', ''))
  .filter((n) => !PIEZAS_EXENTAS.has(n))

console.log(
  `   piezas con la etiqueta AFUERA (derivado): ${piezasAfuera.length > 0 ? piezasAfuera.join(', ') : '—'}` +
    `   · exentas por firma: ${[...PIEZAS_EXENTAS].join(', ')}`,
)

if (piezasAfuera.length > 0) {
  const re = new RegExp(`<(${piezasAfuera.join('|')})\\b`)
  /* Una pantalla cuenta UNA vez, aunque tenga tres campos de cada tipo: lo
     que la ley prohíbe es la CONVIVENCIA, no cada aparición. */
  for (const f of archivos) {
    const L = readFileSync(f, 'utf8').split('\n')
    const adentro = L.some((l) => /<Campo(\s|>|$)/.test(l))
    const afuera = L.map((l, i) => [i + 1, (l.match(re) || [])[1]]).filter(([, p]) => p !== undefined)
    if (adentro && afuera.length > 0) {
      hallazgos.dosEstilos.push(`${f}  ← ${afuera.map(([n, p]) => `${p}:${n}`).join(' · ')}`)
    }
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
