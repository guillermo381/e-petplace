/**
 * captura-s89b-gate-campana.mjs — capturas del PAQUETE DEL GATE ÚNICO
 * (S89-B ②): la sección Badge/campana de la galería — el estudio 10/12/14,
 * el par del defecto huella-invisible-en-muro, y el estudio del ORO — en
 * los tres temas. Server: expo web del prestador en :8081 (/gallery).
 * Salida: scripts/capturas/s89-b-gate-campana/.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const DIR = new URL('./capturas/s89-b-gate-campana/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1600 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

// La galería del prestador vive detrás del login (auth real, D-290):
// sesión demo por UI, patrón captura-s73b. La clave viaja por env —
// jamás hardcodeada en un script commiteado.
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill('demo-prestador@epetplace.dev');
await page.locator('input[type="password"]').fill(process.env.DEMO_PRESTADOR_PASSWORD ?? '');
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(6000);

await page.goto('http://localhost:8081/gallery', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(4000);

for (const tema of ['Claro', 'Oscuro', 'Memorial']) {
  await page.getByText(tema, { exact: true }).first().click();
  await page.waitForTimeout(800);
  // ancla: la leyenda del estudio del oro (única en la página)
  const ancla = page.getByText('estudio del ORO #FCBC1D', { exact: false }).first();
  await ancla.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // subir un poco para que entren el par del defecto y el 10/12/14
  await page.mouse.wheel(0, -700);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}seccion-campana-${tema.toLowerCase()}.png`, fullPage: false });
  console.log(`✓ ${tema} → seccion-campana-${tema.toLowerCase()}.png`);
}
console.log(`errores JS: ${errores.length === 0 ? 'ninguno' : errores.slice(0, 3).join(' | ')}`);
await browser.close();
