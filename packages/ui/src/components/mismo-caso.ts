/**
 * mismoCaso — LA DECISIÓN DE REDIBUJAR UNA FILA DE LA BANDEJA (S114-B · B6).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **Vive aparte de la pieza por la misma razón que `mismaFila`: para que se
 * pueda MEDIR.**
 * ═══════════════════════════════════════════════════════════════════════════
 * `FilaBandejaCaso` importa `react-native`, así que un gate que quisiera medir
 * esta cuenta desde adentro del componente **no puede ni cargarlo**. Con la
 * decisión en su propio módulo, el gate mide **la función real y no una
 * copia** — que es la única forma de que su verde signifique algo. Mismo
 * movimiento que `misma-fila.ts` y que `vio-todo.ts`.
 *
 * ── QUÉ DECIDE, Y POR QUÉ COMPARA DOS COSAS Y NO UNA ────────────────────
 * `mismaFila` compara sólo el item porque su `renderItem` llega estabilizado
 * por `ref`. **Acá no puedo asumir eso**: la bandeja del prestador entrega un
 * `onPress` por fila (navega al caso), y si la pantalla lo arma con una
 * flecha nueva en cada render, comparar sólo el caso haría que la fila **no
 * se redibujara nunca aunque su callback apuntara a otro lado**.
 *
 * *Un comparador que ignora un callback que cambia no es una optimización:
 * es una fila que llama a la función de ayer.*
 *
 * ── 🔴 LA TERCERA PATA, y este archivo la lleva escrita ─────────────────
 * Que una fila no se redibuje exige que **el caso sea la MISMA referencia**
 * entre refrescos. Si la pantalla arma su lista con `.map(c => ({ ...c }))`
 * en cada sondeo, cada item es un objeto nuevo, esto devuelve `false` para
 * todos, y **se redibuja todo con la memoización puesta**.
 *
 * *La cura de la pieza es necesaria y no suficiente: la otra mitad vive en
 * cómo la pantalla construye su array.* Y no se puede curar desde acá — una
 * comparación profunda por contenido costaría más que el redibujado que
 * evita, y encima escondería el defecto en vez de mostrarlo.
 */

/** `true` = la fila NO se redibuja. */
export function mismoCaso<T>(
  antes: { caso: T; onPress: () => void },
  ahora: { caso: T; onPress: () => void },
): boolean {
  return antes.caso === ahora.caso && antes.onPress === ahora.onPress
}
