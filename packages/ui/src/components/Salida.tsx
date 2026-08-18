/**
 * Salida — CÓMO SE VA LO QUE SE VA (S100d-B · punto 13 del gate).
 *
 * ═══════════════════════════════════════════════════════════════════
 * **Firma del founder, y es la TERCERA vez que lo pide:** *«sigue
 * eliminando sin animación»*. Que se haya pedido tres veces no lo vuelve
 * más urgente por insistencia: lo vuelve **un síntoma de que la casa no
 * tenía la pieza**, igual que `Fundido` en S99.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LA CUARTA DE LA FAMILIA, y cada una contesta otra pregunta ────────
 *   · `Entrada`        — cómo APARECE el contenido de una pantalla.
 *   · `EntradaDeCruce` — de qué lado LLEGA la pantalla.
 *   · `Fundido`        — lo mismo que ya estaba, siendo otra cosa.
 *   · **`Salida`**     — **lo que estaba y YA NO ESTÁ.**
 *
 * ── 🔴 POR QUÉ UNA ANIMACIÓN ACÁ NO ES DECORACIÓN ────────────────────
 * Borrar sin acuse tiene un modo de falla concreto y no es estético: la
 * fila desaparece **en el mismo frame** y la lista se cierra de golpe ⇒ la
 * persona **no sabe si borró lo que quería, ni cuál desapareció**. *En un
 * carrito eso se paga dos veces: una al no entender qué pasó, y otra al
 * volver a agregar lo que creía haber perdido.*
 *
 * **Y esta pieza es la MITAD QUE FALTABA de una decisión ya firmada.**
 * `StepperCantidad` documenta que la papelera borra **sin confirmación, a
 * propósito** —*«un diálogo de ¿estás seguro? por quitar un producto del
 * carrito cobra a todos el error de unos pocos»*— y remata que **el
 * deshacer es de la pantalla**. *Un borrado sin diálogo previo necesita
 * acuse posterior; si no, lo que se quitó fue el freno y no se puso nada
 * en su lugar.*
 *
 * ── LAS DOS MITADES, Y NINGUNA ALCANZA SOLA ──────────────────────────
 * ① **la fila se apaga EN SU LUGAR** (`exiting`) — sigue ocupando su alto
 *    mientras se va, así el ojo alcanza a ver *cuál* desapareció.
 * ② **recién entonces las vecinas cierran el hueco** (`layout`) — sin esto
 *    la lista salta al terminar el fundido y ① no se lee como «se fue»: se
 *    lee como un glitch.
 * *Por eso la pieza trae las dos y el consumidor no elige: es Ley 8 — ley
 * de la pieza, ningún consumidor la re-decide.*
 *
 * ⚠️ **Y lo que esta pieza NO hace, dicho para que nadie lo lea de más: no
 * colapsa el alto durante el fundido.** La fila se apaga ocupando su lugar
 * y el hueco se cierra después, cuando desmonta. *Un colapso simultáneo
 * exigiría una animación de salida propia con `height`, y eso es una pieza
 * distinta con su propio gate — no una prop de ésta.*
 *
 * ── EL VOCABULARIO ES EL CERRADO DE N10, NO UNO NUEVO ────────────────
 * Salida en **`micro` (150)** — lo que se va no pide ser mirado; se avisa y
 * libera. Reacomodo en **`estandar` (300)**, el techo de Ley 6.
 * *La asimetría es a propósito: la fila se va rápido, la lista se acomoda
 * con calma. Al revés, la lista parecería trabarse por algo que ya no está.*
 *
 * ── ⚠️ LO QUE HAY QUE SABER PARA QUE FUNCIONE (y falla en silencio) ───
 * **La fila necesita `key` ESTABLE por ítem.** Con `key={index}` React no
 * desmonta la fila borrada: **renumera**, así que `exiting` no dispara y la
 * animación no ocurre — *sin error, sin warning, sin nada que mirar.*
 * ⇒ `key={item.id}`, jamás el índice.
 *
 * **`reduce-motion`:** las animaciones de layout de Reanimated respetan la
 * preferencia del sistema. **Sin animación la fila igual desaparece** — el
 * movimiento adorna el hecho, no lo produce (N15).
 *
 * ── LO QUE NO HACE ───────────────────────────────────────────────────
 * No borra (no conoce la lista), no confirma, **no deshace** — el deshacer
 * es de la pantalla, que es la única que sabe qué se quitó y puede
 * reponerlo. Y **no anima la entrada**: para eso está `Entrada`. *Una pieza
 * que hiciera las dos tendría que decidir cuál gana cuando pasan juntas.*
 */

import { type ReactNode } from 'react'
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated'

import { motion } from '../tokens/motion'

export interface SalidaProps {
  children: ReactNode
}

export function Salida({ children }: SalidaProps) {
  return (
    <Animated.View
      exiting={FadeOut.duration(motion.duration.micro)}
      layout={LinearTransition.duration(motion.duration.estandar)}
    >
      {children}
    </Animated.View>
  )
}
