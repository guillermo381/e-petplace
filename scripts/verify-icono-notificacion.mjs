#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:icono-notificacion — QUE EL ÍCONO DE LA PUSH SIGA SIENDO UNA MÁSCARA.
 *
 * Android **no dibuja el ícono de notificación: dibuja su ALFA**, y le pone el
 * color él mismo. Un PNG con fondo opaco no da error, no rompe el build y no
 * falla la push: **sale un cuadrado blanco** en la barra de estado. Ese es el
 * síntoma que `D-1093` nombra, y el defecto que lo produce es invisible en el
 * repo — el archivo se ve perfecto abriéndolo.
 *
 * ── LOS TRES BRAZOS ────────────────────────────────────────────────────────
 * ① **todo píxel visible es blanco** — si hay color, alguien puso un logo en
 *   vez de una silueta y el sistema lo va a aplanar a un bloque.
 * ② **el lienzo es cuadrado** — el plugin de `expo-notifications` reescala con
 *   `cover`: un origen no cuadrado se recorta, y el recorte se lleva un pedazo
 *   del dibujo sin avisar.
 * ③ **hay suficiente resolución para xxxhdpi** — el plugin genera los cinco
 *   tamaños desde 24 dp (24 · 36 · 48 · 72 · **96** px). Un origen de menos de
 *   96 px se agranda, y un ícono de barra de estado borroso no se lee.
 *
 * ⚠️ MIDE LAS DOS APPS. La silueta es de la marca y el defecto es del formato,
 * no del dibujo: no hay razón para vigilar una casa y la otra no.
 *
 * ⚠️ LO QUE NO MIDE, declarado: si el dibujo SE LEE a 24 px. Eso se mira —
 * B lo montó a 24 y 48 px antes de entregarlo.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { readFileSync, existsSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

/** Lector de PNG mínimo: lo que hace falta es el alfa, y traer una librería
 *  para eso sería sumar dependencia a un gate. Soporta color tipo 6 (RGBA) y
 *  4 (gris+alfa), que es lo que produce cualquier exportador. */
function leerPng(ruta) {
  const b = readFileSync(ruta)
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('no es un PNG')
  let i = 8, ancho = 0, alto = 0, prof = 0, tipo = 0, datos = []
  while (i < b.length) {
    const largo = b.readUInt32BE(i)
    const clase = b.toString('ascii', i + 4, i + 8)
    const cuerpo = b.subarray(i + 8, i + 8 + largo)
    if (clase === 'IHDR') {
      ancho = cuerpo.readUInt32BE(0); alto = cuerpo.readUInt32BE(4)
      prof = cuerpo[8]; tipo = cuerpo[9]
    } else if (clase === 'IDAT') datos.push(cuerpo)
    else if (clase === 'IEND') break
    i += 12 + largo
  }
  if (prof !== 8 || (tipo !== 6 && tipo !== 4)) {
    return { ancho, alto, pixeles: null, porque: `profundidad ${prof}, tipo de color ${tipo}` }
  }
  const canales = tipo === 6 ? 4 : 2
  const crudo = inflateSync(Buffer.concat(datos))
  const linea = ancho * canales
  const out = Buffer.alloc(alto * linea)
  let p = 0
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[p++]
    const fila = crudo.subarray(p, p + linea); p += linea
    const prev = y > 0 ? out.subarray((y - 1) * linea, y * linea) : Buffer.alloc(linea)
    const act = out.subarray(y * linea, (y + 1) * linea)
    for (let x = 0; x < linea; x++) {
      const a = x >= canales ? act[x - canales] : 0
      const bb = prev[x]
      const c = x >= canales ? prev[x - canales] : 0
      let v = fila[x]
      if (filtro === 1) v += a
      else if (filtro === 2) v += bb
      else if (filtro === 3) v += (a + bb) >> 1
      else if (filtro === 4) {
        const pa = Math.abs(bb - c), pb = Math.abs(a - c), pc = Math.abs(a + bb - 2 * c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c
      }
      act[x] = v & 0xff
    }
  }
  return { ancho, alto, pixeles: out, canales }
}

const CASAS = [
  ['cliente', 'apps/cliente/assets/images/notification-icon.png'],
  ['prestador', 'apps/prestador/assets/images/notification-icon.png'],
]
const MINIMO_PX = 96   // xxxhdpi = 24 dp × 4
const rojos = []

for (const [casa, ruta] of CASAS) {
  if (!existsSync(ruta)) {
    console.log(`NO CONCLUYENTE: falta ${ruta} — sin el archivo, el verde no diría nada.`)
    process.exit(2)
  }
  const { ancho, alto, pixeles, canales, porque } = leerPng(ruta)
  if (!pixeles) {
    console.log(`NO CONCLUYENTE: ${ruta} tiene un formato que este lector no abre (${porque}).`)
    process.exit(2)
  }
  let visibles = 0, conColor = 0
  for (let k = 0; k < pixeles.length; k += canales) {
    const a = pixeles[k + canales - 1]
    if (a === 0) continue
    visibles++
    if (canales === 4) {
      if (pixeles[k] !== 255 || pixeles[k + 1] !== 255 || pixeles[k + 2] !== 255) conColor++
    } else if (pixeles[k] !== 255) conColor++
  }
  const partes = []
  if (conColor > 0) rojos.push(`${casa}: ${conColor} de ${visibles} píxeles visibles NO son blancos — Android sólo usa el alfa y lo va a aplanar a un bloque`)
  else partes.push('blanco puro')
  if (ancho !== alto) rojos.push(`${casa}: el lienzo es ${ancho}x${alto} y el plugin reescala con «cover» — un origen no cuadrado se recorta`)
  else partes.push(`cuadrado ${ancho}`)
  if (ancho < MINIMO_PX) rojos.push(`${casa}: ${ancho} px no alcanza para xxxhdpi (${MINIMO_PX} px) y el ícono sale borroso`)
  else partes.push(`≥ ${MINIMO_PX} px`)
  if (partes.length === 3) console.log(`  ✓ ${casa.padEnd(10)} ${partes.join(' · ')} · ${visibles} píxeles de dibujo`)
}

if (rojos.length) {
  console.log('')
  for (const r of rojos) console.log(`✗ ${r}`)
  console.log(`\nEL ICONO DE NOTIFICACION: ${rojos.length} EN ROJO`)
  process.exit(1)
}
console.log('\nEL ICONO DE NOTIFICACION: VERDE (2 casas × 3 brazos)')
