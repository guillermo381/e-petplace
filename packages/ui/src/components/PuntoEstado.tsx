/**
 * EL PUNTO DE ESTADO — 8 px, y **dos formas, no una** (S113-B · 1.0 · adenda).
 *
 * ── 🔴 POR QUÉ EL RELLENO ES UNA DIMENSIÓN Y NO UN ADORNO ──────────────
 * Dos estados del plan comparten tinta a propósito —`sinRegistro` y «todavía
 * no le toca» **no son un problema, son una ausencia**, y pintar cualquiera de
 * los dos de rojo diría que alguien hizo algo mal—. Pero **no son la misma
 * ausencia**: en uno hay un hueco del carnet que quizá haya que llenar; en el
 * otro no hay nada que hacer y no lo habrá hasta que el animal cumpla la edad.
 *
 * Si el color fuera lo único que los separa, serían el mismo punto. Por eso el
 * relleno: **el peso de la marca sigue a cuánto te pide.** Lo que todavía no
 * empezó es apenas un contorno; lo que espera algo de vos se dibuja presente.
 *
 * ── 🔴 LA TINTA DE LAS AUSENCIAS ES `secondary`, Y SALIÓ DE MEDIRLA ────
 * ⏪ Nació en `text.tertiary`, la tinta de placeholder. **Medido sobre
 * `bg.card`: 2,40:1 en claro** contra vecinos de 5,86–6,33 (los tres del
 * semáforo) — *menos de la mitad del contraste de cualquier otro punto de la
 * misma columna, y por debajo del piso gráfico de 3:1.* Con un aro de 1,5 px
 * encima, la distinción que este punto existe para mostrar **no se podía ver**.
 * `secondary` mide **5,50 · 7,42 · 6,15** en los tres temas: legible, y aun
 * así **el punto más callado de la columna** —queda por debajo del peligro,
 * 5,86—. *Legible no es ruidoso: lo que grita es el color, y éste sigue en
 * tinta.*
 *
 * ⚠️ **La forma acompaña; la palabra informa.** Las dos piezas que montan este
 * punto ponen `vozEstado` al lado, y el lector de pantalla lee esa voz — *un
 * hueco de 8 px no se anuncia, y quien no distingue formas ni colores tiene
 * que poder leer el carnet igual.* Por eso es `aria-hidden` de hecho: no lleva
 * rol ni etiqueta.
 */

import { View } from 'react-native'

import { radius } from '../tokens/radius'

export interface PuntoEstadoProps {
  color: string
  /** Contorno en vez de disco. Lo decide `marcaDeEstado`, jamás la pantalla. */
  hueco: boolean
}

export function PuntoEstado({ color, hueco }: PuntoEstadoProps) {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: radius.full,
        /* 1.5 y no 1: sobre 8 px, un pelo más de trazo es la diferencia entre
           un aro y una mancha con un punto claro adentro. */
        borderWidth: hueco ? 1.5 : 0,
        borderColor: color,
        backgroundColor: hueco ? 'transparent' : color,
      }}
    />
  )
}
