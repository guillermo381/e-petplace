/**
 * Encabezado — la estructura superior de pantalla (S43-B3.6).
 *
 * ═══════════════════════════════════════════════════════════════════
 * NADA SE ANIMA en el Encabezado — ni el título, ni colapso al
 * scroll. Si algún día se quiere colapso, es una decisión de motion
 * propia, no un default. (Única excepción: el resalte pressed del
 * chevron, que es feedback obligatorio — resalta, no escala.)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Variantes:
 *   navegacion → header compacto de pantallas internas. Título con
 *     centrado ÓPTICO: ambas zonas laterales reservan 44 SIEMPRE,
 *     así el título no baila entre pantallas con/sin atrás/acción.
 *   portada → el header de las raíces de tab, donde vive la VOZ
 *     HUMANA (saludo en DM Sans 300 2xl). Isotipo tinta = dosis baja
 *     (prestador); gradiente (el del SVG oficial de marca, via
 *     <Isotipo/>) = dosis alta (dueño). La portada respira.
 */

import { useState, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { Isotipo } from '../brand/Isotipo'

const ZONA_LATERAL = 44  // reservada SIEMPRE — centrado óptico del título

type Navegacion = {
  variante: 'navegacion'
  titulo: string
  /**
   * 🔴 EL TÍTULO SE APAGA, NO SE BORRA — S100b-B (el título duplicado de la
   * ficha, marcado por el founder en el gate).
   *
   * **El caso, medido:** en la ficha de producto el header dice *«Adulto
   * Cordero y Arroz»* (26.7 dp) **y el cuerpo lo repite** (34.1 dp) 800 px
   * más abajo. **Dos veces el mismo dato en la misma pantalla.**
   *
   * **Y cuál de los dos cede lo decide la letra, no el gusto:** `N19`
   * ordena la ficha ① foto ② **nombre + presentación** ③ precio… ⇒ **el
   * nombre en el CUERPO es obligatorio**. El que sobra es el del header.
   *
   * **`false` apaga el píxel y conserva el nombre**: el nodo sigue
   * anunciándose como `header` para el lector. *Mismo patrón que
   * `Campo.etiquetaVisible` y que `busqueda` en la portada — **se apaga el
   * píxel, jamás el nombre**.* Default `true`: el caso raro se declara, el
   * normal no se puede olvidar.
   *
   * ⚠️ **Lo que esto NO es: un header que se colapsa al scrollear.** Ese
   * patrón —el título aparece cuando el del cuerpo se va— es otra cosa y
   * **no está construido**. Apagarlo fijo cuesta el contexto cuando la
   * persona bajó mucho; se declara en vez de venderse como equivalente.
   */
  tituloVisible?: boolean
  accionDer?: ReactNode
  divisor?: boolean
  saludo?: never
  subtitulo?: never
  isotipo?: never
} & ({ atras: true; onAtras: () => void } | { atras?: false; onAtras?: never })

type Portada = {
  variante: 'portada'
  /** VOZ HUMANA — DM Sans 300 2xl. El lugar del registro humano en la estructura. */
  saludo: string
  subtitulo?: string
  isotipo?: 'tinta' | 'gradiente' | 'ninguno'
  accionDer?: ReactNode
  /**
   * 🔴 EL BUSCADOR EN LA FILA DEL ENCABEZADO — S100b-B (G-04 · H-202 de C).
   *
   * **El caso, medido por las dos varas y con acreedor:**
   * · nuestro encabezado ocupa **156.4 dp, NO colapsa al scrollear**, y
   *   lleva **una sola fila útil**: el nombre de la pantalla en la que ya
   *   estás. **Laika usa 149 dp para buscador Y dirección.** *Mismo
   *   presupuesto, distinto retorno.*
   * · C midió que **su buscador cuesta 76 dp para una caja de texto de 26**,
   *   apilado debajo, y que **en la referencia el buscador y el carrito
   *   viven en la MISMA fila del encabezado**, junto al logo.
   * · 🔴 y la deuda que lo vuelve urgente: **la primera tarjeta de la
   *   vitrina no entra entera por 3 dp.** El paso de la foto a 1:1 le sumó
   *   ~41 dp a la tarjeta y **se comió exactamente ese margen**. *El costo
   *   que declaré tenía contraparte, y es este slot.*
   *
   * **Con `busqueda` presente el encabezado deja de apilar** y pasa a
   * `[isotipo] [buscador] [acción]` en una sola fila.
   *
   * ⚠️ **Es un SLOT y no un `onBuscar`:** el campo lo monta la pantalla,
   * que es la que conoce su estado, su placeholder y su debounce. *Un
   * encabezado que además gestiona una búsqueda deja de ser un encabezado.*
   */
  busqueda?: ReactNode
  titulo?: never
  divisor?: never
} & ({ atras: true; onAtras: () => void } | { atras?: false; onAtras?: never })

export type EncabezadoProps = Navegacion | Portada

function ChevronAtras({ onAtras }: { onAtras: () => void }) {
  const { theme } = useTheme()
  const [presionado, setPresionado] = useState(false)
  return (
    <Pressable
      onPress={onAtras}
      onPressIn={() => setPresionado(true)}
      onPressOut={() => setPresionado(false)}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={(44 - ZONA_LATERAL) / 2 + 4}
    >
      <Animated.View
        style={{
          width: ZONA_LATERAL,
          height: ZONA_LATERAL,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          // regla de fila: el pressed resalta, no escala
          backgroundColor: presionado ? theme.bg.overlay : 'transparent',
          transitionProperty: 'backgroundColor',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
        }}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={theme.text.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </Pressable>
  )
}

export function Encabezado(props: EncabezadoProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  if (props.variante === 'navegacion') {
    return (
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: theme.bg.base,
          ...(props.divisor
            ? { borderBottomWidth: 1, borderBottomColor: theme.bg.border }
            : null),
        }}
      >
        <View
          style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing[2],
          }}
        >
          <View style={{ width: ZONA_LATERAL, alignItems: 'flex-start' }}>
            {props.atras ? <ChevronAtras onAtras={props.onAtras} /> : null}
          </View>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.md,
              // Apagado: el nodo sigue siendo `header` y sigue teniendo el
              // texto para el lector; lo único que se va es la tinta.
              color: props.tituloVisible === false ? 'transparent' : theme.text.primary,
            }}
          >
            {props.titulo}
          </Text>
          <View style={{ width: ZONA_LATERAL, alignItems: 'flex-end', justifyContent: 'center' }}>
            {props.accionDer ?? null}
          </View>
        </View>
      </View>
    )
  }

  // Default GRADIENTE OFICIAL en claro y dark, ambos lados (founder, B3.7):
  // el logo es identidad, no acento — queda fuera de la contabilidad de dosis
  // (sigue siendo UNO por pantalla). 'tinta' queda para contextos especiales.
  // En memorial degrada automáticamente (patrón Boton marca): la marca habla
  // bajito — y sobre bosque nocturno la tinta se traduce a blanco.
  //
  // S52-P1: LOCKUP — isotipo + voz son UNA composición horizontal (antes:
  // dos pisos con vacío muerto a la derecha del isotipo). La acción vive
  // en línea con la voz; la portada sigue respirando por padding, no por
  // huecos.
  const { saludo, subtitulo, isotipo = 'gradiente', accionDer, busqueda } = props
  const varianteIsotipo =
    theme.mode === 'memorial' ? 'blanco' : isotipo === 'tinta' && theme.mode === 'dark' ? 'blanco' : isotipo
  return (
    <View
      style={{
        /* 🔴 S99-B · LA PORTADA GANA LA VUELTA — y el defecto que cura es
           un ACOPLAMIENTO, no un registro que faltaba.
           Las dos variantes ataban **dos ejes que no tienen por qué ir
           juntos**: «¿lleva identidad?» y «¿se puede volver?». `portada`
           tenía isotipo y ninguna vuelta; `navegacion`, vuelta y ningún
           isotipo. **Una pantalla que es un MUNDO pero se entra desde otra
           —«Tu tienda», desde HOY— no era expresable**, y la salida barata
           habría sido que el app dibujara un techo a mano: la casa
           quedaría con dos techos que envejecen distinto.
           *C frenó bien y no lo dibujó. Esto es lo que faltaba.* */
        paddingTop: insets.top + (props.atras ? 0 : spacing[5]),
        paddingBottom: spacing[5],       // la portada respira, no comprime
        paddingHorizontal: spacing[4],
        backgroundColor: theme.bg.base,
      }}
    >
      {props.atras ? (
        /* La vuelta va EN SU PROPIA FILA, arriba del lockup — jamás en
           línea. En línea competiría con el isotipo por el borde
           izquierdo, y **la identidad es lo que tiene que presidir**.
           `marginLeft` negativo para que el chevron caiga en el MISMO
           punto de la pantalla que en `navegacion`: *la vuelta vive
           siempre en el mismo lugar; si se mueve por pantalla, el pulgar
           tiene que buscarla.* */
        <View style={{ marginLeft: -spacing[2], marginBottom: spacing[1] }}>
          <ChevronAtras onAtras={props.onAtras} />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {isotipo !== 'ninguno' && varianteIsotipo !== 'ninguno' ? (
          <Isotipo size={32} variant={varianteIsotipo} />
        ) : null}

        {busqueda === undefined ? null : (
          /* 🔴 EL TÍTULO DEJA DE GASTAR PÍXELES Y NO DEJA DE EXISTIR.
             El buscador toma la fila; el nombre de la pantalla sigue
             ANUNCIÁNDOSE al lector, en un nodo sin alto.

             **No es un atajo: es el patrón que la casa ya firmó** en
             `Campo.etiquetaVisible` — *se apaga el píxel, jamás el
             nombre*. Y acá tiene además su razón propia: **la barra de
             tabs ya dice en qué pantalla estás**, con su huella encendida.
             *Un rótulo que repite la tab cuesta 41.6 dp para decir lo que
             el pulgar acaba de elegir.* */
          <>
            <View
              accessibilityRole="header"
              accessibilityLabel={saludo}
              style={{ width: 0, height: 0 }}
            />
            <View style={{ flex: 1 }}>{busqueda}</View>
          </>
        )}

        {busqueda !== undefined ? null : (
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={{
              fontFamily: typography.family.sans.light,
              fontSize: typography.size['2xl'],
              lineHeight: typography.size['2xl'] * typography.leading.snug,
              color: theme.text.primary,
            }}
          >
            {saludo}
          </Text>
          {subtitulo ? (
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                color: theme.text.secondary,
              }}
            >
              {subtitulo}
            </Text>
          ) : null}
        </View>
        )}
        {accionDer ?? null}
      </View>
    </View>
  )
}
