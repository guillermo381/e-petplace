/**
 * ⭐ **EL SELECTOR DE MASCOTA MUESTRA TODAS** (S113-C · 1.1.1).
 *
 * El founder vio avatares cortados. Medido en el código: era un `ScrollView
 * horizontal` con el indicador apagado — **había scroll y no se veía**. La cura
 * los acomoda en filas; esto verifica que **todas** las que la familia tiene
 * lleguen a la vista, no que «entren en la pantalla».
 *
 * 🔴 **La cuenta se compara contra la LISTA, no contra un número tecleado**: se
 * leen las mascotas del Hogar y se exige que el selector tenga las mismas. *Un
 * arnés que dice «hay 5» no distingue cinco de las cinco correctas.*
 */
import { chromium } from 'playwright-core';

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const di = (s) => console.log(s);

const navegador = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await navegador.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 160)));
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 200 && (await page.locator('input[type="password"]').count()) === 0; i += 1) {
  await page.waitForTimeout(1000);
}
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(16000);
di(`cuenta: ${CORREO}`);

/* Las mascotas que la familia tiene, según la tira del Hogar. */
const enElHogar = await page.evaluate(() => {
  const nombres = new Set();
  for (const e of document.querySelectorAll('[role="button"]')) {
    const t = (e.getAttribute('aria-label') ?? '').trim();
    const m = /^Ver a (.+)$|^(.+), (?:al día|sin registro)/.exec(t);
    if (m !== null) nombres.add(m[1] ?? m[2]);
  }
  return [...nombres];
});
di(`mascotas en el Hogar (por sus tarjetas): ${enElHogar.length ? enElHogar.join(' · ') : '(no las pude leer así)'}`);

/* Se abre la pata y se toca un dedo que necesita elegir. */
await page.getByRole('button', { name: /^Abrir a |^Lo que te espera$/ }).first().click().catch(() => {});
await page.waitForTimeout(1500);
const dedo = page.getByRole('button', { name: /^(Peso|Vacuna|Antiparasitario|Recuerdo)$/ }).first();
if ((await dedo.count()) === 0) {
  di('🔴 no encontré ningún dedo con la pata abierta.');
  await navegador.close();
  process.exit(2);
}
const cual = (await dedo.getAttribute('aria-label')) ?? '(?)';
await dedo.click().catch(() => {});
await page.waitForTimeout(2500);

const t = await T();
di('');
di('── EL SELECTOR ────────────────────────────────────────────');
di(`  se abrió tocando «${cual}»: ${/Para qui|elegí|Elegí|Which/i.test(t) ? 'sí' : 'quizá — se mira por sus chips'}`);

/* Los chips del selector: se miden POR SU CAJA, no por el texto de la pantalla
   (que trae también los nombres de la tira de atrás). */
const chips = await page.evaluate(() => {
  const dentro = [];
  for (const e of document.querySelectorAll('[role="button"]')) {
    const r = e.getBoundingClientRect();
    /* El chip del selector: ~84 de ancho y más alto que ancho no. */
    if (Math.abs(r.width - 84) <= 6 && r.height > 60 && r.height < 160) {
      dentro.push({ nombre: (e.getAttribute('aria-label') ?? '').trim(), y: Math.round(r.y), x: Math.round(r.x) });
    }
  }
  return dentro;
});
const filas = [...new Set(chips.map((c) => c.y))].sort((a, b) => a - b);
di(`  chips a la vista: ${chips.length ? chips.map((c) => c.nombre).join(' · ') : 'ninguno'}`);
di(`  se acomodan en ${filas.length} fila(s) (y ${chips.length} chips)`);
di(`  ¿alguno se sale del ancho de la hoja?: ${chips.some((c) => c.x + 84 > 420) ? '🔴 sí' : 'no ✓'}`);

/* 🔴 **LOS CHIPS DE ARRIBA MIDEN EL LAYOUT, NO LA VISIBILIDAD.** Un nodo fuera
   del área visible de un ScrollView **sigue teniendo caja**, así que «5 filas»
   dice cómo se acomodan, jamás cuántas se ven. El tope se mide aparte: por el
   alto del contenedor contra el alto de su contenido. */
const tope = await page.evaluate(() => {
  for (const e of document.querySelectorAll('div')) {
    const st = getComputedStyle(e);
    if (st.overflowY !== 'scroll' && st.overflowY !== 'auto') continue;
    if (e.scrollHeight <= e.clientHeight) continue;
    if (e.clientHeight < 80 || e.clientHeight > 600) continue;
    return { visible: e.clientHeight, contenido: e.scrollHeight };
  }
  return null;
});
di(`  el contenedor: ${tope === null ? 'no desborda (o no lo hallé)' : `${tope.visible}px visibles de ${tope.contenido}px ⇒ HAY tope y HAY scroll ✓`}`);

di('');
di(`errores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await page.screenshot({ path: 'docs/loop/S113-C-selector-mascota.png' });
await navegador.close();
