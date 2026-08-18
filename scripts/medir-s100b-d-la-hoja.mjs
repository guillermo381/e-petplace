/**
 * medir-s100b-d-la-hoja.mjs — ¿LA HOJA SOBRE EL MAPA ACOTA SU SCROLL?
 * (S100b-D · el único rojo que me quedó abierto)
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ⚠️⚠️ **ESTE INSTRUMENTO NO CORRE ENTERO, Y SE COMMITEA IGUAL CON SU
 * ESTADO EN LA PUERTA — jamás como un gate que alguien pueda creer verde.**
 *
 * **Dónde para:** llega al login y **no consigue pasarlo dentro del margen
 * de espera** (tras el toque de «Entrar» la pantalla sigue mostrando el
 * formulario). *No se diagnosticó: se declara.* Todo lo que hay debajo de
 * la entrada está escrito y sin ejercitar.
 *
 * 🔴 **PERO YA PAGÓ SU CONSTRUCCIÓN CON UN HALLAZGO, y por eso vive:**
 * **todo `page.goto` a una ruta de la app es una RECARGA COMPLETA, y en la
 * recarga los efectos de la pantalla corren ANTES de que el entry llame a
 * `initApi()`** ⇒ la pantalla monta, pide datos y revienta
 * (`getClient: initApi() no fue llamado`). **Pasa igual en `/despensa`,
 * que no es mía** — o sea que **no es de una pantalla: es del método de
 * medición**. Cualquier instrumento de esta casa que navegue por `goto`
 * puede estar midiendo una pantalla que nunca tuvo datos, **y su síntoma
 * es «no encontré el scroller», que se lee como un defecto de layout.**
 * *Un rojo del instrumento que significa «no pude medir» no se lee como
 * «está roto».* ⇒ se navega TOCANDO, como una persona.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── QUÉ CONTESTA, Y POR QUÉ HACE FALTA ─────────────────────────────────
 * Rehice **EN CAMINO**: el mapa pasó de banda a FONDO y una hoja anclada
 * abajo se apoya encima, con `maxHeight` derivado del lienzo medido y su
 * propio `ScrollView` adentro.
 *
 * 🔴 **El riesgo:** un `ScrollView` necesita altura **acotada** para
 * scrollear. La hoja tiene `maxHeight` y **ninguna altura fija**. Si el
 * padre no lo acota, el contenido se **recorta y no scrollea** — y en
 * pantalla **eso se ve idéntico a la zona muerta de gesto que B midió en
 * otra pieza**. Lo que quedaría bajo el recorte es **el CÓDIGO DE LA
 * PUERTA**, así que se trata como rojo hasta que alguien lo mire.
 *
 * Y la pregunta se afina con la distinción que A trajo y B confirmó en
 * aparato: **un `paddingBottom` garantiza ALCANZABILIDAD, no NO-SOLAPE.**
 * Por eso acá se preguntan las dos cosas por separado:
 *   ① ¿el visor está ACOTADO y el contenido puede desplazarse?
 *   ② el código de la puerta, ¿se ve sin tocar nada? y si no, ¿se ALCANZA?
 *   ③ ¿cuánto lienzo se queda el mapa? (`PISO_DEL_MAPA` en acción)
 *
 * ── 🔴 LO QUE ESTE APARATO **NO** PUEDE DECIR, declarado ───────────────
 * **RN-web no es el teléfono.** No tiene la barra de tabs nativa, ni los
 * insets del sistema, ni el manejo de gestos táctiles. ⇒ **contesta la
 * mitad de LAYOUT** (¿está acotado? ¿se recorta?), que corre sobre el
 * mismo Yoga, **y NO contesta la mitad de GESTO** (¿el dedo apoyado abajo
 * mueve la hoja?). Esa la corre B con el teléfono, cuando haya publish.
 * *Un verde de acá NO cierra el rojo: lo achica a la mitad que queda.*
 *
 * ── PROCEDENCIA ────────────────────────────────────────────────────────
 * El `scroller()` y el flujo de entrada son de **C**
 * (`scripts/medir-s100b-cromo.mjs`, `origin/pista-c`), tomados con su
 * permiso y con su límite declarado. *Se reusa en vez de reescribirse: dos
 * instrumentos que buscan el scroller de dos maneras distintas producen
 * dos verdades y ninguna comparable.* El viewport es **el mismo** que C
 * ajustó para emparejar el aparato de B — cambiarlo rompería la
 * comparabilidad entre las tres pistas.
 *
 * 🔴 CREDENCIALES (R6): la clave sale del keychain AL MOMENTO y jamás se
 * imprime ni se escribe.
 *
 * Uso:  node scripts/medir-s100b-d-la-hoja.mjs <envioPedidoId> [sufijo] [puerto]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const PEDIDO = process.argv[2];
const SUFIJO = process.argv[3] ?? '8';
const PUERTO = process.argv[4] ?? '8092';
const BASE = `http://localhost:${PUERTO}`;
const EMAIL = `guillo381+${SUFIJO}@gmail.com`;

if (PEDIDO === undefined) {
  console.error('✗ falta el pedidoId. Uso: node scripts/medir-s100b-d-la-hoja.mjs <pedidoId>');
  process.exit(1);
}

/** El mismo teléfono de referencia que C — ver la nota de procedencia. */
const ANCHO = 384;
const ALTO = 832;

let PASS = '';
try {
  PASS = execFileSync(
    'security',
    ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
    { encoding: 'utf8' },
  ).trim();
} catch {
  console.error('✗ no se pudo leer la clave del keychain');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await ctxNuevo();
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

async function ctxNuevo() {
  return browser.newContext({ locale: 'es-EC', viewport: { width: ANCHO, height: ALTO } });
}

/** De C, verbatim salvo comentarios: el contenedor que DE VERDAD scrollea,
 *  buscado por COMPORTAMIENTO y exigido VISIBLE — `expo-router` conserva en
 *  el DOM el scroller de la pantalla anterior. */
async function scroller() {
  return page.evaluate(() => {
    document
      .querySelectorAll('[data-medicion-scroller]')
      .forEach((e) => e.removeAttribute('data-medicion-scroller'));
    const cand = [...document.querySelectorAll('div')].filter((d) => {
      const s = getComputedStyle(d);
      if (s.overflowY !== 'scroll' && s.overflowY !== 'auto') return false;
      if (d.clientHeight < 120) return false;
      const r = d.getBoundingClientRect();
      return r.width > 100 && r.bottom > 0 && r.top < window.innerHeight;
    });
    if (cand.length === 0) return null;
    const d = cand.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    d.setAttribute('data-medicion-scroller', '1');
    const r = d.getBoundingClientRect();
    return {
      clientHeight: d.clientHeight,
      scrollHeight: d.scrollHeight,
      puedeScrollear: d.scrollHeight > d.clientHeight + 1,
      sobrante: d.scrollHeight - d.clientHeight,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
    };
  });
}

/** La caja de un texto visible. `null` = no está, y eso se DICE. */
async function cajaDe(texto) {
  const loc = page.getByText(texto, { exact: false }).first();
  if ((await loc.count()) === 0) return null;
  const b = await loc.boundingBox();
  return b === null ? null : { top: Math.round(b.y), alto: Math.round(b.height) };
}

console.log(`\n═══ D · LA HOJA SOBRE EL MAPA · viewport ${ANCHO}×${ALTO} ═══`);
console.log('⚠️  RN-web: contesta LAYOUT, no GESTO. El gesto lo corre B.\n');

await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(8000);
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

/* 🔴 SE NAVEGA POR DENTRO, CLICK A CLICK, Y NO POR `goto` A LA RUTA.
   Primer intento: `goto` directo a `/despensa/en-camino/<id>` ⇒ la pantalla
   MONTÓ y su `useFocusEffect` llamó al wrapper **antes de que el entry
   inicializara la API** (`getClient: initApi() no fue llamado`, con el stack
   apuntando a mi propia línea 136). *El instrumento reportó «no hay
   scroller» y eso NO era la pantalla: era que nunca llegó a tener datos.*
   ⇒ **un rojo del instrumento que significa «no pude medir» no se lee como
   «está roto»** — la clase que esta sesión viene pagando toda la vuelta.

   🔴 **Y al medirlo apareció que NO es de mi pantalla: es de TODO `goto`.**
   El mismo error sale en `/despensa` (pantalla de C), con el stack en SU
   `useEffect`. *Un `goto` de Playwright es una RECARGA COMPLETA, y en la
   recarga los efectos de la pantalla corren antes de que el entry inicialice
   la API.* El login no lo sufre porque ahí la navegación es del router, no
   del navegador. ⇒ **acá se navega como una persona: tocando.** */
await page.getByText('Despensa', { exact: true }).first().click();
await page.waitForTimeout(11000);
await page.getByText('Tus pedidos', { exact: false }).first().click();
await page.waitForTimeout(6000);
await page.getByText('Pedido del', { exact: false }).first().click();
await page.waitForTimeout(7000);
await page.getByText('Seguir el pedido', { exact: false }).first().click();
await page.waitForTimeout(9000);

const sv = await scroller();

console.log('── ① ¿LA HOJA ACOTA SU SCROLL? ──');
if (sv === null) {
  console.log('  🔴 NO se encontró ningún scroller visible.');
  console.log('     O la hoja no montó, o su ScrollView no quedó acotado.');
  console.log('     Las dos son rojo y las dos son mías.');
} else {
  console.log(`  visor (clientHeight) ........ ${sv.clientHeight} dp  [${sv.top}–${sv.bottom}]`);
  console.log(`  contenido (scrollHeight) .... ${sv.scrollHeight} dp`);
  console.log(
    `  🔴 ¿puede desplazarse? ...... ${sv.puedeScrollear ? `SÍ (sobran ${sv.sobrante} dp)` : 'NO — el contenido entra entero'}`,
  );
  // 🔴 EL DISCRIMINADOR DEL INSTRUMENTO: «no scrollea» tiene DOS causas
  // opuestas —el contenido entra entero (bien) o el visor colapsó (rojo)—
  // y se ven igual en el booleano. El alto del visor las separa.
  if (!sv.puedeScrollear && sv.clientHeight < 200) {
    console.log('  🔴 VISOR COLAPSADO: no scrollea porque casi no tiene alto.');
  }
  const pctHoja = ((sv.clientHeight / ALTO) * 100).toFixed(1);
  console.log(`\n── ③ EL REPARTO DEL LIENZO ──`);
  console.log(`  la hoja se queda ............ ${pctHoja} % de la pantalla`);
  console.log(`  ⇒ al mapa le queda .......... ~${(100 - Number(pctHoja)).toFixed(1)} %`);
  console.log(`     (firma: el mapa nunca baja del 40 % — PISO_DEL_MAPA)`);
}

console.log('\n── ② EL CÓDIGO DE LA PUERTA: ¿se ve, y si no, se ALCANZA? ──');
const antes = await cajaDe('Tu código');
const codigoVisibleSinTocar =
  antes !== null && sv !== null && antes.top >= sv.top && antes.top + antes.alto <= sv.bottom;
console.log(
  `  sin tocar nada .............. ${antes === null ? 'NO está en el árbol' : codigoVisibleSinTocar ? 'SE VE' : `fuera del visor (top ${antes.top}, visor hasta ${sv?.bottom})`}`,
);

if (sv !== null && sv.puedeScrollear) {
  await page.evaluate(() => {
    const d = document.querySelector('[data-medicion-scroller]');
    if (d !== null) d.scrollTop = d.scrollHeight;
  });
  await page.waitForTimeout(1200);
  const movio = await page.evaluate(() => {
    const d = document.querySelector('[data-medicion-scroller]');
    return d === null ? 0 : d.scrollTop;
  });
  const desp = await cajaDe('Tu código');
  console.log(`  scroll efectivo ............. ${Math.round(movio)} dp`);
  console.log(
    `  después de desplazar ........ ${desp === null ? 'NO está' : desp.top >= (sv.top ?? 0) && desp.top + desp.alto <= sv.bottom ? 'SE ALCANZA' : `sigue fuera (top ${desp.top})`}`,
  );
}

console.log(`\nerrores de página: ${errores.length}`);
for (const e of errores.slice(0, 3)) console.log(`  · ${e.slice(0, 160)}`);

await page.screenshot({
  path: 'docs/laminas/s100b-medicion/d-en-camino-hoja-sobre-mapa.png',
  fullPage: false,
});
console.log('captura: docs/laminas/s100b-medicion/d-en-camino-hoja-sobre-mapa.png');

await browser.close();
