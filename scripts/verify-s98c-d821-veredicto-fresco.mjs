/**
 * verify-s98c-d821-veredicto-fresco.mjs — EL VEREDICTO NO SE CACHEA.
 *
 * INCIDENTE: A aprobó `seller_productos` con la app abierta y `/ventas`
 * siguió diciendo *«Tu negocio todavía no vende productos»*. La base decía
 * activo. La pantalla leía un veredicto viejo: `contextoVentas()` cacheaba
 * `esVendedora` en memoria de módulo y solo lo soltaba al entrar/salir de
 * sesión.
 *
 * 🔴 **EL DISCRIMINADOR TIENE TRUCO, Y POR ESO SE ESCRIBE ASÍ.** Abrir la
 * app y ver que funciona **NO prueba nada**: en una sesión nueva el caché
 * arranca vacío, así que la primera lectura salía bien *antes y después* de
 * la cura. Lo que hay que probar es que **la SEGUNDA lectura vuelve a
 * preguntar** — que es justo lo que fallaba.
 *
 * Se cuentan las peticiones a `cuenta_roles` mientras se navega dos veces:
 *     antes de la cura → 1  (la segunda salía del caché)
 *     después         → ≥2  (cada resolución vuelve a preguntar)
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = process.env.CUENTA || leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE || leer('EXPO_PUBLIC_DEMO_PASSWORD');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

let consultasDeRol = 0;
page.on('request', (r) => {
  if (r.url().includes('/cuenta_roles')) consultasDeRol++;
});

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

await page.goto('http://localhost:8081/ventas', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(6000);
const trasPrimera = consultasDeRol;
const texto1 = await page.locator('body').innerText();
const rebota = /todavía no vende productos/i.test(texto1);

// Se va y vuelve: la SEGUNDA resolución es la que el caché se comía.
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(4000);
await page.goto('http://localhost:8081/ventas', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(6000);
const trasSegunda = consultasDeRol;

console.log(`\ncuenta: ${EMAIL}`);
console.log(`  ¿la pantalla rebota con «no vende»? → ${rebota ? '🔴 SÍ' : '✓ NO'}`);
console.log(`  consultas a cuenta_roles: 1ª visita=${trasPrimera} · total tras volver=${trasSegunda}`);

let fallos = 0;
if (rebota) {
  console.error('🔴 la puerta sigue negando lo que la base concede');
  fallos++;
}
if (trasSegunda <= trasPrimera) {
  console.error(
    '🔴 la segunda resolución NO volvió a preguntar — el veredicto sigue saliendo del caché',
  );
  fallos++;
} else {
  console.log('  ✓ la segunda resolución VOLVIÓ a preguntar: el veredicto es fresco');
}

await browser.close();
console.log(fallos === 0 ? '\n✓ D-821 VERDE\n' : `\n🔴 D-821 ROJO: ${fallos}\n`);
process.exit(fallos === 0 ? 0 : 1);
