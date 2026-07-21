// S73-A M3 — capturas de la LÁMINA S73 (galería, render web 820 de ancho
// para paneles 2-up; patrón captura-s73b). Uso: node scripts/captura-lamina-s73.mjs
// SOLO lectura de UI (la galería no toca DB).
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:8081';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
// viewport ALTO: los paneles bajo el fold no pintaban y la variante B
// salía cortada con cola en blanco (hallazgo de la 1ª corrida).
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 820, height: 4200 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle', timeout: 240000 });
await page.getByText('LÁMINA S73', { exact: false }).first().waitFor({ timeout: 120000 });
await page.waitForTimeout(2500); // fuentes + SVGs

// el toast dev de RN-web (clase D-311, "<button> cannot contain...") se
// cuela en la captura — solo-dev, no viaja en el bundle release del OTA.
await page.locator('#error-toast [aria-label], #error-toast button').first().click({ timeout: 3000 }).catch(() => {});
await page.evaluate(() => document.querySelector('#error-toast')?.remove()).catch(() => {});

for (const [tid, nombre] of [
  ['lamina-s73-hoja1', 's73-a-lamina-hoja1-anatomia'],
  ['lamina-s73-hoja2', 's73-a-lamina-hoja2-selector'],
  ['lamina-s73-hoja3', 's73-a-lamina-hoja3-n1'],
]) {
  const el = page.getByTestId(tid);
  await el.waitFor({ timeout: 60000 });
  await el.screenshot({ path: `scripts/capturas/${nombre}.png` });
  console.log(`captura → scripts/capturas/${nombre}.png`);
}

await browser.close();
console.log('LISTO');
