/** ⭐ **LAS CUATRO ACCIONES** (S113-C · 2.2 · C3), con Thor y con Sombra. */
import { chromium } from 'playwright-core';
const di = (s) => console.log(s);
const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = []; page.on('pageerror', (e) => errores.push(String(e).slice(0, 140)));
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL);
await page.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(16000);
di(`cuenta: ${process.env.CLIENTE_EMAIL}`);
for (const [quien, id] of [['Thor','d2e31d70-54fc-4d47-b425-1617239257eb'],['Zeus','e0c28888-6e3c-43aa-92f3-8428089d392b']]) {
  await page.goto(`http://localhost:8082/hogar/mascota/${id}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(11000);
  const t = await T();
  const hay = ['Citas','Pasaporte y QR','Nexo','Conociéndolo'].filter((x) => t.includes(x));
  if (hay.length === 0) di(`     (la pantalla dice: «${t.slice(0, 90).replace(/\n/g, ' · ')}»)`);
  di(`  ${quien.padEnd(6)} acciones a la vista: ${hay.length}/4 — ${hay.join(' · ') || '(ninguna)'}`);
}
/* Memorial: ninguna acción. */
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(8000);
const s = page.getByRole('button', { name: /^Sombra$/ }).first();
if ((await s.count()) > 0) {
  await s.click(); await page.waitForTimeout(10000);
  const t3 = await T();
  /* 🔴 **«Conociéndolo» NO sirve de discriminador: hay DOS.** Es la etiqueta de
     mi acción Y el chip del momento vital en el hero (`perfil.pastillaConociendo`,
     :1177) — y el chip SÍ se dibuja en memorial, con razón. Se miden las tres
     inequívocas. */
  const hay = ['Pasaporte y QR','Citas','Nexo'].filter((x) => t3.includes(x));
  di(`  Sombra acciones (deben ser 0): ${hay.length} ${hay.length === 0 ? '✓' : '🔴 ' + hay.join(' · ')}`);
}
di(''); di(`errores: ${errores.length}`); for (const e of errores.slice(0,2)) di('   · ' + e);
await nav.close();
