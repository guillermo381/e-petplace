/**
 * captura-s98c-destape.mjs — LA CEREMONIA NOMBRA LAS TABS REALES (D-819).
 *
 * El destape enumeraba `Hoy · Datos · Negocio · Cuenta` fijo. Acá se
 * fotografía que compone: para un titular con local tiene que aparecer
 * **ATENDER**, que la lista vieja no nombraba nunca.
 *
 * Alcanzable gracias al `?paso=` que el wizard aprendió en esta misma
 * sesión: se entra directo al último paso y se toca Continuar.
 *
 * Credencial de `.env.local` o `CUENTA`/`CLAVE`. Aborta si no entró.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-destape/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = process.env.CUENTA || leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE || leer('EXPO_PUBLIC_DEMO_PASSWORD');
const SUFIJO = process.env.SUFIJO ? `-${process.env.SUFIJO}` : '';

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

// El último paso, directo — esto lo habilitó el `?paso=` de esta sesión.
await page.goto('http://localhost:8081/verificacion/alta?paso=equipo', {
  waitUntil: 'networkidle',
  timeout: 180000,
});
await page.waitForTimeout(6000);

const cta = page.getByText(/Abrir mi casa|Continuar|Terminar/).first();
if ((await cta.count()) === 0) {
  await page.screenshot({ path: `${DIR}00-aborto${SUFIJO}.png` });
  const visto = (await page.locator('body').innerText()).slice(0, 240).replace(/\n+/g, ' · ');
  console.error(`✗ ABORTA: no llegué al último paso. La pantalla dice: ${visto}`);
  await browser.close();
  process.exit(1);
}
await cta.click();

/* La ceremonia dura ~3 s y termina navegando sola. Se dispara la foto
   DENTRO de la ventana, no después: pasada la animación esta pantalla ya
   no existe. */
await page.waitForTimeout(2600);
await page.screenshot({ path: `${DIR}01-destape${SUFIJO}.png` });
console.log(`✓ 01-destape${SUFIJO}.png`);

const texto = await page.locator('body').innerText();
const nombra = (s) => texto.includes(s);
console.log(
  `   enumera → Hoy:${nombra('Hoy')} · Datos:${nombra('Datos')} · ` +
    `ATENDER:${nombra('Atender')} · Negocio:${nombra('Negocio')} · Cuenta:${nombra('Cuenta')}`,
);
/* 🔴 EL DISCRIMINADOR: con la lista vieja `Atender` NO podía aparecer —
   no estaba escrita en ningún lado de este archivo. */
if (!nombra('Atender')) {
  console.error('   ✗ la ceremonia NO nombró ATENDER — el destape sigue enumerando a mano');
  process.exitCode = 1;
} else {
  console.log('   ✓ la ceremonia nombra ATENDER (la lista vieja no podía)');
}

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`, errores);
  process.exit(1);
}
console.log('✓ sin errores JS');
