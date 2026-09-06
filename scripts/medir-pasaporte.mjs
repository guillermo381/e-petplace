/**
 * ⭐ **EL PASAPORTE** (S113-C · 1.3). Rojo y verde en web con la cuenta del
 * founder. Lo que mide y por qué:
 *  ① la entrada existe en identidad y **no depende de la ficha de raza**
 *    (la puse ahí por error y la saqué: se habría escondido para toda mascota
 *    sin ficha publicada);
 *  ② al abrir, el pasaporte se EMITE solo — no hay botón «crear»;
 *  ③ la URL pública **abre sin sesión**: se prueba en un contexto limpio, que
 *    es la única forma de probar «sin sesión» de verdad;
 *  ④ Sombra (memorial) **no tiene entrada ni pantalla**.
 */
import { chromium } from 'playwright-core';
const di = (s) => console.log(s);
const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 140)));
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL);
await page.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(16000);
di(`cuenta: ${process.env.CLIENTE_EMAIL}`);

for (const quien of ['Thor', 'Sombra']) {
  di('');
  di(`── ${quien} ─────────────────────────────────────────`);
  await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(8000);
  const f = page.getByRole('button', { name: new RegExp(`^${quien}$`) }).first();
  if ((await f.count()) === 0) { di(`  (no está en el Hogar)`); continue; }
  await f.click(); await page.waitForTimeout(10000);
  const t = await T();
  const hayEntrada = /Pasaporte y QR/.test(t);
  di(`  ① entrada «Pasaporte y QR»: ${hayEntrada ? 'sí ✓' : 'no'}${quien === 'Sombra' ? (hayEntrada ? ' 🔴 no debería' : ' ✓ (memorial)') : ''}`);
  if (!hayEntrada) continue;
  const b = page.getByRole('button', { name: /Pasaporte y QR/ }).first();
  di(`  · el botón: ${(await b.count()) > 0 ? `«${await b.getAttribute('aria-label')}»` : '🔴 no lo hallé por rol'}`);
  if ((await b.count()) === 0) {
    /* Si no tiene rol de botón, se toca por texto: la Celda puede exponer el
       rol en un hijo. */
    await page.getByText('Pasaporte y QR', { exact: true }).first().click({ force: true }).catch(() => {});
  } else await b.click().catch(() => {});
  await page.waitForTimeout(14000);
  di(`  · URL tras el toque: ${page.url().replace('http://localhost:8082', '')}`);
  const p = await T();
  di(`  ② la pantalla dice: ${p.slice(0, 140).replace(/\n/g, ' · ')}`);
  const img = await page.evaluate(() => {
    for (const e of document.querySelectorAll('img')) if (/pasaporte\/.*\.png/.test(e.src)) return e.src;
    return null;
  });
  di(`  ② ¿el QR vino del servidor?: ${img !== null ? 'sí ✓' : '🔴 no lo veo'}`);
  if (img !== null) {
    const token = /pasaporte\/([^.]+)\.png/.exec(img)?.[1] ?? '';
    /* 🔴 **Contexto NUEVO, sin cookies ni storage**: probar «abre sin sesión»
       en la misma pestaña logueada no prueba nada. */
    const limpio = await nav.newContext({ locale: 'es-EC' });
    const anon = await limpio.newPage();
    const r = await anon.goto(img.replace(/\/[^/]+\.png$/, `?t=${token}`), { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
    const txt = r === null ? '' : await anon.evaluate(() => document.body.innerText).catch(() => '');
    /* 🔴 **El content-type decide si es una PÁGINA o un archivo de texto.** El
       primer intento mostró el doctype como texto: o la edge no manda
       `text/html`, o el arnés lo pidió mal. Se pregunta al encabezado, que es
       quien lo decide. */
    const ct = r === null ? '(sin respuesta)' : (r.headers()['content-type'] ?? '(sin content-type)');
    const renderizado = await anon.evaluate(() => document.querySelectorAll('body *').length).catch(() => 0);
    di(`  ③ la página pública SIN SESIÓN: ${r === null ? '🔴 no cargó' : `HTTP ${r.status()}`}`);
    di(`     content-type: ${ct}`);
    di(`     ¿la renderiza el navegador?: ${renderizado > 3 ? `sí ✓ (${renderizado} nodos)` : `🔴 no — ${renderizado} nodos, se ve el código`}`);
    di(`     dice: «${txt.replace(/\s+/g, ' ').slice(0, 90)}»`);
    await limpio.close();
  }
}
di('');
di(`errores de página: ${errores.length}`);
for (const e of errores) di(`   · ${e}`);
await nav.close();
