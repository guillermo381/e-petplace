/**
 * captura-s98b-oficio.mjs — el par que destapó el barrido de las casas de
 * oficio (S98-B, orden del founder: «lo que destape, con captura y par
 * medido»).
 *
 * Fotografía la sección que monta el MISMO par en las dos casas oscuras:
 * prestador 4.40 · cliente 4.83. Verlos juntos es lo que muestra que la
 * diferencia es el TAPIZ y no el token.
 *
 * ⚠️ RN-WEB. El gate en dispositivo no es de esta pista.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const DIR = new URL('./capturas/s98-b-oficio/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const BASE = process.env.BASE ?? 'http://localhost:8083';
const TITULO = 'el par de 4.40 del prestador oscuro';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForTimeout(4500);

const s = page.getByText(TITULO, { exact: false }).first();
if ((await s.count()) === 0) {
  console.error(`✗ no está la sección «${TITULO}» — NO se fotografía (L-192).`);
  await browser.close();
  process.exit(1);
}
await s.scrollIntoViewIfNeeded();
await page.waitForTimeout(1000);
const caja = await s.boundingBox();
await page.screenshot({ path: `${DIR}par-4.40-las-dos-casas.png`, clip: { x: 0, y: Math.max(0, caja.y - 12), width: 420, height: 430 } });
console.log('✓ par-4.40-las-dos-casas.png');
await browser.close();
if (errores.length) { console.error(`✗ ${errores.length} error(es) JS: ${errores[0]}`); process.exit(1); }
console.log('✓ sin errores JS');
