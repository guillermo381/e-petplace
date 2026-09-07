/**
 * ⭐ **LA BÓVEDA DE PAPELES** (S113-C · fase 3 · C1) — sus rojos.
 *
 * 🔴 Se mide **desde la acción del perfil**, no navegando a la ruta a mano:
 * *lo que hay que probar es que la familia llegue, y una URL tecleada prueba
 * que la pantalla existe, no que tenga puerta.*
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
di(`cuenta: ${process.env.CLIENTE_EMAIL}\n`);

for (const n of ['Thor', 'Sombra']) {
  await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.getByRole('button', { name: new RegExp(`^(Ver a )?${n}`) }).first().click();
  await page.waitForTimeout(6000);

  di(`── ${n} ─────────────────────────────`);
  /* ① ¿la acción existe y LLEVA? */
  const accion = page.getByRole('button', { name: /^Documentos$/ }).first();
  if ((await accion.count()) === 0) { di('  🔴 no hay acción «Documentos»\n'); continue; }
  await accion.click();
  await page.waitForTimeout(3500);

  const r = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      llegó: /Papeles de e-PetPlace/.test(t),
      papeles: (t.match(/Descargar PDF/g) ?? []).length,
      seccionTraidos: /Papeles de otras clínicas/.test(t),
      vacio: /Todavía no hay papeles de|No hay papeles de otras/.test(t),
      invita: /tráela: la leemos por vos/.test(t),
      /* Ningún color de alarma en una fila de papel. */
      alarma: [...document.querySelectorAll('div,span')].filter((e) => {
        const c = getComputedStyle(e).color;
        return /rgb\(2[0-5][0-9], *[0-6][0-9]?, *[0-6][0-9]?\)/.test(c) && (e.textContent ?? '').trim() !== '';
      }).length,
    };
  });
  di(`  llegó a la bóveda      : ${r.llegó ? 'sí ✓' : '🔴 no'}`);
  di(`  papeles de la casa     : ${r.papeles}`);
  di(`  sección «otras clínicas»: ${r.seccionTraidos ? 'sí ✓' : '🔴 no'}`);
  di(`  su vacío dice           : ${r.vacio ? 'sí ✓' : '🔴 no'}`);
  di(`  invita a traer          : ${r.invita ? 'sí' : 'no'}  ${n === 'Sombra' ? (r.invita ? '🔴 NO debe invitar en memorial' : '✓ memorial no pide') : ''}`);
  di(`  filas con color de alarma: ${r.alarma} ${r.alarma === 0 ? '✓' : '🔴'}`);
  await page.screenshot({ path: `docs/loop/capturas-s113-c-f3/documentos-${n}.png`, fullPage: true });
  di('');
}
di(`errores de página: ${errs.length}${errs.length ? ' — ' + errs[0] : ''}`);
await nav.close();
