/**
 * D-1020 · EL REFUGIO AL ENTRAR — los tres síntomas del founder, medidos.
 *
 * Sesión REAL de refugio. **La credencial NO vive en este archivo**: se lee de
 * `docs/loop/S112-A.md`, donde A la dejó escrita, igual que las de `.env.local`.
 *
 * Se captura el PRIMER RENDER (sin recargar) y después la recarga, porque el
 * founder reporta que los tres se corrigen solos al navegar o recargar — *y esa
 * diferencia es el dato, no un detalle del método.*
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const acta = readFileSync('docs/loop/S112-A.md', 'utf8');
const mCred = /guillo381\+refugio@gmail\.com`?\s*\/\s*\*\*`([^`]+)`\*\*/.exec(acta);
if (mCred === null) {
  console.log('ROJO · no pude leer la credencial del refugio de S112-A.md — no pude medir.');
  process.exit(2);
}
const CORREO = 'guillo381+refugio@gmail.com';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(`${e.name}: ${e.message}`));

const di = (s) => console.log(s);
const texto = async () => await page.evaluate(() => document.body.innerText).catch(() => '');
const esperar = async (frase, veces = 90) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) { await page.waitForTimeout(1000); t = await texto(); }
  return t;
};
const url = () => page.url().replace('http://localhost:8083', '');

/** Las marcas de cada casa, para no confundirlas por una palabra suelta. */
const marcasNegocio = (t) => ['DEL DÍA', 'prepara tu espacio', 'Prepara tu espacio', 'Te quedan', 'EN RUTA'].filter((f) => t.includes(f));

/* 🔴 **LAS PESTAÑAS SE LEEN DE LA BARRA, NO DEL TEXTO — y esto lo corrigió su
   propio rojo.** La primera versión buscaba las palabras en `innerText` y
   contaba «Refugio» como pestaña cuando la pantalla dice «Hola, Refugio» y
   «Refugio de prueba Satori». *Un censo por palabra suelta mide el saludo.*
   La barra publica cada pestaña como `role="button"` con su `aria-label`, y
   son las últimas del documento: se leen de ahí. */
const barra = async () =>
  await page.evaluate(() => {
    const nombres = ['Hoy', 'Datos', 'Atender', 'Negocio', 'Cuenta', 'Refugio', 'Peluditos', 'Ventas'];
    return [...document.querySelectorAll('[role="button"]')]
      .map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim())
      .filter((n) => nombres.includes(n));
  });

await page.goto('http://localhost:8083/login', { waitUntil: 'networkidle', timeout: 240000 });
await esperar('Contraseña', 90);
await page.getByRole('textbox', { name: 'Email' }).fill(CORREO);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(mCred[1]);
await page.getByText('Entrar', { exact: true }).click();

di('── ① LOS PRIMEROS SEGUNDOS, CUADRO A CUADRO ───────────────');
/* 🔴 **NO se espera y después se mira: se mira MIENTRAS.** El founder reporta
   que los tres se corrigen solos, así que el estado intermedio ES el hallazgo —
   y un `waitFor` de 40 s lo perdería entero. Se muestrea cada 400 ms. */
const cuadros = [];
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(400);
  const t = await texto();
  const b = await barra();
  const firma = `${url()} | tabs=[${b.join(',')}] | negocio=[${marcasNegocio(t).join(',')}]`;
  if (cuadros.length === 0 || cuadros[cuadros.length - 1].firma !== firma) {
    cuadros.push({ ms: (i + 1) * 400, firma });
  }
  if (b.length > 0 && i > 12) break;
}
for (const c of cuadros) di(`  +${String(c.ms).padStart(5)}ms · ${c.firma}`);

di('');
const t1 = await texto();
di(`ruta: ${url()}`);
di(`tabs (de la BARRA): ${(await barra()).join(' · ') || 'ninguna'}`);
di(`marcas del home de NEGOCIO: ${marcasNegocio(t1).join(' · ') || 'ninguna'}`);
di(`primeras líneas: ${t1.split('\n').slice(0, 5).join(' · ')}`);

/* SÍNTOMA 2 — la pestaña activa. `BarraTabs` marca el activo con el disco; en
   web se lee de `aria-selected`/`aria-current` si los publica, y si no, del
   nombre de la ruta contra los items. Se mide lo que HAY. */
const activos = await page.evaluate(() =>
  [...document.querySelectorAll('[role="button"][aria-selected="true"], [aria-current]')].map(
    (e) => e.getAttribute('aria-label') ?? e.textContent?.trim() ?? '?',
  ),
);
di(`pestaña marcada como activa: ${activos.length ? activos.join(' · ') : 'NINGUNA'}`);

/* SÍNTOMA 3 — la burbuja y su destino. */
const burbuja = page.getByRole('button', { name: /Ver las solicitudes|Ver tus conversaciones|Lo que te espera/i });
di(`burbuja: ${await burbuja.count()} nodo(s)${await burbuja.count() ? ' — «' + await burbuja.first().getAttribute('aria-label') + '»' : ''}`);

di('\n── ② DESPUÉS DE RECARGAR ──────────────────────────────────');
await page.reload({ waitUntil: 'networkidle', timeout: 180000 });
const cuadros2 = [];
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(400);
  const t = await texto();
  const b = await barra();
  const firma = `${url()} | tabs=[${b.join(',')}] | negocio=[${marcasNegocio(t).join(',')}]`;
  if (cuadros2.length === 0 || cuadros2[cuadros2.length - 1].firma !== firma) cuadros2.push({ ms: (i + 1) * 400, firma });
  if (b.length > 0 && i > 12) break;
}
for (const c of cuadros2) di(`  +${String(c.ms).padStart(5)}ms · ${c.firma}`);
di('');
const t2 = await texto();
di(`ruta: ${url()}`);
di(`tabs (de la BARRA): ${(await barra()).join(' · ') || 'ninguna'}`);
di(`marcas del home de NEGOCIO: ${marcasNegocio(t2).join(' · ') || 'ninguna'}`);
di(`primeras líneas: ${t2.split('\n').slice(0, 5).join(' · ')}`);

di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await browser.close();
