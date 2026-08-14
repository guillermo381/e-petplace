/**
 * mirar-s98c-cliente-entrada.mjs — LA PASADA DE OJO DEL CLIENTE (S98-C).
 *
 * `Entrada` cambió de motor en esta sesión: dejó las layout animations de
 * Reanimated (que en RN-web dejaban el nodo en `position: absolute` y
 * colapsaban a altura 0 cualquier contenedor que necesitara el alto de sus
 * hijos) y pasó a un estilo animado. **Mismo gesto, mismos números** — eso
 * es lo que hay que verificar, no suponer.
 *
 * El cliente tiene SIETE consumidores de `Entrada` y **cero de `Baldosa`**
 * (medido), así que el riesgo entero vive en esta pieza.
 *
 * ⚠️ ES SOLO LECTURA. `apps/cliente` no es territorio de esta pista: acá
 * se mide y se reporta; si algo se movió, es hallazgo, no cura.
 *
 * Además de la foto mide lo que la foto NO muestra: que ningún nodo de
 * `Entrada` haya quedado `absolute` (el defecto viejo) y que el contenedor
 * tenga alto real (el síntoma).
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-cliente/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const RUTAS = [
  ['bienvenida', 'http://localhost:8083/bienvenida'],
  ['login', 'http://localhost:8083/login'],
  ['registro', 'http://localhost:8083/registro'],
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

for (const [nombre, url] of RUTAS) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 180000 });
  // La entrada escalonada dura ~300 ms + escalón×n; se espera a que TERMINE
  // (una foto a mitad del gesto no dice si quedó bien, dice que se movía).
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${DIR}${nombre}.png` });

  /* 🔴 LO QUE LA FOTO NO MUESTRA: el defecto viejo era de LAYOUT, no de
     color — un nodo absoluto se ve igual de bien hasta que su padre
     necesita el alto. Se cuentan los absolutos y los contenedores en 0. */
  const forense = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const absolutos = divs.filter((d) => getComputedStyle(d).position === 'absolute').length;
    const enCero = divs.filter((d) => {
      const r = d.getBoundingClientRect();
      return r.width > 40 && r.height === 0 && d.children.length > 0;
    }).length;
    const texto = document.body.innerText.slice(0, 90).replace(/\n+/g, ' · ');
    return { absolutos, enCero, texto };
  });
  console.log(
    `✓ ${nombre.padEnd(12)} absolutos=${String(forense.absolutos).padStart(3)} · ` +
      `contenedores-en-0=${forense.enCero} · «${forense.texto}»`,
  );
}

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`, errores.slice(0, 3));
  process.exit(1);
}
console.log('✓ sin errores JS');
