/**
 * captura-s98c-corte.mjs — EL FORMULARIO «AGREGAR CORTE» (S98-C).
 *
 * Firma del founder, campo por campo: nombre con placeholder nativo gris
 * («En la mañana») · hora de corte con ⓘ que abre modal · franja de entrega
 * con desde y hasta en UNA fila.
 *
 * 🔴 LO QUE ESTA FOTO **NO** MUESTRA, y se dice para que nadie lo lea como
 * omisión: **los chips de días y el toggle de festivos NO están montados.**
 * La tabla ya tiene las columnas (`dias_semana` · `incluye_festivos`) pero
 * `definir_turno_entrega` no las toma — montarlos sería un control que se
 * guarda y vuelve apagado. Contrato a A enviado; el hueco vive declarado en
 * la cabecera de `ventas/configuracion.tsx`.
 *
 * 🔴 EL GUARD QUE NO SE NEGOCIA (heredado de mis instrumentos previos):
 * **si la sesión no abrió, ABORTA en vez de sacar la foto.** Un script que
 * fotografía la bienvenida e imprime «✓» está certificando el login fallido.
 * Y el discriminador NO mira el CTA que abre la Hoja —esa heurística ya me
 * rompió un instrumento EN VERDE cuando cambié la superficie—: mira que el
 * campo del propio formulario esté en pantalla.
 *
 * Cuenta: `duenotodo` (dual, tienda activa). Clave del keychain.
 *   CUENTA / CLAVE la pisan.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DIR = new URL('./capturas/s98-c-corte/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const EMAIL = process.env.CUENTA || 'guillo381+duenotodo@gmail.com';
const PASS =
  process.env.CLAVE ||
  execSync('security find-generic-password -a siembra -s epetplace-siembra-s97 -w', {
    encoding: 'utf8',
  }).trim();

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errores = [];

async function abrir(tema) {
  const ctx = await browser.newContext({
    locale: 'es-EC',
    viewport: { width: 420, height: 900 },
    colorScheme: tema,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errores.push(`[${tema}] ${e}`));

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
  return { ctx, page };
}

const { ctx, page } = await abrir('light');

// ── DISCRIMINADOR 1: ¿la pantalla de configuración abrió de verdad?
const enConfig = (await page.getByText('Cortes horarios', { exact: false }).count()) > 0;
if (!enConfig) {
  console.error('✗ ABORTA: no llegué a /ventas/configuracion (¿la sesión no abrió?).');
  console.error('  Nada de lo que fotografíe acá mide el formulario.');
  await browser.close();
  process.exit(1);
}

await page.screenshot({ path: `${DIR}00-config-cortes.png`, fullPage: true });

// Abrir la Hoja del corte.
await page.getByText('Agregar corte', { exact: false }).first().click();
await page.waitForTimeout(2500);

// ── DISCRIMINADOR 2: mido el FORMULARIO, no el botón que lo abre.
const campoNombre = page.getByPlaceholder('En la mañana');
if ((await campoNombre.count()) === 0) {
  console.error('✗ ABORTA: la Hoja no montó el campo del nombre con su placeholder.');
  await browser.close();
  process.exit(1);
}

await page.screenshot({ path: `${DIR}01-hoja-corte-vacia.png` });

// El placeholder DESAPARECE al escribir (comportamiento nativo): se prueba.
await campoNombre.fill('En la mañana');
await page.waitForTimeout(600);
await page.screenshot({ path: `${DIR}02-hoja-corte-escrita.png` });

// El ⓘ abre su modal — y el corte NO pierde lo tipeado.
await page.getByLabel('Qué significa la hora de corte').click();
await page.waitForTimeout(2000);
await page.screenshot({ path: `${DIR}03-modal-hora-de-corte.png` });

const textoModal = await page
  .getByText('te comprometes a entregarlos', { exact: false })
  .count();

await ctx.close();

// Oscuro, con la Hoja abierta.
const osc = await abrir('dark');
if ((await osc.page.getByText('Cortes horarios', { exact: false }).count()) > 0) {
  await osc.page.getByText('Agregar corte', { exact: false }).first().click();
  await osc.page.waitForTimeout(2500);
  await osc.page.screenshot({ path: `${DIR}04-hoja-corte-oscuro.png` });
}
await osc.ctx.close();
await browser.close();

console.log(`ⓘ abre su modal y el literal aparece: ${textoModal > 0 ? 'SÍ' : 'NO'}`);
console.log(`errores JS: ${errores.length}`);
for (const e of errores) console.log('  ' + e);
console.log(`capturas en ${DIR}`);
if (textoModal === 0) process.exit(1);
