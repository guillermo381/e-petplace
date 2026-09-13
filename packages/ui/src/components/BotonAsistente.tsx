import { Pressable, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { Icono } from './Icono'
import { usePresionado } from './usePresionado'
import { medidas } from '../tokens/medidas'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { shadows } from '../tokens/shadows'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **BOTÓN DEL ASISTENTE (S116-B lote 2) — NEXO flotando.**
 * Letra §1.5 («el asistente flota en toda raíz») · punto 3 del encargo.
 *
 * **PIEZA NUEVA.** No reemplaza a nadie.
 *
 * 🔴 **LO QUE NO HACE, Y ES LA MITAD DE LA PIEZA:** *«No respira, no late,
 * no llama la atención: está.»* — textual del encargo. **Cero animación de
 * reposo.** Lo único que se mueve es el hundido al tocarlo, que es la
 * física de la casa (`usePresionado`, Ley 6).
 * *Un botón que late en la esquina de toda pantalla raíz es exactamente lo
 * que la Ley 5 prohíbe: un segundo elemento activo compitiendo con la
 * pantalla.* El halo es estático y no pulsa.
 *
 * **Sólo vive en pantallas RAÍZ** — en las empujadas no está. Eso lo
 * decide quien lo monta (`visible`), no la pieza: una pieza no sabe si la
 * pantalla es raíz.
 * ═══════════════════════════════════════════════════════════════════════
 */
export type BotonAsistenteProps = {
  onPress: () => void
  /** El consumidor decide: raíz sí, empujada no. Default `true` para que
   *  olvidarlo no lo esconda — un asistente ausente no se reclama. */
  visible?: boolean
  /** La voz del lector de pantalla. Sin default: la pieza no sabe cómo se
   *  llama el asistente en el idioma de quien mira (Ley 3 — la voz es del
   *  riel, jamás de la pieza). */
  etiqueta: string
}

export function BotonAsistente({ onPress, visible = true, etiqueta }: BotonAsistenteProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.97)
  if (!visible) return null

  const lado = medidas.asistenteDiametro
  const caja: ViewStyle = {
    position: 'absolute',
    right: spacing[5],
    /* Por encima de la barra de tabs: su alto + un respiro. El número sale
       del token de la barra, no de una constante — si la barra cambia de
       alto, el asistente la sigue sola. */
    bottom: medidas.barraAlto + spacing[2],
    width: lado,
    height: lado,
    borderRadius: radius.chipV5,
    backgroundColor: theme.accent.cta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.v5.ctaMagenta,
  }

  return (
    <Animated.View style={[caja, estiloPresionado]}>
      <Pressable
        {...handlers}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        /* El área táctil ES el círculo (60 > 44), así que no necesita
           hitSlop: pedirlo de más se comería el borde de la pantalla. */
        style={{ width: lado, height: lado, alignItems: 'center', justifyContent: 'center' }}
      >
        <View>
          <Icono nombre="ia" tamano={26} registro="tinta" tinta={palette.white} />
        </View>
      </Pressable>
    </Animated.View>
  )
}
