import { useEffect, useState } from 'react'
import { Pressable, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { AbanicoAsistente, type AtajoAsistente } from './AbanicoAsistente'
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
 * **②bis 🔴 EL «SIN PARAR» SE RETIRA — y la razón es de máquina, no de
 * gusto.** C midió que **una animación infinita deja la ventana de Android
 * permanentemente NO-IDLE**: `uiautomator` nunca vuelve a reportar reposo,
 * así que **toda captura y toda prueba automatizada de esa pantalla se
 * vuelve imposible** — no sólo las de esta pieza: las de cualquiera que
 * comparta pantalla con el asistente. *Un elemento decorativo que apaga el
 * instrumental de toda la casa cuesta más de lo que aporta.*
 *
 * Firma de la mesa: **respira TRES CICLOS al montar y descansa; vuelve a
 * respirar al volver a la raíz o al scrollear.** Lo segundo lo dispara el
 * consumidor con `despertar` — la pieza no sabe qué es «volver a la raíz».
 *
 * ⚠️ **Y el «algo vivo esperando» NO se pierde:** el halo **se queda
 * puesto** en su punto más contraído y más visible. *Lo que descansa es el
 * movimiento, no la presencia.*
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
/* 🔴 **UNIÓN, no props sueltas — dos estados y nada en el medio (lote 8).**
 * O el botón **abre su hoja** (y entonces necesita SÍ O SÍ el campo de
 * pregunta y su lista de atajos), o **hace otra cosa** con su `onPress`.
 * *Un asistente con atajos y sin campo, o con campo y sin atajos, no es una
 * configuración: es una hoja a medio construir* — y así no compila.
 *
 * ⚠️ **Los atajos pueden venir VACÍOS y eso sí es legal:** una pantalla
 * donde ningún atajo aplica abre la hoja con el campo solo. *Lo que no puede
 * pasar es que la pantalla se olvide de decidir.* */
type ConAbanico = {
  onPress?: never
  /** «Pregúntale a Nexo» — la fila de arriba del abanico, ya redactada. */
  vozPreguntar: string
  /** Qué hacer al tocar esa fila. **La pieza no pregunta nada**: entrega el
   *  gesto y se cierra. */
  onPreguntar: () => void
  /** **C decide cuáles monta por pantalla** — la pieza no trae una lista
   *  adentro. *Un atajo a «peso» en una pantalla de pago no es un atajo: es
   *  ruido.* */
  atajos: readonly AtajoAsistente[]
}
type SinHoja = {
  onPress: () => void
  vozPreguntar?: never
  onPreguntar?: never
  atajos?: never
}

export type BotonAsistenteProps = (ConAbanico | SinHoja) & {
  /** El consumidor decide: raíz sí, empujada no. Default `true` para que
   *  olvidarlo no lo esconda — un asistente ausente no se reclama. */
  visible?: boolean
  /** La voz del lector de pantalla. Sin default: la pieza no sabe cómo se
   *  llama el asistente en el idioma de quien mira (Ley 3 — la voz es del
   *  riel, jamás de la pieza). */
  etiqueta: string
  /** 🔴 **EL DESPERTADOR.** Cada vez que este número CAMBIA, el halo vuelve
   *  a respirar sus tres ciclos. La orden pide que respire *«al volver a la
   *  raíz o al scrollear»* y **ninguna de las dos cosas las puede saber
   *  esta pieza**: no conoce la navegación ni el scroll de quien la monta.
   *
   *  ⚠️ **Es un número que cambia y no un `boolean`** a propósito: con un
   *  booleano habría que apagarlo y volverlo a prender para pedir otra
   *  vuelta, y *quien se olvide del apagado deja el asistente sin respirar
   *  para siempre sin que nada falle*. Un contador que sube siempre
   *  dispara.
   *
   *  Sin pasarlo, respira una vez al montar y descansa — que es el
   *  comportamiento mínimo que la orden pide. */
  despertar?: number
}

/** Cuánto se sale el halo del botón en su punto más ancho, en píxeles.
 *  **Se DERIVA de la escala y del lado, no se teclea**: el contenedor
 *  tiene que ser exactamente lo bastante grande para que el halo quepa, y
 *  el día que la escala cambie el margen la sigue solo. */
/** Cuántas respiraciones al montar (y en cada `despertar`). Firma de la
 *  mesa: *«respira tres ciclos… y descansa»*. */
const CICLOS_AL_LLEGAR = 3

function margenDelHalo(lado: number): number {
  return Math.ceil((lado * (motion.v5.asistenteHaloEscala - 1)) / 2)
}

export function BotonAsistente(props: BotonAsistenteProps) {
  const { visible = true, etiqueta, despertar = 0 } = props
  const [abanicoAbierto, setAbanicoAbierto] = useState(false)
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.97)
  const sinMovimiento = useReducedMotion()
  const insets = useSafeAreaInsets()

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
    /* Arranca siempre desde el punto contraído: si `despertar` cambia a
       mitad de una respiración anterior, la nueva no empieza por la mitad. */
    respiro.value = 0
    respiro.value = withRepeat(
      withTiming(1, {
        /* 🔴 **La cadencia se toma del ORBE y no se copia** — la orden
           pide que «se lea como el orbe viejo», y dos respiraciones con el
           mismo número escrito en dos lados se separan el día que alguien
           ajuste una.
           ⚠️ **DISCREPANCIA MEDIDA, declarada y NO curada acá:** el
           comentario del token dice *«el ciclo… ida y vuelta»*, pero su
           otro consumidor —`PresenciaCoach`, el orbe— lo usa **por
           dirección**, así que su ciclo completo son 8 s y no 4. *Se copia
           al orbe porque la orden pide que se lean IGUAL; corregir el
           token cambiaría el ritmo del orbe, y el orbe no es de este
           lote.* Consecuencia a la vista: tres ciclos son **~24 s**. */
        duration: motion.coach.respiracionMs,
        easing: Easing.bezier(...motion.easing.easeInOut.bezier),
      }),
      /* 🔴 **TRES CICLOS Y DESCANSA.** Con `reverse` cada repetición es una
         dirección ⇒ un ciclo son DOS. Y el número par importa: termina
         donde empezó —contraído y visible—, no a mitad de camino. */
      CICLOS_AL_LLEGAR * 2,
      true,
    )
  }, [sinMovimiento, respiro, despertar])

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
     * quedaría corto, que es el defecto que este token vino a curar.
     *
     * 🔴 **Y SE APOYA SOBRE LA BARRA, no al lado (lote 6).** El founder lo
     * vio tapado por la barra de tabs en un Samsung con tres teclas. La
     * cuenta era `barraAlto + separación` **y le faltaba la barra del
     * sistema**: donde el navegador no reserva el inset, los 92 de la barra
     * empiezan más arriba de lo que este `bottom` supone y el disco queda
     * por debajo. ⇒ se suma **el inset que falta de verdad, medido** — no
     * `insets.bottom` crudo, que adentro de `(tabs)` lo contaría dos veces
     * y lo dejaría flotando. *Es el mismo par descoordinado de la onda, en
     * el otro extremo de la misma pantalla.* */
    bottom: insets.bottom + medidas.barraAlto + SEPARACION_ASISTENTE - margen,
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
        onPress={props.onPress ?? (() => setAbanicoAbierto((a) => !a))}
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

      {/* El abanico vive ACÁ y no en la pantalla: *si cada pantalla lo
          montara, abrir el asistente sería un acto distinto en cada una* — y
          el estado de «abierto» se olvidaría de cerrarse en alguna.
          ⚠️ **El botón TAMBIÉN cierra** (`setAbanicoAbierto(a => !a)`): la
          orden dice *«se cierran tocando fuera o el botón»*, y un botón que
          sólo abre deja a quien se arrepintió buscando dónde tocar. */}
      {props.onPress === undefined && abanicoAbierto ? (
        <AbanicoAsistente
          atajos={props.atajos}
          vozPreguntar={props.vozPreguntar}
          onPreguntar={() => {
            setAbanicoAbierto(false)
            props.onPreguntar()
          }}
          onCerrar={() => setAbanicoAbierto(false)}
        />
      ) : null}
    </View>
  )
}
