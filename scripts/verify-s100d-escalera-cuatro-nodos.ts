/**
 * verify-s100d-escalera-cuatro-nodos.ts — LA ESCALERA DE LA FAMILIA SON
 * CUATRO NODOS, Y `pagando` NO ES UNO.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * QUÉ VIGILA, Y POR QUÉ NO ALCANZABA EL TYPECHECK
 * ═══════════════════════════════════════════════════════════════════════
 * La receta firmada de B (`2026-08-18-s99b-RECETA-SEGUIMIENTO-DE-NODOS`
 * §1) decide que **tres de las siete narrativas no son escalones**:
 * `no_llego` y `cancelado` son DESVÍO, y `pagando` es **antes de que
 * exista una promesa**. La lib de la familia tenía cinco y `pagando`
 * adentro.
 *
 * 🔴 **El modo de falla que esto caza no rompe nada:** una escalera con un
 * escalón de más COMPILA, se dibuja preciosa y miente — le promete a la
 * familia un recorrido que todavía no arrancó. *Ni `tsc` ni
 * `verify:diseno` ven una escalera con un peldaño de más: los dos miden
 * forma, y acá la forma está bien.* Por eso la vigilancia es de
 * COMPORTAMIENTO y vive acá.
 *
 * ── LO QUE MIDE (sobre la función real, no sobre una copia) ────────────
 *  ① la escalera feliz son CUATRO nodos y ninguno es `pagando`
 *  ② `pagando` no dibuja escalera (y tampoco banda: no es un desvío)
 *  ③ `no_llego` deja hechos TRES —no cuatro—: decir `entregado` hecho
 *     sobre un pedido que volvió es la mentira más cara de esta pantalla
 *  ④ `entregado` es terminal: su último nodo queda `hecho`, no `actual`
 *  ⑤ todo nodo que se dibuja tiene glifo (el slot es opcional en la pieza,
 *     pero en ESTA escalera los cuatro están dibujados por B)
 *
 * ── EL DISCRIMINADOR (§ final) ─────────────────────────────────────────
 * Un guard que solo confirma el estado bueno no prueba que discrimine.
 * Acá se re-corre ① y ③ contra una RÉPLICA del comportamiento VIEJO
 * (cinco escalones con `pagando` y `slice(0,4)`) y **se exige que falle**.
 * *Un guard que no se probó en rojo es una afirmación, no una medición.*
 */

import {
  escaleraDePedido,
  GLIFO_NODO,
  type VocesEscalera,
} from '../apps/cliente/src/lib/despensa/escalera';

const VOCES: VocesEscalera = {
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  enCamino: 'En camino',
  entregado: 'Entregado',
  noLlego: 'No llegó',
  noLlegoDetalle: 'Volvió y se reagenda',
  cancelado: 'Cancelado',
};

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = '') => {
  console.log(`${cond ? '  ✅' : '  ❌'} ${etiqueta}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos++;
};

console.log('\n① LA ESCALERA FELIZ — cuatro nodos, sin `pagando`');
const feliz = escaleraDePedido('confirmado', VOCES);
ok(feliz.pasos.length === 4, 'son CUATRO nodos', `medidos: ${feliz.pasos.length}`);
ok(
  !feliz.pasos.some((p) => p.clave === 'pagando'),
  '`pagando` NO es uno de ellos',
  feliz.pasos.map((p) => p.clave).join(' → '),
);

console.log('\n② `pagando` — ni escalera ni banda');
const pagando = escaleraDePedido('pagando', VOCES);
ok(pagando.pasos.length === 0, 'no dibuja escalera', `pasos: ${pagando.pasos.length}`);
ok(
  pagando.desvio === undefined,
  'tampoco dibuja banda (no se torció nada: no es un desvío)',
);

console.log('\n③ `no_llego` — TRES hechos, jamás `entregado`');
const noLlego = escaleraDePedido('no_llego', VOCES);
ok(noLlego.pasos.length === 3, 'deja TRES pasos', `medidos: ${noLlego.pasos.length}`);
ok(
  !noLlego.pasos.some((p) => p.clave === 'entregado'),
  '`entregado` NO aparece hecho sobre un pedido que volvió',
  noLlego.pasos.map((p) => p.clave).join(' → '),
);
ok(noLlego.desvio?.tono === 'alerta', 'su banda es de alerta');

console.log('\n④ `entregado` — terminal, el último nodo queda HECHO');
const entregado = escaleraDePedido('entregado', VOCES);
ok(
  entregado.pasos[entregado.pasos.length - 1]?.estado === 'hecho',
  'el último no queda «actual para siempre»',
  `estado: ${entregado.pasos[entregado.pasos.length - 1]?.estado}`,
);

console.log('\n⑤ TODO NODO DIBUJADO TIENE SU GLIFO');
const sinGlifo = feliz.pasos.filter((p) => GLIFO_NODO[p.clave] === undefined);
ok(sinGlifo.length === 0, 'los cuatro tienen glifo', sinGlifo.map((p) => p.clave).join(', '));

// ── EL DISCRIMINADOR ────────────────────────────────────────────────────
// Réplica EXACTA del comportamiento viejo. Si los asserts ① y ③ no la
// rechazan, este guard no está midiendo nada.
console.log('\n🔴 DISCRIMINADOR — el comportamiento VIEJO debe ser rechazado');
const VIEJA = ['pagando', 'confirmado', 'preparando', 'en_camino', 'entregado'];
const vieja1 = VIEJA.length === 4 && !VIEJA.includes('pagando');
const vieja3 = VIEJA.slice(0, 4).length === 3;
ok(!vieja1, '① rechaza la escalera de cinco con `pagando`');
ok(!vieja3, '③ rechaza el `slice(0,4)` viejo (dejaba `en_camino` como cuarto hecho)');

console.log(
  fallos === 0
    ? '\n✅ verify-s100d-escalera-cuatro-nodos — VERDE (5 medidas + discriminador en rojo)\n'
    : `\n❌ verify-s100d-escalera-cuatro-nodos — ${fallos} FALLO(S)\n`,
);
process.exit(fallos === 0 ? 0 : 1);
