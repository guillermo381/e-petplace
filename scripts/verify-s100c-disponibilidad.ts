/**
 * A-01 (S100c) · EL CARRITO FRENA LO QUE YA NO SE PUEDE COMPRAR.
 *
 * Corre: `npx tsx scripts/verify-s100c-disponibilidad.ts`
 *
 * 🔴 IMPORTA LA FUNCIÓN QUE LA PANTALLA USA. Si este archivo re-escribiera la
 * regla adentro, mediría su propio eco — probaría que sé escribir dos veces lo
 * mismo, no que el carrito frena. (Mismo patrón que
 * `verify-s100b-destinos.ts`.)
 *
 * ⚠️ LO QUE ESTE INSTRUMENTO **NO** DICE, para que nadie lea su verde de más:
 * mide una función pura. **No dice que la pantalla la llame** —eso lo dice
 * leer el montaje— ni que el aviso se vea bien, ni que el CTA se apague en un
 * teléfono. Y **no puede medir la mitad (b)**: «no alcanza para 5» no es
 * expresable con un booleano, por firma de S99.
 */

import {
  itemsBloqueados,
  precioNuevoDelItem,
  problemaDelItem,
  type ProblemaItem,
} from '../apps/cliente/src/lib/despensa/disponibilidad';
import type { EstadoOfertaCarrito } from '../packages/api/src/wrappers/despensa-pedido';

let ok = 0;
let fallo = 0;

function pruebo(nombre: string, real: unknown, esperado: unknown): void {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (bien) {
    ok += 1;
    console.log(`  ✓ ${nombre}`);
  } else {
    fallo += 1;
    console.log(`  ✗ ${nombre}\n      esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)}`);
  }
}

function estado(p: Partial<EstadoOfertaCarrito> & { oferta_id: string }): EstadoOfertaCarrito {
  return {
    disponible: true,
    motivo: null,
    precio_vigente: null,
    cuenta_comercial_id: null,
    ...p,
  };
}

const mapa = (...es: EstadoOfertaCarrito[]): Record<string, EstadoOfertaCarrito> =>
  Object.fromEntries(es.map((e) => [e.oferta_id, e]));

console.log('\nA-01 · problemaDelItem — qué le pasó al ítem');

pruebo(
  'sano ⇒ null',
  problemaDelItem(mapa(estado({ oferta_id: 'a' })), 'a'),
  null,
);
pruebo(
  'agotado ⇒ "agotado"',
  problemaDelItem(mapa(estado({ oferta_id: 'a', disponible: false, motivo: 'agotado' })), 'a'),
  'agotado' satisfies ProblemaItem,
);
pruebo(
  'despublicada ⇒ "ya_no_publicada"',
  problemaDelItem(
    mapa(estado({ oferta_id: 'a', disponible: false, motivo: 'ya_no_publicada' })),
    'a',
  ),
  'ya_no_publicada' satisfies ProblemaItem,
);
pruebo(
  'no disponible SIN motivo ⇒ cae en "ya_no_publicada", jamás en null',
  problemaDelItem(mapa(estado({ oferta_id: 'a', disponible: false, motivo: null })), 'a'),
  'ya_no_publicada' satisfies ProblemaItem,
);

console.log('\n🔴 LEY 13 · un fallo NO se disfraza de veredicto');

pruebo(
  'estados = null (no se pudo medir) ⇒ null, NO acusa',
  problemaDelItem(null, 'a'),
  null,
);
pruebo(
  'ítem que no vino en el informe ⇒ null, NO acusa',
  problemaDelItem(mapa(estado({ oferta_id: 'otro' })), 'a'),
  null,
);
pruebo(
  'sin medición NO se bloquea la compra',
  itemsBloqueados(null, [{ oferta_id: 'a' }, { oferta_id: 'b' }]),
  0,
);

console.log('\nA-01 · itemsBloqueados — lo que apaga el CTA');

pruebo(
  'carrito sano ⇒ 0',
  itemsBloqueados(mapa(estado({ oferta_id: 'a' }), estado({ oferta_id: 'b' })), [
    { oferta_id: 'a' },
    { oferta_id: 'b' },
  ]),
  0,
);
pruebo(
  'uno agotado de dos ⇒ 1',
  itemsBloqueados(
    mapa(estado({ oferta_id: 'a', disponible: false, motivo: 'agotado' }), estado({ oferta_id: 'b' })),
    [{ oferta_id: 'a' }, { oferta_id: 'b' }],
  ),
  1,
);
pruebo(
  'los dos caídos ⇒ 2',
  itemsBloqueados(
    mapa(
      estado({ oferta_id: 'a', disponible: false, motivo: 'agotado' }),
      estado({ oferta_id: 'b', disponible: false, motivo: 'ya_no_publicada' }),
    ),
    [{ oferta_id: 'a' }, { oferta_id: 'b' }],
  ),
  2,
);
pruebo('carrito vacío ⇒ 0', itemsBloqueados({}, []), 0);

console.log('\nA-01 · precioNuevoDelItem — el precio que se muestra ES el precio');

pruebo(
  'mismo precio ⇒ null (no se avisa de nada)',
  precioNuevoDelItem(mapa(estado({ oferta_id: 'a', precio_vigente: 12.3 })), {
    oferta_id: 'a',
    precio: 12.3,
  }),
  null,
);
pruebo(
  'subió ⇒ el precio de hoy',
  precioNuevoDelItem(mapa(estado({ oferta_id: 'a', precio_vigente: 14.5 })), {
    oferta_id: 'a',
    precio: 12.3,
  }),
  14.5,
);
pruebo(
  'bajó ⇒ también se dice (una baja sorpresa sigue siendo una sorpresa)',
  precioNuevoDelItem(mapa(estado({ oferta_id: 'a', precio_vigente: 9.99 })), {
    oferta_id: 'a',
    precio: 12.3,
  }),
  9.99,
);
pruebo(
  'sin precio vigente ⇒ null, jamás un "$0.00"',
  precioNuevoDelItem(mapa(estado({ oferta_id: 'a', precio_vigente: null })), {
    oferta_id: 'a',
    precio: 12.3,
  }),
  null,
);
pruebo(
  '🔴 12.30 vs 12.3 ⇒ null — el mismo precio no dispara una alerta falsa',
  precioNuevoDelItem(mapa(estado({ oferta_id: 'a', precio_vigente: 12.3 })), {
    oferta_id: 'a',
    precio: 12.30,
  }),
  null,
);
pruebo(
  '🔴 basura binaria (0.1 + 0.2 = 0.30000000000000004) ⇒ null',
  precioNuevoDelItem(mapa(estado({ oferta_id: 'a', precio_vigente: 0.1 + 0.2 })), {
    oferta_id: 'a',
    precio: 0.3,
  }),
  null,
);
pruebo(
  'un centavo de diferencia SÍ se dice',
  precioNuevoDelItem(mapa(estado({ oferta_id: 'a', precio_vigente: 12.31 })), {
    oferta_id: 'a',
    precio: 12.3,
  }),
  12.31,
);

console.log(`\n${fallo === 0 ? '✅' : '🔴'} ${ok}/${ok + fallo}\n`);
process.exit(fallo === 0 ? 0 : 1);
