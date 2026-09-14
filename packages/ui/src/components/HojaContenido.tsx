/**
 * HojaContenido — LA HOJA QUE SE APOYA SOBRE EL FONDO.
 *
 * ══════════════════════════════════════════════════════════════════════
 * EL CAMBIO DE ESTRUCTURA, en una línea: **el ciruela deja de ser una
 * tarjeta y pasa a ser el FONDO de la pantalla.** El contenido vive en una
 * hoja del color del lienzo, con las dos esquinas de arriba redondeadas,
 * apoyada encima. Firma de la mesa.
 * ══════════════════════════════════════════════════════════════════════
 *
 * ── QUIÉN PINTA QUÉ, que es la decisión que ordena todo lo demás ──────
 * **El degradado lo pinta ESTA pieza, no la `Cabecera`.** Parece un
 * detalle de implementación y no lo es: la orden pide que al scrollear
 * *«el fondo se queda y su CONTENIDO se desvanece»*. Si el degradado
 * viniera dentro del nodo que se desvanece, **se desvanecería con él** y
 * la pantalla quedaría blanca detrás de la hoja.
 * ⇒ acá: el degradado es la superficie; `fondo` es lo que va ENCIMA de
 * ella (la `Cabecera` en `presentacion="fondo"`), y **sólo eso** se apaga.
 *
 * ── EL MOVIMIENTO, y por qué pasa L-c ─────────────────────────────────
 * *«si al quitar la animación dice lo mismo, sobraba.»* Acá no dice lo
 * mismo: **sin el deslizamiento, la hoja y el fondo se leen como dos
 * bloques apilados; con él, se lee que uno está ENCIMA del otro y que el
 * de abajo sigue ahí.** El movimiento es la única forma de comunicar
 * profundidad en una superficie plana — no adorna el scroll, lo explica.
 *
 * **NO REBOTA, y es de la orden:** `bounces={false}` + `overScrollMode`.
 * *Una hoja que rebota al soltar se comporta como una tarjeta suelta; ésta
 * está apoyada, y lo apoyado no rebota.*
 *
 * ⚠️ **EL DESVANECIDO SE ACOPLA AL SCROLL, no a un `withTiming`.** Va por
 * `interpolate` sobre la posición: la opacidad es **una función de dónde
 * está la hoja**, no una animación que se dispara. *Una transición
 * temporal se desincroniza del dedo en cuanto alguien scrollea rápido, y
 * entonces el fondo se apaga cuando ya no lo tapa nada.*
 *
 * ⚠️ **`useReducedMotion`: la hoja SIGUE SUBIENDO** —eso es el scroll, no
 * una animación— y lo que se apaga es el **desvanecido** del fondo, que
 * pasa a ser instantáneo al llegar al tope. *Quitar el scroll dejaría la
 * pantalla inservible; quitar el fundido no le saca información a nadie.*
 */

import { type ReactNode } from 'react'
import { View, type ScrollViewProps } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PieFijo, usePieFijo, type MaterialDelPie } from './pie-fijo'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** Cuánto scroll hace falta para que el fondo termine de desvanecerse.
 *  **Es una distancia, no un tiempo**, porque el desvanecido se acopla al
 *  dedo (ver arriba). Sale del alto de la cabecera raíz: el fondo termina
 *  de apagarse justo cuando la hoja lo terminó de tapar. */
const RECORRIDO_DEL_FUNDIDO = 120

export interface HojaContenidoProps {
  /** Lo que se ve DETRÁS de la hoja — típicamente una `Cabecera` con
   *  `presentacion="fondo"`. **Es lo único que se desvanece**; el
   *  degradado lo pinta esta pieza y se queda. */
  fondo: ReactNode
  /** Los accesos que pisan la costura (`FilaAccionesCostura`). Van entre
   *  el fondo y la hoja, **montados por esta pieza y no por la pantalla**:
   *  su posición depende de dónde arranca la hoja, que es un dato de acá. */
  costura?: ReactNode
  /** Dónde arranca la hoja sin scroll. Si no se pasa, la hoja se apoya
   *  justo debajo del fondo — que es lo que «la altura que la cabecera
   *  pide» significa cuando nadie la mide. */
  arranque?: number
  children: ReactNode
  /** Para que la pantalla pueda pasar `refreshControl`, `onScroll` propio
   *  o `contentContainerStyle`. **No incluye `bounces`**: ésa la fija la
   *  pieza (ver arriba) y dejarla abierta permitiría el rebote que la
   *  orden prohíbe. */
  scroll?: Omit<ScrollViewProps, 'bounces' | 'overScrollMode' | 'onScroll'>
  /** 🔴 **EL PIE FIJO (S116-B, firma de la mesa).** Lo que se queda abajo
   *  mientras la hoja scrollea: el CTA de la pantalla, o la `OndaAcceso`.
   *
   *  **Reserva su propio lugar**: el scroll deja abajo el alto MEDIDO del
   *  pie, no un número tecleado — el mecanismo es el de `pie-fijo.ts(x)` y
   *  es el mismo que usa `PantallaConPie`, con sus tres curas adentro.
   *
   *  ⚠️ **Con este slot, una pantalla de hoja NO envuelve nada en
   *  `PantallaConPie`**: serían dos pies y dos reservas. Cuál se usa cuándo
   *  está escrito en el catálogo (§⓪). */
  pie?: ReactNode
  /** De qué está hecho el pie. `lienzo` (default) es el pie de controles;
   *  `sangrado` es una franja que llega al filo de la pantalla — la onda.
   *  *Cerrado a propósito: con un estilo libre cada pantalla volvería a
   *  decidir el material.* */
  materialDelPie?: MaterialDelPie
}

export function HojaContenido({ fondo, costura, arranque, children, scroll, pie, materialDelPie }: HojaContenidoProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { contenedor, medirContenedor, medirPie, altoPie, insetFaltante } = usePieFijo()
  const sinMovimiento = useReducedMotion()
  const y = useSharedValue(0)

  const alScrollear = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y
  })

  /* El fondo se apaga a medida que la hoja lo tapa. `clamp` para que el
     over-scroll hacia abajo no lo vuelva a encender más allá de 1. */
  const estiloFondo = useAnimatedStyle(() => ({
    opacity: sinMovimiento
      ? y.value > 0 ? 0 : 1
      : interpolate(y.value, [0, RECORRIDO_DEL_FUNDIDO], [1, 0], Extrapolation.CLAMP),
  }))

  return (
    <View ref={contenedor} onLayout={medirContenedor} style={{ flex: 1 }}>
      {/* ① LA SUPERFICIE. El degradado del tema, a pantalla completa.
          Memorial resuelve plano solo —`gradients.memorialPlano` lleva el
          mismo color en los dos stops— así que acá no hay rama por tema. */}
      <LinearGradient
        colors={theme.accent.gradient.colors as unknown as readonly [string, string, ...string[]]}
        locations={theme.accent.gradient.locations as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* ② EL CONTENIDO DEL FONDO — lo único que se desvanece.
          🔴 **`zIndex: 0` EXPLÍCITO (lote 13).** El founder vio *el wordmark
          del fondo a través de la hoja, bajo «Email»*. En Android el orden de
          pintado **no lo decide sólo el árbol**: una `elevation` de cualquier
          cosa montada acá adentro sube su capa por encima de sus hermanos, y
          entonces el fondo atraviesa una hoja que es opaca. *El síntoma se lee
          como transparencia y la causa es orden de pintado* — por eso la cura
          no es un color, son dos números. */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 }, estiloFondo]}>
        {fondo}
      </Animated.View>

      {/* ③ LA HOJA. Sube con el scroll y desliza sobre el fondo: no la
          movemos nosotros —eso duplicaría el scroll— la mueve su propio
          `paddingTop`, que es contenido del ScrollView. */}
      <Animated.ScrollView
        /* La otra mitad del par: la hoja va SIEMPRE por encima del fondo.
           *Sin esto, el orden depende de que nadie monte en el fondo algo con
           sombra — y eso es una condición que ningún gate mira.* */
        style={{ zIndex: 1 }}
        onScroll={alScrollear}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        {...scroll}
        /* La otra mitad de la cura de arriba. Va DESPUÉS del spread a
           propósito: el `contentContainerStyle` del consumidor se conserva
           —se compone, no se pisa— pero **el crecimiento no es negociable**,
           porque de él depende que no se vea el fondo por debajo. */
        contentContainerStyle={[{ flexGrow: 1 }, scroll?.contentContainerStyle]}
      >
        <View style={{ height: arranque }} />
        <View
          style={{
            /* 🔴 **LA HOJA CRECE HASTA EL PIE, SIEMPRE (lote 7).** El founder
               vio en 09 *«una franja de fondo entre la hoja y el pie»*: con
               contenido corto la hoja terminaba donde terminaba su contenido
               y el ciruela asomaba debajo.

               **La causa era `minHeight: 400` sin `flexGrow`:** un mínimo
               garantiza que no sea MÁS CHICA que 400 y **no dice nada sobre
               llegar abajo**. *Con contenido largo nadie lo notaba — el
               defecto sólo existe cuando sobra pantalla, que es justo la
               pantalla que nadie usa para probar.*

               ⚠️ **El `flexGrow` va con `flexGrow` en el `contentContainer`
               del scroll, no solo acá:** un hijo no puede crecer dentro de un
               contenedor que mide lo que su contenido. Son las dos mitades de
               la misma cura. */
            flexGrow: 1,
            minHeight: 400,
            /* 🔴 **LA HOJA ES OPACA, COLOR LIENZO, SIEMPRE** (orden del
               founder, lote 13). El LIENZO de la letra §2 (`#F8F2F6`) es el
               slot `bg.base` — la hoja es del color del lienzo, no blanca.
               ⚠️ **El color nunca fue el problema y por eso no alcanzaba
               mirarlo:** los tres temas traen `bg.base` sin alfa. Lo que
               dejaba pasar el fondo era el ORDEN DE PINTADO en Android, que
               se cura arriba con los dos `zIndex`. *Un fondo opaco tapado por
               un hermano que se pinta después sigue siendo opaco y se ve
               transparente igual.* */
            backgroundColor: theme.bg.base,
            borderTopLeftRadius: radius.cabeceraV5,
            borderTopRightRadius: radius.cabeceraV5,
            /* 🔴 **LA RESERVA DEL PIE — el alto MEDIDO, no una
               estimación.** Sin esto, el pie se pinta encima de la última
               fila y el contenido queda inalcanzable: es el defecto exacto
               que `PantallaConPie` nació para matar, y acá entraría por la
               puerta de al lado. */
            paddingBottom: insets.bottom + spacing[6] + altoPie,
          }}
        >
          {/* ④ LA COSTURA. Los accesos van acá adentro y desplazados
              hacia arriba: **la mitad superior pisa el ciruela y la
              inferior la hoja**, que es lo que la orden pide. Viven en el
              flujo de la hoja y no en absoluto, así que **suben con ella**
              — un absoluto se quedaría clavado y la costura se despegaría
              de su borde al primer scroll. */}
          {costura}
          {children}
        </View>
      </Animated.ScrollView>

      {/* ⑤ EL PIE. Fuera del scroll —se queda— y con `box-none`, así el
          gesto pasa al scroll por el aire entre sus hijos. */}
      {pie === undefined ? null : (
        <PieFijo material={materialDelPie} insetFaltante={insetFaltante} onLayout={medirPie}>
          {pie}
        </PieFijo>
      )}
    </View>
  )
}
