/**
 * mismaFila — LA DECISIÓN DE REDIBUJAR UNA FILA DEL HILO (S112-B · A14).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **Vive aparte de la pieza y no es prolijidad: es lo que la vuelve
 * MEDIBLE.**
 * ═══════════════════════════════════════════════════════════════════════════
 * `SuperficieChat` importa `react-native`, así que un gate que quisiera medir
 * esta cuenta desde adentro del componente **no puede ni cargarlo**. Con la
 * decisión en su propio módulo, `verify:fila-memoizada` mide **la función
 * real y no una copia** — que es la única forma de que su verde signifique
 * algo. Mismo movimiento que `vio-todo.ts`, y por la misma razón.
 *
 * ── QUÉ DECIDE ───────────────────────────────────────────────────────────
 * Es el comparador de `React.memo` de cada fila. **Sólo el item decide:** la
 * función que dibuja llega ya estabilizada por `ref`, así que compararla
 * sería comparar una constante.
 *
 * ── 🔴 LA TERCERA PATA, y por eso este archivo la lleva escrita ──────────
 * Que una fila no se redibuje exige que **el item sea la MISMA referencia**
 * entre refrescos. Si la pantalla arma su lista con `.map(m => ({ ...m }))`
 * en cada sondeo, cada item es un objeto nuevo, esto devuelve `false` para
 * todos, y **se redibuja todo con la memoización puesta**.
 *
 * *La cura de la pieza es necesaria y no suficiente: la otra mitad vive en
 * cómo la pantalla construye su array.* Y no se puede curar desde acá — una
 * comparación profunda por contenido costaría más que el redibujado que
 * evita, y encima escondería el defecto en vez de mostrarlo.
 */

/** `true` = la fila NO se redibuja. */
export function mismaFila<T>(antes: { item: T }, ahora: { item: T }): boolean {
  return antes.item === ahora.item
}
