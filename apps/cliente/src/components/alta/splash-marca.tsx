import { useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import {
  IsotipoV5,
  Personaje,
  gradients,
  palette,
  radius,
  spacing,
  type EspeciePersonaje,
} from '@epetplace/ui'

/**
 * 00 · SPLASH — la marca mientras se resuelve la sesión (S116-C lote 3).
 *
 * ── LO QUE SE VE, en el orden en que aparece ──────────────────────────────
 * ① la pantalla entera magenta con la nariz al centro, **sola** · ② en un
 * respiro la nariz se asienta (crece apenas y vuelve) y aparece un halo
 * detrás · ③ abajo entran, escalonados, los seis personajes; el del centro es
 * más grande y **cada tres segundos la cara grande se funde en la siguiente**
 * —fundido cruzado, sin deslizar— mientras la fila marca cuál es.
 *
 * ── 🔴 NO HAY BARRA DE CARGA, Y ES UNA CORRECCIÓN AL MOCK ────────────────
 * El plan §5 lo dice textual: *«la barra "Perros · Cargando" no simula
 * progreso. Es el paso de los personajes o desaparece»*. **La fila ES el
 * indicador.** *Una barra que se llena sin saber cuánto falta es una promesa
 * que el código no puede cumplir* — y acá no se puede saber: lo que se espera
 * es una respuesta de red.
 *
 * ── LA SALIDA NO ESPERA A LA VUELTA ──────────────────────────────────────
 * Cuando la sesión resuelve, se sale **en el acto**: no se completa el ciclo
 * de tres segundos ni se espera a ninguna cara. *Hacer esperar a alguien para
 * terminar una animación es cobrarle el adorno.*
 *
 * ── QUÉ PASA SI TARDA ────────────────────────────────────────────────────
 * Su consumidor (`index.tsx`) monta el estado digno con reintento a los 8 s.
 * **Acá no se dice nada de la demora**: esta pieza muestra la marca, no
 * diagnostica. *Dos superficies diciendo «está tardando» es una de más.*
 *
 * ⚠️ **`useReducedMotion`**: con la preferencia puesta, **nada se mueve** —
 * la nariz queda quieta, el halo fijo y la cara grande no rota. *Un splash es
 * puro movimiento: si alguien pidió no verlo, lo que queda es la marca
 * quieta, que sigue diciendo lo mismo.* (Misma ley que `usePresionado` en el
 * lote 2 de B, letra §1.11.)
 */

/** El orden de las caras. `otro` es la nariz, que cierra la vuelta. */
const CARAS: readonly EspeciePersonaje[] = ['perro', 'gato', 'conejo', 'ave', 'roedor', 'otro']

/** Cada tres segundos, textual en el encargo. */
const MS_POR_CARA = 3000
/** «personajes en fundido 500 ms» — letra §2, Movimiento. */
const MS_FUNDIDO = 500

export function SplashMarca() {
  const [indice, setIndice] = useState(0)
  const quieto = useReducedMotion()

  /* El respiro de la nariz: crece apenas y vuelve. UNA vez y después queda —
     un latido permanente convertiría la marca en un indicador de actividad,
     que es justamente lo que esta pantalla decidió no tener. */
  const escala = useSharedValue(1)
  /* El halo entra DESPUÉS del respiro: primero la marca sola, como pide el
     encargo («Nada más al principio»). */
  const halo = useSharedValue(0)
  const caraOpacidad = useSharedValue(1)

  useEffect(() => {
    if (quieto) {
      halo.value = 1
      return
    }
    escala.value = withSequence(
      withTiming(1.06, { duration: 420, easing: Easing.bezier(0.32, 0.72, 0, 1) }),
      withTiming(1, { duration: 380, easing: Easing.bezier(0.32, 0.72, 0, 1) }),
    )
    halo.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
  }, [quieto, escala, halo])

  /* El fundido cruzado de la cara grande. **Se apaga y se prende sobre el
     cambio de índice**, no se desliza: el encargo lo pide así y además un
     deslizamiento sugeriría una lista que se puede recorrer con el dedo. */
  useEffect(() => {
    if (quieto) return
    const id = setInterval(() => {
      caraOpacidad.value = withSequence(
        withTiming(0, { duration: MS_FUNDIDO / 2, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: MS_FUNDIDO / 2, easing: Easing.inOut(Easing.quad) }),
      )
      setTimeout(() => setIndice((i) => (i + 1) % CARAS.length), MS_FUNDIDO / 2)
    }, MS_POR_CARA)
    return () => clearInterval(id)
  }, [quieto, caraOpacidad])

  const estiloNariz = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }))
  const estiloHalo = useAnimatedStyle(() => ({ opacity: halo.value * 0.18 }))
  const estiloCara = useAnimatedStyle(() => ({ opacity: caraOpacidad.value }))

  return (
    <View style={{ flex: 1, backgroundColor: palette.magentaAccion, alignItems: 'center', justifyContent: 'center' }}>
      {/* ② EL HALO — detrás de la nariz, no encima. Es luz, no un aro: por eso
          es un círculo suave del rosa de la marca y no un borde. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: 260,
            height: 260,
            /* `radius.full` y no la mitad del lado: la casa tiene UNA escala y
               un círculo es la píldora llevada al cuadrado. *Un 130 tecleado
               además se rompe solo el día que alguien cambie el 260.* */
            borderRadius: radius.full,
            backgroundColor: palette.magentaLuz,
          },
          estiloHalo,
        ]}
      />

      {/* ① LA NARIZ — la marca, sobre magenta ⇒ la versión para fondo oscuro. */}
      <Animated.View style={estiloNariz}>
        <IsotipoV5 sobre="oscuro" tamano="splash" />
      </Animated.View>

      {/* ③ LA FILA — el indicador. La cara grande al centro se funde; las
          otras marcan cuál es. *La fila no es decoración: es lo único que
          dice que algo está pasando.* */}
      <View style={{ position: 'absolute', bottom: spacing[10], alignItems: 'center', gap: spacing[4] }}>
        <Animated.View style={estiloCara}>
          <Personaje especie={CARAS[indice]} tamano="hogar" fondo="blanco" />
        </Animated.View>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          {CARAS.map((especie, i) => (
            <Personaje
              key={especie}
              especie={especie}
              tamano="fila"
              fondo="blanco"
              elegido={i === indice}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

/**
 * EL PASO DE 00 A 01 — el magenta se oscurece al degradado de entrada.
 *
 * El encargo lo describe como un solo gesto: *«el magenta se oscurece al
 * degradado de entrada mientras la nariz se achica y viaja hasta su lugar
 * arriba en 01; la nariz es el mismo objeto todo el tiempo»*.
 *
 * 🔴 **LO QUE ESTA PIEZA HACE Y LO QUE NO, dicho para que nadie lea de más:**
 * el fondo sí se oscurece acá. **La nariz NO viaja entre las dos pantallas**:
 * eso es un *shared element* entre rutas, y `bienvenida.tsx` ya dejó escrito
 * en S104 por qué no se hace desde una pantalla —*«esas rutas viven sueltas en
 * `app/`, así que agruparlas toca la navegación»*, y C no reestructura la
 * navegación sin firma—. *La continuidad que se entrega es de COLOR y de
 * posición: 01 abre con la nariz arriba, en el mismo eje, sobre el degradado
 * al que este fondo acaba de llegar.* Queda declarado como lo que es: una
 * continuidad compuesta, no un objeto que viaja.
 */
export function SalidaDelSplash({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={gradients.entradaV5.colors as unknown as readonly [string, string, ...string[]]}
      locations={gradients.entradaV5.locations as unknown as readonly [number, number, ...number[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.05, y: 1 }}
      style={{ flex: 1 }}
    >
      {children}
    </LinearGradient>
  )
}
