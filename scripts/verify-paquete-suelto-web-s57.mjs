// Smoke web S57 (SOLO LECTURA — cero escrituras por UI): el paquete y
// las acciones del suelto están CABLEADOS en el cliente. El gate real
// es del founder en dispositivo (L-138). Dev server cliente :8085 (el
// :8082 estaba tomado por un Metro ajeno — jamás pisarlo, L-136).
// BILINGÜE: el idioma del demo viene de su preferencia PERSISTIDA
// (D-316 — la DB pisa el cache del navegador): se acepta es|en.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}`);
  if (!cond) fallos++;
};
const alguna = (t, frases) => frases.some((f) => t.includes(f));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
const esperarAlguna = async (frases, veces = 30) => {
  let t = await texto();
  for (let i = 0; i < veces && !alguna(t, frases); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// login demo por la UI real
await page.goto('http://localhost:8085/login', { waitUntil: 'networkidle', timeout: 240000 });
await esperarAlguna(['Contraseña', 'Password'], 60);
await page.locator('input').first().fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText(/^(Entrar|Sign in)$/).click();
await esperarAlguna(['Tu hogar', 'Your home'], 30);

// ── CUÁNDO: los DOS chips (plan + paquete) con su voz de espera ──
await page.goto('http://localhost:8085/explorar/paseo', { waitUntil: 'networkidle', timeout: 60000 });
let t = await esperarAlguna(['Hacerlo frecuente', 'Make it a routine'], 30);
check(alguna(t, ['Hacerlo frecuente', 'Make it a routine']), 'T1 el chip del plan sigue vivo');
check(alguna(t, ['Comprar un paquete', 'Buy a package']), 'T2 el chip del paquete nació en el CUÁNDO');
check(
  alguna(t, ['Elige duración, día y hora primero.', 'Pick a duration, day and time first.']),
  'T2b apagado honesto sin selección',
);

// ── elegir duración + día (mañana) + hora real (estado cliente, cero escrituras) ──
await page.getByText(/^30 min$/).first().click();
await page.waitForTimeout(1500);
let horaElegida = false;
await page.getByText(/^(Mañana|Tomorrow)$/).first().click();
await page.waitForTimeout(2500);
const cuerpo = await texto();
if (/\b\d{2}:\d{2}\b/.test(cuerpo)) {
  await page.getByText(/^\d{2}:\d{2}$/).first().click();
  await page.waitForTimeout(600);
  horaElegida = true;
}
if (horaElegida) {
  t = await texto();
  check(
    alguna(t, ['Salidas por adelantado', 'Walks paid upfront']),
    'T3 el chip del paquete se encendió con la selección',
  );
  await page.getByText(/^(Comprar un paquete|Buy a package)$/).click();
  t = await esperarAlguna(['Paseadores disponibles', 'Available walkers'], 20);
  check(alguna(t, ['Paseadores disponibles', 'Available walkers']), 'T4 el QUIÉN carga en modo paquete');
  await page.goBack();
  await page.waitForTimeout(1000);
} else {
  console.log('(sin inicios en la próxima semana — T3/T4 no ejercitados, declarado)');
}

// ── el hub renderiza con las secciones nuevas cableadas ──
await page.goto('http://localhost:8085/hogar/paseos', { waitUntil: 'networkidle', timeout: 60000 });
t = await esperarAlguna(['Mis paseos', 'My walks'], 30);
check(alguna(t, ['Mis paseos', 'My walks']), 'T5 el hub carga');
check(
  alguna(t, ['Próximos', 'Upcoming', 'Todavía no tienes un plan', "You don't have a plan yet"]),
  'T5b segmentos o vacío digno (según datos vivos)',
);

await browser.close();
console.log(fallos === 0 ? '\nSMOKE VERDE' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
