/**
 * verify-s98b-hoja-funde.mjs — EL DISCRIMINADOR DE LA FIRMA ②.
 *
 * La firma dice: con reduce-motion la `Hoja` FUNDE en vez de deslizar, y
 * trae su propia advertencia — *«cuidá el onCerrar que cuelga del callback
 * del deslizamiento»*.
 *
 * 🔴 EL MODO DE FALLA QUE ESTE INSTRUMENTO EXISTE PARA CAZAR, y es mudo:
 * si el remate (`setMontada(false)` + `onCerrar`) se queda colgado de la
 * animación vieja, la hoja **se vuelve invisible y nunca se cierra**. No
 * lanza, no se ve, y deja el Modal montado consumiendo el back de
 * Android. *Un typecheck no puede ver esto: las dos versiones compilan.*
 *
 * Por eso la prueba NO mira la opacidad —que es lo bonito— sino si el
 * árbol se DESMONTA, que es lo que de verdad importa.
 *
 * Corre las DOS preferencias contra la MISMA hoja: con `reduce` tiene que
 * fundir y cerrar; con `no-preference` tiene que seguir deslizando y
 * cerrar igual. *Probar solo el camino nuevo dejaría sin red al viejo, que
 * es el que usa todo el mundo.*
 *
 * ⚠️ RN-WEB. El gate en dispositivo no es de esta pista — lo que esto
 * prueba es la LÓGICA del cierre, no cómo se ve el fundido.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8083';
const DISPARADOR = 'Abrir una Hoja con lista larga';
const TITULO_HOJA = 'HojaScroll';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const fallos = [];

async function probar(preferencia) {
  const ctx = await browser.newContext({
    locale: 'es-EC',
    viewport: { width: 420, height: 900 },
    reducedMotion: preferencia,
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle', timeout: 240000 });
  await page.waitForTimeout(4000);

  const abrir = page.getByText(DISPARADOR, { exact: false }).first();
  if ((await abrir.count()) === 0) {
    fallos.push(`[${preferencia}] no se encontró el disparador «${DISPARADOR}» — sin hoja no hay prueba (L-192)`);
    await ctx.close();
    return;
  }
  await abrir.scrollIntoViewIfNeeded();
  await abrir.click();
  await page.waitForTimeout(1200);

  const hoja = page.getByText(TITULO_HOJA, { exact: true });
  const abierta = await hoja.count();
  if (abierta === 0) {
    fallos.push(`[${preferencia}] la hoja NO abrió — el camino de entrada está roto`);
    await ctx.close();
    return;
  }
  console.log(`  · [${preferencia}] abrió (${abierta} nodo(s) con el título)`);

  // Cerrar por la X — la vía que pasa por `cerrarAnimado`, donde vive el
  // remate.
  //
  // ⚠️ `.last()` Y NO `.first()`, medido: la `Hoja` tiene DOS elementos
  // con `accessibilityLabel="Cerrar"` — el BACKDROP (que ocupa la
  // pantalla, detrás) y la X (más adelante en el DOM). `.first()` agarra
  // el backdrop, que está tapado por la propia hoja, y el click no llega.
  //
  // 🔴 Y EL ERROR NO SE TRAGA. La v1 tenía `.catch(() => {})`: el click
  // fallaba, el script seguía como si nada y reportaba «la hoja sigue
  // montada» — un rojo por la razón equivocada, en las DOS preferencias,
  // incluida la que yo no había tocado. *Ese rojo simétrico fue lo que lo
  // delató: un cambio que solo toca un camino no puede romper los dos.*
  const cerrar = page.getByLabel('Cerrar').last();
  if ((await cerrar.count()) === 0) {
    fallos.push(`[${preferencia}] no se encontró el control de cierre — sin él la prueba no prueba nada`);
    await ctx.close();
    return;
  }
  await cerrar.click({ timeout: 5000 });
  // Se espera MÁS que la animación (normal ~250ms): si a 2,5s sigue
  // montada, no es lentitud — es que el remate no corrió.
  await page.waitForTimeout(2500);

  const quedan = await page.getByText(TITULO_HOJA, { exact: true }).count();
  if (quedan > 0) {
    fallos.push(
      `[${preferencia}] la hoja SIGUE MONTADA 2,5s después de cerrar — el remate (setMontada/onCerrar) no corrió: se volvió invisible pero nunca se cerró`,
    );
  } else {
    console.log(`  · [${preferencia}] cerró y se DESMONTÓ ✓`);
  }
  if (errores.length > 0) fallos.push(`[${preferencia}] ${errores.length} error(es) JS: ${errores[0]}`);
  await ctx.close();
}

console.log('Hoja · el cierre sobrevive al cambio de gesto:');
await probar('reduce');
await probar('no-preference');
await browser.close();

if (fallos.length > 0) {
  console.error(`✗ ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}
console.log('✓ las dos preferencias abren y CIERRAN — el remate viaja con el gesto');
