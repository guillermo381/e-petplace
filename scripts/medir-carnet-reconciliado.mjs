/**
 * ⭐ **UNA REGLA, UNA PANTALLA** (S113-C · 1.2 · reconciliación).
 *
 * Con el carnet REAL del founder. Lo que mide, y por qué cada cosa:
 *  ① la fila **dice** qué le falta (antes la pantalla contaba y la fila callaba);
 *  ② el botón está apagado **con su razón a la vista** — el defecto del founder
 *    era justo eso: encendido, mudo y sin efecto;
 *  ③ el conteo del pie **coincide** con las filas marcadas. *Si discrepan,
 *    volvió a haber dos cuentas.*
 */
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const di = (s) => console.log(s);
const dir = join(homedir(), 'Downloads', 'carnets_muestra', 'Carnet_reales');
const carnet = join(dir, readdirSync(dir)[0]);

const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 140)));
page.on('response', async (r) => {
  if (!/extract-vacuna/.test(r.url())) return;
  const c = await r.text().catch(() => '(no pude leerlo)');
  /* Sólo las CLAVES de primer nivel y el largo: el cuerpo entero son miles de
     chars y lo que se busca es qué le falta al contrato. */
  let claves = '(no es JSON)';
  try { const o = JSON.parse(c); claves = Object.keys(o).map((k) => `${k}:${Array.isArray(o[k]) ? `array(${o[k].length})` : typeof o[k]}`).join(' · '); } catch { /* queda el literal */ }
  errores.push(`EDGE ${r.status()} · claves ⇒ ${claves}`);
  try {
    const o = JSON.parse(c);
    for (const [i, v] of (o.vacunas ?? []).entries()) {
      errores.push(`   fila ${i}: nombre=${JSON.stringify(v.nombre)} · precA=${JSON.stringify(v.fecha_aplicada_precision)} · precP=${JSON.stringify(v.fecha_proxima_precision)} · via=${JSON.stringify(v.via)} · conf=${JSON.stringify(v.confianza)} · evid=${JSON.stringify(v.evidencia)} · cubre=${JSON.stringify(v.cubre)} · dudosa=${JSON.stringify(v.dudosa)} · claves=${Object.keys(v).length}`);
    }
  } catch { /* nada */ }
});
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(16000);
di(`cuenta: ${CORREO} · carnet: ${carnet.split('/').pop()}`);

/* 🔴 **DIRECTO A LA RUTA.** Por el Hogar caí en «Ver el carnet completo», que
   es la LISTA de vacunas ya cargadas, no la pantalla de cargar una — y el
   arnés midió esa otra pantalla dando «una sola cuenta ✓» sobre nada. *Un
   verde en la pantalla equivocada es el mismo error que el memorial del 1.2.* */
await page.goto('http://localhost:8082/carnet?mascotaId=79930830-1f09-4048-9b15-19dfd86bd31c&nombre=Thor', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(8000);
di(`pantalla: ${(await T()).slice(0, 80).replace(/\n/g, ' · ')}`);

/* Los dos toques de la captura (medido en el 1.2: el picker sale del segundo). */
const b1 = await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => ((e.getAttribute('aria-label') ?? e.innerText) ?? '').trim()).filter((x) => x));
di(`botones: ${b1.join(' | ')}`);
const bf = page.getByRole('button', { name: 'Más opciones', exact: true }).first();
await bf.click().catch(() => {});
await page.waitForTimeout(2500);
const b2 = await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => ((e.getAttribute('aria-label') ?? e.innerText) ?? '').trim()).filter((x) => x));
di(`tras el toque: ${b2.slice(-4).join(' | ')}`);
const gal = page.getByRole('button', { name: /galer|elegir/i }).first();
const espera = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
if ((await gal.count()) > 0) await gal.click().catch(() => {});
const pk = await espera;
if (pk !== null) await pk.setFiles(carnet);
di(`¿subió el carnet?: ${pk !== null ? 'sí ✓' : '🔴 no'}`);
await page.waitForTimeout(48000); // la lectura pasa por el modelo

const t = await T();
di('');
di('── LA REVISIÓN ────────────────────────────────────────────');
di(`  ${t.slice(0, 150).replace(/\n/g, ' · ')}`);

/* ① las filas que DICEN qué les falta */
const marcadas = await page.evaluate(() => {
  const txt = document.body.innerText;
  return (txt.match(/No pude leer la fecha|Falta la fecha|No pude leer cuál/g) ?? []).length;
});
/* ③ el número que dice el pie */
const mPie = /Hay (\d+) vacunas? por completar|Hay (1) vacuna por completar/.exec(t);
const dicePie = mPie === null ? (/Hay 1 vacuna por completar/.test(t) ? 1 : 0) : Number(mPie[1] ?? mPie[2]);
di(`  ① filas que DICEN qué les falta: ${marcadas}`);
di(`  ③ el pie dice que faltan:        ${dicePie}`);
di(`  ⇒ ¿una sola cuenta?: ${marcadas === dicePie ? 'sí ✓' : `🔴 NO — la fila dice ${marcadas} y el pie ${dicePie}`}`);

/* ② el botón */
const bot = page.getByRole('button', { name: /^(Sumar|Guardar)/ }).first();
if ((await bot.count()) > 0) {
  const et = await bot.getAttribute('aria-label');
  const off = await bot.getAttribute('aria-disabled');
  di(`  ② «${et}» · apagado=${off} · razón a la vista=${/por completar|por revisar/.test(t) ? 'sí ✓' : '🔴 no'}`);
} else di('  🔴 no hallé el botón de guardar');

di('');
di(`errores de página: ${errores.length}`);
for (const e of errores) di(`   · ${e}`);
await page.screenshot({ path: 'docs/loop/S113-C-carnet-reconciliado.png' });
await nav.close();
