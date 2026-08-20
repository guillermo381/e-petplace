// ═══════════════════════════════════════════════════════════════════════════
// apps/pagos-web · BUILD — inyecta la CONFIG PÚBLICA y nada más.
//
// 🔴 POR QUÉ EXISTE ESTE ARCHIVO Y NO UN HTML CON LOS VALORES ADENTRO:
//    el juego CLIENT del SDK es **publicable por diseño** (viaja al navegador
//    en todo SDK de pagos: por eso existe separado del SERVER, que firma los
//    cobros y jamás sale del servidor). Pero *«publicable» no es «va
//    commiteada»*: lo primero es del navegador, lo segundo es del repo, y son
//    cosas distintas. Los valores entran acá desde las variables de entorno
//    del proyecto de Vercel.
//
// 🔴 LO QUE ESTE BUILD NO PUEDE HACER NUNCA: tocar una credencial SERVER.
//    `NUVEI_APP_KEY_SERVER` firma cobros. Si alguna vez aparece en este
//    archivo o en el HTML, el cobro entero queda a merced de cualquiera que
//    abra el inspector.
// ═══════════════════════════════════════════════════════════════════════════

import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DIST = new URL('./dist/', import.meta.url);
const SRC = new URL('./src/', import.meta.url);

/** Fail-closed: una página de pago servida con config incompleta se ve bien y
 *  no funciona. **Mejor que el build falle acá y a la vista.** */
function exigir(nombre) {
  const v = process.env[nombre];
  if (!v || !v.trim()) {
    console.error(
      `\n🔴 FALTA LA VARIABLE ${nombre}.\n` +
      `   Esta página no se publica a medias: una página de pago con config\n` +
      `   incompleta se ve bien y no cobra. Cargala en el proyecto de Vercel\n` +
      `   (Settings → Environment Variables) y volvé a desplegar.\n`);
    process.exit(1);
  }
  return v.trim();
}

function opcional(nombre, porDefecto) {
  const v = process.env[nombre];
  return v && v.trim() ? v.trim() : porDefecto;
}

// ── Config PÚBLICA del SDK. Nada de esto es un secreto de servidor. ─────────
const APP_CODE = exigir('NUVEI_APP_CODE_CLIENT');
const APP_KEY = exigir('NUVEI_APP_KEY_CLIENT');
const API_ALTA = exigir('PAGOS_API_ALTA');       // endpoint propio que persiste
const MODO = opcional('PAGOS_MODO', 'stg');      // 'stg' | 'prod' — PRIMER arg de Payment.init

// URLs del SDK: medidas del repo oficial, pero salen de env para poder
// corregirlas sin tocar el archivo si la doc cambia (⚠️ NUVEI_SDK_URL sigue
// SIN medir contra la doc — declarado en el censo de S101-B §4).
const SDK_JS = opcional('NUVEI_SDK_JS', 'https://cdn.paymentez.com/ccapi/sdk/payment_stable.min.js');
const SDK_CSS = opcional('NUVEI_SDK_CSS', 'https://cdn.paymentez.com/ccapi/sdk/payment_stable.min.css');
const JQUERY = opcional('JQUERY_URL', 'https://code.jquery.com/jquery-3.7.1.min.js');

// 🔴 LISTA BLANCA DE RETORNO. Un `volver` libre convertiría esta página en un
//    redirector abierto: alguien mandaría a la familia a un sitio ajeno desde
//    un dominio nuestro, justo después de tipear una tarjeta.
const ESQUEMAS_VOLVER = opcional('PAGOS_ESQUEMAS_VOLVER', 'cliente://')
  .split(',').map((s) => s.trim()).filter(Boolean);

// Correo con el que se da de alta la tarjeta ante el proveedor. NO es el
// correo de la familia: el proveedor lo pide, y no hay razón para entregarle
// el de la persona cuando el vínculo real lo lleva el handle del alta.
const EMAIL_ALTA = opcional('PAGOS_EMAIL_ALTA', 'altas@epetplace.com');

if (MODO !== 'stg' && MODO !== 'prod') {
  console.error(`\n🔴 PAGOS_MODO inválido: ${MODO}. Solo 'stg' o 'prod'.\n`);
  process.exit(1);
}

await mkdir(DIST, { recursive: true });

// ── index.html con las URLs del SDK sustituidas ────────────────────────────
let html = await readFile(new URL('index.html', SRC), 'utf8');
html = html
  .replaceAll('__SDK_CSS__', SDK_CSS)
  .replaceAll('__SDK_JS__', SDK_JS)
  .replaceAll('__JQUERY__', JQUERY);

if (html.includes('__')) {
  const resto = html.match(/__[A-Z_]+__/g);
  if (resto) {
    console.error(`\n🔴 Quedaron placeholders sin sustituir: ${resto.join(', ')}\n`);
    process.exit(1);
  }
}

await writeFile(new URL('index.html', DIST), html, 'utf8');

// ── config.js — la config pública, generada, JAMÁS commiteada ──────────────
const config =
  `/* GENERADO POR build.mjs — no editar, no commitear.\n` +
  `   Config PÚBLICA del SDK. Ninguna credencial SERVER puede vivir acá. */\n` +
  `var CONFIG = ${JSON.stringify({
    MODO,
    APP_CODE,
    APP_KEY,
    API_ALTA,
    EMAIL_ALTA,
    ESQUEMAS_VOLVER,
  }, null, 2)};\n`;

await writeFile(new URL('config.js', DIST), config, 'utf8');

// Cinturón: si alguna vez una clave SERVER se cuela al bundle, el build muere.
const bundle = html + config;
for (const prohibido of ['APP_KEY_SERVER', 'SERVICE_ROLE', 'ARNES_SECRET', 'service_role']) {
  if (bundle.includes(prohibido)) {
    console.error(`\n🔴 ABORTA: el bundle contiene «${prohibido}». Una credencial de servidor no se publica.\n`);
    process.exit(1);
  }
}

if (existsSync(new URL('public/', SRC))) {
  await cp(new URL('public/', SRC), DIST, { recursive: true });
}

console.log(`✓ pagos-web construida · modo=${MODO} · retorno=${ESQUEMAS_VOLVER.join(' ')}`);
