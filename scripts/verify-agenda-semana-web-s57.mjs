// Verificación runtime web S57-B1: el segmento Hoy/Semana del tab Hoy
// (D-317 ocupado) — la semana lista 7 días con citas firmes, la marca
// del plan y el día libre en voz quieta. SOLO LECTURA (los bloqueos y
// el rango los prueban los asserts de wrappers). Dev server :8081.
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

// ── el tab Hoy: el segmento vive bajo el encabezado ──
let t = await esperar('Agenda', 60);
check(t.includes('Tu jornada de hoy'), 'T1 portada del tab Hoy intacta');
check(t.includes('Agenda') && t.includes('Semana'), 'T2 segmento Hoy/Semana presente (D-317 ocupado)');

// la fecha del header ahora habla por el riel (weekday + día + mes)
const hoyLocal = new Intl.DateTimeFormat('en-CA').format(new Date());
const [a, m, d] = hoyLocal.split('-').map(Number);
const fechaEs = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(a, m - 1, d));
const fechaCap = fechaEs.charAt(0).toUpperCase() + fechaEs.slice(1);
check(t.includes(fechaCap), 'T3 header con la fecha larga humana del riel (D-315p curado)');

// ── a la Semana ──
await page.getByText('Semana', { exact: true }).click();
t = await esperar('Libre', 20);

// 7 días: hoy como "Hoy" + los 6 siguientes con día de semana humano
let diasVisibles = 0;
for (let i = 1; i <= 6; i++) {
  const f = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(a, m - 1, d + i));
  const cap = f.charAt(0).toUpperCase() + f.slice(1);
  if (t.includes(cap)) diasVisibles++;
}
check(diasVisibles === 6, `T4 los 6 días siguientes con su nombre humano (${diasVisibles}/6)`);
check(t.includes('Hoy'), 'T4b el día base se llama Hoy');
check(t.includes('Libre') || t.includes('De vacaciones'), 'T5 el día sin citas habla (Libre / De vacaciones)');
check(t.includes('Parte del plan'), 'T6 la marca "Parte del plan" viaja a la semana');
check(/\d{2}:\d{2} · \d+ min/.test(t), 'T7 hora · duración en voz de máquina por cita');

// ── de vuelta a Hoy: el contrato original intacto ──
await page.getByText('Hoy', { exact: true }).first().click();
t = await esperar('Tu jornada de hoy', 10);
check(t.includes('Tu jornada de hoy'), 'T8 volver a Hoy no rompe nada');

await browser.close();
console.log(fallos === 0 ? '\nSMOKE WEB VERDE (9/9)' : `\n${fallos} FALTA(N)`);
process.exit(fallos === 0 ? 0 : 1);
