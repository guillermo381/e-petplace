// Verificación runtime web S56-B (TAREA 3): el detalle de la cita muestra
// "A dónde ir" leyendo el snapshot D-339 de la FILA — camino NULL HONESTO
// contra la cita demo viva (cfce1d43, snapshot null: nació pre-D-339).
// ESTRICTAMENTE SOLO LECTURA: jamás se toca "Iniciar paseo" — esa cita es
// el wow del founder (pagada → cierre → ledger) y debe quedar INTACTA.
// Dev server prestador :8081.
// D-352: el detalle del prestador solo carga citas de HOY (index.tsx usa
// obtenerCitasPaseoDelDia(hoy)) — la fecha de la cita se LEE de la DB y
// si no es hoy el smoke lo dice honesto (exit 2 = precondición, no fallo).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { dbQuery, hoyLocal } from './lib-db.mjs';

const CITA_VIVA = 'cfce1d43-06f3-4081-9643-059c526e68ca';

const filas = dbQuery(`SELECT fecha::text AS fecha FROM evento_cita_servicio WHERE id='${CITA_VIVA}'`);
if (filas.length === 0) {
  console.log(`✗ PRECONDICIÓN: la cita viva ${CITA_VIVA} no existe en DB — el smoke no aplica.`);
  process.exit(2);
}
if (filas[0].fecha !== hoyLocal()) {
  console.log(
    `✗ PRECONDICIÓN (D-352): la cita viva es del ${filas[0].fecha} y hoy es ${hoyLocal()} — ` +
      `el detalle del prestador solo carga citas del día. NO es un fallo del producto: ` +
      `re-anclar la cita demo (o correr el día correcto) y volver a correr.`,
  );
  process.exit(2);
}

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
const esperar = async (frase, veces = 30) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// ── login real (D-290) ──
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Hoy', 30);

// ── detalle de la cita viva (SOLO LECTURA) ──
await page.goto(`http://localhost:8081/cita/${CITA_VIVA}`, { waitUntil: 'networkidle', timeout: 60000 });
const t = await esperar('A dónde ir', 30);
check(t.includes('A dónde ir'), 'T1 la sección "A dónde ir" vive en el detalle');
check(t.includes('Esta cita no tiene una dirección registrada.'), 'T2 snapshot null → voz honesta (cita pre-D-339)');
check(!t.includes('Abrir en el mapa'), 'T3 sin dato no se ofrece mapa');
check(t.includes('Iniciar paseo'), 'T4 el CTA de la cita sigue intacto (no se tocó)');

await browser.close();
console.log(fallos === 0 ? '\nTODO VERDE (4/4) — la cita viva quedó intacta' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
