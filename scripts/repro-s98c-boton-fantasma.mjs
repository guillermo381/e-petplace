/**
 * repro-s98c-boton-fantasma.mjs — EL BOTÓN DE CONFIGURAR QUE NO ES SUYO.
 *
 * Reporte del founder: pidió «Quiero vender productos» → fue a revisión
 * (correcto) → **se habilitó un botón de entrar a configurar que mostraba
 * también servicios de salud** → back, reentró, ya no estaba.
 *
 * 🔴 LA HIPÓTESIS QUE ESTE ARCHIVO PRUEBA O TUMBA, y NO es la del reporte:
 * el enlace **no se habilita** — está SIEMPRE, incondicional, en el paso ②
 * del wizard (leído: `Entrada orden={4}`, fuera de todo `if`). Lo que sí
 * desaparece al reentrar es el botón «Quiero vender productos», y desaparece
 * BIEN: la naturaleza pasó a `solicitada`.
 *
 * ⇒ Lo que hay que medir no es un estado transitorio: es **a quién se le
 * ofrece ese enlace**. Va a `/ventas/configuracion` —la config del
 * VENDEDOR: turnos, repartidores, recursos, facturación— y su voz dice
 * «Precios, horarios y cobertura», que en esta casa es vocabulario de
 * SERVICIOS. Un veterinario sin tienda lo lee como su taller.
 *
 * EL DISCRIMINADOR: si el enlace aparece para una cuenta **sin tienda**,
 * queda probado que no es transitorio ni de estado — es de audiencia.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-repro/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = process.env.CUENTA || leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE || leer('EXPO_PUBLIC_DEMO_PASSWORD');
const SUFIJO = process.env.SUFIJO ? `-${process.env.SUFIJO}` : '';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

await page.goto('http://localhost:8081/verificacion/alta?paso=oferta', {
  waitUntil: 'networkidle',
  timeout: 180000,
});
await page.waitForTimeout(7000);
await page.evaluate(() => {
  for (const d of Array.from(document.querySelectorAll('div')))
    if (d.scrollHeight > d.clientHeight + 40) d.scrollTop = d.scrollHeight;
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${DIR}01-paso2${SUFIJO}.png` });

const texto = await page.locator('body').innerText();
const hayCta = texto.includes('Quiero vender productos');
const enRevision = /revisando|En revisión/i.test(texto);
const esVendedora = !hayCta && !enRevision;

/* 🔴 SE MIDE EL DESTINO, NO LA ETIQUETA — y esto lo corrigió una corrida:
   tras la cura el instrumento SEGUÍA EN ROJO porque buscaba el texto «El
   detalle de tu oferta», que ahora es la voz CORRECTA del enlace de
   servicios. *Un rojo por la razón equivocada está tan roto como un verde
   por la razón equivocada* — y este pedía revertir una cura buena. */
const enlace = page.getByText(/El detalle de tu (oferta|tienda)/).first();
let destino = '(no hay enlace)';
if ((await enlace.count()) > 0) {
  await enlace.click();
  await page.waitForTimeout(4000);
  destino = new URL(page.url()).pathname;
  await page.screenshot({ path: `${DIR}02-destino${SUFIJO}.png` });
}

console.log(`\ncuenta: ${EMAIL}`);
console.log(`  ¿es vendedora aprobada?  → ${esVendedora ? 'SÍ' : 'NO (o solo la pidió)'}`);
console.log(`  el enlace lleva a        → ${destino}`);

const aVentas = destino.startsWith('/ventas');
if (!esVendedora && aVentas) {
  console.log('\n🔴 REPRODUCIDO: sin la naturaleza aprobada, el enlace lleva a la config del VENDEDOR.\n');
  process.exitCode = 1;
} else if (esVendedora && aVentas) {
  console.log('\n✓ vendedora aprobada → su config. Correcto.\n');
} else if (!esVendedora && !aVentas) {
  console.log('\n✓ sin tienda → NO lo manda a la config del vendedor. Curado.\n');
} else {
  console.log('\n⚠️ vendedora aprobada pero el enlace NO va a su config — mirar.\n');
  process.exitCode = 1;
}

await browser.close();
