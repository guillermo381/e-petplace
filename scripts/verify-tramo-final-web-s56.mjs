// Verificación runtime web S56-B (tramo final): /vacaciones (peldaño 0 +
// Hoja de creación hasta el dato "Hasta el…") y el precio del PLAN en
// /servicios (campo + voz de vacío + neto + comparación en vivo).
// SOLO LECTURA: jamás se toca "Bloquear estos días" ni "Guardar" — la
// escritura la prueban los asserts de wrappers. Dev server :8081.
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

// ── login real ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Hoy', 30);

// ── Negocio: la Celda de Vacaciones vive en Tu oferta ──
await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 60000 });
let t = await esperar('Vacaciones', 30);
check(t.includes('Vacaciones') && t.includes('Marca los días en que no paseas.'), 'T1 Negocio: Celda Vacaciones en Tu oferta');

// ── /vacaciones: peldaño 0 + Hoja hasta el dato ──
await page.getByText('Vacaciones', { exact: true }).click();
t = await esperar('Tus días libres', 30);
check(t.includes('Tus días libres'), 'T2 peldaño 0: la invitación que educa');
check(t.includes('tus citas ya confirmadas siguen en pie'), 'T2b la promesa honesta (motor, no pantalla)');
await page.getByText('Marcar mis primeros días', { exact: true }).click();
t = await esperar('Cuánto tiempo', 15);
check(t.includes('Desde') && t.includes('Cuánto tiempo'), 'T3 Hoja: Desde + duración de un toque');
// elegir el primer día ofrecido (hoy) y 1 semana → el dato "Hasta el…"
const hoyIso = new Intl.DateTimeFormat('en-CA').format(new Date());
const chipHoy = await page.getByText(/^\d{2} \w{3} \d{4}$/).first();
await chipHoy.click();
await page.getByText('1 semana', { exact: true }).click();
t = await esperar('inclusive', 10);
check(t.includes('Hasta el') && t.includes('inclusive'), 'T4 el fin del rango se declara como dato humano');
// NO se crea nada: cerrar por back del navegador
await page.goBack();

// ── /servicios: el precio del plan en la Hoja de edición ──
await page.goto('http://localhost:8081/servicios', { waitUntil: 'networkidle', timeout: 60000 });
t = await esperar('Tus paseos', 30);
// abrir la primera oferta (la seed 30')
await page.getByText(/salida corta|30 min/i).first().click();
t = await esperar('plan mensual', 15);
check(t.includes('Precio por salida en plan mensual'), 'T5 el campo del plan vive en la Hoja');
check(t.includes('Rige desde la próxima renovación'), 'T5b la ayuda aprobada por el arquitecto');
check(t.includes('Sin plan en este bloque'), 'T5c vacío = voz honesta (null = sin plan)');
await page.getByRole('textbox', { name: /plan mensual/i }).fill('12.50');
t = await esperar('por salida', 10);
check(t.includes('vas a recibir'), 'T6 neto visible del plan (fees.ts, mismo dato)');
check(/Suelto \$[\d.]+ · plan \$12\.50 por salida/.test(t), 'T6b comparación con el suelto SIN juzgar (dato)');
// NO se guarda: cero escrituras por UI

await browser.close();
console.log(fallos === 0 ? '\nTODO VERDE (9/9) — cero escrituras por UI' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
