// S79-B T3 · M3 — capturas: la sede en el perfil (Places VIVO) + la sala
// de espera por URL directa. Server del prestador en 8087.
//   node scripts/captura-s79b-t3.mjs
// NO se elige ninguna predicción ni se toca el radio: eso ESCRIBIRÍA
// sobre la fila real del demo — las capturas muestran estados, no mutan.
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

// la bienvenida puede interceptar (contexto fresco): se pasa por su CTA
try {
  await page.getByText('Entrar a mi espacio', { exact: true }).waitFor({ timeout: 30000 });
  await page.getByText('Entrar a mi espacio', { exact: true }).click();
} catch {
  // marca ya presente: siguió directo a las tabs
}
await page.getByText(/Hola/, { exact: false }).first().waitFor({ timeout: 120000 });

// ── el perfil → Dónde atiendes, con predicciones vivas ──
await page.getByText('Cuenta', { exact: true }).click();
await page.getByText('Tu perfil', { exact: true }).click();
await page.getByText('Dónde atiendes', { exact: true }).waitFor({ timeout: 60000 });
await page.getByText('Dónde atiendes', { exact: true }).scrollIntoViewIfNeeded();
const campo = page.getByLabel('Dirección').or(page.getByPlaceholder('ej: Av. de los Shyris 1234'));
await campo.first().fill('Av. de los Shyris 12');
await page.waitForTimeout(2500);
await page.screenshot({ path: 'scripts/capturas/s79b-t3-perfil-sede.png' });
console.log('captura → s79b-t3-perfil-sede.png');

// ── la sala de espera, por URL directa ──
await page.goto(`${BASE}/sala-espera`, { waitUntil: 'networkidle', timeout: 120000 });
await page.getByText('Qué falta de tu parte', { exact: true }).waitFor({ timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scripts/capturas/s79b-t3-sala-espera.png' });
console.log('captura → s79b-t3-sala-espera.png');

await browser.close();
