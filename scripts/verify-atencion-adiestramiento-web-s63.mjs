// Smoke web S63-B (Bloque 3 experiencia) — SOLO LECTURA sobre el seed
// del gate: el HOY (semana) muestra la sesión de adiestramiento, el
// Antes porta "Sesión 1 de 2" + el gate temporal con voz honesta, y
// las rutas durante/cierre caen bien paradas (7.5: sin iniciar →
// redirigen al Antes). El ciclo iniciar→cerrar es del gate en
// dispositivo (la cita es de MAÑANA por diseño del motor).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PUERTO = process.env.PORT_PRESTADOR ?? '8085';
const CITA = process.env.CITA_ID ?? 'fcde1b56-fcc6-4874-af90-6b2685405219';
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
const esperar = async (frase, veces) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// login demo (patrón S60)
await page.goto(`http://localhost:${PUERTO}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
let t = await esperar('Tu jornada de hoy', 60);

// T1 — la SEMANA del HOY trae la sesión de adiestramiento (triple fetch)
await page.getByText('Semana', { exact: true }).click();
t = await esperar('Zeus', 30);
check(t.includes('Zeus'), 'T1 la sesión del seed aparece en la semana');
check(!t.includes('Ocurrió un error'), 'T1b el triple fetch no rompió la jornada');

// T2 — el Antes de la cita: contexto k/N + gate temporal honesto
await page.goto(`http://localhost:${PUERTO}/adiestramiento/cita/${CITA}`, { waitUntil: 'networkidle' });
t = await esperar('Sesión 1 de 2', 30);
check(t.includes('Sesión 1 de 2'), 'T2 el contexto del programa ("Sesión 1 de 2")');
check(t.includes('Obediencia desde cero (gate S63)'), 'T2b el nombre del programa');
check(t.includes('La sesión se empieza el día de la cita.'), 'T3 el gate temporal con voz honesta (CTA ausente)');
check(!t.includes('Empezar la sesión'), 'T3b el CTA de empezar NO vive hoy');
check(t.includes('Ficha de Zeus'), 'T4 la ficha conductual a un tap');

// T5 — 7.5: durante y cierre sin iniciar REDIRIGEN al Antes
await page.goto(`http://localhost:${PUERTO}/adiestramiento/cita/${CITA}/durante`, { waitUntil: 'networkidle' });
t = await esperar('Sesión 1 de 2', 30);
check(t.includes('Sesión 1 de 2') && !t.includes('Sesión en curso'), 'T5 /durante sin iniciar → Antes');
await page.goto(`http://localhost:${PUERTO}/adiestramiento/cita/${CITA}/cierre`, { waitUntil: 'networkidle' });
t = await esperar('Sesión 1 de 2', 30);
check(t.includes('Sesión 1 de 2') && !t.includes('El parte de la sesión'), 'T6 /cierre sin iniciar → Antes');

await browser.close();
console.log(fallos === 0 ? 'SMOKE ATENCIÓN WEB: 0 fallos' : `SMOKE ATENCIÓN WEB: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
