/**
 * repro-s98c-baldosa-tienda.mjs — «desapareció el rectángulo de la tienda».
 *
 * Reporte del founder: en `Negocio` la sección «Tu tienda» estaba, salió,
 * volvió a entrar y **ya no estaba** — mientras `ATENDER` la sigue
 * mostrando. Dos superficies, dos respuestas, la misma cuenta.
 *
 * El guion reproduce el camino EXACTO: Negocio → salir → Negocio, y en cada
 * pasada dice qué se ve **y qué contestó la red**, porque la diferencia
 * entre «no hay tienda» y «no se pudo leer» no se ve en la pantalla — y es
 * justamente la que hay que distinguir.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-repro/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = process.env.CUENTA || leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE || leer('EXPO_PUBLIC_DEMO_PASSWORD');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

/** Las respuestas del lector de naturalezas, con su status: un 200 con
 *  lista vacía y un 4xx se ven IGUAL en pantalla y son cosas distintas. */
const respuestas = [];
page.on('response', (r) => {
  if (r.url().includes('obtener_naturalezas_de_cuenta') || r.url().includes('/cuenta_roles'))
    respuestas.push(`${r.status()} ${r.url().split('/').pop().split('?')[0]}`);
});

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

async function verNegocio(n) {
  const antes = respuestas.length;
  await page.goto('http://localhost:8081/negocio', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    for (const d of Array.from(document.querySelectorAll('div')))
      if (d.scrollHeight > d.clientHeight + 40) d.scrollTop = d.scrollHeight;
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${DIR}negocio-pasada-${n}.png` });
  const texto = await page.locator('body').innerText();
  console.log(
    `  pasada ${n}: «Tu tienda»=${texto.includes('Tu tienda') ? 'SÍ' : 'NO'} · ` +
      `«Vender por e-PetPlace»=${texto.includes('Vender por e-PetPlace') ? 'SÍ' : 'NO'} · ` +
      `red=[${respuestas.slice(antes).join(' | ') || 'ninguna'}]`,
  );
  return texto.includes('Tu tienda');
}

console.log(`\ncuenta: ${EMAIL}`);
const p1 = await verNegocio(1);
// salir a otra tab y volver — el camino literal del reporte
await page.goto('http://localhost:8081/atender', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(5000);
const enAtender = (await page.locator('body').innerText()).includes('Tu tienda');
console.log(`  ATENDER muestra «Tu tienda» → ${enAtender ? 'SÍ' : 'NO'}`);
const p2 = await verNegocio(2);

await browser.close();
if (p1 && !p2) console.log('\n🔴 REPRODUCIDO: estaba y al volver desapareció.\n');
else if (!p1 && !p2) console.log('\n🔴 NUNCA APARECE en Negocio (y sí en ATENDER): no es de re-entrada.\n');
else console.log('\n✓ la sección se mantiene en las dos pasadas.\n');
