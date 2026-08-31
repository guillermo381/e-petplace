/**
 * verify-baldosa-tres-columnas-s107b — LA BALDOSA A TRES COLUMNAS, MEDIDA EN EL
 * RENDER Y NO EN UN MODELO (S107-B).
 *
 * 🔴 POR QUÉ EXISTE: la cura anterior se hizo con un modelo de ancho de glifo
 * tipográfico (`0,519 × caracteres × tamaño`) que **predijo bien el ancho y fue
 * MUDO en las dos cosas que rompieron**: dónde cae el corte, y el ALTO. El
 * founder lo vio en el aparato. *Un modelo que contesta una pregunta se lee
 * como si contestara la vecina.*
 *
 * QUÉ MIDE, contra el DOM real, con el glifo puesto y los cinco labels reales:
 *   ① ¿el texto se monta sobre el glifo?  (cajas que se solapan)
 *   ② ¿el contenido se sale de la baldosa? (hijo más alto que su caja)
 *   ③ ¿en cuántos renglones cae cada label y DÓNDE corta?
 *
 * ⚠️ CONTROL POSITIVO OBLIGATORIO: si la página no montó, un censo de cajas
 * devuelve CERO **sin fallar a la vista** y ese cero se lee como «no hay
 * defectos» (la lección de `/gallery` en 500). Por eso aborta si no encuentra
 * el ancla — y **ya cobró: en su primera corrida salió NO CONCLUYENTE en los
 * tres anchos**, que es lo correcto.
 *
 * ── 🔴 CÓMO SE CORRE, Y POR QUÉ B NO PUDO TERMINARLO ──────────────────────
 * ```
 * cd apps/prestador && npx expo start --web --port 8081     # con .env.local
 * # …iniciar sesión en el navegador…
 * node scripts/verify-baldosa-tres-columnas-s107b.mjs
 * ```
 * **`/gallery` vive detrás del login**, y **B no tipea contraseñas** —tampoco
 * las de una cuenta demo local—, así que la corrida queda a mano de quien tenga
 * sesión. *Se entrega el instrumento con su resultado real —NO CONCLUYENTE— en
 * vez de un verde que no se pudo producir.*
 *
 * **Diagnóstico completo de la corrida de B, para no repetirlo:**
 * · sin `.env.local` la app monta el gate de entorno (`bodyLen` 106) — la
 *   página responde **HTTP 200 igual**, que es exactamente el caso que el
 *   control positivo existe para atrapar;
 * · con `.env.local`, `/gallery` **redirige al login** (`bodyLen` 235).
 */
import { chromium } from 'playwright-core';

const ANCHOS = [360, 390, 430];
const URL = 'http://localhost:8081/gallery';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let fallos = 0;

for (const width of ANCHOS) {
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width, height: 1400 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2500);

  // ── CONTROL POSITIVO ──────────────────────────────────────────────────
  const ancla = await page.locator('text=LOS MISMOS CINCO a TRES columnas').count();
  if (ancla === 0) {
    console.log(`✗ ${width}: NO CONCLUYENTE — no se encontró el ancla de la sección.`);
    console.log('  Un censo de cajas acá devolvería 0 y ese 0 no significa «sin defectos».');
    fallos++;
    await ctx.close();
    continue;
  }

  const medidas = await page.evaluate(() => {
    const solapan = (a, b) =>
      a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

    const nombres = ['Paseo', 'Grooming', 'Adiestramiento', 'Veterinaria', 'Guardería'];
    const out = [];
    for (const n of nombres) {
      // el título es el div/span cuyo texto es exactamente el label
      const el = [...document.querySelectorAll('div,span')].filter(
        (e) => e.textContent?.trim() === n && e.children.length === 0,
      );
      for (const t of el) {
        // la baldosa: el ancestro con aspect-ratio declarado
        let caja = t;
        for (let i = 0; i < 12 && caja; i++) {
          const cs = getComputedStyle(caja);
          if (cs.aspectRatio && cs.aspectRatio !== 'auto') break;
          caja = caja.parentElement;
        }
        if (!caja) continue;
        const rc = caja.getBoundingClientRect();
        if (rc.width > 200) continue; // descarta la grilla de DOS
        const rt = t.getBoundingClientRect();
        const svg = caja.querySelector('svg');
        const rs = svg?.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(t).lineHeight) || 20;
        out.push({
          label: n,
          anchoCaja: +rc.width.toFixed(1),
          altoCaja: +rc.height.toFixed(1),
          renglones: Math.max(1, Math.round(rt.height / lh)),
          pisaGlifo: rs ? solapan(rt, rs) : null,
          seSale: rt.bottom > rc.bottom + 0.5 || rt.right > rc.right + 0.5,
        });
        break;
      }
    }
    return out;
  });

  console.log(`\n── ${width} px ──────────────────────────────`);
  for (const m of medidas) {
    const mal = m.pisaGlifo === true || m.seSale === true;
    if (mal) fallos++;
    console.log(
      `${mal ? '✗' : '✓'} ${m.label.padEnd(15)} caja ${m.anchoCaja}×${m.altoCaja} · ` +
        `${m.renglones} renglón(es) · pisa glifo: ${m.pisaGlifo} · se sale: ${m.seSale}`,
    );
  }
  if (medidas.length < 5) {
    console.log(`  ⚠️ sólo se midieron ${medidas.length}/5 labels — medición INCOMPLETA`);
    fallos++;
  }
  await ctx.close();
}

await browser.close();
console.log(fallos === 0 ? '\nVERDE — ningún label pisa el glifo ni se sale, en los tres anchos.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
