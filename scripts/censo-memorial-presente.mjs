/**
 * ⭐ **CENSO · QUÉ VOCES HABLAN EN PRESENTE EN LA PANTALLA DE UNA MEMORIAL**
 * (E, S113 · fase 3 · ②).
 *
 * 🔴 **Se lee de la PANTALLA VIVA, no del diccionario.** El diccionario tiene
 * miles de cadenas y la mayoría no se dibuja acá; y al revés, una voz compuesta
 * por la pantalla (nombre + etapa + peso) **no existe como cadena**. *Un censo
 * del diccionario mide el vocabulario; éste mide lo que la familia lee.*
 *
 * ⚠️ Lo que NO decide: qué frase está bien. Marca las que **conjugan en
 * presente** y las pone a la vista — la decisión de cada una es de producto.
 */
import { chromium } from 'playwright-core';

const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL ?? '');
await page.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD ?? '');
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(18000);
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await page.getByRole('button', { name: /^(Ver a )?Sombra/ }).first().click();
await page.waitForTimeout(7000);

/* Verbos en PRESENTE que afirman algo de la mascota AHORA. La lista es corta y
   explícita: *un matcher astuto sobre conjugación española marca «pesa» dentro
   de «pesado» y deja de ser un censo para volverse ruido.* */
const PRESENTE = [
  ['\\btiene\\b', 'tiene'], ['\\bestá\\b', 'está'], ['\\bes\\b', 'es'],
  ['\\bvive\\b', 'vive'], ['\\bpesa\\b', 'pesa'], ['\\bnecesita\\b', 'necesita'],
  ['\\bva\\b', 'va'], ['\\bpuede\\b', 'puede'], ['\\bcome\\b', 'come'],
  ['~\\d', 'edad sin verbo («~11 años»)'],
];

/* 🔴 **LO QUE YA ESTÁ EN PASADO NO SE MARCA, y esto lo cobró mi propio censo.**
   El patrón de la edad busca «~11» y marcaba «tenía ~11 años» — *la cura y su
   marca, la misma línea.* Un verbo en pretérito delante convierte la frase en
   lo que el censo quería lograr: se descuenta, y **se descuenta por su verbo**,
   no por la frase entera, para que el día que aparezca otra edad sin verbo
   siga saliendo. */
const YA_EN_PASADO = /\b(ten[ií]a|estaba|era|viv[ií]a|pesaba|fue|hab[ií]a)\b/i;

const lineas = await page.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('div,span')) {
    if (e.children.length > 0) continue;
    const t = (e.textContent ?? '').trim();
    if (t === '' || t.length > 90) continue;
    const r = e.getBoundingClientRect();
    if (r.height === 0) continue;
    if (!out.some((o) => o.t === t)) out.push({ t, y: Math.round(r.y + window.scrollY) });
  }
  return out.sort((a, b) => a.y - b.y);
});

console.log(`SOMBRA (memorial) · ${lineas.length} líneas de texto a la vista\n`);
let n = 0;
for (const l of lineas) {
  const hit = PRESENTE.find(([re]) => new RegExp(re, 'i').test(l.t));
  if (hit === undefined) continue;
  if (YA_EN_PASADO.test(l.t)) continue;
  n += 1;
  console.log(`  🔴 y=${String(l.y).padStart(5)}  «${l.t}»   ← ${hit[1]}`);
}
console.log(`\n${n === 0 ? '✓ VERDE · ninguna voz habla en presente.' : `🔴 ${n} voz/voces en presente.`}`);
console.log('⚠️ Su verde dice «ninguna de las formas que miro», jamás «la voz está bien»:');
console.log('   no mira gramática, ni las voces que no se dibujan hoy.');
await nav.close();
