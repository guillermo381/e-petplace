#!/usr/bin/env node
/**
 * verify-moneda — EL GUARD DEL FORMATEO A MANO (S82-A r16).
 *
 * LA REGLA: la plata se formatea con el RIEL (`monto` / `montoConCodigo`
 * de `@epetplace/i18n`), jamás a mano. Un `$${x.toFixed(2)}` incrustado
 * asume tres cosas sin decirlo — **el símbolo, los decimales y el país**
 * — y el producto sirve a Ecuador y Colombia con monedas distintas.
 *
 * ES LA MISMA CURA QUE EL PIE DE RESERVA: lo que se copia, diverge.
 *
 * ── BASELINE SOLO-BAJA ──
 * El barrido no se puede hacer de un saque (ver el porqué abajo), así
 * que el guard NO exige cero: **congela el número de hoy y no deja que
 * suba**. Cada sitio que se cure baja el baseline; ninguno nuevo entra.
 * El baseline es POR APP, para que el prestador —que se barre en su
 * propia sesión— no tape una regresión del cliente ni al revés.
 *
 * ── POR QUÉ NO ES CERO YA (medido S82 r16, y es el dato que importa) ──
 * De los **43 formateos del cliente**, exactamente **UNO** consume un
 * lector que devuelve `country_code`. Los otros 42 leen catálogo/oferta,
 * donde el país es el del PRESTADOR y la fila no lo trae. **Curarlos hoy
 * sería inventar la moneda**, que es peor que dejarlos a mano (orden del
 * founder). El desbloqueo real no es barrer: es **ensanchar esos
 * lectores** — y recién después el barrido es mecánico.
 *
 * ── CONDICIÓN DE MUERTE, escrita al nacer ──
 * Este guard se retira el día que el baseline llegue a **0 en las dos
 * apps** y el riel sea el único camino. Un guard que sobrevive a su
 * razón es basura que después nadie se anima a tocar.
 *
 * Exit != 0 = alguien sumó formateo a mano (o el baseline quedó viejo
 * hacia abajo, que también se reporta: el número miente).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Congelado el 31-jul-2026 con el censo real, medido POR SITIO. SOLO BAJA.
 *
 *  CORRECCIÓN DE MEDICIÓN que este guard destapó en su primera corrida:
 *  el censo de r14 decía "115 formateos" (41 interpolaciones + 74
 *  toFixed) y **los dos conjuntos SE SOLAPAN** — una línea
 *  `$${x.toFixed(2)}` es UN sitio, no dos. Contando por SITIO (que es lo
 *  que hay que curar) son **29 en el cliente y 44 en el prestador**: 73,
 *  no 115. El trabajo es un tercio menor de lo que la ficha decía. */
const BASELINE = {
  'apps/cliente/src': 29,
  'apps/prestador/src': 44,
};

/** Interpolación de `$` pegada a una expresión (`$${…}`) o `.toFixed(2)`
 *  —los dos dedos de la misma mano—. `toFixed` con otros decimales no
 *  entra: 2 es la firma del dinero (los porcentajes y los km usan 1). */
const PATRONES = [/\$\$\{/, /\.toFixed\(2\)/];

function archivos(dir, out = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) archivos(ruta, out);
    else if (/\.(tsx|ts)$/.test(ruta)) out.push(ruta);
  }
  return out;
}

let hayFalla = false;
const detalle = [];

for (const [raiz, tope] of Object.entries(BASELINE)) {
  let n = 0;
  const sitios = [];
  for (const archivo of archivos(raiz)) {
    const lineas = readFileSync(archivo, 'utf8').split('\n');
    lineas.forEach((linea, i) => {
      // El propio riel no cuenta: es la cura, no el mal. LA RUTA VA
      // COMPLETA, no por sufijo — la primera versión decía
      // /moneda\.ts$/ y eximía TAMBIÉN a `usar-moneda.ts` (y a
      // cualquier `*-moneda.ts` futuro). **Lo destapó intentar producir
      // el rojo**: el guard daba verde con un sitio sucio sembrado
      // adentro de ese archivo. Sin esa prueba, el agujero viajaba.
      if (archivo.endsWith('packages/i18n/src/moneda.ts')) return;
      if (PATRONES.some((p) => p.test(linea))) {
        n += 1;
        sitios.push(`${archivo}:${i + 1}`);
      }
    });
  }
  if (n > tope) {
    hayFalla = true;
    detalle.push(`✗ ${raiz}: ${n} formateos a mano (baseline ${tope}) — SUBIÓ.`);
    for (const s of sitios.slice(0, 8)) detalle.push(`     ${s}`);
    if (sitios.length > 8) detalle.push(`     … y ${sitios.length - 8} más`);
  } else if (n < tope) {
    // el baseline viejo hacia abajo TAMBIÉN se reporta: un número que
    // dice "43" cuando quedan 40 miente sobre cuánto falta
    detalle.push(`⚠ ${raiz}: ${n} (baseline ${tope}) — BAJÓ: actualizá el baseline a ${n}.`);
  } else {
    detalle.push(`✓ ${raiz}: ${n} formateos a mano (baseline ${tope}, sin subir)`);
  }
}

for (const l of detalle) console.log(l);
if (hayFalla) {
  console.error('\n  La plata se formatea con `monto()` del riel (@epetplace/i18n).');
  console.error('  Si el lector todavía no devuelve country_code: NO adivines la moneda —');
  console.error('  ensanchá el lector primero (ese es el desbloqueo real).');
  process.exit(1);
}
