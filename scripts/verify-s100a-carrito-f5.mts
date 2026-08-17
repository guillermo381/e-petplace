/**
 * S100-A · F5 EN EL CARRITO — la consolidación por variante y la división por vendedor.
 *
 *   pnpm tsx scripts/verify-s100a-carrito-f5.mts
 *
 * Firma que verifica (founder, 17-ago-2026): *«un carrito, N pedidos
 * independientes en v1; la división se declara antes de pagar y se explica
 * después»*, y la regla que la mesa derivó de ella: **la misma variante nunca
 * se parte entre vendedores dentro de un carrito.**
 *
 * ── POR QUÉ NO TOCA LA RED ──────────────────────────────────────────────────
 * Las dos piezas son PURAS sobre el estado del carrito. Darle una sesión haría
 * el instrumento más lento y más frágil **sin medir nada más**: el defecto que
 * persigue es de lógica, no de permisos.
 *
 * ── EL BRAZO QUE HACE QUE ESTO PRUEBE ALGO ──────────────────────────────────
 * En ③ no alcanza con «quedó una fila»: se afirma **cuál vendedor sobrevivió**.
 * Un carrito que consolidara en el ÚLTIMO también dejaría una fila y pasaría un
 * assert de cardinalidad — y sería el defecto opuesto: el carrito cambiando de
 * vendedor por la espalda.
 */
import {
  agregarAlCarrito,
  agruparPorVendedor,
  itemsDelCarrito,
  unidadesEnCarrito,
  vaciarCarrito,
  type ItemCarrito,
} from '../apps/cliente/src/lib/despensa/carrito';

let fallos = 0;
const check = (cond: boolean, nombre: string) => {
  console.log(`${cond ? '  ✓' : '  ✗ FALLA'} ${nombre}`);
  if (!cond) fallos++;
};

type Semilla = Omit<ItemCarrito, 'cantidad' | 'destino' | 'advertenciaEntendida'>;

const base = (over: Partial<Semilla> = {}): Semilla => ({
  oferta_id: 'of-1',
  producto_id: 'prod-1',
  variante_id: 'var-1',
  nombre: 'Alimento 15 kg',
  marca: 'ACME',
  presentacion: '15 kg',
  precio: 70.9,
  moneda: 'USD',
  foto_url: null,
  especies_aplicables: ['perro'],
  alergenos: [],
  cuentaComercialId: 'vend-A',
  country_code: 'EC',
  ...over,
});

console.log('\n══ S100-A · F5 en el carrito ══\n');

// ── ① fila nueva ────────────────────────────────────────────────────────────
vaciarCarrito();
check(agregarAlCarrito(base(), 2).tipo === 'agregado', '① producto nuevo → «agregado»');

// ── ② misma oferta: suma, no duplica ────────────────────────────────────────
check(agregarAlCarrito(base(), 3).tipo === 'sumado', '② misma oferta → «sumado»');
check(itemsDelCarrito().length === 1, '② sigue habiendo UNA fila');
check(itemsDelCarrito()[0].cantidad === 5, '② la cantidad se sumó (2 + 3 = 5)');

// ── ③ 🔴 misma VARIANTE, otro vendedor: consolida en la que ya estaba ───────
const r3 = agregarAlCarrito(
  base({ oferta_id: 'of-2', cuentaComercialId: 'vend-B', precio: 75.86 }),
  1,
);
check(r3.tipo === 'consolidado', '③ misma variante de otro vendedor → «consolidado»');
check(
  r3.tipo === 'consolidado' && r3.vendedorConservado === 'vend-A',
  '③ 🔑 GANA EL QUE YA ESTABA — el carrito no cambia de vendedor por la espalda',
);
check(
  r3.tipo === 'consolidado' && r3.vendedorDescartado === 'vend-B',
  '③ y DICE cuál se descartó, para que la pantalla pueda hablar',
);
check(
  agruparPorVendedor(itemsDelCarrito()).length === 1,
  '③ NO se partió en dos vendedores (sin la regla habría 2 filas y 2 pedidos)',
);
check(itemsDelCarrito()[0].cantidad === 6, '③ la cantidad se consolidó (5 + 1 = 6)');

// ── ④ tres VARIANTES de dos vendedores → dos grupos, en orden de aparición ──
vaciarCarrito();
agregarAlCarrito(base({ oferta_id: 'a', variante_id: 'v1', cuentaComercialId: 'vend-A' }), 1);
agregarAlCarrito(base({ oferta_id: 'b', variante_id: 'v2', cuentaComercialId: 'vend-B' }), 1);
agregarAlCarrito(base({ oferta_id: 'c', variante_id: 'v3', cuentaComercialId: 'vend-A' }), 1);
{
  const grupos = agruparPorVendedor(itemsDelCarrito());
  check(grupos.length === 2, '④ dos vendedores → DOS pedidos');
  check(
    grupos[0].cuentaComercialId === 'vend-A' && grupos[1].cuentaComercialId === 'vend-B',
    '④ el orden es el de APARICIÓN, no alfabético ni por monto',
  );
  check(
    grupos[0].items.length === 2 && grupos[1].items.length === 1,
    '④ cada pedido se lleva SUS ítems (A:2 · B:1)',
  );
  check(unidadesEnCarrito(itemsDelCarrito()) === 3, '④ el total de unidades no cambia al agrupar');
}

// ── ⑤ carrito vacío ─────────────────────────────────────────────────────────
vaciarCarrito();
check(agruparPorVendedor(itemsDelCarrito()).length === 0, '⑤ carrito vacío → cero pedidos');

console.log(`\n${fallos === 0 ? '✅ VERDE' : `🔴 ${fallos} FALLA(S)`}\n`);
process.exit(fallos === 0 ? 0 : 1);
