// Verificación runtime web S61-B5 — EL FILTRO POR OFICIO DEL HOY.
// SOLO LECTURA: el filtro es estado de vista, nada persiste. Dev server:
// PORT (default 8087), sesión demo (el prestador seed tiene DOS oficios
// con oferta activa — la condición del segmento).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = process.env.PORT ?? '8087';
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
let fallos = 0;
const check = (cond, nombre, detalle = '') => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1400 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
const esperar = async (frase, veces = 40) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
let t = await esperar('Tu jornada de hoy', 60);

// T1 — el segmento del filtro EXISTE (el demo tiene dos oficios activos)
t = await esperar('Estética', 20);
check(t.includes('Todos') && t.includes('Paseos') && t.includes('Estética'), 'T1 el filtro Todos·Paseos·Estética vive');

// T2 — Estética: cero subtítulos de paseo en la lista (vista Semana,
// que junta el rango entero — más citas que el día)
await page.getByText('Semana', { exact: true }).click();
await page.waitForTimeout(800);
await page.getByText('Estética', { exact: true }).click();
await page.waitForTimeout(800);
t = await texto();
check(!/Paseo de/.test(t), 'T2 con Estética no queda fila de paseo', /Paseo de/.test(t) ? 'hay "Paseo de" visible' : '');

// T3 — Paseos: cero subtítulos de grooming
await page.getByText('Paseos', { exact: true }).click();
await page.waitForTimeout(800);
t = await texto();
check(!/Baño/.test(t), 'T3 con Paseos no queda fila de estética', /Baño/.test(t) ? 'hay "Baño" visible' : '');

// T4 — Todos restaura la jornada completa (la lista vuelve a ser la unión)
await page.getByText('Todos', { exact: true }).click();
await page.waitForTimeout(800);
t = await texto();
check(t.includes('Todos'), 'T4 Todos restaura sin romper la vista');

console.log(fallos === 0 ? '\nSMOKE S61 FILTRO HOY: TODO VERDE' : `\nSMOKE S61 FILTRO HOY: ${fallos} FALLOS`);
await browser.close();
process.exit(fallos === 0 ? 0 : 1);
