/**
 * BotonBajarAlFinal — volver al último mensaje (S112-B, B6).
 *
 * *«Un botón de bajar al final aparece cuando estoy lejos del último.»* —
 * la letra, §2.4.
 *
 * ── 🔴 «APARECE CUANDO» ES DE LA PANTALLA, NO DE LA PIEZA ────────────────
 * La pieza **no decide si se ve**: no sabe dónde está el scroll. La regla de
 * existencia la aplica quien tiene ese dato —`SuperficieChat` la entrega en
 * `alFondo`— y la pantalla monta o no monta. *Una pieza que se auto-esconde
 * con un dato que recibe por prop es una condición escrita dos veces.*
 *
 * ── POR QUÉ NO ES UN `Boton` ─────────────────────────────────────────────
 * Es un control circular de superficie, sin etiqueta visible: un `Boton` con
 * `etiqueta` vacía sería mentirle a su propio contrato. La etiqueta viaja
 * igual **al lector de pantalla**, que es donde hace falta.
 *
 * Usa `Chevron direccion="abajo"` — el vocabulario direccional de la casa, no
 * un glifo nuevo. Sin animación de entrada (N15).
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo (C4). **Entregada y no montada.**
 */
import { Pressable } from 'react-native'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'
import { Chevron } from './chevron'

/** Target táctil de la casa. */
const LADO = 44

export type BotonBajarAlFinalProps = {
  /** accessibilityLabel — «Bajar al último mensaje». No se dibuja. */
  etiqueta: string
  onPress: () => void
}

export function BotonBajarAlFinal({ etiqueta, onPress }: BotonBajarAlFinalProps) {
  const { theme } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={{
        width: LADO,
        height: LADO,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg.card,
        borderWidth: theme.border.width,
        borderColor: theme.border.subtle,
        boxShadow: theme.elevacion.elevada,
      }}
    >
      <Chevron direccion="abajo" />
    </Pressable>
  )
}
