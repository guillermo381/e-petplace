#!/usr/bin/env node
/**
 * verify:techos-locales — TRINQUETE: **ninguna pantalla del cliente dibuja su
 * propia cabecera.**
 *
 * ── LA REGLA QUE SOSTIENE ──────────────────────────────────────────────────
 * Firma del founder, lote 3b: *«a partir de este lote ninguna pantalla del
 * cliente dibuja su propia cabecera»*. Este gate es lo que la vuelve exigible.
 *
 * ── POR QUÉ HACE FALTA, con el número del censo ────────────────────────────
 * Al abrir el lote 3b: **106 rutas · 6 con `Cabecera` · 78 con `Encabezado`
 * (la vieja) · 4 con techo propio**. Los cuatro techos propios se escribieron
 * por la misma razón, y uno lo dice en su propio comentario: *«HeroMarca no
 * tiene slots para fecha-antes-del-saludo ni para la fila de mascotas: se
 * compone local COPIANDO NIVEL de la primitiva»*.
 *
 * > 🔴 **Un techo local no nace por descuido: nace porque la pieza no llegaba.**
 * > Por eso el gate va JUNTO con los slots que el censo pidió (`contenido` y
 * > `avisos`) y no antes: *un trinquete sin la pieza que lo hace innecesario
 * > no frena el techo — frena la pantalla.*
 *
 * ── QUÉ CUENTA COMO TECHO LOCAL ────────────────────────────────────────────
 * Un `.tsx` bajo `apps/cliente/src/app` que monta **`LinearGradient`**. Es el
 * marcador honesto: la banda de la casa ES un degradado, así que **cualquiera
 * que lo dibuje está componiendo un techo** — y quien use `Cabecera` no
 * necesita importarlo nunca.
 *
 * ⚠️ **Lo que NO mide, declarado:** un techo hecho con un `backgroundColor`
 * plano no lo ve. *Se eligió el marcador que hoy cubre los cuatro casos reales
 * y no uno más ancho que marcaría cualquier `View` con color* — un gate
 * ruidoso se apaga, y su verde dice «nadie compuso un degradado», jamás
 * «ninguna pantalla se dibuja un techo».
 *
 * ── LAS DOS EXENCIONES, con nombre y razón ─────────────────────────────────
 * `index.tsx` y `bienvenida.tsx` **no son pantallas con cabecera: son láminas
 * de marca a sangre** —la de arranque y la de bienvenida—, donde el degradado
 * ES la pantalla y no su techo. *Contarlas obligaría a meterlas en una
 * `Cabecera` que no tienen.* Van exentas por nombre: una exención nombrada se
 * discute; una regla más laxa se olvida.
 *
 * SALIDAS: 0 verde · 1 rojo (subió) · 2 NO CONCLUYENTE (no pudo medir).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = process.cwd()
const APP = join(RAIZ, 'apps/cliente/src/app')
const BASE_FILE = join(RAIZ, 'scripts/.baseline-techos-locales.json')
const di = (t = '') => console.log(t)

/** Láminas de marca a sangre: el degradado ES la pantalla (ver la cabecera). */
const EXENTAS = new Set(['index.tsx', 'bienvenida.tsx'])

if (!existsSync(APP)) {
  di('⚠️  verify:techos-locales — NO CONCLUYENTE: no existe apps/cliente/src/app')
  process.exit(2)
}

const rutas = []
const caminar = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) caminar(p)
    else if (e.endsWith('.tsx')) rutas.push(p)
  }
}
caminar(APP)

const hoy = rutas
  .filter((p) => !EXENTAS.has(relative(APP, p)))
  .filter((p) => /LinearGradient/.test(readFileSync(p, 'utf8')))
  .map((p) => relative(APP, p))
  .sort()

const base = existsSync(BASE_FILE) ? JSON.parse(readFileSync(BASE_FILE, 'utf8')) : null
if (base === null || typeof base.baseline !== 'number') {
  writeFileSync(BASE_FILE, JSON.stringify({ baseline: hoy.length, techos: hoy, sembrado: new Date().toISOString() }, null, 2) + '\n')
  di(`baseline sembrado en ${hoy.length}`)
  process.exit(0)
}

const antes = new Set(base.techos || [])
const nuevos = hoy.filter((f) => !antes.has(f))
const idos = [...antes].filter((f) => !hoy.includes(f))

di(`verify:techos-locales · ${hoy.length} techo(s) local(es) en apps/cliente/src/app · baseline ${base.baseline} SOLO-BAJA`)
for (const f of hoy) di(`   · ${f}`)

if (hoy.length > base.baseline) {
  di('')
  di(`✗ EL NÚMERO SUBIÓ: ${base.baseline} → ${hoy.length}. El trinquete NO deja subir.`)
  if (nuevos.length) { di(''); di('  Techo(s) nuevo(s):'); for (const f of nuevos) di(`   · ${f}`) }
  di('')
  di('  🔴 NINGUNA PANTALLA DEL CLIENTE DIBUJA SU PROPIA CABECERA (lote 3b).')
  di('  La banda la pone `Cabecera`. Si te falta un slot — contenido propio')
  di('  adentro de la banda, una acción con contador — se PIDE por buzón a B.')
  di('  *Un techo local no nace por descuido: nace porque la pieza no llegaba,')
  di('  y dibujarlo en la pantalla funciona, compila y se ve bien.*')
  process.exit(1)
}
if (hoy.length < base.baseline) {
  di('')
  di(`✓ VERDE — y BAJÓ: ${base.baseline} → ${hoy.length}.`)
  for (const f of idos) di(`   ☠ ${f}`)
  di('  Asentá el baseline en el MISMO commit que lo curó: uno que baja y no se')
  di('  asienta convierte la próxima subida en invisible.')
  process.exit(0)
}
if (nuevos.length) {
  di('')
  di(`⚠️  El número no subió, pero ${nuevos.length} cambiaron de nombre:`)
  for (const f of nuevos) di(`   + ${f}`)
  for (const f of idos) di(`   − ${f}`)
}
di('')
di('✓ verify:techos-locales VERDE — no creció.')
di(`  ⚠️ Su verde dice «nadie compuso un degradado nuevo», JAMÁS «ninguna`)
di('     pantalla se dibuja un techo»: un fondo plano no lo ve.')
process.exit(0)
