/**
 * ⭐ **LA BÚSQUEDA** (S113-C · fase 3 · C3) — sus rojos.
 *
 * 🔴 Se prueban **«alimento» y «clinica»** porque son los dos casos que A curó:
 * el primero tiene 11 productos, el segundo mezcla citas y prestadores **que
 * antes se tapaban**. *Un término que devuelve algo no prueba que devuelva
 * todo: el rojo es que aparezcan los GRUPOS que deben.*
 */
import { chromium } from 'playwright-core';
const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 130)));
const di = (s) => console.log(s);

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL ?? '');
await page.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD ?? '');
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(18000);
/* ⏪ **LA CAJA SE MUDÓ AL ORBE** (2.2.3 · ①, firma del founder): en el Hogar
   quedó una entrada con lupa y la caja vive en la Hoja de Nexo. El arnés
   apuntaba al Hogar y cantó «no encontré la caja» — *tenía razón: no está.*
   Se mide donde vive. */
await page.goto('http://localhost:8082/nexo', { waitUntil: 'networkidle' });
await page.waitForTimeout(7000);

const caja = page.locator('input[type="text"], input:not([type])').first();
if ((await caja.count()) === 0) { di('🔴 no encontré la caja de búsqueda'); await nav.close(); process.exit(2); }
di(`cuenta: ${process.env.CLIENTE_EMAIL}\n`);

const GRUPOS = ['Mascotas', 'Citas', 'Papeles', 'Recuerdos', 'Pedidos', 'Despensa', 'Prestadores'];
for (const q of ['alimento', 'clinica', 'thor', 'qwertzxcv']) {
  await caja.fill('');
  await page.waitForTimeout(600);
  await caja.fill(q);
  await page.waitForTimeout(3500);
  const r = await page.evaluate((gs) => {
    const t = document.body.innerText;
    return {
      grupos: gs.filter((g) => new RegExp(`^${g}$`, 'm').test(t)),
      sinResultados: /No encontramos nada/.test(t),
      /* 🔴 **Fechas crudas**: un ISO asomando en la lista. */
      isoCrudo: (t.match(/\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/g) ?? []).length,
      ofreceNexo: /Preguntarle a Nexo/.test(t),
      /* Cuántas filas de resultado hay a la vista. */
      filas: [...document.querySelectorAll('[role="button"]')].filter((e) => {
        const r2 = e.getBoundingClientRect();
        return r2.height > 30 && r2.height < 90 && r2.width > 300;
      }).length,
    };
  }, GRUPOS);
  di(`«${q}»`);
  di(`   grupos      : ${r.grupos.join(' · ') || '(ninguno)'}`);
  di(`   fechas crudas ISO: ${r.isoCrudo} ${r.isoCrudo === 0 ? '✓' : '🔴'}`);
  di(`   sin resultados: ${r.sinResultados ? 'sí' : 'no'}${r.sinResultados ? ` · ofrece Nexo: ${r.ofreceNexo ? 'sí ✓' : '🔴 no'}` : ''}`);
  di('');
}
di(`errores de página: ${errs.length}${errs.length ? ' — ' + errs[0] : ''}`);
await page.screenshot({ path: 'docs/loop/capturas-s113-c-f3/busqueda.png', fullPage: true });
await nav.close();
