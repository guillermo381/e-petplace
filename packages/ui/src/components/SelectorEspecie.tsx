/**
 * SelectorEspecie — selección única de especie (S45-B3.1, onboarding
 * dueño). Espec cerrada por arquitecto+founder.
 *
 * ═══════════════════════════════════════════════════════════════════
 * Presentacional puro: cero fetching adentro — las opciones llegan
 * del catálogo (cat_especies post-D-287) vía la pantalla.
 * La carga NO es de este componente: la pantalla compone Esqueleto.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Grid 3×2 en teléfono (6 especies F1). Ficha = AvatarMascota
 * (especie, sin foto) + nombre en DM Sans (regla de voz: la especie
 * describe un ser vivo, jamás mono).
 *
 * Estados de la ficha:
 *   · reposo — superficie Tarjeta-like (card/elevated + borde sutil)
 *   · pressed — escala 0.99 (receta SM de Boton/Tarjeta)
 *   · seleccionada — borde 1.5 en hex PURO de capa identidad (registro
 *     gráfico; refuerzo, como el anillo de CitaEnVivo: el canal
 *     semántico AA es accessibilityState.checked + el tint) + fondo
 *     capaBg.identidad (registro de tints). NO consume accent.active.
 *   El borde es 1.5 SIEMPRE (reposo lo lleva en border.subtle): el
 *   estado cambia color, jamás mueve el layout.
 *
 * Memorial degrada solo (Ley 8): sin tinte de capa, la selección es
 * borde en text.secondary sobre la superficie de reposo.
 *
 * Accesibilidad: radiogroup con label visible; cada ficha es radio
 * con accessibilityState.checked y anuncio "Nombre, opción N de 6".
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota, type AvatarMascotaEspecie } from './AvatarMascota'

export interface SelectorEspecieOpcion {
  /** Código real de cat_especies (las 6 familias F1 post-D-287). */
  codigo: AvatarMascotaEspecie
  nombre: string
}

export interface SelectorEspecieProps {
  opciones: SelectorEspecieOpcion[]
  /** Código seleccionado; undefined = nada elegido aún. */
  seleccionada?: string
  onSelect: (codigo: AvatarMascotaEspecie) => void
  /** Label visible del grupo Y accessibilityLabel del radiogroup. */
  etiqueta: string
}

// Mismo grosor que el anillo de CitaEnVivo y el borde de Campo.
const BORDE = 1.5

function Ficha({
  opcion,
  indice,
  total,
  seleccionada,
  onSelect,
}: {
  opcion: SelectorEspecieOpcion
  indice: number
  total: number
  seleccionada: boolean
  onSelect: (codigo: AvatarMascotaEspecie) => void
}) {
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)

  // Superficie de reposo: la misma receta de Tarjeta plana.
  const fondoReposo = theme.mode === 'dark' ? theme.bg.elevated : theme.bg.card
  // Selección con capa solo fuera de memorial (Ley 8: memorial sin tinte,
  // borde neutral en text.secondary). Patrón `'capaBg' in theme` de AvatarMascota.
  const conCapa = seleccionada && 'capaBg' in theme
  const fondo = conCapa ? theme.capaBg.identidad : fondoReposo
  const borde = conCapa
    ? theme.capa.identidad
    : seleccionada
      ? theme.text.secondary
      : theme.border.subtle

  return (
    <Pressable
      onPress={() => onSelect(opcion.codigo)}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole="radio"
      accessibilityState={{ checked: seleccionada }}
      accessibilityLabel={`${opcion.nombre}, opción ${indice + 1} de ${total}`}
      style={{ flexBasis: '30%', flexGrow: 1 }}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          paddingVertical: spacing[4],
          paddingHorizontal: spacing[2],
          borderRadius: radius.lg,
          backgroundColor: fondo,
          borderWidth: BORDE,
          borderColor: borde,
          // misma receta que Boton/Tarjeta (SM: CSS transition + estado)
          transform: [{ scale: presionada ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        <AvatarMascota nombre={opcion.nombre} especie={opcion.codigo} tamano="md" />
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            color: theme.text.primary,
            marginTop: spacing[2],
          }}
        >
          {opcion.nombre}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export function SelectorEspecie({ opciones, seleccionada, onSelect, etiqueta }: SelectorEspecieProps) {
  const { theme } = useTheme()

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
          marginBottom: spacing[3],
        }}
      >
        {etiqueta}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
        {opciones.map((opcion, i) => (
          <Ficha
            key={opcion.codigo}
            opcion={opcion}
            indice={i}
            total={opciones.length}
            seleccionada={opcion.codigo === seleccionada}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  )
}
