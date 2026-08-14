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

import { useEffect, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  cubicBezier,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { Badge, useEtiquetaBadge } from './Badge'

/** El lado de la superficie de la tab destacada. 44 es el blanco de la
 *  casa (N8, ley de la pieza) — la destacada no gana toque, gana PESO:
 *  su superficie ES el blanco, en vez de quedar dibujada adentro. */
const DESTACADA_LADO = 44

/** EL OVERSHOOT DE LA HUELLA (candidata §5.4, apagada por default — ver
 *  la prop `overshootHuella`). Envuelve el ícono y le da un rebote corto
 *  cuando la tab pasa a activa: la huella no solo aparece, LLEGA.
 *
 *  Memorial y reduce-motion quedan QUIETOS por el mismo par que usan
 *  `PuertaDeOficio` y `Destape` — en memorial nada rebota (Ley 8), y esa
 *  regla no la puede saltear una candidata. */
function HuellaDeTab({
  activa,
  overshoot,
  children,
}: {
  activa: boolean
  overshoot: boolean
  children: ReactNode
}) {
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const quieto = theme.mode === 'memorial' || reduceMotion
  const v = useSharedValue(activa ? 1 : 0)

  useEffect(() => {
    if (!overshoot || quieto) {
      v.value = activa ? 1 : 0
      return
    }
    v.value = withTiming(activa ? 1 : 0, {
      duration: motion.duration.overshootTab,
      // La curva del rebote — la de la casa termina en 1 y no puede
      // hacer overshoot (el choque declarado en la prop).
      easing: Easing.bezier(...motion.easing.spring.bezier),
    })
  }, [activa, overshoot, quieto])

  const estilo = useAnimatedStyle(() => ({
    transform: [{ scale: overshoot && !quieto ? 1 + v.value * 0.06 : 1 }],
  }))

  return <Animated.View style={estilo}>{children}</Animated.View>
}

export type BarraTabsItem = {
  /** = nombre de ruta de expo-router. */
  key: string
  etiqueta: string
  /** Icono outline — recibe color del estado y `activa` (S53 §2.6:
   *  en el lenguaje b′ la tab activa se marca porque su huella APARECE). */
  icono: (estado: { color: string; activa: boolean; colorHuella: string }) => ReactNode
  /** Contador entero — "3 pendientes" del prestador. */
  badge?: number
  /** S97+-B · EL DESTINO CENTRAL (firma de arquitectura, mesa 13-ago):
   *  Mostrador sube de chip a TAB, y la tab de atender es el destino
   *  destacado de la barra del prestador.
   *
   *  LA PIEZA NO ELIGE CUÁL: la declara quien la monta, igual que
   *  `badge`. La composición por capacidad —titular con local ve cuatro,
   *  recepción tres, profesional puro dos, vendedor puro tres— es del
   *  app, que es el único que sabe qué puede cada quien. Meter esa
   *  decisión acá sería que `packages/ui` leyera roles.
   *
   *  SU FORMA, y por qué NO es un color: la destacada gana SUPERFICIE y
   *  un paso de tamaño, jamás un acento propio. N5 manda un acento por
   *  pantalla y en esta barra ya está tomado —la huella de la tab activa
   *  ES `accent.active` desde §2.6—, así que pintar la central de color
   *  pondría dos acentos peleando, y el que perdería es el que dice
   *  DÓNDE ESTOY. *Destacar no es competir con el estado: es pesar más
   *  en reposo.* */
  destacada?: boolean
}

export function BarraTabs({
  items,
  activo,
  onCambiar,
  estadoPorHuella = false,
  acento,
  overshootHuella = false,
}: {
  /** 2 a 5 tabs.
   *
   *  ⏪ S97+-B — DECÍA «3 a 5» y la composición por capacidad la dejó
   *  falsa: el **profesional puro** ve DOS (Hoy · Cuenta). No es un caso
   *  hipotético — es uno de los cuatro perfiles de la firma del 13-ago.
   *  Se corrige acá, en el contrato, y no solo en la lámina: un rango
   *  que excluye un perfil vivo es la clase de letra que alguien cita
   *  para «arreglar» una barra que está bien. */
  items: BarraTabsItem[]
  activo: string
  onCambiar: (key: string) => void
  /** S53 (DIRECCION_ARTE §2.6): con el set b′ la HUELLA es el sistema
   *  de estado — aparece en la tab activa y el pill NO se renderiza
   *  (sin recuadros, sin pills). La huella activa hereda el rol de
   *  accent.active: sigue siendo EL elemento activo de la vista. */
  estadoPorHuella?: boolean
  /** PROP DE GATE — override del acento de la tab activa. Default:
   *  `accent.active`, que desde S83-B13 es SLOT y ya resuelve por casa
   *  (pink el cliente · el verde del oficio en sus dos registros).
   *
   *  SU PRIMER GATE YA SE FIRMÓ Y LA PROP SOBREVIVIÓ AL CAMBIO DE
   *  PREGUNTA, así que su letra se corrige en vez de dejarla mintiendo:
   *  nació (B11) para arbitrar magenta-vs-teal, y el founder firmó el
   *  verde en dispositivo. Lo que queda abierto es CUÁL verde, y para eso
   *  sigue haciendo falta montar la BARRA REAL con los tres candidatos
   *  (tealDark · puro · el par) uno al lado del otro — cosa que el slot,
   *  por definición, no puede hacer: resuelve UNO por tema.
   *
   *  ☠️ MUERTE: con la firma del REGISTRO. Gane el que gane, el valor
   *  vive en el slot y esta prop se borra en ese mismo acto — la API de
   *  una lámina no sobrevive a su lámina (Ley 37). */
  acento?: string
  /** PROP DE GATE — el overshoot de 280 ms de la huella al cambiar de
   *  tab (N10, Norte de la mesa del 13-ago). **NACE APAGADA**, y el
   *  porqué es de letra, no de prudencia:
   *
   *  `DIRECCION_ARTE` §5.4 lo lista EXPLÍCITAMENTE como **CANDIDATA SIN
   *  FIRMA con gate propio** («el overshoot 280 ms de la huella de tab
   *  (a la Ley 6/§2.6 — el CÓMO aparece)»). El Norte lo da por
   *  vocabulario cerrado; la letra depositada dice que espera gate. Dos
   *  letras que se contradicen no se resuelven eligiendo la que
   *  conviene: la pieza se construye y **queda preparada-apagada**
   *  (precedente D-456, el micrófono), para que encenderla sea UNA línea
   *  el día que el founder la firme en dispositivo.
   *
   *  🔴 Y TRAE UN CHOQUE PROPIO, declarado: N10 dice «UN bezier
   *  (.32,.72,0,1)» y en la misma frase pide overshoot. **Un overshoot
   *  con esa curva no hace overshoot** — la curva de la casa termina en
   *  1 y no lo pasa. Así que el gesto usa `motion.easing.spring`
   *  ([0.34, 1.56, 0.64, 1]), que **ya existe en el token desde v3.1**:
   *  no se inventa una curva, se usa la que la casa ya tiene para
   *  «confirmaciones táctiles». Si el gate rechaza la excepción, muere
   *  el gesto entero, no la curva.
   *
   *  ☠️ MUERTE: con el gate de §5.4. Si pasa, el valor deja de ser prop
   *  y vive en la pieza; si falla, se retira con su token. En los dos
   *  casos esta prop se borra — la API de una candidata no sobrevive a
   *  su gate (Ley 37). */
  overshootHuella?: boolean
}) {
  const etiquetaBadge = useEtiquetaBadge()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  /** LA INVARIANTE DE LA BARRA: **una sola destacada**. «Destino
   *  central» en plural no significa nada — dos tabs pesando igual es
   *  ninguna pesando.
   *
   *  Por qué un aviso de DEV y no un rebote: la barra es la navegación
   *  raíz, y una barra que no monta deja la app sin piso. Un warning en
   *  desarrollo llega a quien la compone, en el momento en que la
   *  compone; un throw en producción castiga al usuario por un error de
   *  quien la montó. *(Si algún día `destacada` pasa a ser prop de la
   *  BARRA en vez del ítem, este estado se vuelve inexpresable y este
   *  guard muere — que sería mejor. Hoy no se hace porque el consumidor
   *  arma la lista con spreads condicionales por capacidad, y ahí la
   *  marca viaja NATURALMENTE con el ítem que puede o no existir.)* */
  if (__DEV__) {
    const destacadas = items.filter((i) => i.destacada === true)
    if (destacadas.length > 1) {
      console.warn(
        `[BarraTabs] ${destacadas.length} tabs marcadas como \`destacada\` (${destacadas
          .map((d) => d.key)
          .join(', ')}). El destino central es UNO: dos pesando igual es ninguna pesando. Se destacan todas — la pieza no elige por vos.`,
      )
    }
  }
  const accentActive = acento ?? ('active' in theme.accent ? theme.accent.active : theme.accent.primary)

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
        // §2.6+§2.8: la huella activa hereda accent.active; memorial
        // degrada a tinta secundaria (jamás color en memorial).
        const colorHuella = theme.mode === 'memorial' ? theme.text.secondary : accentActive
        return (
          <Pressable
            key={item.key}
            onPress={() => onCambiar(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: esActivo }}
            aria-selected={esActivo}
            accessibilityLabel={etiquetaBadge(item.etiqueta, item.badge ?? 0)}
            style={{
              flex: 1,
              minHeight: Math.max(56, 44),
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[0.5],
            }}
          >
            {/* S88-B: la anatomía del badge SUBIÓ a pieza (`Badge`) al ganar
                su segundo consumidor (la campana) — la barra pasa a
                consumirla: misma geometría S43, misma pill, y la voz del
                label ahora vive en el riel (antes: hardcodeada acá). */}
            <HuellaDeTab activa={esActivo} overshoot={overshootHuella}>
              {item.destacada === true ? (
                /* EL DESTINO CENTRAL — superficie propia y un paso de
                   tamaño. Sin color: el acento de esta barra ya está
                   tomado por la huella activa (N5). */
                <View
                  style={{
                    width: DESTACADA_LADO,
                    height: DESTACADA_LADO,
                    borderRadius: radius.full,
                    backgroundColor: theme.bg.overlay,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Badge n={item.badge ?? 0}>
                    {item.icono({ color, activa: esActivo, colorHuella })}
                  </Badge>
                </View>
              ) : (
                <Badge n={item.badge ?? 0}>
                  {item.icono({ color, activa: esActivo, colorHuella })}
                </Badge>
              )}
            </HuellaDeTab>
            {/* el subrayado: opacity, jamás slide. Con estadoPorHuella
                el pill muere — la huella del ícono ES el estado (§2.6). */}
            {estadoPorHuella ? null : (
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
            )}
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
