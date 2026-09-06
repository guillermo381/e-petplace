/**
 * LA PLACA — el SVG que se manda a imprimir (S113-B · 1.3 · B5).
 *
 * 3×3 cm: el QR, el nombre debajo y la marca. **Se declara en MILÍMETROS y no
 * en píxeles**, porque su destino es una placa de metal y no una pantalla —
 * *un `width` en px imprime distinto en cada impresora; 30 mm son 30 mm.*
 *
 * ── 🔴 LA PIEZA COMPONE; CONVERTIR Y BAJAR ES DE LA PANTALLA ───────────
 * Devuelve el SVG **como texto**. Pasarlo a PNG exige capturar una vista
 * (`react-native-view-shot` o equivalente) y **eso es una dependencia que este
 * grafo no tiene** — la misma razón por la que el QR llega dibujado. *Componer
 * acá y convertir allá deja la geometría en un solo lugar y la capacidad
 * nativa en el suyo.*
 *
 * ── EL MARGEN NO ES ESTÉTICA: ES LECTURA ───────────────────────────────
 * Un QR sin **zona tranquila** alrededor lo lee mal cualquier cámara — es
 * parte del código, no aire de diseño. Por eso `MARGEN_MM` no se toca sin
 * medir con una cámara real, y por eso el nombre va FUERA de esa zona.
 */

/** El lado de la placa, en milímetros. Firma del founder: 3×3 cm. */
export const LADO_MM = 30
/** La zona tranquila del QR. **Es parte del código**, no margen de diseño. */
export const MARGEN_MM = 2.5
/** Lo que se reserva abajo para el nombre y la marca. */
export const PIE_MM = 6

/** El lado del QR una vez descontados margen y pie. */
export function ladoQrMm(): number {
  return LADO_MM - MARGEN_MM * 2 - PIE_MM
}

export interface PlacaQrDatos {
  /** El SVG del código, **ya generado por quien tiene el dato**. */
  svgQr: string
  nombre: string
  /** El texto de la marca, en la voz de la pantalla (Ley 3). */
  marca: string
}

/** Escapa lo que va a texto del SVG: un nombre con `&` o `<` rompe el archivo
 *  entero, y los nombres de mascota los escribe gente, no un formulario. */
function xml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * El SVG de la placa, listo para imprimir o para convertir a PNG.
 *
 * ⚠️ **El QR se incrusta tal cual llega**, envuelto en un `<g>` con su
 * traslación: *reescribir su geometría es la forma más rápida de romper un
 * código que sí funcionaba.*
 */
export function svgDeLaPlaca({ svgQr, nombre, marca }: PlacaQrDatos): string {
  const q = ladoQrMm()
  const cx = LADO_MM / 2
  /* El QR viene con su propio `<svg>`: se le saca la cáscara y se reusa su
     contenido, para no anidar dos raíces —que algunos conversores ignoran. */
  const cuerpoQr = svgQr.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO_MM}mm" height="${LADO_MM}mm" viewBox="0 0 ${LADO_MM} ${LADO_MM}">`,
    `<rect width="${LADO_MM}" height="${LADO_MM}" fill="#FFFFFF"/>`,
    `<g transform="translate(${MARGEN_MM} ${MARGEN_MM}) scale(${q / 100})">${cuerpoQr}</g>`,
    /* El nombre en tinta, centrado y FUERA de la zona tranquila. */
    `<text x="${cx}" y="${LADO_MM - MARGEN_MM - 2}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="3" font-weight="600" fill="#221E19">${xml(nombre)}</text>`,
    `<text x="${cx}" y="${LADO_MM - MARGEN_MM + 1.4}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="1.8" fill="#6F6D6A">${xml(marca)}</text>`,
    `</svg>`,
  ].join('')
}
