// Verificación runtime del pase de diseño S52 (regla 13): capturas de
// las 5 pantallas + asserts de los gestos clave. Sesión demo real.
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
const check = (c, n) => {
  console.log(`${c ? '✓' : '✗ FALTA'} ${n}`);
  if (!c) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);

// login demo
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
let t = '';
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  t = await texto();
  if (/Buenos días|Buenas tardes|Buenas noches/.test(t)) break;
}
check(/Buenos días|Buenas tardes|Buenas noches/.test(t), 'Hogar: hero compacto con saludo por franja');
check(!t.includes('EN PREPARACIÓN') && !t.includes('SU VIDA'), 'Cero eyebrows uppercase en Hogar');
await page.waitForTimeout(1200); // dejar asentar la entrada escalonada
await page.screenshot({ path: `${S}/s52-hogar.png`, fullPage: true });

// perfil
await page.getByText('Zeus', { exact: true }).first().click();
await page.waitForTimeout(5000);
t = await texto();
check(t.includes('Su vida') && !t.includes('SU VIDA'), 'Perfil: secciones humanizadas');
await page.screenshot({ path: `${S}/s52-perfil.png`, fullPage: true });
await page.goBack();
await page.waitForTimeout(2000);

// explorar
await page.getByText('Explorar', { exact: true }).last().click();
await page.waitForTimeout(4000);
t = await texto();
check(t.includes('Próximamente') && !t.includes('PRÓXIMAMENTE'), 'Explorar: coming soon sereno');
check((t.match(/Próximamente/g) ?? []).length === 1, 'Explorar: UNA sola mención de Próximamente (muro muerto)');
await page.screenshot({ path: `${S}/s52-explorar.png`, fullPage: true });

// cuenta
await page.getByText('Cuenta', { exact: true }).last().click();
await page.waitForTimeout(2500);
t = await texto();
check(t.includes('En preparación') && (t.match(/En preparación/g) ?? []).length === 1, 'Cuenta: en-preparación UNA vez (sección)');
await page.screenshot({ path: `${S}/s52-cuenta.png`, fullPage: true });

// prestador: HOY + negocio
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 180000 });
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(1000);
  t = await texto();
  if (t.includes('Tus paseos de hoy')) break;
}
check(t.includes('Hoy no tienes paseos'), 'HOY: vacío sereno presente');
await page.screenshot({ path: `${S}/s52-hoy.png`, fullPage: true });
await page.getByText('Negocio', { exact: true }).last().click();
await page.waitForTimeout(2500);
t = await texto();
check((t.match(/En preparación/g) ?? []).length === 1, 'Negocio: en-preparación UNA vez');
await page.screenshot({ path: `${S}/s52-negocio.png`, fullPage: true });

await ctx.close();
await browser.close();
console.log(`\n${fallos === 0 ? 'PASE S52 VERIFICADO EN WEB: 0 fallos' : `FALLOS: ${fallos}`}`);
process.exit(fallos === 0 ? 0 : 1);
