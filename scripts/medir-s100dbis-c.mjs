/**
 * medir-s100dbis-c.mjs — EL SEGUNDO VEREDICTO: el modal, el chip y la ficha.
 *
 * ── QUÉ CONTESTA ────────────────────────────────────────────────────────
 * **④ EL MODAL.** Que los TRES ejes de techo conocido —Categoría · Para qué
 *   animal · Precio— vuelvan a UNA FILA que scrollea, que los DOS que
 *   crecen con el catálogo sigan envueltos, y que **ningún rótulo lleve el
 *   contador** que el founder no supo leer (*«no sé por qué pone el 3»*).
 *
 * **⑨ EL CHIP DE PRESENTACIÓN.** El color del chip ELEGIDO, leído del
 *   estilo computado. **La pregunta no es «¿es magenta?» sino «¿de dónde
 *   sale?»**: el aparato imprime el color y se coteja contra los tokens —
 *   `capaText.identidad` (el verde del default) contra `accent.control`
 *   (el magenta de la casa para SELECCIÓN).
 *
 * **⑨ LA FICHA.** El alto del bloque de composición, para saber **qué
 *   cuesta la carta** antes de ponerla (N21 pide superficie; el founder
 *   pidió *«no dejarla sobre fondo»*, y una carta suma padding y sombra).
 *
 * ── LO QUE NO PUEDE DECIR ───────────────────────────────────────────────
 * **RN-web no es el teléfono** — y esta vez lo escribo dos veces, porque en
 * la vuelta pasada reporté «en aparato» sobre números de este renderer y me
 * lo corrigió B. **Todo lo de acá es WEB.** Sirve para comparar un ANTES
 * con un DESPUÉS con la misma vara; el ojo es del founder.
 *
 * 🔴 La trampa heredada sigue: `expo-router` deja la pantalla anterior en
 * el DOM ⇒ todo se acota al scroller visible, y los nodos 0×0 son la
 * pantalla de atrás.
 *
 * 🔴 CREDENCIALES (R6): la clave sale del keychain AL MOMENTO.
 *
 * Uso: node scripts/medir-s100dbis-c.mjs [puerto]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const PUERTO = process.argv[2] ?? '8095';
const BASE = `http://localhost:${PUERTO}`;
/** El producto con más ingredientes del catálogo (25 · 517 car): el que
 *  hace visible el costo real de la sección de composición. */
const PRODUCTO_RICO = '151b0cdd-1031-4432-887d-a00f8450877a';
/** 🔴 UN SEGUNDO PRODUCTO, y hace falta: el rico tiene **UNA** presentación,
 *  así que su ficha **no dibuja chips** (con una sola, el grupo colapsa —
 *  no se le pide una decisión a quien no tiene alternativa). *La primera
 *  corrida midió el color del chip sobre una ficha sin chips y devolvió
 *  «(no hay)»: el aparato apuntaba al producto equivocado, no la cura al
 *  lugar equivocado.* `Adulto Cordero y Arroz` tiene **4 comprables**. */
const PRODUCTO_CON_CHIPS = '7b3a6e20-185a-488b-8099-809d456da326';

const PASS = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();

const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ locale: 'es-EC', viewport: { width: 384, height: 832 } });
const p = await ctx.newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(String(e)));

await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await p.waitForTimeout(8000);
await p.getByPlaceholder('ej: ana@correo.com').fill('guillo381+8@gmail.com');
await p.locator('input[type="password"]').fill(PASS);
await p.getByText('Entrar', { exact: true }).click();
await p.waitForTimeout(9000);

// ══ ④ · EL MODAL ═══════════════════════════════════════════════════════
console.log(`\n═══ S100d·bis · C · 384×832 · ${BASE} · **RN-WEB, NO EL TELÉFONO** ═══`);
console.log('\n── ④ · LA HOJA DE FILTROS ──');
await p.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(10000);
await p.getByRole('button', { name: /Filtrar/i }).first().click();
await p.waitForTimeout(4000);

const ejes = await p.evaluate(() => {
  /* Cada eje = su rótulo + lo que le sigue. Se ancla en los RÓTULOS —que
     son texto conocido— y no en la forma del contenedor, justamente porque
     la forma es lo que está cambiando. *Un selector que depende de lo que
     se está curando no puede medir la cura.* */
  const nombres = ['Categoría', 'Para qué animal', 'Marca', 'Presentación', 'Precio'];
  const out = [];
  for (const n of nombres) {
    const rot = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && (e.textContent ?? '').trim().startsWith(n),
    );
    if (rot === undefined) continue;
    const texto = (rot.textContent ?? '').trim();
    // El contenedor del eje: el ancestro que además tiene los chips.
    let caja = rot.parentElement;
    while (caja !== null && caja.querySelectorAll('[role="radio"]').length === 0) caja = caja.parentElement;
    const chips = caja === null ? [] : [...caja.querySelectorAll('[role="radio"]')];
    // ¿scrollea en horizontal? el scroller es el padre común de los chips.
    const tira = chips[0]?.parentElement?.parentElement ?? null;
    const s = tira === null ? null : getComputedStyle(tira);
    // ¿en cuántas FILAS caen? (distintas `y` de los chips)
    const filas = new Set(chips.map((c) => Math.round(c.getBoundingClientRect().top))).size;
    out.push({
      rotulo: texto,
      conContador: / · \d+$/.test(texto),
      chips: chips.length,
      filas,
      overflowX: s?.overflowX ?? '?',
      visible: tira?.clientWidth ?? 0,
      contenido: tira?.scrollWidth ?? 0,
    });
  }
  return out;
});
for (const e of ejes) {
  const forma = e.filas > 1 ? 'ENVUELVE' : e.overflowX === 'scroll' || e.overflowX === 'auto' ? 'TIRA' : 'una fila';
  const oculto = e.contenido - e.visible;
  console.log(
    `  «${e.rotulo}» · ${e.chips} chips en ${e.filas} fila(s) → **${forma}**` +
      `${oculto > 0 ? ` · ${oculto} dp fuera (se ve ${Math.round((e.visible / e.contenido) * 100)} %)` : ' · entra entero'}` +
      `${e.conContador ? '  ✗ TODAVÍA LLEVA CONTADOR' : ''}`,
  );
}
console.log(`  🔴 ④ rótulos con contador: ${ejes.filter((e) => e.conContador).length} de ${ejes.length} (tiene que ser 0)`);
const hojaAlto = await p.evaluate(() => {
  const d = [...document.querySelectorAll('div')]
    .filter((x) => { const s = getComputedStyle(x); return (s.overflowY === 'scroll' || s.overflowY === 'auto') && x.clientHeight > 150 && x.clientHeight < 800; })
    .sort((a, c) => c.clientHeight - a.clientHeight)[0];
  return d === undefined ? null : { visible: d.clientHeight, contenido: d.scrollHeight };
});
console.log(`  alto de la hoja: ${hojaAlto === null ? '?' : `visible ${hojaAlto.visible} / contenido ${hojaAlto.contenido} dp`}`);
await p.keyboard.press('Escape');
await p.waitForTimeout(2500);

// ══ ⑨ · EL CHIP DE PRESENTACIÓN Y LA COMPOSICIÓN ═══════════════════════
console.log('\n── ⑨ · LA FICHA ──');
await p.goto(`${BASE}/despensa/producto/${PRODUCTO_RICO}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(10000);

/**
 * 🔴 EL COLOR DEL CHIP ELEGIDO — **leído del estilo computado, no del
 * código.** El founder dijo *«marca en verde»*; la pregunta que decide la
 * cura no es si es verde sino **de qué token sale**, porque un hex tecleado,
 * un estado heredado y un DEFAULT sin declarar se curan en tres lugares
 * distintos.
 */
await p.goto(`${BASE}/despensa/producto/${PRODUCTO_CON_CHIPS}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(10000);
/* Se ELIGE uno: el color que decide el punto ⑨ es el del chip SELECCIONADO,
   y con cuatro comprables ninguno se auto-elige (la auto-selección es solo
   para el caso de una). *Medir el reposo habría dado el gris de siempre y
   habría dicho que no hay verde.* */
{
  const primero = p.locator('[role="radio"]').first();
  if (await primero.count()) { await primero.click(); await p.waitForTimeout(2500); }
}
const chip = await p.evaluate(() => {
  const sel = [...document.querySelectorAll('[role="radio"]')].filter(
    (e) => e.getAttribute('aria-checked') === 'true' || e.getAttribute('aria-selected') === 'true',
  );
  const uno = sel[0] ?? document.querySelector('[role="radio"]');
  if (uno === null || uno === undefined) return null;
  const cs = getComputedStyle(uno);
  const txt = [...uno.querySelectorAll('*')].find((x) => x.children.length === 0);
  return {
    etiqueta: (uno.textContent ?? '').trim().slice(0, 24),
    elegido: uno.getAttribute('aria-checked') ?? uno.getAttribute('aria-selected') ?? '?',
    borde: cs.borderColor,
    fondo: cs.backgroundColor,
    texto: txt === undefined ? '?' : getComputedStyle(txt).color,
  };
});
console.log(`  chip de presentación: ${chip === null ? '(no hay — producto de una sola presentación)' : JSON.stringify(chip)}`);

const composicion = await p.evaluate(() => {
  const rot = [...document.querySelectorAll('*')].find(
    (e) => e.children.length === 0 && (e.textContent ?? '').trim() === 'Composición',
  );
  if (rot === undefined) return null;
  /* 🔴 SE SUBE HASTA LA SUPERFICIE, no hasta el texto. La primera versión
     paraba en el ancestro que contenía el rótulo Y la advertencia — y ése
     es el `View` de adentro de la carta, transparente. Reportaba «fondo
     rgba(0,0,0,0), sombra ninguna» **con la carta puesta**: *el selector
     paraba un nivel antes de lo que venía a medir, y su cero se leía
     igual que «la carta no está».* Ahora sube hasta el primer ancestro
     que efectivamente PINTA. */
  let caja = rot.parentElement;
  while (caja !== null && !/Declara contener|No tenemos los ingredientes/.test(caja.textContent ?? '')) {
    caja = caja.parentElement;
  }
  while (caja !== null && getComputedStyle(caja).backgroundColor === 'rgba(0, 0, 0, 0)') {
    caja = caja.parentElement;
    if (caja !== null && caja.getBoundingClientRect().width > 370) return null; // llegó a la pantalla
  }
  if (caja === null) return null;
  const r = caja.getBoundingClientRect();
  const cs = getComputedStyle(caja);
  return {
    alto: Math.round(r.height),
    ancho: Math.round(r.width),
    fondo: cs.backgroundColor,
    sombra: cs.boxShadow === 'none' ? 'ninguna' : cs.boxShadow.slice(0, 40),
    radio: cs.borderRadius,
  };
});
console.log(`  bloque de composición (cerrado): ${composicion === null ? '?' : JSON.stringify(composicion)}`);

const flecha = await p.evaluate(() => {
  const c = [...document.querySelectorAll('[role="button"]')].find(
    (e) => (e.getAttribute('aria-label') ?? '') === 'Composición',
  );
  const svg = c?.querySelector('svg path');
  if (svg === null || svg === undefined) return null;
  const cs = getComputedStyle(svg);
  return { trazo: cs.stroke, grosor: cs.strokeWidth };
});
console.log(`  la flecha del acordeón: ${flecha === null ? '?' : JSON.stringify(flecha)}`);

const lienzo = await p.evaluate(() => {
  const img = [...document.querySelectorAll('div')].find((d) => {
    const r = d.getBoundingClientRect();
    return Math.abs(r.width - 240) < 2 && Math.abs(r.height - 240) < 2;
  });
  if (img === undefined) return null;
  return { fondo: getComputedStyle(img).backgroundColor };
});
console.log(`  la caja de la imagen (240×240): ${lienzo === null ? '?' : JSON.stringify(lienzo)}`);

console.log(`\n  errores de página: ${errores.length}`);
await b.close();
