#!/usr/bin/env node
/**
 * TINTA-CAMPO — la verificación de N11″ **en PÍXELES, no en bounds**.
 *
 * 🔴 **NACE PORQUE LA VERIFICACIÓN ANTERIOR ERA CORRECTA Y FALSA A LA VEZ.**
 * Medí los `bounds` del volcado de accesibilidad, daban cero solape, y era
 * cierto — pero **el founder veía la etiqueta pisando las letras**. *Un
 * `bounds` declara la caja que un nodo PIDE; no dice dónde cae la tinta.*
 *
 * ── CÓMO MIDE, y por qué así y no por color ───────────────────────────
 * ⏪ **El primer intento separaba rótulo de valor por OSCURIDAD** —el rótulo
 * va en tinta 65 % y el valor en tinta plena— **y dio un número sin
 * sentido**: el disco del glifo y el borde de la caja caen en la misma
 * banda intermedia que el rótulo, y el antialias del valor también. *Una
 * clasificación por color sobre una imagen con más de dos cosas adentro no
 * clasifica: reparte.*
 *
 * ⇒ Mide **lo que la ley realmente pide: que haya un CORTE entre los dos
 * renglones.** Cuenta tinta por fila en la franja de TEXTO —a la derecha
 * del disco del glifo— y agrupa las filas contiguas con tinta.
 *   · **dos grupos con un hueco limpio** ⇒ cada uno tiene su renglón ✅
 *   · **un solo grupo** ⇒ el rótulo y el valor se tocan o se pisan ✗
 *
 * *El hueco es la prueba, y es la misma cosa que el ojo ve.*
 *
 * 🔴 **Y MIDE DOS COSAS, NO UNA — porque el defecto real resultó ser la
 * SEGUNDA.** El hueco entre los dos renglones ya existía antes de la cura
 * (12 px): lo que faltaba era **alto para dibujar el valor**. *Medido en el
 * mismo campo con la letra del sistema en 1,3: la tinta del valor ocupaba
 * **6,7 dp** — un renglón de 20 recortado a un tercio, que es exactamente
 * el «cortado por arriba» que el founder describe.* Tras la cura: **23,7
 * dp**.
 * ⇒ El veredicto exige **las dos**: hueco limpio **y** el valor con su
 * altura entera. *Con sólo el hueco, esto habría dado verde sobre el
 * defecto — que es la tercera vez en esta ley que un instrumento mide algo
 * verdadero al lado de lo que importa.*
 *
 * ⚠️ **Punto ciego que queda:** no distingue un hueco de 1 px de uno de 10,
 * y el alto mínimo del valor se pasa como argumento —no lo sabe solo—.
 *
 * Uso: `node scripts/tinta-campo.mjs <png> <y1> <y2> <x1> <x2>`
 */
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const [, , ruta, y1, y2, x1, x2] = process.argv
if (!ruta) { console.error('uso: tinta-campo.mjs <png> <y1> <y2> <x1> <x2>'); process.exit(2) }
const png = PNG.sync.read(readFileSync(ruta))
const lum = (x, y) => {
  const i = (png.width * y + x) << 2
  return 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]
}
const filas = []
for (let y = +y1; y < Math.min(+y2, png.height); y++) {
  let n = 0
  for (let x = +x1; x < Math.min(+x2, png.width); x++) if (lum(x, y) < 205) n++
  filas.push({ y, n })
}
/* Umbral 3: un píxel suelto es antialias, no un renglón de texto. */
const grupos = []
let act = null
for (const f of filas) {
  if (f.n >= 3) { if (!act) { act = { de: f.y, a: f.y } ; grupos.push(act) } else act.a = f.y }
  else act = null
}
console.log(`franja y=${y1}..${y2}  x=${x1}..${x2}  (sólo zona de texto)`)
grupos.forEach((g, i) => console.log(`  grupo ${i + 1}: filas ${g.de}..${g.a}  (${((g.a - g.de + 1) / 3).toFixed(1)} dp)`))
/* El rótulo y el valor son los DOS grupos más altos: los de 2-3 px son el
   borde de la caja, que entra cuando el rango de filas se pasa. */
const reales = [...grupos].filter((g) => g.a - g.de >= 8).sort((a, b) => a.de - b.de)
if (reales.length < 2) {
  console.log('\n  ✗ UN SOLO RENGLÓN: el rótulo y el valor no tienen corte entre sí')
  process.exit(1)
}
const [rot, val] = reales
const hueco = val.de - rot.a - 1
const altoVal = (val.a - val.de + 1) / 3
console.log(`\n  rótulo  · ${((rot.a - rot.de + 1) / 3).toFixed(1)} dp de tinta`)
console.log(`  valor   · ${altoVal.toFixed(1)} dp de tinta`)
console.log(`  razón valor/rótulo: ${(altoVal / ((rot.a - rot.de + 1) / 3)).toFixed(2)}`)
console.log(`  HUECO entre los dos: ${hueco} px (${(hueco / 3).toFixed(1)} dp)`)
/* 🔴 **EL PISO ES RELATIVO AL RÓTULO, NO ABSOLUTO — y la corrección la
   forzó una imagen que contradecía al instrumento.** ⏪ Era `>= 14 dp`, y
   marcó ROJO sobre un campo que en la captura **se veía entero**: el valor
   era «1712345675», **sólo dígitos, sin una sola descendente**, así que su
   tinta ocupa menos alto que un texto con «g» o «p». *Un umbral absoluto no
   sabe qué caracteres tiene el texto que mide.*
   ⇒ Se compara contra el rótulo, que está en la MISMA fuente y la misma
   escala: el valor (15 sp) tiene que dar más tinta que el rótulo (11 sp).
   **En el caso roto los dos daban 6,7 dp — razón 1,0, que es justamente la
   firma del recorte**; en los sanos va de 1,5 a 3,2.
   ⚠️ Sigue sin ser perfecto: si el rótulo tuviera descendentes y el valor
   no, la razón baja. **Por eso el veredicto acompaña siempre al recorte
   ampliado, y el recorte manda.** */
const RAZON_MINIMA = 1.15
const altoRot = (rot.a - rot.de + 1) / 3
const razon = altoVal / altoRot
const ok = hueco > 0 && razon >= RAZON_MINIMA
console.log(
  ok
    ? '  ✓ LIMPIO — hueco entre los dos Y el valor con su altura entera'
    : hueco <= 0
      ? '  ✗ SE TOCAN'
      : `  ✗ EL VALOR ESTÁ RECORTADO (razón valor/rótulo ${razon.toFixed(2)} < ${RAZON_MINIMA})`,
)
process.exit(ok ? 0 : 1)
