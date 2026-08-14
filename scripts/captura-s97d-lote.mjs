/**
 * captura-s97d-lote.mjs — el LOTE de S97-D en capturas.
 *
 * ① EL HOY como UNA sola línea (la banda «En la puerta» ya no re-dibuja
 *   citas que la línea muestra).
 * ② LA HOJA DEL MIEMBRO con su cuarto bloque: el toggle Administrador,
 *   y su aviso de §6 (placeholder DECLARADO — se ve que lo es).
 *
 * Server: expo web del prestador en :8081. Sesión demo por UI (la clave
 * viaja por env desde `.env.local`, jamás hardcodeada en un script
 * commiteado — patrón `captura-s89b-gate-campana`).
 *
 * ⚠️ LO QUE ESTE GUION **NO** PUEDE PROBAR, y se declara acá para que la
 * ausencia no se lea como verde: la cuenta demo (Paseos Andrés) tiene
 * HOY **0 llegadas** y **0 pedidos**, así que el CHIP de puerta y la
 * FILA DE DESPACHO —los dos habitantes nuevos de la línea— no tienen
 * dato que los haga aparecer. Sus discriminadores viven en Clínica S97
 * (`duenovet`) y en las cuentas vendedoras, cuyas claves esta pista no
 * tiene. Se captura lo que existe; lo que no, se dice.
 *
 * Salida: scripts/capturas/s97-d-lote/.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s97-d-lote/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

// La clave sale del .env.local del app (gitignored), no del script.
const env = readFileSync(
  new URL('../apps/prestador/.env.local', import.meta.url).pathname,
  'utf8',
);
const leer = (k) => env.split('\n').find((l) => l.startsWith(`${k}=`))?.slice(k.length + 1).trim() ?? '';
const EMAIL = leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = leer('EXPO_PUBLIC_DEMO_PASSWORD');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1400 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 240000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

// ── ① EL HOY ────────────────────────────────────────────────────────────
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${DIR}01-hoy-techo.png`, fullPage: false });
console.log('✓ 01-hoy-techo.png');
await page.mouse.wheel(0, 900);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${DIR}02-hoy-linea.png`, fullPage: false });
console.log('✓ 02-hoy-linea.png');

// ── ② LA HOJA DEL MIEMBRO ───────────────────────────────────────────────
await page.goto('http://localhost:8081/negocio/equipo', { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${DIR}03-equipo-lista.png`, fullPage: false });
console.log('✓ 03-equipo-lista.png');

/* El miembro que NO es el titular. La primera versión de este guion buscaba
   por texto de rol y cayó en la fila del DUEÑO — y la captura lo mostró:
   `abrirMiembro` sale temprano para el titular (`roles.includes('dueño')`),
   así que la Hoja abre sin ningún bloque de rol. No es un defecto de la
   pantalla: el titular no se administra a sí mismo. El guion apunta ahora
   al miembro por NOMBRE, que es lo que discrimina. */
const filas = page.getByText('Guillermo', { exact: false });
const n = await filas.count();
console.log(`filas del miembro no-titular: ${n}`);
if (n > 0) {
  await filas.first().click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${DIR}04-hoja-miembro-top.png`, fullPage: false });
  console.log('✓ 04-hoja-miembro-top.png');
  // bajar hasta el cuarto bloque
  // bajar DENTRO de la Hoja (su scroll es propio: el mouse tiene que estar
  // sobre ella, no sobre la pantalla de atrás)
  await page.mouse.move(210, 1150);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${DIR}05-hoja-bloque-admin.png`, fullPage: false });
  console.log('✓ 05-hoja-bloque-admin.png');
  // el aviso §6: encender el toggle abre la pregunta (NO ejecuta)
  const toggle = page.getByRole('switch', { name: 'Administrador' }).first();
  if ((await toggle.count()) > 0) {
    await toggle.click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${DIR}06-aviso-placeholder.png`, fullPage: false });
    console.log('✓ 06-aviso-placeholder.png (el placeholder tiene que VERSE como placeholder)');
  } else {
    console.log('⚠️ el toggle Administrador no se encontró por su etiqueta accesible');
  }
}

console.log(`errores JS: ${errores.length === 0 ? 'ninguno' : errores.slice(0, 3).join(' | ')}`);
await browser.close();
