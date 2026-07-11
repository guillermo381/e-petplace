// Verificación runtime S53-B2b: entrada del Coach, Hoja anclada con
// respuestas de DATOS REALES, saludo con nombre, Explorar en grilla.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const S = process.env.SCRATCH ?? '/tmp';
let fallos = 0;
const check = (c, n) => { console.log(`${c ? '✓' : '✗ FALTA'} ${n}`); if (!c) fallos++; };

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
let t = '';
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  t = await texto();
  if (/Buenos días|Buenas tardes|Buenas noches/.test(t)) break;
}
console.log(`saludo visto: ${(t.match(/Buen[ao]s [^\n]*/) ?? ['?'])[0]}`);
check(/Buen[ao]s (días|tardes|noches)(, \S+)?/.test(t), 'QW1: saludo por franja (con nombre si el perfil lo tiene)');

// entrada del Coach
await page.getByLabel('Abrir el Coach').click();
await page.waitForTimeout(1500);
t = await texto();
check(t.includes('Pregunta sobre'), 'Coach: Hoja anclada abre');
check(t.includes('Pronto vas a poder preguntarme'), 'Coach: voz honesta del v0 (sin campo libre)');
await page.screenshot({ path: `${S}/coach-hoja.png` });

// pregunta → respuesta con datos reales (Zeus demo: 7 vacunas)
await page.getByText('¿Cómo va su carnet?', { exact: true }).click();
await page.waitForTimeout(1200);
t = await texto();
check(t.includes('7 vacunas registradas'), 'Coach: respuesta con DATO REAL (7 vacunas de Zeus)');
await page.screenshot({ path: `${S}/coach-respuesta.png` });

// edad: Zeus demo SIN fecha de nacimiento → respuesta honesta
await page.getByText('¿Qué edad tiene?', { exact: true }).click();
await page.waitForTimeout(1200);
t = await texto();
check(t.includes('no tengo su fecha de nacimiento'), 'Coach: null honesto (Zeus demo sin fecha)');

// cerrar y verificar Explorar en grilla
await page.getByLabel('Cerrar').last().click();
await page.waitForTimeout(1200);
// ARTEFACTO DEV-WEB (S53, diagnosticado): tras cerrar un Modal RN-web,
// el contenedor #error-toast del overlay de expo queda VACÍO (cero
// console.error, cero texto) pero interceptando pointer events sobre
// la zona de la barra. Solo existe en el harness web dev — en nativo
// y en producción no hay tal div. Se neutraliza por CSS para el test;
// el gate real de la Hoja es en dispositivo.
const toast = await page.evaluate(() => {
  const el = document.querySelector('#error-toast');
  const texto = el?.textContent ?? '';
  if (el) el.style.pointerEvents = 'none';
  return texto;
});
if (toast) console.log('TOAST DEV CON TEXTO (investigar):', JSON.stringify(toast.slice(0, 220)));
await page.getByText('Explorar', { exact: true }).last().click();
await page.waitForTimeout(4000);
await page.screenshot({ path: `${S}/explorar-grilla.png`, fullPage: true });
t = await texto();
check(t.includes('Paseo') && t.includes('Veterinaria'), 'QW2: grilla con servicios');

await ctx.close();
await browser.close();
console.log(`\n${fallos === 0 ? 'B2b VERIFICADO: 0 fallos' : `FALLOS: ${fallos}`}`);
process.exit(fallos === 0 ? 0 : 1);
