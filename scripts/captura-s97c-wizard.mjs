/**
 * captura-s97c-wizard.mjs — LOTE 1 de S97-C: el wizard de alta, paso por
 * paso, con la escala tipográfica NUEVA (b365705f: sm 14 · base 16 · md 20).
 *
 * Server: expo web del prestador en :8081. Ruta: /verificacion/alta
 * (RUTA DE VERIFICACIÓN — no vive en la navegación del producto).
 * Salida: scripts/capturas/s97-c-wizard/.
 *
 * La credencial sale de apps/prestador/.env.local (gitignored) — JAMÁS
 * hardcodeada en un script commiteado (R6).
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s97-c-wizard/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const env = readFileSync(
  new URL('../apps/prestador/.env.local', import.meta.url).pathname,
  'utf8',
);
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = leer('EXPO_PUBLIC_DEMO_PASSWORD');
if (!EMAIL || !PASS) {
  console.error('✗ faltan credenciales demo en apps/prestador/.env.local');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1400 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

async function foto(nombre) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${DIR}${nombre}.png`, fullPage: false });
  console.log(`✓ ${nombre}.png`);
}

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(7000);

await page.goto('http://localhost:8081/verificacion/alta', {
  waitUntil: 'networkidle',
  timeout: 180000,
});
await page.waitForTimeout(4000);

// ① TU NEGOCIO — el único paso que no se saltea
await foto('paso1-tu-negocio');

// ② QUÉ OFRECÉS — los toggles + «Tu tienda» que propone
await page.getByText('Continuar', { exact: true }).first().click();
await foto('paso2-que-ofreces');

// la Hoja del salteo — LA FIRMA de la pantalla
await page.getByText('Saltar por ahora', { exact: true }).first().click();
await foto('paso2-salteo-la-firma');
await page.getByText('Entendido', { exact: true }).first().click();
await page.waitForTimeout(2500);

// ③ TUS DOCUMENTOS
await foto('paso3-tus-documentos');

// ④ TU EQUIPO
await page.getByText('Continuar', { exact: true }).first().click();
await foto('paso4-tu-equipo');

console.log(`errores JS: ${errores.length === 0 ? 'ninguno' : errores.slice(0, 3).join(' | ')}`);
await browser.close();
