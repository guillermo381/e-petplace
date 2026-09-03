/**
 * PastillaNuevoMensaje — «1 mensaje nuevo», sin arrastrar a nadie (S112-B, B6).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Si estoy leyendo arriba y llega uno, NO ME ARRASTRAN.»* — la letra, §2.4.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ésa es la pieza entera: existe **para no hacer scroll automático**. Saltar
 * al último mensaje mientras alguien lee más arriba le saca de los ojos lo
 * que estaba leyendo, y en una conversación de adopción eso puede ser la
 * respuesta que estaba entendiendo.
 *
 * ── EL TEXTO LO TRAE LA PANTALLA, Y EL PLURAL TAMBIÉN ────────────────────
 * «1 mensaje nuevo» / «3 mensajes nuevos» es una decisión de idioma, no de
 * conteo: hay idiomas con más de dos formas. *La pieza que pluraliza a mano
 * con un `n === 1` es la que se rompe en el segundo idioma.*
 *
 * ── FORMA ────────────────────────────────────────────────────────────────
 * Píldora flotante: superficie de carta, elevación de reposo, radio pleno.
 * **`bg.card` y no un acento** (N23): es un aviso, no una acción urgente ni
 * un cambio de clase — el mismo criterio con el que el badge de novedad tiene
 * prohibido el rojo. Lo que la hace notar es que **flota**, no que grita.
 *
 * Sin animación de entrada (N15).
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo (C4), sobre el `sobrepuesto` de `SuperficieChat`.
 * **Entregada y no montada.**
 */
import { Pressable } from 'react-native'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'

export type PastillaNuevoMensajeProps = {
  /** «1 mensaje nuevo» — ya redactado y ya pluralizado por el riel. */
  etiqueta: string
  /** Baja al último. */
  onPress: () => void
}

export function PastillaNuevoMensaje({ etiqueta, onPress }: PastillaNuevoMensajeProps) {
  const { theme } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={{
        alignSelf: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: radius.full,
        backgroundColor: theme.bg.card,
        borderWidth: theme.border.width,
        borderColor: theme.border.subtle,
        boxShadow: theme.elevacion.elevada,
      }}
    >
      <Texto variante="apoyo">{etiqueta}</Texto>
    </Pressable>
  )
}
