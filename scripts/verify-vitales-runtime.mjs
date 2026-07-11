// Runtime S53-B2c: el dashboard Vitales de Zeus (tracks REALES) + los
// índices educativos con guijarro + la Hoja que educa y acciona.
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 950 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
let t = '';
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  t = await texto();
  if (t.includes('Zeus')) break;
}
await page.getByText('Zeus', { exact: true }).first().click();
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(1000);
  t = await texto();
  if (t.includes('Vitales')) break;
}
check(t.includes('Vitales'), 'Módulo Vitales presente');
check(/\d+\.\d km/.test(t), `Tiles REALES: km de los tracks (${(t.match(/[\d.]+ km/) ?? ['?'])[0]})`);
check(/\d+ min/.test(t), 'Tiles REALES: minutos');
check(!t.includes('Esta semana caminó más'), 'Comparativa AUSENTE (semana anterior sin datos — L-139)');
check(t.includes('Índice de salud') && t.includes('Descanso y actividad'), 'Índices educativos visibles');
check(t.includes('Se construye con su expediente'), 'Estado honesto de los índices');
check(!/Índice de salud[\s\S]{0,80}\d/.test(t.slice(t.indexOf('Índice de salud'), t.indexOf('Índice de salud') + 90)), 'Índices SIN números inventados');
const seccion = page.locator('text=Vitales').first();
await seccion.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.screenshot({ path: `${S}/vitales-zeus.png`, fullPage: true });

// Hoja educativa: QUÉ + DE QUÉ + acción real
await page.getByText('Índice de salud', { exact: true }).first().click();
await page.waitForTimeout(1500);
t = await texto();
check(t.includes('Se alimenta de su carnet'), 'Hoja educa: DE QUÉ se alimenta');
check(t.includes('Cargar su carnet'), 'Hoja termina en acción real (cargar carnet)');
await page.screenshot({ path: `${S}/vitales-hoja-educativa.png` });

await ctx.close();
await browser.close();
console.log(`\n${fallos === 0 ? 'VITALES RUNTIME: 0 fallos' : `FALLOS: ${fallos}`}`);
process.exit(fallos === 0 ? 0 : 1);
