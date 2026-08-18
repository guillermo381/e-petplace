/**
 * medir-s100d-hoja-filtros.mjs — ④ · ¿LOS CHIPS DE LA HOJA SE ALCANZAN?
 *
 * ── LA PREGUNTA, y por qué necesita aparato propio ──────────────────────
 * El founder, sobre la hoja de filtros: *«modal de filtro genial. Pero
 * chips sin visibilidad horizontal»*. **Que la tira DESBORDE ya está
 * medido** (6 de 6 desbordan, hasta 1254 dp) — eso no es el hallazgo: una
 * tira horizontal desborda por diseño. **El hallazgo es si el desborde se
 * puede ALCANZAR**, y eso hay que ejercerlo, no leerlo.
 *
 * ⚠️ **LA SOSPECHA QUE ESTE APARATO EXISTE PARA FALSAR, declarada antes de
 * medir para no acomodarle la respuesta:** `Hoja` monta su contenido dentro
 * de un `ScrollView` de gesture-handler con un `Gesture.Pan` que arrastra
 * la hoja, y `FiltroPills` usa un `ScrollView` **de react-native a secas**.
 * En el teléfono ese pan podría ganarle al arrastre horizontal. **Si acá el
 * scroll SÍ responde, la sospecha NO queda probada: queda acotada al
 * gesto nativo, que es justo lo que RN-web no reproduce.**
 *
 * ⇒ **Este aparato puede DESCARTAR una causa (el DOM), jamás CONFIRMAR la
 * otra (el gesto).** Se declara así en vez de dar un veredicto entero.
 *
 * Uso: node scripts/medir-s100d-hoja-filtros.mjs <sufijo> [puerto]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const SUFIJO = process.argv[2] ?? '8';
const PUERTO = process.argv[3] ?? '8095';
const BASE = `http://localhost:${PUERTO}`;
const EMAIL = `guillo381+${SUFIJO}@gmail.com`;

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
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 384, height: 832 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(8000);
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);
await page.goto(`${BASE}/despensa`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);

console.log('\n═══ ④ · LA HOJA DE FILTROS — ¿el desborde se ALCANZA? ═══');
/* 🔴 SE BUSCA POR NOMBRE ACCESIBLE, NO POR TEXTO — y el cambio lo
   obligó la propia cura: con el glifo de embudo el control **dejó de
   tener texto**, y el selector viejo (`hasText`) devolvió cero y
   reportó «no se encontró el control». *Un selector que se queda viejo
   no avisa: dice que la cosa no está.* */
const btn = page.getByRole('button', { name: /Filtrar/i }).first();
if ((await btn.count()) === 0) {
  console.log('  ⚠ no se encontró el control «Filtrar».');
  await browser.close();
  process.exit(0);
}
await btn.click();
await page.waitForTimeout(4000);

/** Marca las tiras horizontales de la hoja para poder ejercerlas por índice. */
const tiras = await page.evaluate(() => {
  const t = [...document.querySelectorAll('div')].filter((d) => {
    const s = getComputedStyle(d);
    if (s.overflowX !== 'scroll' && s.overflowX !== 'auto') return false;
    const r = d.getBoundingClientRect();
    return r.width > 100 && r.height > 20 && r.height < 200 && d.scrollWidth > d.clientWidth;
  });
  t.forEach((d, i) => d.setAttribute('data-tira', String(i)));
  return t.map((d, i) => {
    const r = d.getBoundingClientRect();
    return {
      i,
      y: Math.round(r.top),
      cx: Math.round(r.left + r.width / 2),
      cy: Math.round(r.top + r.height / 2),
      visible: d.clientWidth,
      contenido: d.scrollWidth,
      opciones: (d.firstElementChild?.children ?? []).length,
      primera: ((d.firstElementChild?.children?.[0]?.textContent ?? '') || '').replace(/\s+/g, ' ').trim().slice(0, 16),
    };
  });
});

for (const t of tiras) {
  // ① ¿responde a un desplazamiento PROGRAMÁTICO? (el DOM permite scroll)
  const prog = await page.evaluate((i) => {
    const d = document.querySelector(`[data-tira="${i}"]`);
    if (d === null) return null;
    d.scrollLeft = 0;
    const antes = d.scrollLeft;
    d.scrollLeft = 400;
    const despues = d.scrollLeft;
    d.scrollLeft = 0;
    return { antes, despues };
  }, t.i);

  // ② ¿responde a un GESTO de rueda horizontal sobre la tira? (llega el evento)
  await page.mouse.move(t.cx, t.cy);
  await page.mouse.wheel(300, 0);
  await page.waitForTimeout(700);
  const trasRueda = await page.evaluate((i) => {
    const d = document.querySelector(`[data-tira="${i}"]`);
    return d === null ? null : Math.round(d.scrollLeft);
  }, t.i);
  await page.evaluate((i) => {
    const d = document.querySelector(`[data-tira="${i}"]`);
    if (d !== null) d.scrollLeft = 0;
  }, t.i);

  const oculto = t.contenido - t.visible;
  const pct = Math.round((t.visible / t.contenido) * 100);
  console.log(
    `  tira ${t.i} @ y ${String(t.y).padStart(4)} · ${String(t.opciones).padStart(2)} opciones [${t.primera}…]\n` +
      `     se ve ${t.visible}/${t.contenido} dp = ${pct} % · quedan ${oculto} dp fuera\n` +
      `     scroll programático: ${prog === null ? '?' : `${prog.antes} → ${prog.despues} ${prog.despues > 0 ? '✓ el DOM deja' : '✗ el DOM NO deja'}`}\n` +
      `     rueda horizontal:    scrollLeft = ${trasRueda} ${trasRueda !== null && trasRueda > 0 ? '✓ el evento llega' : '✗ el evento NO mueve'}`,
  );
}

console.log(`  tiras horizontales que desbordan: ${tiras.length}`);

/**
 * 🔴 CON `envuelve` LAS TIRAS DESAPARECEN, ASÍ QUE LA PREGUNTA CAMBIA — y
 * **hay que cambiar la vara o el cero miente**. Sin scroller horizontal el
 * bloque de arriba imprime «0 tiras» y eso se lee igual que «no hay
 * chips»: la medición que prueba la cura es **¿SE VEN TODOS?**, o sea si
 * algún chip cae fuera del ancho de su contenedor.
 *
 * *Es el mismo modo de falla que ya cobré una vez hoy: cuando la cura
 * cambia la forma, la métrica vieja deja de medir el defecto y su número
 * bueno no prueba nada.*
 */
const alcanzables = await page.evaluate(() => {
  const chips = [...document.querySelectorAll('[role="radio"]')];
  if (chips.length === 0) return null;
  let cortados = 0;
  for (const c of chips) {
    const r = c.getBoundingClientRect();
    const p = c.parentElement;
    if (p === null) continue;
    const pr = p.getBoundingClientRect();
    // Fuera del ancho de su contenedor por más de 1 dp de redondeo.
    if (r.right > pr.right + 1 || r.left < pr.left - 1) cortados++;
  }
  return { total: chips.length, cortados };
});
console.log(
  alcanzables === null
    ? '  ⚠ no se encontraron chips en la hoja.'
    : `  🔴 ④ (mitad de ALCANCE) chips en la hoja: ${alcanzables.total} · fuera del ancho de su contenedor: ${alcanzables.cortados} ${alcanzables.cortados === 0 ? '✓ se ven todos' : '✗'}`,
);

/** 🔴 LA MITAD DE SEÑAL: ¿el rótulo de cada eje DICE cuántas opciones
 *  tiene? Un truncado declarado no acerca un chip, pero deja de mentir. */
const rotulos = await page.evaluate(() =>
  [...document.querySelectorAll('*')]
    .filter((d) => d.children.length === 0)
    .map((d) => (d.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter((t) => /^(Categoría|Para qué animal|Marca|Presentación|Precio)( · \d+)?$/.test(t)),
);
console.log('\n  rótulos de eje, tal como se pintan:');
for (const r of rotulos) console.log(`    «${r}» ${/ · \d+$/.test(r) ? '✓ declara cuántas' : '✗ NO declara'}`);
console.log(
  `  🔴 ④ (mitad de SEÑAL) ejes que declaran su tamaño: ${rotulos.filter((r) => / · \d+$/.test(r)).length} de ${rotulos.length}`,
);

console.log('\n  🔴 LÍMITE DEL APARATO, declarado: esto mide el DOM y el evento de rueda.');
console.log('     El ARRASTRE con el dedo dentro de una hoja arrastrable —donde el pan de');
console.log('     `Hoja` compite con el scroll horizontal de `FiltroPills`— **no se');
console.log('     reproduce en RN-web** y queda SIN medir.');

await browser.close();
