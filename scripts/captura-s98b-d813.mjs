/**
 * captura-s98b-d813.mjs — D-813: la ficha elegida, en las DOS casas.
 *
 * Server: expo web del CLIENTE en :8083, levantado DESDE MI ÁRBOL. Salida
 * `scripts/capturas/s98-b-d813/`. Nombre del lote por `LOTE=antes|despues`.
 *
 * QUÉ FOTOGRAFÍA: los paneles de `SelectorEspecie` de la galería, UNO POR
 * UNO. Desde S98-B la sección monta cuatro —cliente claro/dark y
 * **prestador claro/dark**—; los dos del prestador son nuevos, y **su
 * ausencia era la causa de que el defecto no tuviera síntoma**: los tres
 * paneles viejos eran todos del cliente, la única casa donde
 * `accent.control` y el tinte del relleno COINCIDEN.
 *
 * QUÉ MIRAR: en el panel del PRESTADOR, el borde y el relleno de la ficha
 * elegida tienen que ser de **la misma familia**. En el «antes» el borde
 * sale teal y el relleno magenta.
 *
 * 🔴 CÓMO SE SACA EL «ANTES», y por qué así: se revierten los CINCO
 * archivos de la cura (dos piezas + tres temas) **conservando la galería
 * nueva** — porque el espécimen que destapa el defecto es justamente el
 * que la cura trajo. *Fotografiar el «antes» sin los paneles del
 * prestador daría dos fotos idénticas y probaría lo contrario de lo que
 * pasó.*
 *
 * ⚠️ RN-WEB. El gate en dispositivo no es de esta pista.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const DIR = new URL('./capturas/s98-b-d813/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const BASE = process.env.BASE ?? 'http://localhost:8083';
const LOTE = process.env.LOTE ?? 'despues';

/** Los paneles, por su etiqueta. El orden es el de la galería. */
const PANELES = [
  ['cliente-claro', 'cliente claro — elegida'],
  ['prestador-claro', 'PRESTADOR claro (D-813)'],
  ['prestador-dark', 'PRESTADOR dark (D-813)'],
];
/** Alto del recorte de UN panel, en px CSS: la etiqueta + la pregunta +
 *  la grilla 3×2. Se verifica MIRANDO la captura, no calculándolo. */
const ALTO_PANEL = 560;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errores = [];
const ctx = await browser.newContext({
  locale: 'es-EC',
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
page.on('pageerror', (e) => errores.push(String(e)));
await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForTimeout(5000);

// El toast de dev de expo-web se para en la esquina inferior y tapa el pie
// del panel. Se cierra, no se esquiva moviendo el recorte: mover el
// recorte sería acomodar la evidencia al estorbo.
// ⚠️ Lo que ANUNCIA sí es un hallazgo y queda declarado, no silenciado:
// 27 avisos de `two children with the same key` en la galería del
// cliente. MEDIDO que son PREEXISTENTES —el mismo 27 con y sin el hunk
// de esta sesión, comprobado revirtiéndolo— así que no entran a esta
// cura; entran a la cola como higiene del instrumento.
const cerrar = page.locator('#error-toast button, [aria-label="Close"]').first();
if ((await cerrar.count()) > 0) {
  await cerrar.click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(600);
}

let n = 0;
for (const [nombre, etiqueta] of PANELES) {
  // 🔴 EL GUARD VA POR LA ETIQUETA EXACTA DEL PANEL, no por una palabra
  // suelta — y esto es una CURA, no una precaución. La primera versión
  // contaba `PRESTADOR` en TODA la galería y devolvió **40**: pasó por la
  // razón equivocada, que en esta casa está tan roto como fallar por la
  // razón equivocada. La pregunta buena no es «¿aparece la palabra?» sino
  // «¿está montado ESTE panel?».
  const panel = page.getByText(etiqueta, { exact: false }).first();
  if ((await panel.count()) === 0) {
    console.error(`✗ falta el panel «${etiqueta}» — sin él la foto no muestra D-813.`);
    await browser.close();
    process.exit(1);
  }
  await panel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const caja = await panel.boundingBox();
  await page.screenshot({
    path: `${DIR}${LOTE}-${nombre}.png`,
    clip: { x: 0, y: Math.max(0, caja.y - 12), width: 420, height: ALTO_PANEL },
  });
  console.log(`✓ ${LOTE}-${nombre}.png`);
  n++;
}

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`);
  for (const e of errores) console.error(`  · ${e}`);
  process.exit(1);
}
console.log(`✓ ${n}/${PANELES.length} paneles · sin errores JS`);
