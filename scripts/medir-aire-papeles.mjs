// MEDIR EL AIRE BAJO EL FILETE — S91-A
//
// POR QUÉ EXISTE: el «aire bajo el filete» es letra FIRMADA (gate impreso
// S90) y en S91 se descubrió que solo regía en UN papel de cinco. **El
// código estaba bien**: la regresión era de DESPLIEGUE — en Edge Functions
// `_shared/` se COPIA al desplegar, así que cambiar la plantilla no alcanza
// a ninguna función que no se vuelva a desplegar.
//
// Una regresión así NO la ve ningún typecheck ni ningún lint: el repo está
// verde y el papel sale mal. Lo único que la caza es MEDIR EL PDF. Esto lo
// hace, sin dependencias: descomprime los content streams y mide la
// distancia entre el filete magenta y la línea base del título.
//
// USO:  node scripts/medir-aire-papeles.mjs <papel.pdf> [más.pdf ...]
//
// QUÉ ESPERAR (y de dónde salen los números):
//   · los cuatro del expediente (carnet · historia clínica · receta · ficha)
//     usan la plantilla compartida: filete a `12 + AIRE_BAJO_FILETE` sobre la
//     base del título de 16pt  →  **22**
//   · el certificado dibuja el suyo, con título de 22pt: `18 + AIRE`  →  **28**
//   · un papel SIN el aire mide **12** — ese es el valor de la regresión, y
//     es el discriminador: si esta herramienta no distinguiera 12 de 22, no
//     mediría nada.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const MAGENTA = [0.557, 0.122, 0.408]; // #8E1F68 — el único acento del papel

function streams(buf) {
  const out = [];
  const marca = Buffer.from('stream\n');
  let i = 0;
  for (;;) {
    const a = buf.indexOf(marca, i);
    if (a < 0) break;
    const ini = a + marca.length;
    const fin = buf.indexOf(Buffer.from('endstream'), ini);
    if (fin < 0) break;
    const crudo = buf.subarray(ini, fin);
    try {
      out.push(inflateSync(crudo).toString('latin1'));
    } catch {
      out.push(crudo.toString('latin1'));
    }
    i = fin;
  }
  return out;
}

/** Devuelve { filete, titulo, aire } o null si el papel no tiene filete. */
export function medirAire(ruta) {
  for (const s of streams(readFileSync(ruta))) {
    const re = /([\d.]+) ([\d.]+) ([\d.]+) RG[\s\S]{0,120}?([\d.]+) ([\d.]+) m\s+([\d.]+) ([\d.]+) l/g;
    for (const m of s.matchAll(re)) {
      const [r, g, b] = [+m[1], +m[2], +m[3]];
      const esMagenta = MAGENTA.every((c, k) => Math.abs([r, g, b][k] - c) < 0.02);
      if (!esMagenta) continue;
      const filete = +m[5];
      const resto = s.slice(m.index + m[0].length);
      const t = /1 0 0 1 ([\d.]+) ([\d.]+) Tm/.exec(resto) ?? /([\d.]+) ([\d.]+) Td/.exec(resto);
      if (!t) return { filete, titulo: null, aire: null };
      const titulo = +t[2];
      return { filete, titulo, aire: Math.round((filete - titulo) * 10) / 10 };
    }
  }
  return null;
}

const rutas = process.argv.slice(2);
if (rutas.length === 0) {
  console.log('uso: node scripts/medir-aire-papeles.mjs <papel.pdf> [...]');
  process.exit(1);
}
let sinAire = 0;
for (const ruta of rutas) {
  const nombre = ruta.split('/').pop();
  const m = medirAire(ruta);
  if (m === null) {
    console.log(`${nombre.padEnd(34)} sin filete magenta — no aplica`);
    continue;
  }
  if (m.aire === null) {
    console.log(`${nombre.padEnd(34)} filete=${m.filete} · título NO ENCONTRADO`);
    continue;
  }
  const veredicto = m.aire >= 20 ? '✓' : '✗ SIN AIRE';
  if (m.aire < 20) sinAire += 1;
  console.log(`${nombre.padEnd(34)} filete=${String(m.filete).padEnd(8)} título=${String(m.titulo).padEnd(8)} AIRE=${String(m.aire).padEnd(6)} ${veredicto}`);
}
if (sinAire > 0) {
  console.log(`\n✗ ${sinAire} papel(es) SIN el aire firmado.`);
  console.log('  Antes de buscar en el código: mirá si la Edge Function se');
  console.log('  redesplegó después del último cambio de _shared/papel.ts.');
  console.log('  `npx supabase functions list` trae su updated_at.');
}
process.exit(sinAire > 0 ? 1 : 0);
