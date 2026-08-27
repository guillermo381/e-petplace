/**
 * ModalDosAlturas — la ficha clínica mientras se atiende (S106-B, OBRA 6).
 *
 * **El veterinario escribe SIN dejar de ver al animal.** Ése es el acto entero,
 * y de ahí sale cada decisión de abajo.
 *
 * ── TRES POSICIONES CON IMÁN, Y NINGUNA ES «DONDE LO SOLTASTE» ─────────────
 * `cerrado` (solo el asa) · `medio` (~50 %) · `completo` (~90 %). Se arrastra
 * libre y **al soltar va a la más cercana**, con la velocidad contando: un
 * envión hacia arriba lleva a la de arriba aunque el dedo no haya llegado.
 * *Eso es lo que hace que se sienta físico en vez de obediente.*
 *
 * ── 🔴 AUN EN COMPLETO QUEDA VIDEO ARRIBA — y no es estética ───────────────
 * `completo` es **90 %, jamás 100 %**. La franja que queda es el animal.
 * *Un panel que tapa el 100 % convierte «atender por video» en «llenar un
 * formulario», que es exactamente el acto que esta pantalla no es.*
 *
 * ── LA FÍSICA: RESORTE SUAVE, JAMÁS REBOTE DE JUGUETE ──────────────────────
 * `withSpring` con amortiguación ALTA (`damping: 22`): llega, se asienta y se
 * queda. **`motion.easing.spring` —el bezier con overshoot— está PROHIBIDO
 * acá**: ese rebote es para confirmaciones táctiles alegres (Ley 6), y esta
 * pantalla es una consulta médica. *Un panel que hace «boing» sobre un animal
 * enfermo es la clase de detalle que hace desconfiar de todo lo demás.*
 *
 * ── EL TECLADO NO EMPUJA EL VIDEO ──────────────────────────────────────────
 * Cuando el teclado sube, **el modal NO se mueve**: crece por dentro (su
 * contenido scrollea y reserva el alto del teclado). *Si el video saltara cada
 * vez que se toca un campo, no se podría mirar al animal y escribir a la vez —
 * que es literalmente lo que el veterinario está haciendo.*
 *
 * ── 🔴 BAJAR NO PUEDE PERDER TRABAJO ───────────────────────────────────────
 * Con `hayCambiosSinGuardar`, bajar a `cerrado` **pide confirmación** en vez de
 * cerrar. *Perder una nota clínica a medio escribir por un gesto es de los
 * errores que no se perdonan* — y el gesto de bajar es fácil de hacer sin
 * querer, que es justo lo que lo vuelve peligroso.
 * **La confirmación la hace el consumidor** (`onPedirConfirmacion`): la pieza
 * no monta una Hoja adentro de otra.
 *
 * ── EL ASA NUNCA SE ESCONDE ────────────────────────────────────────────────
 * Es la única pista de que hay algo abajo. Con el chrome oculto, sigue.
 * (Ver `SuperficieLlamada`, OBRA 4.)
 */

import { useCallback, useEffect, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { sobreVideo } from '../tokens/sobreVideo'
import { useTheme } from '../ThemeProvider'
import { Chevron } from './chevron'
import { Texto } from './Texto'

export type AlturaModal = 'cerrado' | 'medio' | 'completo'

export interface ModalDosAlturasProps {
  altura: AlturaModal
  onAltura: (a: AlturaModal) => void
  /** Alto total de la pantalla. Las tres posiciones se derivan de acá. */
  altoPantalla: number
  children: ReactNode
  /** Voz del asa (a11y). */
  etiquetaAsa: string
  /** Si hay texto sin guardar, bajar a `cerrado` pide confirmación. */
  hayCambiosSinGuardar?: boolean
  /** Lo llama en vez de cerrar cuando hay cambios. El consumidor decide cómo pregunta. */
  onPedirConfirmacion?: () => void
  /** Alto que ocupa el teclado. El modal crece POR DENTRO — el video no se mueve. */
  altoTeclado?: number
  insetBottom?: number
}

/** Fracciones del alto de pantalla que ocupa el panel en cada posición. */
const FRACCION: Record<AlturaModal, number> = {
  cerrado: 0,
  medio: 0.5,
  /* 90 y no 100: la franja que sobra es el animal. */
  completo: 0.9,
}

const ASA_ALTO = 28

/** Resorte SUAVE. `damping` alto = llega y se queda; sin overshoot. */
const RESORTE = { damping: 22, stiffness: 220, mass: 0.9 } as const

export function ModalDosAlturas({
  altura,
  onAltura,
  altoPantalla,
  children,
  etiquetaAsa,
  hayCambiosSinGuardar = false,
  onPedirConfirmacion,
  altoTeclado = 0,
  insetBottom = 0,
}: ModalDosAlturasProps) {
  const { theme } = useTheme()
  /* R41 · el hook va SUELTO y se combina después: `memorial || useReducedMotion()`
     sería una llamada condicional. Se comparte brazo con memorial (Ley 8) —
     **reducir movimiento es quitarle el VIAJE, no el momento**: el panel llega
     a la misma altura, sin resorte. */
  const reduceMotion = useReducedMotion()
  const sinViaje = theme.mode === 'memorial' || reduceMotion
  const asentar = useCallback(
    (destino: number) => (sinViaje ? withTiming(destino, { duration: 0 }) : withSpring(destino, RESORTE)),
    [sinViaje],
  )

  const altoDe = useCallback((a: AlturaModal) => Math.round(altoPantalla * FRACCION[a]) + ASA_ALTO, [altoPantalla])

  const h = useSharedValue(altoDe(altura))
  const iniH = useSharedValue(0)

  /* 🔴 EL TOPE Y EL PISO VIVEN EN SHARED VALUES, NO SE CALCULAN EN EL GESTO.
     **Crash confirmado por logcat** (S106, 27-ago): `onUpdate` llamaba
     `altoDe(...)` —un `useCallback`, o sea una función del hilo JS— desde el
     hilo UI, y Worklets mata la app:
       `[Worklets] Tried to synchronously call a Remote Function.
        Called "anonymous" on the UI Runtime.` → `ModalDosAlturasTsx2`

     Es el MISMO defecto que `TileVideoPropio` (S106 t2) y por eso la cura tiene
     la misma forma: **por el hilo sólo cruzan VALORES.** Se eligió esto y no
     marcar `altoDe` como `'worklet'` porque *una directiva se puede olvidar al
     editar y su ausencia no rompe el build: rompe la app en la mano del
     usuario.* Un `useSharedValue` no se olvida — el worklet no tiene otra cosa
     que leer. */
  const tope = useSharedValue(altoDe('completo'))
  const piso = useSharedValue(altoDe('cerrado'))
  useEffect(() => {
    tope.value = altoDe('completo')
    piso.value = altoDe('cerrado')
  }, [altoDe, tope, piso])

  useEffect(() => {
    h.value = asentar(altoDe(altura))
  }, [altura, altoDe, asentar, h])

  /** A dónde va al soltar: la más cercana, con el envión contando. */
  const resolver = useCallback(
    (altoActual: number, velocidad: number) => {
      // El envión vale ~120 ms de recorrido: un flick corto ya cambia de destino.
      const proyectado = altoActual + velocidad * 0.12
      const candidatas: AlturaModal[] = ['cerrado', 'medio', 'completo']
      let mejor: AlturaModal = 'cerrado'
      let min = Infinity
      for (const c of candidatas) {
        const d = Math.abs(altoDe(c) - proyectado)
        if (d < min) { min = d; mejor = c }
      }
      // 🔴 Bajar del todo con trabajo sin guardar: se pregunta, no se cierra.
      if (mejor === 'cerrado' && hayCambiosSinGuardar && onPedirConfirmacion) {
        h.value = asentar(altoDe(altura))
        onPedirConfirmacion()
        return
      }
      onAltura(mejor)
    },
    [altoDe, altura, asentar, h, hayCambiosSinGuardar, onAltura, onPedirConfirmacion],
  )

  const arrastre = Gesture.Pan()
    .onStart(() => { iniH.value = h.value })
    .onUpdate((e) => {
      // Arrastrar hacia ARRIBA (translationY negativo) hace crecer el panel.
      const siguiente = iniH.value - e.translationY
      h.value = Math.min(tope.value, Math.max(piso.value, siguiente))
    })
    .onEnd((e) => {
      runOnJS(resolver)(h.value, -e.velocityY)
    })

  const estilo = useAnimatedStyle(() => ({ height: h.value }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.bg.card,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          overflow: 'hidden',
        },
        estilo,
      ]}
    >
      {/* ── EL ASA. Nunca se esconde: es la única pista de que hay algo abajo. */}
      <GestureDetector gesture={arrastre}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={etiquetaAsa}
          accessibilityValue={{ text: altura }}
          style={{ height: ASA_ALTO, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: 40, height: 4, borderRadius: radius.full, backgroundColor: theme.border.default }} />
        </View>
      </GestureDetector>

      {/* ── El contenido. El teclado se compensa ACÁ ADENTRO: el panel reserva
             su alto y el video de arriba no se entera. */}
      <View style={{ flex: 1, paddingBottom: altoTeclado > 0 ? altoTeclado : insetBottom, paddingHorizontal: spacing[4] }}>
        {children}
      </View>
    </Animated.View>
  )
}

/**
 * EL ASA SUELTA — la que se monta SOBRE EL VIDEO cuando el panel está cerrado.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 LAS DOS ASAS DE ESTE ARCHIVO HACEN TRABAJOS DISTINTOS, Y POR ESO SÓLO
 *    UNA CAMBIÓ.
 * ═══════════════════════════════════════════════════════════════════════════
 * · **La de arriba, dentro del panel**, se apoya en la superficie del panel:
 *   el borde de la hoja YA SE VE, y ahí la barra pelada es la convención
 *   correcta. **No se toca.**
 * · **Ésta flota sobre el video con NADA debajo.** La misma barra, sin hoja
 *   que la sostenga, no es un asa: es una línea sobre una foto.
 *
 * *«Hacer legible el asa» aplicado a las dos habría arruinado la que
 * funciona.*
 *
 * ── EL REPORTE Y LAS DOS CAUSAS ────────────────────────────────────────────
 * El founder la vio como **«una rayita»** y —lo más caro— **no detectó que
 * hubiera algo que subir**. Son dos defectos, no uno:
 *
 * **① NO TENÍA PISO.** Papel a `opacity 0.7` sobre video crudo: un valor que
 * **no se puede medir**, porque no hay superficie contra la cual medirlo — es
 * literalmente lo que le pasó al `anillo` en su primera vuelta, y es mi propia
 * **L-425** cobrándose otra vez. *El 0,70 no era el error: la falta de
 * superficie sí.* Ahora el contenido vive sobre **`banda`, que está medida**
 * (8.27 sobre video blanco · 19.47 sobre negro).
 *
 * **② NO DECÍA QUÉ HABÍA ABAJO — y la palabra ya estaba acá.** La pieza
 * recibía `etiqueta` (*«Notas y historia»*) **y la gastaba entera en el lector
 * de pantalla**: el que ve recibía 4 px de línea, el que escucha recibía la
 * frase. *Una barra dice «esto se arrastra»; sólo una palabra dice QUÉ sube.*
 * ⇒ el rótulo se dibuja. **Cero string nuevo, cero pedido a nadie: el material
 * ya estaba adentro, mal gastado.**
 *
 * ── 🔴 ③ Y LA PASADA DE REMOCIÓN ENCONTRÓ QUE LA BARRA MENTÍA ──────────────
 * Al montarla sobre su banda apareció lo que la barra sola escondía: **esta
 * pieza NO SE ARRASTRA.** Su contrato es `onPress` — un toque que cambia de
 * altura. **El agarre anuncia un gesto que este control no implementa**, y eso
 * es Ley 23 en su forma exacta: *la puerta no ofrece lo que va a rechazar.*
 *
 * ⇒ **la barra sale** (Ley 16). *Un control que se toca no puede vestirse como
 * uno que se arrastra.* Lo que queda —**la palabra y la flecha**— es lo que de
 * verdad contesta la queja del founder: no «esto se agarra», sino **QUÉ sube**.
 *
 * *(El agarre de arriba, dentro del panel, SÍ arrastra y por eso lo conserva.
 * Si algún día el estado cerrado gana arrastre, la barra vuelve CON él —
 * jamás antes.)*
 *
 * ── LA FORMA ES LA DE LA CASA, NO UNA INVENCIÓN ────────────────────────────
 * Banda + rótulo + **chevron `arriba`**, y la dirección no es adorno: **E14
 * dice que ⌃ despliega EN EL LUGAR**, que es exactamente lo que hace (el panel
 * sube; no lleva a otra pantalla). El `color` del chevron se pasa explícito
 * porque su propia ficha lo reserva para eso: *«cuando la flecha vive sobre
 * una superficie que le cambia el contraste»*.
 *
 * **Píldora que abraza su contenido, no franja de ancho completo** — y eso es
 * de MONTAJE, medido: hoy se monta flotando (`bottom: insetBottom + 120`),
 * con video debajo. *Un borde de hoja necesita ser el borde de algo; flotando
 * a media pantalla sería una hoja sin hoja.* Como píldora se lee igual de bien
 * donde está y no se rompe si mañana baja al pie.
 *
 * ── LO QUE NO HACE ─────────────────────────────────────────────────────────
 * **No se agranda para verse.** *El defecto nunca fue el tamaño — 40×4 es la
 * convención, y engordar la barra sólo habría dado una línea más gorda.*
 */
export function AsaModal({ etiqueta, onPress }: { etiqueta: string; onPress: () => void }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        onPress={onPress}
        style={{
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[1],
          paddingHorizontal: spacing[4],
          borderRadius: radius.full,
          backgroundColor: sobreVideo.banda,
        }}
      >
        {/* El rótulo dice QUÉ sube. La barra sola nunca pudo decirlo — y eso
            era la mitad cara del reporte: no «no la veo», sino «no sé que hay
            algo». */}
        <Texto variante="apoyo" color="sobreVideo">
          {etiqueta}
        </Texto>
        <Chevron direccion="arriba" color={sobreVideo.contenido} lado={16} />
      </Pressable>
    </View>
  )
}
