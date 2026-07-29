#!/usr/bin/env node
/**
 * EL GUARD DE D-574, MECANIZADO (S81 — orden founder: "que la build
 * FALLE, no que avise"). Verifica POR MANIFEST que un APK lleva las
 * meta-datas que sus features exigen — el config plugin las OMITE EN
 * SILENCIO cuando falta el secret (el crash del mapa S80 y el push
 * mudo son la MISMA clase de falla).
 *
 * Uso:  node scripts/verify-manifest-apk.mjs <ruta.apk> --app cliente|prestador
 * Exit: 0 = TODO presente (imprime QUÉ encontró — D-574: la build
 *       declara sus secrets) · !=0 = ALGO falta → LA BUILD NO SE
 *       DISTRIBUYE. L-192: este guard puede salir rojo por diseño;
 *       su prueba de fuego es correrlo contra un archivo inválido.
 *
 * Checks:
 *  1. package del APK == com.epetplace.<app> (el cruce de
 *     google-services silencioso muere acá).
 *  2. meta-data com.google.android.geo.API_KEY presente (el mapa —
 *     ambas apps lo usan).
 *  3. FCM horneado: resource `google_app_id` presente (lo inyecta el
 *     plugin de google-services desde el json) Y un listener de
 *     MESSAGING_EVENT en el manifest (el receptor de push). Sin
 *     cualquiera de los dos, el push muere en silencio.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function aapt2() {
  const raiz = process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk');
  const tools = join(raiz, 'build-tools');
  if (!existsSync(tools)) throw new Error(`build-tools no encontrado en ${tools}`);
  const version = readdirSync(tools).sort().at(-1);
  const bin = join(tools, version, 'aapt2');
  if (!existsSync(bin)) throw new Error(`aapt2 no encontrado en ${bin}`);
  return bin;
}

const apk = process.argv[2];
const appIdx = process.argv.indexOf('--app');
const app = appIdx > -1 ? process.argv[appIdx + 1] : null;
if (!apk || !app || !['cliente', 'prestador'].includes(app)) {
  console.error('uso: verify-manifest-apk.mjs <ruta.apk> --app cliente|prestador');
  process.exit(2);
}
const paqueteEsperado = `com.epetplace.${app}`;

let manifest = '';
let recursos = '';
try {
  const bin = aapt2();
  manifest = execFileSync(bin, ['dump', 'xmltree', '--file', 'AndroidManifest.xml', apk], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  recursos = execFileSync(bin, ['dump', 'resources', apk], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  console.error(`ROJO: no se pudo leer el APK (${e.message.split('\n')[0]})`);
  process.exit(1);
}

const fallas = [];
const encontrados = [];

// 1 · el package (el cruce silencioso de google-services muere acá)
if (manifest.includes(`package="${paqueteEsperado}"`) || manifest.includes(`"${paqueteEsperado}"`)) {
  encontrados.push(`package=${paqueteEsperado}`);
} else {
  fallas.push(`package NO es ${paqueteEsperado}`);
}

// 2 · la key del mapa (la lección S80: el plugin la omite en silencio)
if (manifest.includes('com.google.android.geo.API_KEY')) {
  encontrados.push('meta-data geo.API_KEY');
} else {
  fallas.push('FALTA meta-data com.google.android.geo.API_KEY (el mapa muere nativo, fuera de toda ErrorBoundary)');
}

// 3 · FCM horneado (sin esto el push muere en silencio)
if (recursos.includes('google_app_id')) {
  encontrados.push('resource google_app_id (google-services horneado)');
} else {
  fallas.push('FALTA resource google_app_id — google-services.json NO se horneó');
}
if (manifest.includes('MESSAGING_EVENT')) {
  encontrados.push('listener MESSAGING_EVENT (receptor de push)');
} else {
  fallas.push('FALTA listener de MESSAGING_EVENT — nadie recibe el push');
}

if (fallas.length > 0) {
  console.error(`ROJO — LA BUILD NO SE DISTRIBUYE (D-574):`);
  for (const f of fallas) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`VERDE — la build declara sus secrets (D-574):`);
for (const e of encontrados) console.log(`  ✓ ${e}`);
