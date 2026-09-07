/**
 * ⭐ **EL PERFIL COMO TABLERO** (S113-C · 2.2 · C1) — los tres rojos.
 *
 * 🔴 **Se mide el ORDEN por la caja, no el texto por la pantalla.** Otras
 * pantallas quedan montadas con caja real en RN-web, así que un `innerText`
 * sirve para saber qué hay y **jamás** para saber en qué orden está: la
 * posición vertical de cada rótulo es el único dato que lo dice.
 *
 * ⚠️ **El piso de chevrons.** Los gráficos se cuentan por `<svg>`, y la
 * pantalla tiene chevrons que también son svg. Por eso se mide **la misma
 * pantalla con y sin datos**: lo que importa es la DIFERENCIA, no el número.
 */
import { chromium } from 'playwright-core';

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const di = (s) => console.log(s);

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 150)));

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(18000);
di(`cuenta: ${CORREO}\n`);

/* Los rótulos de sección, con su Y. **Del DOM, no del innerText.** */
const ROTULOS = ['Su salud', 'Conociéndolo', 'Su historia', 'Identidad'];

async function verPerfil(nombre) {
  await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  const tarj = page.getByRole('button', { name: new RegExp(`^(Ver a )?${nombre}`) }).first();
  if ((await tarj.count()) === 0) return null;
  await tarj.click();
  await page.waitForTimeout(7000);
  return await page.evaluate((rots) => {
    const txt = document.body.innerText;
    const secciones = [];
    /* 🔴 **`children.length === 0` dejaba fuera la mitad de los rótulos.**
       `RotuloSeccion` y `Texto variante="seccion"` anidan un `<div>` adentro,
       así que el nodo cuyo texto coincide TIENE hijos. Se recorre TODO y se
       toma **el más profundo** que coincida: el que de verdad pinta la línea.
       *El instrumento medía una convención de markup, no el rótulo.* */
    for (const e of document.querySelectorAll('*')) {
      const t = (e.textContent ?? '').trim();
      if (!rots.includes(t)) continue;
      const r = e.getBoundingClientRect();
      if (r.height <= 0) continue;
      const y = Math.round(r.y + window.scrollY);
      /* 🔴 **«Conociéndolo» aparece DOS veces**: es la etiqueta de la cuarta
         acción (arriba, dentro de un botón) y el rótulo de su sección. Lo
         escribí en el censo de esta misma tanda y volví a caer: el arnés tomaba
         la primera aparición y reportaba la sección arriba del tablero.
         *Se descarta lo que vive dentro de un control: un rótulo de sección no
         es tocable.* */
      if (e.closest('[role="button"]') !== null) continue;
      const ya = secciones.find((s) => s.rotulo === t);
      if (ya === undefined) secciones.push({ rotulo: t, y });
    }
    return {
      secciones: secciones.sort((a, b) => a.y - b.y).map((s) => s.rotulo),
      sinRegistro: (txt.match(/Sin registro/g) ?? []).length,
      svg: document.querySelectorAll('svg').length,
      hoy: /Su próxima cita|Una vacuna que se acerca|Toca desparasitar|Algo para mirar|Para conocerlo mejor/.test(txt),
      conociendolo: /Sabemos \d+ de \d+/.test(txt),
      tablero: /Su salud/.test(txt),
      identidadPlegada: /Ver \d+ más/.test(txt),
    };
  }, ROTULOS);
}

const filas = [];
for (const n of ['Thor', 'Lolo', 'Sombra']) {
  const r = await verPerfil(n);
  filas.push([n, r]);
  di(`── ${n} ─────────────────────────────────────────`);
  if (r === null) { di('  (no está en el Hogar)\n'); continue; }
  di(`  orden de secciones : ${r.secciones.join(' → ') || '(ninguna)'}`);
  di(`  tarjeta de HOY     : ${r.hoy ? 'sí' : 'no'}`);
  di(`  tablero «Su salud» : ${r.tablero ? 'sí' : 'no'}`);
  di(`  «Sin registro»     : ${r.sinRegistro}`);
  di(`  svg (gráficos+chevrons): ${r.svg}`);
  di(`  «Conociéndolo» con fracción: ${r.conociendolo ? 'sí' : 'no'}`);
  di(`  identidad plegada  : ${r.identidadPlegada ? 'sí' : 'no'}\n`);
}

di('── EL ORDEN FIRMADO ────────────────────────────');
const esperado = ['Su salud', 'Conociéndolo', 'Su historia', 'Identidad'];
const thor = filas.find(([n]) => n === 'Thor')?.[1];
di(`  esperado: ${esperado.join(' → ')}`);
di(`  medido  : ${thor?.secciones.join(' → ') ?? '(sin datos)'}`);
di(`  ⇒ ${JSON.stringify(thor?.secciones) === JSON.stringify(esperado) ? '✓ coincide' : '🔴 NO coincide'}`);

di('');
di('── EL ROJO DEL VACÍO (Lolo contra Thor) ────────');
const lolo = filas.find(([n]) => n === 'Lolo')?.[1];
if (thor && lolo) {
  di(`  «Sin registro»: Thor ${thor.sinRegistro} · Lolo ${lolo.sinRegistro} ⇒ ${lolo.sinRegistro > thor.sinRegistro ? '✓ el vacío lo dice' : '🔴'}`);
  di(`  svg           : Thor ${thor.svg} · Lolo ${lolo.svg} ⇒ ${lolo.svg < thor.svg ? '✓ Lolo dibuja menos' : '🔴 dibuja igual o más'}`);
  di(`  (la diferencia ${thor.svg - lolo.svg} son los gráficos que Lolo NO tiene; el resto es el piso de chevrons)`);
}
const sombra = filas.find(([n]) => n === 'Sombra')?.[1];
if (sombra) di(`\n  Sombra (memorial): tablero=${sombra.tablero ? '🔴 sí' : '✓ no'} · hoy=${sombra.hoy ? '🔴 sí' : '✓ no'} · conociéndolo=${sombra.conociendolo ? '🔴 sí' : '✓ no'}`);

di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await nav.close();
