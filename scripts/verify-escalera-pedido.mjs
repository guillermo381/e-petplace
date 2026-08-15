/**
 * S99-A · EL GUARD DE LA ESCALERA — el catálogo vivo contra el mapeo de C.
 *
 * `apps/prestador/src/lib/escalera-pedido.ts` mapea los estados internos del
 * pedido a escalones y acciones LEYENDO EL CATÁLOGO DE UN DÍA (12-ago-2026).
 * Nada garantizaba que siguiera cierto cuando el motor se mueva: un estado
 * nuevo cae al `default` y el pedido pierde la escalera SIN QUE NADA FALLE —
 * la clase exacta de «funciona mal sin fallar». Este instrumento es la
 * mitad que C no podía hacer (C no ve cuándo el motor se mueve) y A sí.
 *
 * TRES BRAZOS, cada uno con su porqué:
 *  R1 — todo estado ACTIVO fuera de la narrativa `pagando` está mapeado en el
 *       switch (el vendedor no ve `pagando` por diseño; todo lo demás que el
 *       motor pueda pisar tiene que tener escalera o desvío).
 *  R2 — todo case del switch existe en el catálogo (el mapeo no nombra
 *       estados que el motor ya no tiene).
 *  R3 — todo estado `desde` de una transición VIVA del actor `vendedor` está
 *       mapeado Y su rama no es `accion: 'ninguna'` (una acción que el motor
 *       ofrece y la pantalla no pide es un botón perdido en silencio).
 *
 * Se corre con: node scripts/verify-escalera-pedido.mjs
 * Rojo = exit 1 con la lista exacta. Pensado para correr en todo cierre de
 * lote de S99 y en toda migración futura que toque `cat_estados_pedido` o
 * `cat_transiciones_pedido`.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql, linea } from './s92/lib-s92.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO = join(RAIZ, 'apps/prestador/src/lib/escalera-pedido.ts');
const fuente = readFileSync(ARCHIVO, 'utf8');

// ── el mapeo, parseado del switch (labels agrupados hasta su return) ────────
const cuerpo = fuente.slice(fuente.indexOf('switch (estadoInterno)'));
const mapeo = new Map(); // estado -> Set<accion>
{
  let pendientes = [];
  for (const l of cuerpo.split('\n')) {
    // [a-zA-Z0-9_]: los códigos del catálogo son minúsculas HOY, pero un label
    // con mayúscula quedaba invisible para R2 (lo midió C renombrando a
    // `picking_APAGADO`: R2 calló y solo R1/R3 gritaron). El parser ve TODO
    // label; que el código sea inválido lo dice R2 contra el catálogo.
    const c = l.match(/^\s*case '([a-zA-Z0-9_]+)':/);
    if (c) {
      pendientes.push(c[1]);
      continue;
    }
    if (pendientes.length > 0) {
      const acciones = [...l.matchAll(/accion: '([a-zA-Z]+)'/g)].map((m) => m[1]);
      if (acciones.length > 0) {
        // ramas multilínea (el ternario de `documentado`): acumular hasta cerrar
        for (const e of pendientes) {
          const set = mapeo.get(e) ?? new Set();
          acciones.forEach((a) => set.add(a));
          mapeo.set(e, set);
        }
        if (l.includes(';')) pendientes = [];
      }
    }
    if (l.match(/^\s*default:/)) break;
  }
}
if (mapeo.size === 0) {
  linea('🔴 el parser no encontró el switch — el guard no puede medir');
  process.exit(1);
}

// ── el catálogo vivo ────────────────────────────────────────────────────────
const filas = await sql(
  `SELECT jsonb_build_object(
     'estados', (SELECT jsonb_agg(jsonb_build_object('c',codigo,'narr',narrativa,'act',activo)) FROM cat_estados_pedido),
     'desde_vendedor', (SELECT jsonb_agg(DISTINCT desde) FROM cat_transiciones_pedido WHERE actor='vendedor' AND activo)
   ) AS x;`,
  'verify-escalera',
);
const { estados, desde_vendedor } = filas[0].x;

const rojos = [];

// R1 — activo fuera de `pagando` ⇒ mapeado.
for (const e of estados) {
  if (e.act && e.narr !== 'pagando' && !mapeo.has(e.c)) {
    rojos.push(`R1: estado ACTIVO sin mapear (caería al default sin escalera): ${e.c} [${e.narr}]`);
  }
}

// R2 — todo case existe en el catálogo.
const codigos = new Set(estados.map((e) => e.c));
for (const c of mapeo.keys()) {
  if (!codigos.has(c)) rojos.push(`R2: el mapeo nombra un estado que el catálogo ya no tiene: ${c}`);
}

// R3 — toda transición viva del vendedor tiene botón.
for (const d of desde_vendedor ?? []) {
  const acc = mapeo.get(d);
  if (!acc) {
    // estados apagados (backorder, decision_faltante…) caen a null a propósito
    // — pero si están ACTIVOS y con transición viva, es rojo.
    const est = estados.find((e) => e.c === d);
    if (est?.act) rojos.push(`R3: transición viva del vendedor desde ${d} y el mapeo no lo conoce`);
    continue;
  }
  if (acc.size === 1 && acc.has('ninguna')) {
    rojos.push(`R3: el vendedor puede mover desde ${d} y la pantalla dice accion:'ninguna' — botón perdido`);
  }
}

if (rojos.length > 0) {
  linea('🔴 verify-escalera-pedido — el mapeo y el motor DIVERGEN:');
  for (const r of rojos) linea(`   ${r}`);
  process.exit(1);
}
linea(
  `✅ verify-escalera-pedido VERDE — ${mapeo.size} estados mapeados · ${estados.filter((e) => e.act).length} activos en catálogo · ${(desde_vendedor ?? []).length} orígenes de acción del vendedor, todos con botón`,
);
