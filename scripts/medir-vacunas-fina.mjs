/**
 * ⭐ **LA PANTALLA DE VACUNAS: ¿DICE TODO LO QUE LE LLEGA?** (S113-C · 1.1 · C4).
 *
 * Mide dos cosas que se pueden mirar sin tocar nada: **el detalle fino** de cada
 * vacuna (los campos que `A4` dejó de tirar) y **«Su plan»** con sus filas. Va
 * con su control: la misma pantalla en una mascota **en memoria**, donde no
 * puede pedir nada.
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const MASCOTA_ID = process.env.MASCOTA_ID ?? '';
const QUIEN = process.env.QUIEN ?? '(sin nombre)';
const di = (s) => console.log(s);

const navegador = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await navegador.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 160)));
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');

di(`cuenta: ${CORREO} · mascota: ${QUIEN}`);
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 200 && (await page.locator('input[type="password"]').count()) === 0; i += 1) {
  await page.waitForTimeout(1000);
}
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(14000);

await page.goto(`http://localhost:8082/hogar/vacunas/${MASCOTA_ID}`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(9000);

/* Se despliega la primera vacuna: el detalle fino vive en el acordeón. */
/* 🔴 **LA FILA SE TOCA POR SU FORMA, no por el nombre de la vacuna.** La
   primera version buscaba «Rabia|Quíntuple» y no matcheó nada: las vacunas
   reales se llaman «Procyon Dog Pv» y «Canigen LR». *Un arnés que espera los
   nombres que yo imagino mide mi imaginación.* Cada fila se rotula
   `nombre · vigencia`, así que se toma la primera con ese separador. */
const abrible = await page.evaluate(() =>
  [...document.querySelectorAll('[role="button"]')]
    .map((e) => (e.getAttribute('aria-label') ?? '').trim())
    .filter((x) => x.includes(' · ') && x.length > 8),
);
di(`filas desplegables: ${abrible.length}${abrible.length ? ` · toco «${abrible[0]}»` : ''}`);
if (abrible.length > 0) {
  await page.getByRole('button', { name: abrible[0], exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(2500);
}

const t = await T();
di('');
di('── EL DETALLE FINO (A4) ───────────────────────────────────');
for (const r of ['Lote', 'Laboratorio', 'Vía', 'Vence el frasco', 'Se la aplicó']) {
  di(`  ${r.padEnd(16)} ${t.includes(r) ? 'sí ✓' : '—'}`);
}
di('');
di('── SU PLAN ────────────────────────────────────────────────');
di(`  la sección aparece: ${/Su plan/i.test(t) ? 'sí ✓' : 'no'}`);
const voces = ['Al día', 'Vence en', 'Venció hace', 'No sabemos cuándo', 'No figura en su carnet', 'Todavía no le toca', 'No pudimos clasificarla'];
di(`  voces de estado a la vista: ${voces.filter((v) => t.includes(v)).join(' · ') || 'ninguna'}`);
di(`  «Obligatoria» / «Opcional»: ${/Obligatoria/.test(t) ? 'sí' : 'no'} / ${/Opcional/.test(t) ? 'sí' : 'no'}`);
di(`  nota de sin clasificar: ${/no pudimos ubicar en el plan/i.test(t) ? 'sí' : 'no'}`);
di('');
di(`verbos que le PIDEN algo: ${['Registrar', 'Cargar', 'Reservar', 'Agendar'].filter((v) => new RegExp(`(^|\\W)${v}`).test(t)).join(' · ') || 'NINGUNO ✓'}`);
di(`errores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await page.screenshot({ path: `docs/loop/S113-C-vacunas-${QUIEN}.png`, fullPage: true });
di(`captura: docs/loop/S113-C-vacunas-${QUIEN}.png`);
await navegador.close();
