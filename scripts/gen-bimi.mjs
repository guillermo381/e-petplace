/**
 * gen-bimi.mjs — el isotipo en **SVG Tiny PS** para BIMI (S89-B orden 9).
 *
 * BIMI (Brand Indicators for Message Identification) es el avatar de marca
 * que el cliente de correo muestra junto al remitente. Su formato NO es SVG
 * a secas: es el perfil **SVG Tiny 1.2 Portable/Secure**, y sus reglas son
 * DURAS (un archivo que las incumple no se muestra — y falla en silencio,
 * que es la familia L-192).
 *
 * QUÉ HACE ESTE SCRIPT — y por qué es un script y no un archivo a mano:
 * el isotipo de marca es **apaisado** (viewBox 471.82×324) y BIMI exige
 * **cuadrado**. Meterlo a mano en un lienzo cuadrado es re-calcular la
 * traslación cada vez que el isotipo cambie; acá se DERIVA del asset vivo
 * (`assets/brand/isotipo-gradiente.svg`) y se centra por aritmética. El día
 * que la marca cambie, se vuelve a correr.
 *
 * EL FONDO ES NEGRO POR FIRMA (founder). Se usa `palette.dark0` #050508 —
 * el negro DE LA CASA, no un `#000` inventado: fuente única de hex. La
 * diferencia contra negro puro es imperceptible (2/255) y el token es
 * auditable.
 *
 * ⚠️ LO QUE ESTE SCRIPT NO HACE (declarado, es de A y del founder):
 *  · el DNS: el registro `default._bimi.<dominio>` con `v=BIMI1; l=<url>`;
 *  · el hosting del SVG en HTTPS con el MIME correcto;
 *  · el **VMC/CMC** (certificado de marca) — Gmail y Apple lo exigen para
 *    MOSTRAR el logo. Sin él, el SVG es válido y NADIE lo ve: es un
 *    requisito de negocio (marca registrada), no de diseño.
 *  · BIMI exige además DMARC en `p=quarantine|reject`.
 *
 * Correr: node scripts/gen-bimi.mjs   ·   valida: node scripts/verify-bimi.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'

const ORIGEN = 'packages/ui/assets/brand/isotipo-gradiente.svg'
const DESTINO = 'packages/ui/assets/brand/isotipo-bimi.svg'

const NEGRO = '#050508' // palette.dark0 — el negro de la casa
const LIENZO = 512 // cuadrado, la talla que BIMI recomienda
const MARGEN = 0.14 // aire alrededor del isotipo (14% por lado)

const src = readFileSync(ORIGEN, 'utf8')

// ── se DERIVA del asset vivo: viewBox, gradiente y path ───────────────
const vb = src.match(/viewBox="([\d.\s-]+)"/)
if (vb === null) throw new Error(`${ORIGEN}: sin viewBox — no se puede derivar`)
const [, , ANCHO, ALTO] = vb[1].trim().split(/\s+/).map(Number)

const stops = [...src.matchAll(/<stop offset="([^"]+)" stop-color="([^"]+)"\/>/g)].map((m) => ({
  offset: m[1],
  color: m[2],
}))
if (stops.length < 2) throw new Error(`${ORIGEN}: se esperaban los stops del gradiente y vinieron ${stops.length}`)

const d = src.match(/<path fill="url\(#[^)]+\)" d="([^"]+)"\/>/)
if (d === null) throw new Error(`${ORIGEN}: no se encontró el path del isotipo`)

// ── el encuadre: escala para que el lado largo entre con su margen ────
const util = LIENZO * (1 - 2 * MARGEN)
const escala = util / Math.max(ANCHO, ALTO)
const tx = (LIENZO - ANCHO * escala) / 2
const ty = (LIENZO - ALTO * escala) / 2
const r = (n) => Number(n.toFixed(3))

// El gradiente original es userSpaceOnUse sobre el viewBox viejo; se
// re-declara en objectBoundingBox para que sobreviva la transformación
// (vertical, como el original: x1=x2).
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 ${LIENZO} ${LIENZO}">
  <title>e-PetPlace</title>
  <defs>
    <linearGradient id="marca" x1="0" y1="0" x2="0" y2="1">
${stops.map((s) => `      <stop offset="${s.offset}" stop-color="${s.color}"/>`).join('\n')}
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${LIENZO}" height="${LIENZO}" fill="${NEGRO}"/>
  <g transform="translate(${r(tx)} ${r(ty)}) scale(${r(escala)})">
    <path fill="url(#marca)" d="${d[1]}"/>
  </g>
</svg>
`

writeFileSync(DESTINO, svg)
console.log(`✓ ${DESTINO}`)
console.log(`  lienzo ${LIENZO}×${LIENZO} · isotipo ${ANCHO}×${ALTO} escalado ×${r(escala)} · fondo ${NEGRO} (palette.dark0)`)
console.log(`  ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB · ${stops.length} stops derivados del asset vivo`)

// ── LA GARANTÍA DEL RECORTE CIRCULAR, por aritmética ─────────────────
// Las bandejas muestran el avatar BIMI recortado en CÍRCULO. Un isotipo
// que entra en el cuadrado pero se sale del círculo inscrito aparece
// MUTILADO — y otra vez sin que nada falle. Acá se mide en vez de
// confiar en que "se veía bien": la esquina del bbox del isotipo es su
// punto más lejano al centro.
const radioCirculo = LIENZO / 2
const lejano = Math.hypot((ANCHO * escala) / 2, (ALTO * escala) / 2)
const holgura = radioCirculo - lejano
console.log(
  `  recorte circular: punto más lejano del isotipo al centro ${r(lejano)} · radio del círculo ${radioCirculo}` +
    ` ⇒ ${holgura >= 0 ? `ENTRA COMPLETO (holgura ${r(holgura)})` : `🔴 SE SALE ${r(-holgura)} — subí MARGEN`}`,
)
if (holgura < 0) process.exit(1)
