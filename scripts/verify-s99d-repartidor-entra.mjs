/**
 * verify-s99d-repartidor-entra.mjs — LA PANTALLA QUE NADIE ALCANZABA (L2).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 EL ROJO QUE CIERRA, medido en el Gate 2: el repartidor ACEPTA su
 * vínculo —queda **sellado** en la base— y el resolvedor seguía diciéndole
 * *«sin rol prestador»*. Y para entonces el callejón ya era **MUDO**: como
 * no queda pendiente, la tarjeta del reclamo tampoco se dibuja. **La
 * pantalla `/ventas/entregas` existe desde S96 y no la alcanzaba nadie** —
 * cuarta muestra de *motor sin puerta* en la sesión.
 *
 * *Las dos mitades de L2 son una sola cosa: el reclamo ata el vínculo, y
 * esta rama lo convierte en una puerta. Sin la segunda, aceptar deja a la
 * persona exactamente donde estaba, pero sin siquiera el botón.*
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── LO QUE SE MIDE ─────────────────────────────────────────────────────
 * | cuenta | quién es | dónde tiene que caer |
 * |---|---|---|
 * | `repartidor1` | Diego, vínculo SELLADO con Clínica Aurora | **`/ventas/entregas`** |
 * | `duenovet` · `duenotodo` · `duenodes` | los tres de siempre | **sus tabs, intactas** |
 *
 * El brazo de los tres es obligatorio (criterio de la casa): **la rama nueva
 * se inserta en el guard raíz por el que entran TODOS**, entre la pregunta
 * del vendedor y la voz de espera. Una rama mal puesta ahí no rompe al
 * repartidor: rompe a los demás.
 *
 * ── ⚠️ EL SUJETO ES ÚNICO Y SU ESTADO YA NO ES REVERSIBLE DESDE ACÁ ────
 * Diego era, hasta el Gate 2, el único **pendiente** vivo del ecosistema —
 * el sujeto del guard del reclamo (`verify-s99d-reclamo-montado.mjs`). Al
 * aceptar **de verdad**, ese guard se quedó sin brazo positivo. *No lo
 * consumió un script: lo consumió la persona, que es exactamente como tenía
 * que pasar.* Queda declarado en aquel archivo y acá: **el reclamo se
 * re-gatea sembrando un pendiente nuevo, jamás desatando a Diego.**
 *
 * ⚠️ RN-web (L-153). Y esta corrida NO ve el segundo rojo del Gate 2
 * (D-835, dueño A: aceptar y cerrar sesión dejan la pantalla en esqueleto)
 * porque **cada caso entra con la app fresca** — que es justamente la
 * condición con la que la mesa dijo que esta rama ya funciona.
 *
 * Uso:  node scripts/verify-s99d-repartidor-entra.mjs [--puerto 8082]
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

const CASOS = [
  { cuenta: 'repartidor1', quien: 'Diego, vínculo sellado', destino: '/ventas/entregas' },
  { cuenta: 'duenovet', quien: 'prestador sin tienda', destino: 'tabs' },
  { cuenta: 'duenotodo', quien: 'el dual', destino: 'tabs' },
  { cuenta: 'duenodes', quien: 'vendedor puro', destino: 'tabs' },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const fallos = [];

for (const caso of CASOS) {
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${caso.cuenta}@gmail.com`);
    await page.locator('input[type="password"]').fill(CLAVE);
    await page.getByText('Entrar', { exact: true }).click();
    await page.waitForTimeout(14000);

    const url = page.url();
    const cuerpo = await page.locator('body').innerText();
    /* El callejón se reconoce por su ÚNICA salida — un botón de cerrar
       sesión sobre un estado vacío. Se mira aparte de la URL porque un
       redirect que no ocurre y un callejón se ven distinto en la barra de
       direcciones pero igual de mal para la persona. */
    const enCallejon = /cerrar sesión/i.test(cuerpo) && /registró|registro/i.test(cuerpo);

    if (caso.destino === '/ventas/entregas') {
      const ok = url.includes('/ventas/entregas');
      console.log(
        `${ok ? '✅' : '🔴'} ${caso.cuenta.padEnd(12)} (${caso.quien.padEnd(22)}) · ${url.replace(BASE, '') || '/'}`,
      );
      if (!ok) {
        fallos.push(
          `${caso.cuenta}: NO llegó a su pantalla${enCallejon ? ' — sigue en el callejón, ahora mudo' : ` (quedó en ${url.replace(BASE, '')})`}`,
        );
      }
    } else {
      /* Los tres de siempre: NI en entregas NI en el callejón. Se afirma por
         los dos lados — quedarse en la raíz de tabs es lo correcto, y este
         guard no se pone a re-verificar su barra (eso ya lo miden los otros). */
      const desviado = url.includes('/ventas/entregas');
      const ok = !desviado && !enCallejon;
      console.log(
        `${ok ? '✅' : '🔴'} ${caso.cuenta.padEnd(12)} (${caso.quien.padEnd(22)}) · ${url.replace(BASE, '') || '/'}`,
      );
      if (desviado) fallos.push(`${caso.cuenta}: lo mandó a /ventas/entregas y NO es repartidor`);
      else if (enCallejon) fallos.push(`${caso.cuenta}: cayó en el callejón — la rama nueva lo desvió`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    fallos.push(`${caso.cuenta}: EXCEPCIÓN — ${msg.slice(0, 120)}`);
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
  `\n✅ VERDE — el repartidor con vínculo sellado entra a SU pantalla, y a los\n` +
    `   otros tres no les cambió el destino. La puerta que le faltaba al motor.\n`,
);
