/**
 * verify-s98c-telefono-repartidor.mjs — LA CURA, POR EL CAMINO REAL.
 *
 * EL ROJO, ya reproducido en SQL (in-txn, ROLLBACK, residuo 0):
 *   `0988888888`     → RECHAZADO por `repartidores_telefono_check`
 *   `+593988888888`  → ENTRA
 * y `registrar_repartidor` NO normaliza (medido en su cuerpo): inserta lo que
 * le den. ⇒ el alta mandaba lo tipeado crudo y el vendedor recibía el texto de
 * un CHECK de Postgres.
 *
 * ESTO mide la otra mitad, la que el SQL no puede: **que la PANTALLA componga**.
 * Se tipea un número nacional como lo tipearía un vendedor en Ecuador y se
 * exige que la fila nazca en E.164.
 *
 * ⚠️ ESTE INSTRUMENTO ESCRIBE. Deja su marca en el documento y **borra al
 * final verificando residuo 0** — una sonda que deja basura contamina la
 * medición del que venga después (L-234).
 */
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const DOC = 'S98C-VERIFY-TEL-0001';
/* EL PAR DISCRIMINADOR. La primera versión de este archivo esperaba que
   `0988777666` se guardara como `+593988777666` — **y su rojo encontró el
   defecto de MI PROPIA CURA**: salía `+5930988777666`, con el `0` de tránsito
   adentro, y el CHECK lo aceptaba. Así que la expectativa cambió, no el
   instrumento: con el `0`, la puerta tiene que FRENAR; sin el `0`, guardar. */
const CON_CERO = '0988777666'; // como se escribe en Ecuador → debe FRENAR
const SIN_CERO = '988777666'; // el nacional sin tránsito → debe GUARDAR
const ESPERADO = '+593988777666';

const EMAIL = process.env.CUENTA || 'guillo381+duenotodo@gmail.com';
const PASS =
  process.env.CLAVE ||
  execSync('security find-generic-password -a siembra -s epetplace-siembra-s97 -w', {
    encoding: 'utf8',
  }).trim();

const sql = (texto) => {
  const f = `/tmp/s98c-tel-${Date.now()}.sql`;
  writeFileSync(f, texto);
  const out = execSync(
    `npx supabase --experimental db query --linked --file ${f} 2>/dev/null`,
    { encoding: 'utf8', cwd: new URL('..', import.meta.url).pathname },
  );
  return JSON.parse(out.match(/(\[[\s\S]*\])/)[1]);
};

// Limpieza previa: si una corrida anterior murió, no arrastramos su fila.
sql(`DELETE FROM repartidores WHERE documento = '${DOC}';`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
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

async function abortar(porque) {
  console.error(`✗ ABORTA SIN VEREDICTO: ${porque}`);
  sql(`DELETE FROM repartidores WHERE documento = '${DOC}';`);
  await browser.close();
  process.exit(2);
}

if ((await page.getByText('Repartidores', { exact: false }).count()) === 0) {
  await abortar('no llegué a /ventas/configuracion');
}

// El literal se LEYÓ del diccionario, no se supuso: `repartidorNuevoCta`.
await page.getByText('Registrar repartidor', { exact: false }).first().click();
await page.waitForTimeout(2500);

const tel = page.getByPlaceholder('99 123 4567');
if ((await tel.count()) === 0) await abortar('el campo de teléfono con indicativo no montó');

// El indicativo tiene que estar A LA VISTA antes de tipear: si el vendedor no
// lo ve, no sabe con qué se va a componer su número.
const prefijoVisible = (await page.getByText('+593', { exact: false }).count()) > 0;

await page.getByLabel('Nombre', { exact: false }).first().fill('VERIFY S98C');
await page.getByLabel('Documento', { exact: false }).first().fill(DOC);

// ── BRAZO A · CON el 0 de tránsito: la puerta tiene que FRENAR ──────────
await tel.fill(CON_CERO);
await page.waitForTimeout(900);
const vozDirige = (await page.getByText('Un número de', { exact: false }).count()) > 0;
/* ⚠️ NO se hace click: el CTA queda DESHABILITADO, y ésa es la forma correcta
   de frenar (la puerta no ofrece lo que va a rechazar). La primera versión de
   este brazo intentaba clickear y moría por timeout — el instrumento estaba
   midiendo con la expectativa vieja, no la superficie con el defecto. */
const cta = page.getByText('Guardar', { exact: true }).last();
const ctaApagado = await cta.isDisabled().catch(() => false);
const traficoConCero = sql(
  `SELECT count(*)::int AS n FROM repartidores WHERE documento = '${DOC}';`,
)[0].n;
const brazoA = traficoConCero === 0 && vozDirige && ctaApagado;

// ── BRAZO B · SIN el 0: guarda, y en E.164 ──────────────────────────────
await tel.fill(SIN_CERO);
await page.waitForTimeout(900);
await page.getByText('Guardar', { exact: true }).last().click();
await page.waitForTimeout(6000);

const filas = sql(`SELECT telefono FROM repartidores WHERE documento = '${DOC}';`);
const guardado = filas[0]?.telefono ?? null;

// Limpieza + residuo.
sql(`DELETE FROM repartidores WHERE documento = '${DOC}';`);
const residuo = sql(
  `SELECT count(*)::int AS n FROM repartidores WHERE documento = '${DOC}';`,
)[0].n;

await browser.close();

const brazoB = guardado === ESPERADO;
console.log('── verify-s98c-telefono-repartidor ──');
console.log(`A · con el 0 de tránsito (${CON_CERO}) FRENA : ${brazoA ? 'VERDE' : 'ROJO'}`);
console.log(
  `      filas creadas=${traficoConCero} (debe ser 0) · la voz dirige=${vozDirige ? 'SÍ' : 'NO'} · CTA apagado=${ctaApagado ? 'SÍ' : 'NO'}`,
);
console.log(`B · sin el 0 (${SIN_CERO}) guarda en E.164 .: ${brazoB ? 'VERDE' : 'ROJO'}`);
console.log(`      guardado=${JSON.stringify(guardado)} · esperado=${ESPERADO}`);
console.log(`el indicativo se VE antes de tipear ........: ${prefijoVisible ? 'SÍ' : 'NO'}`);
console.log(`residuo tras limpiar .......................: ${residuo} (debe ser 0)`);
console.log(`errores JS: ${errores.length}`);
for (const e of errores) console.log('  ' + e);

if (!brazoA || !brazoB || !prefijoVisible || residuo !== 0) {
  console.error('ROJO');
  process.exit(1);
}
console.log('VERDE — los dos brazos: frena lo que la fuente aceptaría MAL, y guarda E.164.');
