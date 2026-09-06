/**
 * EL QR, GENERADO EN EL SERVIDOR (firma del founder, 5-sep-2026).
 *
 * 🔴 **Ni la app ni el PDF agregan nada al bundle**: piden una imagen por URL.
 * *Meter un generador de QR en el bundle nativo son kilobytes en el teléfono de
 * cada familia para dibujar algo que el servidor puede mandar hecho.*
 *
 * ── LA LIBRERÍA, MEDIDA ANTES DE ELEGIR ─────────────────────────────────────
 * `qrcode-generator@2.0.4` · **MIT** · **CERO dependencias** · 555 kB unpacked.
 * La alternativa (`qrcode@1.5.4`, también MIT) arrastra **tres** —`pngjs`,
 * `yargs`, `dijkstrajs`—, y en una edge cada dependencia es peso de arranque y
 * superficie. *Se eligió por el número de dependencias, no por popularidad.*
 *
 * ⚠️ **Sin red en tiempo de ejecución**: se importa por especificador npm, que
 * Deno resuelve al desplegar y queda dentro del bundle. La edge no sale a
 * buscar nada para dibujar un QR.
 *
 * ── EL PNG SE ESCRIBE A MANO, y es más barato que traer una librería ────────
 * Un QR es un mapa de bits de 1 bit. El PNG se arma con `CompressionStream`,
 * que **viene en Deno** — cero dependencias otra vez. Son cuarenta líneas
 * contra un paquete entero.
 */
import qrcode from 'npm:qrcode-generator@2.0.4'

/** La matriz del QR: `true` = módulo oscuro. Corrección M — un QR en una chapita
 *  se raya, y M tolera ~15 % de daño sin dejar de leerse. */
function matriz(texto: string): boolean[][] {
  const qr = qrcode(0, 'M')
  qr.addData(texto)
  qr.make()
  const n = qr.getModuleCount()
  return Array.from({ length: n }, (_, f) =>
    Array.from({ length: n }, (_, c) => qr.isDark(f, c)))
}

/** SVG: un solo `<path>`, sin fuentes ni imágenes. Pesa ~1-2 kB. */
export function qrSvg(texto: string, lado = 512): string {
  const m = matriz(texto)
  const n = m.length
  const q = 4 // el margen que el estándar pide; sin él muchos lectores fallan
  const total = n + q * 2
  let d = ''
  for (let f = 0; f < n; f++) {
    for (let c = 0; c < n; c++) {
      if (m[f][c]) d += `M${c + q} ${f + q}h1v1h-1z`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" ` +
    `viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" ` +
    `aria-label="Código QR del pasaporte">` +
    `<rect width="${total}" height="${total}" fill="#fff"/>` +
    `<path d="${d}" fill="#221E19"/></svg>`
}

function crc32(b: Uint8Array): number {
  let c = ~0
  for (let i = 0; i < b.length; i++) {
    c ^= b[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(tipo: string, datos: Uint8Array): Uint8Array {
  const t = new TextEncoder().encode(tipo)
  const cuerpo = new Uint8Array(t.length + datos.length)
  cuerpo.set(t); cuerpo.set(datos, t.length)
  const out = new Uint8Array(8 + datos.length + 4)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, datos.length)
  out.set(cuerpo, 4)
  dv.setUint32(4 + cuerpo.length, crc32(cuerpo))
  return out
}

/** PNG en escala de grises de 8 bits, para la placa descargable. */
export async function qrPng(texto: string, escala = 12): Promise<Uint8Array> {
  const m = matriz(texto)
  const n = m.length
  const q = 4
  const lado = (n + q * 2) * escala

  // filas RGB→gris: cada fila lleva su byte de filtro (0 = ninguno)
  const cruda = new Uint8Array((lado + 1) * lado)
  for (let y = 0; y < lado; y++) {
    const base = y * (lado + 1)
    cruda[base] = 0
    const f = Math.floor(y / escala) - q
    for (let x = 0; x < lado; x++) {
      const c = Math.floor(x / escala) - q
      const oscuro = f >= 0 && f < n && c >= 0 && c < n && m[f][c]
      cruda[base + 1 + x] = oscuro ? 0x22 : 0xFF
    }
  }

  const comprimido = new Uint8Array(await new Response(
    new Blob([cruda]).stream().pipeThrough(new CompressionStream('deflate')),
  ).arrayBuffer())

  const ihdr = new Uint8Array(13)
  const dv = new DataView(ihdr.buffer)
  dv.setUint32(0, lado); dv.setUint32(4, lado)
  ihdr[8] = 8   // bits por muestra
  ihdr[9] = 0   // escala de grises
  const firma = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const partes = [firma, chunk('IHDR', ihdr), chunk('IDAT', comprimido), chunk('IEND', new Uint8Array(0))]
  const total = partes.reduce((a, p) => a + p.length, 0)
  const png = new Uint8Array(total)
  let o = 0
  for (const p of partes) { png.set(p, o); o += p.length }
  return png
}
