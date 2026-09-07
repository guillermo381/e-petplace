/**
 * ⭐ **LA BÚSQUEDA BUSCA** (S113-C, corrección de la mesa) — su rojo.
 *
 * 🔴 El rojo lo dictó el founder y es de CAMINO, no de resultado: *«escribir
 * proplan desde el Hogar devuelve los productos SIN PASAR POR EL CHAT».*
 * Por eso se mide el recorrido entero —tocar la entrada, escribir, ver— y se
 * verifica que **la ruta nunca sea `/nexo`**: un resultado correcto al que se
 * llega conversando no cumple lo pedido.
 */
import { chromium } from 'playwright-core';
const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
const di = (s) => console.log(s);

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL ?? '');
await page.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD ?? '');
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(18000);
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

/* ① la entrada existe y LLEVA A BUSCAR, no al chat */
const entrada = page.getByRole('button', { name: /Buscar en tu familia/ }).first();
if ((await entrada.count()) === 0) { di('🔴 no hay entrada de búsqueda en el Hogar'); await nav.close(); process.exit(2); }
await entrada.click();
await page.waitForTimeout(3000);
const ruta = new URL(page.url()).pathname;
di(`① la entrada lleva a: ${ruta}  ${ruta === '/buscar' ? '✓' : ruta === '/nexo' ? '🔴 al CHAT' : '🔴'}`);

/* ② el campo está enfocado al llegar */
const enfocado = await page.evaluate(() => {
  const a = document.activeElement;
  return a !== null && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
});
di(`② el campo sale enfocado: ${enfocado ? 'sí ✓' : '🔴 no'}`);

/* ③ EL ROJO DEL FOUNDER: «proplan» devuelve productos, sin chat */
const caja = page.locator('input,textarea').first();
await caja.fill('proplan');
await page.waitForTimeout(4000);
const r = await page.evaluate(() => {
  const t = document.body.innerText;
  return {
    despensa: /^Despensa$/m.test(t),
    grupos: ['Mascotas', 'Citas', 'Papeles', 'Recuerdos', 'Pedidos', 'Despensa', 'Prestadores'].filter((g) => new RegExp(`^${g}$`, 'm').test(t)),
    isoCrudo: (t.match(/\d{4}-\d{2}-\d{2}T?/g) ?? []).length,
    ofreceNexo: /Preguntarle a Nexo/.test(t),
  };
});
di(`③ «proplan» · grupos: ${r.grupos.join(' · ') || '(ninguno)'}`);
di(`   trae Despensa: ${r.despensa ? 'sí ✓' : '🔴 no'} · sigue fuera del chat: ${new URL(page.url()).pathname === '/buscar' ? 'sí ✓' : '🔴 no'}`);
di(`   fechas ISO crudas: ${r.isoCrudo} ${r.isoCrudo === 0 ? '✓' : '🔴'}`);

/* ④ sin resultados sigue ofreciendo Nexo */
await caja.fill('qwertzxcvasdf');
await page.waitForTimeout(3500);
const v = await page.evaluate(() => ({
  sin: /No encontramos nada/.test(document.body.innerText),
  nexo: /Preguntarle a Nexo/.test(document.body.innerText),
}));
di(`④ sin resultados lo dice: ${v.sin ? 'sí ✓' : '🔴 no'} · ofrece Nexo: ${v.nexo ? 'sí ✓' : '🔴 no'}`);
di(`\nerrores de página: ${errs.length}${errs.length ? ' — ' + errs[0] : ''}`);
await page.screenshot({ path: 'docs/loop/capturas-s113-c-f3/buscar-proplan.png', fullPage: true });
await nav.close();
