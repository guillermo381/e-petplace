#!/usr/bin/env node
/**
 * S114-B · QUIÉN DECIDE «ES MEMORIAL» FUERA DE `packages/domain`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **Firma del founder (7-sep-2026): la definición única vive en
 * `packages/domain`, con el motor como espejo.** Este ratchet mide lo otro:
 * **cuántos siguen decidiéndolo por su cuenta.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **POR QUÉ EXISTE, con su número:** el censo de S114-B encontró que la
 * casa tiene **más de una regla viva para el mismo hecho** y que **no
 * coinciden** — unas incluyen `perdida` y otras no. La firma dice que
 * `perdida` **NO** es memorial ⇒ *cada derivación suelta es un lugar donde esa
 * firma puede no cumplirse, y ninguna avisa.*
 *
 * ── QUÉ MIDE, y qué NO ─────────────────────────────────────────────────
 * Una **sentencia** que compara `estado_vida` contra un literal **y** cuyo
 * texto nombra memorial/memoria. *Comparar `estado_vida === 'activa'` para
 * decidir ELEGIBILIDAD no es esto y no se cuenta* — son preguntas distintas
 * sobre el mismo dato, y meterlas en la misma bolsa haría un gate que grita
 * sobre código correcto.
 *
 * ⚠️ **NO ve:** derivaciones en SQL · las que pasan por una variable
 * intermedia sin nombrar memorial en su sentencia · `apps/` de otro repo.
 * *Su verde dice «no creció», jamás «hay una sola definición».*
 *
 * Salidas: 0 verde · 1 creció · 2 no pude medir.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Medido el 7-sep-2026. SOLO-BAJA: cada cura que mueva su decisión a
 * `packages/domain` lo baja, y quien lo baje edita este número.
 *
 * 🔴 **AL MERGEAR LA RAMA DE C: ESTE NÚMERO BAJA A 8** (S114-B).
 * C curó una derivación en `pasaporte.tsx` que en este árbol todavía existe.
 * **No se baja acá y ahora, y el porqué es del trinquete:** *bajar un
 * solo-baja contra un estado que no tengo lo pone ROJO PARA TODOS si esa cura
 * no llega* — y el gate no puede distinguir «la cura no vino» de «alguien la
 * revirtió». ⇒ **lo baja quien mergea, en el mismo commit del merge**, que es
 * mi propia `L-502`: *el que amplía o cura mueve el baseline en el mismo acto.*
 *
 * ⚠️ **Y si después del merge sigue diciendo 9, la cura no entró** — el número
 * es lo único que lo dice, porque un trinquete que no baja no se queja: se
 * queda quieto y se lee igual que uno al día.
 *
 * ── ⚠️ EL DESACUERDO QUE ESTO DESTAPÓ, y vale más que el número ──────────
 * Mi censo EN PROSA (`S114-B-CONTRATO-MEMORIAL` §⑥) tabuló **3 filas / 5
 * sitios** y este gate contaba **9** — **dos artefactos míos, sobre el mismo
 * hecho, con números distintos, y nadie los cruzó**. El censo agrupaba por
 * ARCHIVO (`pasaporte.tsx (:98 · :162)` en una sola fila) y el gate cuenta
 * SITIOS. *Un censo que agrupa por archivo pierde la cuenta de los sitios, y su
 * número se lee igual de firme que el del instrumento.*
 * **La autoridad es el gate**: el censo en prosa es una lectura, éste es una
 * medición reproducible. Es `L-503` entre dos artefactos del mismo autor.
 */
const BASELINE = 9
/** Exentos POR NOMBRE, jamás por patrón (mismo criterio que `R78` §④). */
const EXENTOS = new Set([
  // La definición vive acá: es el destino, no una copia.
  'packages/domain',
])

const raices = ['apps/cliente/src', 'apps/prestador/src', 'packages/api/src', 'packages/ui/src', 'packages/domain/src']
const archivos = []
for (const r of raices) {
  try { statSync(r) } catch { continue }
  ;(function walk(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.tsx?$/.test(p)) archivos.push(p)
    }
  })(r)
}
if (archivos.length < 100) {
  console.error(`✗ NO PUDE MEDIR: sólo ${archivos.length} archivo(s) en el corpus.`)
  process.exit(2)
}

/* 🔴 SE DESPOJA **SIN COLAPSAR LÍNEAS**: cada carácter de comentario se
   reemplaza por un espacio y los saltos se conservan. Borrar los bloques
   enteros **corre la numeración** y el gate señalaría una línea que no es —
   *un guard que apunta mal manda a buscar a otro lado*. Es la misma cura que
   `R70` ya lleva escrita en `verify:diseno`. */
const sinComentarios = (s) => {
  const blanquear = (m) => m.replace(/[^\n]/g, ' ')
  return s
    .replace(/\/\*[\s\S]*?\*\//g, blanquear)
    .replace(/(^|[^:/'"`])(\/\/(?!\/)[^\n]*)/g, (_, pre, com) => pre + blanquear(com))
}

let comparaciones = 0
/* 🔴 SE CUENTAN SITIOS, NO COMPARACIONES. Una sola decisión suele escribirse
   con dos o tres —`!== null && !== 'activa' && !== 'perdida'`— y contarlas por
   separado infla el número y vuelve el baseline ilegible: *el sujeto es la
   DECISIÓN, no cada `!==` que la compone.* La clave es la sentencia. */
const sitios = new Map()
for (const path of archivos) {
  if ([...EXENTOS].some((e) => path.startsWith(e))) continue
  const t = sinComentarios(readFileSync(path, 'utf8'))
  // La SENTENCIA: desde el `const`/`return`/`if` previo hasta el `;` o el
  // cierre. Una comparación puede abarcar varias líneas, y medir por línea
  // partiría justo la que nombra memorial (`L-499`).
  const lineas = t.split('\n')
  for (const m of t.matchAll(/estado_vida\s*[!=]==\s*(?:'[a-z]+'|null)/g)) {
    comparaciones++
    /* 🔴 LA SENTENCIA SE ARMA POR LÍNEAS, NO CORTANDO EN EL `{` MÁS CERCANO.
       ⏪ Era `lastIndexOf('{')`, **y su propio rojo lo destapó**: en
       `const esMemorial = (m: {estado_vida: string|null}) => m.estado_vida !== 'activa'`
       el `{` más cercano es el de la ANOTACIÓN DE TIPO, así que la ventana
       arrancaba DESPUÉS del nombre y la sentencia quedaba sin la palabra
       «memorial» ⇒ **el caso que el gate existe para cazar salía verde.**

       *Es la tercera vez en esta sesión que un delimitador aparece adentro de
       lo que quiero capturar* (`[^)]*` en `R78`, el `{` acá). **Y las tres las
       encontró producir el rojo, no leer el código.**

       ⇒ se junta hacia atrás hasta la línea que ARRANCA una sentencia. */
    const iLinea = t.slice(0, m.index).split('\n').length - 1
    /* 🔴 LA VENTANA VA ACOTADA, y su primera versión NO lo estaba: dentro de
       un JSX caminó **286 líneas** hasta un `return (` y se tragó un
       `{!esMemorial` de OTRA sección ⇒ **reportó como derivación de memorial
       un `estado_vida === 'activa'` que no lo era.** *Verosímil, en un archivo
       real, y a punto de irse a otra pista como defecto suyo.*

       **Una decisión de memorial se escribe en una a tres líneas.** Cuatro es
       holgura; más que eso ya no es la sentencia, es el vecindario. Y se corta
       también en línea EN BLANCO: los comentarios quedan blanqueados (para no
       correr la numeración), así que una línea vacía es el borde real. */
    const TECHO = 4
    let ini = iLinea
    while (
      ini > 0 &&
      iLinea - ini < TECHO &&
      lineas[ini].trim() !== '' &&
      !/^\s*(const|let|var|return|if|function|export)\b/.test(lineas[ini])
    ) ini--
    const sentencia = lineas.slice(ini, iLinea + 1).join(' ')
    if (!/memorial|memoria/i.test(sentencia)) continue
    sitios.set(`${path}::${ini}`, `${path}:${t.slice(0, m.index).split('\n').length}`)
  }
}

/* 🔴 `L-500`: publica su ALCANCE y no sólo su resultado. Si el corpus se mueve
   —una carpeta que se renombra, un `estado_vida` que cambia de nombre— el
   número de comparaciones se mueve y delata la ceguera; un «0 sueltas» no. */
const alcance = `${archivos.length} archivo(s) · ${comparaciones} comparación(es) de \`estado_vida\` miradas`
const sueltas = [...sitios.values()]
console.log(`verify:memorial-derivado · ${sueltas.length} derivación(es) de MEMORIAL fuera de \`packages/domain\` · baseline ${BASELINE} SOLO-BAJA · ${alcance}`)
console.log('  ⚠️ su verde dice «no creció», JAMÁS «hay una sola definición»: las que quedan siguen decidiendo por su cuenta')

if (comparaciones === 0) {
  console.error('✗ NO PUDE MEDIR: cero comparaciones de `estado_vida` en todo el corpus — el dato cambió de nombre o el corpus se movió.')
  process.exit(2)
}
if (sueltas.length > BASELINE) {
  console.error(`\n✗ ${sueltas.length} > baseline ${BASELINE}. La firma del 7-sep dice que \`perdida\` NO es memorial;`)
  console.error('  cada derivación suelta es un lugar donde esa firma puede no cumplirse, y ninguna avisa.')
  for (const s of sueltas) console.error(`   · ${s}`)
  process.exit(1)
}
for (const s of sueltas) console.log(`   · ${s}`)
