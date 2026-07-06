/**
 * Aviso — el feedback efímero del sistema (S43-B3.9).
 * API imperativa: const { mostrar } = useAviso()
 *                 mostrar({ texto, variante, accion? })
 *
 * ═══════════════════════════════════════════════════════════════════
 * UNO A LA VEZ: si llega otro aviso mientras uno está visible, entra
 * a la COLA — jamás apilados. El feedback efímero compite consigo
 * mismo, no con el contenido.
 * ═══════════════════════════════════════════════════════════════════
 *
 * QUÉ NO ES: no es notificación persistente ni banner de estado —
 * eso será otro componente si algún día existe.
 *
 * El fondo se composita en capas OPACAS (superficie + tint encima):
 * así el color final es exactamente el par ya gateado por WCAG
 * (xText / xBg⊕card) y el toast no se ensucia con lo que tenga abajo.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AccessibilityInfo, Pressable, Text, View } from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

export type AvisoVariante = 'neutro' | 'exito' | 'error'

export type AvisoInput = {
  texto: string
  variante?: AvisoVariante
  /** Un solo botón texto ("Deshacer"). Con accion, el auto-cierre sube a 6s. */
  accion?: { etiqueta: string; onPress: () => void }
}

type AvisoContexto = { mostrar: (aviso: AvisoInput) => void }

const Contexto = createContext<AvisoContexto | null>(null)

export function useAviso(): AvisoContexto {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAviso: falta <AvisoProvider> arriba en el árbol.')
  return ctx
}

const DURACION: Record<AvisoVariante, number> = {
  neutro: 3000,
  exito: 3000,
  error: 5000,   // el error se queda lo suficiente para leerlo
}

export function AvisoProvider({
  children,
  /** Alto de la BarraTabs (u otro pie) que el aviso no debe tapar. */
  offsetInferior = 0,
}: {
  children: ReactNode
  offsetInferior?: number
}) {
  const [actual, setActual] = useState<AvisoInput | null>(null)
  const cola = useRef<AvisoInput[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // ocupación SÍNCRONA: dos mostrar() en el mismo tick verían el estado
  // de React viejo y el segundo pisaría al primero en vez de encolarse
  const ocupado = useRef(false)

  const cerrar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setActual(null)
    // el siguiente de la cola entra tras dejar salir al anterior
    setTimeout(() => {
      const siguiente = cola.current.shift()
      if (siguiente) {
        presentar(siguiente)
      } else {
        ocupado.current = false
      }
    }, motion.duration.fast)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const presentar = useCallback((aviso: AvisoInput) => {
    ocupado.current = true
    setActual(aviso)
    AccessibilityInfo.announceForAccessibility(aviso.texto)
    const duracion = aviso.accion ? 6000 : DURACION[aviso.variante ?? 'neutro']
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(cerrar, duracion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mostrar = useCallback(
    (aviso: AvisoInput) => {
      if (ocupado.current) {
        cola.current.push(aviso)   // UNO a la vez — jamás apilados
      } else {
        presentar(aviso)
      }
    },
    [presentar],
  )

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return (
    <Contexto.Provider value={{ mostrar }}>
      <View style={{ flex: 1 }}>
        {children}
        {actual ? (
          <PieAviso aviso={actual} onCerrar={cerrar} offsetInferior={offsetInferior} />
        ) : null}
      </View>
    </Contexto.Provider>
  )
}

function PieAviso({
  aviso,
  onCerrar,
  offsetInferior,
}: {
  aviso: AvisoInput
  onCerrar: () => void
  offsetInferior: number
}) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const variante = aviso.variante ?? 'neutro'

  const tinte =
    variante === 'exito'
      ? { fondo: theme.status.successBg, borde: theme.status.successBorder, texto: theme.status.successText }
      : variante === 'error'
        ? { fondo: theme.status.dangerBg, borde: theme.status.dangerBorder, texto: theme.status.dangerText }
        : { fondo: 'transparent', borde: theme.border.subtle, texto: theme.text.primary }

  // memorial: solo fade — nada desliza
  const entrada =
    theme.mode === 'memorial'
      ? FadeIn.duration(motion.duration.fast)
      : FadeInDown.duration(motion.duration.fast)

  return (
    <Animated.View
      entering={entrada}
      exiting={FadeOut.duration(motion.duration.fast)}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + offsetInferior + spacing[4],
        alignItems: 'center',
        paddingHorizontal: spacing[4],
      }}
    >
      <Pressable
        onPress={onCerrar}
        accessibilityRole={variante === 'error' ? 'alert' : 'text'}
        accessibilityLabel={aviso.texto}
        style={[
          {
            // capa 1: superficie OPACA (el toast flota sobre contenido arbitrario)
            backgroundColor: theme.mode === 'light' ? theme.bg.card : theme.bg.elevated,
            borderRadius: radius.md,
            maxWidth: 520,
            overflow: 'hidden',
          },
          theme.shadow.md,
        ]}
      >
        {/* capa 2: el tint encima — composita al par exacto gateado por WCAG */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
            backgroundColor: tinte.fondo,
            borderWidth: theme.border.width,
            borderColor: tinte.borde,
            borderRadius: radius.md,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              flexShrink: 1,
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.sm,
              lineHeight: typography.size.sm * typography.leading.snug,
              color: tinte.texto,
            }}
          >
            {aviso.texto}
          </Text>
          {aviso.accion ? (
            <Pressable
              onPress={() => {
                aviso.accion?.onPress()
                onCerrar()
              }}
              accessibilityRole="button"
              accessibilityLabel={aviso.accion.etiqueta}
              hitSlop={8}
            >
              <Text style={{ fontFamily: typography.family.sans.bold, fontSize: typography.size.sm, color: theme.accent.primary }}>
                {aviso.accion.etiqueta}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  )
}
