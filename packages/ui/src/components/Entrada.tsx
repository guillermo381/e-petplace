/**
 * Entrada — EL PORTADOR de §5 LA ENTRADA (S81-B; la firmada del
 * REGISTRO S80: **120 ms** de escalón · 300 ms · translateY desde 15 ·
 * la física de la casa).
 *
 * ⏪ S97+-B — ESTE HEADER DECÍA «45 ms de escalón» Y LA CONSTANTE DE
 * ABAJO DICE 120 DESDE S81. La enmienda del founder (45 → 120, con su
 * porqué medido) se aplicó en el código y no en la primera línea del
 * archivo, así que **la pieza se contradecía a sí misma**: quien leyera
 * el header —que es lo que se lee— se llevaba el número derogado. Y no
 * se quedó adentro: el 45 volvió a viajar en un contrato de pedido de
 * S97. *La prosa derivada decae mientras el objeto no (L-141), y acá el
 * objeto y su rótulo vivían en el mismo archivo.*
 *
 * LA CONDICIÓN DE LA MESA (patrón FilaCita): la pantalla declara QUE
 * entra y su ORDEN DE LECTURA — **JAMÁS los números**. Duración,
 * escalón, desplazamiento y curva viven ACÁ y ninguna pantalla puede
 * romper la ley: si este componente expusiera `duracion` o `delay`,
 * estaría mal hecho.
 *
 * L-c MANDA (el criterio de uso, en el JSDoc porque es exigible): la
 * entrada escalonada existe para que el ojo sepa POR DÓNDE EMPEZAR A
 * LEER. **Si al quitarla la pantalla dice lo mismo, sobraba** — no se
 * monta por decoración. `orden` es posición en la LECTURA (0 = lo
 * primero que el ojo debe encontrar), no un slot libre.
 *
 * Memorial **y reduce-motion** degradan (Ley 8: nada se mueve, solo
 * fades): fade puro, sin desplazamiento, MISMO tempo y mismo escalón.
 * Ley 6 intacta: 300 ms ≤ el techo de UI, curva easeOut de la casa
 * (entradas), jamás rebote.
 *
 * Uso:
 *   <Entrada><Titulo/></Entrada>
 *   <Entrada orden={1}><Cuerpo/></Entrada>
 *   <Entrada orden={2}><Cta/></Entrada>
 */

import { useEffect, type ReactNode } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

// Los números de la ley — PRIVADOS a propósito (la condición de la mesa).
/** ⏪ S97+-B · el 300 DEJA DE SER UN LITERAL ACÁ y pasa a salir del token
 *  (`motion.duration.estandar`). MISMO VALOR, cero cambio visual: lo que
 *  cambia es que deja de haber dos lugares donde vive el mismo número.
 *  El porqué: N10 (Norte, 13-ago) declara el vocabulario del movimiento
 *  CERRADO en tres duraciones, y el 300 —que esta pieza llamaba «techo
 *  de Ley 6: INTOCABLE»— era una ley escrita en una constante local. Un
 *  vocabulario cerrado cuyos valores no son tokens lo vuelve a teclear
 *  cada pieza. La condición de la mesa se mantiene INTACTA: el número
 *  sigue siendo PRIVADO para el consumidor (`Entrada` no expone
 *  `duracion` ni `delay`); lo único que cambia es de dónde lo lee. */
const DURACION = motion.duration.estandar // techo de Ley 6 — NO SE TOCA
const DESDE_Y = 15
const CURVA = Easing.bezier(...motion.easing.easeOut.bezier)
/** ESCALÓN 120 — FIRMADO (S81, orden de mesa "sin gate"): §5 pasa de
 *  45 a 120 (motion.stagger.slow, token de la casa). El porqué quedó
 *  medido: con 45, tres bloques resuelven en ~390 ms — por debajo del
 *  umbral en que el ojo separa secuencia de simultaneidad ("hay un
 *  orden pero no lo cacho", founder). La LETRA de §5 la enmienda A con
 *  la firma. La duración 300 es techo de Ley 6: INTOCABLE. */
const ESCALON = motion.stagger.slow

export interface EntradaProps {
  /** Posición en el ORDEN DE LECTURA (0 = lo primero). Semántica, no física. */
  orden?: number
  children: ReactNode
}

export function Entrada({ orden = 0, children }: EntradaProps) {
  const { theme } = useTheme()
  /** 🔴 S97+-B · REDUCE-MOTION ENTRA AL MISMO BRAZO QUE MEMORIAL, y el
   *  hallazgo es de CLASE: esta pieza —el portador de §5, la entrada de
   *  TODA la casa— miraba solo `memorial`. Quien pide menos movimiento en
   *  su teléfono **seguía viendo `FadeInDown` en cada pantalla**: el
   *  desplazamiento que pidió no ver.
   *
   *  Se cura acá porque acá está el hueco entero: **`Entrada` es UN
   *  portador con N consumidores**, así que una línea cubre todas las
   *  entradas de las dos apps. *Ese fue el argumento para que los números
   *  vivieran privados adentro, y hoy paga en la dirección contraria.*
   *
   *  Y COMPARTE BRAZO CON MEMORIAL A PROPÓSITO, no por ahorro: los dos
   *  piden lo mismo —que nada se desplace— y la casa ya tiene esa receta
   *  escrita y firmada (fade puro, MISMO tempo, mismo escalón). *Reducir
   *  movimiento no es acortar el momento: es quitarle el viaje, no el
   *  tiempo.* El escalonado se conserva entero, que es lo que sostiene el
   *  orden de lectura (L-c).
   *
   *  ⚠️ CENSADO Y NO CURADO ENTERO: de las 63 piezas de `ui`, **solo
   *  TRES miran `useReducedMotion`** (`Destape`, `BarraTabs`,
   *  `PuertaDeOficio`) — ahora cuatro. Barrer las demás es una tanda con
   *  su propio censo, no un renglón de ésta; queda declarado. */
  const reduceMotion = useReducedMotion()
  const quieto = theme.mode === 'memorial' || reduceMotion

  /* 🔴 S97+-B · SE DEJAN LAS *LAYOUT ANIMATIONS* Y LA ENTRADA PASA A UN
     ESTILO ANIMADO. Mismo gesto, mismos números, mismo escalón — lo que
     cambia es que **deja de tocar el layout**.

     EL DEFECTO, medido por C en el navegador: `FadeIn`/`FadeInDown` de
     Reanimated dejan el `Animated.View` en **`position: absolute`** en
     RN-web, y **un hijo absoluto no aporta alto a su padre**. En una
     GRILLA eso colapsa la celda a **altura 0** y las baldosas se dibujan
     encima de lo que sigue:

         d0  DIV     186×0                  ← la celda de la grilla
         d1  DIV     186×186  ABSOLUTE      ← `Entrada`
         d2  BUTTON  186×186

     ⇒ ALCANZA A CUALQUIER CONTENEDOR QUE NECESITE EL ALTO DE SUS HIJOS,
     no solo a `Baldosa`. Por eso se cura acá, en el portador, y no en la
     pantalla que lo sufrió.

     POR QUÉ ESTA CURA Y NO UN AJUSTE: **no depende de que yo confirme el
     mecanismo exacto de Reanimated en web.** Un `useAnimatedStyle` no es
     una layout animation: no posiciona, no mide, no reordena — solo pinta
     `opacity` y `transform`. *La categoría entera del defecto desaparece
     por construcción, en vez de esquivarse con un contra-valor.*

     LO QUE NO CAMBIA, y es la condición de la mesa: duración, escalón,
     desplazamiento y curva siguen siendo PRIVADOS acá; el consumidor
     sigue declarando solo QUE entra y su orden de lectura. El gesto se
     ve igual.

     ⚠️ El síntoma lo midió C en RN-web; en nativo Reanimated puede no
     posicionar así y el teléfono probablemente lo perdonaba. **No se
     afirma** — se cura igual, porque una entrada que altera el layout de
     quien la monta es frágil aunque una plataforma la salve. */
  const v = useSharedValue(0)
  useEffect(() => {
    v.value = withDelay(orden * ESCALON, withTiming(1, { duration: DURACION, easing: CURVA }))
    // Entrada de MONTAJE: corre una vez, como la layout animation que
    // reemplaza.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const estilo = useAnimatedStyle(() => ({
    opacity: v.value,
    // Memorial y reduce-motion: fade puro, sin desplazamiento (Ley 8).
    transform: [{ translateY: quieto ? 0 : (1 - v.value) * DESDE_Y }],
  }))

  return <Animated.View style={estilo}>{children}</Animated.View>
}
