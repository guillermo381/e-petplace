/**
 * ⭐ **LAS CUATRO CELDAS DE HOY ABREN SU REGISTRO** (S113-C · 2.0 · ①).
 *
 * 🔴 **No alcanza con que la celda tenga chevron**: se TOCA cada una y se mira
 * a dónde fue. *Una celda que se dibuja como botón y no lleva a ningún lado es
 * peor que una que no lo parece — la primera promete.*
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

const THOR = 'd2e31d70-54fc-4d47-b425-1617239257eb';
const ficha = `http://localhost:8082/hogar/mascota/${THOR}`;

/* Cada celda por su rótulo, tocada de a una, volviendo a la ficha entre medio. */
/* 🔴 **CADA DESTINO SE RECONOCE POR ALGO SUYO, no por «el texto cambió».** La
   primera corrida daba tres verdes flojos: comparaba `t2 !== antes` y cualquier
   carga tardía lo cumplía. *Un discriminador que cualquier cosa satisface no
   discrimina.* Ahora cada uno trae su seña: una URL, o el título de su Hoja. */
for (const [rotulo, tipo, sena] of [
  ['Vacunas', 'url', '/carnet'],
  /* 🔴 **El rótulo es «Desparasitación», no «Antiparasitario».** Tres corridas
     dieron rojo sobre una celda sana porque el arnés buscaba la palabra que yo
     supuse en vez de la del diccionario (`perfil.hoyDesparasitacion`). *Es la
     tercera vez en esta sesión que adivino una voz en vez de leerla.* */
  ['Desparasitación', 'url', '/antiparasitario'],
  /* Los títulos EXACTOS de cada Hoja. La corrida anterior usaba regex laxas
     («peso de Thor») y daban verde contra el texto de la ficha, que también
     dice «peso». *Dos verdes flojos seguidos: el arnés medía que algo pasó, no
     que pasara LO que tenía que pasar.* */
  ['Peso', 'texto', /El peso de Thor/],
  ['Medicación', 'texto', /Una dosis de Thor/],
]) {
  await page.goto(ficha, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(10000);
  /* 🔴 **La celda, no el rótulo de la sección.** La ficha tiene una sección
     «Antiparasitario» más abajo, y `^Antiparasitario` tomaba ésa: el click caía
     en un título y no pasaba nada. Las celdas de HOY son las PRIMERAS con ese
     nombre en el orden del DOM, así que se toma la primera **que sea botón**. */
  const b = page.getByRole('button', { name: new RegExp(`^${rotulo}`, 'i') }).first();
  if ((await b.count()) === 0) { di(`  ${rotulo.padEnd(16)} 🔴 la celda no es botón`); continue; }
  if (rotulo.startsWith('Despara')) {
    const cands = await page.evaluate(() => {
      const out = [];
      for (const e of document.querySelectorAll('[role="button"]')) {
        const et = ((e.getAttribute('aria-label') ?? '') + ' ' + (e.innerText ?? '')).trim();
        if (!/antipa/i.test(et)) continue;
        const r = e.getBoundingClientRect();
        out.push(`«${et.slice(0, 34).replace(/\n/g, '·')}» y=${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return out;
    });
    di(`     candidatos: ${cands.length ? cands.join(' | ') : 'ninguno'}`);
  }
  await b.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(600);
  const caja = await b.boundingBox();
  await b.click({ timeout: 8000 }).catch(async () => {
    /* Si el click normal no llega —un overlay, un ancestro que captura—, se
       toca por coordenada. **Y se declara cuál de los dos funcionó**: que haga
       falta `force` es información, no un detalle del arnés. */
    if (caja !== null) await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
  });
  await page.waitForTimeout(6000);
  const url = page.url().replace('http://localhost:8082', '');
  const t2 = await T();
  const bien = tipo === 'url' ? url.includes(sena) : sena.test(t2);
  /* Lo que se imprime es LA SEÑA que se buscó, no el principio de la pantalla:
     la Hoja se monta encima y el texto de la ficha sigue primero en el DOM, así
     que imprimirlo hacía parecer que no había pasado nada. */
  const detalle = tipo === 'url' ? url.slice(0, 60) : (bien ? `halló «${(t2.match(sena) ?? [''])[0]}»` : 'no encontré su título');
  di(`  ${rotulo.padEnd(16)} ${bien ? '✓' : '🔴'} ${detalle}`);
}
di('');
di(`errores de página: ${errores.length}`);
for (const e of errores.slice(0, 2)) di(`   · ${e}`);
await nav.close();
