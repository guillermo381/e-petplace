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

import { useState, type ReactNode, type RefObject } from 'react'
import { View, type ScrollView, type ScrollViewProps } from 'react-native'
import Animated, {
  type AnimatedRef,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
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
  /** 🔴 **EL REF DEL SCROLL — pedido de C (S116-C lote 3b), y nace de una
   *  PÉRDIDA SILENCIOSA, no de un gusto.**
   *
   *  Al mudar las pantallas a esta pieza, **seis tenían un `ref` en su
   *  `ScrollView`** para llevar el ojo a un lugar: la ficha rechazada del
   *  carnet, el campo que faltó en un checkout, la sección que el aviso
   *  nombra. Ese `ref` no entra por `scroll` —`ref` no es una prop de
   *  `ScrollViewProps`, así que el tipo lo rechaza— y sin esta puerta
   *  **el `scrollTo` deja de hacer nada sin que nada falle**: el botón
   *  responde, el estado cambia, y la pantalla no se mueve.
   *
   *  ⚠️ **Es un pase, no una capacidad nueva**: va derecho al
   *  `Animated.ScrollView` de adentro. La pieza sigue siendo la dueña del
   *  scroll —`bounces`, `overScrollMode` y `onScroll` siguen cerrados,
   *  porque de ellos depende el fundido del fondo—. */
  scrollRef?: AnimatedRef<Animated.ScrollView> | RefObject<ScrollView | null>
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

export function HojaContenido({ fondo, costura, arranque, children, scroll, scrollRef, pie, materialDelPie }: HojaContenidoProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { contenedor, medirContenedor, medirPie, altoPie, insetFaltante } = usePieFijo()
  const sinMovimiento = useReducedMotion()
  const y = useSharedValue(0)

  const alScrollear = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y
  })

  /* 🔴 **LO QUE NO SE VE, NO SE TOCA (`D-1118`).** El fondo vive DESPUÉS de la
     hoja para recibir toques (cura de C, `D-1113`), así que cuando se
     desvanece **sus hijos siguen siendo tocables, invisibles, por encima de la
     hoja**. *Un botón que no se ve y que igual se activa es peor que uno que
     no responde: el primero hace algo que nadie pidió.* Opacidad y toque se
     mueven juntos. */
  const [fondoALaVista, setFondoALaVista] = useState(true)
  useAnimatedReaction(
    () => y.value < RECORRIDO_DEL_FUNDIDO,
    (ahora, antes) => {
      if (ahora !== antes) runOnJS(setFondoALaVista)(ahora)
    },
  )

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

      {/* ☠️ **`D-1118` CERRADA — MURIÓ EL PAR DE `zIndex`, Y CON ÉL LA IDEA DE
          QUE ESTO SE ARREGLABA ELIGIENDO QUIÉN VA ARRIBA.**

          Las dos mitades viven en LA MISMA CAPA: la hoja tiene que **tapar** al
          fondo y el fondo tiene que **recibir el toque**. *Quien esté arriba
          gana las dos a la vez* — por eso mi `zIndex: 1` curó el wordmark y
          **mató las flechas de volver de 03, 04 y 05** (medido por C en el
          aparato: el toque no llega, y el «atrás» de Android sí funciona, o sea
          que la navegación estaba sana), y sacarlo las revive y devuelve el
          wordmark.

          ⚠️ **Y el volcado de accesibilidad decía lo contrario**, que es la
          parte que hay que recordar: mostraba la flecha como ÚLTIMO nodo —o
          sea arriba— **y el toque igual no le llegaba**. *En Android el orden
          de despacho lo decide la capa, no el árbol que reporta el lector: un
          volcado correcto no prueba que ese nodo reciba el toque.*

          ⇒ **La cura no ordena capas: quita el solape.** Está abajo, en el
          `height: arranque` del bloque del fondo. */}

      {/* ③ LA HOJA. Sube con el scroll y desliza sobre el fondo: no la
          movemos nosotros —eso duplicaría el scroll— la mueve su propio
          `paddingTop`, que es contenido del ScrollView. */}
      <Animated.ScrollView
        ref={scrollRef as never}
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
               dejaba pasar el fondo era que **el fondo se dibuja DESPUÉS**
               (necesita estar arriba para recibir toques) **y se extendía por
               debajo de la hoja**. *Un fondo opaco tapado por un hermano que
               se pinta después sigue siendo opaco y se ve transparente igual.*
               ⇒ se cura **recortando el fondo a su zona** (`D-1118`), no con
               capas: ver el bloque del fondo. */
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

      {/* ② EL CONTENIDO DEL FONDO — lo único que se desvanece.
          ⚠️ **SE DIBUJA DESPUÉS DE LA HOJA A PROPÓSITO. Ver el bloque 🔴 de
          abajo: antes iba antes y NADA de lo que vive acá se podía tocar.** */}
      <Animated.View
        /* 🔴 **S116-C lote 7 · `box-none` — LA CURA DE LAS FLECHAS DE VOLVER
         * QUE NO VOLVÍAN.**
         *
         * ⏪ Esta capa se montaba **ANTES** de la hoja (era el bloque ②, encima
         * del degradado y debajo del `ScrollView`). Como hermana anterior,
         * **el `ScrollView` la tapaba entera**: el `fondo` se veía —está en
         * absoluto, arriba— pero **ningún toque suyo llegaba nunca**, porque el
         * scroll se queda con todos los que caen sobre su marco, y su marco es
         * la pantalla completa.
         *
         * **Medido en el emulador antes de tocar** (03 · `login.tsx`): la
         * flecha se toca en (108, 212) y no pasa nada; el volcado de
         * `uiautomator` sobre ese punto muestra, EN ORDEN, el nodo de la flecha
         * `View [0,136][221,357]` y **después** `ScrollView [0,0][1080,2400]`.
         * *La flecha no estaba rota ni desconectada: estaba debajo.*
         *
         * ⚠️ **Alcanza a TODA pantalla que ponga algo tocable en `fondo`**, no
         * a dos: hoy son 03 y 05 porque son las que tienen `onVolver`, pero la
         * siguiente que ponga un botón ahí habría heredado el mismo silencio.
         * *Un defecto que se arregla pantalla por pantalla vuelve con la
         * próxima pantalla.*
         *
         * **`box-none` y no `box-only`/`auto`:** esta capa **no debe** comerse
         * el gesto del scroll —el diseño es que la hoja suba arrastrando desde
         * cualquier lado, incluido el aire de la cabecera—; lo único que tiene
         * que capturar son sus hijos tocables. Es **exactamente lo que el pie
         * fijo ya hacía** (bloque ⑤, *«con `box-none`, así el gesto pasa al
         * scroll por el aire entre sus hijos»*): acá no se inventa una técnica,
         * se aplica la que esta misma pieza ya declaró.
         *
         * **Y el orden visual no cambia en la práctica**, que es la razón por la
         * que la mudanza es barata: `estiloFondo` lleva este contenido a opacidad
         * 0 justo en el recorrido en que la hoja llega a taparlo —`RECORRIDO`
         * sale del alto de la cabecera— así que la ventana en la que la hoja
         * pasaría «por debajo» es la misma en la que esto ya se desvaneció.
         *
         * ⚠️ **CRUCE DE TERRITORIO DECLARADO:** el archivo es de `packages/ui`
         * (B) y lo toca C. Se toca acá porque **el defecto es de la pieza y no
         * del montaje** —desde el consumidor no hay forma de subir la flecha sin
         * duplicar la cabecera— y porque bloquea dos pantallas de entrada en
         * 🔴. Va pedido con su medición en
         * `docs/loop/buzon/S116-C-para-B-el-fondo-no-se-podia-tocar.md`. */
        /* 🔴 **`D-1118` · EL TOQUE SE APAGA CON LA OPACIDAD.** Con el fondo
         * desvanecido, `box-none` seguiría entregando sus hijos: la flecha
         * invisible se comería el toque de la hoja que está abajo. */
        pointerEvents={fondoALaVista ? 'box-none' : 'none'}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            /* 🔴 **`D-1118` · EL RECORTE ES LA CURA DEL PINTADO, Y REEMPLAZA AL
             * `zIndex` QUE MATÓ LAS FLECHAS.**
             *
             * El problema tenía dos mitades que viven en la MISMA capa: la hoja
             * tiene que TAPAR al fondo, y el fondo tiene que RECIBIR el toque.
             * *Quien esté arriba gana las dos a la vez* — por eso el `zIndex: 1`
             * de la hoja curó el wordmark y mató las flechas, y sacarlo las
             * revive y devuelve el wordmark. **No se resuelve eligiendo quién va
             * arriba: se resuelve haciendo que no se superpongan.**
             *
             * La hoja empieza en `arranque`. **Si el fondo no se dibuja más allá
             * de ahí, no hay solape que ordenar** — y el píxel resultante es
             * IDÉNTICO al de estar debajo, porque lo que se recorta es
             * exactamente lo que la hoja tapaba.
             *
             * ⚠️ **Y explica por qué el defecto no necesitaba teclado**: el
             * solape era permanente (fondo `0..alto de su contenido` contra hoja
             * `arranque..`); con el teclado se NOTABA porque el campo subía a esa
             * franja. *Curar «el caso del teclado» habría dejado vivo el resto.*
             *
             * ⚠️ Sin `arranque` el fondo no tiene zona propia y no se dibuja —
             * que es lo correcto: la hoja arranca arriba y lo tapaba entero. */
            height: arranque,
            overflow: 'hidden',
          },
          estiloFondo,
        ]}
      >
        {fondo}
      </Animated.View>

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
