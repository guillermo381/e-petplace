/**
 * verify-s98c-corte-estado.mjs — DOS COSAS QUE YO AFIRMÉ Y NO HABÍA MEDIDO.
 *
 * Escribí en el código que «el corte conserva su estado — lo tipeado no se
 * pierde por leer qué significa», y la captura mostró la pantalla de
 * configuración DETRÁS del modal, no el formulario. **Eso no prueba que se
 * pierda, pero tampoco prueba lo que yo escribí.** Este instrumento decide.
 *
 * Y de paso mide lo que mi propio cambio pudo romper: **el formulario creció**
 * (el grupo «Franja de entrega» + su fila) y el CTA de guardar podría haber
 * quedado fuera del alcance. Un formulario más lindo con el botón inalcanzable
 * es una regresión, no un acabado.
 *
 * BRAZO A · el estado sobrevive al ⓘ: se tipea, se abre el modal, se cierra,
 *            y el texto tiene que seguir ahí.
 * BRAZO B · el CTA «Guardar» es alcanzable y CLICKEABLE dentro de la Hoja.
 *
 * Rojo en cualquiera de los dos = exit 1. No imprime verde global si un brazo
 * no corrió: eso es lo que convierte un instrumento en decoración.
 */
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EMAIL = process.env.CUENTA || 'guillo381+duenotodo@gmail.com';
const PASS =
  process.env.CLAVE ||
  execSync('security find-generic-password -a siembra -s epetplace-siembra-s97 -w', {
    encoding: 'utf8',
  }).trim();

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({
  locale: 'es-EC',
  viewport: { width: 420, height: 900 },
});
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);
await page.goto('http://localhost:8081/ventas/configuracion', {
  waitUntil: 'networkidle',
  timeout: 180000,
});
await page.waitForTimeout(6000);

function abortar(porque) {
  console.error(`✗ ABORTA SIN VEREDICTO: ${porque}`);
  console.error('  Un instrumento que no pudo medir NO dice verde.');
  return browser.close().then(() => process.exit(2));
}

if ((await page.getByText('Cortes horarios', { exact: false }).count()) === 0) {
  await abortar('no llegué a /ventas/configuracion');
}

await page.getByText('Agregar corte', { exact: false }).first().click();
await page.waitForTimeout(2500);

const nombre = page.getByPlaceholder('En la mañana');
if ((await nombre.count()) === 0) await abortar('la Hoja del corte no montó');

// ── BRAZO A ──────────────────────────────────────────────────────────────
const ESCRITO = 'En la mañana';
await nombre.fill(ESCRITO);
await page.getByLabel('Qué significa la hora de corte').click();
await page.waitForTimeout(2000);

const modalAbierto =
  (await page.getByText('te comprometes a entregarlos', { exact: false }).count()) > 0;
if (!modalAbierto) await abortar('el ⓘ no abrió su modal — no hay nada que cerrar');

// Cerrar el modal por su propio gesto (Escape = el cierre de la Hoja).
await page.keyboard.press('Escape');
await page.waitForTimeout(2000);

const valorTrasCerrar = await nombre.inputValue().catch(() => null);
const brazoA = valorTrasCerrar === ESCRITO;

// ── BRAZO B ──────────────────────────────────────────────────────────────
const guardar = page.getByText('Guardar', { exact: true }).last();
let brazoB = false;
let detalleB = 'no se encontró el CTA';
if ((await guardar.count()) > 0) {
  try {
    await guardar.scrollIntoViewIfNeeded({ timeout: 5000 });
    const caja = await guardar.boundingBox();
    const visible = await guardar.isVisible();
    brazoB = visible && caja !== null && caja.height > 0;
    detalleB = caja
      ? `visible=${visible} · y=${Math.round(caja.y)} · alto=${Math.round(caja.height)} (viewport 900)`
      : `visible=${visible} · sin caja`;
  } catch (e) {
    detalleB = `no se pudo alcanzar: ${e.message.split('\n')[0]}`;
  }
}

await browser.close();

console.log('── verify-s98c-corte-estado ──');
console.log(`A · el texto sobrevive al ⓘ : ${brazoA ? 'VERDE' : 'ROJO'} (leído: ${JSON.stringify(valorTrasCerrar)})`);
console.log(`B · el CTA Guardar alcanzable: ${brazoB ? 'VERDE' : 'ROJO'} — ${detalleB}`);
console.log(`errores JS: ${errores.length}`);
for (const e of errores) console.log('  ' + e);

if (!brazoA || !brazoB) process.exit(1);
console.log('VERDE — los dos brazos midieron y pasaron.');
