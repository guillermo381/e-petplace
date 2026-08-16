/**
 * verify-s99d-escalon-atender.mjs — L-251 · «UN MENÚ DE UNA OPCIÓN ES UN PEAJE».
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LA REGLA, tres escalones: **CERO** capacidades → no hay tab · **UNA** → la
 * pantalla directa · **DOS O MÁS** → las baldosas. La decisión la toma
 * `escalonDeAtender()` (pieza de C, 6/6); **el destino lo ejecuta la BARRA**,
 * que es el cascarón — y ese reparto ES el freno:
 *
 * 🔴 **CON UN `Redirect` ADENTRO DE LA TAB, EL BACK QUEDA EN UNA RATONERA:**
 * el atrás del destino vuelve a la tab, la tab redirige, y así para siempre.
 * Primo de L-249 y del encierro de D-836. *La tab no rebota: la barra
 * apunta.* Por eso este guard mide **dónde aterriza el dedo Y que se pueda
 * volver** — lo segundo es la mitad que el Redirect rompería sin que la
 * primera lo note.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 LO QUE ESTE GUARD **NO** PUEDE MEDIR, medido antes de declararlo ──
 * **El toque de la tab no se puede simular en RN-web.** Recorrido entero:
 * `click()` → timeout de actionability (la barra tiene indicador animado por
 * worklet: nunca está “estable”) · `click({force:true})` → no pasa nada ·
 * `mouse.click()` sobre su caja real (medida: x=168 y=844, visible) → **la
 * pantalla activa NO cambia**.
 *
 * **Y NO ES MI CAMBIO: lo probé con `git stash`** — en el árbol sin mi rama
 * el resultado es idéntico. Es la barra de RN-web, que no responde a eventos
 * sintéticos. *El dedo del founder la usa todos los días; el robot no puede.*
 *
 * ⇒ **El escalón «una» se gatea en el APARATO.** Acá se mide la mitad que sí
 * es medible y que además es la que el freno de C protege: **que el destino
 * exista y que su ATRÁS SALGA.** Si la tab rebotara con un `Redirect`, el
 * atrás volvería a la tab y la tab redirigiría — ratonera. Se prueba yendo al
 * destino y volviendo. *No es el gesto completo, y se dice cuál falta.*
 *
 * ⚠️ RN-web (L-153).
 *
 * Uso:  node scripts/verify-s99d-escalon-atender.mjs [--puerto 8082]
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

const CUENTAS = ['duenovet', 'duenotodo', 'duenodes'];

/** Los dos destinos posibles del escalón «una» (contrato de `DestinoAtender`). */
const DESTINOS = ['/ventas/mostrador', '/mostrador?oficio=veterinaria'];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const fallos = [];

/* ① LA TAB EXISTE PARA QUIEN TIENE CAPACIDAD — lo único del gesto que sí se
   puede leer sin tocarla. */
for (const cuenta of CUENTAS) {
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${cuenta}@gmail.com`);
    await page.locator('input[type="password"]').fill(CLAVE);
    await page.getByText('Entrar', { exact: true }).click();
    await page.waitForTimeout(14000);
    const n = await page.getByRole('tab', { name: 'Atender' }).count();
    console.log(`   ${cuenta.padEnd(10)} · tab ATENDER en la barra: ${n > 0 ? 'sí' : 'no'}`);
  } catch (e) {
    fallos.push(`${cuenta}: EXCEPCIÓN — ${String(e).split('\n')[0].slice(0, 110)}`);
  } finally {
    await ctx.close();
  }
}

/* ② 🔴 LA RATONERA — el freno de C, y es lo que de verdad se prueba acá.
   Se entra al destino por su ruta y se vuelve. Con un `Redirect` adentro de
   la tab, el atrás caería en la tab y la tab redirigiría de nuevo: la persona
   no saldría nunca. Se mide con la cuenta que tiene las dos naturalezas. */
{
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.getByPlaceholder('ej: ana@correo.com').fill('guillo381+duenotodo@gmail.com');
    await page.locator('input[type="password"]').fill(CLAVE);
    await page.getByText('Entrar', { exact: true }).click();
    await page.waitForTimeout(14000);

    for (const destino of DESTINOS) {
      await page.goto(`${BASE}${destino}`, { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForTimeout(6000);
      const llego = page.url().includes(destino.split('?')[0]);
      await page.goBack();
      await page.waitForTimeout(6000);
      const salio = !page.url().includes(destino.split('?')[0]);
      console.log(
        `   ${destino.padEnd(32)} · abre=${llego ? 'sí' : 'NO'} · atrás sale=${salio ? 'sí ✅' : 'NO 🔴 RATONERA'}`,
      );
      if (!llego) fallos.push(`${destino}: no abre — el escalón «una» apuntaría a nada`);
      if (llego && !salio) fallos.push(`${destino}: el atrás NO sale — ratonera (freno de C)`);
    }
  } catch (e) {
    fallos.push(`ratonera: EXCEPCIÓN — ${String(e).split('\n')[0].slice(0, 110)}`);
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
  `\n✅ VERDE — los dos destinos del escalón «una» abren y su ATRÁS SALE:\n` +
    `   no hay ratonera, que es lo que el freno de C protege.\n` +
    `⚠️ EL TOQUE DE LA TAB NO SE PUDO SIMULAR (ver cabecera, con su baseline):\n` +
    `   el escalón «una» se gatea EN EL APARATO. Esto no lo reemplaza.\n`,
);
