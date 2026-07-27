// S79-B T2 · M3 — capturas de la tanda (render web 420×900, login de UI,
// patrón S71/S73). El server del prestador corre en 8087.
//   node scripts/captura-s79b-t2.mjs
// Captura: (1) la bienvenida del Día 1 (el guard redirige solo — contexto
// fresco sin marca), (2) el HOY tras "Entrar a mi espacio", (3) NEGOCIO con
// "Se despierta con el uso", (4) CUENTA con la voz de oficio curada.
// LÍMITE DECLARADO: la cuenta demo NO es virgen → el modo preparación del
// HOY no se puede capturar acá (regla de existencia lo apaga); su gate es
// en dispositivo con la cuenta virgen de la cohorte.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:8087';
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
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

// (1) el guard raíz redirige a la carta (contexto fresco = sin marca)
await page.getByText('Entrar a mi espacio', { exact: true }).waitFor({ timeout: 120000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'scripts/capturas/s79b-t2-bienvenida.png' });
console.log('captura → s79b-t2-bienvenida.png');

// (2) la única acción → el HOY
await page.getByText('Entrar a mi espacio', { exact: true }).click();
await page.getByText(/Hola/, { exact: false }).first().waitFor({ timeout: 120000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: 'scripts/capturas/s79b-t2-hoy.png' });
console.log('captura → s79b-t2-hoy.png');
// el pie (aspiracional §2.5)
await page.mouse.wheel(0, 4000);
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/capturas/s79b-t2-hoy-pie.png' });
console.log('captura → s79b-t2-hoy-pie.png');

// (3) NEGOCIO — la sección nueva al pie
await page.getByText('Negocio', { exact: true }).click();
await page.getByText('Se despierta con el uso', { exact: true }).waitFor({ timeout: 60000 });
await page.getByText('Se despierta con el uso', { exact: true }).scrollIntoViewIfNeeded();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'scripts/capturas/s79b-t2-negocio-despierta.png' });
console.log('captura → s79b-t2-negocio-despierta.png');

// (4) CUENTA — la voz de oficio curada (demo vet: antes MUDA)
await page.getByText('Cuenta', { exact: true }).click();
await page.waitForTimeout(5000);
await page.screenshot({ path: 'scripts/capturas/s79b-t2-cuenta-voz-oficio.png' });
console.log('captura → s79b-t2-cuenta-voz-oficio.png');

await browser.close();
