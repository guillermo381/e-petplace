import { useEffect } from 'react'
import { Pressable, View, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Icono } from './Icono'
import { motion } from '../tokens/motion'
import { usePresionado } from './usePresionado'
import { medidas, SEPARACION_ASISTENTE } from '../tokens/medidas'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { shadows } from '../tokens/shadows'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **BOTÓN DEL ASISTENTE (S116-B lote 2) — NEXO flotando.**
 * Letra §1.5 («el asistente flota en toda raíz») · punto 3 del encargo.
 *
 * **PIEZA NUEVA.** No reemplaza a nadie.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ⏪ **S116-B lote 5 · LA MESA DA VUELTA LA MITAD DE ESTA PIEZA. EL ARCO
 *    QUEDA ESCRITO ENTERO, PORQUE ES LO ÚNICO QUE EVITA QUE LA PRÓXIMA
 *    MESA LO VUELVA A DAR VUELTA SIN SABER QUE YA PASÓ.**
 *
 * **① Lo que decía el lote 2, textual del encargo de entonces:** *«No
 * respira, no late, no llama la atención: está.»* Y el argumento que se
 * escribió acá para sostenerlo, que **sigue siendo correcto como
 * argumento**: un botón que late en la esquina de toda pantalla raíz es un
 * segundo elemento activo compitiendo con la pantalla (Ley 5).
 *
 * **② La enmienda, firmada:** *«BotonAsistente gana un halo que respira
 * lento (crece y se atenúa en un ciclo largo, sin parar) y el glifo de
 * destellos; que se lea como el orbe viejo: algo vivo esperando. **Es la
 * única pieza con movimiento en reposo, firmado por la mesa**; respeta
 * useReducedMotion (quieto). Sin cambiar tamaño ni posición.»*
 *
 * **③ Por qué la Ley 5 no se rompe, y no es un tecnicismo:** la mesa no
 * levantó la regla — **declaró la excepción y la acotó a UNA pieza**. La
 * Ley 5 prohíbe que compitan DOS; con una sola firmada, lo que hay es un
 * elemento vivo y todo lo demás quieto, que es exactamente lo que la ley
 * persigue. *Si mañana una segunda pieza pide respirar en reposo, esta
 * excepción es el argumento en contra, no el precedente a favor.*
 *
 * **④ El glifo de destellos YA ESTABA — medido, no agregado.** `'ia'` es
 * el trío de chispas de Kaxo re-tokenizado (ver su entrada en el
 * registry: *«el destello ES la marca»*). La orden nombra algo que la
 * pieza monta desde que nació; se declara para que nadie salga a dibujar
 * un segundo glifo de chispas.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * **Sólo vive en pantallas RAÍZ** — en las empujadas no está. Eso lo
 * decide quien lo monta (`visible`), no la pieza: una pieza no sabe si la
 * pantalla es raíz.
 * ═══════════════════════════════════════════════════════════════════════
 */
export type BotonAsistenteProps = {
  onPress: () => void
  /** El consumidor decide: raíz sí, empujada no. Default `true` para que
   *  olvidarlo no lo esconda — un asistente ausente no se reclama. */
  visible?: boolean
  /** La voz del lector de pantalla. Sin default: la pieza no sabe cómo se
   *  llama el asistente en el idioma de quien mira (Ley 3 — la voz es del
   *  riel, jamás de la pieza). */
  etiqueta: string
}

/** Cuánto se sale el halo del botón en su punto más ancho, en píxeles.
 *  **Se DERIVA de la escala y del lado, no se teclea**: el contenedor
 *  tiene que ser exactamente lo bastante grande para que el halo quepa, y
 *  el día que la escala cambie el margen la sigue solo. */
function margenDelHalo(lado: number): number {
  return Math.ceil((lado * (motion.v5.asistenteHaloEscala - 1)) / 2)
}

export function BotonAsistente({ onPress, visible = true, etiqueta }: BotonAsistenteProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.97)
  const sinMovimiento = useReducedMotion()

  /* ── LA RESPIRACIÓN ────────────────────────────────────────────────
     Un solo valor de 0 a 1 que va y vuelve para siempre; la escala y la
     opacidad se derivan de él, así que **no pueden desfasarse**: crecer y
     atenuarse son dos caras del mismo número.

     ⚠️ **El hook se declara ANTES del `return null` de `visible`.** No es
     estilo: un hook después de un return condicional cambia el orden de
     hooks entre renders y React lo rompe. *La pieza montada e invisible
     paga un `useSharedValue`, que es lo más barato que hay.* */
  const respiro = useSharedValue(0)
  useEffect(() => {
    if (sinMovimiento) {
      /* Quieto NO es «a mitad de camino»: el halo se queda en su punto
         más contraído y más visible, que es el que se lee como presencia
         sin moverse. */
      respiro.value = 0
      return
    }
    respiro.value = withRepeat(
      withTiming(1, {
        /* 🔴 **La cadencia se toma del ORBE y no se copia** — la orden
           pide que «se lea como el orbe viejo», y dos respiraciones con el
           mismo número escrito en dos lados se separan el día que alguien
           ajuste una. */
        duration: motion.coach.respiracionMs,
        easing: Easing.bezier(...motion.easing.easeInOut.bezier),
      }),
      -1,
      true,
    )
  }, [sinMovimiento, respiro])

  const estiloHalo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + respiro.value * (motion.v5.asistenteHaloEscala - 1) }],
    opacity: motion.v5.asistenteHaloOpacidad * (1 - respiro.value),
  }))

  if (!visible) return null

  const lado = medidas.asistenteDiametro
  const margen = margenDelHalo(lado)

  /* 🔴 **EL CONTENEDOR CRECE Y LA POSICIÓN SE COMPENSA — «sin cambiar
     tamaño ni posición» se cumple con aritmética, no con buena voluntad.**
     El halo es un hermano más grande que el botón, y un hijo que se sale
     de su padre puede quedar recortado en Android. ⇒ el contenedor mide
     `lado + 2·margen` y el `right`/`bottom` restan ese mismo margen, así
     que **el botón queda en el píxel exacto donde estaba**. *Si alguien
     cambia la escala del halo, las dos mitades se mueven juntas porque
     salen del mismo `margen`.* */
  const caja: ViewStyle = {
    position: 'absolute',
    right: spacing[5] - margen,
    /* Por encima de la barra de tabs: su alto + un respiro. El número sale
       del token de la barra, no de una constante — si la barra cambia de
       alto, el asistente la sigue sola. */
    /* 🔴 **La separación sale del token, no de `spacing[2]`** (S116-B):
     * `AIRE_RAIZ` la usa para calcular cuánto aire deja toda pantalla raíz
     * abajo, y si acá se escribiera el número suelto **los dos podrían
     * divergir sin que nada falle** — el botón se movería y el aire
     * quedaría corto, que es el defecto que este token vino a curar. */
    bottom: medidas.barraAlto + SEPARACION_ASISTENTE - margen,
    width: lado + margen * 2,
    height: lado + margen * 2,
    alignItems: 'center',
    justifyContent: 'center',
  }

  /* El botón: exactamente lo que era, ahora centrado en el contenedor. */
  const boton: ViewStyle = {
    width: lado,
    height: lado,
    borderRadius: radius.chipV5,
    backgroundColor: theme.accent.cta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.v5.ctaMagenta,
  }

  return (
    <View style={caja} pointerEvents="box-none">
      {/* El halo. Va PRIMERO (debajo) y no recibe toques: es atmósfera,
          no control — el área táctil sigue siendo el botón y nada más. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: lado,
            height: lado,
            borderRadius: radius.chipV5,
            backgroundColor: theme.accent.cta,
          },
          estiloHalo,
        ]}
      />
      <Animated.View style={[boton, estiloPresionado]}>
      <Pressable
        {...handlers}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        /* El área táctil ES el círculo (60 > 44), así que no necesita
           hitSlop: pedirlo de más se comería el borde de la pantalla. */
        style={{ width: lado, height: lado, alignItems: 'center', justifyContent: 'center' }}
      >
        <View>
          <Icono nombre="ia" tamano={26} registro="tinta" tinta={palette.white} />
        </View>
      </Pressable>
      </Animated.View>
    </View>
  )
}
