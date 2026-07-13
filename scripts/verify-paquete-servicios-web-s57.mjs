// Verificación runtime web S57-B2: la SECCIÓN PROPIA del paquete en
// /servicios (mandato founder: visible sin excavar) — header +
// explicación de presets + campo + voz del vacío + NETO por salida de
// fees.ts al tipear + el hueco viejo MUERTO. SOLO LECTURA: jamás se
// toca Guardar (la escritura la prueban los asserts de wrappers).
// Dev server :8081.
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

// ── login + /servicios ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tus paseos de hoy', 60);
await page.goto('http://localhost:8081/servicios', { waitUntil: 'networkidle', timeout: 60000 });
let t = await esperar('Tus bloques', 30);

// T1 — el hueco viejo MURIÓ de la lista (pasada Chanel)
check(!t.includes('llegan más adelante'), 'T1 el hueco "llegan más adelante" murió');

// ── abrir la Hoja del primer bloque ──
await page.getByText('$', { exact: false }).first().click();
t = await esperar('Paquete de salidas', 15);

// T2 — la sección propia, visible sin excavar
check(t.includes('Paquete de salidas'), 'T2 header propio "Paquete de salidas"');
check(
  t.includes('Tus clientes compran 5, 10 o 15 salidas de este bloque por adelantado.'),
  'T2b la explicación de presets en una línea',
);
check(t.includes('Precio por salida en paquete'), 'T2c el campo con su label');

// T3 — vacío = voz honesta del null (el demo no tiene paquete)
check(t.includes('Sin paquete en este bloque'), 'T3 voz del vacío (null honesto)');

// T4 — al tipear un precio: NETO por salida desde fees.ts + comparación
await page.getByRole('textbox', { name: /Precio por salida en paquete/ }).fill('4.75');
await page.waitForTimeout(600);
t = await texto();
check(/e-PetPlace retiene \d+% · vas a recibir \$\d+\.\d{2}/.test(t), 'T4 neto visible leído de fee_configs (7.15)');
check(t.includes('paquete $4.75 por salida'), 'T4b comparación con el suelto (dato, no juicio)');

// T5 — el plan sigue intacto al lado (misma Hoja, cero regresión)
check(t.includes('Precio por salida en plan mensual'), 'T5 el plan sigue en su lugar');

await browser.close();
console.log(fallos === 0 ? '\nSMOKE WEB VERDE (8/8)' : `\n${fallos} FALTA(N)`);
process.exit(fallos === 0 ? 0 : 1);
