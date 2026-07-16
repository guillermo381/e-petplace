// Smoke S63-B (Bloque 3 parcial): la ficha del Antes de adiestramiento
// monta en web con la SESIÓN DEMO REAL (login patrón S60), agrega las
// señales conductuales de paseos reales y declara el placeholder de la
// bitácora. MASCOTA_ID parametrizable (default: Zeus demo).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PUERTO = process.env.PORT_PRESTADOR ?? '8085';
const MASCOTA = process.env.MASCOTA_ID ?? 'de300000-0000-4000-8000-000000000a5c';
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1200 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
const esperar = async (frase, veces) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}`);
  if (!cond) fallos++;
};

// ── login real (sesión demo, patrón S60) ──
await page.goto(`http://localhost:${PUERTO}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tu jornada de hoy', 60);

// ── la ficha del Antes (es) ──
await page.goto(`http://localhost:${PUERTO}/adiestramiento/antes/${MASCOTA}`, { waitUntil: 'networkidle' });
let t = await esperar('Cómo se comporta en sus paseos', 30);
check(t.includes('Cómo se comporta en sus paseos'), 'T1 sección de señales conductuales');
check(t.includes('×'), 'T2 señales agregadas de paseos reales (contador ×N)');
check(t.includes('Programas contigo'), 'T3 sección de programas');
check(t.includes('La bitácora de la familia'), 'T4 placeholder honesto de la bitácora §7');
check(!t.includes('Ocurrió un error'), 'T5 sin error visible');

// ── override en (el Espejo vivo) ──
await page.evaluate(() => localStorage.setItem('epetplace.idioma', 'en'));
await page.reload({ waitUntil: 'networkidle' });
t = await esperar('How they behave on their walks', 30);
check(t.includes('How they behave on their walks'), 'T6 señales en inglés');
check(t.includes("The family's log"), 'T7 bitácora en inglés');

await browser.close();
console.log(fallos === 0 ? 'SMOKE ANTES ADIESTRAMIENTO: 0 fallos' : `SMOKE ANTES ADIESTRAMIENTO: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
