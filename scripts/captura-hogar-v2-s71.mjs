// S71-A3 M3 — captura del Hogar v2 (procedencia B1: render web 420×900,
// sesión demo por login de UI, patrón S54/S55). Uso:
//   node scripts/captura-hogar-v2-s71.mjs <sufijo>
// El estado de la DB lo prepara/limpia quien invoca — este script SOLO
// loguea, espera el Hogar y captura.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const sufijo = process.argv[2] ?? 'estado';
const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

// 8085: el 8082 del patrón S55 lo ocupa el server del prestador (B, en vuelo)
await page.goto('http://localhost:8085/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();

// el Hogar cargó cuando la ficha de Zeus está en pantalla
await page.getByText('Zeus', { exact: true }).first().waitFor({ timeout: 120000 });
// aire para el resto de los fetches paralelos (Ponte al día, rail, timeline)
await page.waitForTimeout(4000);

const ruta = `scripts/capturas/s71-a3-hogar-v2-${sufijo}.png`;
await page.screenshot({ path: ruta, fullPage: false });
console.log(`captura → ${ruta}`);
await browser.close();
