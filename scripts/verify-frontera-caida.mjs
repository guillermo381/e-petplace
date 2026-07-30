#!/usr/bin/env node
/**
 * verify-frontera-caida — el guard BILATERAL de la frontera del crash
 * (S82-A r4, patrón verify-gestos: el hermano de app que ya pagó la
 * lección no puede volver a perderla).
 *
 * LA FALLA QUE CAZA: un app SIN ErrorBoundary en su _layout raíz pinta
 * BLANCO mudo ante un crash de render — la peor clase de máscara (no
 * fabrica nada y tampoco dice nada; el usuario lo lee como "se colgó").
 * El prestador la curó en S79-B con voto de mesa APP-WIDE; el cliente
 * la incumplió hasta S82 r4 — este guard impide la tercera vez.
 *
 * LA REGLA: cada _layout RAÍZ exporta `ErrorBoundary` y el componente
 * pantalla-caida existe en el app.
 *
 * Exit != 0 = hay un app sin frontera y LA TANDA NO SE PUBLICA (D-574).
 */

import { existsSync, readFileSync } from 'node:fs';

const APPS = [
  { raiz: 'apps/cliente/src/app/_layout.tsx', caida: 'apps/cliente/src/components/pantalla-caida.tsx' },
  { raiz: 'apps/prestador/src/app/_layout.tsx', caida: 'apps/prestador/src/components/pantalla-caida.tsx' },
];

const fallas = [];
for (const app of APPS) {
  const src = readFileSync(app.raiz, 'utf8');
  if (!/export\s*\{[^}]*as\s+ErrorBoundary[^}]*\}/.test(src) && !/export\s+(const|function)\s+ErrorBoundary/.test(src)) {
    fallas.push(`${app.raiz} — el raíz NO exporta ErrorBoundary (un crash de render pinta BLANCO mudo)`);
  }
  if (!existsSync(app.caida)) {
    fallas.push(`${app.caida} — pantalla-caida no existe en este app`);
  }
}

if (fallas.length > 0) {
  console.error('✗ FRONTERA DEL CRASH AUSENTE:');
  for (const f of fallas) console.error(`   ${f}`);
  process.exit(1);
}
console.log('✓ frontera del crash: ambos raíces exportan ErrorBoundary y pantalla-caida existe');
