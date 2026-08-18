#!/usr/bin/env node
/**
 * medir-tarjeta-producto.mjs — LA GEOMETRÍA DE LA TARJETA DE VITRINA,
 * EXTRAÍDA DE LOS ARCHIVOS REALES (S100b-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ EXISTE: el gate del founder reportó G-01 —«el `+` pone 1,
 * aparece el `−`, y no hay camino a 2»— y, en la misma frase, «con
 * cantidad 1 el número queda casi fuera del recuadro».
 *
 * **Dos síntomas, y este instrumento existe para probar que son UNA
 * causa: el control no entra en la caja y `overflow: 'hidden'` se come
 * lo que sobra.** La lógica del stepper está sana (su `+` llama a
 * `irA(v + 1)` y está habilitado mientras `v < max`, con `max = 12`);
 * *releer ese código con más cuidado no encuentra nada, porque no hay
 * nada que encontrar ahí* (L-286).
 * ═══════════════════════════════════════════════════════════════════
 *
 * 🔴 **EXTRAE, NO REIMPLEMENTA.** Todos los números salen por regex de
 * los archivos vivos —`spacing.ts`, `StepperCantidad.tsx`,
 * `TarjetaProducto.tsx`, `grilla-de-dos.ts` y la pantalla que la
 * monta—. **Si alguien cambia un token o un padding, este instrumento
 * cambia con él.** Es la lección de la barra de S99: *un instrumento
 * que reimplementa la fórmula mide su propio eco, no la pieza.*
 *
 * ⚠️ **LO QUE ESTE INSTRUMENTO NO PUEDE DECIR:** si el recorte SE VE.
 * Mide que el contenido no entra; **el ojo dice cuánto molesta.** El
 * gate en dispositivo sigue siendo el juez (§1 toque 2).
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = join(import.meta.dirname, '..')
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8')

/** Un fallo de extracción ABORTA. Un instrumento que no encuentra su
 *  número y sigue con un default inventado es peor que ninguno: mide
 *  algo, da un veredicto, y nadie sabe que no midió la pieza. */
function extraer(texto, re, queEs, archivo) {
  const m = texto.match(re)
  if (m === null) {
    console.error(`✖ NO SE PUDO EXTRAER ${queEs} de ${archivo}`)
    console.error(`  patrón: ${re}`)
    console.error(`  ⇒ la pieza cambió de forma. El instrumento se corrige ANTES de leer su salida.`)
    process.exit(2)
  }
  return m
}

// ── LOS TOKENS, del archivo real ──────────────────────────────────
const spacingSrc = leer('packages/ui/src/tokens/spacing.ts')
/** `spacing[k]` tal como lo resuelve la pieza. */
function sp(k) {
  const m = extraer(
    spacingSrc,
    new RegExp(`^\\s*${String(k).replace('.', '\\.')}:\\s*(\\d+)`, 'm'),
    `spacing[${k}]`,
    'tokens/spacing.ts',
  )
  return Number(m[1])
}

// ── EL STEPPER, del archivo real ──────────────────────────────────
const stepperSrc = leer('packages/ui/src/components/StepperCantidad.tsx')
const BOTON = Number(extraer(stepperSrc, /const BOTON = (\d+)/, 'BOTON', 'StepperCantidad.tsx')[1])
const gapStepperKey = extraer(
  stepperSrc,
  /flexDirection: 'row', alignItems: 'center', gap: spacing\[([\d.]+)\]/,
  'el gap del stepper',
  'StepperCantidad.tsx',
)[1]
const minWidthKey = extraer(stepperSrc, /minWidth: spacing\[([\d.]+)\]/, 'el minWidth del valor', 'StepperCantidad.tsx')[1]

const GAP_STEPPER = sp(gapStepperKey)
const MIN_VALOR = sp(minWidthKey)
/** [−] gap [valor] gap [+] — los dos botones son View de ancho fijo:
 *  `flexShrink` por defecto es 0, así que NO ceden. */
const ANCHO_STEPPER = BOTON * 2 + GAP_STEPPER * 2 + MIN_VALOR

// ── LA TARJETA, del archivo real ──────────────────────────────────
const tarjetaSrc = leer('packages/ui/src/components/TarjetaProducto.tsx')
const padTarjetaKey = extraer(
  tarjetaSrc,
  /<View style=\{\{ flex: 1, padding: spacing\[([\d.]+)\]/,
  'el padding del cuerpo de la tarjeta',
  'TarjetaProducto.tsx',
)[1]
const PAD_TARJETA = sp(padTarjetaKey)
const BORDE = Number(extraer(tarjetaSrc, /borderWidth: (\d+)/, 'el borde de la tarjeta', 'TarjetaProducto.tsx')[1])
const RECORTA = /overflow: 'hidden'/.test(tarjetaSrc)
const gapFilaKey = extraer(
  tarjetaSrc,
  /justifyContent: 'space-between',\s*\n\s*gap: spacing\[([\d.]+)\]/,
  'el gap de la fila precio↔control',
  'TarjetaProducto.tsx',
)[1]
const GAP_FILA = sp(gapFilaKey)
/** El `+` en reposo (antes de mutar a stepper). */
const TIMBRE = Number(extraer(tarjetaSrc, /\n\s*width: (\d+),\n\s*height: \1,\n\s*borderRadius: radius\.full/, 'el ancho del timbre `+`', 'TarjetaProducto.tsx')[1])

// ── LA GRILLA Y LA PANTALLA, de los archivos reales ────────────────
const grillaSrc = leer('packages/ui/src/components/grilla-de-dos.ts')
const padCeldaKey = extraer(grillaSrc, /paddingHorizontal: spacing\[([\d.]+)\]/, 'el padding de la celda', 'grilla-de-dos.ts')[1]
const margenGrillaKey = extraer(grillaSrc, /marginHorizontal: -spacing\[([\d.]+)\]/, 'el margen negativo de la grilla', 'grilla-de-dos.ts')[1]
const PAD_CELDA = sp(padCeldaKey)
const MARGEN_GRILLA = sp(margenGrillaKey)

const pantallaSrc = leer('apps/cliente/src/app/(tabs)/despensa/index.tsx')
const padPantallaKey = extraer(
  pantallaSrc,
  /<View style=\{\{ paddingHorizontal: spacing\[([\d.]+)\] \}\}>\{grillaProductos/,
  'el padding horizontal de la vitrina',
  'despensa/index.tsx',
)[1]
const PAD_PANTALLA = sp(padPantallaKey)

// ── EL APARATO ────────────────────────────────────────────────────
/** Medido con `adb shell wm size` / `wm density` sobre el SM-S938B del
 *  founder — el teléfono del gate. Se pasa por argumento para poder
 *  medir otros anchos sin tocar el instrumento. */
const anchoPx = Number(process.argv[2] ?? 1080)
const densidad = Number(process.argv[3] ?? 450)
const anchoDp = anchoPx / (densidad / 160)

// ── LA CUENTA ─────────────────────────────────────────────────────
const contenido = anchoDp - PAD_PANTALLA * 2
const anchoGrilla = contenido + MARGEN_GRILLA * 2
const anchoCelda = anchoGrilla / 2
const anchoTarjeta = anchoCelda - PAD_CELDA * 2
const cajaInterna = anchoTarjeta - BORDE * 2 - PAD_TARJETA * 2

const sobraStepper = cajaInterna - ANCHO_STEPPER
const sobraTimbre = cajaInterna - TIMBRE

console.log('═══ GEOMETRÍA DE LA TARJETA DE VITRINA ═══')
console.log(`aparato          ${anchoPx}px @ ${densidad}dpi = ${anchoDp.toFixed(1)} dp de ancho`)
console.log('')
console.log('── de los archivos reales ──')
console.log(`pad pantalla     ${PAD_PANTALLA}   (despensa/index.tsx)`)
console.log(`margen grilla    -${MARGEN_GRILLA}  · pad celda ${PAD_CELDA}   (grilla-de-dos.ts)`)
console.log(`borde ${BORDE} · pad tarjeta ${PAD_TARJETA} · gap fila ${GAP_FILA}   (TarjetaProducto.tsx)`)
console.log(`stepper: ${BOTON}·2 + ${GAP_STEPPER}·2 + ${MIN_VALOR} = ${ANCHO_STEPPER}   (StepperCantidad.tsx)`)
console.log(`timbre + : ${TIMBRE}   ·   la tarjeta recorta: ${RECORTA ? 'SÍ (overflow hidden)' : 'no'}`)
console.log('')
console.log('── la cascada ──')
console.log(`ancho de tarjeta   ${anchoTarjeta.toFixed(1)} dp`)
console.log(`CAJA INTERNA       ${cajaInterna.toFixed(1)} dp   ← acá tiene que entrar todo`)
console.log('')
console.log('── el veredicto ──')
console.log(`cantidad 0 (timbre + ):  ${TIMBRE} dp   ⇒ sobran ${sobraTimbre.toFixed(1)} dp para el precio`)
console.log(`cantidad ≥1 (stepper) :  ${ANCHO_STEPPER} dp   ⇒ ${sobraStepper >= 0 ? `sobran ${sobraStepper.toFixed(1)}` : `FALTAN ${Math.abs(sobraStepper).toFixed(1)}`} dp`)
console.log('')

let fallos = 0

if (sobraStepper < 0) {
  fallos++
  console.log('🔴 EL STEPPER NO ENTRA EN LA TARJETA — y el precio todavía no pidió nada.')
  console.log(`   El control solo se pasa por ${Math.abs(sobraStepper).toFixed(1)} dp.`)
  console.log(`   Con el precio en la misma fila (gap ${GAP_FILA}), el faltante es MAYOR.`)
  if (RECORTA) {
    console.log('   Y la tarjeta lleva `overflow: hidden` ⇒ lo que sobra NO se ve: SE CORTA.')
    console.log('   ⇒ el `+` es el elemento más a la derecha: es el primero que desaparece.')
    console.log('   ⇒ EXPLICA G-01 ENTERO: «aparece el −, no hay camino a 2» + «el número')
    console.log('     queda casi fuera del recuadro». UN solo defecto, DOS síntomas.')
  }
} else {
  console.log('✅ el stepper entra en la caja interna.')
}

/** El precio necesita lugar REAL, no cero. Un control que entra
 *  «justo» deja al precio en 0 dp, y el precio es el dato que la ley
 *  de la vuelta pone SEGUNDO (§2 del acta de apertura). */
const MINIMO_PARA_PRECIO = 56
const paraPrecio = cajaInterna - ANCHO_STEPPER - GAP_FILA
if (paraPrecio < MINIMO_PARA_PRECIO) {
  fallos++
  console.log('')
  console.log(`🔴 AL PRECIO LE QUEDAN ${paraPrecio.toFixed(1)} dp (mínimo legible ~${MINIMO_PARA_PRECIO}).`)
  console.log('   La ley de la vuelta pone la mercadería primero y el precio segundo;')
  console.log('   un control que se come el renglón entero invierte esa jerarquía.')
}

console.log('')
console.log(fallos === 0 ? '✅ VERDE' : `🔴 ${fallos} problema(s) de geometría`)
process.exit(fallos === 0 ? 0 : 1)
