/**
 * CeldaNavegacion — la entrada canónica a una sección (Ley 19.1 · S58,
 * relevamiento L-144): "Mis paseos", "Agregar carnet", "Mascotas".
 * La celda dice A DÓNDE va con su ícono; el botón mudo no dice nada.
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es la fila de LISTA (eso es Celda: datos, metadataMono,
 * fin — y su pressed RESALTA por regla S43, que queda intacta allá).
 * No es acción primaria (Boton) ni porta estado de datos (Insignia).
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía (letra del diccionario, S57): ícono del set b′ a la
 * izquierda (TIPADO — jamás slot libre), título, detalle opcional,
 * chevron de entrada, pressed 0.99 (receta SM de Boton/Tarjeta).
 * El chevron es affordance decorativa en text.tertiary: el canal
 * semántico es el rol button + la etiqueta.
 *
 * Fila transparente, sin margin ni divisor propios (patrón Celda:
 * el divisor es <Separador />). El tratamiento de superficie
 * (plana vs apoyada) se sella en la pantalla patrón del Hogar.
 *
 * `registro` del ícono: 'capa' (default dueño) · 'aa'/'tinta' (dosis
 * prestador) — la dosis modula color, no gramática (Ley 19). Memorial
 * degrada solo adentro de Icono (§2.8).
 *
 * Escalera §4b: NO muestra datos del expediente — navegación pura;
 * los peldaños no aplican (declarado explícito).
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { Icono, type IconoNombre, type IconoRegistro } from './Icono'

const ALTURA_MIN = 56 // la métrica de Celda normal

export interface CeldaNavegacionProps {
  /** Ícono del set b′ — dice a dónde va (Ley 19.1). */
  icono: IconoNombre
  titulo: string
  /** Detalle opcional — voz de la pantalla, jamás dato de expediente. */
  detalle?: string
  onPress: () => void
  /** Dosis: 'capa' (dueño, default) · 'aa' / 'tinta' (prestador). */
  registro?: IconoRegistro
  /** S58 (patrón Hogar v2): false = ACCIÓN dentro del grupo (ej.
   *  "Agregar mascota") — misma anatomía, sin chevron de entrada. */
  chevron?: boolean
}

export function CeldaNavegacion({ icono, titulo, detalle, onPress, registro = 'capa', chevron = true }: CeldaNavegacionProps) {
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole="button"
      accessibilityLabel={[titulo, detalle].filter(Boolean).join(', ')}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          minHeight: ALTURA_MIN,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          // pressed 0.99 — letra del diccionario S57 (receta SM de Boton/Tarjeta)
          transform: [{ scale: presionada ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        <Icono nombre={icono} registro={registro} />

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.base,
              color: theme.text.primary,
            }}
          >
            {titulo}
          </Text>
          {detalle ? (
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: typography.size.sm * typography.leading.snug,
                color: theme.text.secondary,
              }}
            >
              {detalle}
            </Text>
          ) : null}
        </View>

        {/* chevron de entrada — affordance decorativa (el canal semántico es el rol) */}
        {chevron ? (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <Path
              d="M9 18l6-6-6-6"
              stroke={theme.text.tertiary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </Animated.View>
    </Pressable>
  )
}
