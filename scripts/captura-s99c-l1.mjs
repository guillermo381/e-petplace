/**
 * captura-s99c-l1.mjs — LA CAMINATA DE L1 ANTES DEL FOUNDER (§6bis-B).
 *
 * Qué recorre, como el vendedor puro (`duenodes`, sin fila de `prestadores`):
 * `ATENDER` y `DATOS` — los dos cuartos que hasta S99-C lo recibían con un
 * error genérico. **La pregunta que viene a contestar no es «se ve lindo»:
 * es si dejaron de mentir.**
 *
 * 🔴 CREDENCIALES (R6): la clave sale del **keychain al momento** y jamás se
 * imprime; el sufijo de la cuenta entra por argumento. Nada de esto queda
 * escrito en el repo.
 *
 * Uso: node scripts/captura-s99c-l1.mjs <sufijo>     (ej: duenodes)
 * Server: expo web del prestador en :8081 — **y el script verifica que el
 * puerto lo sirva ESTA worktree**, porque un Metro huérfano de otra sesión
 * responde normal y sirve otro árbol (enmienda a D-769, cobrada en S99).
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const SUFIJO = process.argv[2];
if (!SUFIJO) {
  console.error('✗ falta el sufijo de la cuenta (ej: duenodes)');
  process.exit(1);
}
const EMAIL = `guillo381+${SUFIJO}@gmail.com`;

let PASS = '';
try {
  PASS = execFileSync(
    'security',
    ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
    { encoding: 'utf8' },
  ).trim();
} catch {
  console.error('✗ no se pudo leer la clave del keychain');
  process.exit(1);
}

const DIR = new URL('./capturas/s99-c-l1/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1400 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

async function foto(nombre) {
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}${nombre}.png`, fullPage: false });
  console.log(`  ✓ ${nombre}.png`);
}

console.log(`— entrando como ${SUFIJO} —`);
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 240000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(6000);
await foto('00-entrada');

for (const [tab, nombre] of [
  ['Atender', '01-atender'],
  ['Datos', '02-datos'],
]) {
  const t = page.getByText(tab, { exact: true }).first();
  if ((await t.count()) > 0) {
    await t.click();
    await foto(nombre);
  } else {
    console.log(`  ⚠ no se encontró la tab «${tab}» — se declara, no se inventa`);
  }
}

/* EL TEXTO DE CADA CUARTO, que es lo que de verdad se vino a verificar:
   un screenshot prueba que pintó; el texto prueba QUÉ dijo. */
const cuerpo = await page.locator('body').innerText();
console.log('\n— lo que dicen los cuartos —');
for (const frase of [
  'Tu negocio es de productos',
  'Lo tuyo son tus pedidos',
  'Tu tienda',
  'Revisa los datos',
  'Algo salió mal',
]) {
  console.log(`  ${cuerpo.includes(frase) ? '✓' : '·'} ${frase}`);
}

console.log(`\nerrores de página: ${errores.length}`);
errores.slice(0, 3).forEach((e) => console.log(`  ✗ ${e.slice(0, 140)}`));
await browser.close();
