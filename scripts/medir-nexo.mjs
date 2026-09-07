/**
 * ⭐ **NEXO HABLA** (S113-C · 2.0 · C1). Lo que se puede probar HOY, con la edge
 * todavía sin desplegar — y **lo que no, se dice**.
 *
 *  ① el toque en «Preguntale» abre la PANTALLA (antes abría la Hoja v0);
 *  ② el hilo, la caja y el panel de memoria se montan;
 *  ③ los tres chips salen del CONTEXTO (no de una lista fija);
 *  ④ 🔴 al enviar, sin edge, **se degrada con voz** — no se cuelga ni miente;
 *  ⑤ Sombra (memorial): la fila no existe y la pantalla tampoco.
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

/* ① y ② — desde la pata, con Thor. */
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(9000);
await page.getByRole('button', { name: /^Abrir a |^Lo que te espera$/ }).first().click().catch(() => {});
await page.waitForTimeout(2000);
const dedo = page.getByRole('button', { name: /Pregunt|Nexo|Coach/i }).first();
di(`① el dedo del coach: ${(await dedo.count()) > 0 ? `«${await dedo.getAttribute('aria-label')}»` : '🔴 no lo hallé'}`);
if ((await dedo.count()) > 0) {
  await dedo.click().catch(() => {});
  await page.waitForTimeout(3000);
  /* Si pide elegir mascota, se elige Thor. */
  const bs = await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => ((e.getAttribute('aria-label') ?? e.innerText) ?? '').trim()).filter((x) => x).slice(-8));
  di(`   tras tocar el dedo, ofrece: ${bs.join(' | ')}`);
  /* 🔴 **El chip del selector se distingue POR SU CAJA, no por su nombre.** El
     Hogar de atrás sigue montado con sus propias tarjetas «Thor», así que
     buscar por texto toca la de atrás y la hoja no se cierra — medido: la URL
     no cambiaba. Los chips del selector miden ~84 de ancho (S113-C · 1.1.1). */
  const caja = await page.evaluate(() => {
    for (const e of document.querySelectorAll('[role="button"]')) {
      const r = e.getBoundingClientRect();
      if (Math.abs(r.width - 84) <= 8 && r.height > 60 && r.height < 160 &&
          /Thor/.test(e.getAttribute('aria-label') ?? '')) {
        return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
      }
    }
    return null;
  });
  di(`   el chip de Thor en la hoja: ${caja === null ? '🔴 no lo hallé por caja' : `(${caja.x},${caja.y})`}`);
  if (caja !== null) { await page.mouse.click(caja.x, caja.y); await page.waitForTimeout(11000); }
}
di(`① URL: ${page.url().replace('http://localhost:8082', '')}`);
const t = await T();
di(`② la pantalla: ${t.slice(0, 150).replace(/\n/g, ' · ')}`);
/* `Campo` en RN-web no siempre pone `type="text"`: se busca por lo que la caja
   ES —un input editable con su placeholder— y no por un atributo que la
   plataforma puede omitir. */
const cajas = await page.evaluate(() => [...document.querySelectorAll('input, textarea')].map((e) => e.getAttribute('placeholder') ?? `(${e.tagName.toLowerCase()} sin placeholder)`));
di(`② cajas en la pantalla: ${cajas.length ? cajas.join(' | ') : '🔴 ninguna'}`);
di(`② ¿el panel de memoria?: ${/Lo que sé de/.test(t) ? 'sí ✓' : '🔴 no'}`);
/* 🔴 **EL HUECO QUE A VIO EN APARATO.** Se busca la frase ROTA, no la sana: un
   arnés que confirma que la buena está no descarta que la rota también. */
const rotas = [
  ['la invitación', /Pregúntame algo de\s*[,.]/],
  ['el panel', /Lo que sé de\s*$|Lo que sé de\s*\n/m],
].filter(([, re]) => re.test(t)).map(([q]) => q);
di(`② ¿alguna voz sale con el hueco vacío?: ${rotas.length === 0 ? 'no ✓' : `🔴 ${rotas.join(' y ')}`}`);
di(`   nombran a Thor: invitación=${/Pregúntame algo de Thor/.test(t) ? 'sí ✓' : 'no'} · panel=${/Lo que sé de Thor/.test(t) ? 'sí ✓' : 'no'}`);

/* ③ los chips salen del contexto */
for (const c of ['¿Cuándo le toca la vacuna?', '¿Cómo va su peso?', '¿Qué cuidados necesita por su etapa?']) {
  di(`③ chip «${c.slice(0, 28)}…»: ${t.includes(c) ? 'sí' : 'no'}`);
}

/* ④ enviar sin edge: tiene que HABLAR, no colgarse */
const caja = page.locator('input, textarea').first();
if ((await caja.count()) > 0) {
  await caja.fill('¿cuándo le toca la vacuna?');
  await caja.press('Enter').catch(() => {});
  await page.waitForTimeout(14000);
  const t2 = await T();
  const hablo = /No pudimos|No supe|expediente|Inicia sesión|Nexo/.test(t2.replace(t, ''));
  di(`④ al enviar SIN edge: ${hablo ? 'contesta algo ✓' : '🔴 mudo'} — «${t2.replace(t, '').slice(0, 90).replace(/\n/g, ' · ')}»`);
}

/* ⑤ memorial */
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(8000);
const s = page.getByRole('button', { name: /^Sombra$/ }).first();
if ((await s.count()) > 0) {
  await s.click(); await page.waitForTimeout(9000);
  const t3 = await T();
  di(`⑤ Sombra · ¿alguna puerta a Nexo en su ficha?: ${/Pregunt|Nexo/i.test(t3) ? '🔴 sí' : 'no ✓'}`);
}
di('');
di(`errores de página: ${errores.length}`);
for (const e of errores.slice(0, 3)) di(`   · ${e}`);
await nav.close();
