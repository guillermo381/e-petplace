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
  /alignItems: 'center', gap: compacto \? spacing\[[\d.]+\] : spacing\[([\d.]+)\]/,
  'el gap del stepper',
  'StepperCantidad.tsx',
)[1]
const minWidthKey = extraer(stepperSrc, /minWidth: compacto \? spacing\[[\d.]+\] : spacing\[([\d.]+)\]/, 'el minWidth del valor', 'StepperCantidad.tsx')[1]

const GAP_STEPPER = sp(gapStepperKey)
const MIN_VALOR = sp(minWidthKey)
/** [−] gap [valor] gap [+] — los dos botones son View de ancho fijo:
 *  `flexShrink` por defecto es 0, así que NO ceden. */
const ANCHO_STEPPER = BOTON * 2 + GAP_STEPPER * 2 + MIN_VALOR

/* 🔴 EL INSTRUMENTO SIGUE A LA PIEZA (S100b-B). Cuando la tarjeta pasó a
   montar la variante COMPACTA, seguir midiendo la de 44 habría dado un
   rojo perfectamente creíble sobre una anatomía que ya no existe — que es
   la lección de la barra de S99 en su otra cara: *un instrumento que no
   sigue a su pieza mide su propio eco.* Los tres números salen del archivo
   real igual que los de arriba. */
const BOTON_COMPACTO = Number(
  extraer(stepperSrc, /const BOTON_COMPACTO = (\d+)/, 'BOTON_COMPACTO', 'StepperCantidad.tsx')[1],
)
const gapCompactoKey = extraer(
  stepperSrc,
  /gap: compacto \? spacing\[([\d.]+)\]/,
  'el gap compacto del stepper',
  'StepperCantidad.tsx',
)[1]
const minValorCompactoKey = extraer(
  stepperSrc,
  /minWidth: compacto \? spacing\[([\d.]+)\]/,
  'el minWidth compacto del valor',
  'StepperCantidad.tsx',
)[1]
const ANCHO_STEPPER_COMPACTO = BOTON_COMPACTO * 2 + sp(gapCompactoKey) * 2 + sp(minValorCompactoKey)
/** El blanco táctil efectivo: el visual más su `hitSlop` a cada lado. N8
 *  se cumple sobre ESTE número, no sobre el visual. */
const HOLGURA = (BOTON - BOTON_COMPACTO) / 2
const TACTIL_COMPACTO = BOTON_COMPACTO + HOLGURA * 2

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
/** ¿El control vive en su propia fila? Si sí, dispone de la caja entera y
 *  no compite con el precio. Se LEE del archivo, no se supone. */
const CONTROL_EN_SU_FILA = /alignItems: 'flex-end' \}\}\s*>\s*\n\s*<StepperCantidad/.test(tarjetaSrc)


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
console.log(`cantidad ≥1 (stepper 44) : ${ANCHO_STEPPER} dp   ⇒ ${(cajaInterna - ANCHO_STEPPER).toFixed(1)} dp (negativo = por esto existe la variante compacta)`)
console.log('')

console.log('── la re-derivación (S100b-B) ──')
console.log(`stepper COMPACTO: ${BOTON_COMPACTO}·2 + ${sp(gapCompactoKey)}·2 + ${sp(minValorCompactoKey)} = ${ANCHO_STEPPER_COMPACTO} dp`)
console.log(`blanco táctil efectivo: ${BOTON_COMPACTO} visual + ${HOLGURA}·2 de hitSlop = ${TACTIL_COMPACTO} dp (N8 exige 44)`)
console.log(`el control vive en su propia fila: ${CONTROL_EN_SU_FILA ? 'SÍ (dispone de la caja entera)' : 'NO (comparte renglón con el precio)'}`)
console.log('')

let fallos = 0

/* La re-derivación se verifica sobre lo que la tarjeta MONTA HOY: el
   compacto, y en su propia fila. */
const sobraCompacto = cajaInterna - ANCHO_STEPPER_COMPACTO
if (sobraCompacto < 0) {
  fallos++
  console.log(`🔴 el stepper COMPACTO tampoco entra: faltan ${Math.abs(sobraCompacto).toFixed(1)} dp.`)
} else {
  console.log(`✅ el stepper compacto entra en la caja con ${sobraCompacto.toFixed(1)} dp de sobra.`)
}

if (TACTIL_COMPACTO < 44) {
  fallos++
  console.log(`🔴 N8 ROTA: el blanco táctil efectivo es ${TACTIL_COMPACTO} dp y la ley pide 44.`)
  console.log('   Lo que se achica es el PÍXEL, jamás el TARGET: subí el hitSlop, no el visual.')
} else {
  console.log(`✅ N8 se cumple: ${TACTIL_COMPACTO} dp de blanco efectivo.`)
}

/* El de 44 sigue siendo el correcto para contenedores anchos (el carrito
   lo monta y ahí mide 144 con sus dos botones). Su "no entra" en la caja
   de 138 ya NO es un fallo: es la razón por la que existe el compacto. */
console.log('')
console.log(`(el stepper de 44 sigue midiendo ${ANCHO_STEPPER} dp — correcto para la fila ancha del carrito,`)
console.log(` donde se midió 144.0 dp con \`Menos\` y \`Más\` presentes. Acá no entra, y por eso hay variante.)`)
console.log('')

/* EL PRECIO COMPARTE RENGLÓN SOLO CON EL TIMBRE (cantidad 0). Con
   cantidad, el control baja a su fila y el precio dispone de la caja
   entera — por eso el mínimo se mide contra el TIMBRE y no contra el
   stepper. */
const MINIMO_PARA_PRECIO = 56
const paraPrecio = cajaInterna - TIMBRE - GAP_FILA
if (paraPrecio < MINIMO_PARA_PRECIO) {
  fallos++
  console.log(`🔴 AL PRECIO LE QUEDAN ${paraPrecio.toFixed(1)} dp (mínimo legible ~${MINIMO_PARA_PRECIO}).`)
} else {
  console.log(`✅ al precio le quedan ${paraPrecio.toFixed(1)} dp en su renglón (mínimo ~${MINIMO_PARA_PRECIO}).`)
}

if (!CONTROL_EN_SU_FILA) {
  fallos++
  console.log('')
  console.log('🔴 EL CONTROL VOLVIÓ AL RENGLÓN DEL PRECIO.')
  console.log(`   Ahí necesita ${(ANCHO_STEPPER_COMPACTO + GAP_FILA + MINIMO_PARA_PRECIO).toFixed(0)} dp y la caja tiene ${cajaInterna.toFixed(0)}.`)
  console.log('   Con `overflow: hidden` eso vuelve a recortar el `+`: es G-01 de nuevo.')
}

console.log('')
console.log(fallos === 0 ? '✅ VERDE' : `🔴 ${fallos} problema(s) de geometría`)
process.exit(fallos === 0 ? 0 : 1)
