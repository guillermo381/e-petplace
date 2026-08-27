/**
 * AccionQueLleva — la acción SUELTA que te saca del flujo (S106-B).
 *
 * **Su trabajo:** el camino de salida que la pantalla ofrece pero no espera que
 * tomes. *«Cambiar medio de pago» mientras esperás un código: existe, tiene que
 * verse, y no puede competir con lo que la pantalla sí espera.*
 *
 * ── 🔴 POR QUÉ NACE, con el caso que la pidió ─────────────────────────────
 * En el checkout, **«Cambiar medio de pago» y «Copiar» se veían IDÉNTICOS** —
 * los dos `Boton secundario`, mismo color y misma forma. *Uno es la acción
 * normal del flujo; el otro es salirse de él, y el founder no los distinguía.*
 *
 * **La Ley 19.7 ya nombra la forma** —*«por superficie UN sólido; lo secundario
 * baja a LABEL, y la que baja tiene FORMA NOMBRADA: texto + chevron + target
 * 44»*— **pero no había pieza que la portara para una acción SUELTA.**
 * `CeldaNavegacion` la porta para filas de lista; `PieRevelar` para revelar una
 * sección. **Entre las dos quedaba el hueco de la acción suelta que NAVEGA.**
 *
 * ── LO QUE SE INTENTÓ ANTES DE CREAR (protocolo §1c: reusar > adaptar > crear)
 * · **`Boton ghost`** — texto pelado, **sin chevron**: vuelve al defecto que
 *   esta pieza viene a curar (no parece tocable).
 * · **`CeldaNavegacion`** — es la anatomía correcta pero es **fila de lista**:
 *   ancho completo y padding de celda, suelta bajo un código de pago se lee
 *   como una lista de un elemento.
 * · **Adaptar `PieRevelar`** — descartado: su contrato es `n: number` y
 *   `revelado`, y su voz es «Ver N más»/«Ocultar». *Ensancharlo para que
 *   además navegue lo dejaría sin poder decir qué hace.*
 *
 * ⇒ **Nace, y barato: el chevron ya es primitiva compartida** (`./chevron`,
 * la misma tabla que usan `CeldaNavegacion` y `PieRevelar`). *No se dibuja un
 * chevron nuevo: se consume el único que hay.*
 *
 * ── LA ANATOMÍA ES LA DE 19.7, SIN INVENTAR NADA ──────────────────────────
 * Sin caja · texto + **chevron `›`** (la dirección codifica **navegar**, no
 * revelar) · **target 44** · pressed 0.97. **El texto va en tinta**: lo que la
 * vuelve control es ESTRUCTURAL —chevron, peso, target—, no cromático (19.7:
 * *«en el cliente el CTA es tinta; el label no tiene color del que agarrarse»*).
 *
 * ── LO QUE ESTA PIEZA **NO** ES ────────────────────────────────────────────
 * · **No es la acción principal.** Si es lo que la pantalla espera que hagas,
 *   es `Boton`. *Esta pieza existe para lo que se ofrece sin empujarlo.*
 * · **No es fila de lista.** Eso es `CeldaNavegacion` (Ley 19.1).
 * · **No revela nada.** Eso es `PieRevelar` (19.6).
 * · **No lleva glifo**, por la misma razón que `PieRevelar`: una acción suelta
 *   no tiene hermanos, y un glifo sin vecindad es decoración (Ley 12).
 *
 * ── ESCALERA (§4b) ────────────────────────────────────────────────────────
 * No muestra datos del expediente: es un camino. No tiene peldaños.
 */

import { Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import Animated from 'react-native-reanimated'

import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { CHEVRON } from './chevron'
import { usePresionado } from './usePresionado'

export interface AccionQueLlevaProps {
  /** La voz — verbo llano, tuteo (Ley 17.1). Es también su `accessibilityLabel`. */
  etiqueta: string
  onPress: () => void
  /** Centrada (default, para pies) o alineada al inicio dentro de un bloque. */
  alineacion?: 'centro' | 'inicio'
}

export function AccionQueLleva({ etiqueta, onPress, alineacion = 'centro' }: AccionQueLlevaProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.97)

  return (
    <View style={{ alignItems: alineacion === 'centro' ? 'center' : 'flex-start' }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlers.onPressIn}
        onPressOut={handlers.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Animated.View
          style={[estiloPresionado, { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }]}
        >
          <Text
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.base,
              color: theme.text.primary,
            }}
          >
            {etiqueta}
          </Text>
          {/* `derecha` = NAVEGA. La dirección es la que codifica el trabajo
              (19.7, tabla única de `./chevron`) — no es un adorno al final. */}
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <Path
              d={CHEVRON.derecha}
              stroke={theme.text.tertiary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  )
}
