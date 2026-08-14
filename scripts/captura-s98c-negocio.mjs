/**
 * captura-s98c-negocio.mjs — EL NEGOCIO RECONSTRUIDO (S98-C).
 *
 * Firma del founder: *«en mi negocio aún faltan los cambios, a rectángulos
 * y las dos categorías de servicios que hablamos desde el inicio»*.
 *
 * Fotografía: ① la portada con «Tus servicios» en baldosas de dos columnas
 * · ② el mismo tab en oscuro.
 *
 * 🔴 EL GUARD QUE ESTE ARCHIVO NO NEGOCIA — y está acá porque ya costó
 * caro: **si la sesión no abrió, el script ABORTA en vez de sacar la foto.**
 * Un instrumento que fotografía la pantalla de bienvenida e imprime
 * «✓ sin errores JS» no está midiendo nada: está certificando el login
 * fallido. Por eso la comprobación NO es «¿hubo error?» sino «¿llegué a
 * una ruta protegida?».
 *
 * Credenciales: de `apps/prestador/.env.local` (R6 — jamás en el código).
 * Se pueden pisar con CUENTA / CLAVE / SUFIJO.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-negocio/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = process.env.CUENTA || leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE || leer('EXPO_PUBLIC_DEMO_PASSWORD');
const SUFIJO = process.env.SUFIJO ? `-${process.env.SUFIJO}` : '';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errores = [];

async function abrir(tema) {
  const ctx = await browser.newContext({
    locale: 'es-EC',
    viewport: { width: 420, height: 900 },
    colorScheme: tema,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errores.push(`[${tema}] ${e}`));

  await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
  await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByText('Entrar', { exact: true }).click();
  await page.waitForTimeout(9000);

  await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(6000);

  // 🔴 EL DISCRIMINADOR: la pantalla de bienvenida NO tiene el título del
  // tab. Si esto es 0, la sesión no abrió y toda foto de acá es basura.
  const dentro = (await page.getByText('Tu negocio', { exact: false }).count()) > 0;
  return { ctx, page, dentro };
}

const claro = await abrir('light');
if (!claro.dentro) {
  /* El aborto DEJA EVIDENCIA. Sin esto, «no abrió la sesión» es una
     hipótesis: puede ser la clave, puede ser que esta cuenta caiga en otra
     pantalla (un muro, una sala de espera). La foto y el texto lo dicen. */
  await claro.page.screenshot({ path: `${DIR}00-aborto${SUFIJO}.png` });
  const visto = (await claro.page.locator('body').innerText()).slice(0, 300).replace(/\n+/g, ' · ');
  console.error(`✗ ABORTA: no encontré «Tu negocio». La pantalla dice: ${visto}`);
  await browser.close();
  process.exit(1);
}
await claro.page.screenshot({ path: `${DIR}01-negocio-claro${SUFIJO}.png`, fullPage: true });
console.log(`✓ 01-negocio-claro${SUFIJO}.png`);

// Lo que la foto dice en texto — para poder AFIRMAR sin mirar el píxel.
const textos = await claro.page
  .locator('text=/Tus servicios|Tu tienda|Sin configurar|servicios?$|No se pudo leer|Cobros/')
  .allInnerTexts();
console.log('  visible:', JSON.stringify(textos.slice(0, 16)));

/* ── LA HOJA DE V2 — la excepción FIRMADA a la Ley 23 ────────────────────
   Es la única superficie del paquete que el founder firmó sin ver. Una foto
   de la baldosa cerrada no la muestra: hay que TOCARLA. */
const local = claro.page.getByText('Inventario de tu local', { exact: false }).first();
if ((await local.count()) > 0) {
  await local.click();
  await claro.page.waitForTimeout(2500);
  await claro.page.screenshot({ path: `${DIR}04-hoja-v2${SUFIJO}.png` });
  const dice = (await claro.page.getByText('próxima versión', { exact: false }).count()) > 0;
  console.log(
    dice
      ? `✓ 04-hoja-v2${SUFIJO}.png — la Hoja ANUNCIA lo que viene`
      : `✗ 04-hoja-v2${SUFIJO}.png — la Hoja no dijo cuándo llega`,
  );
  if (!dice) process.exitCode = 1;
} else {
  console.log('· sin baldosa de inventario local (tienda ≠ «activa» en esta cuenta)');
}
await claro.ctx.close();

const oscuro = await abrir('dark');
if (oscuro.dentro) {
  await oscuro.page.screenshot({ path: `${DIR}02-negocio-oscuro${SUFIJO}.png`, fullPage: true });
  console.log(`✓ 02-negocio-oscuro${SUFIJO}.png`);
}
await oscuro.ctx.close();

/* 🔴 EL DISCRIMINADOR DE LA PUERTA DE CRECIMIENTO (firma ①(i)).
   La foto sola no prueba nada: un botón que no lleva a ningún lado se ve
   igual que uno que lleva. Acá se TOCA y se verifica que aterriza en el
   paso ② del wizard —donde vive el único productor de la solicitud— y no
   en el ① ni en la nada. */
const puerta = await abrir('light');
if (puerta.dentro) {
  const cta = puerta.page.getByText('Quiero vender productos', { exact: false }).first();
  if ((await cta.count()) > 0) {
    await cta.click();
    await puerta.page.waitForTimeout(6000);
    await puerta.page.screenshot({ path: `${DIR}03-puerta-crecimiento${SUFIJO}.png`, fullPage: true });
    // El paso ② se reconoce por su bajada, que ningún otro paso repite.
    const enPaso2 =
      (await puerta.page.getByText('Prende lo que ya haces hoy', { exact: false }).count()) > 0;
    console.log(
      enPaso2
        ? '✓ la puerta de crecimiento aterriza en el PASO ② (donde vive la solicitud)'
        : '✗ la puerta NO llegó al paso ② — el deep link no rige',
    );
    if (!enPaso2) process.exitCode = 1;
  } else {
    console.log('· sin puerta de crecimiento en esta cuenta (tienda ≠ «ninguna»)');
  }
}
await puerta.ctx.close();

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`, errores);
  process.exit(1);
}
console.log('✓ sin errores JS');
