/**
 * verify-s99d-olas-vendedor-puro.mjs — CARRIL R (§8) DEL LOTE L1.
 *
 * `PLAN_S99` §7: *«cada gate incluye el número de Carril R de sus pantallas
 * contra la línea base»*, y N16 pone la vara. **Esto NO es esa vara**: N16
 * mide segundos en aparato real, y el aparato está bloqueado (el teléfono no
 * se desbloquea — medición de C). Lo que esto mide es lo que sí se puede
 * medir sin aparato y es la causa que S94-PERF nombró: **cuántas PETICIONES
 * paga el vendedor puro para entrar, y cuántas de ellas están encadenadas.**
 *
 * *No hay consultas que optimizar, hay viajes que eliminar* (L-223): el
 * peaje es la petición, y lo que se paga en reloj es la CADENA. El prólogo
 * del guard raíz es el caso que D-738 midió en 622 ms.
 *
 * Cuenta las peticiones a PostgREST desde el login hasta que la barra está
 * en pantalla, agrupadas por tabla/RPC, y **marca las repetidas** — una
 * misma lectura dos veces en el mismo arranque es una cadena que se puede
 * cortar, no un dato que haga falta dos veces.
 *
 * Uso:  node scripts/verify-s99d-olas-vendedor-puro.mjs [--puerto 8084]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8084')}`;
const EMAIL = process.env.CUENTA || 'guillo381+duenodes@gmail.com';
const CLAVE =
  process.env.CLAVE ||
  execFileSync('security', ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'])
    .toString()
    .trim();

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

/** Nombre corto de la lectura: la tabla de REST o la función de RPC. */
function etiqueta(url) {
  const m = url.match(/\/rest\/v1\/(rpc\/)?([a-z0-9_]+)/i);
  return m ? (m[1] ? `rpc:${m[2]}` : m[2]) : null;
}

let contando = false;
const secuencia = [];
page.on('request', (r) => {
  if (!contando) return;
  const e = etiqueta(r.url());
  if (e !== null) secuencia.push(e);
});

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(CLAVE);
contando = true; // desde el toque de Entrar: el prólogo entero entra a la cuenta
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(12000);
contando = false;
await browser.close();

const conteo = new Map();
for (const e of secuencia) conteo.set(e, (conteo.get(e) ?? 0) + 1);
const repetidas = [...conteo.entries()].filter(([, n]) => n > 1);

console.log(`\nCARRIL R · L1 · entrada del vendedor puro (RN-web, NO aparato — L-153)\n`);
console.log(`peticiones a PostgREST hasta la barra: ${secuencia.length}`);
console.log(`lecturas distintas: ${conteo.size}`);
console.log(`\nsecuencia (en orden):`);
secuencia.forEach((e, i) => console.log(`  ${String(i + 1).padStart(2)}. ${e}`));
if (repetidas.length > 0) {
  console.log(`\n🔁 REPETIDAS en un solo arranque — cada una es una cadena que se puede cortar:`);
  for (const [e, n] of repetidas) console.log(`   · ${e} × ${n}`);
} else {
  console.log(`\n✅ ninguna lectura se repite en el arranque.`);
}
console.log(
  `\n⚠️ Esto mide VIAJES, no segundos. La vara de N16 (<1 s caliente · <2 s frío)\n` +
    `   se mide en aparato real y hoy está bloqueada: el teléfono no se desbloquea.\n`,
);
