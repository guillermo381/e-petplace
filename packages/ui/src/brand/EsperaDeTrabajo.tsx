/**
 * EsperaDeTrabajo — LA ESPERA DEL PAGO (S101-C, orden del founder ⑦).
 *
 * ☠️ **REEMPLAZA A `EsperaDeMarca` EN LAS DOS ESPERAS DE PAGO.** La huella
 *    respirando la vio el founder y no la quiere; y además **estaba
 *    dispareja**: el paseo la tenía, la despensa no. *Dos pantallas que dicen
 *    la misma frase y se mueven distinto son dos productos.*
 *    `EsperaDeMarca` **sigue viva** donde sí rige (la lectura del carnet).
 *
 * ═══ EL MARCO QUE LA MESA DICTÓ, y cómo lo cumple cada línea ═══════════════
 *
 * **(a) el movimiento SIGNIFICA «estamos trabajando»** (L-c: acá la animación
 *      es parte del mensaje, no adorno). Por eso **no es un spinner**: un
 *      spinner gira sobre sí mismo y no llega a ningún lado — dice «esperá»,
 *      no «estoy haciendo algo». Acá **algo avanza y sale del cuadro**, una y
 *      otra vez: la forma visual de *«hay trabajo pasando»*.
 *
 * **(b) JAMÁS progreso falso.** 🔴 Y la distinción es la razón de la forma:
 *      **el segmento NO CRECE — VIAJA.** Una barra de progreso afirma *cuánto
 *      falta*; un segmento de ancho FIJO que cruza no afirma nada sobre el
 *      tiempo. *El tiempo lo tiene el proveedor, no nosotros, y una pantalla
 *      que lo insinúa está mintiendo con geometría.*
 *      Sin porcentaje, sin countdown, sin llenado. Nada acá se puede leer como
 *      «vas por la mitad».
 *
 * **(c) materiales y física de la casa.** El material es **la rampa de la
 *      firma** (`gradients.firmaUI*`: pink → violet → teal, los mismos stops
 *      del techo del Hogar) y la curva es **`motion.easing.easeInOut`**, la de
 *      la casa. No entra el isotipo: *Ley 4 gobierna el lockup, y una marca de
 *      identidad no se pone a correr de lado a lado.* La rampa es MATERIAL, y
 *      el material sí puede moverse.
 *
 * **(d) la voz escrita se queda.** Esta pieza **no dice nada** — no tiene
 *      texto y no lo va a tener. *La animación acompaña a la frase; el día que
 *      la reemplace, la espera pasó a comunicarse por adivinanza.*
 *
 * ═══ EL CICLO, y por qué no sale del vocabulario cerrado ═══════════════════
 *
 * N10 cierra el vocabulario en **150 · 300 · 520**, y las tres son de gestos
 * que **arrancan y terminan**. Esto es un `withRepeat` sin fin, igual que
 * `EsperaDeMarca` — que declaró su `CICLO_MS = 1900` como constante propia por
 * la misma razón. Se sigue ese precedente **y se dice**, en vez de teclear un
 * número suelto o de estirar el 520 a algo que no es.
 *
 * **1600 ms**, medido contra lo que acompaña: la confirmación del pago llega
 * entre ~2 s y ~30 s. Más rápido lee ansioso —*apura a quien no puede
 * apurar*—; más lento lee colgado.
 *
 * 🔴 **REDUCE-MOTION**: es el segundo `withRepeat` de la casa, y el primero
 *    nació siendo «la pieza de más valor del censo» por eso mismo. Con la
 *    preferencia puesta **el segmento queda quieto y centrado** — sigue siendo
 *    una marca de que hay algo en curso, sin movimiento continuo no solicitado.
 *
 * 🔴 **MEMORIAL**: quieta y en tinta (§2.8 — nada respira en memorial). Y las
 *    dos variables van **separadas**, como en `EsperaDeMarca`: el modo gobierna
 *    el COLOR, la preferencia gobierna el MOVIMIENTO. *Reducir movimiento no es
 *    entrar en duelo.*
 */

import { useEffect, useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { gradients } from '../tokens/palette'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

const CICLO_MS = 1600
/** El segmento ocupa poco más de un tercio: suficiente para leerse como
 *  «algo», corto para leerse como «pasando» y no como «llenando». */
const FRACCION_SEGMENTO = 0.38
const ALTO = 6

export function EsperaDeTrabajo({ alto = ALTO }: { alto?: number }) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'
  /* El hook se llama SUELTO y recién después se combina — jamás
     `esMemorial || useReducedMotion()`, que es una llamada condicional a un
     hook y cambia el orden entre renders. Patrón exacto de `EsperaDeMarca`. */
  const reduceMotion = useReducedMotion()
  const quieta = esMemorial || reduceMotion

  /* 🔴 EL ANCHO SE MIDE, NO SE TECLEA. Un número acá se equivoca en el primer
     teléfono con otro ancho, y el segmento saldría corto o se pasaría de
     largo. *Es la misma lección que le costó al carrito flotante quedar
     debajo de la barra: dos medidas que deben coincidir, saliendo de dos
     lugares distintos.* */
  const [ancho, setAncho] = useState(0)
  const x = useSharedValue(0)

  const anchoSegmento = Math.max(24, ancho * FRACCION_SEGMENTO)

  useEffect(() => {
    if (ancho === 0) return
    if (quieta) {
      // Centrado y detenido: marca que hay algo en curso, sin gesto.
      x.value = (ancho - anchoSegmento) / 2
      return
    }
    x.value = -anchoSegmento
    x.value = withRepeat(
      withTiming(ancho, {
        duration: CICLO_MS,
        easing: Easing.bezier(...motion.easing.easeInOut.bezier),
      }),
      -1,
      false,
    )
  }, [ancho, anchoSegmento, quieta, x])

  const estiloSegmento = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))

  const rampa = theme.mode === 'dark' ? gradients.firmaUIDark : gradients.firmaUILight
  /* En memorial la rampa no entra: la marca no celebra en duelo. */
  const colores = esMemorial
    ? ([theme.text.secondary, theme.text.secondary] as const)
    : rampa.colors

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    // El 0 del primer paso se ignora: mediría «no hay pista».
    if (w > 0 && Math.abs(w - ancho) > 0.5) setAncho(w)
  }

  return (
    <View
      onLayout={onLayout}
      accessibilityRole="progressbar"
      /* 🔴 Sin `value`: **el lector de pantalla tampoco recibe un número que no
         tenemos.** *Anunciar «45 %» a quien no ve la pantalla sería la misma
         mentira, dicha en voz alta.* La frase escrita ya está arriba. */
      style={{
        width: '100%',
        height: alto,
        borderRadius: radius.full,
        backgroundColor: theme.bg.hundido,
        overflow: 'hidden',
      }}
    >
      {ancho > 0 ? (
        <Animated.View
          style={[
            { width: anchoSegmento, height: alto, borderRadius: radius.full },
            estiloSegmento,
          ]}
        >
          <LinearGradient
            colors={colores as unknown as readonly [string, string, ...string[]]}
            locations={
              esMemorial
                ? undefined
                : (rampa.locations as unknown as readonly [number, number, ...number[]])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: radius.full }}
          />
        </Animated.View>
      ) : null}
    </View>
  )
}
