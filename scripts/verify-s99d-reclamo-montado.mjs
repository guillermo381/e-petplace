/**
 * verify-s99d-reclamo-montado.mjs — EL CALLEJÓN DEL REPARTIDOR, ABIERTO (L2).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * El Gate 2 lo midió en vivo: el repartidor creó su cuenta **con el mismo
 * correo con el que ya lo habían invitado**, y el cascarón le dijo *«avisale
 * a quien administra el negocio que te invite»* — con un solo botón, cerrar
 * sesión. **Ya estaba invitado.** El motor tenía la puerta desde S99-A con
 * CERO consumidores: *motor sin puerta*. La pieza es de C; **el montaje es de
 * D porque el callejón vive en su cascarón**, y es una línea.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 ESTE GUARD NO ACEPTA, Y ESO ES DELIBERADO ───────────────────────
 * Aceptar **muta datos reales**: ataría de verdad la cuenta del repartidor
 * de Clínica Aurora, consumiría el único pendiente vivo del ecosistema y
 * dejaría el guard sin sujeto para siempre. *Un fixture que muta producción
 * ya le costó a esta casa un rol borrado (S75).* Lo que se mide acá es que
 * **la puerta EXISTA y DIGA de qué negocio es**; el toque es de la persona y
 * su gate es del founder en el aparato.
 *
 * ── LAS CUATRO POBLACIONES ─────────────────────────────────────────────
 * | cuenta          | qué es                        | ve el reclamo |
 * |-----------------|-------------------------------|---------------|
 * | `repartidor1`   | invitado, cuenta sin atar     | **SÍ**, con «Clínica Aurora» |
 * | `duenovet`      | prestador con negocio         | no (ni llega a esa pantalla) |
 * | `duenotodo`     | dual                          | no |
 * | `duenodes`      | vendedor puro                 | no |
 *
 * Las tres últimas son el brazo que la casa exige (criterio ratificado por
 * mesa): **la pieza devuelve `null` sin pendientes, así que montarla no debe
 * cambiar NADA para quien no tiene vínculo** — y eso hay que probarlo, no
 * suponerlo, porque el montaje toca el guard raíz por el que entran todos.
 *
 * ⚠️ RN-web (L-153). El gate del toque «aceptar» es del aparato.
 *
 * Uso:  node scripts/verify-s99d-reclamo-montado.mjs [--puerto 8082]
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
  { cuenta: 'repartidor1', quien: 'invitado sin atar', ve: true, negocio: 'Clínica Aurora' },
  { cuenta: 'duenovet', quien: 'prestador con negocio', ve: false },
  { cuenta: 'duenotodo', quien: 'el dual', ve: false },
  { cuenta: 'duenodes', quien: 'vendedor puro', ve: false },
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

    const cuerpo = await page.locator('body').innerText();
    /* 🔴 NO SE BUSCA UN TÍTULO FIJO: se busca **el nombre del negocio** en la
       pantalla del invitado. Un título podría dibujarse con la lista vacía y
       el guard no lo distinguiría — *lo que prueba que el lector funcionó es
       que la pantalla sepa de QUÉ negocio es el vínculo.* Para las otras tres
       la aguja es la contraria: que ese bloque no aparezca. */
    const marca = caso.ve
      ? cuerpo.includes(caso.negocio)
      : /te (registró|registro)|reclam/i.test(cuerpo);

    // ⚠️ El «no ve» se afirma sobre la pantalla que de verdad les toca: si
    // alguna de las tres cayera en el callejón, este guard NO lo taparía —
    // lo diría el arranque, que las lleva a sus tabs.
    const ok = caso.ve ? marca : !marca;
    console.log(
      `${ok ? '✅' : '🔴'} ${caso.cuenta.padEnd(12)} (${caso.quien.padEnd(22)}) · reclamo=${
        caso.ve ? (marca ? 'sí, con su negocio' : 'NO') : marca ? 'SÍ (no debía)' : 'no'
      }`,
    );

    if (!ok && caso.ve) {
      const enCallejon = /cerrar sesión/i.test(cuerpo);
      fallos.push(
        `repartidor1: el reclamo NO se montó${enCallejon ? ' — sigue en el callejón cortés' : ''}`,
      );
    }
    if (!ok && !caso.ve) {
      fallos.push(`${caso.cuenta}: le apareció un reclamo que no le corresponde`);
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
  `\n✅ VERDE — el invitado ve su vínculo con el nombre del negocio, y a nadie\n` +
    `   más le cambió la pantalla. El TOQUE de aceptar es de la persona: gate\n` +
    `   del founder en el aparato (acá no se muta el dato real).\n`,
);
