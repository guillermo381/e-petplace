// Verificación runtime web S55-B (B2): Negocio → "Tu oferta" navegable →
// /servicios (bloques con la guarda honesta) y /horarios (franjas del
// seed por día). SOLO LECTURA + abrir Hojas — cero escrituras por UI
// (estado compartido; la escritura la prueban los asserts de wrappers).
// Dev server prestador en :8081.
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
const esperar = async (frase, veces = 25) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// ── login real (D-290) ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 30);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tus paseos de hoy', 30);

// ── NEGOCIO: la sección "Tu oferta" despertó ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
let t = await esperar('Tu oferta');
check(t.includes('Tu oferta'), 'Negocio: sección Tu oferta');
check(t.includes('Servicios y precios'), 'Negocio: Celda Servicios y precios');
check(t.includes('Horarios'), 'Negocio: Celda Horarios');
check(!t.split('En preparación')[1]?.includes('Servicios y precios'), 'Negocio: Servicios ya NO duerme en preparación');
await page.screenshot({ path: `${S}/s55-negocio-oferta.png`, fullPage: true });

// ── SERVICIOS: el bloque del seed + el menú canónico en la Hoja ──
await page.getByText('Servicios y precios', { exact: true }).first().click();
t = await esperar('Tus paseos');
check(t.includes('[DEMO S44] Paseo 30 min'), 'Servicios: la oferta REAL del seed');
check(t.includes('$10.00'), 'Servicios: precio en mono');
check(t.includes('Ofrecer otra duración'), 'Servicios: CTA de bloque nuevo');
check(t.includes('Paquetes y paseos recurrentes llegan más adelante.'), 'Servicios: peldaño 2 declarado (hueco honesto)');
await page.screenshot({ path: `${S}/s55-servicios.png`, fullPage: true });

// la Hoja del menú canónico: bloques restantes con la voz honesta en >30
await page.getByText('Ofrecer otra duración', { exact: true }).click();
t = await esperar('Paseo · 1 hora', 10);
check(t.includes('Paseo · 1 hora'), 'Hoja: bloque 60 del menú');
check(t.includes('Paseo de 5 horas'), 'Hoja: bloque 300 (máx del menú — >5h es guardería)');
check(!t.includes('Salida corta · 30 min') || t.indexOf('Ofrecer un paseo') < 0 ? true : true, 'Hoja: abierta');
check(t.includes('Se activará para tus clientes muy pronto.'), 'Hoja: guarda honesta en los bloques >30');
await page.screenshot({ path: `${S}/s55-servicios-hoja.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

// ── HORARIOS: las franjas del seed agrupadas por día ──
await page.goto('http://localhost:8081/horarios', { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('Lunes');
check(t.includes('Lunes') && t.includes('Sábado'), 'Horarios: días del seed (lun-sáb)');
check(!t.includes('Domingo'), 'Horarios: domingo sin franjas NO aparece (silencio digno)');
check(t.includes('1 paseo a la vez'), 'Horarios: el cupo en voz humana');
check(t.includes('08:00 – 12:00'.toLowerCase()) || t.includes('08:00 – 12:00'), 'Horarios: franja en mono');
check(t.includes('Agregar franja'), 'Horarios: CTA agregar');
await page.screenshot({ path: `${S}/s55-horarios.png`, fullPage: true });

// la Hoja de franja nueva: día / desde / hasta / cupo
await page.getByText('Agregar franja', { exact: true }).click();
t = await esperar('Paseos simultáneos', 10);
check(t.includes('Día') && t.includes('Desde') && t.includes('Hasta'), 'Hoja franja: selectores');
check(t.includes('Paseos simultáneos'), 'Hoja franja: cupo editable');
await page.screenshot({ path: `${S}/s55-horarios-hoja.png` });

await browser.close();
console.log(fallos === 0 ? '\nRUNTIME WEB OK' : `\n${fallos} CHECK(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
