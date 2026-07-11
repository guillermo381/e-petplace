// Ficha v2 en contexto (S52-P3): nombre preside, voz sin sujeto.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const S = process.env.SCRATCH ?? '/tmp';
let fallos = 0;
const check = (c, n) => { console.log(`${c ? '✓' : '✗ FALTA'} ${n}`); if (!c) fallos++; };

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
let t = '';
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  t = await page.evaluate(() => document.body.innerText);
  if (t.includes('Está al día.')) break;
}
check(t.includes('Está al día.'), 'Ficha v2: voz SIN sujeto ("Está al día.")');
check(!t.includes('Zeus está al día'), 'Ficha v2: la voz vieja con nombre NO aparece');
await page.waitForTimeout(1000);
await page.screenshot({ path: `${S}/s52-ficha-v2.png` });
await ctx.close();
await browser.close();
console.log(fallos === 0 ? '\nFICHA V2: 0 fallos' : `\nFALLOS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
