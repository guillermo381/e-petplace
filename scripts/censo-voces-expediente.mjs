/**
 * ⭐ **QUÉ TEXTO VE LA FAMILIA POR CADA TIPO DE EVENTO** (S113-C, pedido de
 * mesa tras la medición de A y E).
 *
 * 🔴 **Se mide DESDE LA PANTALLA, y por eso lo hace C.** A y E midieron
 * distinto porque hay **cinco diccionarios** y cada uno miró el suyo: *un censo
 * del diccionario mide el vocabulario, no lo que la familia lee.* Acá se abre
 * el perfil, se lee cada fila de la historia y se compara su texto contra el
 * genérico.
 *
 * ⚠️ Lo que NO puede: ver los tipos que ninguna mascota de esta cuenta tiene.
 * Su verde dice «ninguno de los que se dibujan hoy cae al genérico», jamás
 * «los 21 tienen voz».
 */
import { chromium } from 'playwright-core';

const GENERICOS = ['Momento guardado', 'Momento de cuidado'];
const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const di = (s) => console.log(s);
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL ?? '');
await page.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD ?? '');
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(18000);

let genericas = 0;
let filas = 0;
for (const n of ['Thor', 'Zeus', 'Lolo', 'Sombra']) {
  await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  const tarj = page.getByRole('button', { name: new RegExp(`^(Ver a )?${n}`) }).first();
  if ((await tarj.count()) === 0) continue;
  await tarj.click();
  await page.waitForTimeout(7000);
  /* Se abre la historia entera para ver TODAS las filas, no las tres primeras. */
  const ver = page.getByRole('button', { name: /^Ver \d+ más$/ }).first();
  if ((await ver.count()) > 0) { await ver.click(); await page.waitForTimeout(2500); }

  const r = await page.evaluate((gen) => {
    const t = document.body.innerText;
    return {
      genericas: gen.reduce((s, g) => s + (t.match(new RegExp(g, 'g')) ?? []).length, 0),
      /* Las filas de la historia: llevan día + mes en su columna izquierda. */
      filas: (t.match(/^\d{2}\n\w{3,4}$/gm) ?? []).length,
    };
  }, GENERICOS);
  genericas += r.genericas;
  filas += r.filas;
  di(`  ${n.padEnd(8)} filas de historia: ${String(r.filas).padStart(3)} · con voz genérica: ${r.genericas} ${r.genericas === 0 ? '✓' : '🔴'}`);
}
di('');
di(`TOTAL · ${filas} filas leídas · ${genericas} con voz genérica ${genericas === 0 ? '✓' : '🔴'}`);
di('⚠️ Su verde dice «ninguno de los que se dibujan HOY cae al genérico»,');
di('   jamás «los 21 tipos tienen voz»: lo que ninguna mascota tiene, no se ve.');
await nav.close();
