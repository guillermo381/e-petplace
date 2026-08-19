#!/usr/bin/env node
/**
 * 🔴 UNA PIEZA DEL SHELL MONTADA TAMBIÉN EN UNA PANTALLA (S100d·bis-A).
 *
 * Corre: `node scripts/verify-shell-vs-pantalla.mjs`
 *
 * ── DE DÓNDE SALE ─────────────────────────────────────────────────────────
 * `CarritoFlotante` subió al shell (B) y siguió montado por pantalla (C).
 * **Las dos entregas eran correctas por separado** y juntas dibujaban DOS
 * carritos — uno tapado por la barra de tabs.
 *
 * **Ningún typecheck lo ve: dos montajes de la misma pieza compilan igual de
 * bien.** Y ninguna pista podía verlo sola, porque cada una miraba su mitad.
 * ⇒ **el ENSAMBLE es el único lugar donde alguien puede preguntar por la
 * combinación**, y este script es esa pregunta hecha máquina.
 *
 * ── ⚠️ EL DISCRIMINADOR, Y POR QUÉ LA REGLA CRUDA NO SERVÍA ───────────────
 * «Pieza del shell montada también en una pantalla» **sobre-dispara 22 a 2**:
 * `Icono` está en el shell y en veintidós pantallas, y **es correcto** — un
 * glifo no es un singleton. *Un lint que grita 22 veces se ignora, y entonces
 * no caza la vez que importa.*
 *
 * El discriminador que lo vuelve exacto **y no necesita convención nueva**:
 * **la pieza declara `position: 'absolute'` en su propia fuente.** Eso separa
 * un OVERLAY —que por definición debe existir una sola vez— de contenido
 * inline que se repite legítimamente.
 *
 *     Icono            → 0 ocurrencias  ⇒ fuera (mueren los 22 falsos)
 *     CarritoFlotante  → 3 ocurrencias  ⇒ adentro
 *
 * ── LO QUE ESTE INSTRUMENTO **NO** DICE ───────────────────────────────────
 * · No dice que el montaje de la pantalla esté de más: dice que **hay dos** y
 *   que alguien tiene que decidir. *La cura puede ser borrar el de la pantalla
 *   o que el shell se calle en esa ruta — y eso es criterio, no lint.*
 * · No caza dos montajes **dentro de la misma pantalla**.
 * · No caza un overlay que no declare `position:'absolute'` **en su propio
 *   archivo** (si lo recibe por estilo externo, este censo no lo ve).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SHELL = 'apps/cliente/src/app/(tabs)/_layout.tsx';
const PANTALLAS = 'apps/cliente/src/app/(tabs)';
const PIEZAS = 'packages/ui/src/components';

function archivos(dir) {
  const salida = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) salida.push(...archivos(p));
    else if (p.endsWith('.tsx')) salida.push(p);
  }
  return salida;
}

const shell = readFileSync(SHELL, 'utf8');

// Las piezas de @epetplace/ui que el shell IMPORTA y además MONTA.
const importadas = new Set();
for (const bloque of shell.matchAll(/import \{([^}]*)\} from '@epetplace\/ui'/gs)) {
  for (const bruto of bloque[1].split(',')) {
    const n = bruto.trim().split(/\s+/).pop()?.trim();
    if (n && /^[A-Z]/.test(n)) importadas.add(n);
  }
}
const montadasEnShell = [...importadas].filter((p) =>
  new RegExp(`<${p}[\\s/>]`).test(shell),
);

// El discriminador: solo las que son OVERLAY por su propia fuente.
const overlays = montadasEnShell.filter((p) => {
  try {
    return readFileSync(join(PIEZAS, `${p}.tsx`), 'utf8').includes("position: 'absolute'");
  } catch {
    return false;
  }
});

const choques = [];
for (const f of archivos(PANTALLAS)) {
  if (f.endsWith('_layout.tsx')) continue;
  const t = readFileSync(f, 'utf8');
  for (const p of overlays) {
    if (new RegExp(`<${p}[\\s/>]`).test(t)) choques.push({ pieza: p, archivo: f });
  }
}

console.log(`\n  shell monta: ${montadasEnShell.join(', ') || '(ninguna)'}`);
console.log(`  de esas, OVERLAYS: ${overlays.join(', ') || '(ninguna)'}\n`);

if (choques.length === 0) {
  console.log('✅ ningún overlay del shell está montado además por una pantalla\n');
  process.exit(0);
}

console.log('🔴 OVERLAY DEL SHELL MONTADO TAMBIÉN POR UNA PANTALLA — se dibuja DOS veces:\n');
for (const c of choques) console.log(`   ${c.pieza}  ·  ${c.archivo}`);
console.log(
  '\n   No es un veredicto: es una pregunta que el ensamble tiene que contestar.\n' +
    '   Curar borrando el montaje de la pantalla NO se lleva su `paddingBottom`:\n' +
    '   el overlay del shell sigue flotando encima y sin la cola tapa el último ítem.\n',
);
process.exit(1);
