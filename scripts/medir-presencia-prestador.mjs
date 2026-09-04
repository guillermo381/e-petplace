/**
 * S113-C · lote 0.3 — LA PRESENCIA SIN COACH EN EL PRESTADOR, medida.
 * Sesión REAL del refugio (credencial leída de docs/loop/S112-A.md).
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const cred = /guillo381\+refugio@gmail\.com`?\s*\/\s*\*\*`([^`]+)`\*\*/.exec(readFileSync('docs/loop/S112-A.md', 'utf8'))[1];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } })).newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(`${e.name}: ${e.message}`));
/* 🔴 **SÓLO LO VISIBLE.** `document.body.innerText` en RN-web incluye las
   pantallas de las OTRAS pestañas, que siguen montadas y ocultas — leerlo
   entero hace pasar el HOY del negocio por «lo que está en pantalla». Se
   filtra por visibilidad real (`offsetParent` + tamaño). */
const T = async () =>
  await page
    .evaluate(() =>
      [...document.querySelectorAll('div,span,p')]
        .filter((e) => e.offsetParent !== null && e.getClientRects().length > 0 && (e.textContent ?? '').trim())
        .map((e) => (e.childElementCount === 0 ? (e.textContent ?? '').trim() : ''))
        .filter(Boolean)
        .join('\n'),
    )
    .catch(() => '');
const di = (s) => console.log(s);

await page.goto('http://localhost:8083/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 60 && !(await T()).includes('Contraseña'); i++) await page.waitForTimeout(1000);
await page.getByRole('textbox', { name: 'Email' }).fill('guillo381+refugio@gmail.com');
await page.getByRole('textbox', { name: 'Contraseña' }).fill(cred);
await page.getByText('Entrar', { exact: true }).click();
for (let i = 0; i < 40 && !page.url().includes('/adopcion'); i++) await page.waitForTimeout(500);
await page.waitForTimeout(4000);

di(`ruta: ${page.url().replace('http://localhost:8083','')}`);
const orbe = page.getByRole('button', { name: 'Ver lo que te espera', exact: true });
di(`presencia montada: ${await orbe.count()} nodo(s)`);
/* 🔴 **QUÉ PANTALLA SE VE, PREGUNTADO AL NAVEGADOR Y NO AL TEXTO.** RN-web
   deja montadas las pantallas de las otras pestañas; ni `innerText` ni un
   filtro por `offsetParent` las descartan. `isVisible()` de playwright sí:
   mide la caja real. Se pregunta por un marcador de cada casa. */
const veo = async (frase) => await page.getByText(frase, { exact: false }).first().isVisible().catch(() => false);
di(`¿se ve el HOY del negocio?  ${(await veo('Hoy libre')) || (await veo('turnos')) ? 'SÍ' : 'no'}`);
di(`¿se ven las Adopciones?     ${(await veo('Padrinazgos')) || (await veo('Adopciones')) ? 'SÍ' : 'no'}`);
if ((await orbe.count()) === 0) { di('(sin presencia — nada que medir)'); await browser.close(); process.exit(2); }

di('\n── SE ABRE ────────────────────────────────────────────────');
await orbe.click();
await page.waitForTimeout(1500);
const t = await T();
const filas = await page.evaluate(() =>
  [...document.querySelectorAll('[role="button"]')].map((e) => (e.getAttribute('aria-label') ?? '').trim())
    .filter((n) => /solicitud|mensaje|pedido|Cerrar/i.test(n)));
di(`filas de la presencia: ${filas.join(' · ') || 'ninguna'}`);
di(`¿hay dedos? ${['Peso', 'Vacuna', 'Antiparasitario'].filter((d) => t.includes(d)).join(' · ') || 'NO ✓'}`);
di(`¿hay «Pregúntale»? ${/Pregúntale/i.test(t) ? 'SÍ 🔴' : 'no ✓'}`);

di('\n── LA FILA VA A SU DESTINO ────────────────────────────────');
const fila = page.getByRole('button', { name: /solicitud/i }).first();
if (await fila.count()) {
  await fila.click();
  await page.waitForTimeout(2500);
  di(`ruta tras el toque: ${page.url().replace('http://localhost:8083','')}`);
  di(`pantalla: ${(await T()).split('\n').filter((x) => x.trim()).slice(0, 4).join(' · ')}`);
} else di('no hay fila de solicitudes');

di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await browser.close();
