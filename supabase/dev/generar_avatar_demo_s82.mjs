#!/usr/bin/env node
/**
 * GENERADOR DEL AVATAR DEMO (S82-A r18-bis) — PNG sin una sola dependencia
 * (zlib es de node), para que el seed de la familia de cuatro pueda
 * sembrar una foto REAL y el caso "mascota con foto" tenga por fin un
 * discriminador permanente.
 *
 * ══ POR QUÉ NO ES UN COLOR PLANO ══
 * La foto del seed no está para "que se vea algo": está para probar el
 * ENCUADRE (cx/cy/z de la migración `20260729233000`) en los seis
 * tamaños. Un cuadrado liso pasaría verde con el recorte roto — sería
 * exactamente la verificación cuyo modo de falla es el silencio (L-192).
 *
 * Por eso la imagen es una CARTA DE AJUSTE legible:
 *   · CUADRANTES en cuatro grises distintos → si el recorte se corre, se
 *     ve al instante cuál cuadrante domina.
 *   · MARCO de 24 px en el borde → con el zoom por defecto (z = 1.3) el
 *     marco debe quedar PARCIALMENTE FUERA. Si se ve entero, el zoom no
 *     se está aplicando.
 *   · DIANA en (0.5, 0.42) → el punto exacto al que apunta el encuadre
 *     por defecto. Bien encuadrada, la diana queda CENTRADA en el avatar.
 *     Es la aguja del instrumento.
 *
 * Y es deliberadamente NEUTRA (grises): es un placeholder y se ve como
 * un placeholder. No usa color de marca — la paleta es de la UI, no de
 * un asset de prueba, y un avatar de demo que parece foto real ensucia
 * cualquier gate visual posterior.
 *
 * USO:  node supabase/dev/generar_avatar_demo_s82.mjs <salida.png>
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const LADO = 512;
const CENTRO_X = 0.5;
const CENTRO_Y = 0.42; // el cy por defecto del encuadre — la diana va acá
const MARCO = 24;

/** CRC32 de PNG, tabla al vuelo (no vale la pena una dependencia). */
const TABLA = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

// ── El dibujo ───────────────────────────────────────────────────────────────
const pixeles = Buffer.alloc(LADO * LADO * 3);
const dx = CENTRO_X * LADO;
const dy = CENTRO_Y * LADO;

for (let y = 0; y < LADO; y++) {
  for (let x = 0; x < LADO; x++) {
    // cuadrantes: cuatro grises que se distinguen sin ser estridentes
    const arriba = y < LADO / 2;
    const izq = x < LADO / 2;
    let v = arriba ? (izq ? 0x6b : 0x8a) : izq ? 0xa8 : 0xc6;

    // marco: el testigo del zoom
    if (x < MARCO || y < MARCO || x >= LADO - MARCO || y >= LADO - MARCO) v = 0x2b;

    // diana en (0.5, 0.42): anillo + cruz
    const r = Math.hypot(x - dx, y - dy);
    if (r > 54 && r < 62) v = 0xf2;
    if (r < 66 && (Math.abs(x - dx) < 3 || Math.abs(y - dy) < 3)) v = 0xf2;

    const i = (y * LADO + x) * 3;
    pixeles[i] = pixeles[i + 1] = pixeles[i + 2] = v;
  }
}

// filas con byte de filtro 0 (PNG lo exige)
const crudo = Buffer.alloc(LADO * (LADO * 3 + 1));
for (let y = 0; y < LADO; y++) {
  crudo[y * (LADO * 3 + 1)] = 0;
  pixeles.copy(crudo, y * (LADO * 3 + 1) + 1, y * LADO * 3, (y + 1) * LADO * 3);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(LADO, 0);
ihdr.writeUInt32BE(LADO, 4);
ihdr[8] = 8; // 8 bits por canal
ihdr[9] = 2; // truecolor RGB
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  trozo('IHDR', ihdr),
  trozo('IDAT', deflateSync(crudo, { level: 9 })),
  trozo('IEND', Buffer.alloc(0)),
]);

const salida = process.argv[2];
if (!salida) {
  console.error('uso: node generar_avatar_demo_s82.mjs <salida.png>');
  process.exit(1);
}
writeFileSync(salida, png);
console.log(`✓ ${salida} · ${LADO}×${LADO} · ${png.length} bytes · diana en (${CENTRO_X}, ${CENTRO_Y})`);
