/**
 * medir-s100c-busqueda.mjs — C-01 y la CAUSA REAL de C-02, sobre la
 * pantalla montada.
 *
 * ── LAS DOS PREGUNTAS ───────────────────────────────────────────────────
 * ① **C-01 · ¿«proplan» encuentra lo que «pro plan» encuentra?**
 *    Literal del founder: *«puse todo proplan, todo pegado… me la encontró
 *    solo cuando pongo dos palabras»*. Se teclean los DOS términos en el
 *    mismo buscador y se cuentan las tarjetas. **Dos números con la misma
 *    vara** — que es lo único que vuelve comparable una cura.
 *
 * ② **C-02 · ¿la búsqueda respeta la especie de la mascota elegida?**
 *    La firma de mesa dice que la fila de ESPECIES se dibuja con mascota
 *    elegida; **medido, no se dibuja** (el guard de `index.tsx:540` está y
 *    funciona, y está en el ancla publicada). Pero el founder vio *«perros
 *    y conejos»* en «Para Jack», que es gato — así que **mira otra cosa**:
 *    la BÚSQUEDA, cuyo lector no recibe especie mientras que la
 *    recomendación sí filtra (`despensa-catalogo.ts:980`).
 *    Acá se abre cada resultado y se lee **su propia declaración** («Está
 *    pensado para…»), que es dato que la ficha ya publica — no una
 *    inferencia mía sobre el catálogo.
 *
 * ⚠️ **SE VERIFICA QUE LA BÚSQUEDA CORRIÓ, y no es paranoia:** si el
 * término no llegara al servidor, la grilla seguiría mostrando la vitrina
 * entera y yo estaría midiendo la vitrina creyendo que mido resultados.
 * El discriminador es un término que **no puede** existir en el catálogo:
 * si ése devuelve 0 y los otros devuelven algo, el buscador está vivo.
 *
 * 🔴 CREDENCIALES (R6): del keychain AL MOMENTO, jamás impresas.
 *
 * Uso:  node scripts/medir-s100c-busqueda.mjs <sufijo> [puerto] [rotulo]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const SUFIJO = process.argv[2] ?? '8';
const PUERTO = process.argv[3] ?? '8093';
const ROTULO = process.argv[4] ?? 'corrida';
const BASE = `http://localhost:${PUERTO}`;
const EMAIL = `guillo381+${SUFIJO}@gmail.com`;
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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: ANCHO, height: ALTO } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

async function marcarScroller() {
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
    if (cand.length === 0) return false;
    cand.sort((a, b) => b.clientHeight - a.clientHeight)[0].setAttribute('data-medicion-scroller', '1');
    return true;
  });
}

/** Cuenta las tarjetas de producto DENTRO del scroller visible (la trampa
 *  del DOM fantasma de `expo-router`), por geometría y no por texto. */
async function contarTarjetas() {
  await marcarScroller();
  return page.evaluate(() => {
    const sc = document.querySelector('[data-medicion-scroller]');
    if (sc === null) return { n: 0, primeras: [] };
    const t = [...sc.querySelectorAll('[role="button"][aria-label]')]
      .map((e) => ({ et: e.getAttribute('aria-label') ?? '', r: e.getBoundingClientRect() }))
      .filter((x) => x.r.width > 100 && x.r.width < 230 && x.r.height > 120);
    return { n: t.length, primeras: t.slice(0, 3).map((x) => x.et.slice(0, 40)) };
  });
}

async function buscar(termino) {
  const inp = page.locator('input[type="text"], input:not([type])').first();
  await inp.fill('');
  await page.waitForTimeout(1500);
  await inp.fill(termino);
  await page.waitForTimeout(6500);
  return contarTarjetas();
}

console.log(`\n═══ BÚSQUEDA S100c-C · ${ANCHO}×${ALTO} · «${ROTULO}» ═══`);
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(8000);
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);
await page.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
await marcarScroller();

// ── ⓪ EL DISCRIMINADOR — ¿el buscador está vivo? ────────────────────────
const base = await contarTarjetas();
const imposible = await buscar('zzzqqqxx');
console.log('\n── ⓪ DISCRIMINADOR · ¿la búsqueda llega al servidor? ──');
console.log(`  sin buscar ................ ${base.n} tarjetas`);
console.log(`  «zzzqqqxx» (imposible) .... ${imposible.n} tarjetas`);
console.log(
  `  ⇒ el buscador ${imposible.n === 0 && base.n > 0 ? 'ESTÁ VIVO — todo lo de abajo mide resultados' : '🔴 NO DISCRIMINA — el resto del reporte NO es de fiar'}`,
);

// ── ① C-01 · pegado contra separado ─────────────────────────────────────
console.log('\n── ① C-01 · «proplan» CONTRA «pro plan» ──');
for (const t of ['pro plan', 'proplan', 'purina', 'royalcanin', 'royal canin', 'hills', 'taste of the wild', 'tasteofthewild']) {
  const r = await buscar(t);
  console.log(`  «${t}» ${'.'.repeat(Math.max(1, 22 - t.length))} ${String(r.n).padStart(3)} tarjetas   ${r.primeras[0] ?? ''}`);
}

// ── ② C-02 · ¿la búsqueda respeta la especie de la mascota? ─────────────
console.log('\n── ② C-02 · LA BÚSQUEDA CONTRA LA ESPECIE DE LA MASCOTA ──');
await buscar('');
await page.waitForTimeout(3000);
await marcarScroller();
const jack = page.locator('[data-medicion-scroller] [aria-label*="Jack"]').first();
if ((await jack.count()) === 0) {
  console.log('  ⚠ no encontré a Jack en la barra de mascotas — se declara, no se rellena.');
} else {
  await jack.click();
  await page.waitForTimeout(7000);
  console.log('  ‣ Jack elegido (es GATO — verificado en la base, no supuesto)');
  const r = await buscar('alimento');
  console.log(`  «alimento» con Jack elegido ⇒ ${r.n} tarjetas`);
  // Se abren las tres primeras y se lee SU declaración de especie.
  let perros = 0;
  let leidas = 0;
  for (let i = 0; i < 3; i++) {
    await marcarScroller();
    const t = page.locator('[data-medicion-scroller] [role="button"][aria-label]').filter({ hasText: /\$/ }).nth(i);
    if ((await t.count()) === 0) break;
    const et = await t.getAttribute('aria-label');
    await t.click();
    await page.waitForTimeout(6500);
    const p = page.getByText('Está pensado', { exact: false }).first();
    const txt = (await p.count()) > 0 ? ((await p.textContent()) ?? '') : '(no declara)';
    leidas++;
    if (/perro|conejo|ave|roedor|pez/.test(txt) && !/gato/.test(txt)) perros++;
    console.log(`     ${i + 1}. «${(et ?? '').slice(0, 38)}» → ${txt.trim()}`);
    await page.goBack();
    await page.waitForTimeout(5500);
  }
  console.log(
    `  🔴 de ${leidas} resultados leídos, ${perros} NO son para la especie de Jack ⇒ ${perros > 0 ? 'LA BÚSQUEDA IGNORA LA MASCOTA' : 'la búsqueda respeta la especie'}`,
  );
}

// ── ③ H-301 · ¿CUÁNTOS RESULTADOS CAMBIAN DE POSICIÓN? ──────────────────
/**
 * 🔴 EL NÚMERO QUE EL FOUNDER PIDIÓ al firmar H-301: *«declaralo reversible
 * y dejá el número: cuántos resultados cambian de posición con Jack
 * elegido»*.
 *
 * Se mide **sobre la pantalla**, con el mismo término, primero SIN mascota
 * y después CON Jack, y se comparan las dos listas ordenadas. **No se
 * calcula del catálogo**: lo que importa es lo que la familia ve.
 *
 * ⚠️ **Y se mide también CUÁNTOS SON DE SU ESPECIE arriba de todo**, porque
 * «cambiaron de posición» solo dice que se movieron — *no dice que se
 * movieron para el lado correcto.*
 */
console.log('\n── ③ H-301 · EL ORDEN POR ESPECIE, ANTES Y DESPUÉS ──');
await page.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
await marcarScroller();

const TERMINO = 'alimento';
const sinM = await buscar(TERMINO);
console.log(`  sin mascota · «${TERMINO}» ⇒ ${sinM.n} tarjetas`);

await marcarScroller();
const jack2 = page.locator('[data-medicion-scroller] [aria-label*="Jack"]').first();
if ((await jack2.count()) === 0) {
  console.log('  ⚠ no encontré a Jack — el número de ③ NO se reporta (no se rellena).');
} else {
  await jack2.click();
  await page.waitForTimeout(8000);
  const conM = await contarTarjetas();
  console.log(`  con Jack   · «${TERMINO}» ⇒ ${conM.n} tarjetas`);

  // Las listas COMPLETAS, en orden, para comparar posición por posición.
  const lista = async () => {
    await marcarScroller();
    return page.evaluate(() => {
      const sc = document.querySelector('[data-medicion-scroller]');
      if (sc === null) return [];
      return [...sc.querySelectorAll('[role="button"][aria-label]')]
        .map((e) => ({ et: e.getAttribute('aria-label') ?? '', r: e.getBoundingClientRect() }))
        .filter((x) => x.r.width > 100 && x.r.width < 230 && x.r.height > 120)
        .map((x) => x.et);
    });
  };
  const despues = await lista();
  // Volver a SIN mascota re-tocando a Jack (el chip alterna la elección).
  await jack2.click();
  await page.waitForTimeout(8000);
  const antes = await lista();

  if (antes.length === 0 || despues.length === 0) {
    console.log('  ⚠ una de las dos listas vino vacía — se declara, no se compara.');
  } else {
    const pos = new Map(antes.map((et, i) => [et, i]));
    let movidos = 0;
    let nuevos = 0;
    despues.forEach((et, i) => {
      const p = pos.get(et);
      if (p === undefined) nuevos++;
      else if (p !== i) movidos++;
    });
    console.log(`     largo antes ${antes.length} · largo después ${despues.length}`);
    console.log(`  🔴 resultados que CAMBIAN DE POSICIÓN ....... ${movidos}`);
    console.log(`     resultados que ANTES NO ESTABAN .......... ${nuevos}`);
    console.log(`     los 3 primeros ANTES:  ${antes.slice(0, 3).join(' · ')}`);
    console.log(`     los 3 primeros DESPUÉS: ${despues.slice(0, 3).join(' · ')}`);
  }
}

console.log(`\nerrores de página: ${errores.length}`);
await browser.close();
