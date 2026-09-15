#!/usr/bin/env node
/**
 * verify:boton-alto — **el alto que se pide es el alto que se dibuja.**
 *
 * ── QUÉ IMPIDE, y por qué hizo falta un gate y no un comentario ────────────
 * `Boton` resolvía su alto así:
 *
 *     height: esCompacto ? 44 : pildoraV5 ? altoV5 : t.alto
 *
 * y en la casa v5 **`pildoraV5` es siempre true** ⇒ **`t.alto` era
 * inalcanzable**. O sea: `tamaño="xs"` compilaba, se leía en el montaje, el
 * botón se dibujaba… **midiendo 58 en vez de 30**.
 *
 * > 🔴 **La clase: un valor que el tipo acepta, el editor autocompleta y el
 * > render IGNORA.** No hay error, no hay warning, no hay pantalla rota — hay
 * > un botón del alto de otro. *El founder lo señaló SEIS tandas seguidas y
 * > las mediciones anteriores no lo vieron porque medían el ancho, que estaba
 * > bien.* Lo encontró C mirando la caja que lo contiene, no el botón.
 *
 * ── CÓMO MIDE: EVALÚA LA EXPRESIÓN, NO LA BUSCA ───────────────────────────
 * Un lint de texto sobre esa línea se esquiva con cualquier reescritura. Este
 * gate **extrae la expresión del `height` y la ejecuta** con `pildoraV5=true`
 * (la casa v5, que es donde el defecto vivía) para CADA tamaño de la tabla, y
 * exige que el resultado sea el alto de ese tamaño.
 *
 * *No mide píxeles en un teléfono: mide que la pieza no pueda ignorar lo que
 * le piden.* ⚠️ Su verde dice «el tamaño pedido llega al `height`», jamás «el
 * botón se ve bien» — eso lo dice el ojo sobre una captura.
 *
 * SALIDAS: 0 verde · 1 rojo · 2 NO CONCLUYENTE (no pudo leer la pieza).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const P = join(process.cwd(), 'packages/ui/src/components/Boton.tsx')
const di = (t = '') => console.log(t)

if (!existsSync(P)) { di('⚠️  verify:boton-alto — NO CONCLUYENTE: no existe Boton.tsx'); process.exit(2) }
const src = readFileSync(P, 'utf8')

/* La tabla de tamaños, del objeto. */
const tabla = {}
const mTabla = src.match(/const TAMAÑOS[^=]*=\s*\{([\s\S]*?)\n\}/)
if (!mTabla) { di('⚠️  NO CONCLUYENTE: no se pudo leer la tabla TAMAÑOS'); process.exit(2) }
for (const m of mTabla[1].matchAll(/(\w+):\s*\{[^}]*alto:\s*(\d+)/g)) tabla[m[1]] = +m[2]
if (!Object.keys(tabla).length) { di('⚠️  NO CONCLUYENTE: la tabla no tiene altos'); process.exit(2) }

/* La expresión del alto, del objeto. */
const mAlto = src.match(/^\s*height:\s*(esCompacto[^\n]*?),\s*$/m)
if (!mAlto) { di('⚠️  NO CONCLUYENTE: no se pudo leer la expresión del `height`'); process.exit(2) }
const expr = mAlto[1]

di(`verify:boton-alto · tamaños: ${Object.entries(tabla).map(([k, v]) => `${k}=${v}`).join(' · ')}`)
di(`  expresión medida: ${expr}`)
di()

let fallos = 0
for (const [nombre, alto] of Object.entries(tabla)) {
  /* El escenario donde vivía el defecto: casa v5, botón normal, tamaño PEDIDO. */
  let dio
  try {
    dio = new Function('esCompacto', 'pildoraV5', 'altoV5', 't', 'tamaño', `return ${expr}`)(
      false, true, 58, { alto }, nombre,
    )
  } catch (e) {
    di(`⚠️  NO CONCLUYENTE: la expresión no se pudo evaluar (${e.message})`)
    process.exit(2)
  }
  if (dio !== alto) {
    di(`  ✗ tamaño="${nombre}": se pide ${alto} y el height da ${dio}`)
    fallos++
  } else {
    di(`  ✓ tamaño="${nombre}" → ${dio}`)
  }
}

di()
if (fallos) {
  di(`✗ verify:boton-alto — ${fallos} tamaño(s) IGNORADOS por la pieza.`)
  di('  Un `tamaño` que el tipo acepta y el render ignora no falla: dibuja un')
  di('  botón del alto de otro, y eso sólo se ve cuando no entra en su caja.')
  process.exit(1)
}
di('✓ verify:boton-alto VERDE — cada tamaño pedido llega al `height`.')
di('  ⚠️ Su verde dice «el tamaño pedido se respeta», JAMÁS «el botón se ve')
di('     bien»: eso lo decide el ojo sobre una captura.')
process.exit(0)
