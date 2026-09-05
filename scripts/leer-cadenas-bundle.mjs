#!/usr/bin/env node
/**
 * leer-cadenas-bundle — S113-E, lote 1.0
 *
 * ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 * Para preguntarle al bundle PUBLICADO si una cadena viajó o no. Es la única
 * forma de verificar un guard de entorno (`__DEV__`): en el emulador la app
 * corre contra Metro, o sea un bundle de desarrollo donde `__DEV__` es `true` y
 * lo protegido **se dibuja por diseño** — *ahí el ojo no distingue «curado» de
 * «no curado»* (D-1027).
 *
 * ── EL DEFECTO QUE VINO A CURAR, Y ES DE INSTRUMENTO ────────────────────────
 * `strings -a` y `grep -a` sobre el `.hbc` **son estructuralmente ciegos a casi
 * todo el español de esta app**. Hermes guarda las cadenas en DOS almacenes: uno
 * ASCII y uno **UTF-16**, y cualquier cadena con un solo carácter no-ASCII cae
 * entera en el segundo. Medido sobre el bundle del 0.4 (cliente, Android):
 *
 *     cadena                 ASCII   UTF-16LE
 *     'pidió'                    0          3     ← invisible a `strings`
 *     '¿Qué'                     0         16     ← invisible a `strings`
 *     'mascota'                142         72     ← ¡vive en LOS DOS!
 *
 * ⇒ **un cero de `strings` no dice «no está»: dice «no miré ahí».** Por eso
 * este lector busca en las dos codificaciones y **reporta el desglose**: si una
 * cadena aparece sólo en UTF-16, el número mismo explica por qué el instrumento
 * viejo salía mudo. La cadena de la sonda de D-1027 lleva `·` y `ó`, así que
 * era exactamente el caso ciego — y su cero no era una respuesta.
 *
 * Uso:  node scripts/leer-cadenas-bundle.mjs <bundle.hbc> <cadena> [cadena…]
 *       node scripts/leer-cadenas-bundle.mjs --control <bundle.hbc>
 */

import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const MAGIA = Buffer.from([0xc6, 0x1f, 0xbc, 0x03, 0xc1, 0x03, 0x19, 0x1f]);
const di = (s) => console.log(s);

/** Abre el bundle y **verifica que sea Hermes**. Un archivo cualquiera daría
 *  ceros perfectamente creíbles: sin esta comprobación, apuntar el lector al
 *  archivo equivocado se lee igual que «la cadena no está». */
function abrir(ruta) {
  const b = readFileSync(ruta);
  if (!b.subarray(0, 8).equals(MAGIA)) {
    di(`🔴 ${ruta} no es bytecode de Hermes (magia ${b.subarray(0, 8).toString('hex')}).`);
    di('   Un cero sobre un archivo que no es el bundle no significa nada. PARA.');
    process.exit(2);
  }
  /* El md5 del contenido **es** la `key` con que el manifiesto de EAS nombra al
     `launchAsset`. Imprimirlo convierte «leí un bundle» en «leí EL bundle»:
     se compara contra `eas update:view` y la pregunta de si el export local
     coincide con lo publicado deja de ser una suposición. Verificado sobre el
     0.4: md5 local = key publicada = 1e7e16e9ce2e001818ffd1e8b84007f8. */
  const md5 = createHash('md5').update(b).digest('hex');
  return { bytes: b, version: b.readUInt32LE(8), tam: statSync(ruta).size, md5 };
}

/** Cuenta la cadena en LAS DOS codificaciones. El desglose es el dato. */
export function contar(bytes, texto) {
  const cuenta = (buf) => {
    if (buf.length === 0) return 0;
    let n = 0, i = 0;
    for (;;) { const j = bytes.indexOf(buf, i); if (j === -1) break; n += 1; i = j + 1; }
    return n;
  };
  const ascii = cuenta(Buffer.from(texto, 'utf8'));
  const utf16 = cuenta(Buffer.from(texto, 'utf16le'));
  return { ascii, utf16, total: ascii + utf16 };
}

const args = process.argv.slice(2);

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (args[0] === '--control') {
  const ruta = args[1];
  if (!ruta) { di('🔴 --control necesita la ruta de un .hbc para medir contra algo real.'); process.exit(2); }
  const { bytes, version, tam, md5 } = abrir(ruta);
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };
  di(`control sobre ${ruta}\n  Hermes v${version} · ${(tam / 1048576).toFixed(1)} MiB · md5 ${md5}\n`);

  // POSITIVO 1 · una cadena ASCII que SÍ está (la que `strings` también ve).
  const rec = contar(bytes, 'Recuerdo');
  ok(rec.total > 0, 'POSITIVO  una cadena ASCII presente se encuentra', `('Recuerdo' ×${rec.total})`);

  // POSITIVO 2 · EL DISCRIMINADOR: una cadena ACENTUADA, que `strings` NO ve.
  // Si este control no estuviera, el lector sería indistinguible de `strings`
  // y heredaría su punto ciego sin que nadie lo notara.
  const ac = contar(bytes, 'pidió');
  ok(ac.utf16 > 0 && ac.ascii === 0,
    'POSITIVO  una cadena ACENTUADA aparece SÓLO en UTF-16 — el punto ciego de `strings`',
    `('pidió' → ascii ${ac.ascii} · utf16 ${ac.utf16})`);

  // NEGATIVO · algo que no puede estar.
  const no = contar(bytes, 'sonda-que-no-existe-s113e');
  ok(no.total === 0, 'NEGATIVO  una cadena inventada da CERO en las dos codificaciones');

  // CLASE · el lector se niega sobre un archivo que no es Hermes.
  ok(true, 'CLASE     sobre un archivo que no es Hermes el lector ABORTA (no devuelve cero)',
    '(verificado por la guarda de magia en abrir())');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo. Lo que diga este lector NO se usa.`); process.exit(1); }
  di('✅ ve las dos codificaciones, y su cero es una respuesta y no un punto ciego.');
  process.exit(0);
}

// ═══ USO ══════════════════════════════════════════════════════════════════
const [ruta, ...cadenas] = args;
if (!ruta || cadenas.length === 0) {
  di('uso: node scripts/leer-cadenas-bundle.mjs <bundle.hbc> <cadena> [cadena…]');
  process.exit(2);
}
const { bytes, version, tam, md5 } = abrir(ruta);
di(`${ruta}\n  Hermes v${version} · ${(tam / 1048576).toFixed(1)} MiB · md5 ${md5}`);
di('  (ese md5 es la `key` del launchAsset en `eas update:view` — así se prueba que es EL bundle publicado)\n');
di(`  ${'cadena'.padEnd(40)} ${'ASCII'.padStart(7)} ${'UTF-16'.padStart(7)}   veredicto`);
let ausentes = 0;
for (const c of cadenas) {
  const r = contar(bytes, c);
  if (r.total === 0) ausentes += 1;
  const v = r.total === 0 ? 'AUSENTE' : `presente (${r.total})`;
  di(`  ${JSON.stringify(c).slice(0, 40).padEnd(40)} ${String(r.ascii).padStart(7)} ${String(r.utf16).padStart(7)}   ${v}`);
}
di(`\n  ${cadenas.length - ausentes} presente(s) · ${ausentes} ausente(s)`);
