/**
 * cruce — LA DIRECCIÓN DEL CRUCE, DERIVADA DEL GESTO (S99-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * LA LEY QUE MECANIZA, depositada por la mesa tras DOS pérdidas en una
 * sola sesión:
 *
 *   > **LA DIRECCIÓN DEL MOVIMIENTO SE DERIVA DEL GESTO, NO DE LA PILA.
 *   > Si depende del mecanismo de navegación, se pierde cada vez que el
 *   > mecanismo cambia.**
 *
 * **Las dos pérdidas, para que se entienda que no es teoría:** primero
 * un `navigate` con params que NO era un POP, y después D curó el
 * encierro de `/pedidos` moviéndola adentro del navegador de tabs — con
 * lo cual cruzar dejó de ser push/pop **y la vuelta se quedó sin sobre
 * qué apoyarse**. *Dos sustratos distintos, la misma pérdida, y en
 * ninguno de los dos casos el defecto estaba en la animación.*
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── DÓNDE VIVE EL GESTO, y por qué acá se acaba el problema ─────────
 * **`PuertaHermana` YA SABE hacia dónde apunta** (`direccion`): es su
 * prop madre, de la que derivan el chevron, el orden y el contador. Y la
 * puerta es **lo único que el dedo toca** para cruzar.
 *
 * ⇒ **La dirección la escribe la puerta al ser tocada, no la deduce la
 * pantalla que llega.** La pantalla que llega no puede saberlo —depende
 * del sustrato— y la puerta no puede NO saberlo: es su razón de existir.
 *
 * **Y es automático, no un contrato de buena fe:** lo llama la pieza en
 * su `onPress`, antes de entregar el control al consumidor. *Si la
 * escritura dependiera de que cada pantalla se acuerde, la tercera vez
 * que alguien monte una puerta la dirección se pierde de nuevo — que es
 * exactamente lo que ya pasó dos veces.*
 *
 * ── POR QUÉ MÓDULO Y NO CONTEXTO ───────────────────────────────────
 * Un contexto exigiría un provider envolviendo a las dos ventanas, y
 * **las dos ventanas son justamente lo que el sustrato mueve de lugar**
 * — hoy tabs, ayer stack. Un módulo no depende del árbol: sobrevive a la
 * próxima mudanza, que es el requisito que la ley pone.
 *
 * ── LO QUE NO HACE, declarado ──────────────────────────────────────
 * **No anima nada.** Dice de qué lado viene el que llega; la animación
 * la monta la pantalla con el vocabulario de N10 (mismo número, signo
 * invertido — la simetría exacta que la receta anterior ya fijó y que
 * sigue siendo la letra). *Esta pieza no cambia la receta: le devuelve
 * el dato que el sustrato le sacó.*
 */

/** De qué lado viene quien llega. `null` = no vino por una puerta
 *  hermana (arranque, deep link, back del sistema) ⇒ **entra sin
 *  dirección, y eso es correcto**: no hubo gesto que la produjera. */
export type DireccionCruce = 'derecha' | 'izquierda' | null

let ultimoCruce: DireccionCruce = null

/** Lo llama `PuertaHermana` al ser tocada. No lo llama una pantalla:
 *  una pantalla no tiene gesto, tiene consecuencia. */
export function registrarCruce(direccion: Exclude<DireccionCruce, null>) {
  ultimoCruce = direccion
}

/** Lo llama la ventana que LLEGA, una vez, para elegir de qué lado
 *  entra. **Consume**: la dirección vale para ESTE cruce y nada más.
 *
 *  *Si no consumiera, una pantalla montada dos veces por otra razón
 *  —un refresh, un cambio de día— se animaría como si alguien hubiera
 *  cruzado. Un dato de gesto que sobrevive a su gesto empieza a mentir.* */
export function tomarCruce(): DireccionCruce {
  const d = ultimoCruce
  ultimoCruce = null
  return d
}
