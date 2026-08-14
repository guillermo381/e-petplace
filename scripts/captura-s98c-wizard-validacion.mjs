/**
 * captura-s98c-wizard-validacion.mjs — EL DISCRIMINADOR DE LA CURA ①
 * («Guardar» muere · Continuar VALIDA y guarda, firma del 14-ago).
 *
 * No fotografía una pantalla: **fotografía que la puerta rechaza.** Un
 * paso donde Continuar valida se ve idéntico a uno donde Continuar avanza
 * a ciegas — la única diferencia visible es lo que pasa con un nombre
 * malo, y por eso la foto se toma DESPUÉS de escribir uno.
 *
 * Guion: borrar el nombre → escribir «A» (un carácter no es un nombre) →
 * Continuar. Se espera: la voz EN EL CAMPO y el wizard SIN AVANZAR.
 *
 * Salida: `scripts/capturas/s98-c-atender/`. Credencial de `.env.local`.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-atender/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = leer('EXPO_PUBLIC_DEMO_PASSWORD');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(8000);

await page.goto('http://localhost:8081/verificacion/alta', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(4000);

// Un nombre de UN carácter — el caso literal de la firma.
const campo = page.getByLabel(/Nombre del negocio/i).first();
await campo.fill('A');
await page.getByText('Continuar', { exact: true }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${DIR}04-validacion-en-el-campo.png` });
console.log('✓ 04-validacion-en-el-campo.png');

// EL DISCRIMINADOR, y sin él la foto no prueba nada: que la voz aparezca
// no alcanza — hay que probar que NO AVANZÓ. Si el wizard hubiera pasado
// al paso ②, el título sería otro.
const sigueEnPaso1 = (await page.getByText('El nombre con el que las familias te van a encontrar.').count()) > 0;
console.log(sigueEnPaso1 ? '✓ NO avanzó: sigue en el paso ①' : '✗ AVANZÓ con un nombre inválido');

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`, errores);
  process.exit(1);
}
if (!sigueEnPaso1) process.exit(1);
console.log('✓ sin errores JS');
