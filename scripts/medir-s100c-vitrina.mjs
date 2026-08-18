/**
 * medir-s100c-vitrina.mjs — EL APARATO DE S100c: dónde se va el alto de la
 * vitrina, y qué pasa con los filtros cuando HAY mascota elegida.
 *
 * ── QUÉ CONTESTA, y por qué estas preguntas ─────────────────────────────
 * ① **C-03 · el espacio muerto entre el buscador y la barra de mascotas.**
 *    El hallazgo llega SIN número (*«se pierde mucho espacio»*) y el número
 *    es parte de la cura: hay que saber **quién** se lo come antes de
 *    tocarlo. Se mide el tramo entre el borde inferior de la CAJA DE TEXTO
 *    y el borde superior de la barra de mascotas, y se reparte entre sus
 *    contribuyentes reales.
 *
 * ② **C-02 · ¿la fila de ESPECIES se dibuja con mascota elegida?**
 *    🔴 **Esta pregunta existe porque la firma de mesa afirma que hoy se
 *    contradice, y el código dice lo contrario** (`index.tsx:540` guarda
 *    con `mascota === null` desde S96-D, y ese guard ESTÁ en el ancla
 *    publicada `f107eac9` — verificado con `git show`). *Una afirmación y
 *    un literal que no coinciden se resuelven midiendo, jamás eligiendo a
 *    cuál creerle* (L-286). El aparato elige una mascota de verdad y
 *    cuenta las filas de chips que quedan.
 *
 * ③ **C-04 · ¿hay prosa que plegar en la ficha?**
 *    Mi predecesora midió que la descripción promedia **10 caracteres**.
 *    *Un acordeón sobre diez caracteres es un control que promete
 *    contenido que no existe*, así que antes de construirlo se vuelve a
 *    medir el largo REAL del texto sobre la ficha montada.
 *
 * ④ **C-05 · ¿cuántas líneas ocupa el nombre en la tarjeta?**
 *    El founder dice *«queda muy alargado»* y también *«en general se ve
 *    bien»*: es afinamiento. Se mide el alto del bloque de texto y cuántas
 *    tarjetas de la primera pantalla desbordan, para no «arreglar» a ojo
 *    algo que el founder aprobó.
 *
 * ── LO QUE ESTE APARATO **NO** PUEDE DECIR ──────────────────────────────
 * Lo mismo que declaró el de S100b y hay que repetir en cada lectura:
 * **RN-web no es el teléfono.** No tiene barra de tabs nativa, ni insets
 * del sistema, ni su tipografía, **y no tiene teclado** — así que la queja
 * literal del founder (*«con el teclado desplegado no veo absolutamente
 * nada más»*) **no se reproduce acá**: se calcula contra el alto que un
 * teclado típico ocupa, y eso se declara como cuenta, no como medición.
 * Sirve para comparar un ANTES con un DESPUÉS con la misma vara.
 *
 * 🔴 LA TRAMPA HEREDADA, que costó cuatro lecturas falsas en S100b:
 * `expo-router` conserva la pantalla anterior VIVA en el DOM. **Todo lo
 * que se busque va acotado al scroller visible**, jamás a `document`.
 *
 * 🔴 CREDENCIALES (R6): la clave sale del keychain AL MOMENTO y jamás se
 * imprime ni se escribe.
 *
 * Uso:  node scripts/medir-s100c-vitrina.mjs <sufijo> [puerto] [rotulo]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const SUFIJO = process.argv[2] ?? '8';
const PUERTO = process.argv[3] ?? '8093';
const ROTULO = process.argv[4] ?? 'corrida';
const BASE = `http://localhost:${PUERTO}`;
const EMAIL = `guillo381+${SUFIJO}@gmail.com`;

/** Mismo teléfono de referencia que el aparato de S100b — cambiarlo haría
 *  incomparables los dos juegos de números. */
const ANCHO = 384;
const ALTO = 832;

/** Alto típico del teclado de Android en dp. **Es un SUPUESTO declarado,
 *  no una medición**: RN-web no abre teclado. Solo se usa para la cuenta
 *  de «qué queda visible con el teclado arriba», y por eso esa línea del
 *  reporte va rotulada como CUENTA. */
const TECLADO_SUPUESTO = 260;

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
const ctx = await browser.newContext({
  locale: 'es-EC',
  viewport: { width: ANCHO, height: ALTO },
});
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

/** El scroller VISIBLE, por comportamiento y no por clase. Marca el nodo
 *  para que todo lo demás se acote a él (la trampa del DOM fantasma). */
async function scroller() {
  return page.evaluate(() => {
    document
      .querySelectorAll('[data-medicion-scroller]')
      .forEach((e) => e.removeAttribute('data-medicion-scroller'));
    const cand = [...document.querySelectorAll('div')].filter((d) => {
      const s = getComputedStyle(d);
      if (s.overflowY !== 'scroll' && s.overflowY !== 'auto') return false;
      if (d.clientHeight < 200) return false;
      const r = d.getBoundingClientRect();
      return r.width > 100 && r.bottom > 0 && r.top < window.innerHeight;
    });
    if (cand.length === 0) return null;
    const d = cand.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    d.setAttribute('data-medicion-scroller', '1');
    const r = d.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), alto: d.clientHeight };
  });
}

/** Los hijos DIRECTOS del contenedor de contenido: el presupuesto vertical
 *  de la pantalla, en el orden en que el ojo los encuentra. */
async function bloques() {
  return page.evaluate(() => {
    const sc = document.querySelector('[data-medicion-scroller]');
    if (sc === null) return [];
    const cont = sc.firstElementChild;
    if (cont === null) return [];
    return [...cont.children].map((e, i) => {
      const r = e.getBoundingClientRect();
      return {
        i,
        top: Math.round(r.top),
        alto: Math.round(r.height),
        texto: (e.textContent ?? '').replace(/\s+/g, ' ').slice(0, 52),
      };
    });
  });
}

/** La caja de texto del buscador: el `input` real, no su envoltorio. */
async function cajaBuscador() {
  return page.evaluate(() => {
    const i = document.querySelector('input[type="text"], input:not([type])');
    if (i === null) return null;
    const r = i.getBoundingClientRect();
    return { top: Math.round(r.top), alto: Math.round(r.height), bottom: Math.round(r.bottom) };
  });
}

/**
 * 🔴 LAS FILAS DE FACETA — leídas por ESTRUCTURA, no por forma.
 *
 * ⚠️ **La primera versión de esta función buscaba `[role="button"]` bajos y
 * angostos, y devolvió los `+` de la grilla en vez de los chips.** Con ese
 * selector el reporte decía «NO se dibuja la fila de especies» — que es la
 * respuesta que yo esperaba, y por eso casi la publico. *Un fallo de
 * selector se lee exactamente igual que el defecto que uno vino a medir*
 * (la trampa que S100b-C dejó escrita, cobrada acá al primer intento).
 *
 * La versión buena no adivina: `listaConFacetas` monta un contenedor cuyos
 * hijos directos son, en orden, **[chips de familia?] · [chips de especie?]
 * · [grilla]**. Se leen ESOS hijos. El que mide > 1000 dp es la grilla —
 * la mercadería, no cromo — y se rotula como tal.
 */
async function filasDeFaceta() {
  return page.evaluate(() => {
    const sc = document.querySelector('[data-medicion-scroller]');
    if (sc === null) return [];
    /**
     * 🔴 SE ANCLA EN LA GRILLA Y SE SUBE UN NIVEL — no se baja adivinando.
     *
     * ⚠️ La versión anterior tomaba «el hijo más alto» y en el camino SIN
     * mascota agarraba un envoltorio de más (`index.tsx:879` mete otro
     * `View` con el contador), así que reportaba **1 fila de chips donde
     * hay 2**. Anclar en la grilla real y leer sus HERMANOS no depende de
     * cuántos envoltorios haya en el medio.
     */
    const tarjeta = [...sc.querySelectorAll('[role="button"][aria-label]')].find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 100 && r.width < 230 && r.height > 120;
    });
    if (tarjeta === undefined) return [];
    let grilla = tarjeta;
    // Subir hasta el nodo cuyo padre YA no es solo-grilla: el contenedor de
    // facetas es el primer ancestro con hermanos que no son tarjetas.
    while (grilla.parentElement !== null && grilla.parentElement !== sc) {
      const p = grilla.parentElement;
      const hermanos = [...p.children];
      const hayNoTarjeta = hermanos.some(
        (h) => h !== grilla && h.querySelectorAll('[role="button"][aria-label]').length === 0,
      );
      if (hayNoTarjeta && hermanos.length > 1) break;
      grilla = p;
    }
    const bloque = grilla.parentElement;
    if (bloque === null) return [];
    return [...bloque.children].map((e, i) => {
      const r = e.getBoundingClientRect();
      return {
        i,
        y: Math.round(r.top),
        alto: Math.round(r.height),
        esGrilla: r.height > 1000,
        texto: (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
      };
    });
  });
}

console.log(`\n═══ APARATO S100c-C · ${ANCHO}×${ALTO} · ${BASE} · «${ROTULO}» ═══`);
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(8000);
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

await page.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);

// ── ① C-03 · EL PRESUPUESTO VERTICAL, REPARTIDO ─────────────────────────
console.log('\n── ① C-03 · DÓNDE SE VA EL ALTO ANTES DE LA MERCADERÍA ──');
const sv = await scroller();
const cajaB = await cajaBuscador();
const bl = await bloques();

if (sv === null || cajaB === null) {
  console.log('  ⚠ no se pudo anclar el scroller o el buscador — se declara, no se rellena.');
} else {
  const barra = bl[0];
  console.log(`  caja de texto del buscador ..... y ${cajaB.top}–${cajaB.bottom} (alto ${cajaB.alto})`);
  console.log(`  fin del encabezado (top scroller) y ${sv.top}`);
  console.log(`  primer bloque del scroll ....... y ${barra?.top} «${barra?.texto}»`);
  const muerto = (barra?.top ?? sv.top) - cajaB.bottom;
  console.log(`  🔴 ESPACIO MUERTO buscador → barra de mascotas ... ${muerto} dp`);
  console.log(`     ├ pie reservado del Campo + aire del encabezado .. ${sv.top - cajaB.bottom} dp`);
  console.log(`     └ paddingTop del scroll ......................... ${(barra?.top ?? sv.top) - sv.top} dp`);
  console.log('\n  — los bloques, en orden (la suma ES el cromo) —');
  for (const b of bl) console.log(`    ${String(b.i).padStart(2)}. y ${String(b.top).padStart(5)} · alto ${String(b.alto).padStart(5)}  «${b.texto}»`);
}

// ── ② C-02 · LOS FILTROS, SIN Y CON MASCOTA ─────────────────────────────
console.log('\n── ② C-02 · LAS FILAS DE FILTRO ──');
const pinta = (f) =>
  console.log(
    `     ${f.i}. y ${String(f.y).padStart(4)} · alto ${String(f.alto).padStart(4)} · ${f.esGrilla ? 'GRILLA (mercadería)' : `FILA DE CHIPS «${f.texto}»`}`,
  );
console.log('  ‣ SIN mascota elegida:');
const sinMascota = await filasDeFaceta();
for (const f of sinMascota) pinta(f);
console.log(`     ⇒ filas de chips: ${sinMascota.filter((f) => !f.esGrilla).length}`);

/** 🔴 Se elige una mascota REAL tocando su cara, que es el camino de la
 *  familia. Si no hay barra de mascotas, se DICE — no se simula el estado
 *  por URL, porque un estado fabricado no prueba lo que hace la pantalla. */
const caras = page.locator('[data-medicion-scroller] [role="button"]');
let elegida = null;
for (const nombre of ['Jack', 'Thor', 'Zeus']) {
  const l = page.locator(`[data-medicion-scroller] [aria-label*="${nombre}"]`).first();
  if ((await l.count()) > 0) {
    await l.click();
    elegida = nombre;
    break;
  }
}
await page.waitForTimeout(7000);
await scroller();

if (elegida === null) {
  console.log('  ⚠ no se pudo elegir mascota por su cara — el resto de ② NO se reporta.');
} else {
  console.log(`\n  ‣ CON «${elegida}» elegida:`);
  const criterio = await page.locator('[data-medicion-scroller]').getByText('Para ', { exact: false }).first().count();
  console.log(`     ¿aparece la línea de criterio «Para …»? .. ${criterio > 0 ? 'SÍ' : 'NO'}`);
  const filas = await filasDeFaceta();
  for (const f of filas) pinta(f);
  const chips = filas.filter((f) => !f.esGrilla);
  const especies = ['perro', 'gato', 'conejo', 'ave', 'roedor', 'pez'];
  const filaEspecie = chips.find((f) => especies.some((e) => f.texto.toLowerCase().includes(e)));
  console.log(`     ⇒ filas de chips: ${chips.length}`);
  console.log(
    `  🔴 ¿SE DIBUJA LA FILA DE ESPECIES CON MASCOTA ELEGIDA? .. ${filaEspecie ? `SÍ — «${filaEspecie.texto}»` : 'NO'}`,
  );

  /**
   * 🔴 ②bis · EL MISMO CASO, PERO BUSCANDO — y esto existe porque el
   * primer resultado NO cerraba con la observación del founder.
   *
   * Él vio *«perros y conejos»* estando en «Para Jack», y el guard de la
   * fila de especies **está y funciona**. ⇒ o la observación es falsa, o
   * mira OTRA superficie. La búsqueda es la candidata: su lector
   * (`buscarProductosDespensa`) **no recibe especie**, mientras que la
   * recomendación sí filtra (`despensa-catalogo.ts:980`). *Cuando una
   * medición contradice al founder, el que suele estar mal es el
   * instrumento apuntando al lugar equivocado.*
   */
  console.log('\n  ‣ ②bis · CON MASCOTA ELEGIDA **Y BUSCANDO** «alimento»:');
  const inp = page.locator('input[type="text"], input:not([type])').first();
  await inp.fill('alimento');
  await page.waitForTimeout(7000);
  await scroller();
  const conBusqueda = await filasDeFaceta();
  for (const f of conBusqueda) pinta(f);
  const chipsB = conBusqueda.filter((f) => !f.esGrilla);
  const filaEspB = chipsB.find((f) => especies.some((e) => f.texto.toLowerCase().includes(e)));
  console.log(`     ⇒ filas de chips: ${chipsB.length}`);
  console.log(
    `  🔴 ¿FILA DE ESPECIES BUSCANDO, CON MASCOTA? ............ ${filaEspB ? `SÍ — «${filaEspB.texto}»` : 'NO'}`,
  );
  /** ¿Y los RESULTADOS respetan la especie de la mascota? Se abre la
   *  primera tarjeta y se lee su propia declaración («Está pensado
   *  para…»), que es el dato que la ficha ya publica. */
  const t1 = page.locator('[data-medicion-scroller] [role="button"][aria-label]').filter({ hasText: /\$/ }).first();
  if ((await t1.count()) > 0) {
    const etiqueta = await t1.getAttribute('aria-label');
    await t1.click();
    await page.waitForTimeout(7000);
    const pensado = await page.getByText('Está pensado', { exact: false }).first();
    const txt = (await pensado.count()) > 0 ? (await pensado.textContent()) : null;
    console.log(`     1er resultado: «${(etiqueta ?? '').slice(0, 44)}»`);
    console.log(`  🔴 su propia declaración de especie ..... ${txt ?? '(no la declara)'}`);
    await page.goBack();
    await page.waitForTimeout(5000);
  }
  await inp.fill('');
  await page.waitForTimeout(4000);
}

// ── ③ · LA CUENTA DEL TECLADO (no es medición: es cuenta declarada) ─────
const sv2 = await scroller();
const bl2 = await bloques();
if (sv2 !== null) {
  const visibleConTeclado = ALTO - TECLADO_SUPUESTO - sv2.top;
  console.log(`\n── ③ CUENTA (no medición) · con un teclado de ${TECLADO_SUPUESTO} dp ──`);
  console.log(`     alto visible bajo el encabezado ......... ${visibleConTeclado} dp`);
  let gastado = 0;
  for (const b of bl2) {
    if (b.alto > 1000) break; // la lista: es la mercadería, no cromo
    gastado += b.alto;
  }
  console.log(`     lo que gastan los bloques de cromo ...... ${gastado} dp`);
  console.log(`     🔴 queda para mercadería ................ ${visibleConTeclado - gastado} dp`);
}

// ── ④ C-04 y C-05 · LA FICHA Y EL NOMBRE ────────────────────────────────
console.log('\n── ④ C-04 · ¿HAY PROSA QUE PLEGAR EN LA FICHA? ──');
const tarjeta = page.locator('[data-medicion-scroller] [role="button"][aria-label]').filter({ hasText: /\$/ }).first();
if ((await tarjeta.count()) === 0) {
  console.log('  ⚠ no se encontró tarjeta de producto para abrir — se declara.');
} else {
  await tarjeta.click();
  await page.waitForTimeout(8000);
  await scroller();
  const prosa = await page.evaluate(() => {
    const sc = document.querySelector('[data-medicion-scroller]');
    if (sc === null) return null;
    // Los párrafos: nodos de texto largos, de ancho pleno.
    return [...sc.querySelectorAll('div')]
      .filter((d) => d.children.length === 0)
      .map((d) => {
        const r = d.getBoundingClientRect();
        return { texto: (d.textContent ?? '').replace(/\s+/g, ' ').trim(), alto: Math.round(r.height), ancho: Math.round(r.width) };
      })
      .filter((x) => x.texto.length > 0)
      .sort((a, b) => b.texto.length - a.texto.length)
      .slice(0, 8);
  });
  if (prosa === null) console.log('  ⚠ sin scroller en la ficha.');
  else {
    console.log('  los ocho textos más largos de la ficha (largo · alto · texto):');
    for (const p of prosa) console.log(`    ${String(p.texto.length).padStart(4)} car · ${String(p.alto).padStart(3)} dp · «${p.texto.slice(0, 60)}»`);
    const largos = prosa.filter((p) => p.texto.length > 120);
    console.log(`  🔴 textos de más de 120 caracteres (candidatos a plegar): ${largos.length}`);
  }
}

console.log(`\nerrores de página: ${errores.length}`);
for (const e of errores.slice(0, 4)) console.log(`  ✗ ${e.slice(0, 140)}`);
await browser.close();
