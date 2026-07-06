/**
 * BarraTabs — la navegación raíz de ambos apps (S43-B3.7).
 * Wrapper visual del sistema para el tabBar custom de expo-router Tabs.
 *
 * ═══════════════════════════════════════════════════════════════════
 * EL GESTO: el subrayado accent.active (pill 3×18) bajo el icono activo
 * es EL elemento activo de la vista raíz — las pantallas bajo tabs no
 * deben usar otro accent.active compitiendo.
 *
 * El subrayado aparece/desaparece con OPACITY (fast) — NO se desliza
 * entre tabs: el slide pelea con los gestos de swipe y se rompe feo.
 * ═══════════════════════════════════════════════════════════════════
 *
 * INTEGRACIÓN CON EXPO-ROUTER (S44 la enchufa sin pensar):
 *
 *   import { Tabs } from 'expo-router'
 *   import { BarraTabs, type BarraTabsItem } from '@epetplace/ui'
 *
 *   const ITEMS: BarraTabsItem[] = [
 *     { key: 'index',  etiqueta: 'Hoy',    icono: ({ color }) => <IconoHoy color={color} /> },
 *     { key: 'agenda', etiqueta: 'Agenda', icono: ({ color }) => <IconoAgenda color={color} />, badge: 3 },
 *     { key: 'perfil', etiqueta: 'Perfil', icono: ({ color }) => <IconoPerfil color={color} /> },
 *   ]
 *
 *   export default function Layout() {
 *     return (
 *       <Tabs
 *         tabBar={({ state, navigation }) => (
 *           <BarraTabs
 *             items={ITEMS}
 *             activo={state.routes[state.index].name}
 *             onCambiar={(key) => navigation.navigate(key)}
 *           />
 *         )}
 *       >
 *         <Tabs.Screen name="index" />
 *         <Tabs.Screen name="agenda" />
 *         <Tabs.Screen name="perfil" />
 *       </Tabs>
 *     )
 *   }
 *
 *   (los `key` de items = nombres de ruta de expo-router)
 */

import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { Insignia } from './Insignia'

export type BarraTabsItem = {
  /** = nombre de ruta de expo-router. */
  key: string
  etiqueta: string
  /** Icono outline 1.75px — recibe el color del estado (primary/tertiary). */
  icono: (estado: { color: string }) => ReactNode
  /** Contador entero — "3 pendientes" del prestador. */
  badge?: number
}

export function BarraTabs({
  items,
  activo,
  onCambiar,
}: {
  /** 3 a 5 tabs. */
  items: BarraTabsItem[]
  activo: string
  onCambiar: (key: string) => void
}) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const accentActive = 'active' in theme.accent ? theme.accent.active : theme.accent.primary

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.bg.base,
        borderTopWidth: 1,
        borderTopColor: theme.bg.border,
        paddingBottom: insets.bottom,
      }}
    >
      {items.map((item) => {
        const esActivo = item.key === activo
        const color = esActivo ? theme.text.primary : theme.text.tertiary
        return (
          <Pressable
            key={item.key}
            onPress={() => onCambiar(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: esActivo }}
            aria-selected={esActivo}
            accessibilityLabel={item.badge ? `${item.etiqueta}, ${item.badge} pendientes` : item.etiqueta}
            style={{
              flex: 1,
              minHeight: Math.max(56, 44),
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <View>
              {item.icono({ color })}
              {item.badge ? (
                <View style={{ position: 'absolute', top: -6, right: -14 }}>
                  <Insignia estado="atencion" etiqueta={String(item.badge)} tamaño="sm" />
                </View>
              ) : null}
            </View>
            {/* el subrayado: opacity, jamás slide */}
            <Animated.View
              style={{
                width: 18,
                height: 3,
                borderRadius: radius.full,
                backgroundColor: accentActive,
                opacity: esActivo ? 1 : 0,
                transitionProperty: 'opacity',
                transitionDuration: motion.duration.fast,
                transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
                marginTop: -spacing[0.5],
              }}
            />
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.xs,
                color,
              }}
            >
              {item.etiqueta}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
