/**
 * captura-s97d-lote.mjs — el LOTE de S97-D en capturas.
 *
 * ① EL HOY como UNA sola línea (la banda «En la puerta» ya no re-dibuja
 *   citas que la línea muestra).
 * ② LA HOJA DEL MIEMBRO con su cuarto bloque: el toggle Administrador,
 *   y su aviso de §6 (placeholder DECLARADO — se ve que lo es).
 *
 * Server: expo web del prestador en :8082 (8081 es de C). Sesión por UI (la clave
 * sale del KEYCHAIN, jamás hardcodeada en un script
 * commiteado — patrón `captura-s89b-gate-campana`).
 *
 * ⚠️ CON LA ESCALA N1 NUEVA (`b365705f`: sm 14 · base 16 · md 20). Las seis
 * capturas anteriores son de la escala vieja y NO valen — *un gate con el
 * árbol viejo no falla: miente.*
 *
 * CUENTA: `guillo381+duenovet` (Clínica S97), que es la que TIENE el
 * discriminador — 3 citas hoy, una con llegada registrada. La clave sale
 * del **keychain** (`epetplace-siembra-s97`), jamás del script.
 *
 * ⚠️ LO QUE ESTE GUION **NO** PUEDE PROBAR, medido y no supuesto: **la FILA
 * DE DESPACHO no tiene HOY ningún actor que pueda verla.** Las tres cuentas
 * con pedidos vivos (`nuevotest2`, `vendedorpuro`, `duenodes`) tienen
 * `es_prestador = 0` — son vendedores puros, y **el puro no pasa por el tab
 * HOY** (entra por la raíz). La fila exige alguien que sea prestador **y**
 * tenga pedidos vivos, y esa población no está sembrada. No es un defecto
 * de la fila: es una puerta sin población.
 *
 * Salida: scripts/capturas/s97-d-lote/.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const DIR = new URL('./capturas/s97-d-lote/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const EMAIL = 'guillo381+duenovet@gmail.com';
// La clave vive en el keychain del founder, no en el repo ni en el env.
const PASS = execFileSync('security', ['find-generic-password', '-s', 'epetplace-siembra-s97', '-w'])
  .toString()
  .trim();

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1400 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

// ── ① EL HOY ────────────────────────────────────────────────────────────
await page.goto('http://localhost:8082/', { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${DIR}01-hoy-techo.png`, fullPage: false });
console.log('✓ 01-hoy-techo.png');
await page.mouse.wheel(0, 900);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${DIR}02-hoy-linea.png`, fullPage: false });
console.log('✓ 02-hoy-linea.png');

// ── ② LA HOJA DEL MIEMBRO ───────────────────────────────────────────────
await page.goto('http://localhost:8082/negocio/equipo', { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${DIR}03-equipo-lista.png`, fullPage: false });
console.log('✓ 03-equipo-lista.png');

/* El miembro que NO es el titular. La primera versión de este guion buscaba
   por texto de rol y cayó en la fila del DUEÑO — y la captura lo mostró:
   `abrirMiembro` sale temprano para el titular (`roles.includes('dueño')`),
   así que la Hoja abre sin ningún bloque de rol. No es un defecto de la
   pantalla: el titular no se administra a sí mismo. El guion apunta ahora
   al miembro por NOMBRE, que es lo que discrimina. */
/* ⚠️ EL NOMBRE SE TOMA DE LO QUE LA PANTALLA MUESTRA, no de la columna que
   uno supone: consulté `profiles.nombre` y devolvió «Guillo», pero la lista
   dibuja «Vet Cuatro Pruebas» — otra fuente. El guion buscaba un texto que
   no existía en pantalla y reportó «0 filas», que se lee como «no hay
   miembros». Medir la tabla equivocada da un cero igual de convincente que
   el verdadero. */
const CASOS = [
  // apagado ⇒ captura el aviso de DAR, que es el del placeholder
  { nombre: 'Vet Cuatro Pruebas', slug: 'apagado' },
  // ya administrador ⇒ captura el toggle ENCENDIDO y el aviso de QUITAR
  { nombre: 'Admin Vet Pruebas', slug: 'encendido' },
];

for (const caso of CASOS) {
  await page.goto('http://localhost:8082/negocio/equipo', { waitUntil: 'networkidle', timeout: 240000 });
  await page.waitForTimeout(5000);
  const fila = page.getByText(caso.nombre, { exact: true });
  if ((await fila.count()) === 0) {
    console.log(`⚠️ no se encontró la fila «${caso.nombre}»`);
    continue;
  }
  await fila.first().click();
  await page.waitForTimeout(3500);
  // bajar DENTRO de la Hoja (su scroll es propio: el mouse tiene que estar
  // sobre ella, no sobre la pantalla de atrás)
  await page.mouse.move(210, 1150);
  for (let i = 0; i < 7; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${DIR}04-bloque-admin-${caso.slug}.png`, fullPage: false });
  console.log(`✓ 04-bloque-admin-${caso.slug}.png`);

  // el aviso §6: tocar el toggle ABRE la pregunta, NO ejecuta
  const toggle = page.getByRole('switch', { name: 'Administrador' }).first();
  if ((await toggle.count()) > 0) {
    await toggle.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${DIR}05-aviso-${caso.slug}.png`, fullPage: false });
    console.log(`✓ 05-aviso-${caso.slug}.png`);
  } else {
    console.log(`⚠️ toggle Administrador no hallado en «${caso.nombre}»`);
  }
}

/* ═══ ③ EL RECORTE A 3× — el paso que la mesa canonizó como patrón del gate
   visual (S97-D), y por eso vive ACÁ y no en un script temporal.

   POR QUÉ EXISTE, con su caso: la fila de 11:30 se veía "cortada" en la
   captura de ancho completo, y **desde esa miniatura no se puede distinguir
   TRUNCADO de SOLAPAMIENTO** — dos defectos que se parecen y tienen curas
   distintas. Reportar el equivocado manda a curar anchos cuando lo que se
   pisa son capas. El recorte a densidad 3× fue lo que los separó.

   ⚠️ Se corre SIEMPRE, no solo cuando algo se ve mal: la evidencia de que
   una fila está BIEN también necesita esta resolución — si no, un verde
   sale de una miniatura, que es de donde salió el diagnóstico equivocado. */
const ctxZoom = await browser.newContext({
  locale: 'es-EC',
  viewport: { width: 420, height: 1400 },
  deviceScaleFactor: 3,
});
const zoom = await ctxZoom.newPage();
await zoom.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
await zoom.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await zoom.locator('input[type="password"]').fill(PASS);
await zoom.getByText('Entrar', { exact: true }).click();
await zoom.waitForTimeout(9000);
await zoom.goto('http://localhost:8082/', { waitUntil: 'networkidle', timeout: 240000 });
await zoom.waitForTimeout(6000);

// Las dos filas del discriminador: la de subtítulo que ENVUELVE (09:00) y la
// de subtítulo de UNA línea larga (11:30). La comparación entre ambas es la
// pista, así que se capturan las dos — una sola no dice nada.
for (const [sujeto, slug] of [['Thor', '0900'], ['Zeus', '1130']]) {
  const fila = zoom.getByText(sujeto, { exact: true }).first();
  if ((await fila.count()) === 0) {
    console.log(`⚠️ no se halló la fila de ${sujeto} para el recorte`);
    continue;
  }
  await fila.scrollIntoViewIfNeeded();
  await zoom.waitForTimeout(800);
  const caja = await fila.boundingBox();
  await zoom.screenshot({
    path: `${DIR}06-zoom-fila-${slug}.png`,
    clip: { x: 0, y: Math.max(0, caja.y - 70), width: 420, height: 190 },
  });
  console.log(`✓ 06-zoom-fila-${slug}.png`);
}

console.log(`errores JS: ${errores.length === 0 ? 'ninguno' : errores.slice(0, 3).join(' | ')}`);
await browser.close();
