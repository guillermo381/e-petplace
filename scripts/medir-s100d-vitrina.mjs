/**
 * medir-s100d-vitrina.mjs — EL APARATO DE S100d-C: la cabecera, la hoja de
 * filtros y la ficha.
 *
 * ── QUÉ CONTESTA, punto por punto del gate del founder ──────────────────
 * **② + ③¹** LA CABECERA. ¿Sigue existiendo la celda «Tus pedidos» dentro
 *   de Despensa (la segunda puerta al mismo cuarto)? ¿El encabezado dice
 *   «Despensa» en píxeles o solo para el lector? ¿En qué escalón vive el
 *   buscador y en cuál el control «Filtrar»? Y el número de ③: **cuánto
 *   aire muerto queda entre el fin del encabezado y la barra de mascotas.**
 *
 * **④** LA HOJA DE FILTROS. El founder: *«chips sin visibilidad
 *   horizontal»*. Se abre la hoja y por CADA tira se mide `scrollWidth`
 *   contra `clientWidth` y el `overflow-x` computado. **La pregunta no es
 *   si la tira desborda —seguro desborda— sino si el desborde se puede
 *   ALCANZAR y si algo lo anuncia.**
 *
 * **⑩ + ⑪** LA FICHA. Los bloques con su alto y su texto, para saber
 *   **cuánta prosa hay de verdad** antes de plegar nada, y dónde está hoy
 *   el control de revelar (el «Ver N más» + chevron: DOS señales).
 *
 * ── LO QUE ESTE APARATO **NO** PUEDE DECIR ──────────────────────────────
 * **RN-web no es el teléfono**: sin barra de tabs nativa, sin insets del
 * sistema, sin su tipografía y **sin teclado**. Sirve para comparar un
 * ANTES con un DESPUÉS con la misma vara — jamás para declarar cómo se ve
 * en el aparato del founder. **Y hay un límite propio de ④:** en RN-web un
 * `ScrollView horizontal` es `overflow-x: scroll` y el mouse puede
 * arrastrarlo; **en el teléfono el gesto compite con el de la Hoja**, y
 * eso este aparato no lo reproduce. Por eso ④ mide DESBORDE y ALCANCE, y
 * declara el gesto como no medido.
 *
 * 🔴 LA TRAMPA HEREDADA (dos predecesoras la cobraron): `expo-router`
 * conserva la pantalla anterior VIVA en el DOM ⇒ **todo se acota a
 * `[data-medicion-scroller]`**, jamás a `document`.
 *
 * 🔴 CREDENCIALES (R6): la clave sale del keychain AL MOMENTO y jamás se
 * imprime ni se escribe.
 *
 * Uso:  node scripts/medir-s100d-vitrina.mjs <sufijo> [puerto] [rotulo]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const SUFIJO = process.argv[2] ?? '8';
const PUERTO = process.argv[3] ?? '8095';
const ROTULO = process.argv[4] ?? 'corrida';
const BASE = `http://localhost:${PUERTO}`;
const EMAIL = `guillo381+${SUFIJO}@gmail.com`;

/** El MISMO teléfono de referencia que S100b y S100c — cambiarlo volvería
 *  incomparables los tres juegos de números. */
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
const ctx = await browser.newContext({
  locale: 'es-EC',
  viewport: { width: ANCHO, height: ALTO },
});
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

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
        texto: (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 56),
      };
    });
  });
}

async function cajaBuscador() {
  return page.evaluate(() => {
    const i = document.querySelector('input[type="text"], input:not([type])');
    if (i === null) return null;
    const r = i.getBoundingClientRect();
    return { top: Math.round(r.top), alto: Math.round(r.height), bottom: Math.round(r.bottom), izq: Math.round(r.left) };
  });
}

console.log(`\n═══ APARATO S100d-C · ${ANCHO}×${ALTO} · ${BASE} · «${ROTULO}» ═══`);
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(8000);
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

await page.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);

// ══ ② + ③ · LA CABECERA ════════════════════════════════════════════════
console.log('\n── ② + ③ · LA CABECERA DE DESPENSA ──');
const sv = await scroller();
const caja = await cajaBuscador();
const bl = await bloques();

/** ¿El nombre de la pantalla se PINTA o solo se anuncia? El encabezado en
 *  variante portada con `busqueda` monta el header en un nodo de 0×0. */
const rotulo = await page.evaluate(() => {
  const h = [...document.querySelectorAll('[role="heading"], [aria-level]')]
    .map((e) => {
      const r = e.getBoundingClientRect();
      return {
        texto: (e.getAttribute('aria-label') ?? e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
        ancho: Math.round(r.width),
        alto: Math.round(r.height),
        y: Math.round(r.top),
      };
    })
    .filter((x) => x.texto.length > 0);
  return h.slice(0, 6);
});
console.log('  nodos de encabezado (texto · ancho×alto · y):');
for (const h of rotulo) {
  console.log(
    `    «${h.texto}» ${h.ancho}×${h.alto} @ y ${h.y}   ${h.ancho === 0 || h.alto === 0 ? '← ANUNCIADO, NO PINTADO' : ''}`,
  );
}

const celdaPedidos = await page.evaluate(() => {
  const sc = document.querySelector('[data-medicion-scroller]');
  if (sc === null) return null;
  const c = [...sc.querySelectorAll('[role="button"]')].find((e) =>
    /pedido/i.test((e.getAttribute('aria-label') ?? e.textContent ?? '')),
  );
  if (c === undefined) return null;
  const r = c.getBoundingClientRect();
  return { y: Math.round(r.top), alto: Math.round(r.height), texto: (c.textContent ?? '').trim().slice(0, 40) };
});
console.log(
  `  🔴 ② ¿celda «Tus pedidos» DENTRO de Despensa? ... ${
    celdaPedidos === null ? 'NO' : `SÍ — y ${celdaPedidos.y}, alto ${celdaPedidos.alto} dp «${celdaPedidos.texto}»`
  }`,
);

const filtrar = await page.evaluate(() => {
  const sc = document.querySelector('[data-medicion-scroller]');
  if (sc === null) return null;
  const b = [...sc.querySelectorAll('[role="button"]')].find((e) =>
    /filtrar/i.test((e.getAttribute('aria-label') ?? e.textContent ?? '')),
  );
  if (b === undefined) return null;
  const r = b.getBoundingClientRect();
  return { y: Math.round(r.top), alto: Math.round(r.height), izq: Math.round(r.left), ancho: Math.round(r.width) };
});
if (caja !== null) console.log(`  buscador ....... y ${caja.top}–${caja.bottom} · x ${caja.izq}`);
console.log(
  `  «Filtrar» ...... ${filtrar === null ? '(no encontrado)' : `y ${filtrar.y}–${filtrar.y + filtrar.alto} · x ${filtrar.izq} · ${filtrar.ancho}×${filtrar.alto}`}`,
);
if (caja !== null && filtrar !== null) {
  const mismoEscalon = Math.abs(caja.top - filtrar.y) < 24;
  console.log(`  🔴 ② ¿buscador y «Filtrar» en el MISMO escalón? .. ${mismoEscalon ? 'SÍ' : `NO — ${filtrar.y - caja.top} dp de separación vertical`}`);
}

/**
 * 🔴 ③ · EL ESPACIO MUERTO SE MIDE **ENTRE LO QUE EL OJO VE**, no entre
 * dos cajas elegidas por comodidad — y esta definición se cambió a
 * propósito después de mover el buscador.
 *
 * La vara de S100c medía *«borde inferior de la caja de texto → primer
 * bloque»*, y era la correcta **mientras el buscador vivía en el
 * encabezado**. Con el buscador abajo esa resta da **−118**, un número que
 * no describe nada. *Una magnitud que se vuelve negativa no está diciendo
 * que el defecto se curó: está diciendo que dejó de medir el defecto.*
 *
 * ⇒ ahora se mide **del último píxel pintado del encabezado al primer
 * píxel pintado del primer chip**, que es literalmente el hueco del que
 * habla el founder (*«entre el header y los chips de mascota»*). Y se
 * reparte entre sus tres pagadores, porque **solo uno es de esta
 * pantalla**.
 */
{
  const primer = bl[0];
  const rot = rotulo.find((h) => h.alto > 0) ?? null;
  const chip = await page.evaluate(() => {
    const sc = document.querySelector('[data-medicion-scroller]');
    if (sc === null) return null;
    const c = sc.querySelector('[role="radio"]');
    if (c === null) return null;
    return Math.round(c.getBoundingClientRect().top);
  });
  console.log(`  fin del encabezado (top del scroller) .. y ${sv?.top ?? '?'}`);
  console.log(`  primer bloque del scroll ............... y ${primer?.top} «${primer?.texto}»`);
  console.log(`  primer CHIP de mascota (píxel real) .... y ${chip ?? '(no hay barra de mascotas)'}`);
  if (rot !== null && chip !== null) {
    console.log(
      `  🔴 ③ AIRE entre el rótulo del encabezado (fin y ${rot.y + rot.alto}) y el primer chip: ${chip - (rot.y + rot.alto)} dp`,
    );
    console.log(`     ├ Encabezado portada · paddingBottom ........... ${(sv?.top ?? 0) - (rot.y + rot.alto)} dp (de la PIEZA)`);
    console.log(`     ├ paddingTop del ScrollView .................... ${(primer?.top ?? 0) - (sv?.top ?? 0)} dp (MÍO)`);
    console.log(`     └ paddingTop de FiltroPills (la pata monta) .... ${chip - (primer?.top ?? 0)} dp (de la PIEZA)`);
  }
}
console.log('\n  — los bloques del scroll, en orden —');
for (const b of bl) {
  const esGrilla = b.alto > 1000;
  console.log(`    ${String(b.i).padStart(2)}. y ${String(b.top).padStart(5)} · alto ${String(b.alto).padStart(5)}  ${esGrilla ? '← GRILLA (mercadería)' : ''} «${b.texto}»`);
}
/** 🔴 EL CROMO ES **DÓNDE EMPIEZA LA MERCADERÍA**, jamás una suma de altos.
 *  La primera versión sumaba los bloques que no eran grilla y **metía en la
 *  cuenta el «¿Compraste en el local?» que vive a y 10305**, o sea 10 000 dp
 *  DEBAJO del primer producto. Daba 317, que era exactamente el número que
 *  yo esperaba encontrar — *un fallo de fórmula se lee igual que el defecto
 *  que uno vino a medir*, la trampa que dos predecesoras dejaron escrita.
 *  La `y` de la grilla no se puede equivocar: es el píxel donde el ojo
 *  encuentra lo primero que se compra. */
const yGrilla = bl.find((b) => b.alto > 1000)?.top ?? null;
console.log(`  🔴 CROMO — el primer producto empieza en y ${yGrilla ?? '?'} dp`);

// ══ ④ · LA HOJA DE FILTROS ═════════════════════════════════════════════
console.log('\n── ④ · LA HOJA DE FILTROS · ¿los chips se pueden alcanzar? ──');
/* Por NOMBRE ACCESIBLE: con el glifo de embudo el control no tiene texto. */
const btnFiltrar = page.getByRole('button', { name: /Filtrar/i }).first();
if ((await btnFiltrar.count()) === 0) {
  console.log('  ⚠ no se encontró el control «Filtrar» — ④ no se reporta.');
} else {
  await btnFiltrar.click();
  await page.waitForTimeout(4000);
  const tiras = await page.evaluate(() => {
    // Las tiras de FiltroPills: scrollers HORIZONTALES visibles.
    return [...document.querySelectorAll('div')]
      .filter((d) => {
        const s = getComputedStyle(d);
        if (s.overflowX !== 'scroll' && s.overflowX !== 'auto') return false;
        const r = d.getBoundingClientRect();
        return r.width > 100 && r.height > 20 && r.height < 200 && r.bottom > 0 && r.top < window.innerHeight;
      })
      .map((d) => {
        const r = d.getBoundingClientRect();
        const hijos = [...(d.firstElementChild?.children ?? [])].map((c) =>
          (c.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 14),
        );
        return {
          y: Math.round(r.top),
          ancho: Math.round(r.width),
          visible: d.clientWidth,
          contenido: d.scrollWidth,
          overflowX: getComputedStyle(d).overflowX,
          opciones: hijos.length,
          primeras: hijos.slice(0, 4).join(' · '),
        };
      })
      .sort((a, b) => a.y - b.y);
  });
  if (tiras.length === 0) console.log('  ⚠ ninguna tira horizontal detectada dentro de la hoja.');
  for (const t of tiras) {
    const desborde = t.contenido - t.visible;
    console.log(
      `    y ${String(t.y).padStart(4)} · ${t.opciones} opciones · visible ${t.visible} / contenido ${t.contenido} dp ` +
        `· overflow-x: ${t.overflowX} ${desborde > 0 ? `← DESBORDA ${desborde} dp` : '(entra entera)'}   [${t.primeras}]`,
    );
  }
  const conDesborde = tiras.filter((t) => t.contenido - t.visible > 0);
  console.log(`  🔴 ④ tiras que desbordan: ${conDesborde.length} de ${tiras.length}`);
  console.log('     (el GESTO en el teléfono —tira horizontal dentro de una Hoja arrastrable—');
  console.log('      NO se reproduce en RN-web: se declara como NO medido.)');

  // El alto de la hoja y cuánto de ella se ve.
  const hojaCaja = await page.evaluate(() => {
    const tiras = [...document.querySelectorAll('div')].filter((d) => {
      const s = getComputedStyle(d);
      return (s.overflowY === 'scroll' || s.overflowY === 'auto') && d.clientHeight > 150;
    });
    const d = tiras.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    if (d === undefined) return null;
    return { visible: d.clientHeight, contenido: d.scrollHeight };
  });
  if (hojaCaja !== null)
    console.log(`     alto de la hoja: visible ${hojaCaja.visible} / contenido ${hojaCaja.contenido} dp`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(2500);
}

// ══ ⑩ + ⑪ · LA FICHA ══════════════════════════════════════════════════
console.log('\n── ⑩ + ⑪ · LA FICHA DE PRODUCTO ──');
/**
 * 🔴 SE ABRE UN PRODUCTO **RICO**, POR SU RUTA REAL, Y SE DICE CUÁL.
 *
 * La primera versión tocaba las primeras tarjetas de la vitrina y ninguna
 * tenía lista plegable — **y ése es el dato, no el fallo**: de 470
 * vendibles, **268 no declaran un solo ingrediente** y **164 pasan de 6**.
 * Medir el plegado sobre una ficha sin composición daría un cero que no
 * dice nada de la pieza.
 *
 * Se entra por `/despensa/producto/<id>`, que es **la misma ruta que abre
 * el toque** (`router.push` con ese pathname), no un estado fabricado. El
 * producto es el más largo del catálogo: **25 ingredientes, 517 caracteres,
 * `descripcion` = "Perro" (5)** — el caso que hace visible a la vez la
 * prosa que SÍ tiene cuerpo y la que no.
 */
const PRODUCTO_RICO = '151b0cdd-1031-4432-887d-a00f8450877a'; // NUTRA PRO RAZAS PEQ. ADULTOS
await page.goto(`${BASE}/despensa/producto/${PRODUCTO_RICO}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);
{
  await scroller();
  const bf = await bloques();
  console.log(`  (ficha de ${PRODUCTO_RICO} — 25 ingredientes, 517 car, descripcion "Perro")`);
  console.log('  — los bloques de la ficha, en orden —');
  let total = 0;
  for (const b of bf) {
    total += b.alto;
    console.log(`    ${String(b.i).padStart(2)}. y ${String(b.top).padStart(5)} · alto ${String(b.alto).padStart(4)}  «${b.texto}»`);
  }
  console.log(`  alto total del contenido de la ficha: ${total} dp`);

  const prosa = await page.evaluate(() => {
    const sc = document.querySelector('[data-medicion-scroller]');
    if (sc === null) return [];
    return [...sc.querySelectorAll('div')]
      .filter((d) => d.children.length === 0)
      .map((d) => {
        const r = d.getBoundingClientRect();
        return {
          texto: (d.textContent ?? '').replace(/\s+/g, ' ').trim(),
          alto: Math.round(r.height),
        };
      })
      .filter((x) => x.texto.length > 0)
      .sort((a, b) => b.texto.length - a.texto.length)
      .slice(0, 8);
  });
  console.log('  los ocho textos más largos (largo · alto · texto):');
  for (const p of prosa)
    console.log(`    ${String(p.texto.length).padStart(4)} car · ${String(p.alto).padStart(3)} dp · «${p.texto.slice(0, 58)}»`);
  console.log(`  🔴 ⑪ textos de más de 120 caracteres (los únicos que justifican plegar): ${prosa.filter((p) => p.texto.length > 120).length}`);

  /**
   * 🔴 ⑩ · EL CONTROL, CONTADO POR SEÑALES — y **se cuenta el TOCABLE
   * entero**, no la etiqueta.
   *
   * El founder objetó *«flecha + label “6 más”»* y pidió **una señal, no
   * dos**. La pregunta mecanizable es: dentro del tocable que pliega,
   * ¿cuántas cosas dicen «hay más»? Un texto que dice *«Ver N más»* dice
   * eso; un RÓTULO DE SECCIÓN (*«Composición»*) **no** — nombra el
   * contenido. Por eso el aparato no cuenta «¿hay texto?» sino **«¿hay
   * texto que anuncie el despliegue?»**, y lo declara por separado del
   * glifo. *Contar cualquier texto habría dado «dos señales» sobre un
   * control correcto — la magnitud equivocada invierte el veredicto.*
   */
  const revelar = await page.evaluate(() => {
    const sc = document.querySelector('[data-medicion-scroller]');
    if (sc === null) return null;
    const c = [...sc.querySelectorAll('[role="button"]')].find((e) =>
      /(Ver \d+ m[aá]s|Ocultar|Composici[oó]n)/i.test(
        e.getAttribute('aria-label') ?? e.textContent ?? '',
      ),
    );
    if (c === undefined) return null;
    const r = c.getBoundingClientRect();
    const etiqueta = (c.textContent ?? '').replace(/\s+/g, ' ').trim();
    return {
      etiqueta,
      anunciaDespliegue: /(m[aá]s|ocultar|ver)/i.test(etiqueta),
      y: Math.round(r.top),
      alto: Math.round(r.height),
      ancho: Math.round(r.width),
      svgs: c.querySelectorAll('svg').length,
    };
  });
  if (revelar === null) console.log('  🔴 ⑩ el control de revelar: (no encontrado)');
  else {
    const senales = revelar.svgs + (revelar.anunciaDespliegue ? 1 : 0);
    console.log(
      `  🔴 ⑩ el control: «${revelar.etiqueta}» · ${revelar.svgs} glifo(s) · ` +
        `¿el texto anuncia el despliegue? ${revelar.anunciaDespliegue ? 'SÍ' : 'NO (es el rótulo)'} ` +
        `⇒ ${senales} SEÑAL(ES) · ${revelar.ancho}×${revelar.alto} @ y ${revelar.y}`,
    );
  }

  /**
   * 🔴 ⑩ · SE EJERCE EL PLIEGUE, no se lee. Cerrado → abierto → cerrado,
   * comprobando en cada paso que **la advertencia de alérgeno sigue
   * visible** — el límite duro de `MODELO_DESPENSA` §6/§10 y de N22.
   * *Que el código la deje fuera del plegado no prueba que se vea: lo
   * prueba verla con la sección cerrada.*
   */
  const control = page.locator('[data-medicion-scroller] [role="button"]').filter({ hasText: /^Composición$/ }).first();
  if ((await control.count()) === 0) {
    console.log('  ⚠ no se pudo ejercer el pliegue: no se encontró el rótulo tocable.');
  } else {
    const leer = () =>
      page.evaluate(() => {
        const sc = document.querySelector('[data-medicion-scroller]');
        const txt = sc === null ? '' : (sc.textContent ?? '');
        return { ingredientes: /Harina de pollo/i.test(txt), advertencia: /Declara contener/i.test(txt) };
      });
    const cerrada = await leer();
    await control.click();
    await page.waitForTimeout(2500);
    const abierta = await leer();
    await control.click();
    await page.waitForTimeout(2000);
    const otraVez = await leer();
    console.log(
      `     cerrada  → ingredientes ${cerrada.ingredientes ? 'SÍ' : 'no'} · advertencia ${cerrada.advertencia ? 'SÍ' : 'NO'}`,
    );
    console.log(
      `     abierta  → ingredientes ${abierta.ingredientes ? 'SÍ' : 'no'} · advertencia ${abierta.advertencia ? 'SÍ' : 'NO'}`,
    );
    console.log(
      `     re-plegada → ingredientes ${otraVez.ingredientes ? 'SÍ' : 'no'} · advertencia ${otraVez.advertencia ? 'SÍ' : 'NO'}`,
    );
    const ok =
      !cerrada.ingredientes && abierta.ingredientes && !otraVez.ingredientes &&
      cerrada.advertencia && abierta.advertencia && otraVez.advertencia;
    console.log(`  🔴 ⑩ el pliegue funciona Y la advertencia NUNCA se pliega: ${ok ? '✓' : '✗'}`);
  }

  /**
   * 🔴 ⑪ · LOS RÓTULOS DE SECCIÓN, CON SU TIPOGRAFÍA — la comprobación
   * que rebotó la primera versión de la cura. Se leen de `*` y no de
   * `div`: `Texto variante="seccion"` lleva `header: true` y no cae en un
   * `div`. *Con el selector angosto, el rótulo que yo estaba comparando
   * simplemente no aparecía en la lista — y su ausencia se lee igual que
   * «no hay problema».*
   */
  const rotulos = await page.evaluate(() => {
    const sc = document.querySelector('[data-medicion-scroller]');
    if (sc === null) return [];
    return [...sc.querySelectorAll('*')]
      .filter((d) => d.children.length === 0 && (d.textContent ?? '').trim().length > 0)
      .map((d) => {
        const cs = getComputedStyle(d);
        const r = d.getBoundingClientRect();
        return {
          texto: (d.textContent ?? '').trim().slice(0, 34),
          y: Math.round(r.top),
          px: cs.fontSize,
          familia: (cs.fontFamily ?? '').split(',')[0],
        };
      })
      .filter((x) => x.texto.length < 34);
  });
  console.log('  — textos cortos con su tipografía (los rótulos tienen que COINCIDIR) —');
  for (const s of rotulos.slice(0, 14))
    console.log(`    y ${String(s.y).padStart(5)} · ${s.px} ${s.familia} · «${s.texto}»`);
}

console.log(`\n  errores de página: ${errores.length}`);
for (const e of errores.slice(0, 5)) console.log(`    ✗ ${e.slice(0, 110)}`);
await browser.close();
