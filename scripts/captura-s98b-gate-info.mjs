/**
 * captura-s98b-gate-info.mjs — EL DISPARO DEL GATE POR ÍCONO DEL ⓘ (§6b).
 *
 * Server: expo web del CLIENTE en :8083, levantado DESDE MI ÁRBOL —
 * los Metro de :8081 y :8082 son de los worktrees de C y D y sirven SU
 * código, no el mío. *Fotografiar el árbol de otra pista y llamarlo mi
 * entrega sería la clase de evidencia falsa que L-192 persigue.*
 *
 * Salida: `scripts/capturas/s98-b-gate-info/`.
 *
 * 🔴 POR QUÉ DOS ESCALAS DE CAPTURA Y NO UNA, que es la decisión de este
 * script:
 *
 *  · `21px-real` sale a **deviceScaleFactor 1**: el glifo ocupa 21 píxeles
 *    de verdad. **Ésa es la pregunta del gate** — *«¿el ⓘ y el salvavidas
 *    se distinguen a 21 px?»* se contesta viendo 21 píxeles, no una
 *    ampliación de ellos.
 *  · `21px-detalle` sale a **deviceScaleFactor 3**: el mismo glifo con el
 *    detalle que un teléfono retina sí dibuja. Sin ésta, una captura a
 *    DPR 1 vista en una pantalla retina se AMPLÍA y se ve borrosa —
 *    y el founder estaría juzgando el desenfoque del PNG, no la forma
 *    del glifo. *Un instrumento que le agrega ruido a lo que mide no es
 *    un instrumento.*
 *
 * ⚠️ ESTO ES RN-WEB. El gate en dispositivo no es de esta pista, y a
 * 21 px la diferencia entre un rasterizador y otro es justo del tamaño
 * de la pregunta. Se declara en la entrega, no se esconde.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const DIR = new URL('./capturas/s98-b-gate-info/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const BASE = process.env.BASE ?? 'http://localhost:8083';
const TITULO = 'cierra «glifo de control»';
/** Alto del recorte, en px CSS: el título + las dos filas (21 y 44) + los
 *  tres apoyos, incluida la pregunta del gate. Se verifica MIRANDO la
 *  captura, no calculándolo — si la pregunta queda cortada, sube. */
const ALTO_SECCION = 360;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errores = [];

async function tirar(nombre, { dpr, tema = 'light' }) {
  const ctx = await browser.newContext({
    locale: 'es-EC',
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: dpr,
    colorScheme: tema,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errores.push(`[${nombre}] ${String(e)}`));
  await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle', timeout: 240000 });
  await page.waitForTimeout(4000);

  // 🔴 EL GUARD, ANTES DE CUALQUIER FOTO (L-192, y su caso vivo está en
  // `captura-s98c-atender.mjs`): un script de captura cuyo modo de falla
  // es sacar la foto equivocada es una fuente de evidencia falsa. Acá el
  // modo de falla propio sería fotografiar una galería SIN la sección —
  // porque el Metro sirviera otro árbol, o porque el scroll no llegara.
  const seccion = page.getByText(TITULO, { exact: false }).first();
  if ((await seccion.count()) === 0) {
    console.error(`✗ ${nombre}: la sección «${TITULO}» NO está en esta galería.`);
    console.error('  ⇒ o el Metro sirve otro árbol, o la sección no está montada. NO se fotografía.');
    await browser.close();
    process.exit(1);
  }
  await seccion.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  // La FOTO ES DE LA SECCIÓN, no de la pantalla: el founder firma de un
  // vistazo y una captura con la sección en un rincón le hace buscar
  // antes de mirar.
  //
  // 🔴 EL RECORTE VA POR CAJA MEDIDA, NO POR ANCESTRO — y esto es una
  // cura, no una preferencia. La primera versión pedía
  // `ancestor::*[4]` y salió un PNG de **89.457 px de alto**: había
  // agarrado el contenedor del scroll de toda la galería. *Y mi guard no
  // lo cazó porque verificaba que la sección EXISTIERA, no que la foto
  // fuera DE la sección* — el mismo error que el guard venía a evitar,
  // un piso más arriba. Contar ancestros es adivinar la forma del árbol
  // de otro componente; la caja del título es un dato que se mide.
  const caja = await seccion.boundingBox();
  if (!caja) {
    console.error(`✗ ${nombre}: la sección no tiene caja medible.`);
    await browser.close();
    process.exit(1);
  }
  await page.screenshot({
    path: `${DIR}${nombre}.png`,
    clip: {
      x: 0,
      y: Math.max(0, caja.y - 16),
      width: 420,
      height: ALTO_SECCION,
    },
  });
  console.log(`✓ ${nombre}.png  (dpr ${dpr} · ${tema})`);
  await ctx.close();
}

await tirar('01-21px-real', { dpr: 1 });
await tirar('02-21px-detalle', { dpr: 3 });
await tirar('03-21px-detalle-oscuro', { dpr: 3, tema: 'dark' });

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`);
  for (const e of errores) console.error(`  · ${e}`);
  process.exit(1);
}
console.log('✓ sin errores JS');
