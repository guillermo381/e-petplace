/**
 * SeparadorDia — «Hoy» · «Ayer» · «12 sep» (S112-B, B4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * La fecha llega **YA REDACTADA**. La pieza no sabe qué día es hoy.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Y no es pereza: «Hoy» y «Ayer» dependen de la zona horaria del que lee y
 * del idioma, y el riel de fechas de la casa ya lo resuelve. *Una pieza que
 * calcula «ayer» con la hora del dispositivo le va a decir «ayer» a un
 * mensaje de hoy en cuanto alguien cruce la medianoche viajando.*
 *
 * ── FORMA ────────────────────────────────────────────────────────────────
 * Etiqueta centrada, `apoyo` en `secondary`: es una marca de orientación, no
 * contenido. **Sin línea a los costados**: en una lista de burbujas la línea
 * agrega un tercer trazo horizontal donde ya compiten dos, y el aire solo
 * separa igual (N21 — *quitá antes que agregar*).
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo de la solicitud en las dos apps (C3). **Entregada y no montada.**
 */
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { Texto } from './Texto'

export type SeparadorDiaProps = {
  /** «Hoy» · «Ayer» · «12 sep». Ya redactada por el riel (Ley 3). */
  etiqueta: string
}

export function SeparadorDia({ etiqueta }: SeparadorDiaProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing[3] }}>
      <Texto variante="apoyo" color="secondary">
        {etiqueta}
      </Texto>
    </View>
  )
}
