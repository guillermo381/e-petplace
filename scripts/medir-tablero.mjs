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
/* 🔴 **Lolo es LA MASCOTA VACÍA de esta familia** — el «Zeus a3332037» del
   mandato es de la cuenta demo y la RLS lo rechaza. Sobre Lolo se mide la ley
   del tablero: sin dato, «sin registro» y NINGÚN gráfico. */
for (const [quien, id] of [['Thor','d2e31d70-54fc-4d47-b425-1617239257eb'],['Lolo','155c5130-b1e9-477e-abb8-a3de994971cd']]) {
  await page.goto(`http://localhost:8082/hogar/mascota/${id}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(11000);
  const t = await T();
  const hay = ['Citas','Pasaporte y QR','Nexo','Conociéndolo'].filter((x) => t.includes(x));
  if (hay.length === 0) di(`     (la pantalla dice: «${t.slice(0, 90).replace(/\n/g, ' · ')}»)`);
  di(`  ${quien.padEnd(6)} acciones a la vista: ${hay.length}/4 — ${hay.join(' · ') || '(ninguna)'}`);
  /* El tablero: cuántas tarjetas, cuántas «sin registro», y CUÁNTOS GRÁFICOS.
     Los gráficos son SVG: se cuentan por nodo, no por texto. */
  const tab = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      salud: /Su salud/.test(t),
      sinRegistro: (t.match(/Sin registro/g) ?? []).length,
      /* 🔴 **Los SVG de LAS TARJETAS, no los de la página.** El conteo global
         daba 47 contra 37 y no discriminaba: hay glifos por todos lados. Se
         busca el contenedor de «Su salud» y se cuenta ahí adentro. */
      svg: (() => {
        for (const e of document.querySelectorAll('div')) {
          if (!/^Su salud/.test((e.innerText ?? '').trim())) continue;
          if (e.querySelectorAll('div').length > 60) continue;
          return e.querySelectorAll('svg').length;
        }
        return -1;
      })(),
    };
  });
  /* 🔴 **SEIS TARJETAS ⇒ SEIS CHEVRONES, y también son SVG.** El conteo crudo
   decía «Lolo: 6 gráficos» sobre un tablero sin ninguno. *Un contador que
   suma dos cosas distintas no mide ninguna.* Se resta el piso. */
  const CHEVRONES = 6;
  const graficos = tab.svg === -1 ? -1 : Math.max(0, tab.svg - CHEVRONES);
  di(`         tablero: ${tab.salud ? 'sí' : '🔴 no'} · «Sin registro» ×${tab.sinRegistro} · gráficos: ${graficos === -1 ? '(no hallé la sección)' : graficos} (svg ${tab.svg} − ${CHEVRONES} chevrones)`);
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
