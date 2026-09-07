#!/usr/bin/env node
/**
 * S112-B (A14) · LA FILA DEL HILO NO SE REDIBUJA SI SU MENSAJE NO CAMBIÓ.
 *
 * QUÉ MIDE: `mismaFila` —**el comparador real, importado, jamás una copia**—
 * que es lo que `React.memo` consulta para decidir si una fila se vuelve a
 * dibujar.
 *
 * 🔴 LO QUE **NO** MIDE, y hay que decirlo porque cambia qué significa su
 * verde (`L-459`):
 *  ① **NO es el número del perfilador.** Ese número se saca en el aparato,
 *     con el hilo montado, y es del gate de C (§2.7). Acá se mide la DECISIÓN
 *     que lo produce, no el efecto.
 *  ② **NO ve la tercera pata**, que vive en la pantalla: si la lista se
 *     reconstruye con objetos nuevos en cada refresco, este comparador
 *     devuelve `false` para todos y se redibuja todo **con la memoización
 *     puesta**. *La cura de la pieza es necesaria y no suficiente.*
 *  ③ **NO ve la identidad de `renderItem`.** Que sea estable es estructural
 *     (`useCallback` con deps vacías sobre una `ref`), y un typecheck no lo
 *     mira. Se sostiene por lectura del archivo, no por este gate.
 *
 * Salidas: 0 verde · 1 un caso falló · 2 la auto-prueba falló.
 */
import { mismaFila } from '../packages/ui/src/components/misma-fila.ts';
import { mismoCaso } from '../packages/ui/src/components/mismo-caso.ts';

// ══ AUTO-PRUEBA — y acá NO puede ser sobre el COMPORTAMIENTO ══════════════
//
// 🔴 **Una función de UNA LÍNEA no tiene una auto-prueba independiente de sí
// misma.** La primera versión de este gate afirmaba que `mismaFila`
// distinguía dos objetos — que es EXACTAMENTE el caso ②— y al romper el
// comparador a propósito **salió por exit 2 («no pude medir») en vez de exit
// 1 («el caso ① falló»)**: dijo la verdad y dijo mal cuál. *Es la segunda vez
// en esta sesión que el mismo autor se lo cobra* (`verify:vio-todo` fue la
// primera), y la lección se afina: **cuando el sujeto es una sola cuenta, lo
// único independiente que queda es si se pudo ALCANZAR.**
//
// ⇒ la auto-prueba pregunta lo único que no está en discusión: **¿existe la
// función?** Si el módulo no cargó o cambió de nombre, eso es «no pude
// medir»; que la cuenta esté mal es un rojo de las cuentas, y sale por su
// puerta.
if (typeof mismaFila !== 'function') {
  console.error('✗ verify:fila-memoizada — NO PUDE MEDIR: `mismaFila` no es una función.');
  console.error('  (el módulo no cargó, o el export cambió de nombre)');
  process.exit(2);
}
/* S114-B · El comparador de la BANDEJA DE CASOS entra al mismo gate y no a uno
   nuevo: es la misma pregunta —¿esta fila se redibuja?— sobre otra lista. Un
   gate por comparador sería el clon que la casa caza. */
if (typeof mismoCaso !== 'function') {
  console.error('✗ verify:fila-memoizada — NO PUDE MEDIR: `mismoCaso` no es una función.');
  console.error('  (el módulo no cargó, o el export cambió de nombre)');
  process.exit(2);
}

const m1 = { id: 'm1', texto: 'hola' };
const m2 = { id: 'm2', texto: 'chau' };

const casos = [
  {
    n: '① EL QUE IMPORTA · refresco sin mensajes nuevos: MISMA referencia',
    da: mismaFila({ item: m1 }, { item: m1 }),
    esperado: true,
    porque: 'si esto es false, cada sondeo redibuja el hilo entero',
  },
  {
    n: '② llegó otro mensaje: la fila de ESE cambia',
    da: mismaFila({ item: m1 }, { item: m2 }),
    esperado: false,
    porque: 'una fila que no se entera de su propio cambio muestra datos viejos',
  },
  {
    n: '③ 🔴 LA TERCERA PATA · mismo contenido, objeto NUEVO',
    da: mismaFila({ item: m1 }, { item: { ...m1 } }),
    esperado: false,
    porque:
      'ES CORRECTO que dé false: la pieza no puede saber que son «iguales». ' +
      'Quien reconstruye la lista en cada refresco paga el redibujado entero ' +
      'aunque la memoización esté puesta — la otra mitad vive en la pantalla',
  },
];

/* ══ S114-B · `mismoCaso` — LA BANDEJA DE CASOS ═══════════════════════════
   🔴 **COMPARA DOS COSAS Y NO UNA, y por eso sus casos no son los de arriba:**
   la bandeja entrega un `onPress` POR FILA (navega a ese caso), así que un
   comparador que mirara sólo el item **dejaría la fila llamando a la función
   de ayer** — el caso ④, que es el que justifica el segundo término. */
const c1 = { clave: 'c1', motivo: 'llegó tarde' };
const c2 = { clave: 'c2', motivo: 'no vino' };
const irA1 = () => {};
const irA2 = () => {};

casos.push(
  {
    n: '① (caso) refresco sin novedades: MISMA referencia y MISMO callback',
    da: mismoCaso({ caso: c1, onPress: irA1 }, { caso: c1, onPress: irA1 }),
    esperado: true,
    porque: 'si esto es false, cada sondeo de la bandeja redibuja todas las filas',
  },
  {
    n: '② (caso) el caso cambió: su fila se redibuja',
    da: mismoCaso({ caso: c1, onPress: irA1 }, { caso: c2, onPress: irA1 }),
    esperado: false,
    porque: 'una fila que no se entera de su propio cambio muestra datos viejos',
  },
  {
    n: '③ 🔴 (caso) LA TERCERA PATA · mismo contenido, objeto NUEVO',
    da: mismoCaso({ caso: c1, onPress: irA1 }, { caso: { ...c1 }, onPress: irA1 }),
    esperado: false,
    porque:
      'ES CORRECTO que dé false: la pieza no puede saber que son «iguales». ' +
      'Quien reconstruye la lista en cada refresco paga el redibujado entero',
  },
  {
    n: '④ 🔴 (caso) EL QUE JUSTIFICA EL SEGUNDO TÉRMINO · mismo caso, OTRO destino',
    da: mismoCaso({ caso: c1, onPress: irA1 }, { caso: c1, onPress: irA2 }),
    esperado: false,
    porque:
      'si esto diera true, la fila se quedaría con el callback viejo y llevaría ' +
      'al caso equivocado. Un comparador que ignora un callback que cambia no es ' +
      'una optimización: es una fila que llama a la función de ayer',
  },
);

let fallos = 0;
console.log('── verify:fila-memoizada · el comparador REAL, importado');
for (const c of casos) {
  const ok = c.da === c.esperado;
  if (!ok) fallos++;
  console.log(`   ${ok ? '·' : '✗'} ${c.n} → ${c.da} (esperado ${c.esperado})`);
  if (!ok) console.log(`     ${c.porque}`);
}

if (fallos > 0) {
  console.error(`\n✗ verify:fila-memoizada — ${fallos} caso(s) en rojo.`);
  process.exit(1);
}
console.log('\n✓ verify:fila-memoizada VERDE — y su verde NO es el del perfilador: ver la cabecera.');
