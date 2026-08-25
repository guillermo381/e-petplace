/**
 * Decodificador PNG mínimo en node puro (zlib built-in) — S105-B.
 *
 * Por qué existe: este entorno no tiene NI UNA librería de imagen
 * (censado en S104-B: sharp · resvg · canvas · magick · sips-bbox → ninguna).
 * Y la casa tiene una ley que exige medir esto: **medí el CUERPO, no el
 * LIENZO** (S104-B se equivocó por comparar lienzos y casi le cuesta al
 * founder una decisión peor).
 *
 * Hace tres cosas y ninguna más:
 *   1. decodifica a RGBA plano
 *   2. mide el bbox del alfa (el cuerpo real de la marca)
 *   3. recorta a ese bbox y reescribe PNG **sin resamplear un solo píxel**
 *      (lossless: cada píxel del cuerpo sale idéntico al que entró)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';

const FIRMA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function trozos(buf) {
  if (!buf.subarray(0, 8).equals(FIRMA)) throw new Error('no es PNG');
  const out = [];
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const tipo = buf.toString('ascii', p + 4, p + 8);
    out.push({ tipo, datos: buf.subarray(p + 8, p + 8 + len) });
    p += 12 + len;
  }
  return out;
}

const CANALES = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

/** PNG → { w, h, rgba: Uint8Array }  (soporta 8 bits: gris, RGB, paleta, +alfa) */
export function decodificar(ruta) {
  const cs = trozos(readFileSync(ruta));
  const ihdr = cs.find((c) => c.tipo === 'IHDR').datos;
  const w = ihdr.readUInt32BE(0);
  const h = ihdr.readUInt32BE(4);
  const prof = ihdr[8];
  const tipoColor = ihdr[9];
  const entrelazado = ihdr[12];
  if (prof !== 8) throw new Error(`profundidad ${prof} no soportada`);
  if (entrelazado !== 0) throw new Error('entrelazado no soportado');

  const paleta = cs.find((c) => c.tipo === 'PLTE')?.datos ?? null;
  const trns = cs.find((c) => c.tipo === 'tRNS')?.datos ?? null;
  const nc = CANALES[tipoColor];
  const bpp = nc;                       // bytes por píxel (8 bits)
  const ancho = w * bpp;                // bytes por scanline sin el filtro

  const idat = inflateSync(
    Buffer.concat(cs.filter((c) => c.tipo === 'IDAT').map((c) => c.datos)),
  );

  // Des-filtrado (RFC 2083 §6)
  const crudo = Buffer.alloc(h * ancho);
  let prev = Buffer.alloc(ancho);
  for (let y = 0; y < h; y++) {
    const filtro = idat[y * (ancho + 1)];
    const linea = idat.subarray(y * (ancho + 1) + 1, (y + 1) * (ancho + 1));
    const cur = crudo.subarray(y * ancho, (y + 1) * ancho);
    for (let x = 0; x < ancho; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = linea[x];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
    prev = cur;
  }

  // → RGBA plano
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const s = i * bpp, d = i * 4;
    if (tipoColor === 6) { rgba[d] = crudo[s]; rgba[d+1] = crudo[s+1]; rgba[d+2] = crudo[s+2]; rgba[d+3] = crudo[s+3]; }
    else if (tipoColor === 2) { rgba[d] = crudo[s]; rgba[d+1] = crudo[s+1]; rgba[d+2] = crudo[s+2]; rgba[d+3] = 255; }
    else if (tipoColor === 0) { rgba[d] = rgba[d+1] = rgba[d+2] = crudo[s]; rgba[d+3] = 255; }
    else if (tipoColor === 4) { rgba[d] = rgba[d+1] = rgba[d+2] = crudo[s]; rgba[d+3] = crudo[s+1]; }
    else if (tipoColor === 3) {
      const idx = crudo[s];
      rgba[d] = paleta[idx*3]; rgba[d+1] = paleta[idx*3+1]; rgba[d+2] = paleta[idx*3+2];
      rgba[d+3] = trns && idx < trns.length ? trns[idx] : 255;
    }
  }
  return { w, h, rgba };
}

/** bbox de los píxeles con alfa > umbral. **El cuerpo, no el lienzo.** */
export function cuerpo({ w, h, rgba }, umbral = 8) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (rgba[(y * w + x) * 4 + 3] > umbral) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Componentes conexas de píxeles opacos (4-vecinos, BFS iterativo), de mayor a
 * menor. Nació para aislar **el punto del signo de exclamación** del isotipo de
 * Deuna, que es la unidad `X` de su área de reserva.
 */
export function componentes({ w, h, rgba }, umbral = 8) {
  const visto = new Uint8Array(w * h), out = [];
  const op = (i) => rgba[i * 4 + 3] > umbral;
  for (let s = 0; s < w * h; s++) {
    if (visto[s] || !op(s)) continue;
    let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
    const cola = [s]; visto[s] = 1;
    while (cola.length) {
      const i = cola.pop(), x = i % w, y = (i / w) | 0;
      n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (!visto[j] && op(j)) { visto[j] = 1; cola.push(j); }
      }
    }
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    out.push({
      x0, y0, x1, y1, w: cw, h: ch, px: n,
      aspecto: cw / ch,
      /** 1.0 = elipse perfectamente llena. Un punto tipográfico da ~0.99. */
      llenado: n / (Math.PI * (cw / 2) * (ch / 2)),
    });
  }
  return out.sort((a, b) => b.px - a.px);
}

/**
 * El punto redondo más chico: aspecto ~1 y relleno de elipse ~1.
 * **Devuelve `null` si no encuentra uno inequívoco** — jamás adivina, porque
 * el número que sale de acá es la unidad de un área de reserva de marca ajena.
 */
export function puntoRedondo(img) {
  const c = componentes(img).filter(
    (k) => k.aspecto > 0.9 && k.aspecto < 1.1 && k.llenado > 0.9 && k.px > 16,
  );
  return c.length === 0 ? null : c[c.length - 1];
}

/** Histograma de colores de los píxeles opacos. */
export function colores({ w, h, rgba }, topN = 8) {
  const m = new Map();
  for (let i = 0; i < w * h; i++) {
    if (rgba[i*4+3] < 250) continue;
    const k = (rgba[i*4] << 16) | (rgba[i*4+1] << 8) | rgba[i*4+2];
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([k, n]) => ({
      hex: '#' + k.toString(16).padStart(6, '0').toUpperCase(),
      pct: +(100 * n / total).toFixed(2), px: n,
    }));
}

/** Escribe RGBA como PNG (color type 6, filtro 0). Sin resamplear nada. */
export function escribir(ruta, w, h, rgba) {
  const crudo = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    crudo[y * (w * 4 + 1)] = 0;                                   // filtro None
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4)
      .copy(crudo, y * (w * 4 + 1) + 1);
  }
  const trozo = (tipo, datos) => {
    const b = Buffer.alloc(8 + datos.length + 4);
    b.writeUInt32BE(datos.length, 0);
    b.write(tipo, 4, 'ascii');
    datos.copy(b, 8);
    b.writeInt32BE(crc32(b.subarray(4, 8 + datos.length)), 8 + datos.length);
    return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  writeFileSync(ruta, Buffer.concat([
    FIRMA,
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]));
}

/** Recorta a un bbox. Copia de píxeles, cero interpolación. */
export function recortar({ w, rgba }, b) {
  const out = new Uint8Array(b.w * b.h * 4);
  for (let y = 0; y < b.h; y++)
    out.set(rgba.subarray(((b.y0 + y) * w + b.x0) * 4, ((b.y0 + y) * w + b.x0 + b.w) * 4), y * b.w * 4);
  return out;
}

let TABLA = null;
function crc32(buf) {
  if (!TABLA) {
    TABLA = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLA[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLA[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) | 0;
}

/* ─────────────────────────────────────────────────────────────────────────
   CLI · `node scripts/medir-png.mjs <archivo.png> [...]`
   Sin argumentos corre EL CONTROL: mide el splash del prestador y lo compara
   contra los 245×168 que S104-B midió. **Si el control sale rojo, ninguna
   medición de este instrumento vale.**
   ───────────────────────────────────────────────────────────────────────── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    const r = new URL('../apps/prestador/assets/images/splash-icon.png', import.meta.url).pathname;
    const b = cuerpo(decodificar(r));
    const ok = b.w === 245 && b.h === 168;
    console.log(`control · splash del prestador → cuerpo ${b.w}×${b.h} (S104-B midió 245×168)`);
    console.log(ok ? '✅ CONTROL VERDE' : '🔴 CONTROL ROJO — no confiar en este instrumento');
    process.exit(ok ? 0 : 1);
  }
  for (const f of args) {
    const img = decodificar(f);
    const b = cuerpo(img);
    console.log(`\n${f}`);
    console.log(`  lienzo ${img.w}×${img.h}  ·  cuerpo ${b.w}×${b.h}  ·  aspecto ${(b.w / b.h).toFixed(3)}`);
    console.log(`  padding izq ${b.x0} arr ${b.y0} der ${img.w - 1 - b.x1} aba ${img.h - 1 - b.y1}`);
    console.log(`  colores ${colores(img, 4).map((c) => `${c.hex} ${c.pct}%`).join('  ')}`);
  }
}
