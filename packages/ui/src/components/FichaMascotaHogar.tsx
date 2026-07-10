/**
 * FichaMascotaHogar — la ficha de una mascota en la Zona 1 del Hogar
 * (S51-B2.2, Ley 11 con espec gateada por founder).
 *
 * QUÉ ES: AvatarMascota + nombre (voz viva, DM Sans) + UNA línea de
 * estado en voz humana con su semántica visual. Interactiva: tap →
 * perfil de la mascota. El TEXTO de la voz lo pasa la pantalla (nace
 * del riel i18n del app); este componente es presentacional puro y
 * solo porta la SEMÁNTICA (Ley 3: acá no entra ningún código del
 * modelo — la pantalla ya tradujo voz → texto).
 *
 * QUÉ NO ES: no porta badges ni contadores; no es Celda genérica (sin
 * metadataMono — el estado del hogar es voz humana, no de máquina);
 * no lleva CTA embebida (el tap ES la acción: ir al perfil).
 *
 * SEMÁNTICA POR VOZ (tres voces de DISEÑO_EXPERIENCIA §2):
 *   alDia        → punto verdeVital (registro gráfico status.success),
 *                  voz en text.secondary — verde vital, sin ruido.
 *   pideAtencion → punto ochre + voz en status.warningText (registro
 *                  AA) — pide, no grita (danger queda para emergencia
 *                  DENTRO del perfil, no en la ficha).
 *   conociendolo → sin punto, voz en text.secondary — neutral, invita.
 *
 * Pressed: resalta bg.overlay, JAMÁS escala (regla de filas, Celda).
 * Memorial: degrada solo — sin punto ni tinte, voz en text.secondary.
 * A11y: botón "{nombre}, {texto del estado}".
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota } from './AvatarMascota'

export type FichaMascotaHogarVoz = 'alDia' | 'pideAtencion' | 'conociendolo'

export type FichaMascotaHogarProps = {
  nombre: string
  /** URL firmada (la pantalla resuelve el path — patrón S47). */
  fotoUrl?: string
  /** La voz decide punto y color; el texto ya viene traducido. */
  voz: FichaMascotaHogarVoz
  textoEstado: string
  onPress: () => void
}

export function FichaMascotaHogar({ nombre, fotoUrl, voz, textoEstado, onPress }: FichaMascotaHogarProps) {
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)
  const esMemorial = theme.mode === 'memorial'

  // Memorial degrada: sin punto, voz neutra (el momento se respeta).
  const punto = esMemorial
    ? null
    : voz === 'alDia'
      ? theme.status.success
      : voz === 'pideAtencion'
        ? theme.status.warning
        : null

  const colorVoz =
    !esMemorial && voz === 'pideAtencion' ? theme.status.warningText : theme.text.secondary

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole="button"
      accessibilityLabel={`${nombre}, ${textoEstado}`}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[3],
          borderRadius: radius.lg,
          backgroundColor: presionada ? theme.bg.overlay : 'transparent',
          transitionProperty: 'backgroundColor',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
        }}
      >
        <AvatarMascota nombre={nombre} fotoUrl={fotoUrl} tamano="md" />

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.lg,
              color: theme.text.primary,
            }}
          >
            {nombre}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            {punto ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: radius.full,
                  backgroundColor: punto,
                }}
              />
            ) : null}
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                flex: 1,
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: typography.size.sm * typography.leading.snug,
                color: colorVoz,
              }}
            >
              {textoEstado}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}
