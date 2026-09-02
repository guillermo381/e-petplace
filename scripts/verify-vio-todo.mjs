#!/usr/bin/env node
/**
 * S112-B (B3) · «VI TODO» ES UN PREDICADO, NO UN EVENTO.
 *
 * QUÉ MIDE: `pudoVerTodo` —**la función real, importada, jamás
 * reimplementada**— contra los cinco casos que decide, con el que rompe a la
 * cabeza: **un documento que entra sin scroll tiene que dar VERDADERO con
 * desplazamiento 0.**
 *
 * POR QUÉ EXISTE: el defecto que vigila no produce error, ni log, ni
 * excepción — deja el botón «Acepto y continúo» apagado para siempre y la
 * pantalla muerta. Y es dependiente del aparato: las condiciones de adopción
 * son 1 711 caracteres, el tamaño que entra sin scroll en un teléfono grande
 * y no entra en uno chico, así que *el mismo documento rompe en un aparato y
 * no en el otro.* Un typecheck no lo ve: la versión rota compila perfecto.
 *
 * 🔴 LO QUE **NO** VE, para que su verde no se lea de más (`L-459`):
 *  ① NO mira la pieza. Mide la CUENTA. Si mañana `DocumentoLegalLectura`
 *     dejara de llamar a `pudoVerTodo` y volviera a un `onScroll` a mano,
 *     este gate seguiría verde. Lo que lo cubre es que la función viva en su
 *     propio módulo y la pieza no tenga aritmética adentro.
 *  ② NO prueba que la persona LEYÓ, y la función tampoco lo afirma: prueba
 *     que el documento PUDO verse entero.
 *
 * No necesita red ni DB. Corre en ~1 s con tsx.
 *
 * Salidas: 0 verde · 1 un caso falló · 2 la auto-prueba falló (no pude medir).
 */
import { pudoVerTodo, TOLERANCIA_VIO_TODO } from '../packages/ui/src/components/vio-todo.ts';

// ══ AUTO-PRUEBA — «no pude medir» NO es «todo bien» ═════════════════════════
// Si el instrumento no distingue su propio rojo de su verde, no certifica
// nada.
//
// 🔴 **SUS DOS CASOS SON A PROPÓSITO LOS QUE NO ESTÁN EN DISCUSIÓN**, y ésa
// es la enmienda que este gate se cobró a sí mismo antes de entregarse. La
// primera versión afirmaba `pudoVerTodo(800, 800, 0) === true` — que es
// EXACTAMENTE el caso ①, el que rompe. ⇒ al romper la función a propósito,
// **el gate salió por exit 2 («no pude medir») en vez de por exit 1 («el
// caso ① falló»)**: dijo la verdad y dijo mal cuál. *Una auto-prueba que
// comparte el supuesto con lo que mide no verifica el instrumento: lo
// duplica* (`L-459`, su forma literal).
//
// Los de ahora son un documento largo scrolleado hasta el fondo y el mismo
// sin scrollear: **cualquier implementación sensata —incluida la rota por
// evento— los contesta bien**, así que un rojo de acá es del instrumento y
// un rojo de allá abajo es de la cuenta.
{
  const distingue =
    pudoVerTodo(800, 4000, 3200) === true &&  // largo, hasta el fondo → sí
    pudoVerTodo(800, 4000, 0) === false;      // largo, sin scrollear  → no
  if (!distingue) {
    console.error('✗ verify:vio-todo — LA AUTO-PRUEBA FALLÓ. No puedo medir, así que');
    console.error('  no cuento ningún verde.');
    process.exit(2);
  }
}

const casos = [
  {
    n: '① EL QUE ROMPE · texto corto, entra sin scroll, nadie tocó nada',
    da: pudoVerTodo(800, 480, 0),
    esperado: true,
    porque: 'un `onScroll` nunca va a llegar: si esto es falso, el botón no enciende jamás',
  },
  {
    n: '② entra JUSTO, al píxel',
    da: pudoVerTodo(800, 800, 0),
    esperado: true,
    porque: 'no falta nada por ver',
  },
  {
    n: '③ texto largo sin scrollear',
    da: pudoVerTodo(800, 4000, 0),
    esperado: false,
    porque: 'faltan 3 200 px: dar verdadero acá sería dar por visto lo que nadie vio',
  },
  {
    n: '④ texto largo, scrolleado hasta el fondo',
    da: pudoVerTodo(800, 4000, 3200),
    esperado: true,
    porque: 'llegó al final por el camino de siempre',
  },
  {
    n: '⑤ a medio píxel del fondo — la tolerancia',
    da: pudoVerTodo(800, 4000, 3199.5),
    esperado: true,
    porque: `el layout no cierra exacto; ${TOLERANCIA_VIO_TODO} px es menos de media línea`,
  },
  {
    n: '⑥ todavía no se midió nada (primer frame)',
    da: pudoVerTodo(0, 0, 0),
    esperado: false,
    porque: 'de los dos errores posibles, jamás el que da por visto lo no medido',
  },
];

let fallos = 0;
console.log('── verify:vio-todo · la función REAL, importada');
for (const c of casos) {
  const ok = c.da === c.esperado;
  if (!ok) fallos++;
  console.log(`   ${ok ? '·' : '✗'} ${c.n} → ${c.da} (esperado ${c.esperado})`);
  if (!ok) console.log(`     ${c.porque}`);
}

if (fallos > 0) {
  console.error(`\n✗ verify:vio-todo — ${fallos} caso(s) en rojo.`);
  process.exit(1);
}
console.log('\n✓ verify:vio-todo VERDE — los 6 casos, incluido el que entra sin scroll.');
