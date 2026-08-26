/**
 * TileVideoPropio — mi propia cámara, chica y movible (S106-B, OBRA 2).
 *
 * **Qué hace:** se ve chico sobre el video grande, **se arrastra** y **se pega
 * solo a la esquina más cercana**. Un toque lo intercambia con el grande.
 *
 * ── 🔴 NO IMPORTA LiveKit, Y ES DECISIÓN DE ARQUITECTURA ───────────────────
 * El video entra como `children`. **`packages/ui` no depende del transporte**:
 * hoy LiveKit no está en sus `peerDependencies` y meterlo ataría el sistema de
 * diseño entero a un proveedor. *El transporte se firmó ayer; los sistemas de
 * diseño duran más que los proveedores.*
 * **Efecto lateral que confirma la decisión:** la pieza se puede ver en galería
 * sin cámara, sin sala y sin token.
 *
 * ── EL IMÁN: por qué a la esquina y no libre ───────────────────────────────
 * Un tile que queda donde lo soltaste **termina siempre tapando algo**: la cara
 * del veterinario, el temporizador o los controles. Cuatro esquinas son cuatro
 * lugares donde **sabemos** que no tapa nada importante. *La libertad total acá
 * no es más control: es más trabajo para el usuario, en medio de una consulta.*
 *
 * ── LA FÍSICA ──────────────────────────────────────────────────────────────
 * · **Sigue el dedo 1:1** mientras arrastra: cualquier retardo se siente roto.
 * · **Al soltar, va a la esquina más cercana** con `duration.micro` (150 ms) y
 *   la curva `easeOut` — llega y se queda, **sin rebote**.
 * · **El toque intercambia** con `duration.estandar` (300 ms), y ese cambio lo
 *   ejecuta el consumidor: la pieza avisa, no decide quién va grande.
 *
 * ✅ **LOS NÚMEROS, RESUELTOS POR LA MESA (26-ago).** `DIRECCION_ARTE_VIDEOCONSULTA`
 * §1.4 escribe **250 ms** (intercambio) y **200 ms** (imán); **el vocabulario del
 * movimiento es CERRADO y está firmado** (`motion.ts`, 13-ago): *«150 micro ·
 * 300 estándar · 520 grande. Nada más se mueve.»*
 * **El founder RATIFICÓ LOS TOKENS:** *«eran intención, no medición — los
 * escribió la mesa, no una regla, y abrir un vocabulario cerrado y firmado por
 * una preferencia es el peor motivo que hay.»* ⇒ rige `micro`.
 *
 * ── ACCESIBILIDAD: el arrastre no puede ser el único camino ────────────────
 * El tile es `button` con su etiqueta, y **el toque (intercambiar) hace el
 * trabajo importante**. *Quien no puede arrastrar con precisión no pierde
 * ninguna función: el arrastre solo mueve una miniatura de lugar.*
 */

import { useCallback, useMemo, type ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, Easing } from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { sobreVideo } from '../tokens/sobreVideo'

export type EsquinaTile = 'arribaDer' | 'arribaIzq' | 'abajoDer' | 'abajoIzq'

export interface TileVideoPropioProps {
  /** El video. Entra como nodo: esta pieza no sabe de transporte. */
  children: ReactNode
  /** Un toque = intercambiar grande ↔ chico. El consumidor decide qué significa. */
  onIntercambiar: () => void
  /** Voz del tocable (a11y). */
  etiqueta: string
  /** Dónde arranca. Por dirección de arte: arriba a la derecha. */
  esquinaInicial?: EsquinaTile
  /** Alto del tile como fracción del alto disponible. Por dirección: 0.28. */
  fraccionAlto?: number
  /** Alto del área donde vive (la superficie de llamada). */
  altoDisponible: number
  /** Márgenes seguros (insets del aparato + el chrome). */
  margen?: { top: number; bottom: number }
}

/** Relación de un video vertical de teléfono. */
const RELACION = 3 / 4

export function TileVideoPropio({
  children,
  onIntercambiar,
  etiqueta,
  esquinaInicial = 'arribaDer',
  fraccionAlto = 0.28,
  altoDisponible,
  margen = { top: 0, bottom: 0 },
}: TileVideoPropioProps) {
  const { width: anchoPantalla } = useWindowDimensions()
  /* R41 · quien pide menos movimiento lo pide por un síntoma, no por gusto.
     Acá el VIAJE es lo que se quita: el tile sigue yendo a su esquina, pero
     llega sin recorrido. **El destino no cambia — cambia el trayecto.** */
  const reduceMotion = useReducedMotion()

  const alto = Math.round(altoDisponible * fraccionAlto)
  const ancho = Math.round(alto * RELACION)
  const borde = spacing[3]

  /** Las cuatro posiciones de reposo. Nada intermedio existe. */
  const esquinas = useMemo(() => {
    const izq = borde
    const der = anchoPantalla - ancho - borde
    const arr = margen.top + borde
    const aba = altoDisponible - alto - margen.bottom - borde
    return {
      arribaIzq: { x: izq, y: arr },
      arribaDer: { x: der, y: arr },
      abajoIzq: { x: izq, y: aba },
      abajoDer: { x: der, y: aba },
    } as const
  }, [anchoPantalla, ancho, alto, altoDisponible, margen.top, margen.bottom, borde])

  const x = useSharedValue(esquinas[esquinaInicial].x)
  const y = useSharedValue(esquinas[esquinaInicial].y)
  const iniX = useSharedValue(0)
  const iniY = useSharedValue(0)

  /** La más cercana al punto donde se soltó — distancia al cuadrado, sin raíz. */
  const masCercana = useCallback(
    (px: number, py: number): EsquinaTile => {
      let mejor: EsquinaTile = 'arribaDer'
      let min = Infinity
      for (const k of Object.keys(esquinas) as EsquinaTile[]) {
        const d = (esquinas[k].x - px) ** 2 + (esquinas[k].y - py) ** 2
        if (d < min) { min = d; mejor = k }
      }
      return mejor
    },
    [esquinas],
  )

  const pegar = useCallback(
    (k: EsquinaTile) => {
      const cfg = reduceMotion
        ? { duration: 0 }
        : { duration: motion.duration.micro, easing: Easing.bezier(...motion.easing.easeOut.bezier) }
      x.value = withTiming(esquinas[k].x, cfg)
      y.value = withTiming(esquinas[k].y, cfg)
    },
    [esquinas, reduceMotion, x, y],
  )

  const arrastre = Gesture.Pan()
    .onStart(() => {
      iniX.value = x.value
      iniY.value = y.value
    })
    .onUpdate((e) => {
      // 1:1 con el dedo. Cualquier suavizado acá se siente como retardo.
      x.value = iniX.value + e.translationX
      y.value = iniY.value + e.translationY
    })
    .onEnd(() => {
      runOnJS(pegar)(masCercana(x.value, y.value))
    })

  const toque = Gesture.Tap().onEnd(() => {
    runOnJS(onIntercambiar)()
  })

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }))

  return (
    <GestureDetector gesture={Gesture.Race(toque, arrastre)}>
      <Animated.View
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: ancho,
            height: alto,
            borderRadius: radius.md,
            overflow: 'hidden',
            /* El anillo de la clase: sin él, un tile de video claro sobre un
               video claro no tiene borde y se lee como un recorte sucio. */
            borderWidth: sobreVideo.anilloAncho,
            borderColor: sobreVideo.anillo,
            backgroundColor: 'rgb(5,5,8)',
          },
          estilo,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  )
}
