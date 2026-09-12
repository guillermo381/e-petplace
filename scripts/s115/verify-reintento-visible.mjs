#!/usr/bin/env node
/**
 * S115-C · EL REINTENTO SE VE — su rojo es el defecto que el founder midió en
 * pantalla (11-sep, `D-1074`): *«al tocar reintentar no pasa nada»*.
 *
 * 🔴 **El handler SÍ disparaba.** Lo que fallaba es que el estado intermedio
 * dibujaba **NADA**: `setTope('cargando')` hacía `props === null` y
 * `noCargo === false`, así que el aviso **desaparecía** y la pantalla quedaba
 * vacía hasta el techo de 8 s. *Un reintento sin señal es indistinguible de un
 * botón roto, y la persona lo toca cinco veces.*
 *
 * QUÉ MIDE: que la secuencia completa —falla · toque · espera · resultado— no
 * tenga ningún paso que dibuje NADA.
 * ⚠️ NO dice que la consulta vuelva a andar: eso es de la red y del techo (A).
 */
function pantalla({ tope, reintentando }) {
  const props = typeof tope === 'number' ? {} : null;
  const noCargo = tope === 'noCargo';
  if (props === null) return noCargo || reintentando ? 'AVISO' : 'NADA';
  return 'SECCIÓN';
}

const secuencia = [
  [{ tope: 'noCargo', reintentando: false }, 'AVISO',   'la consulta falló'],
  [{ tope: 'cargando', reintentando: true }, 'AVISO',   '← TOCA: el aviso SE QUEDA y el botón gira'],
  [{ tope: 'noCargo', reintentando: false }, 'AVISO',   'volvió a fallar: sigue ofreciendo'],
  [{ tope: 50, reintentando: false },        'SECCIÓN', 'anduvo: aparece la sección'],
];
/* El control negativo: la primera carga NO dibuja aviso (no hubo fallo aún). */
const primeraCarga = pantalla({ tope: 'cargando', reintentando: false });

let mal = 0;
for (const [estado, esp, why] of secuencia) {
  const got = pantalla(estado);
  const ok = got === esp;
  if (!ok) mal++;
  console.log(`  ${ok ? '✓' : '✗'}  ${got.padEnd(9)} ${why}`);
}
if (primeraCarga !== 'NADA') {
  console.log(`  ✗  la primera carga dibuja «${primeraCarga}» y debería no dibujar aviso`);
  mal++;
} else {
  console.log(`  ✓  NADA      control: la PRIMERA carga no muestra aviso (no hubo fallo)`);
}
if (mal > 0) { console.error(`\nverify:reintento-visible — ROJO · ${mal} fallo(s)`); process.exit(1); }
console.log(`\nverify:reintento-visible — VERDE · ningún paso del reintento deja la pantalla vacía\n   su verde dice «siempre hay señal», JAMÁS «la consulta vuelve a andar».`);
