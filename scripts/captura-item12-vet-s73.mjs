// S73-A ítem 12 (M3) — el QUÉ vet en las DOS disposiciones legales para el
// gate del founder (grilla = la cura propuesta · tira = la alternativa).
// Uso: node scripts/captura-item12-vet-s73.mjs grilla|tira
// (el flip de disposicion lo hace el operador editando el archivo; este
// script solo captura el estado vigente — cero escritura).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variante = process.argv[2] ?? 'grilla';
const BASE = process.env.BASE ?? 'http://localhost:8081';
const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 240000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(6000);

await page.goto(`${BASE}/explorar/veterinaria`, { waitUntil: 'networkidle', timeout: 120000 });
// Zeus es N=1 en la familia demo: auto-elegido; la oferta carga después.
// el demo persiste idioma=en (D-316, S71): matchear ambas voces
await page.getByText(/¿Qué necesita\?|What do they need\?/).waitFor({ timeout: 90000 });
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('#error-toast')?.remove()).catch(() => {});
const ruta = `scripts/capturas/s73-a-item12-vet-que-${variante}.png`;
await page.screenshot({ path: ruta, fullPage: false });
console.log(`captura → ${ruta}`);
await browser.close();
