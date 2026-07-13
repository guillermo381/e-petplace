/**
 * SelectorSegmentado — el control canónico de VISTAS EXCLUSIVAS dentro
 * de una pantalla (Ley 19.3 · D-359, firmado S58): Próximos/Agenda/
 * Historial, Hoy/Semana, secciones de Cuenta.
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es filtro ni multi-selección (eso es SelectorOpcion —
 * los chips QUEDAN PROHIBIDOS como tabs/segmentos, decisión founder
 * S57), no es la navegación raíz (BarraTabs), no porta estado de datos
 * (Insignia). Presentacional puro: la pantalla es dueña de la vista.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía (espec firmada): riel contenedor en superficie hundida
 * (bg.overlay) + 2-3 segmentos; el segmento ACTIVO es una superficie
 * apoyada sobre el riel con elevacion.reposo — el lenguaje del material
 * papel (Ley 20). Regla Chanel del marco cableada: el activo lleva
 * sombra, jamás borde. Texto solo en v1 (sin íconos, firmado): activo
 * en text.primary, inactivos en text.secondary — sans.medium en AMBOS
 * estados (el cambio de peso movería el layout). Tap area completa por
 * segmento (celda flex entera, alto ≥44).
 *
 * Resolución por tema del paso de luminancia del activo: claro =
 * bg.card (la superficie blanca). Dark/memorial no tienen superficie
 * MÁS clara que el riel en su escala: el activo usa border.default como
 * relleno (precedente del agarre de la Hoja: bg.border como fill
 * gráfico) + la sombra de contacto mínima de elevacion.reposo.
 *
 * Motion (criterio emil, código SM — la receta CSS-transition de
 * Reanimated de Boton/Tarjeta/Celda): la superficie activa SE DESLIZA
 * (translateX, duration.fast, easeOut) y la sombra viaja con ella; la
 * sombra JAMÁS se anima sola (Ley 6). Memorial: reemplazo directo, sin
 * deslizamiento — en memorial nada se desliza.
 *
 * Memorial y dosis prestador: EL MISMO componente, sin variante — no
 * porta color de capa (espec firmada).
 *
 * A11y: tablist con etiqueta; cada segmento tab con selected. El canal
 * semántico es accessibilityState.selected — la sombra es refuerzo.
 *
 * Escalera §4b: NO muestra datos del expediente — control de navegación
 * puro; los peldaños no aplican (declarado explícito en la espec).
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

// riel radius.md (12) − padding spacing[1] (4) = 8 → el activo es radius.sm
const RADIO_RIEL = radius.md
const RADIO_ACTIVO = radius.sm
const RELLENO_RIEL = spacing[1]
const ALTO_SEGMENTO = 40 // + relleno del riel = 48 de target táctil

export interface SelectorSegmentadoItem {
  codigo: string
  /** VOZ HUMANA — ej: "Próximos" (jamás el vocabulario interno del modelo). */
  etiqueta: string
}

export interface SelectorSegmentadoProps {
  /** 2 o 3 vistas exclusivas (Ley 19.3) — más de 3 no es un segmento, es otra pantalla. */
  segmentos: SelectorSegmentadoItem[]
  /** Código del segmento activo. La pantalla es dueña de la vista. */
  activo: string
  onCambio: (codigo: string) => void
  /** accessibilityLabel del grupo (el control no lleva label visible). */
  etiqueta: string
}

export function SelectorSegmentado({ segmentos, activo, onCambio, etiqueta }: SelectorSegmentadoProps) {
  const { theme } = useTheme()
  const [anchoRiel, setAnchoRiel] = useState(0)

  if (__DEV__ && (segmentos.length < 2 || segmentos.length > 3)) {
    console.warn(
      `SelectorSegmentado: ${segmentos.length} segmento(s) — el diccionario dice 2 o 3 (Ley 19.3).`,
    )
  }

  const esMemorial = theme.mode === 'memorial'
  const indiceActivo = segmentos.findIndex((s) => s.codigo === activo)
  const anchoSegmento = anchoRiel > 0 ? (anchoRiel - RELLENO_RIEL * 2) / segmentos.length : 0

  // Paso de luminancia del activo por tema (ver doc de cabecera)
  const superficieActiva = theme.mode === 'light' ? theme.bg.card : theme.border.default

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={etiqueta}
      onLayout={(e) => setAnchoRiel(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.bg.overlay,
        borderRadius: RADIO_RIEL,
        padding: RELLENO_RIEL,
      }}
    >
      {anchoSegmento > 0 && indiceActivo >= 0 ? (
        <Animated.View
          // decorativa: el canal semántico es selected en cada tab
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: RELLENO_RIEL,
              bottom: RELLENO_RIEL,
              left: RELLENO_RIEL,
              width: anchoSegmento,
              borderRadius: RADIO_ACTIVO,
              backgroundColor: superficieActiva,
              // regla Chanel del marco: sombra, jamás borde
              boxShadow: theme.elevacion.reposo,
              transform: [{ translateX: indiceActivo * anchoSegmento }],
            },
            // se desliza la SUPERFICIE y la sombra viaja con ella (Ley 6);
            // memorial: reemplazo directo, nada se desliza
            esMemorial
              ? null
              : {
                  transitionProperty: 'transform',
                  transitionDuration: motion.duration.fast,
                  transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
                },
          ]}
        />
      ) : null}

      {segmentos.map((s) => {
        const esActivo = s.codigo === activo
        return (
          <Pressable
            key={s.codigo}
            onPress={() => {
              if (!esActivo) onCambio(s.codigo)
            }}
            accessibilityRole="tab"
            accessibilityLabel={s.etiqueta}
            accessibilityState={{ selected: esActivo }}
            style={{
              flex: 1,
              minHeight: ALTO_SEGMENTO,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: spacing[2],
            }}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.sm,
                color: esActivo ? theme.text.primary : theme.text.secondary,
              }}
            >
              {s.etiqueta}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
