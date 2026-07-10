// Verificación rápida (cierre S51): el Perfil vive en el stack del
// Hogar — tabs visibles en el perfil y back natural al Home.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
let fallos = 0;
const check = (c, n) => {
  console.log(`${c ? '✓' : '✗ FALTA'} ${n}`);
  if (!c) fallos++;
};

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
let t = '';
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  t = await texto();
  if (t.includes('Tu hogar')) break;
}
check(t.includes('Tu hogar'), 'Hogar carga en /hogar (stack index)');

await page.getByText('Zeus', { exact: true }).first().click();
await page.waitForTimeout(5000);
t = await texto();
check(/hogar\/mascota/.test(page.url()), `URL anidada: ${page.url().slice(-30)}`);
check(t.includes('SALUD') || t.includes('Salud'), 'Perfil renderiza (módulo Salud)');
check(t.includes('Explorar') && t.includes('Cuenta'), 'TABS VISIBLES en el perfil');
await page.screenshot({ path: `${process.env.SCRATCH}/perfil-en-stack.png`, fullPage: false });

await page.goBack();
await page.waitForTimeout(2500);
t = await texto();
check(t.includes('Tu hogar'), 'Back natural → vuelve al Home');

await ctx.close();
await browser.close();
console.log(fallos === 0 ? '\nPERFIL EN STACK: 0 fallos' : `\nFALLOS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
