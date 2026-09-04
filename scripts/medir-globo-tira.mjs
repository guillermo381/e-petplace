import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('apps/cliente/.env.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await b.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
await p.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i=0;i<120 && (await p.locator('input[type="password"]').count())===0;i++) await p.waitForTimeout(1000);
await p.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL);
await p.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD);
await p.getByText(/^(Entrar|Sign in)$/).first().click();
await p.waitForTimeout(16000);
/* 🔴 **EL GLOBO SE MIDE POR GEOMETRIA, no por «el primer digito cerca».** La
   version anterior subia cuatro niveles y tomaba cualquier numero de la
   tarjeta: dio «1» para las CINCO, que es justo la respuesta que un
   instrumento roto da — todas iguales. El globo es un circulo de 26x26
   posicionado absoluto (`index.tsx`), asi que se lo busca por su CAJA: 26±3 px
   de lado, redondo, con digitos adentro. Y se le atribuye a la mascota cuyo
   nombre esta MAS CERCA en pantalla, no a la que aparece antes en el DOM. */
const globos = await p.evaluate(() => {
  const nombres = ['Zeus', 'Kira', 'Bruma', 'Thor', 'Sombra'];
  const cajaDe = (n) => {
    let e = [...document.querySelectorAll('div,span')].find((x) => (x.textContent ?? '').trim() === n);
    if (e === null || e === undefined) return null;
    /* sube hasta la TARJETA: el primer ancestro que ya es una caja grande */
    while (e.parentElement !== null && e.getBoundingClientRect().width < 70) e = e.parentElement;
    const r = e.getBoundingClientRect();
    return { izq: r.x, der: r.x + r.width, arriba: r.y, abajo: r.y + r.height };
  };
  const globosEnPantalla = [...document.querySelectorAll('div')]
    .filter((e) => {
      const r = e.getBoundingClientRect();
      const txt = (e.textContent ?? '').trim();
      return Math.abs(r.width - 26) <= 3 && Math.abs(r.height - 26) <= 3 && /^\d{1,2}$/.test(txt);
    })
    .map((e) => ({ r: e.getBoundingClientRect(), n: (e.textContent ?? '').trim() }));
  return nombres.map((n) => {
    const c = cajaDe(n);
    if (c === null) return `${n}: (no esta en la tira)`;
    /* 🔴 **POR CONTENCION, NO POR CERCANIA.** «El globo mas cercano» le
       atribuyo a Sombra el de su vecina y dejo a Thor sin el suyo: en una tira
       horizontal las tarjetas estan a 90 px y el globo vive en el borde, asi
       que el mas cercano a un nombre puede ser el de al lado. Se sube a la
       TARJETA (el primer ancestro grande) y se pregunta si el centro del globo
       cae ADENTRO. */
    const dentro = globosEnPantalla.filter(
      (g) => g.r.x + g.r.width / 2 >= c.izq && g.r.x + g.r.width / 2 <= c.der &&
             g.r.y + g.r.height / 2 >= c.arriba && g.r.y + g.r.height / 2 <= c.abajo,
    );
    return dentro.length > 0 ? `${n}: GLOBO «${dentro.map((g) => g.n).join(',')}»` : `${n}: sin globo`;
  });
});
console.log(`globos de 26x26 hallados en pantalla: ${(await p.evaluate(() => [...document.querySelectorAll('div')].filter((e) => { const r = e.getBoundingClientRect(); return Math.abs(r.width - 26) <= 3 && Math.abs(r.height - 26) <= 3 && /^\d{1,2}$/.test((e.textContent ?? '').trim()); }).length))}`);
console.log('globos de la tira:');
for (const g of globos) console.log('   ' + g);
const t = await p.evaluate(() => document.body.innerText);
console.log('¿aparece «por resolver» en el texto?:', /por resolver/i.test(t) ? 'SÍ' : 'NO');
console.log('líneas con «resolver»:', t.split('\n').filter(x=>/resolver/i.test(x)).join(' | ') || '(ninguna)');
const conAria = await p.evaluate(() => [...document.querySelectorAll('*')].map(e=>e.getAttribute('aria-label')).filter(x=>x && /resolver/i.test(x)));
console.log('aria-labels con «resolver»:', conAria.join(' | ') || '(ninguno)');
await b.close();
