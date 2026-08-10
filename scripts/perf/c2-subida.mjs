/**
 * S94-PERF · D-734 — EL COSTO DE SUBIR, ANTES Y DESPUÉS.
 *
 * La cura redimensiona a 1600 px antes de subir. Este script mide **lo que esa
 * diferencia cuesta en el cable**: se sube un payload del tamaño de una foto
 * SIN redimensionar y otro del tamaño de una redimensionada, al MISMO bucket y
 * por la MISMA puerta, y se cronometran los dos.
 *
 * ── QUÉ ES Y QUÉ NO ES (R4) ────────────────────────────────────────────────
 * **Es** una medición real de transporte contra el Storage del proyecto vivo.
 * **No es** el teléfono del founder en su red: los segundos absolutos son de
 * esta máquina. *Lo que viaja al aparato es la RAZÓN entre los dos números, no
 * el número.* Y viaja bien porque el cuello es el mismo: bytes por el cable.
 *
 * ── LOS TAMAÑOS NO SON INVENTADOS ──────────────────────────────────────────
 * El «antes» es la mediana medida de `prestador-galeria` (474 kB) y su peor
 * caso real (5,9 MB). El «después» se toma de la comparable que la casa ya
 * tiene subida: `prestador-documentos`, que usa exactamente 1600 px y da una
 * mediana de 204 kB. *No se estima lo que pesará: se usa lo que ya pesa.*
 *
 * ── RESIDUO ────────────────────────────────────────────────────────────────
 * Todo lo que sube se borra al final y se verifica que el bucket quedó como
 * estaba. Un instrumento que deja basura en un bucket de producción es peor que
 * no medir.
 */

import { readFileSync } from 'node:fs';
import { tokenDe, linea, guardarPerf, RAIZ, URL as SUPA, ANON, r1, percentil } from './lib-perf.mjs';

const env = readFileSync(`${RAIZ}/apps/prestador/.env.local`, 'utf8');
const MAIL = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const PW = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();
const BUCKET = 'prestador-galeria';

const token = await tokenDe(MAIL, PW);
/* ⚠️ LA CARPETA PROPIA NO ES UN DETALLE DEL INSTRUMENTO: es la cura de S92-BIS.
   La primera corrida escribió en la raíz del bucket y Storage la rebotó con
   `new row violates row-level security policy`. **El rebote es la policy
   haciendo su trabajo** —cualquiera con una cuenta podía subir a la carpeta de
   otro hasta que se cerró—, así que el instrumento se adapta a la regla y no al
   revés. El uid sale del propio token, sin imprimirlo (R6). */
const uid = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8')).sub;

/** Un JPEG mínimo VÁLIDO seguido de relleno: el bucket filtra por mime y una
 *  cabecera falsa lo rebotaría — el rebote se leería como «la red anduvo mal». */
const CABECERA_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const cuerpoDe = (bytes) => Buffer.concat([CABECERA_JPEG, Buffer.alloc(Math.max(0, bytes - CABECERA_JPEG.length), 0x20)]);

async function subir(path, cuerpo) {
  const t0 = performance.now();
  const r = await fetch(`${SUPA}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' },
    body: cuerpo,
  });
  const ms = performance.now() - t0;
  if (r.status >= 400) throw new Error(`subida ${path} rebotó ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return ms;
}

async function borrar(path) {
  await fetch(`${SUPA}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'DELETE',
    headers: { apikey: ANON, Authorization: `Bearer ${token}` },
  });
}

const CASOS = [
  ['ANTES · peor caso real del bucket', 5.9 * 1024 * 1024],
  ['ANTES · mediana medida del bucket', 474 * 1024],
  ['DESPUÉS · la comparable ya subida a 1600 px', 204 * 1024],
];

linea('\n══════════════════════════════════════════════════════════════');
linea('  D-734 · EL COSTO DE SUBIR — antes y después');
linea('══════════════════════════════════════════════════════════════\n');
linea('   medido contra el Storage del proyecto vivo, desde esta máquina');
linea('   (los segundos son de acá; lo que vale para el aparato es la RAZÓN)\n');

const salida = [];
const subidos = [];
for (const [rotulo, bytes] of CASOS) {
  const cuerpo = cuerpoDe(bytes);
  const serie = [];
  for (let i = 0; i < 5; i++) {
    const path = `${uid}/d734-medicion/${rotulo.startsWith('ANTES') ? 'antes' : 'despues'}-${Math.round(bytes)}-${i}.jpg`;
    serie.push(await subir(path, cuerpo));
    subidos.push(path);
  }
  const p50 = percentil(serie, 50);
  salida.push({ rotulo, kB: Math.round(bytes / 1024), p50, serie: serie.map((x) => Math.round(x)) });
  linea(`   ${String(Math.round(bytes / 1024)).padStart(5)} kB · p50 ${String(r1(p50)).padStart(7)} ms   ${rotulo}`);
}

const peor = salida[0];
const mediana = salida[1];
const despues = salida[2];

linea('');
linea(`   ⇒ La foto MEDIANA de hoy tarda ${r1(mediana.p50 / despues.p50)}× lo que va a tardar curada.`);
linea(`   ⇒ La PEOR de hoy (5,9 MB) tarda ${r1(peor.p50 / despues.p50)}× — de ${r1(peor.p50 / 1000)} s a ${r1(despues.p50 / 1000)} s.`);
linea('');
linea('   ⚠️ En una red móvil los dos números suben, y la diferencia también:');
linea('     es el mismo cuello —bytes por el cable— con menos ancho. *Por eso');
linea('     la razón viaja al aparato aunque los segundos no.*');

// ── RESIDUO ────────────────────────────────────────────────────────────────
for (const p of subidos) await borrar(p);
const listado = await fetch(`${SUPA}/storage/v1/object/list/${BUCKET}`, {
  method: 'POST',
  headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: `${uid}/d734-medicion`, limit: 100 }),
});
const quedan = JSON.parse(await listado.text());
linea(`\n   residuo del instrumento: ${Array.isArray(quedan) ? quedan.length : '?'} ${Array.isArray(quedan) && quedan.length === 0 ? '✅' : '🔴'}`);

guardarPerf('c2-subida.json', salida);
linea('   ── guardado en scripts/perf/salida/c2-subida.json\n');
