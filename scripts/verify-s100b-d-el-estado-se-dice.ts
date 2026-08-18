/**
 * S100b-D · EL GUARD DEL ESTADO DICHO — ningún pedido queda mudo, y ninguno
 * promete una entrega que todavía no compró.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 QUÉ VIGILA Y POR QUÉ NINGÚN OTRO INSTRUMENTO LO VE.
 *
 * El gate del founder devolvió *«cuatro de seis pedidos no dicen en qué
 * estado están»*. La causa, medida contra la base: la fila de un pedido
 * `pagando` **no dibuja escalera** —decisión de S100 y sigue siendo la
 * correcta— y el brazo que debía hablar en su lugar estaba **detrás del de
 * la promesa**. Y la promesa **nace con el pedido, ANTES del pago**:
 *
 *   censo (17-ago-2026, `v_pedidos_narrativa`):
 *     pagando = 4 · con promesa = 4 · con pago confirmado = 0
 *
 * ⇒ la rama de seguridad era **inalcanzable por construcción**, y el pedido
 * no solo quedaba mudo: **prometía una ventana de entrega sin tener el
 * pago.** *Un comentario que describe una rama que el dato vuelve
 * inalcanzable es peor que no tener la rama: dice que el caso está cubierto.*
 *
 * **Ni `tsc` ni `verify:diseno` ven esto.** Los cuatro `if` compilaban, las
 * cuatro voces existían y el espejo es↔en estaba entero: el defecto era el
 * ORDEN de las ramas, que no tiene forma. Por eso hace falta un guard que
 * ejecute la función.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── LOS TRES BRAZOS ────────────────────────────────────────────────────
 *  R1 · **Ninguna narrativa queda muda.** Para las SIETE, si la escalera no
 *       dibuja (`escaleraMuda`) el portador tiene que ser `estado`.
 *  R2 · **Nadie promete sin recorrido.** Si la escalera no dibuja, el
 *       portador jamás puede ser `promesa` — *aunque el pedido tenga
 *       promesa guardada, que es el caso real y el que rompía.*
 *  R3 · **El desvío calla la línea.** Con `no_llego`/`cancelado` el portador
 *       es `nada`: la banda ya lo dice y repetirlo sería decirlo dos veces.
 *
 * ── EL DISCRIMINADOR ───────────────────────────────────────────────────
 * Los tres brazos se re-corren contra una **réplica del orden viejo** y se
 * exige que FALLEN. *Un guard que no falla contra el comportamiento que vino
 * a prohibir no está midiendo nada* — y acá es especialmente barato
 * equivocarse, porque con `tienePromesa: false` el orden viejo y el nuevo
 * dan lo mismo: el discriminador solo discrimina con el dato REAL.
 *
 * Se corre con: pnpm tsx scripts/verify-s100b-d-el-estado-se-dice.ts
 */
import {
  escaleraDePedido,
  escaleraMuda,
  portadorDeEstado,
  type PortadorDeEstado,
  type VocesEscalera,
} from '../apps/cliente/src/lib/despensa/escalera';
import type { NarrativaPedido } from '@epetplace/api';

/** LAS SIETE, tecleadas a propósito: si el catálogo gana una octava, este
 *  guard NO se entera solo — y eso es correcto acá, porque una narrativa
 *  nueva es una decisión de producto que alguien tiene que tomar mirando
 *  esta lista. (El guard que vigila el catálogo vivo es
 *  `verify-escalera-pedido.mjs`, y es de A: mide otra cosa.) */
const NARRATIVAS: NarrativaPedido[] = [
  'pagando',
  'confirmado',
  'preparando',
  'en_camino',
  'entregado',
  'no_llego',
  'cancelado',
];

const VOCES: VocesEscalera = {
  confirmado: 'c',
  preparando: 'p',
  enCamino: 'e',
  entregado: 'g',
  noLlego: 'n',
  noLlegoDetalle: 'nd',
  cancelado: 'x',
};

/** 🔴 EL COMPORTAMIENTO VIEJO, REPRODUCIDO — el orden exacto que tenía
 *  `detalleDe` antes de la cura. Existe SOLO para el discriminador. */
function portadorViejo(p: {
  narrativa: NarrativaPedido;
  metodoEntrega: string | null;
  tienePromesa: boolean;
}): PortadorDeEstado {
  const e = escaleraDePedido(p.narrativa, VOCES);
  if (e.desvio !== undefined) return 'nada';
  if (p.metodoEntrega === 'retiro') return 'retiro';
  if (p.tienePromesa) return 'promesa';
  return e.pasos.length > 0 ? 'nada' : 'estado';
}

type Portador = (p: {
  narrativa: NarrativaPedido;
  metodoEntrega: string | null;
  tienePromesa: boolean;
}) => PortadorDeEstado;

/** Corre los tres brazos sobre un portador. Devuelve las fallas.
 *  **Se prueba con `tienePromesa` en los DOS valores**: con `false` el orden
 *  viejo y el nuevo coinciden, así que probar solo ese caso daría verde
 *  sobre el defecto — es el modo de falla que este guard existe para no
 *  tener. */
function correr(portador: Portador): string[] {
  const fallas: string[] = [];
  for (const narrativa of NARRATIVAS) {
    const escalera = escaleraDePedido(narrativa, VOCES);
    const muda = escaleraMuda(escalera);
    for (const tienePromesa of [true, false]) {
      for (const metodoEntrega of ['envio', 'retiro', null]) {
        const r = portador({ narrativa, metodoEntrega, tienePromesa });
        const caso = `${narrativa} · promesa=${tienePromesa} · ${metodoEntrega}`;

        // R1 — sin escalera, la línea es el ÚNICO portador del estado.
        if (muda && r !== 'estado') {
          fallas.push(`R1 · ${caso}: la escalera no dibuja y el portador es '${r}' (esperado 'estado')`);
        }
        // R2 — sin recorrido no se promete. Es R1 mirado desde el daño.
        if (muda && r === 'promesa') {
          fallas.push(`R2 · ${caso}: promete una entrega y el pedido no tiene recorrido`);
        }
        // R3 — el desvío calla la línea.
        if (escalera.desvio !== undefined && r !== 'nada') {
          fallas.push(`R3 · ${caso}: hay desvío y la línea igual dice '${r}' (esperado 'nada')`);
        }
      }
    }
  }
  return fallas;
}

const fallas = correr(portadorDeEstado);
const fallasViejo = correr(portadorViejo);

for (const f of fallas) console.error(`  ✗ ${f}`);

if (fallasViejo.length === 0) {
  console.error(
    '\n🔴 DISCRIMINADOR EN CERO: el orden viejo pasa los tres brazos.\n' +
      '   El guard no está midiendo lo que vino a prohibir — se arregla el\n' +
      '   GUARD, jamás se baja la exigencia.',
  );
  process.exit(1);
}

if (fallas.length > 0) {
  console.error(`\n🔴 ${fallas.length} fallas. Un pedido queda mudo o promete sin recorrido.`);
  process.exit(1);
}

console.log(
  `✅ VERDE · ${NARRATIVAS.length} narrativas × promesa × método = ${NARRATIVAS.length * 6} casos, 3 brazos.\n` +
    `   Discriminador: el orden viejo produce ${fallasViejo.length} fallas ⇒ el guard discrimina.`,
);
