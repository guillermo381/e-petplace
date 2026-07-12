// Smoke runtime RN-web S55-B4 — el CUÁNDO tipo Teams: duración primero
// (bloques reales con precio), tira de días, grilla de inicios REALES
// (RPC nueva), voz honesta del día sin inicios, frecuencia apagada, y
// el salto al QUIÉN intacto. Correr con: node scripts/verify-cuando-teams-s55.mjs
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } })).newPage();

async function esperarTexto(needle, iter = 24) {
  let texto = '';
  for (let i = 0; i < iter; i++) {
    texto = await page.evaluate(() => document.body.innerText);
    if (texto.includes(needle)) return texto;
    await page.waitForTimeout(500);
  }
  return texto;
}

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForURL(/hogar/, { timeout: 60000 });

await page.goto('http://localhost:8082/explorar/paseo', { waitUntil: 'networkidle', timeout: 120000 });
let texto = await esperarTexto('Duración');
check(texto.includes('30 min'), 'duración primero: el bloque 30 ofertado se pinta', texto.includes('30 min') ? '' : texto.slice(0, 200));
check(texto.includes('La salida al baño.'), 'la voz del 30 habla');
check(/(\$\d+\.\d{2})/.test(texto), 'el precio del bloque se declara');
check(texto.includes('Hoy') && texto.includes('Mañana'), 'la tira de días vive');
check(texto.includes('¿Todas las semanas?') && texto.includes('Pronto'), 'frecuencia dibujada APAGADA');

// próximo sábado en la tira (fecha local) — el día con franjas demo
const hoy = new Date();
const sabado = new Date(hoy);
sabado.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7));
const chipSabado = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric' }).format(sabado).toLowerCase();
await page.getByRole('radiogroup', { name: 'Día' }).getByText(chipSabado, { exact: true }).click();
texto = await esperarTexto('08:00');
check(texto.includes('08:00') && texto.includes('Hora de inicio'), `grilla de inicios reales del sábado (${chipSabado})`);
check(!texto.includes('06:00'), 'el rango hardcodeado murió (no hay 06:00 fantasma — D-321)');

// tap un inicio → Ver quién puede → el QUIÉN intacto (S54)
await page.getByRole('radiogroup', { name: 'Hora de inicio' }).getByText('08:00', { exact: true }).click();
await page.getByText('Ver quién puede', { exact: true }).click();
texto = await esperarTexto('[DEMO S44] Paseo 30 min');
check(texto.includes('[DEMO S44] Paseo 30 min'), 'el QUIÉN (S54) recibe la terna intacto');

await browser.close();
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
