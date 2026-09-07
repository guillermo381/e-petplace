/**
 * ⭐ **LAS CUATRO ENTRADAS ESCRIBEN SU EVENTO** (S113-C · 2.0 · ②③).
 *
 * 🔴 **Se mide que ESCRIBAN, no que la Hoja abra.** Una pantalla que se abre y
 * no guarda es el defecto más caro de esta sesión: alguien cuenta algo de su
 * mascota y se pierde. Por eso el discriminador es el AVISO con el nombre
 * —«Anotado en la vida de Thor»— que sólo sale con `ok`.
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

const THOR = 'http://localhost:8082/hogar/mascota/d2e31d70-54fc-4d47-b425-1617239257eb';
const marca = Date.now().toString().slice(-5);

for (const [entrada, texto] of [
  ['Comportamiento', `se asusta con los truenos ${marca}`],
  ['Cómo es', `muy cariñoso con los chicos ${marca}`],
  ['Algo de salud', `polen ${marca}`],
  ['Un recuerdo', `su primer día en casa ${marca}`],
]) {
  await page.goto(THOR, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(11000);
  /* 🔴 **Las cuatro entradas viven DENTRO de la Hoja de la pieza**, no en la
     ficha: primero se toca la invitación. Medido en su fuente
     (`InvitacionBio.tsx:126`, `setAbierta(true)`) — buscarlas en la ficha daba
     «no está la entrada» sobre una pieza montada y sana. */
  const inv = page.getByRole('button', { name: /qué lo hace único|hace único|Cuéntanos/i }).first();
  if ((await inv.count()) > 0) { await inv.click().catch(() => {}); await page.waitForTimeout(2500); }
  const b = page.getByRole('button', { name: new RegExp(`^${entrada}`, 'i') }).first();
  if ((await b.count()) === 0) { di(`  ${entrada.padEnd(16)} 🔴 no está la entrada`); continue; }
  await b.click().catch(() => {});
  await page.waitForTimeout(2500);
  const caja = page.locator('input, textarea').last();
  if ((await caja.count()) === 0) { di(`  ${entrada.padEnd(16)} 🔴 la Hoja no trae campo`); continue; }
  await caja.fill(texto);
  await page.waitForTimeout(800);
  const g = page.getByRole('button', { name: /^Anotar$/ }).first();
  if ((await g.count()) === 0) { di(`  ${entrada.padEnd(16)} 🔴 sin botón de guardar`); continue; }
  await g.click().catch(() => {});
  /* 🔴 **El aviso es un toast y se va.** Se mira en un bucle corto en vez de
     esperar un rato fijo: la corrida anterior lo perdió por llegar tarde y
     cantó rojo sobre cuatro escrituras que SÍ ocurrieron (la base lo probó). */
  let t = '';
  for (let k = 0; k < 14; k += 1) {
    t = await T();
    if (/Anotado en la vida de Thor/.test(t)) break;
    await page.waitForTimeout(500);
  }
  /* El aviso con el NOMBRE: sólo sale con `ok`, así que distingue guardar de
     abrir la Hoja. */
  di(`  ${entrada.padEnd(16)} ${/Anotado en la vida de Thor/.test(t) ? '✓ «Anotado en la vida de Thor»' : `🔴 ${t.slice(0, 70).replace(/\n/g, ' · ')}`}`);
}

/* La franja de seguridad tiene que mostrar la alergia recién declarada. */
await page.goto(THOR, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(12000);
/* 🔴 **La franja está COLAPSADA**: su resumen no lleva la procedencia. Hay que
   abrirla — misma lección que las entradas de la invitación, que viven dentro
   de su Hoja. *Medir una pieza plegable sin desplegarla mide su tapa.* */
const abrir = page.getByRole('button', { name: /^Ver \d|seguridad/i }).first();
if ((await abrir.count()) > 0) { await abrir.click().catch(() => {}); await page.waitForTimeout(2000); }
const t = await T();
di('');
di(`  la franja de seguridad trae «polen»: ${new RegExp(`polen ${marca}`, 'i').test(t) ? 'sí ✓' : (/polen/i.test(t) ? 'hay polen viejo' : '🔴 no')}`);
/* 🔴 **La voz es «Lo registró su familia», leída del diccionario.** Mi primer
   discriminador buscaba «familia» suelta y daba rojo sobre una franja correcta.
   *Cuarta vez en la sesión que adivino una voz en vez de leerla.* */
di(`  la franja, entera: «${(t.match(/Alergia[^\n]*|Lo registró[^\n]*/g) ?? []).join(' ⁞ ').slice(0, 200)}»`);
di(`  ¿dice quién lo registró?: familia=${/Lo registró su familia/.test(t) ? 'sí ✓' : 'no'} · clínica=${/Lo registró una clínica/.test(t) ? 'sí ✓' : 'no'}`);
di('');
di(`errores de página: ${errores.length}`);
for (const e of errores.slice(0, 2)) di(`   · ${e}`);
await nav.close();
