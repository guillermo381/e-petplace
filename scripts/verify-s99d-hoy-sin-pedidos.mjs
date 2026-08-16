/**
 * verify-s99d-hoy-sin-pedidos.mjs — LA LÁPIDA DE LA LÍNEA FUSIONADA (L4).
 *
 * Adjudicación de mesa #1 (15-ago): **el HOY se queda con citas.** Los
 * despachos se mudan a la ventana hermana. Este instrumento prueba las dos
 * mitades de esa firma **con el mismo par**, y la segunda es la que importa:
 *
 * 🔴 **EL HALLAZGO QUE LA MUDANZA DESTAPÓ Y QUE NADIE HABÍA MEDIDO.** El
 * efecto que alimentaba la línea pedía `listarPedidosDelVendedor` para TODO
 * prestador con `cuenta_comercial_id` — **que son todos, porque es por donde
 * cobra**. O sea que un veterinario que jamás vendió una bolsa de alimento
 * pagaba esa petición **en cada foco de su HOY** para recibir una lista
 * vacía. *No era el costo del dual: era el costo de todos.* Por eso el brazo
 * de `duenovet` no es un control de regresión — **es el brazo que mide el
 * regalo al lote #0** (D-738 · L-223: el peaje es la petición).
 *
 * ── LAS TRES POBLACIONES, y por qué las tres ───────────────────────────
 * | cuenta      | qué es                | `v_pedidos_narrativa` en su HOY |
 * |-------------|-----------------------|----------------------------------|
 * | `duenovet`  | prestador sin tienda  | **CERO** — el viaje que se va     |
 * | `duenotodo` | el dual               | **CERO** — la firma: HOY = citas  |
 * | `duenodes`  | vendedor puro         | **≥1** — su HOY SON sus pedidos   |
 *
 * El tercer brazo es el que evita el verde flojo: sin él, borrar el lector
 * de la app entera daría verde en los dos primeros y habría roto al único
 * actor cuyo día ES esa lista (la cura de C, `(tabs)/index.tsx` retorno
 * temprano). *Un guard que solo prueba lo que cambié bendice lo que rompí.*
 *
 * ⚠️ RN-web, no dispositivo (L-153). Mide VIAJES, no segundos: la vara de
 * N16 se corre en aparato.
 *
 * Uso:  node scripts/verify-s99d-hoy-sin-pedidos.mjs [--puerto 8082]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8082')}`;
const CLAVE = execFileSync('security', [
  'find-generic-password',
  '-a',
  'siembra',
  '-s',
  'epetplace-siembra-s97',
  '-w',
])
  .toString()
  .trim();

/** La lectura que la lápida saca del HOY. */
const LECTOR = 'v_pedidos_narrativa';

const CASOS = [
  { cuenta: 'duenovet', quien: 'prestador sin tienda', espera: 0 },
  { cuenta: 'duenotodo', quien: 'el dual', espera: 0 },
  { cuenta: 'duenodes', quien: 'vendedor puro', esperaMin: 1 },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const fallos = [];

for (const caso of CASOS) {
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  let contando = false;
  let n = 0;
  page.on('request', (r) => {
    if (contando && r.url().includes(LECTOR)) n += 1;
  });
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${caso.cuenta}@gmail.com`);
    await page.locator('input[type="password"]').fill(CLAVE);
    contando = true; // desde el toque de Entrar: el arranque entero del HOY
    await page.getByText('Entrar', { exact: true }).click();
    await page.waitForTimeout(13000);
    contando = false;

    const veredicto =
      caso.espera === 0
        ? n === 0
          ? '✅'
          : '🔴'
        : n >= (caso.esperaMin ?? 1)
          ? '✅'
          : '🔴';
    console.log(
      `${veredicto} ${caso.cuenta.padEnd(10)} (${caso.quien.padEnd(21)}) · ${LECTOR} × ${n}`,
    );

    if (caso.espera === 0 && n > 0) {
      fallos.push(
        `${caso.cuenta}: el HOY todavía lee ${LECTOR} (${n}×) — la lápida no cerró`,
      );
    }
    if (caso.esperaMin !== undefined && n < caso.esperaMin) {
      fallos.push(
        `${caso.cuenta}: su HOY NO leyó ${LECTOR} — el vendedor puro se quedó sin su día`,
      );
    }
  } catch (e) {
    fallos.push(`${caso.cuenta}: EXCEPCIÓN — ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await ctx.close();
  }
}
await browser.close();

if (fallos.length > 0) {
  console.error(`\n🔴 ROJO — ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`   · ${f}`);
  process.exit(1);
}
console.log(
  `\n✅ VERDE — el HOY se quedó con citas, y el viaje de pedidos se fue de\n` +
    `   TODO prestador que no vende. El vendedor puro conserva el suyo.\n`,
);
