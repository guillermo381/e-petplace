// Verificación runtime web S71-B1: EL TECHO DE LA JORNADA (piloto M1).
// SOLO LECTURA — el techo no escribe nada; la verdad sale de la DB viva
// de la cuenta demo. Produce además la CAPTURA del gate (M3).
//
// OJO L-145: la web NO cierra el gate del founder (eso es dispositivo).
// Esto verifica COMPOSICIÓN y COPY, y deja el píxel para la mesa.
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

// ── login real ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();

let t = await esperar('Agenda', 60);

// ── T1: el rótulo genérico MURIÓ (hallazgo 2 del gate S70) ──
check(!t.includes('Tu jornada de hoy'), 'T1 el rótulo genérico murió');

// ── T2: la persona preside (saludo con primer nombre, o saludo solo) ──
check(/Hola/.test(t), 'T2 el techo saluda a la persona');

// ── T3: CHANEL — la fecha larga ya no vive en el techo ──
// (el riel la formatea "sábado, 19 de julio"; la vista Semana sí rotula días)
const mesLargo = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/;
const cabecera = t.split('\n').slice(0, 4).join('\n');
check(!mesLargo.test(cabecera), 'T3 Chanel: la fecha salió del techo');

// ── T4: la forma del día habla (alguno de los 8 estados de hoy) ──
const formaHoy =
  /Te quedan? \d+/.test(t) ||
  /Jornada completa\./.test(t) ||
  /Día atendido · \d+ por coordinar/.test(t) ||
  /Hoy libre · \d+ esta semana/.test(t);
check(formaHoy, 'T4 la forma del día se pronuncia (o se omite con verdad)');

// ── T5: tuteo neutro — el voseo es el desvío (M5/C2) ──
check(!/terminás|tenés|podés/.test(t), 'T5 tuteo neutro (cero voseo)');

// ── CAPTURA del gate (M3) — vista Hoy ──
await page.screenshot({ path: 'scripts/capturas/s71-b1-techo-jornada-hoy.png' });

// ── T6: la vista Semana cambia la voz del dato (acompaña la vista) ──
await page.getByText('Semana', { exact: true }).click();
await page.waitForTimeout(1500);
t = await texto();
check(
  /\d+ citas esta semana/.test(t) || !/Te quedan? \d+/.test(t),
  'T6 el dato acompaña la vista (jamás "Te quedan" mirando 7 días)',
);
await page.screenshot({ path: 'scripts/capturas/s71-b1-techo-jornada-semana.png' });

console.log(`\n${fallos === 0 ? 'VERDE' : `ROJO — ${fallos} fallo(s)`}`);
await browser.close();
process.exit(fallos === 0 ? 0 : 1);
