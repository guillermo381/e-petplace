/**
 * EventoDelHilo — LOS HECHOS DEL TRÁMITE VIVEN EN LA CONVERSACIÓN (S112-B, B4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Así el chat cuenta la historia entera y no tengo que buscar el siguiente
 * paso en otro lado.»* — la letra, §2.3.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * «El refugio aceptó tu solicitud» · «El acta está lista para firmar» · «Se
 * firmó el acta». Van **centrados y como etiqueta**, no como burbuja: *una
 * burbuja dice «alguien te escribió esto», y nadie escribió esto.*
 *
 * ── 🔴 LA CARTA DE ACCIÓN ES UN SLOT, Y ESO ES LA PIEZA ──────────────────
 * Cuando el hecho **pide algo**, debajo va su carta con su botón («Firmar el
 * acta»). Entra por slot y no por props tipadas: la acción cambia por hecho
 * —firmar, cargar la cédula, ver el acta— y una pieza que las enumere se
 * queda vieja con el primer hecho nuevo. **Lo que la pieza garantiza es el
 * LUGAR**: la carta va pegada debajo de su etiqueta y no flotando en el
 * hilo, para que se lea como *la consecuencia de ese hecho* y no como un
 * mensaje suelto.
 *
 * ── LO QUE NO LLEVA, y es deliberado ─────────────────────────────────────
 * **Ni hora ni color de estado.** La hora de un hecho del trámite no es un
 * dato que la persona necesite —el orden en el hilo ya lo dice— y teñirlo lo
 * convertiría en una alerta (N23). *Un hecho no reclama nada; su carta sí, y
 * para eso está la carta.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo de la solicitud en las dos apps (C3). **Entregada y no montada.**
 */
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { Texto } from './Texto'

export type EventoDelHiloProps = {
  /** El hecho, en voz de cada asiento. Ya redactado (Ley 3). */
  etiqueta: string
  /**
   * La carta de acción, si el hecho pide algo. Ausente = el hecho sólo
   * informa, y entonces no se dibuja ninguna superficie: *una carta vacía
   * debajo de una etiqueta promete un botón que no está.*
   */
  accion?: ReactNode
}

export function EventoDelHilo({ etiqueta, accion }: EventoDelHiloProps) {
  return (
    <View style={{ paddingVertical: spacing[3], gap: spacing[2] }}>
      <View style={{ alignItems: 'center', paddingHorizontal: spacing[6] }}>
        <Texto variante="apoyo" color="secondary">
          {etiqueta}
        </Texto>
      </View>
      {accion}
    </View>
  )
}
