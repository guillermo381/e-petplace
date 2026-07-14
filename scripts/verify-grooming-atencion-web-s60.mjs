// Verificación runtime web S60-B1 — LA ATENCIÓN DE GROOMING (Antes/
// Durante/Después) + el HOY con la jornada FUSIONADA (paseo+grooming).
// SOLO LECTURA (precedente S59-B: la única escritura del flujo la
// ejercita el gate en dispositivo cuando exista una cita de grooming —
// hoy la DB tiene CERO, relevado S60-B1): se verifica que el HOY carga
// con el doble fetch sin romper el paseo, que la vista del día del
// groomer rinde su verdad, y que la ruta del Antes cae bien parada
// ante una cita inexistente (guard 7.5). Dev server: PORT (def. 8086).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = process.env.PORT ?? '8086';
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1200 } });
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

// ── login real (sesión demo) ──
await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();

// ── T1: el HOY carga con la jornada FUSIONADA (el doble fetch no
// rompe el día del paseo — regresión de la Zona 1/2 intacta) ──
await esperar('Tus paseos de hoy', 60);
// El segmentado Hoy/Semana solo existe cuando la pantalla llegó a
// 'listo': si el fetch grooming fallara, la pantalla sería el error de
// Ley 13 y 'Semana' jamás aparecería.
let t = await esperar('Semana', 45);
check(t.includes('Semana'), 'T1 el HOY llegó a listo con el doble fetch');
check(!t.includes('Ocurrió un error'), 'T1b sin error visible');

// ── T2: la vista del día del groomer (/grooming/dia) ──
await page.goto(`http://localhost:${PORT}/grooming/dia`, { waitUntil: 'networkidle' });
t = await esperar('Tu día de grooming', 30);
check(t.includes('Tu día de grooming'), 'T2 la vista del día rinde');
// la demo no tiene sesiones de grooming hoy → el vacío honesto UNA vez
t = await esperar('sesiones', 15).then(() => texto());
t = await texto();
check(
  t.includes('Todavía no terminaste sesiones hoy.') || t.includes('Sesiones'),
  'T2b vacío honesto O resumen con datos',
);

// ── T3: el ANTES ante cita inexistente — guard 7.5 con voz y camino ──
await page.goto(
  `http://localhost:${PORT}/grooming/cita/00000000-0000-0000-0000-000000000000`,
  { waitUntil: 'networkidle' },
);
t = await esperar('disponible', 40);
check(t.includes('Esta cita ya no está disponible'), 'T3 la cita inexistente cae bien parada');
check(t.includes('Volver a tu día'), 'T3b el vacío termina en un camino');

// ── T4: es/en — la vista del día habla inglés con override ──
await page.evaluate(() => localStorage.setItem('epetplace.idioma', 'en'));
await page.goto(`http://localhost:${PORT}/grooming/dia`, { waitUntil: 'networkidle' });
t = await esperar('Your grooming day', 30);
check(t.includes('Your grooming day'), 'T4 la vista del día en inglés');

await browser.close();
console.log(fallos === 0 ? '\nTODO VERDE' : `\nFALLOS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
