#!/usr/bin/env node
/**
 * S111-A (firma del founder) · EL TRINQUETE DE LA RAZÓN — baseline SOLO-BAJA.
 *
 * QUÉ MIDE: consumidores de `apps/` que pasan `razonDeshabilitado=` a un
 * `Boton` **sin pasar `onRazon=`**. Sin `onRazon`, `Boton` calcula
 * `conRazon = false` y el botón queda apagado **y sin hint de a11y**.
 *
 * POR QUÉ TRINQUETE Y NO BARRIDA (`L-477`): la lección de la voz se cazó
 * DOS VECES en un día con el trinquete del voseo, y ninguna barrida había
 * fallado — las cuatro entraron DESPUÉS de la última. *Lo que falla no es la
 * barrida: falla que entre una y la siguiente nada mira.* Este gate no prohíbe
 * el estado —puede haber casos legítimos— **prohíbe que el número SUBA**.
 *
 * ══ 🔴 LO QUE ESTE GATE **NO** VE, y hay que decirlo porque cambia qué
 *    significa su verde (correctivo de `L-459`) ══════════════════════════════
 *
 * ① **NO mide si la razón se DIBUJA, porque NO SE DIBUJA NUNCA.** Medido el
 *    1-sep-2026 con control positivo (el label del botón sí se pinta, así que
 *    el instrumento distingue render de no-render): en `Boton.tsx`,
 *    `razonDeshabilitado` aparece **una sola vez en el render** y es
 *    `accessibilityHint`. ⇒ **Pasar `onRazon` NO hace aparecer ningún texto**:
 *    hace el botón tocable y le da hint a los lectores de pantalla.
 *    *Este gate cuida una propiedad real y ACOTADA; no cuida que el usuario
 *    vea por qué el botón está apagado — eso hoy no lo hace nadie.*
 *
 * ② **NO ve los frenos que ni siquiera pasan razón.** Su universo son los que
 *    YA la pasan. Medido: **96 archivos** pasan `deshabilitado={` y sólo **12**
 *    pasan `razonDeshabilitado=`. Los otros 84 quedan fuera **a propósito** —
 *    cuáles de ellos necesitan explicarse es decisión de producto, no de gate.
 *
 * ③ **Mide por ARCHIVO, no por botón.** Un archivo con dos botones, uno con
 *    razón y otro sin ella, cuenta como uno.
 *
 * NO necesita red ni DB. Apto para el hook.
 *
 * Salidas: 0 verde · 1 el número SUBIÓ · 2 la auto-prueba falló (no pude medir).
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASELINE_FILE = 'scripts/.baseline-razon-muda.json';
const RAIZ = 'apps';

function archivos(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.expo' || e === 'dist') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) archivos(p, out);
    else if (/\.(tsx|ts)$/.test(e)) out.push(p);
  }
  return out;
}

/** El corazón, aislado para que la AUTO-PRUEBA pueda ejercerlo. */
export function esMudo(src) {
  return /razonDeshabilitado=/.test(src) && !/onRazon=/.test(src);
}

// ══ AUTO-PRUEBA — «no pude medir» NO es «no encontré nada» (L-459) ══════════
{
  const rojo = 'a <Boton razonDeshabilitado={"x"} /> b';
  const verde = 'a <Boton razonDeshabilitado={"x"} onRazon={f} /> b';
  const neutro = 'no hay botones acá';
  if (!esMudo(rojo) || esMudo(verde) || esMudo(neutro)) {
    console.error('✗ verify:razon-muda — LA AUTO-PRUEBA FALLÓ. No puedo medir, así que');
    console.error('  no cuento ningún verde: un instrumento que no distingue su propio');
    console.error('  rojo de su verde no certifica nada.');
    process.exit(2);
  }
}

const mudos = archivos(RAIZ).filter((p) => esMudo(readFileSync(p, 'utf8'))).sort();
const n = mudos.length;

const base = existsSync(BASELINE_FILE)
  ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')).baseline
  : null;

if (base === null) {
  writeFileSync(BASELINE_FILE, JSON.stringify({ baseline: n, sembrado: new Date().toISOString() }, null, 2) + '\n');
  console.log(`✓ verify:razon-muda — baseline SEMBRADO en ${n}`);
  process.exit(0);
}

console.log(`── verify:razon-muda · ${n} archivo(s) · baseline ${base} (solo-baja)`);
for (const m of mudos) console.log(`   · ${m}`);

if (n > base) {
  console.error(`\n✗ EL NÚMERO SUBIÓ: ${base} → ${n}. El trinquete NO deja subir.`);
  console.error('  Si el caso nuevo es legítimo, se declara y se sube el baseline A MANO,');
  console.error('  con su razón — jamás en el mismo commit que lo introdujo.');
  process.exit(1);
}
if (n < base) {
  writeFileSync(BASELINE_FILE, JSON.stringify({ baseline: n, sembrado: new Date().toISOString() }, null, 2) + '\n');
  console.log(`\n✓ BAJÓ: ${base} → ${n}. Baseline apretado — no puede volver a subir.`);
  process.exit(0);
}
console.log('\n✓ verify:razon-muda VERDE — el número no subió.');
