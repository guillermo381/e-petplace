/**
 * verify-s99d-cruce-sin-salto.mjs — EL SALTO DEL CRUCE, MEDIDO.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 EL FOUNDER LO REPORTÓ DOS VECES, la segunda **sobre un OTA que YA
 * llevaba `EntradaDeCruce` montada** ⇒ la pieza está y el defecto sigue.
 *
 * Mi propio límite está escrito y no lo contradigo: **ningún guard alcanza
 * «cómo se SIENTE el cruce»** — eso es del aparato. Pero el MECANISMO sí se
 * mide, y es lo que este instrumento hace: **muestrea la opacidad real del
 * contenedor animado, frame a frame, durante el cruce.**
 *
 * *Una cosa es «se siente raro» y otra es «la opacidad va 1 → 0 → 1».
 * La primera la juzga el founder; la segunda la prueba una medición, y es la
 * que convierte una hipótesis en un pedido accionable.*
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── LA HIPÓTESIS QUE VIENE A FALSAR O CONFIRMAR ────────────────────────
 * En `EntradaDeCruce` (pieza de B):
 *
 *     const opacidad = useSharedValue(1)        // arranca VISIBLE
 *     useEffect(() => { … opacidad.value = 0 … }) // corre DESPUÉS de pintar
 *
 * Si eso es lo que pasa, la secuencia observable es **1 → 0 → rampa a 1**:
 * la pantalla se pinta ENTERA y en su lugar, y recién entonces salta a
 * invisible y desplazada para animar desde ahí. **Eso no es una transición
 * que falta: es un salto que sobra**, y es exactamente lo que un ojo
 * describe como «salta».
 *
 * ⇒ **VERDE = la opacidad NUNCA vuelve a bajar después de haber estado en 1**
 *   (o sea: o arranca en 0 y sube, o no hay animación).
 * ⇒ **ROJO = se observa un 1 seguido de un valor bajo** — el salto.
 *
 * ⚠️ RN-web (L-153): en nativo el orden de paint puede diferir, así que un
 * verde acá **no cierra el gate del aparato**. Un ROJO acá, en cambio, es
 * concluyente: el defecto existe en al menos una plataforma y su mecanismo
 * queda nombrado.
 *
 * ⚠️ La trampa del puerto (D-769) va blindada abajo.
 *
 * Uso:  node scripts/verify-s99d-cruce-sin-salto.mjs [--puerto 8082]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8082')}`;
const CUENTA = arg('cuenta', 'duenotodo'); // el DUAL: es quien tiene las dos ventanas
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

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const fallos = [];

/** Muestrea la opacidad de TODOS los contenedores animados por ~700 ms. */
async function muestrear(page, ms = 700) {
  return page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        /* 🔴 POR ELEMENTO, NO EL MÍNIMO DE TODOS — y es la segunda cura de
           este instrumento, porque la primera versión midió mal DOS veces:
           ① tomaba cualquier div con `opacity` y había un velo permanente en
           0.04, así que nunca veía el 1 y la aserción no podía disparar;
           ② corregido eso, tomaba el MÍNIMO entre los contenedores de cruce
           **y hay dos vivos a la vez** (el que se va, quieto en 1, y el que
           entra desde 0) ⇒ el «1 → 0» que reportaba era la mezcla de dos
           elementos, o sea **el comportamiento correcto leído como defecto**.
           *Un instrumento que agrega dos objetos en un número no mide
           ninguno de los dos.* Acá cada contenedor lleva su propia serie. */
        const key = (e) => {
          if (!e.dataset.cruceId) e.dataset.cruceId = 'c' + (window.__nCruce = (window.__nCruce ?? 0) + 1)
          return e.dataset.cruceId
        }
        const series = {}
        const t0 = performance.now()
        const tick = () => {
          const t = Math.round(performance.now() - t0)
          for (const e of document.querySelectorAll('div[style*="opacity"]')) {
            if (!/translate/i.test(e.style.transform ?? '')) continue
            const v = parseFloat(e.style.opacity)
            if (Number.isNaN(v)) continue
            ;(series[key(e)] ??= []).push([t, v])
          }
          if (performance.now() - t0 < ms) requestAnimationFrame(tick)
          else resolve(series)
        }
        requestAnimationFrame(tick)
      }),
    ms,
  );
}

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 400000 });
  if (/Unmatched Route|Page could not be found/i.test(await page.locator('body').innerText())) {
    console.error(`\n🔴 PUERTO EQUIVOCADO: ${BASE} no sirve esta app.\n`);
    process.exit(2);
  }
  await page.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${CUENTA}@gmail.com`);
  await page.locator('input[type="password"]').fill(CLAVE);
  await page.getByText('Entrar', { exact: true }).click();
  await page.waitForTimeout(22000);

  if (page.url().includes('/login')) {
    console.error(`\n🔴 NO SE PUDO ENTRAR — el guard NO mide nada acá.\n`);
    process.exit(2);
  }

  const puerta = page.getByRole('button', { name: /pedidos/i }).first();
  if ((await puerta.count()) === 0) {
    fallos.push('no se encontró la puerta hermana en el HOY — sin puerta no hay cruce que medir');
  } else {
    /* Se dispara el cruce y se muestrea SIN esperar: el salto vive en los
       primeros frames, que es justo lo que un `waitForTimeout` se come. */
    const [series] = await Promise.all([muestrear(page), puerta.click({ force: true })]);

    let animo = false;
    for (const [k, serie] of Object.entries(series)) {
      const vals = serie.map(([, v]) => v);
      const min = Math.min(...vals);
      const primeros = serie.slice(0, 3).map(([t, v]) => `${t}:${v.toFixed(2)}`).join(' ');
      const clase = min > 0.98 ? 'QUIETO (no animó)' : 'ANIMÓ';
      console.log(`  ${k}  ${clase.padEnd(18)} min=${min.toFixed(2)}  inicio: ${primeros}`);

      if (min <= 0.98) {
        animo = true;
        /* EL SALTO, ahora sí sin ambigüedad: ESTE MISMO contenedor estuvo
           en ~1 y DESPUÉS bajó. Eso es ver el estado final antes de la
           animación. */
        let vioUno = false;
        for (const [t, v] of serie) {
          if (v > 0.98) vioUno = true;
          else if (vioUno && v < 0.9) {
            fallos.push(
              `SALTO en ${k}: estuvo en opacidad 1 y a los ${t} ms bajó a ${v.toFixed(2)} ` +
                `⇒ se pintó el estado final ANTES de animar, y de ahí saltó al inicio.`,
            );
            break;
          }
        }
      }
    }
    if (!animo) {
      fallos.push(
        'NINGÚN contenedor animó — o no llegó la dirección del gesto (`tomarCruce()` dio null) ' +
          'o la pieza no está montada. En cualquier caso no hay transición, que es el síntoma reportado.',
      );
    }
  }
} catch (e) {
  fallos.push(`EXCEPCIÓN — ${String(e).split('\n')[0].slice(0, 140)}`);
} finally {
  await ctx.close();
  await browser.close();
}

if (fallos.length > 0) {
  console.error(`\n🔴 ROJO — ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`   · ${f}`);
  process.exit(1);
}
console.log(
  `\n✅ VERDE en web — la opacidad no vuelve a bajar después de estar en 1.\n` +
    `⚠️ NO cierra el gate del aparato: cómo se SIENTE el cruce sigue siendo del founder.\n`,
);
