// REPRO DEL HALLAZGO BLOQUEANTE DEL GATE (12-ago) — pantalla en blanco al
// entrar con la cuenta vendedora pura. Camina el flujo REAL con la cuenta
// REAL y captura TODO error de consola/página, con screenshot por paso.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:8097';
const EMAIL = 'nuevo_test2@e-petplace.com';
const PASS = 'GateS96.negocios';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errores = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') {
    errores.push(`[console.${m.type()}] ${m.text().slice(0, 500)}`);
  }
});
page.on('pageerror', (e) => errores.push(`[pageerror] ${String(e).slice(0, 800)}`));
page.on('response', async (r) => {
  if (r.status() >= 400) {
    let cuerpo = '';
    try { cuerpo = (await r.text()).slice(0, 300); } catch {}
    errores.push(`[http ${r.status()}] ${r.url().slice(0, 200)}\n    body: ${cuerpo}`);
  }
});

const shot = async (n) => page.screenshot({ path: `/tmp/repro-gate-${n}.png` });

try {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(4000);
  await shot('1-raiz');
  console.log('PASO 1 raíz →', page.url());
  console.log('  texto:', (await page.textContent('body'))?.slice(0, 300).replace(/\s+/g, ' '));

  // login (la bienvenida puede salir en en o es según locale del navegador)
  if ((await page.locator('input').count()) < 2) {
    const btn = page.getByText(/sign in|ingres|iniciar/i).first();
    if (await btn.count()) await btn.click();
    await page.waitForTimeout(3000);
  }
  await page.locator('input').nth(0).fill(EMAIL);
  await page.locator('input').nth(1).fill(PASS);
  await shot('2-login');
  const entrar = page.getByText(/sign in|ingresar|entrar|iniciar/i).last();
  await entrar.click();
  await page.waitForTimeout(7000);
  await shot('3-post-login');
  console.log('PASO 3 post-login →', page.url());
  console.log('  texto:', (await page.textContent('body'))?.slice(0, 500).replace(/\s+/g, ' '));

  // buscar la opción del equipo / probar de nuevo
  for (const label of [/entrar al equipo/i, /equipo/i, /probar de nuevo/i]) {
    const b = page.getByText(label).first();
    if ((await b.count()) > 0) {
      console.log('CLICK en:', label);
      await b.click();
      await page.waitForTimeout(6000);
      await shot('4-post-click');
      console.log('PASO 4 →', page.url());
      const txt = ((await page.textContent('body')) ?? '').replace(/\s+/g, ' ').trim();
      console.log('  texto post-click:', txt.slice(0, 400) || '(VACÍO — pantalla en blanco)');
      break;
    }
  }
} catch (e) {
  console.log('EXCEPCIÓN DEL SCRIPT:', String(e).slice(0, 400));
}

console.log('\n=== ERRORES CAPTURADOS (' + errores.length + ') ===');
for (const e of errores.slice(0, 15)) console.log(e);
await browser.close();
