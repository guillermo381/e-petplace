import { chromium } from 'playwright-core';
const ALTA = process.argv[2];
const URL = `https://epetplace-pagos-stg.vercel.app/?alta=${ALTA}&volver=cliente://pagos/alta`;

const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const ctx = await b.newContext();
const p = await ctx.newPage();

const consola = [], red = [], fallos = [];
p.on('console', m => consola.push(`[${m.type()}] ${m.text()}`.slice(0, 300)));
p.on('pageerror', e => fallos.push(`PAGEERROR: ${e.message}`.slice(0, 400)));
p.on('requestfailed', r => red.push(`FAILED ${r.method()} ${r.url().slice(0,90)} :: ${r.failure()?.errorText}`));
p.on('response', async r => {
  const u = r.url();
  if (/paymentez|ccapi|pg-micros|supabase\.co\/functions/.test(u)) {
    let body = '';
    try { body = (await r.text()).slice(0, 260); } catch {}
    red.push(`${r.status()} ${r.request().method()} ${u.slice(0,95)}\n      ↳ ${body}`);
  }
});

await p.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
console.log('— página cargada —');

// Los campos los monta el SDK. Se llenan por su clase, no por ids nuestros.
async function llenar(sel, val) {
  const el = p.locator(sel).first();
  if (await el.count() === 0) { console.log(`  ✗ NO EXISTE el campo ${sel}`); return false; }
  await el.click(); await el.type(val, { delay: 40 }); return true;
}
console.log('campos que el SDK montó:',
  await p.locator('#tarjeta input').evaluateAll(ns => ns.map(n => n.className || n.name || n.type).join(' · ')));

const PAN = process.argv[3] || '36417002140808';
await llenar('#tarjeta input.name', 'GUILLERMO PRUEBA');
await llenar('#tarjeta input.card-number', PAN);
// 🔴 El SDK monta expiry-month y expiry-year POR SEPARADO (medido: la v1 de
//    este ensayo buscaba `expiry-month-year` y NO llenaba el vencimiento —
//    habría reportado un `null` que era culpa del ensayo, no del defecto).
// 🔴 `expiry-month` / `expiry-year` son HIDDEN: el SDK los deriva del campo
//    visible `.expiry`. Medido — la v2 de este ensayo intentaba tipear en un
//    input invisible y moría en timeout SIN tocar el defecto real.
await llenar('#tarjeta input.expiry', '12/30');
await llenar('#tarjeta input.cvc', '123');
await p.waitForTimeout(1200);
console.log('¿el SDK considera VÁLIDO el formulario?:',
  await p.evaluate(() => { try { return JSON.stringify(window.jQuery('#tarjeta').PaymentForm('card')) ? 'card OBJETO' : 'card NULL'; } catch(e){ return 'card NULL/err: '+e.message; } }));
await p.waitForTimeout(2500);   // deja que el SDK consulte el BIN

await p.locator('#guardar').click();
console.log('— GUARDAR tocado, esperando 35 s —');
await p.waitForTimeout(35000);

console.log('\nestado en pantalla:', JSON.stringify(await p.locator('#estado').textContent()));
console.log('¿montó el contenedor del OTP?:',
  await p.locator('#tarjeta .verification-container, #tarjeta .verification-wrapper, #tarjeta .otp-wrapper').count());

console.log('\n════ CONSOLA ════');   consola.slice(-25).forEach(l => console.log(' ', l));
console.log('\n════ PAGEERRORS ════'); fallos.forEach(l => console.log(' ', l));
console.log('\n════ RED (paymentez / nuestro endpoint) ════'); red.forEach(l => console.log(' ', l));

await b.close();
