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
  console.error('✗ ABORTA: la sesión NO abrió — no se saca ninguna foto.');
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
await claro.ctx.close();

const oscuro = await abrir('dark');
if (oscuro.dentro) {
  await oscuro.page.screenshot({ path: `${DIR}02-negocio-oscuro${SUFIJO}.png`, fullPage: true });
  console.log(`✓ 02-negocio-oscuro${SUFIJO}.png`);
}
await oscuro.ctx.close();

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`, errores);
  process.exit(1);
}
console.log('✓ sin errores JS');
