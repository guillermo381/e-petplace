/**
 * verify-s98c-eco-puerta.mjs — EL DISCRIMINADOR DE §3.1bis.
 *
 * Firma del founder: *«los mensajes de la puerta —que la familia de XXXX
 * no respondió— no deberían estar en HOY: deberían estar en ATENDER»*.
 *
 * 🔴 **Este archivo NO fotografía: DISCRIMINA.** Una captura del HOY sin la
 * banda no prueba nada —podría no haber ningún handshake vivo— y una de
 * ATENDER con la banda tampoco, si no se probó que el HOY dejó de tenerla.
 * La prueba son las DOS mitades juntas, sobre la MISMA cuenta y en la
 * misma corrida:
 *
 *     ① ATENDER muestra la solicitud   (hay eco que mostrar)
 *     ② el HOY NO la muestra           (se mudó de verdad)
 *
 * Sin ①, ② sería un verde por ausencia de datos — la clase de verde que
 * esta casa llama «por la razón equivocada».
 *
 * Cuenta: la del handshake vivo (Clínica Aurora). `CUENTA`/`CLAVE`.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-eco-puerta/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = process.env.CUENTA || leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE || leer('EXPO_PUBLIC_DEMO_PASSWORD');

/** Las voces del eco, tal como las pinta la superficie. Se busca por VOZ y
 *  no por un id de test: si mañana cambia el copy, este guard tiene que
 *  romperse y obligar a mirar — no seguir verde sobre una frase muerta. */
const VOZ_ECO = /no respondió|Se venció la espera|Esperando respuesta|autorizaciones? esperando/i;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

async function mirar(ruta, archivo) {
  await page.goto(`http://localhost:8081${ruta}`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(7000);
  // El HOY es largo: el eco podía vivir abajo. Se empuja el scroll para
  // que «no aparece» signifique «no está», no «no llegué».
  await page.evaluate(() => {
    for (const d of Array.from(document.querySelectorAll('div')))
      if (d.scrollHeight > d.clientHeight + 40) d.scrollTop = d.scrollHeight;
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}${archivo}` });
  const texto = await page.locator('body').innerText();
  return VOZ_ECO.test(texto);
}

const enAtender = await mirar('/atender', '01-atender-con-eco.png');
const enHoy = await mirar('/', '02-hoy-sin-eco.png');

console.log(`\n① ATENDER muestra el eco  → ${enAtender ? '✓ SÍ' : '✗ NO'}`);
console.log(`② el HOY lo muestra        → ${enHoy ? '✗ SÍ (no se mudó)' : '✓ NO'}`);

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`, errores.slice(0, 2));
  process.exit(1);
}
if (!enAtender) {
  console.error(
    '\n🔴 ABORTA SIN VEREDICTO: no hay eco en ATENDER, así que el «no está en HOY»\n' +
      '   no prueba la mudanza — probaría que no había nada que mudar.\n',
  );
  process.exit(1);
}
if (enHoy) {
  console.error('\n🔴 ROJO: el HOY sigue mostrando la correspondencia de la puerta.\n');
  process.exit(1);
}
console.log('\n✓ §3.1bis VERDE — el eco vive en ATENDER y el HOY quedó con el día\n');
