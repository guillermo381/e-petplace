#!/usr/bin/env node
/**
 * verify-gestos — el guard del GESTO MUDO (S82-A r3, L-192).
 *
 * LA FALLA QUE CAZA: un `GestureDetector` fuera de un
 * `GestureHandlerRootView` NUNCA dispara en dispositivo y NO AVISA (la
 * web no lo exige — el smoke da verde igual). Así salió el encuadre de
 * la foto al teléfono del founder: el hint prometía arrastre y el gesto
 * estaba muerto. Misma clase que la cura S58 del prestador
 * (SliderPrecio), que el cliente no había heredado.
 *
 * LA REGLA (medida contra los 4 casos vivos de la casa):
 *   1. CADA APP lleva GestureHandlerRootView en su _layout RAÍZ
 *      (prestador lo tiene desde S58; cliente desde S82 r3).
 *   2. Todo archivo con GestureDetector Y <Modal envuelve LOCAL — el
 *      Modal abre OTRA ventana nativa y el root del app no llega
 *      (por eso Hoja y VisorFoto siempre lo trajeron adentro).
 *   Excepción declarada: `// gesto-raiz: <ruta>` nombra el ancestro.
 *
 * Exit != 0 = hay un gesto mudo y LA TANDA NO SE PUBLICA (patrón D-574).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAICES_APP = [
  'apps/cliente/src/app/_layout.tsx',
  'apps/prestador/src/app/_layout.tsx',
];
const ARBOLES = ['apps/cliente/src', 'apps/prestador/src', 'packages/ui/src'];

function archivos(dir) {
  const out = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    const st = statSync(ruta);
    if (st.isDirectory()) out.push(...archivos(ruta));
    else if (/\.(tsx|ts)$/.test(nombre)) out.push(ruta);
  }
  return out;
}

const fallas = [];

// 1 · el root de CADA app
for (const raiz of RAICES_APP) {
  const src = readFileSync(raiz, 'utf8');
  if (!src.includes('GestureHandlerRootView')) {
    fallas.push(`${raiz} — la RAÍZ del app no monta GestureHandlerRootView (todo GestureDetector de cuerpo de pantalla sale MUDO)`);
  }
}

// 2 · Modal = otra ventana nativa: exige root LOCAL
for (const arbol of ARBOLES) {
  for (const ruta of archivos(arbol)) {
    const src = readFileSync(ruta, 'utf8');
    if (!src.includes('GestureDetector')) continue;
    if (!/<Modal[\s>]/.test(src)) continue;
    if (src.includes('GestureHandlerRootView')) continue;
    if (/\/\/\s*gesto-raiz:/.test(src)) continue;
    fallas.push(`${ruta} — GestureDetector DENTRO de un Modal sin root local (el root del app no cruza la ventana del Modal)`);
  }
}

if (fallas.length > 0) {
  console.error('✗ GESTO MUDO (L-192):');
  for (const f of fallas) console.error(`   ${f}`);
  process.exit(1);
}
console.log('✓ gestos: roots de app presentes · todo GestureDetector-en-Modal con root local');
