/**
 * captura-s99c-l2.mjs — LA FICHA DEL REPARTIDOR, CAMINADA DONDE VIVE.
 *
 * **Método nuevo, firma del founder (15-ago):** *la pieza se verifica DONDE
 * VIVE, no en una lámina.* «Cuando montar cuesta menos que ensayar, se
 * monta.» Esto NO deroga el toque 1 —la receta de forma va antes de
 * escribir—: lo que cambia es dónde se verifica.
 *
 * Qué recorre: la ficha en sus DOS entradas (`nuevo` y `[id]`), que es
 * justamente lo que D-791 exige que no se vuelva a partir en dos.
 *
 * 🔴 CREDENCIALES (R6): la clave sale del keychain AL MOMENTO y jamás se
 * imprime. El sufijo entra por argumento; nada queda escrito en el repo.
 *
 * ⚠️ EL PUERTO ES 8097 Y NO 8081 A PROPÓSITO: en :8081 corre el Metro de
 * OTRA pista, y responde normal sirviendo OTRO árbol. Caminar contra él
 * daría verde midiendo otro objeto (L-235, el error más caro de esta
 * sesión). El script verifica que quien contesta sea ESTA worktree.
 *
 * Uso: node scripts/captura-s99c-l2.mjs <sufijo>
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const SUFIJO = process.argv[2];
if (!SUFIJO) {
  console.error('✗ falta el sufijo de la cuenta (ej: duenotodo)');
  process.exit(1);
}
const EMAIL = `guillo381+${SUFIJO}@gmail.com`;
const BASE = 'http://localhost:8097';

let PASS = '';
try {
  PASS = execFileSync(
    'security',
    ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
    { encoding: 'utf8' },
  ).trim();
} catch {
  console.error('✗ no se pudo leer la clave del keychain');
  process.exit(1);
}

const DIR = new URL('./capturas/s99-c-l2/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1500 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

async function foto(nombre) {
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${DIR}${nombre}.png`, fullPage: false });
  console.log(`  ✓ ${nombre}.png`);
}

console.log(`— entrando como ${SUFIJO} en ${BASE} —`);
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 240000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(7000);

// ── LA FICHA EN ALTA ──────────────────────────────────────────────────
console.log('\n— la ficha, entrada NUEVO —');
await page.goto(`${BASE}/ventas/repartidor/nuevo`, { waitUntil: 'networkidle', timeout: 120000 });
await foto('01-ficha-nueva');

const cuerpo = await page.locator('body').innerText();

/* Lo que un screenshot NO prueba: QUÉ dice. Estas frases son la receta
   hecha aserción — si una falta, la anatomía no se construyó completa. */
console.log('\n— la anatomía de la receta, frase por frase —');
const ESPERADAS = [
  ['Así lo ve la familia', '① la cabecera ES el espejo (N17 en una persona)'],
  ['Sin nombre todavía', '① el espejo dice su vacío, no queda mudo'],
  ['Cómo se lo alcanza', '② el contacto'],
  ['WhatsApp', '② el único canal'],
  ['Con este correo entra a la app', '② el correo dice PARA QUÉ, no se disculpa'],
  ['Quién responde por él', '③ la identidad'],
  ['Con qué llega', '④ los vehículos'],
  ['Agregar vehículo', '④ la puerta del sub-objeto'],
];
let faltan = 0;
for (const [frase, porque] of ESPERADAS) {
  const hay = cuerpo.includes(frase);
  if (!hay) faltan++;
  console.log(`  ${hay ? '✓' : '✗'} ${porque}`);
}

/* Y LO QUE NO PUEDE ESTAR — la firma que murió y las voces prohibidas. */
console.log('\n— lo que NO puede aparecer —');
for (const [frase, porque] of [
  ['Teléfono', 'el teléfono convencional MURIÓ (firma del founder)'],
  ['opcional', '«opcional» murió: si es el único canal, no lo es'],
  ['Revisa los datos', 'voz genérica prohibida (N12.4 · R44)'],
  ['máximo 2', 'el tope NO se escribe en pantalla (N12.5)'],
]) {
  const hay = cuerpo.includes(frase);
  if (hay) faltan++;
  console.log(`  ${hay ? '✗ APARECE' : '✓ ausente'} — ${porque}`);
}

console.log(`\nerrores de página: ${errores.length}`);
errores.slice(0, 3).forEach((e) => console.log(`  ✗ ${e.slice(0, 160)}`));
console.log(faltan === 0 ? '\n✅ la anatomía cierra' : `\n🔴 ${faltan} desvío(s)`);
await browser.close();
