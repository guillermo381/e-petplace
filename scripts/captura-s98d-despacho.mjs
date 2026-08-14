/**
 * captura-s98d-despacho.mjs — EL LOTE 2 DE S98-D, en capturas.
 *
 * Extiende el circuito de `captura-s97d-lote.mjs` a la cuenta que por fin
 * TIENE la población que aquella no tenía. Su §"lo que este guion NO puede
 * probar" decía, medido: *«la fila de despacho no tiene hoy ningún actor
 * que pueda verla — las tres cuentas con pedidos vivos tienen
 * es_prestador = 0»*. **Eso dejó de ser cierto**: A sembró
 * `guillo381+duenotodo` = «Todo S97 (borrable)», cuenta con los DOS roles
 * activos (`prestador_servicios` + `seller_productos`) y prestador propio,
 * con el pedido vivo `P-20260814-355fa6` (`despacho`, no terminal).
 *
 * ⚠️ LA TRAMPA DE FECHA, MEDIDA ANTES DE CAPTURAR (y no después de leer mal
 * una imagen): la promesa de entrega del pedido es **2026-08-14 19:00Z =
 * 14-ago 14:00 local**, y la máquina corre el **13-ago**. La línea filtra
 * por `diaLocalDeIso(promesa_desde) === diaVista`, así que **en el HOY de
 * hoy la fila NO monta, y eso es CORRECTO** — hay que correr la rueda a
 * +1. Sin esta nota, una captura vacía se lee como «la fila está rota».
 *
 * Este guion NO mide: el veredicto de colisión es de
 * `verify-colision-fila.mjs`, que pregunta por las DOS geometrías sobre la
 * misma fila. Dos instrumentos que contestan la misma pregunta con
 * distinta geometría divergen — la medición vive en un solo lugar.
 *
 * De paso captura el módulo «Prepará tu espacio» de ESTA cuenta, que es el
 * caso de DOS oficios (el N>1 declarado en la cura del Lote 2 ①).
 *
 * Server: expo web del prestador en :8082 (8081 es de C).
 * Salida: scripts/capturas/s98-d-despacho/.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const DIR = new URL('./capturas/s98-d-despacho/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const EMAIL = 'guillo381+duenotodo@gmail.com';
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

// ── ① EL HOY de hoy — la fila NO debe estar (la promesa es de mañana) ────
await page.goto('http://localhost:8082/', { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForTimeout(7000);
await page.screenshot({ path: `${DIR}01-hoy-techo.png`, fullPage: false });
console.log('✓ 01-hoy-techo.png');

// «Prepará tu espacio» de esta cuenta: DOS oficios ⇒ el caso N>1.
await page.mouse.wheel(0, 700);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${DIR}02-prepara-espacio.png`, fullPage: false });
console.log('✓ 02-prepara-espacio.png');

// ── ② LA RUEDA A +1: el día donde el despacho SÍ vive ────────────────────
const objetivo = process.env.DIA_DESPACHO ?? '2026-08-14';
const dia = new Date(`${objetivo}T12:00:00`);
// La rueda rotula por día de semana + número; se busca por el número.
const etiquetaDia = String(dia.getDate());
await page.mouse.wheel(0, -900);
await page.waitForTimeout(800);
const chip = page.getByText(etiquetaDia, { exact: true }).first();
if (await chip.count()) {
  await chip.click();
  await page.waitForTimeout(3500);
}
await page.screenshot({ path: `${DIR}03-dia-del-despacho.png`, fullPage: false });
console.log('✓ 03-dia-del-despacho.png');

await page.mouse.wheel(0, 900);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${DIR}04-fila-despacho.png`, fullPage: false });
console.log('✓ 04-fila-despacho.png');

// El recorte a 3× de la fila, para el ojo (NO para el veredicto).
const fila = page.getByText(/P-2026\d{4}-[0-9a-f]{6}/).first();
if (await fila.count()) {
  const caja = await fila.boundingBox();
  if (caja) {
    await page.screenshot({
      path: `${DIR}05-fila-despacho-3x.png`,
      clip: {
        x: Math.max(0, caja.x - 20),
        y: Math.max(0, caja.y - 44),
        width: Math.min(420, caja.width + 200),
        height: caja.height + 96,
      },
      scale: 'css',
    });
    console.log('✓ 05-fila-despacho-3x.png');
  }
} else {
  console.log('⚠️  NO se encontró el número de orden en pantalla — ver 04 antes de concluir nada.');
}

if (errores.length) console.log('pageerror:', errores.slice(0, 3));
console.log(`\nCapturas en ${DIR}`);
await browser.close();
