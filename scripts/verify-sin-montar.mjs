#!/usr/bin/env node
/**
 * verify:sin-montar — LAS PIEZAS TERMINADAS QUE NINGUNA PANTALLA MONTÓ.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ EXISTE: **18 piezas invisibles, y ningún instrumento las contaba.**
 * ═══════════════════════════════════════════════════════════════════════════
 * El inventario de S113-B midió **5 piezas sin consumidor y con edad + 13
 * entregadas sin montar**, la más vieja de **S104**. Y el número que lo dice
 * más fuerte: **el lenguaje del tablero está en 0 de 195 pantallas.**
 *
 * *Una pieza sin montar no falla: compila, pasa sus gates, tiene su entrada en
 * la galería y su parte dice «entregada». Lo único que no hace es existir para
 * nadie* — y eso no se descubre revisando código, se descubre contándolo.
 *
 * ── 🔴 LO QUE MIDE, Y LO QUE **NO** ─────────────────────────────────────
 * **NO dice «estas piezas están muertas».** Una recién entregada espera a que
 * su pantalla la monte, y eso es normal. Por eso hay una **ventana**: sólo
 * cuenta lo que lleva `DIAS_DE_GRACIA` sin consumidor. *El corte no es la
 * existencia, es el TIEMPO sin respuesta.*
 *
 * ⚠️ **Y su modo de falla útil es que el número SUBA SOLO con el calendario:**
 * una pieza entregada hoy no cuenta, y en ocho días sí. **Eso es deliberado.**
 * *Un gate que sólo reacciona a lo que alguien escribe no puede ver un olvido,
 * porque un olvido no se escribe.* Cuando suba, la pregunta no es «¿quién
 * rompió algo?» sino **«¿esta pieza fue descartada y nadie lo dijo?»**.
 *
 * ── EL BASELINE ES SOLO-BAJA ────────────────────────────────────────────
 * Bajarlo cuando el número baja de verdad es cerrar la deuda. **Subirlo para
 * que pase un rojo es desarmar el guard** — y la casa ya lo tiene escrito.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const raiz = new URL('..', import.meta.url).pathname;

/** Cuántos días puede una pieza esperar a su pantalla sin contar. */
const DIAS_DE_GRACIA = 7;

/**
 * 🔴 **BASELINE SOLO-BAJA.** Hoy son 3: `CierreEnCurso` (S104-B) ·
 * `HiloDelDia` y `SelectorRoster` (S107-B). Las otras dos del inventario
 * —`SelectorDestinoDonacion` (6 d) y `BotonBajarAlFinal` (4 d)— **todavía están
 * dentro de la gracia**, y entrarán solas con el calendario: eso es el gate
 * haciendo su trabajo, no un rojo nuevo.
 */
const BASELINE = 3;

/** Infra: métodos y helpers que viven en `components/` y no se dibujan. */
const NO_ES_PIEZA = new Set(['capturaFoto']);

const arch = (d, ext = '.tsx') => {
  const out = [];
  const rec = (x) => {
    let e = [];
    try { e = readdirSync(x) } catch { return }
    for (const n of e) {
      const f = join(x, n);
      if (statSync(f).isDirectory()) rec(f);
      else if (f.endsWith(ext)) out.push(f);
    }
  };
  rec(join(raiz, d));
  return out;
};
const leer = (f) => { try { return readFileSync(f, 'utf8') } catch { return '' } };

const piezas = readdirSync(join(raiz, 'packages/ui/src/components'))
  .filter((f) => f.endsWith('.tsx') && !f.endsWith('.web.tsx'))
  .map((f) => f.replace('.tsx', ''))
  .filter((n) => !NO_ES_PIEZA.has(n));

const apps = [...arch('apps/cliente/src'), ...arch('apps/prestador/src'), ...arch('apps/cliente/src', '.ts'), ...arch('apps/prestador/src', '.ts')];
/* 🔴 **QUÉ NO CUENTA COMO CONSUMIDOR, y las dos exclusiones las obligó un
   VERDE FALSO de este mismo gate.**
   · **La galería**: *una lámina prueba que la pieza existe, no que alguien la
     use.*
   · **El barril `index.ts`**: ⏪ la primera versión lo incluía y **el gate dio
     0 sin consumidor cuando el inventario decía 18** — porque el barril
     **exporta todas**, así que cada pieza tenía su «consumidor» ahí. *Un
     archivo que nombra a todo no distingue nada, y un instrumento que no puede
     producir su rojo está acompañando, no midiendo* (`L-459`). Lo cazó comparar
     contra un número que ya conocía: **sin esa verdad previa, el 0 se habría
     leído como salud.**
   `packages/ui` sí cuenta en lo demás: una pieza que otra pieza monta está viva. */
const ui = [...arch('packages/ui/src'), ...arch('packages/ui/src', '.ts')].filter(
  (f) => !f.includes('/gallery/') && !/\/index\.ts$/.test(f),
);

const sinMontar = [];
for (const p of piezas) {
  const re = new RegExp(`\\b${p}\\b`);
  if (apps.some((f) => re.test(leer(f)))) continue;
  if (ui.some((f) => !f.endsWith(`${p}.tsx`) && re.test(leer(f)))) continue;
  /* 🔴 **DOS PREGUNTAS DISTINTAS, Y LA SEGUNDA ES UN RESPALDO DECLARADO.**
     `--diff-filter=A` da la fecha de ALTA, que es la buena. Pero **no ve los
     merges** —`git log` no difea un merge por defecto— así que una pieza que
     entró a esta rama por un merge no tiene alta acá: le pasó a
     `AvisoAnticipacion` y `PresentacionNexo`, que están versionadas y sin
     fecha.
     El respaldo es el ÚLTIMO TOQUE. ⚠️ **Y su error tiene dirección, que es lo
     que lo hace usable:** un último toque es *más reciente* que el alta, así
     que la pieza se ve MÁS JOVEN y el gate cuenta de MENOS. *Un instrumento que
     se equivoca hacia el silencio es aceptable si lo dice; uno que se equivoca
     hacia el ruido se apaga solo a la tercera vez.* */
  let dias = -1;
  let exacta = true;
  const ruta = `packages/ui/src/components/${p}.tsx`;
  const fecha = (args) => {
    try { return execSync(`git log ${args} --format=%at -1 -- ${ruta}`, { cwd: raiz }).toString().trim() }
    catch { return '' }
  };
  let at = fecha('--diff-filter=A');
  if (!at) { at = fecha(''); exacta = false; }
  if (at) dias = Math.floor((Date.now() / 1000 - Number(at)) / 86400);
  sinMontar.push({ pieza: p, dias, exacta });
}

/* 🔴 Sin git no se puede medir la EDAD, y sin edad este gate no distingue una
   pieza olvidada de una entregada hace un rato. **NO CONCLUYENTE, jamás verde.** */
const sinHistoria = sinMontar.filter((x) => x.dias < 0);
if (sinHistoria.length > 0) {
  console.log(`⚠️ NO CONCLUYENTE · sin fecha de alta para: ${sinHistoria.map((x) => x.pieza).join(' · ')}`);
  console.log('   No es verde ni rojo: es que no se pudo medir la edad. Sale 2.');
  process.exit(2);
}

const vencidas = sinMontar.filter((x) => x.dias >= DIAS_DE_GRACIA).sort((a, b) => b.dias - a.dias);
const enGracia = sinMontar.filter((x) => x.dias < DIAS_DE_GRACIA);

console.log(`verify:sin-montar · ${piezas.length} piezas · ${sinMontar.length} sin consumidor`);
console.log(`  en gracia (< ${DIAS_DE_GRACIA} d, esperan pantalla): ${enGracia.length}`);
console.log(`  🔴 sin montar hace ${DIAS_DE_GRACIA}+ días: ${vencidas.length}  (baseline ${BASELINE}, solo-baja)`);
for (const v of vencidas) console.log(`     · ${v.pieza.padEnd(26)} ${v.dias} días${v.exacta ? '' : ' (último toque, no alta: cuenta de MENOS)'}`);
const aprox = sinMontar.filter((x) => !x.exacta);
if (aprox.length > 0) {
  console.log(`  ⚠️ ${aprox.length} sin fecha de alta (entraron por merge): se midieron por último toque,`);
  console.log(`     así que se ven MÁS JÓVENES de lo que son y este número cuenta de menos.`);
}

if (vencidas.length > BASELINE) {
  console.log(`\n🔴 SUBIÓ: ${vencidas.length} > ${BASELINE}.`);
  console.log('   No pregunta quién rompió algo: pregunta si una pieza fue DESCARTADA');
  console.log('   y nadie lo dijo. Se contesta con su pantalla, no bajando el número.');
  process.exit(1);
}
if (vencidas.length < BASELINE) {
  console.log(`\n✓ BAJÓ a ${vencidas.length}. Bajá el BASELINE en el mismo commit: la deuda se cerró.`);
}
console.log('\n✓ verde');
