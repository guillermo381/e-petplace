// Verificación runtime web S56-B (TAREA 4): /servicios muestra el NETO
// donde se pone el precio — el % leído del dato (financiero v2.6, 7.15).
// SOLO LECTURA + abrir la Hoja de creación y tipear un precio — cero
// escrituras (no se toca "Ofrecer este paseo"). Dev server prestador :8081.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

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
const esperar = async (frase, veces = 30) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// ── login real (D-290) ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Hoy', 30);

// ── /servicios ──
await page.goto('http://localhost:8081/servicios', { waitUntil: 'networkidle', timeout: 60000 });
let t = await esperar('Tus paseos', 30);
check(t.includes('Tus paseos'), 'T1 /servicios carga el peldaño 1');

// ── Hoja de creación: elegir bloque → el % aparece ANTES de tipear ──
if (t.includes('Ofrecer otra duración')) {
  await page.getByText('Ofrecer otra duración', { exact: true }).click();
} else {
  console.log('✗ SETUP: no está "Ofrecer otra duración" (¿todos los bloques ya ofrecidos?)');
  process.exit(1);
}
await esperar('Ofrecer un paseo', 10);
// primer bloque disponible del menú (el seed solo oferta 30')
const candidatos = ['Paseo · 1 hora', 'Paseo largo · 2 horas', 'Paseo de 3 horas', 'Paseo de 4 horas', 'Paseo de 5 horas'];
let elegido = null;
const t2 = await texto();
for (const c of candidatos) {
  if (t2.includes(c)) { elegido = c; break; }
}
if (elegido === null) {
  console.log('✗ SETUP: ningún bloque del menú disponible en la Hoja');
  process.exit(1);
}
await page.getByText(elegido, { exact: true }).last().click();
t = await esperar('retiene', 10);
check(t.includes('e-PetPlace retiene 15%'), 'T2 sin precio: "e-PetPlace retiene 15%" (el % del dato)');
check(!t.includes('vas a recibir'), 'T2b sin precio no se inventa neto');

// ── tipear precio → neto en vivo ──
await page.getByRole('textbox', { name: 'Precio' }).fill('20');
t = await esperar('vas a recibir', 10);
check(t.includes('e-PetPlace retiene 15% · vas a recibir $17.00'), 'T3 con $20: "retiene 15% · vas a recibir $17.00"');

await page.getByRole('textbox', { name: 'Precio' }).fill('0');
await page.waitForTimeout(500);
t = await texto();
check(t.includes('e-PetPlace retiene 15%') && !t.includes('vas a recibir'), 'T4 precio inválido: vuelve al % solo');

await browser.close();
console.log(fallos === 0 ? '\nTODO VERDE (5/5)' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
