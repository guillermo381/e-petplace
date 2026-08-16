/**
 * BarraTabs — la navegación raíz de ambos apps (S43-B3.7).
 * Wrapper visual del sistema para el tabBar custom de expo-router Tabs.
 *
 * ═══════════════════════════════════════════════════════════════════
 * EL GESTO: el subrayado accent.active (pill 3×18) bajo el icono activo
 * es EL elemento activo de la vista raíz — las pantallas bajo tabs no
 * deben usar otro accent.active compitiendo.
 *
 * El subrayado aparece/desaparece con OPACITY (fast) — NO se desliza
 * entre tabs: el slide pelea con los gestos de swipe y se rompe feo.
 * ═══════════════════════════════════════════════════════════════════
 *
 * INTEGRACIÓN CON EXPO-ROUTER (S44 la enchufa sin pensar):
 *
 *   import { Tabs } from 'expo-router'
 *   import { BarraTabs, type BarraTabsItem } from '@epetplace/ui'
 *
 *   const ITEMS: BarraTabsItem[] = [
 *     { key: 'index',  etiqueta: 'Hoy',    icono: ({ color }) => <IconoHoy color={color} /> },
 *     { key: 'agenda', etiqueta: 'Agenda', icono: ({ color }) => <IconoAgenda color={color} />, badge: 3 },
 *     { key: 'perfil', etiqueta: 'Perfil', icono: ({ color }) => <IconoPerfil color={color} /> },
 *   ]
 *
 *   export default function Layout() {
 *     return (
 *       <Tabs
 *         tabBar={({ state, navigation }) => (
 *           <BarraTabs
 *             items={ITEMS}
 *             activo={state.routes[state.index].name}
 *             onCambiar={(key) => navigation.navigate(key)}
 *           />
 *         )}
 *       >
 *         <Tabs.Screen name="index" />
 *         <Tabs.Screen name="agenda" />
 *         <Tabs.Screen name="perfil" />
 *       </Tabs>
 *     )
 *   }
 *
 *   (los `key` de items = nombres de ruta de expo-router)
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  cubicBezier,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { palette } from '../tokens/palette'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { Badge, useEtiquetaBadge } from './Badge'

const AnimatedPath = Animated.createAnimatedComponent(Path)

/** ☠️ EL LADO DE LA DESTACADA — LÁPIDA (S99-B, firma de mesa).
 *
 *  **ATENDER deja de estar destacada permanentemente. `destacada` es
 *  NO-OP: la prop se acepta y no pinta nada.**
 *
 *  **El argumento que la mató, para que nadie la reabra:** con L-251
 *  **ATENDER PUEDE NO EXISTIR** — la barra se compone por capacidad — y
 *  ***un tab que a veces no está no puede ser el centro de gravedad
 *  permanente***. La destacada nació cuando ATENDER era fija; dejó de
 *  serlo **en esta misma sesión**.
 *
 *  Y el defecto que producía, medido contra la barra nueva: con el disco
 *  del activo viajando, **una ATENDER destacada e inactiva dejaba DOS
 *  cosas pidiendo ser el centro** — importancia y ubicación peleando por
 *  el mismo píxel.
 *
 *  ⚠️ **No se borra del tipo:** C y D la pasan hoy y sacarla del tipo les
 *  rompe el typecheck para quitar algo que ya no hace nada. **Sin
 *  ratchet a propósito:** una prop no-op no crece en daño, y poner un
 *  instrumento a vigilar algo inofensivo es instrumento para nadie. Se
 *  retira al tocar cada pantalla.
 *
 *  ⚠️ Y su constante MURIÓ del todo: `DESTACADA_LADO = 44` no la lee
 *  nadie. Se borra en vez de dejarse — *una constante sin consumidor es
 *  la próxima que alguien usa creyendo que significa algo* (Ley 37). */

/** ── EL VALLE Y EL DISCO (S99-B · firma de mesa sobre la referencia) ──
 *  La barra deja de ser un rectángulo con un borde: **es UN SOLO VECTOR
 *  QUE SE DEFORMA.** Su borde superior hunde un valle bajo el tab
 *  activo, y sobre el valle flota un disco del mismo color.
 *
 *  🔴 **EL HUECO NO SE PINTA — NO SE PINTA NADA AHÍ.** Mi advertencia
 *  ③ decía que un hueco del color del fondo obliga a la pieza a CONOCER
 *  el fondo, y acá el fondo cambia por tema, por casa **y por pantalla**.
 *  La salida es que el hueco exista **por AUSENCIA de material**: el
 *  cuerpo y el disco son dos formas separadas y entre ellas no hay pintura
 *  — pasa lo que haya debajo, sea lo que sea.
 *  *Por eso la barra perdió su `backgroundColor`: si el `View` pinta, no
 *  hay hueco posible. El color vive en el vector, no en la caja.*
 *
 *  **La deformación es ASIMÉTRICA en el camino** (`estira`): el valle se
 *  ensancha hacia el lado del que viene, como una tela tirada. Es lo que
 *  hace que se lea como *un vector deformándose* y no como *un botón que
 *  salta*. */
/** El alto de la fila de tabs (el que ya tenía la barra). */
const ALTO_FILA = 56
const VALLE_RADIO = 36
/** ⏪ ERA 13. **El founder lo midió con el ojo y la aritmética le da la
 *  razón:** *«la parte cóncava no está tan pronunciada»*. El valle tiene
 *  que hundirse lo suficiente para ALOJAR al disco, no para insinuarlo. */
const VALLE_HONDO = 18
const DISCO_RADIO = 28
/** 🔴 ⏪ ERA 20 CONTRA UN RADIO DE 26 — y ahí estaba el defecto, medido:
 *  el disco iba de **-46 a +6** en coordenadas de la fila, o sea que
 *  **solo 6 px de 52 quedaban DENTRO de la barra (11 %)**. El founder lo
 *  describió exacto sin ver el número: *«el círculo queda prácticamente
 *  AFUERA del menú… pareciera que la bolita se sale totalmente, solo
 *  queda un poquito adentro. Debería estar MUY METIDO.»*
 *
 *  Con 10 contra 28, el disco va de **-38 a +18**: **18 px adentro en vez
 *  de 6, y el valle de 18 lo aloja de verdad.** *No era una preferencia
 *  de estilo: la geometría decía lo que él vio.* */
const DISCO_ALZA = 10
/** Dónde descansa el centro del ícono dentro de la fila (56 de alto,
 *  con su etiqueta debajo). Medido de la composición, no elegido. */
const REPOSO_ICONO = 18
/** Cuánto sube el ÍCONO para caer en el centro del disco. **Derivado, no
 *  elegido** — el disco vive a `-DISCO_ALZA` y el ícono en `REPOSO_ICONO`.
 *  *Si mañana el disco cambia de alza, esto lo sigue sin que nadie se
 *  acuerde: es la única forma de que dos capas distintas (SVG y fila) no
 *  se desalineen con el tiempo.* */
const SUBIDA_AL_DISCO = DISCO_ALZA + REPOSO_ICONO
/** El cuerpo se dibuja MÁS ANCHO que la pantalla y viaja por transform
 *  (ver la nota del viaje). Con un margen de un ancho a cada lado, ningún
 *  desplazamiento posible descubre un borde. */
const MARGEN_VIAJE = 1

/** El path del cuerpo con su valle. Worklet: lo corre el hilo de UI en
 *  cada frame del viaje. */
/** 🔴 EL VIAJE Y EL ESTIRÓN SE SEPARARON, Y NO ES REFACTOR (S99-B, tras
 *  el 3er hallazgo del founder: *«NO HACE TRANSICIÓN, SALTA»*).
 *
 *  **Lo medido primero, porque el diagnóstico no se adivina:** el defecto
 *  visible NO estaba solo acá — el disco iba de -46 a +6, o sea **11 %
 *  adentro**, y un objeto que vive casi afuera del menú *parece* saltar
 *  aunque interpole. Esa mitad se curó en la geometría.
 *
 *  **La otra mitad es de TRANSPORTE, y no la puedo verificar desde acá:**
 *  si la posición viaja animando la cadena `d` de un `Path`, depende de
 *  que `react-native-svg` propague esa prop por el hilo de UI en cada
 *  frame — y **eso solo se comprueba en aparato**. ⇒ **la posición deja
 *  de depender de eso.**
 *
 *  · **EL VIAJE es un `transform` sobre el grupo entero** — el mecanismo
 *    más sólido que hay, el mismo que ya mueve todo lo demás de la casa.
 *  · **EL ESTIRÓN sigue animando `d`** — y si esa prop no interpolara en
 *    algún dispositivo, **se pierde la deformación, jamás el
 *    movimiento**.
 *
 *  *Una animación de dos capas donde la crítica cuelga de la frágil no es
 *  una animación arriesgada: es una que ya falló y todavía no lo sabés.*
 *
 *  El cuerpo se dibuja en coordenadas LOCALES —el valle en `x = 0`— y se
 *  extiende un ancho a cada lado, para que ningún desplazamiento
 *  descubra un borde. */
function pathBarra(ancho: number, alto: number, estira: number) {
  'worklet'
  const r = VALLE_RADIO * (1 + Math.min(Math.abs(estira), 1) * 0.35)
  // el sesgo: el valle se abre hacia el lado del que viene
  const sesgo = Math.max(-1, Math.min(1, estira)) * VALLE_RADIO * 0.45
  const izq = -r + sesgo
  const der = r + sesgo
  const i0 = -ancho * MARGEN_VIAJE
  const i1 = ancho * (1 + MARGEN_VIAJE)
  return [
    `M${i0} 0`,
    `H${izq}`,
    `C${izq + r * 0.45} 0 ${-r * 0.5} ${VALLE_HONDO} 0 ${VALLE_HONDO}`,
    `C${r * 0.5} ${VALLE_HONDO} ${der - r * 0.45} 0 ${der} 0`,
    `H${i1}`,
    `V${alto}`,
    `H${i0}`,
    `Z`,
  ].join(' ')
}

/** EL OVERSHOOT DE LA HUELLA — **FIRMADO** (mesa 14-ago-2026). Envuelve
 *  el ícono y le da un rebote corto cuando la tab pasa a activa: la
 *  huella no solo aparece, LLEGA.
 *
 *  ⏪ NACIÓ COMO PROP DE GATE APAGADA (`overshootHuella`) porque
 *  `DIRECCION_ARTE` §5.4 lo listaba como CANDIDATA SIN FIRMA mientras el
 *  Norte lo daba por vocabulario cerrado — dos letras que se
 *  contradicen. **La mesa firmó y la prop MURIÓ en el mismo acto**: el
 *  valor vive en la pieza y el consumidor no re-decide (Ley 37, y era la
 *  condición de muerte que la propia prop tenía escrita).
 *
 *  🔴 SU EXCEPCIÓN, que sobrevive a la firma y por eso queda escrita:
 *  N10 declara «UN bezier (.32,.72,0,1)» y en la misma frase pide
 *  overshoot. **Un overshoot con esa curva no hace overshoot** — termina
 *  en 1 y no lo pasa. Usa `motion.easing.spring` [.34, 1.56, .64, 1],
 *  que existe desde v3.1 para «confirmaciones táctiles»: no se inventó
 *  una curva, se usó la que la casa ya tenía. *El defecto estaba en el
 *  Norte, no en la pieza, y la mesa lo adoptó como ley mejor.*
 *
 *  Memorial y reduce-motion quedan QUIETOS por el mismo par que usan
 *  `PuertaDeOficio` y `Destape` — en memorial nada rebota (Ley 8), y esa
 *  regla no la puede saltear una candidata. */
function HuellaDeTab({ activa, children }: { activa: boolean; children: ReactNode }) {
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const quieto = theme.mode === 'memorial' || reduceMotion
  const v = useSharedValue(activa ? 1 : 0)

  useEffect(() => {
    if (quieto) {
      v.value = activa ? 1 : 0
      return
    }
    v.value = withTiming(activa ? 1 : 0, {
      duration: motion.duration.overshootTab,
      // La curva del rebote — la de la casa termina en 1 y no puede
      // hacer overshoot (el choque declarado en la prop).
      easing: Easing.bezier(...motion.easing.spring.bezier),
    })
  }, [activa, quieto])

  const estilo = useAnimatedStyle(() => ({
    transform: [{ scale: quieto ? 1 : 1 + v.value * 0.06 }],
  }))

  return <Animated.View style={estilo}>{children}</Animated.View>
}

export type BarraTabsItem = {
  /** = nombre de ruta de expo-router. */
  key: string
  etiqueta: string
  /** Icono outline — recibe color del estado y `activa` (S53 §2.6:
   *  en el lenguaje b′ la tab activa se marca porque su huella APARECE). */
  icono: (estado: { color: string; activa: boolean; colorHuella: string }) => ReactNode
  /** Contador entero — "3 pendientes" del prestador. */
  badge?: number
  /** S97+-B · EL DESTINO CENTRAL (firma de arquitectura, mesa 13-ago):
   *  Mostrador sube de chip a TAB, y la tab de atender es el destino
   *  destacado de la barra del prestador.
   *
   *  LA PIEZA NO ELIGE CUÁL: la declara quien la monta, igual que
   *  `badge`. La composición por capacidad —titular con local ve cuatro,
   *  recepción tres, profesional puro dos, vendedor puro tres— es del
   *  app, que es el único que sabe qué puede cada quien. Meter esa
   *  decisión acá sería que `packages/ui` leyera roles.
   *
   *  SU FORMA, y por qué NO es un color: la destacada gana SUPERFICIE y
   *  un paso de tamaño, jamás un acento propio. N5 manda un acento por
   *  pantalla y en esta barra ya está tomado —la huella de la tab activa
   *  ES `accent.active` desde §2.6—, así que pintar la central de color
   *  pondría dos acentos peleando, y el que perdería es el que dice
   *  DÓNDE ESTOY. *Destacar no es competir con el estado: es pesar más
   *  en reposo.* */
  destacada?: boolean
}

export function BarraTabs({
  items,
  activo,
  onCambiar,
  estadoPorHuella = false,
  acento,
}: {
  /** 2 a 5 tabs.
   *
   *  ⏪ S97+-B — DECÍA «3 a 5» y la composición por capacidad la dejó
   *  falsa: el **profesional puro** ve DOS (Hoy · Cuenta). No es un caso
   *  hipotético — es uno de los cuatro perfiles de la firma del 13-ago.
   *  Se corrige acá, en el contrato, y no solo en la lámina: un rango
   *  que excluye un perfil vivo es la clase de letra que alguien cita
   *  para «arreglar» una barra que está bien. */
  items: BarraTabsItem[]
  activo: string
  onCambiar: (key: string) => void
  /** S53 (DIRECCION_ARTE §2.6): con el set b′ la HUELLA es el sistema
   *  de estado — aparece en la tab activa y el pill NO se renderiza
   *  (sin recuadros, sin pills). La huella activa hereda el rol de
   *  accent.active: sigue siendo EL elemento activo de la vista. */
  estadoPorHuella?: boolean
  /** ☠️ `huellaEnDisco` MURIÓ CON SU CONDICIÓN DE MUERTE CUMPLIDA
   *  (S99-B). Nació como prop de gate con las DOS ramas construidas
   *  porque el founder las había firmado por adelantado; el veredicto
   *  llegó y fue **SIN HUELLA, definitivamente — gana el dinamismo**.
   *
   *  ⇒ la rama ganadora se queda en la pieza y la prop se retira, que era
   *  exactamente lo que su ficha decía que iba a pasar (precedente
   *  `overshootHuella`). *Una prop de gate que sobrevive a su gate es una
   *  perilla que nadie firmó.*
   *
   *  **Y la huella no muere de la casa: muere de ACÁ.** Sigue siendo la
   *  marca donde significa; en esta barra el marcador es el disco, y dos
   *  marcadores del mismo estado no conviven. */
  /** PROP DE GATE — override del acento de la tab activa. Default:
   *  `accent.active`, que desde S83-B13 es SLOT y ya resuelve por casa
   *  (pink el cliente · el verde del oficio en sus dos registros).
   *
   *  SU PRIMER GATE YA SE FIRMÓ Y LA PROP SOBREVIVIÓ AL CAMBIO DE
   *  PREGUNTA, así que su letra se corrige en vez de dejarla mintiendo:
   *  nació (B11) para arbitrar magenta-vs-teal, y el founder firmó el
   *  verde en dispositivo. Lo que queda abierto es CUÁL verde, y para eso
   *  sigue haciendo falta montar la BARRA REAL con los tres candidatos
   *  (tealDark · puro · el par) uno al lado del otro — cosa que el slot,
   *  por definición, no puede hacer: resuelve UNO por tema.
   *
   *  ☠️ MUERTE: con la firma del REGISTRO. Gane el que gane, el valor
   *  vive en el slot y esta prop se borra en ese mismo acto — la API de
   *  una lámina no sobrevive a su lámina (Ley 37). */
  acento?: string
}) {
  const etiquetaBadge = useEtiquetaBadge()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  /** LA INVARIANTE DE LA BARRA: **una sola destacada**. «Destino
   *  central» en plural no significa nada — dos tabs pesando igual es
   *  ninguna pesando.
   *
   *  Por qué un aviso de DEV y no un rebote: la barra es la navegación
   *  raíz, y una barra que no monta deja la app sin piso. Un warning en
   *  desarrollo llega a quien la compone, en el momento en que la
   *  compone; un throw en producción castiga al usuario por un error de
   *  quien la montó. *(Si algún día `destacada` pasa a ser prop de la
   *  BARRA en vez del ítem, este estado se vuelve inexpresable y este
   *  guard muere — que sería mejor. Hoy no se hace porque el consumidor
   *  arma la lista con spreads condicionales por capacidad, y ahí la
   *  marca viaja NATURALMENTE con el ítem que puede o no existir.)* */
  if (__DEV__) {
    const destacadas = items.filter((i) => i.destacada === true)
    if (destacadas.length > 1) {
      console.warn(
        `[BarraTabs] ${destacadas.length} tabs marcadas como \`destacada\` (${destacadas
          .map((d) => d.key)
          .join(', ')}). El destino central es UNO: dos pesando igual es ninguna pesando. Se destacan todas — la pieza no elige por vos.`,
      )
    }
  }
  const accentActive = acento ?? ('active' in theme.accent ? theme.accent.active : theme.accent.primary)

  /** El ancho se MIDE (onLayout): el valle viaja al centro del tab
   *  activo, y con la barra compuesta por CAPACIDAD (L-251) la cantidad
   *  de destinos es variable. **Nada se calcula contra «4 tabs»** — ésa
   *  era la objeción ③, y se resuelve derivando en vez de hardcodear. */
  /** ☠️ `estadoPorHuella` QUEDA NO-OP (S99-B). Nació para decir «el pill
   *  muere, la huella ES el estado» — y **con el disco ya no hay pill que
   *  matar ni subrayado que condicionar**: el marcador es uno solo y no
   *  es opcional. Se acepta para no romper a C y a D; se retira al tocar
   *  cada layout. */
  void estadoPorHuella

  /** 🔴 EL COLOR DEL TECHO — firma del founder: *«el círculo que marca el
   *  seleccionado debemos ponerlo en el COLOR OSCURO, el que en este
   *  momento está en el header»*. La barra deja de ser del color del
   *  fondo y pasa a ser **la misma superficie oscura del techo**, que es
   *  lo que la vuelve una pieza de la casa y no un panel neutro.
   *
   *  Sale del SLOT, jamás de un hex: `bg.tinta` es el mismo token con el
   *  que `TechoOficio` pinta su muro, así que **cambia con la casa sin
   *  que esta pieza sepa en cuál está**. */
  const colorTecho = theme.bg.tinta

  const [ancho, setAncho] = useState(0)
  const reduceMotionBarra = useReducedMotion()
  const quieto = theme.mode === 'memorial' || reduceMotionBarra
  const cx = useSharedValue(0)
  const estira = useSharedValue(0)

  const indiceActivo = Math.max(0, items.findIndex((i) => i.key === activo))
  const anchoTab = ancho / Math.max(1, items.length)
  const cxDestino = anchoTab * (indiceActivo + 0.5)
  const altoTotal = ALTO_FILA + insets.bottom

  useEffect(() => {
    if (ancho === 0) return
    if (quieto) {
      cx.value = cxDestino
      estira.value = 0
      return
    }
    // el ESTIRÓN: sale de la distancia y del SENTIDO del viaje, y vuelve
    // a 0 al llegar. Es lo que deforma el valle de un lado y no del otro.
    const dx = cxDestino - cx.value
    estira.value = withTiming(Math.max(-1, Math.min(1, dx / (anchoTab * 1.5))), {
      duration: motion.duration.fast,
    })
    cx.value = withTiming(
      cxDestino,
      { duration: motion.duration.estandar, easing: Easing.bezier(...motion.marca.aperturaBezier) },
      () => {
        estira.value = withTiming(0, { duration: motion.duration.fast })
      },
    )
  }, [cxDestino, ancho, quieto, anchoTab])

  /** El grupo VIAJA (transform) · el path solo se DEFORMA. Ver la nota
   *  de `pathBarra`: la posición no cuelga del mecanismo frágil. */
  const estiloViaje = useAnimatedStyle(() => ({
    transform: [{ translateX: cx.value }],
  }))
  const propsCuerpo = useAnimatedProps(() => ({
    d: pathBarra(ancho, altoTotal, estira.value),
  }))

  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        /* ⛔ SIN `backgroundColor`, y es LA condición del hueco: si la
           caja pinta, no hay ausencia posible y el hueco tendría que
           pintarse del color del fondo — justo lo que la advertencia ③
           declaró imposible en esta casa. El color vive en el vector. */
        paddingBottom: insets.bottom,
      }}
    >
      {ancho > 0 ? (
        /* EL LIENZO NO RECORTA: el cuerpo se dibuja más ancho que la
           pantalla y viaja, así que el SVG tiene que dejarlo salir por
           los dos lados sin cortar el valle en el camino. */
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              top: -(DISCO_ALZA + DISCO_RADIO),
              width: ancho,
              height: altoTotal + DISCO_ALZA + DISCO_RADIO,
            },
            estiloViaje,
          ]}
        >
          <Svg
            width={ancho * (1 + MARGEN_VIAJE * 2)}
            height={altoTotal + DISCO_ALZA + DISCO_RADIO}
            style={{ position: 'absolute', left: -ancho * MARGEN_VIAJE }}
          >
            {/* Coordenadas LOCALES: el valle vive en x = 0 del grupo, y
                el grupo es el que viaja. Por eso el `translateX` del SVG
                compensa el margen: el 0 local queda en el 0 de la fila. */}
            <AnimatedPath
              animatedProps={propsCuerpo}
              fill={colorTecho}
              translateX={ancho * MARGEN_VIAJE}
              translateY={DISCO_ALZA + DISCO_RADIO}
            />
            {/* EL DISCO — mismo color que el cuerpo. Entre los dos no se
                pinta nada: ESE es el hueco. Va quieto en su x local: lo
                mueve el grupo, igual que al valle, y por eso **no pueden
                desincronizarse** (era el defecto: dos cosas viajando por
                mecanismos distintos). */}
            <Circle
              cx={ancho * MARGEN_VIAJE}
              cy={DISCO_RADIO}
              r={DISCO_RADIO}
              fill={colorTecho}
            />
          </Svg>
        </Animated.View>
      ) : null}
      {items.map((item) => {
        const esActivo = item.key === activo
        /* 🔴 SOBRE EL TECHO OSCURO EL TEXTO ES PAPEL — §15b.2, la misma
           regla que ya rige en `TechoOficio` y en `Boton superficie="muro"`.
           Con la barra en `bg.tinta`, `text.primary` sería tinta sobre
           tinta: invisible. El activo va PLENO y el resto atenuado — la
           jerarquía la da la opacidad, no un segundo color. */
        const color = esActivo ? palette.light0 : palette.papelAtenuado
        // §2.6+§2.8: la huella activa hereda accent.active; memorial
        // degrada a tinta secundaria (jamás color en memorial).
        const colorHuella = theme.mode === 'memorial' ? theme.text.secondary : accentActive
        return (
          <Pressable
            key={item.key}
            onPress={() => onCambiar(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: esActivo }}
            aria-selected={esActivo}
            accessibilityLabel={etiquetaBadge(item.etiqueta, item.badge ?? 0)}
            style={{
              flex: 1,
              minHeight: Math.max(56, 44),
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[0.5],
            }}
          >
            {/* S88-B: la anatomía del badge SUBIÓ a pieza (`Badge`) al ganar
                su segundo consumidor (la campana) — la barra pasa a
                consumirla: misma geometría S43, misma pill, y la voz del
                label ahora vive en el riel (antes: hardcodeada acá). */}
            <Animated.View
              style={{
                /* EL ÍCONO ACTIVO SUBE AL DISCO. El disco es del vector
                   (SVG) y el ícono es de la fila: lo que los une es este
                   traslado, derivado de las MISMAS constantes — si el
                   disco cambia de alza, el ícono lo sigue solo. */
                transform: [{ translateY: esActivo ? -SUBIDA_AL_DISCO : 0 }],
                transitionProperty: 'transform',
                transitionDuration: motion.duration.estandar,
                transitionTimingFunction: cubicBezier(...motion.marca.aperturaBezier),
              }}
            >
              <HuellaDeTab activa={esActivo}>
                {/* ☠️ La rama de `destacada` MURIÓ acá (ver su lápida
                    arriba): ya no hay superficie propia. El disco del
                    activo es el ÚNICO énfasis de la barra. */}
                <Badge n={item.badge ?? 0}>
                  {item.icono({
                    color,
                    /* LAS DOS RAMAS DE LA FIRMA (§2.6 enmendada): con
                       huella, la huella se MUDA adentro del disco; sin
                       ella, el disco queda como marcador único. La
                       condicional del founder está firmada por
                       adelantado, así que las dos se construyen y el
                       gate ELIGE. */
                    /* SIN HUELLA — firma del founder. El disco marca el
                       activo; la huella acá sería el segundo marcador. */
                    activa: false,
                    colorHuella,
                  })}
                </Badge>
              </HuellaDeTab>
            </Animated.View>
            {/* ☠️ EL SUBRAYADO MURIÓ (S99-B). Era el marcador del activo
                cuando no había disco; con el disco viajando serían DOS
                marcadores del mismo estado — exactamente lo que la firma
                de §2.6 vino a resolver. Un marcador, un significado. */}
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.xs,
                color,
              }}
            >
              {item.etiqueta}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
