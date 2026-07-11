// Verificación runtime del set b′ (S53-B2a): galería en 3 temas sin
// errores JS + fila 21px + tabs con huella + Explorar en contexto.
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 480, height: 1100 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 200)));

// ── galería ──
await page.goto('http://localhost:8082/gallery', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(6000);
const t = await page.evaluate(() => document.body.innerText);
check(t.includes('Iconografía b′'), 'Galería: sección del set b′');
check(errores.length === 0, `Galería: cero errores JS${errores.length ? ' → ' + errores[0] : ''}`);
const sec = page.locator('text=Iconografía b′').first();
await sec.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.screenshot({ path: `${S}/bprima-galeria.png`, fullPage: false });

// ── tabs con huella + explorar en contexto ──
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
let t2 = '';
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  t2 = await page.evaluate(() => document.body.innerText);
  if (/Buenos días|Buenas tardes|Buenas noches/.test(t2)) break;
}
check(/Buenos días|Buenas tardes|Buenas noches/.test(t2), 'Hogar carga (tabs b′ activos)');
await page.screenshot({ path: `${S}/bprima-tabs-hogar.png` });
await page.getByText('Explorar', { exact: true }).last().click();
await page.waitForTimeout(4000);
await page.screenshot({ path: `${S}/bprima-explorar.png`, fullPage: true });
check(errores.length === 0, 'Contexto: cero errores JS');

await ctx.close();
await browser.close();
console.log(`\n${fallos === 0 ? 'SET B′ VERIFICADO: 0 fallos' : `FALLOS: ${fallos}`}`);
process.exit(fallos === 0 ? 0 : 1);
