/** ⭐ **LOS CINCO DEL FOUNDER** (S113-C · 2.2.3) — sus rojos, con Thor. */
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

/* ① la entrada del Hogar */
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);
const uno = await page.evaluate(() => ({
  entrada: /Buscar en tu familia/.test(document.body.innerText),
  cajaSuelta: [...document.querySelectorAll('input')].some((i) => (i.placeholder ?? '').includes('Thor, vacuna')),
}));
di(`① entrada «Buscar en tu familia»: ${uno.entrada ? 'sí ✓' : '🔴 no'} · caja suelta en el Hogar: ${uno.cajaSuelta ? '🔴 sigue' : 'no ✓'}`);

/* ② el botón de enviar, alineado con la caja */
await page.goto('http://localhost:8082/nexo', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
const dos = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('[role="button"]')].find((e) => /enviar/i.test(e.getAttribute('aria-label') ?? ''));
  if (btn === undefined) return null;
  const b = btn.getBoundingClientRect();
  /* 🔴 **El input SE BUSCA POR CERCANÍA AL BOTÓN, no con `.pop()`.** Otras
     pantallas quedan montadas en RN-web y el último input del DOM puede ser de
     cualquiera de ellas. */
  let inp = null;
  for (const i of document.querySelectorAll('input,textarea')) {
    const r = i.getBoundingClientRect();
    if (r.height === 0) continue;
    if (Math.abs(r.y - b.y) > 120) continue;
    if (inp === null || Math.abs(r.y - b.y) < Math.abs(inp.r.y - b.y)) {
      /* 🔴 **La CAJA VISUAL, no el `<input>`.** El nodo interno mide 26px y
         vive arriba de su caja con borde y padding; comparar su centro contra
         el del botón daba Δ13 sobre una fila que puede estar bien alineada.
         *Se sube al ancestro que dibuja el borde.* */
      let caja = i;
      for (let k = 0; k < 4 && caja.parentElement !== null; k += 1) {
        const st = getComputedStyle(caja.parentElement);
        if (st.borderTopWidth !== '0px' || st.backgroundColor !== 'rgba(0, 0, 0, 0)') { caja = caja.parentElement; break; }
        caja = caja.parentElement;
      }
      const rc = caja.getBoundingClientRect();
      inp = { r: rc, alto: Math.round(rc.height) };
    }
  }
  if (inp === null) return null;
  return {
    centroInput: Math.round(inp.r.y + inp.r.height / 2),
    centroBtn: Math.round(b.y + b.height / 2),
    altoInput: inp.alto,
    altoBtn: Math.round(b.height),
  };
});
di(`② enviar alineado: ${dos === null ? '🔴 no los hallé' : `Δ ${Math.abs(dos.centroInput - dos.centroBtn)}px ${Math.abs(dos.centroInput - dos.centroBtn) <= 8 ? '✓' : '🔴'} · altos: input ${dos.altoInput} / botón ${dos.altoBtn}`}`);

/* ③ ④ el perfil de Thor */
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await page.getByRole('button', { name: /^(Ver a )?Thor/ }).first().click();
await page.waitForTimeout(7000);
const tres = await page.evaluate(() => {
  const t = document.body.innerText;
  const doc = [...document.querySelectorAll('div,span')].find((e) => e.children.length === 0 && (e.textContent ?? '').trim() === 'Documentos');
  return {
    partida: /Documento\s*\ns/.test(t),
    lineasDoc: doc === null ? null : Math.round(doc.getBoundingClientRect().height),
    preguntaSuelta: /¿Quieres conocer más sobre/.test(t),
    masSobre: /Más sobre el /.test(t),
  };
});
di(`③ «Documentos» partida: ${tres.partida ? '🔴 sí' : 'no ✓'} (alto del rótulo: ${tres.lineasDoc}px)`);
di(`④ pregunta suelta: ${tres.preguntaSuelta ? '🔴 sigue' : 'se fue ✓'} · «Más sobre el …»: ${tres.masSobre ? 'sí ✓' : '🔴 no'}`);

/* ⑤ el atrás del pasaporte */
await page.getByRole('button', { name: /^Pasaporte y QR$/ }).first().click();
await page.waitForTimeout(5000);
const cinco = await page.evaluate(() => ({
  hayAtras: [...document.querySelectorAll('[role="button"]')].some((e) => /atr[aá]s|volver|back/i.test(e.getAttribute('aria-label') ?? '')),
  enPasaporte: /Pasaporte|pasaporte/.test(document.body.innerText),
}));
di(`⑤ atrás en el pasaporte: ${cinco.hayAtras ? 'sí ✓' : '🔴 no'} (¿está en la pantalla?: ${cinco.enPasaporte})`);
di(`\nerrores de página: ${errs.length}${errs.length ? ' — ' + errs[0] : ''}`);
await page.screenshot({ path: 'docs/loop/capturas-s113-c-f3/223-pasaporte.png' });
await nav.close();
