/**
 * S113-C · lote 0.3 — EL MEMORIAL DEL CLIENTE: la misma pieza, sin Coach.
 *
 * 🔴 **Qué se mide y por qué eso:** con una mascota en memorial la presencia
 * **conserva su puerta** (el carrito y los mensajes no desaparecen porque
 * alguien esté de duelo) pero **no propone**: sin dedos y sin «Pregúntale».
 * Se pregunta por los nodos tocables, que es lo que el compilador de B ya hace
 * imposible pasar — acá se comprueba que el MONTAJE tampoco los produce.
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } })).newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(`${e.name}: ${e.message}`));
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');
const di = (s) => console.log(s);
const botones = async () =>
  await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => (e.getAttribute('aria-label') ?? '').trim()).filter(Boolean));

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 60 && !(await T()).includes('Contraseña'); i++) await page.waitForTimeout(1000);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(16000);

di('── ① EL HOGAR ACTIVO (con Coach) ──────────────────────────');
const conCoach = page.getByRole('button', { name: /^Abrir a /i });
di(`presencia con Coach: ${await conCoach.count()} nodo(s)`);
if (await conCoach.count()) {
  await conCoach.first().click();
  await page.waitForTimeout(1500);
  const t = await T();
  di(`dedos: ${['Peso', 'Vacuna', 'Antiparasitario', 'Foto'].filter((d) => t.includes(d)).join(' · ') || 'ninguno'}`);
  di(`«Pregúntale»: ${/Pregúntale/i.test(t) ? 'SÍ ✓' : 'no'}`);
  await page.keyboard.press('Escape').catch(() => {});
}

di('\n── ② LA MASCOTA EN MEMORIAL (Sombra) ──────────────────────');
/* Se entra por la ficha: el tema memorial lo pone la mascota en foco. */
const sombra = page.getByText('Sombra', { exact: false }).first();
if ((await sombra.count()) === 0) {
  di('🔴 No encuentro a Sombra en este hogar — no pude medir el memorial.');
  di(`hogar: ${(await T()).split('\n').filter((x) => x.trim()).slice(0, 8).join(' · ')}`);
  di(`\nerrores: ${errores.length}`);
  await browser.close();
  process.exit(2);
}
await sombra.click();
await page.waitForTimeout(6000);
const t2 = await T();
const b2 = await botones();
di(`ruta: ${page.url().replace('http://localhost:8082','')}`);
di(`presencia montada: ${b2.filter((n) => /^(Abrir|Ver lo que|Lo que te espera)/i.test(n)).join(' · ') || 'NINGUNA 🔴'}`);
di(`¿hay dedos? ${b2.filter((n) => /^(Peso|Vacuna|Antiparasitario|Foto)$/i.test(n)).join(' · ') || 'NO ✓'}`);
di(`¿hay «Pregúntale»? ${b2.some((n) => /Pregúntale/i.test(n)) ? 'SÍ 🔴' : 'no ✓'}`);
di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await browser.close();
