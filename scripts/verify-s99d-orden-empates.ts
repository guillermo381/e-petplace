/**
 * verify-s99d-orden-empates.ts — EL DESEMPATE DEL FIFO, PROBADO SIN PANTALLA.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 EL DEFECTO QUE LO TRAJO: `pago_confirmado_en` **EMPATA**, y no como caso
 * de borde — **`now()` es constante dentro de una transacción (L-122a)**, así
 * que todo acto que escribe varias filas de una las empata al microsegundo.
 * Medido en la base: una cuenta con **3 pedidos pagados en un solo instante**,
 * otra con 5 en dos instantes, y **88 empates sobre 325** en `eventos_mascota`
 * que nadie sembró. **En esta casa las marcas de tiempo NUNCA son únicas por
 * construcción.**
 *
 * Sin desempate, el orden que el vendedor lee como *«de quién es el turno»*
 * era **AZAR** — exactamente lo que el FIFO existe para impedir.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ ESTE INSTRUMENTO Y NO UN GUARD DE PANTALLA ─────────────────
 * El guard de pantalla (`verify-s99d-orden-fifo.mjs`) **ganó su brazo de
 * empates y no puede correrlo**: las DOS cuentas del ecosistema que tienen
 * empates rechazan la clave de siembra, y **ninguna pista cambia la clave de
 * una cuenta que no creó** (freno de la casa — se pidió, no se forzó).
 *
 * Frenar ahí habría dejado la cura sin prueba. La salida no fue bajar la
 * vara: fue **mover el objeto a donde se puede medir** — el orden es una
 * FUNCIÓN PURA, y una función pura no necesita un login para demostrar una
 * propiedad. *Exigir un navegador para probar un comparador es poner un muro
 * entre el defecto y su prueba.*
 *
 * ── LO QUE PRUEBA, Y POR QUÉ CADA UNO ──────────────────────────────────
 * ① **ANTISIMETRÍA** — `cmp(a,b) === -cmp(b,a)`. Es LA propiedad que estaba
 *    rota: el comparador viejo devolvía **-1 en las DOS direcciones** con
 *    marcas iguales. *Un comparador que afirma «a antes que b» **y** «b antes
 *    que a» no es impreciso: deja el resultado de `sort` a merced del orden
 *    en que llegaron las filas.*
 * ② **DETERMINISMO BAJO PERMUTACIÓN** — las 6 permutaciones de un grupo
 *    empatado tienen que dar **el mismo orden**. Es la propiedad que le
 *    importa al vendedor: que la respuesta no cambie entre dos aperturas.
 * ③ **EL EMPATE ASCIENDE POR `numero_orden`** — único y **impreso en la
 *    tarjeta**: si pregunta «¿por qué éste primero?», la respuesta es
 *    verificable por él en su pantalla.
 * ④ **SIN PAGO VA ÚLTIMO** — el que no tiene pago confirmado no está en la
 *    cola (firma del founder), y esto prueba que el desempate no lo coló.
 *
 * ── 🔴 LA PRUEBA DE QUE NO ES VACÍA: EL COMPARADOR VIEJO CORRE ACÁ ─────
 * *Dos elementos en el orden correcto pueden serlo por casualidad* — mi
 * propio criterio, aplicado contra mi propio instrumento. Por eso el viejo
 * está embebido y se le exige que **FALLE** ①. Si algún día alguien
 * «simplifica» el nuevo de vuelta, este archivo lo caza; y hoy demuestra que
 * las aserciones muerden en vez de acompañar.
 *
 * Uso:  npx tsx --tsconfig apps/prestador/tsconfig.json scripts/verify-s99d-orden-empates.ts
 *       (el `--tsconfig` NO es adorno: sin él, `@/lib/...` no resuelve desde
 *        `scripts/`, que toma el tsconfig de la raíz — medido.)
 */
import type { PedidoDelVendedor } from '@epetplace/api';

import { ordenDeTrabajo } from '../apps/prestador/src/lib/orden-pedidos';

/** El instante compartido: tres pedidos pagados en la MISMA transacción. */
const T = '2026-08-13 01:03:53.341314+00';
const T2 = '2026-08-13 19:53:24.344832+00';

function pedido(numero: string, pago: string | null): PedidoDelVendedor {
  /* Solo se pueblan los campos que el comparador LEE. El resto va con forma
     válida: el objetivo es probar el orden, no fabricar un pedido completo. */
  return {
    pedido_id: `id-${numero}`,
    numero_orden: numero,
    total: 10,
    moneda: 'USD',
    narrativa: 'en_preparacion',
    narrativa_nombre: 'En preparación',
    es_terminal: false,
    promesa_desde: null,
    promesa_hasta: null,
    creado_en: T,
    pago_confirmado_en: pago,
    movido_al_frente_en: null,
  } as PedidoDelVendedor;
}

/* Los tres empatados llegan DESORDENADOS a propósito. */
const A = pedido('P-20260813-c0af79', T);
const B = pedido('P-20260813-b7b83a', T);
const C = pedido('P-20260813-dcd9aa', T);
const TARDE = pedido('P-20260813-000001', T2);
const SIN_PAGO = pedido('P-20260813-aaaaaa', null);

const EXTRAS = {};
const cmp = (x: PedidoDelVendedor, y: PedidoDelVendedor) => ordenDeTrabajo(x, y, EXTRAS);

/** EL COMPARADOR VIEJO, verbatim en su lógica — para probar que el test muerde. */
function cmpViejo(a: PedidoDelVendedor, b: PedidoDelVendedor): number {
  const ma = a.movido_al_frente_en ?? null;
  const mb = b.movido_al_frente_en ?? null;
  if (ma !== null && mb !== null) return ma < mb ? 1 : -1;
  if (ma !== null) return -1;
  if (mb !== null) return 1;
  const pa = a.pago_confirmado_en ?? null;
  const pb = b.pago_confirmado_en ?? null;
  if (pa === null && pb === null) return 0;
  if (pa === null) return 1;
  if (pb === null) return -1;
  return pa < pb ? -1 : 1;
}

const fallos: string[] = [];
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✅' : '🔴'} ${msg}`);
  if (!cond) fallos.push(msg);
};

const TODOS = [A, B, C, TARDE, SIN_PAGO];

// ① ANTISIMETRÍA sobre TODOS los pares, empates incluidos.
let asimetrico = 0;
for (const x of TODOS) {
  for (const y of TODOS) {
    if (x === y) continue;
    if (Math.sign(cmp(x, y)) !== -Math.sign(cmp(y, x))) asimetrico++;
  }
}
ok(asimetrico === 0, `① antisimetría: ${asimetrico} par(es) donde cmp(a,b) ≠ −cmp(b,a)`);

// ①bis — el VIEJO tiene que FALLAR ①, o este test no prueba nada.
let asimetricoViejo = 0;
for (const x of TODOS) {
  for (const y of TODOS) {
    if (x === y) continue;
    if (Math.sign(cmpViejo(x, y)) !== -Math.sign(cmpViejo(y, x))) asimetricoViejo++;
  }
}
ok(
  asimetricoViejo > 0,
  `①bis el comparador VIEJO falla la antisimetría en ${asimetricoViejo} par(es) ` +
    `⇒ la aserción ① MUERDE (si diera 0, este test estaría acompañando, no probando)`,
);

// ② DETERMINISMO BAJO PERMUTACIÓN — las 6 barajas dan el mismo orden.
function permutaciones<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) =>
    permutaciones([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]),
  );
}
const ordenes = new Set(
  permutaciones([A, B, C]).map((perm) =>
    [...perm]
      .sort(cmp)
      .map((p) => p.numero_orden)
      .join('|'),
  ),
);
ok(
  ordenes.size === 1,
  `② determinismo: las 6 permutaciones del grupo empatado dan ${ordenes.size} orden(es) distinto(s) ` +
    `${ordenes.size === 1 ? `— siempre ${[...ordenes][0]}` : `— ${[...ordenes].join('  ≠  ')}`}`,
);

// ③ EL EMPATE ASCIENDE POR numero_orden.
const grupo = [A, B, C].sort(cmp).map((p) => p.numero_orden);
const esperado = [A, B, C].map((p) => p.numero_orden).sort();
ok(
  grupo.join('|') === esperado.join('|'),
  `③ el empate asciende por número: ${grupo.join(' → ')}`,
);

// ④ SIN PAGO VA ÚLTIMO (y el desempate no lo coló adelante).
const todos = [...TODOS].sort(cmp).map((p) => p.numero_orden);
ok(
  todos[todos.length - 1] === SIN_PAGO.numero_orden,
  `④ sin pago confirmado va último: ${todos.join(' → ')}`,
);

// ⑤ EL FIFO SIGUE MANDANDO sobre el desempate: el pago tardío va DESPUÉS del
//    grupo temprano, aunque su número sea MENOR (000001). Sin esta aserción,
//    un comparador que ordenara SOLO por número pasaría ①②③④.
ok(
  todos.indexOf(TARDE.numero_orden) > todos.indexOf(C.numero_orden),
  `⑤ el FIFO manda sobre el número: el pago tardío (nº menor) va después del grupo temprano`,
);

if (fallos.length > 0) {
  console.error(`\n🔴 ROJO — ${fallos.length} fallo(s).\n`);
  process.exit(1);
}
console.log(
  `\n✅ VERDE — con marcas de tiempo iguales el orden es ÚNICO, ESTABLE y\n` +
    `   AUDITABLE por el vendedor (asciende por el número impreso en la tarjeta),\n` +
    `   y el FIFO sigue mandando sobre el desempate.\n` +
    `   El comparador viejo falla ① acá mismo: la prueba muerde.\n`,
);
