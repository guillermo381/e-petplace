/**
 * medir-s100d-tope-vitrina.mjs — ⑳ · «PEDÍ 3 Y HAY 1», EJERCIDO EN LA VITRINA.
 *
 * ── QUÉ CONTESTA ────────────────────────────────────────────────────────
 * El montaje del tope de compra de A en la TERCERA puerta (la ficha y el
 * carrito ya lo tenían). **No mide el helper —eso es de A y tiene su
 * instrumento— sino que la vitrina lo CONSULTA de verdad**: que subir por
 * encima del stock se acote, que lo DIGA, y que bajar no consulte.
 *
 * **El producto es real y su número salió de la base, no de un fixture:**
 * `Advantage Perros 10-25 kg` — **stock_disponible = 2**, oferta publicada
 * con `hay_stock = true`. *Es exactamente el caso del founder: `hay_stock`
 * dice «sí, se puede comprar» y no puede decir «no alcanza para 3».*
 *
 * ⚠️ El carrito vive EN MEMORIA: **todo se hace en una sola sesión, sin
 * `goto` en el medio** — recargar lo vacía y el aparato mediría el estado
 * inicial (trampa ya cobrada en `medir-s100d-carrito.mjs`).
 *
 * 🔴 CREDENCIALES (R6): la clave sale del keychain AL MOMENTO.
 *
 * Uso: node scripts/medir-s100d-tope-vitrina.mjs [puerto]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const PUERTO = process.argv[2] ?? '8095';
const BASE = `http://localhost:${PUERTO}`;
const PRODUCTO = 'Advantage Perros 10-25';
const STOCK = 2;

const PASS = execFileSync('security',
  ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'],
  { encoding: 'utf8' }).trim();

const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ locale: 'es-EC', viewport: { width: 384, height: 832 } });
const p = await ctx.newPage();
await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await p.waitForTimeout(8000);
await p.getByPlaceholder('ej: ana@correo.com').fill('guillo381+8@gmail.com');
await p.locator('input[type="password"]').fill(PASS);
await p.getByText('Entrar', { exact: true }).click();
await p.waitForTimeout(9000);
await p.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(10000);

console.log(`\n═══ ⑳ · EL TOPE EN LA VITRINA · «${PRODUCTO}» · stock real = ${STOCK} ═══`);
await p.locator('input[type="text"], input:not([type])').first().fill(PRODUCTO);
await p.waitForTimeout(7000);

const cantidad = () => p.evaluate(() => {
  const s = [...document.querySelectorAll('[role="button"]')]
    .find(e => /^Sumar|^Aumentar|^Más/i.test(e.getAttribute('aria-label') ?? ''));
  const cont = s?.parentElement;
  const t = (cont?.textContent ?? '').match(/\d+/);
  return t ? Number(t[0]) : null;
});
const aviso = () => p.evaluate(() => {
  const txt = document.body.innerText;
  /* La voz literal del diccionario, no una paráfrasis: `maximoEntregable`
     dice «De este producto podemos entregarte N ahora». *Buscar «podés
     llevar» —que era mi paráfrasis— devolvía null y se leía como «la app
     no dijo nada», que es justo el defecto que este aparato vino a
     descartar.* */
  const m = txt.match(/(podemos entregarte[^\n]*|ya no queda[^\n]*|sin stock[^\n]*)/i);
  return m ? m[0].slice(0, 80) : null;
});

const mas = p.getByRole('button', { name: /^Agregar/i }).first();
await mas.click();
await p.waitForTimeout(3500);
console.log(`  tras el primer «+» ......... cantidad = ${await cantidad()}`);

/** El `+` del stepper (ya no es el «Agregar» de la tarjeta vacía). */
const sumar = p.getByRole('button', { name: /^(Sumar|Aumentar|Más)/i }).first();
const restar = p.getByRole('button', { name: /^(Restar|Quitar|Menos)/i }).first();
console.log(`  ¿aparece el stepper? ....... + ${await sumar.count()} · − ${await restar.count()}`);

for (let i = 2; i <= STOCK + 1; i++) {
  await sumar.click();
  await p.waitForTimeout(3500);
  const c = await cantidad();
  const v = await aviso();
  console.log(`  pedí ${i} → quedó en ${c}${v !== null ? `  ·  DIJO: «${v}»` : '  ·  (sin voz)'}`);
}
console.log(`  🔴 ⑳ ¿la vitrina acotó al stock real (${STOCK})? .. ${(await cantidad()) === STOCK ? '✓' : '✗'}`);

if ((await restar.count()) > 0) {
  await restar.click();
  await p.waitForTimeout(2500);
  console.log(`  bajar (no consulta al motor) → cantidad = ${await cantidad()}`);
}
await b.close();
