/**
 * medir-s100b-cromo.mjs — EL APARATO DE C: cuánto alto se va antes de la
 * mercadería, y qué tapa el pie fijo. (S100b-C · G-04 · G-02 · H-101)
 *
 * ── QUÉ CONTESTA, y por qué estas preguntas ─────────────────────────────
 * El arranque de C ordena reportar **el porcentaje del alto que se consume
 * antes del primer producto, ANTES y DESPUÉS**. Eso no se estima leyendo
 * el código: se mide sobre la pantalla montada. Este script la monta en
 * RN-web y lee las cajas reales del DOM.
 *
 * ① VITRINA — `y` del primer producto ÷ alto útil ⇒ el número de G-04.
 * ② VITRINA — ¿entra COMPLETA la primera foto sobre el pliegue? *Que
 *    asome una franja de foto no es mostrar mercadería.*
 * ③ FICHA — ¿SCROLLEA? (`scrollHeight` contra `clientHeight` del
 *    contenedor real, y un scroll efectivo medido después de pedirlo).
 *    **Se mide porque está en disputa:** B reportó desde el aparato que no
 *    scrollea; el código no muestra por qué. Un desacuerdo entre dos
 *    observaciones se resuelve midiendo, jamás releyendo (L-286).
 * ④ FICHA — qué queda DEBAJO del pie fijo con el scroll en su tope. Ése es
 *    el contenido inalcanzable de G-02: composición y alérgenos.
 *
 * ── LO QUE ESTE APARATO **NO** PUEDE DECIR, declarado ───────────────────
 * RN-web **no es el teléfono**. No tiene la barra de tabs nativa, ni los
 * insets del sistema, ni la tipografía del dispositivo, y su pliegue lo
 * fija el `viewport` que le pasamos, no una pantalla real. ⇒ **los números
 * de acá son de la MISMA maqueta de layout, no del mismo aparato**, y el
 * veredicto sobre el teléfono lo da B, que lo tiene. Lo que sí sirve, y
 * es para lo que existe: **el antes y el después medidos con la misma
 * vara**, que es lo que vuelve comparable una cura.
 *
 * 🔴 CREDENCIALES (R6): la clave sale del keychain AL MOMENTO y jamás se
 * imprime ni se escribe. El sufijo de la cuenta entra por argumento.
 *
 * Uso:  node scripts/medir-s100b-cromo.mjs <sufijo> [puerto] [rotulo]
 *       node scripts/medir-s100b-cromo.mjs 8 8091 despues
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const SUFIJO = process.argv[2] ?? '8';
const PUERTO = process.argv[3] ?? '8091';
/** Rótulo de la corrida — entra al nombre de las capturas. ⚠️ Nace en
 *  'corrida' y NO en 'antes': *un archivo llamado «antes» que contiene el
 *  después miente sin que nadie lo abra* (pasó acá, con las tres primeras
 *  capturas). El nombre lo declara quien corre, no el script. */
const ROTULO = process.argv[4] ?? 'corrida';
const BASE = `http://localhost:${PUERTO}`;
const EMAIL = `guillo381+${SUFIJO}@gmail.com`;

/**
 * Teléfono de referencia en dp. Se declara acá y no se esconde: **todo
 * porcentaje de este reporte depende de estos dos números.**
 *
 * 🔴 Elegidos para EMPAREJAR EL APARATO DE B, no por gusto: su tarjeta de
 * grilla midió **163.9 dp** de ancho, y `GRILLA_DE_DOS` la deriva como
 * `(ancho − 2·spacing[5] − gap)/2` ⇒ un ancho de pantalla de ~384 dp. Con
 * 412 mi tarjeta salía de 178 y **el pliegue caía en otro lado**: la ficha
 * no reproducía el tapado que el founder vio. *Dos aparatos que no miden
 * la misma pantalla producen dos verdades y ninguna comparable* — así que
 * el mío se ajusta al que tiene el ojo del gate.
 */
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

/** El contenedor que de verdad scrollea, buscado por COMPORTAMIENTO
 *  (`overflow` scrolleable + alto real) y no por nombre de clase — RN-web
 *  no promete sus clases.
 *
 *  ⚠️ **Se exige que esté VISIBLE.** `expo-router` conserva en el DOM el
 *  scroller de la pantalla anterior: sin este filtro, medir la ficha
 *  devolvía las cajas de la vitrina. *Lo delató un número que no cerraba
 *  con otro* — el "tope 0" contra un `scrollHeight` mayor que el visor
 *  (L-287). El marcador viejo se borra antes de poner el nuevo, por la
 *  misma razón. */
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
      // Visible de verdad: dentro del viewport y con ancho de pantalla.
      return r.width > 100 && r.bottom > 0 && r.top < window.innerHeight;
    });
    if (cand.length === 0) return null;
    const d = cand.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    d.setAttribute('data-medicion-scroller', '1');
    const r = d.getBoundingClientRect();
    return {
      clientHeight: d.clientHeight,
      scrollHeight: d.scrollHeight,
      scrollTop: d.scrollTop,
      puedeScrollear: d.scrollHeight > d.clientHeight + 1,
      sobrante: d.scrollHeight - d.clientHeight,
      // 🔴 EL ALTO ÚTIL, medido y no supuesto: el visor del scroller ES el
      // hueco entre el encabezado y la barra de tabs. Todo porcentaje de
      // G-04 se calcula contra ESTO, jamás contra la pantalla entera —
      // *un porcentaje contra el alto total se ve mejor de lo que es.*
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
    };
  });
}

/** Las tarjetas de producto: `role=button` con `aria-label`, de ancho de
 *  media columna. El filtro es GEOMÉTRICO a propósito — un selector por
 *  texto dependería del catálogo del día. */
async function tarjetas() {
  return page.evaluate((anchoV) => {
    const n = [...document.querySelectorAll('[role="button"][aria-label]')];
    return n
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          etiqueta: e.getAttribute('aria-label')?.slice(0, 48) ?? '',
          top: Math.round(r.top),
          alto: Math.round(r.height),
          ancho: Math.round(r.width),
        };
      })
      .filter((c) => c.ancho > anchoV * 0.3 && c.ancho < anchoV * 0.6 && c.alto > 120)
      .sort((a, b) => a.top - b.top);
  }, ANCHO);
}

/** La caja de un texto visible, por su contenido. Devuelve null si no está
 *  — y "no está" se DICE, jamás se rellena con un cero. */
async function cajaDe(texto) {
  const loc = page.getByText(texto, { exact: false }).first();
  if ((await loc.count()) === 0) return null;
  const b = await loc.boundingBox();
  return b === null ? null : { top: Math.round(b.y), alto: Math.round(b.height) };
}

console.log(`\n═══ APARATO C · viewport ${ANCHO}×${ALTO} · ${BASE} ═══`);
console.log(`— entrando como +${SUFIJO} —`);
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(8000);
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);

// ── ① LA VITRINA ────────────────────────────────────────────────────────
await page.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);

console.log('\n── ① VITRINA · EL CROMO ANTES DEL PRIMER PRODUCTO ──');
const sv = await scroller();
const cards = await tarjetas();
if (cards.length === 0) {
  console.log('  ⚠ CERO tarjetas de producto detectadas — se declara, no se inventa.');
  console.log('    (catálogo vacío, sesión sin familia, o el selector no agarra)');
} else {
  const p = cards[0];
  const util = sv?.clientHeight ?? ALTO;
  const arriba = sv?.top ?? 0;
  const abajo = sv?.bottom ?? ALTO;
  // El cromo es lo que se come DENTRO del visor, así que se descuenta
  // dónde arranca el visor: mezclar coordenadas de pantalla con alto útil
  // fabrica un porcentaje que no mide nada (L-285: qué magnitud decide).
  const cromo = p.top - arriba;
  const pct = ((cromo / util) * 100).toFixed(1);
  console.log(`  tarjetas visibles en el árbol: ${cards.length}`);
  console.log(`  primer producto: «${p.etiqueta}»`);
  console.log(`     alto ÚTIL (entre encabezado y tabs) .. ${util} dp [${arriba}–${abajo}]`);
  console.log(`  🔴 cromo antes del primer producto ..... ${cromo} dp`);
  console.log(`  🔴 % del alto útil consumido ............ ${pct} %`);
  console.log(`     alto de la tarjeta ................... ${p.alto} dp (ancho ${p.ancho})`);
  const fotoLado = p.ancho; // la caja es 1:1 desde el merge de B
  console.log(
    `     ¿entra la primera FOTO entera? ....... ${p.top + fotoLado <= abajo ? 'SÍ' : `NO (le faltan ${Math.round(p.top + fotoLado - abajo)} dp)`}`,
  );
  console.log(
    `     ¿entra la tarjeta entera? ............ ${p.top + p.alto <= abajo ? 'SÍ' : `NO (le faltan ${p.top + p.alto - abajo} dp)`}`,
  );
}
if (sv !== null) {
  console.log(
    `  scroll: ${sv.puedeScrollear ? `SÍ (sobran ${sv.sobrante} dp)` : 'NO'} · visor ${sv.clientHeight} · contenido ${sv.scrollHeight}`,
  );
}

/* 🔴 CUÁNTAS TARJETAS TIENEN FOTO — es DATO, no forma, y por eso se mide
   y no se cura de este lado. Pero cambia cómo se lee todo lo demás: *medir
   «¿entra la primera foto?» sobre una caja vacía es medir el hueco, no la
   mercadería.* Verificado aparte que las fotos que existen SÍ cargan (0
   fallos de red), así que un cero acá es ausencia de dato y jamás un
   problema del aparato. */
const conFoto = await page.evaluate(() => {
  const tarjetas = [...document.querySelectorAll('[role="button"][aria-label]')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 120 && r.width < 240 && r.height > 120;
  });
  const tiene = tarjetas.filter(
    (t) =>
      [...t.querySelectorAll('div,img')].some((n) => {
        const bg = getComputedStyle(n).backgroundImage;
        return (bg !== 'none' && bg !== '') || (n.tagName === 'IMG' && n.naturalWidth > 0);
      }),
  ).length;
  return { total: tarjetas.length, tiene };
});
console.log(
  `  📷 tarjetas con foto: ${conFoto.tiene} de ${conFoto.total}` +
    (conFoto.tiene < conFoto.total
      ? `  🔴 ${conFoto.total - conFoto.tiene} sin foto (DATO — dueño founder/catálogo, no forma)`
      : ''),
);

/* 🔴 EL DESGLOSE — en qué se va el cromo. Sin esto, recortar es adivinar
   cuál de seis bloques pesa: *un total no dice qué lo compone*, y cortar
   el bloque equivocado deja el número casi igual y la pantalla peor. */
console.log('\n  — desglose del cromo (dónde se va el alto) —');
for (const [rotulo, texto] of [
  ['encabezado (marca)', 'Despensa'],
  ['buscador · etiqueta', 'Buscar'],
  ['voz «elegí una mascota»', 'Eleg'],
  ['contador del techo', 'de 563'],
]) {
  const c = await cajaDe(texto);
  console.log(
    `    ${c === null ? '·  no está' : `y ${String(c.top).padStart(4)} · alto ${String(c.alto).padStart(3)}`}  ${rotulo}`,
  );
}
/* Los bloques que no tienen texto fijo se miden por ESTRUCTURA: el campo
   de búsqueda por su `input`, y las tiras de filtros por los scrollers
   horizontales. *Buscarlos por su texto los volvería dependientes del
   catálogo del día.* */
const estructura = await page.evaluate(() => {
  const inp = document.querySelector('input[type="text"], input:not([type])');
  const cajaInput = inp === null ? null : inp.getBoundingClientRect();
  // Contenedor del campo: se sube hasta el ancestro de ancho de pantalla.
  let cont = inp;
  while (cont !== null && cont.getBoundingClientRect().width < window.innerWidth * 0.8) {
    cont = cont.parentElement;
  }
  const tiras = [...document.querySelectorAll('div')]
    .filter((d) => getComputedStyle(d).overflowX === 'scroll' && d.clientWidth > 200)
    .map((d) => {
      const r = d.getBoundingClientRect();
      return { top: Math.round(r.top), alto: Math.round(r.height) };
    })
    .filter((x) => x.alto > 8)
    .sort((a, b) => a.top - b.top);
  return {
    input: cajaInput === null ? null : { top: Math.round(cajaInput.top), alto: Math.round(cajaInput.height) },
    bloqueCampo: cont === null ? null : { top: Math.round(cont.getBoundingClientRect().top), alto: Math.round(cont.getBoundingClientRect().height) },
    tiras,
  };
});
console.log(
  `    ${estructura.bloqueCampo === null ? '·  no está' : `y ${String(estructura.bloqueCampo.top).padStart(4)} · alto ${String(estructura.bloqueCampo.alto).padStart(3)}`}  BLOQUE del buscador (etiqueta + caja)`,
);
console.log(
  `    ${estructura.input === null ? '·  no está' : `y ${String(estructura.input.top).padStart(4)} · alto ${String(estructura.input.alto).padStart(3)}`}  └ solo la caja de texto`,
);
estructura.tiras.forEach((tira, i) =>
  console.log(`    y ${String(tira.top).padStart(4)} · alto ${String(tira.alto).padStart(3)}  tira horizontal #${i + 1} (filtros / caras)`),
);

/* 🔴 LA MEDICIÓN DEFINITIVA: los HIJOS DIRECTOS del contenedor, en orden,
   con su alto y su texto. Buscar bloques por su texto falla cuando el
   bloque no tiene texto fijo — *y un hueco "sin explicar" de 80 dp no se
   reparte a ojo entre los vecinos*. Esto no deja huecos: la suma de los
   hijos ES el cromo. */
const bloques = await page.evaluate(() => {
  const d = document.querySelector('[data-medicion-scroller]');
  if (d === null) return [];
  // El contentContainer de RN-web es el único hijo del scroller.
  const cont = d.firstElementChild ?? d;
  return [...cont.children].map((c) => {
    const r = c.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      alto: Math.round(r.height),
      texto: (c.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 44),
    };
  });
});
console.log('\n  — LOS BLOQUES, en orden (la suma ES el cromo) —');
bloques.forEach((b, i) =>
  console.log(
    `    ${String(i + 1).padStart(2)}. y ${String(b.top).padStart(4)} · alto ${String(b.alto).padStart(4)}  «${b.texto}»`,
  ),
);
await page.screenshot({ path: `scripts/capturas/s100b-c-vitrina-${ROTULO}.png` });

// ── ② LA FICHA ──────────────────────────────────────────────────────────
/**
 * 🔴 LA CONDICIÓN DE REPRODUCCIÓN, medida y no supuesta: **el pie de la
 * ficha tiene UN botón con el carrito vacío y DOS con algo adentro**
 * («Ver carrito» solo existe con `unidades > 0`). Con un botón, los 96 dp
 * tecleados alcanzan y **el defecto no se ve**. ⇒ para reproducir G-02 hay
 * que llegar a la ficha **con el carrito cargado**.
 *
 * *Ésa es la razón por la que este defecto sobrevivió a todos los gates:
 * el camino que lo destapa no es el primero que camina nadie.*
 *
 * Y se elige un producto **con más de una presentación** (mismo nombre en
 * dos tarjetas) para que los chips existan y se pueda medir si se pueden
 * tocar — sin eso, la ficha medida no tiene el control que L1 dice que
 * está roto.
 */
console.log('\n── ② FICHA · ¿SCROLLEA? ¿QUÉ TAPA EL PIE? ──');
if (cards.length > 0) {
  // ① Cargar el carrito desde la vitrina (el `+` de la primera tarjeta).
  const mas = page.getByRole('button', { name: /Agregar/i }).first();
  if ((await mas.count()) > 0) {
    await mas.click();
    await page.waitForTimeout(2500);
    console.log('  carrito cargado desde la vitrina ⇒ el pie de la ficha será de DOS botones');
  } else {
    console.log('  ⚠ no se encontró el control de agregar en la vitrina — el pie puede salir de UN botón');
  }

  // ② Elegir un producto con MÁS DE UNA presentación, si lo hay.
  const porNombre = new Map();
  for (const c of cards) {
    const n = c.etiqueta.split(',')[0].trim();
    porNombre.set(n, (porNombre.get(n) ?? 0) + 1);
  }
  const multi = [...porNombre.entries()].find(([, n]) => n > 1)?.[0] ?? null;
  const elegido = multi ?? cards[0].etiqueta.split(',')[0].trim();
  console.log(
    `  producto elegido: «${elegido}»${multi === null ? ' (⚠ ninguno con 2+ presentaciones en las 50 cargadas)' : ' (2+ presentaciones)'}`,
  );
  await page.getByRole('button', { name: elegido, exact: false }).first().click();
  await page.waitForTimeout(7000);

  const antes = await scroller();
  console.log(
    `  al abrir: visor ${antes?.clientHeight} · contenido ${antes?.scrollHeight} · ¿puede scrollear? ${antes?.puedeScrollear ? 'SÍ' : 'NO'} (sobran ${antes?.sobrante})`,
  );
  /* La ficha EN REPOSO — lo primero que ve una familia, y lo que el gate
     del founder juzga. *Una captura del tope prueba que nada quedó
     inalcanzable; solo la del reposo dice si la pantalla vende.* */
  await page.screenshot({ path: `scripts/capturas/s100b-c-ficha-${ROTULO}-reposo.png` });

  // El scroll EFECTIVO: se pide y se vuelve a medir. Que el contenedor
  // diga que puede no prueba que lo haga.
  const movido = await page.evaluate(() => {
    const d = document.querySelector('[data-medicion-scroller]');
    if (d === null) return null;
    const arranque = d.scrollTop;
    d.scrollTop = 99999;
    return { arranque, despues: d.scrollTop, tope: d.scrollHeight - d.clientHeight };
  });
  console.log(
    `  scroll efectivo: ${movido === null ? 'sin contenedor' : `${movido.arranque} → ${movido.despues} (tope ${movido.tope})`}`,
  );
  await page.waitForTimeout(1500);

  // 🔴 CON EL SCROLL EN SU TOPE, lo que siga debajo del pie es
  // INALCANZABLE — no "está abajo": no hay más scroll que lo saque.
  const pie = await cajaDe('Agregar al carrito');
  const pieTop = pie?.top ?? (await cajaDe('Ver carrito'))?.top ?? null;
  console.log(`     borde superior del pie ....... ${pieTop ?? 'no ubicado'} dp (visor ${ALTO})`);
  for (const clave of ['Presentaciones', 'Composición', 'Declara contener', 'Cantidad', 'Está pensado']) {
    const c = await cajaDe(clave);
    if (c === null) {
      console.log(`  ·  «${clave}»: no está en esta ficha`);
      continue;
    }
    const tapado = pieTop !== null && c.top + c.alto > pieTop;
    console.log(
      `  ${tapado ? '🔴' : ' ✓'} «${clave}»: y ${c.top}–${c.top + c.alto}${tapado ? ` · INALCANZABLE (pie en ${pieTop})` : ''}`,
    );
  }
  /* 🔴 ¿LA FICHA MUESTRA PRECIO SIN PRESENTACIÓN ELEGIDA?
     Con varias presentaciones ninguna se elige sola, y el bloque de precio
     se pintaba SOLO con una elegida ⇒ **la ficha no mostraba ningún precio
     hasta que la familia tocaba un chip**. *Una ficha sin precio no vende.*
     Apareció MIRANDO la captura y no midiéndola — ningún número de este
     script lo decía. Se mecaniza acá para que no vuelva callado. */
  const conPrecio = await page.evaluate(() => {
    const d = document.querySelector('[data-medicion-scroller]');
    const txt = d === null ? '' : (d.textContent ?? '');
    const m = txt.match(/\$\s?[\d.,]+/g) ?? [];
    return { hay: m.length > 0, muestras: m.slice(0, 3) };
  });
  console.log(
    `  ${conPrecio.hay ? '✅' : '🔴'} precio visible en el cuerpo de la ficha: ${
      conPrecio.hay ? conPrecio.muestras.join(' · ') : 'NINGUNO — la ficha no dice cuánto sale'
    }`,
  );
  await page.screenshot({ path: `scripts/capturas/s100b-c-ficha-${ROTULO}-tope.png` });
} else {
  console.log('  ⚠ sin tarjeta no hay ficha que medir.');
}

// ── ③ G-01 · EL STEPPER EN LA TARJETA ───────────────────────────────────
/**
 * 🔴 **SE VERIFICA EN EL ÁRBOL, NO EN EL CÓDIGO** — y es la orden literal
 * del arranque, por una razón medida: B encontró que `Más` **existía en el
 * código y NO en el árbol**. La tarjeta llevaba `overflow:'hidden'` y el
 * stepper de 144 dp no entraba en una caja de 138, así que **el botón se
 * recortaba sin dejar rastro**. *Releer la lógica no encuentra nada porque
 * no hay nada ahí.*
 *
 * Y el 1→2 se ejerce de verdad: **que `Más` esté en el árbol no prueba que
 * sume.** Un control presente y sin efecto es el mismo defecto con mejor
 * disfraz.
 */
console.log('\n── ③ G-01 · ¿SE PUEDE COMPRAR MÁS DE UNO? ──');
await page.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
/* ⚠️ El stepper solo se dibuja con cantidad > 0, así que primero hay que
   AGREGAR. Y el carrito vive en memoria: un `goto` lo vacía. *Mi primera
   corrida contó cero «Menos» y cero «Más» y lo leí como el defecto —
   cuando lo que estaba midiendo era una vitrina con el carrito recién
   reseteado.* Que falten LOS DOS botones, y no solo `Más`, es lo que lo
   delata: el defecto de G-01 recorta uno, no la pieza entera. */
const agregar = page.getByRole('button', { name: /Agregar/i }).first();
if ((await agregar.count()) > 0) {
  await agregar.click();
  await page.waitForTimeout(2500);
} else {
  console.log('  ⚠ no se encontró el control de agregar — el stepper no puede aparecer');
}
const menos = page.getByRole('button', { name: 'Menos', exact: true });
const mas = page.getByRole('button', { name: 'Más', exact: true });
const nMenos = await menos.count();
const nMas = await mas.count();
console.log(`  «Menos» en el árbol: ${nMenos}   «Más» en el árbol: ${nMas}`);
if (nMas === 0) {
  console.log('  🔴 `Más` NO EXISTE EN EL ÁRBOL ⇒ no hay camino a 2. G-01 VIVO.');
} else {
  // El número vive entre los dos botones, en mono tabular.
  const leerCantidad = async () => {
    const caja = await mas.first().boundingBox();
    if (caja === null) return null;
    return page.evaluate(
      ({ x, y }) => {
        const n = [...document.querySelectorAll('*')].filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            e.children.length === 0 &&
            /^\d+$/.test((e.textContent ?? '').trim()) &&
            Math.abs(r.top - y) < 30 &&
            r.left < x &&
            x - r.right < 40
          );
        });
        return n.length === 0 ? null : (n[0].textContent ?? '').trim();
      },
      { x: caja.x, y: caja.y },
    );
  };
  const antesN = await leerCantidad();
  await mas.first().click();
  await page.waitForTimeout(2000);
  const despuesN = await leerCantidad();
  const sube = antesN !== null && despuesN !== null && Number(despuesN) === Number(antesN) + 1;
  console.log(`  cantidad: ${antesN} → ${despuesN}`);
  console.log(
    `  ${sube ? '✅ G-01 CURADO — el camino a 2 existe y funciona' : '🔴 `Más` está en el árbol y NO SUMA — control presente sin efecto'}`,
  );
  const cajaMas = await mas.first().boundingBox();
  if (cajaMas !== null) {
    console.log(
      `  blanco del botón: ${Math.round(cajaMas.width)}×${Math.round(cajaMas.height)} dp (el hitSlop no se ve acá: lo completa el target nativo)`,
    );
  }
}
await page.screenshot({ path: `scripts/capturas/s100b-c-stepper-${ROTULO}.png` });

console.log(`\nerrores de página: ${errores.length}`);
errores.slice(0, 4).forEach((e) => console.log(`  ✗ ${e.slice(0, 160)}`));
await browser.close();
