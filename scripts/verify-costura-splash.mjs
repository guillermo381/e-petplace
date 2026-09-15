#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:costura-splash — QUE EL SPLASH NATIVO Y EL SPLASH JS NO SE SEPAREN.
 *
 * Son DOS pantallas que tienen que verse como UNA: la que pinta Android/iOS
 * antes de que exista JavaScript, y la que pinta `apps/cliente/src/app/index.tsx`
 * un instante después. **El modo de falla es silencioso y por eso hay gate**:
 * si alguien cambia el magenta de la marca, o la fracción del ancho con la que
 * la nariz se dibuja, *el JS se entera y el nativo no* — la app sigue
 * arrancando, nada falla, y aparece un salto de color o de tamaño que nadie
 * atribuye a ese cambio.
 *
 * ── LAS TRES COSAS QUE MIDE ─────────────────────────────────────────────────
 * ① EL COLOR es el MISMO objeto: el `backgroundColor` del plugin nativo contra
 *   `palette.magentaAccion`, que es el que la pantalla JS pinta.
 * ② EL ANCHO es COHERENTE: el JS dibuja la nariz al `marcaProtagonistaFraccion`
 *   del ancho de pantalla; el nativo sólo sabe de un número fijo en dp. El gate
 *   exige que ese número sea la fracción aplicada al ANCHO DE REFERENCIA que el
 *   propio archivo declara — así el número deja de ser tecleado y pasa a ser
 *   derivado, y si alguien cambia la fracción el gate se pone rojo.
 * ③ EL TECHO DE ANDROID 12, que es lo que impide que esto se resuelva «subiendo
 *   el número»: el sistema recorta el ícono del splash a un círculo de 192 dp
 *   (lienzo de 288 dp, sin fondo de ícono). La nariz es ANCHA y su círculo
 *   circunscrito mide 1,034 veces su ancho dibujado ⇒ por encima de 185 dp
 *   **se le comen los costados**. Medido con el PNG real, no supuesto:
 *   `node scripts/lote8/generar-assets.mjs` lo imprime.
 *
 * ⚠️ LO QUE **NO** MIDE, declarado: que las dos se vean iguales en un aparato.
 * Eso es del ojo del founder. Esto mide que los números no se hayan separado.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from 'node:fs'

/** El ancho de pantalla, en dp, contra el que se eligió `imageWidth`.
 *  **Se declara acá porque no hay forma de derivarlo**: el nativo no puede
 *  pedir una fracción, así que la costura es exacta a UN ancho y aproximada en
 *  los demás. 360 dp es el ancho de la mayoría de los Android en su densidad
 *  de fábrica. *Si el aparato de referencia cambia, se cambia acá y el gate
 *  vuelve a decir la verdad.* */
const ANCHO_REFERENCIA_DP = 360
/** El tope que impone la máscara redonda de Android 12, medido sobre el PNG. */
const TOPE_ANDROID12_DP = 185

const rojos = []
const nota = (t) => console.log(`  ${t}`)

const app = JSON.parse(readFileSync('apps/cliente/app.json', 'utf8')).expo
const splash = (app.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-splash-screen')
if (!splash) {
  console.log('NO CONCLUYENTE: `expo-splash-screen` no está en los plugins del cliente.')
  process.exit(2)
}
const { backgroundColor, imageWidth } = splash[1] ?? {}

const palette = readFileSync('packages/ui/src/tokens/palette.ts', 'utf8')
const mAccion = palette.match(/magentaAccion:\s*'(#[0-9A-Fa-f]{6})'/)
const medidas = readFileSync('packages/ui/src/tokens/medidas.ts', 'utf8')
const frac = medidas.match(/marcaProtagonistaFraccion:\s*([0-9.]+)/)

if (!mAccion || !frac) {
  console.log('NO CONCLUYENTE: no se pudo leer `magentaAccion` o `marcaProtagonistaFraccion` de los tokens.')
  process.exit(2)
}

// ① el color
if ((backgroundColor ?? '').toUpperCase() !== mAccion[1].toUpperCase()) {
  rojos.push(`el fondo del splash nativo es ${backgroundColor} y la pantalla JS pinta ${mAccion[1]} (palette.magentaAccion)`)
} else {
  nota(`✓ color   ${backgroundColor} = palette.magentaAccion`)
}

// ② el ancho
const esperado = Math.round(ANCHO_REFERENCIA_DP * Number(frac[1]))
if (imageWidth !== esperado) {
  rojos.push(`imageWidth=${imageWidth} y la fracción de la marca (${frac[1]}) sobre ${ANCHO_REFERENCIA_DP} dp da ${esperado}`)
} else {
  nota(`✓ ancho   imageWidth=${imageWidth} = ${frac[1]} × ${ANCHO_REFERENCIA_DP} dp de referencia`)
}

// ③ el techo
if (imageWidth > TOPE_ANDROID12_DP) {
  rojos.push(`imageWidth=${imageWidth} pasa el tope de ${TOPE_ANDROID12_DP} dp: la máscara redonda de Android 12 le come los costados a la nariz`)
} else {
  nota(`✓ techo   ${imageWidth} ≤ ${TOPE_ANDROID12_DP} dp (máscara de 192 dp de Android 12, con la nariz medida)`)
}

if (rojos.length) {
  console.log('')
  for (const r of rojos) console.log(`✗ ${r}`)
  console.log(`\nLA COSTURA DEL SPLASH: ${rojos.length} EN ROJO`)
  process.exit(1)
}
console.log('\nLA COSTURA DEL SPLASH: VERDE (3 brazos)')
