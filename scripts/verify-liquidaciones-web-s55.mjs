// Verificación runtime web S55-B (B1): Negocio → Celda Liquidaciones
// navegable → vista /liquidaciones en peldaño 0 (ledger vacío HOY —
// invitación que educa, JAMÁS $0). Con la cuenta demo ACTIVA no debe
// aparecer el paso de cuenta comercial. Dev server prestador en :8081.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const S = process.env.SCRATCH ?? '/tmp';
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);

// ── login real (D-290) ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
let t = await texto();
for (let i = 0; i < 30 && !t.includes('Contraseña'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
for (let i = 0; i < 30 && !t.includes('Tu jornada de hoy'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}

// ── NEGOCIO: la Celda de Liquidaciones ahora NAVEGA ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
t = await texto();
for (let i = 0; i < 30 && !t.includes('Cobros'); i++) {
  await page.waitForTimeout(1000);
  t = await texto();
}
check(t.includes('Liquidaciones'), 'Negocio: Celda Liquidaciones presente');
await page.getByText('Liquidaciones', { exact: true }).first().click();
for (let i = 0; i < 20 && !(await texto()).includes('Acá vas a ver lo que cobras'); i++) {
  await page.waitForTimeout(1000);
}
t = await texto();
check(t.includes('Acá vas a ver lo que cobras'), 'Vista: peldaño 0 — invitación que educa');
check(t.includes('Tus cobros se agrupan en liquidaciones: una transferencia con el total.'), 'Vista: la educación explica cómo llega la plata, COMPLETA (sin truncar)');
check(!t.includes('$0'), 'Vista: JAMÁS $0');
check(!t.includes('Mi cuenta comercial'), 'Vista: cuenta demo ACTIVA → sin paso de cuenta (CTA ausente)');
check(!t.includes('Esperando liquidación'), 'Vista: sin eventos no hay sección de espera (silencio digno)');
await page.screenshot({ path: `${S}/s55-liquidaciones-p0.png`, fullPage: true });

// ── back: vuelve a Negocio ──
await page.getByRole('button', { name: 'Volver' }).first().click().catch(() => page.goBack());
await page.waitForTimeout(1500);
t = await texto();
check(t.includes('Cobros'), 'Back: vuelve a Negocio');

// ── riel en: la vista habla inglés ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
for (let i = 0; i < 20 && !(await texto()).includes('English'); i++) {
  await page.waitForTimeout(1000);
}
await page.getByText('English', { exact: true }).click();
await page.waitForTimeout(1500);
await page.goto('http://localhost:8081/liquidaciones', { waitUntil: 'networkidle', timeout: 60000 });
for (let i = 0; i < 20 && !(await texto()).includes("This is where you'll see what you earn"); i++) {
  await page.waitForTimeout(1000);
}
t = await texto();
check(t.includes("This is where you'll see what you earn"), 'Riel: peldaño 0 en inglés');
check(t.includes('Payouts'), 'Riel: título Payouts');
await page.screenshot({ path: `${S}/s55-liquidaciones-en.png`, fullPage: true });

// volver a español (higiene del estado compartido del dispositivo demo)
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
for (let i = 0; i < 20 && !(await texto()).includes('Español'); i++) {
  await page.waitForTimeout(1000);
}
await page.getByText('Español', { exact: true }).click();
await page.waitForTimeout(1000);

await browser.close();
console.log(fallos === 0 ? '\nRUNTIME WEB OK' : `\n${fallos} CHECK(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
